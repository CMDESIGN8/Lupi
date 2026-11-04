import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
import { apply, newGame, type Action, type Seat, type TrucoState } from "../utils/trucoEngine";

export type TrucoPvpStatus = "waiting" | "playing" | "finished" | "abandoned";

export type TrucoPvpState = {
  id: string;
  status: TrucoPvpStatus;
  version: number;
  seat: "host" | "guest";   // "host" = asiento 0, "guest" = asiento 1
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  matchState: Partial<TrucoState> | null;
  rivalReady: boolean;
  mineReady: boolean;
  updatedAt: string;
};

/** PvP de Truco sobre Supabase.
 *  Arquitectura: el motor TypeScript corre en ambos clientes.
 *  Cada jugador envía su acción con truco_play. El host aplica el motor
 *  y sube el estado resultante con truco_commit. El guest recibe el estado
 *  por polling + broadcast wake. */
export function useTrucoPvp(challenge: Challenge) {
  const [pvpState, setPvpState]   = useState<TrucoPvpState | null>(null);
  const [gameState, setGameState] = useState<TrucoState | null>(null);
  const [error, setError]         = useState("");
  const [busy, setBusy]           = useState(false);

  const current   = useRef<TrucoPvpState | null>(null);
  const game      = useRef<TrucoState | null>(null);
  const lock      = useRef(false);
  const actionLock = useRef(false);
  const actionRevision = useRef(0);
  const generation = useRef(0);
  const refreshSoon = useRef<(() => void) | null>(null);
  const changedChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isHost = challenge.fromId === challenge.toId
    ? true
    : (pvpState?.seat ?? (challenge.fromId === challenge.toId ? "host" : "guest")) === "host";

  // ── polling + broadcast wake ──────────────────────────────────────────────
  useEffect(() => {
    const token = ++generation.current;
    let disposed = false, timer: ReturnType<typeof setTimeout>;
    let refreshPending = false, failures = 0;
    lock.current = false; actionLock.current = false; actionRevision.current++;
    current.current = null; game.current = null;
    setPvpState(null); setGameState(null); setError(""); setBusy(false);

    const schedule = (ms: number) => { clearTimeout(timer); timer = setTimeout(() => void poll(), ms); };

    const wake = () => {
      if (disposed || (current.current && !["waiting","playing"].includes(current.current.status))) return;
      if (lock.current || actionLock.current) { refreshPending = true; return; }
      schedule(100);
    };
    refreshSoon.current = wake;

    const applyServerState = (s: TrucoPvpState) => {
      current.current = s;
      setPvpState(s);
      // Reconstruir el gameState local desde matchState del servidor
      if (s.matchState && Object.keys(s.matchState).length > 0) {
        const reconstructed = s.matchState as TrucoState;
        game.current = reconstructed;
        setGameState(reconstructed);
      } else if (!game.current && s.status === "playing" && s.seat === "host") {
        // Primera mano: el host inicializa
        const rng = Math.random;
        const initial = newGame(rng, 0);
        game.current = initial;
        setGameState(initial);
      }
    };

    const poll = async () => {
      if (disposed) return;
      if (lock.current || actionLock.current) { refreshPending = true; return; }
      lock.current = true;
      const revision = actionRevision.current;
      try {
        const isFirst = !current.current;
        let { data, error: e, status: rpcStatus } = await supabase.rpc(
          isFirst ? "truco_open" : "truco_state",
          isFirst
            ? { p_id: challenge.id, p_host: challenge.fromId, p_guest: challenge.toId }
            : { p_id: challenge.id }
        );
        if (disposed || revision !== actionRevision.current) return;
        if (e && isFirst && (rpcStatus === 409 || e.code === "23505")) {
          const existing = await supabase.rpc("truco_state", {p_id: challenge.id});
          if (disposed || revision !== actionRevision.current) return;
          data = existing.data; e = existing.error;
        }
        if (e) throw new Error(`${e.message}${e.code ? ` [${e.code}]` : ""}${e.details ? ` · ${e.details}` : ""}`);
        failures = 0;
        const server = data as TrucoPvpState & {hostAction?: Action; guestAction?: Action};
        applyServerState(server);
        if (server.seat === "host" && server.status === "playing" && game.current && (!server.matchState || Object.keys(server.matchState).length === 0 || server.hostAction || server.guestAction)) {
          await commitAsHost(server, game.current, token);
        }
        setError("");
      } catch (e) {
        if (!disposed && revision === actionRevision.current) {
          failures++;
          setError(String((e as { message?: string })?.message || "Conexión interrumpida. Reintentando…"));
        }
      } finally {
        if (!disposed) {
          lock.current = false;
          if (!current.current || ["waiting","playing"].includes(current.current.status)) {
            schedule(failures ? Math.min(10000, 1500 * 2 ** Math.min(failures, 3)) : refreshPending ? 100 : 1200);
            refreshPending = false;
          }
        }
      }
    };

    // Broadcast wake (igual que futsal)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (typeof supabase.channel === "function") {
      channel = supabase.channel(`truco-wake:${challenge.id}`, { config: { broadcast: { self: false } } });
      changedChannel.current = channel;
      channel.on("broadcast", { event: "changed" }, wake).subscribe(status => { if (status === "SUBSCRIBED") wake(); });
    }
    void poll();

    return () => {
      disposed = true;
      if (refreshSoon.current === wake) refreshSoon.current = null;
      if (changedChannel.current === channel) changedChannel.current = null;
      if (channel) void supabase.removeChannel(channel).catch(() => {});
      clearTimeout(timer);
      if (generation.current === token) generation.current++;
    };
  }, [challenge.id, challenge.fromId, challenge.toId]);

  // ── pagehide: abandonar si la partida sigue activa ───────────────────────
  useEffect(() => {
    let accessToken: string | undefined;
    let disposed = false;
    void supabase.auth.getSession().then(({ data }) => { if (!disposed) accessToken = data.session?.access_token; });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => { accessToken = session?.access_token; });
    const exitPage = () => {
      if (!accessToken || !current.current || !["waiting","playing"].includes(current.current.status)) return;
      void fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/truco_leave`, {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ p_id: challenge.id }),
      }).catch(() => {});
    };
    window.addEventListener("pagehide", exitPage);
    window.addEventListener("popstate", exitPage);
    return () => { disposed = true; listener.subscription.unsubscribe(); window.removeEventListener("pagehide", exitPage); window.removeEventListener("popstate", exitPage); };
  }, [challenge.id]);

  // ── act: aplicar una acción local + enviarla al servidor ─────────────────
  const act = useCallback(async (action: Action) => {
    if (actionLock.current || !current.current || !game.current) return;
    if (current.current.status !== "playing") return;

    const s = current.current;
    const g = game.current;
    const mySeat: Seat = s.seat === "host" ? 0 : 1;
    const version = s.version;
    const token = generation.current;

    actionLock.current = true; actionRevision.current++; setBusy(true); setError("");

    // Aplicar motor localmente para feedback inmediato
    const nextGame = apply(g, mySeat, action, Math.random);
    if (nextGame === g) { actionLock.current = false; setBusy(false); return; } // acción ilegal
    game.current = nextGame;
    setGameState(nextGame);

    try {
      let { data, error: e, status: rpcStatus } = await supabase.rpc("truco_play", {
        p_id: challenge.id,
        p_version: version,
        p_action: action,
      });
      if (generation.current !== token) return;
      if (e) throw e;

      const updated = data as TrucoPvpState;
      current.current = updated;
      setPvpState(updated);

      // Si soy el host y el rival también actuó, commiteo el estado
      if (s.seat === "host") {
        await commitAsHost(updated, g, token);
      }

      // Notificar al rival
      const ch = changedChannel.current;
      if (ch) void ch.send({ type: "broadcast", event: "changed", payload: {} }).catch(() => {});
    } catch (e) {
      if (generation.current === token) {
        // Revertir estado local
        game.current = g;
        setGameState(g);
        setError(String((e as { message?: string })?.message || "No se pudo enviar la acción. Reintentá."));
      }
    } finally {
      if (generation.current === token) { actionLock.current = false; setBusy(false); refreshSoon.current?.(); }
    }
  }, [challenge.id]);

  // ── commitAsHost: el host aplica las dos acciones y sube el nuevo estado ──
  const commitAsHost = async (s: TrucoPvpState, currentGame: TrucoState, token: number) => {
    // Volver a leer el estado para obtener la acción del guest
    const { data: fresh, error: fetchErr } = await supabase.rpc("truco_state", { p_id: challenge.id });
    if (generation.current !== token) return;
    if (fetchErr) throw fetchErr;
    const freshState = fresh as TrucoPvpState & { hostAction?: Action; guestAction?: Action };

    // Aplicar acción del guest sobre el game actual
    let resolved = (freshState.matchState && Object.keys(freshState.matchState).length ? freshState.matchState : currentGame) as TrucoState;
    if (freshState.hostAction) resolved = apply(resolved, 0, freshState.hostAction, Math.random);
    if (freshState.guestAction) {
      resolved = apply(resolved, 1, freshState.guestAction, Math.random);
    }
    game.current = resolved;
    setGameState(resolved);

    const finished = resolved.phase === "finished";
    const { data: committed, error: commitErr } = await supabase.rpc("truco_commit", {
      p_id: challenge.id,
      p_version: freshState.version,
      p_new_state: resolved,
      p_host_score: resolved.scores[0],
      p_guest_score: resolved.scores[1],
      p_finished: finished,
      p_winner_id: finished && resolved.winner !== null
        ? (resolved.winner === 0 ? challenge.fromId : challenge.toId)
        : null,
    });
    if (generation.current !== token) return;
    if (commitErr) throw commitErr;
    current.current = committed as TrucoPvpState;
    setPvpState(committed as TrucoPvpState);
    const ch = changedChannel.current;
    if (ch) void ch.send({ type: "broadcast", event: "changed", payload: {} }).catch(() => {});
  };

  const leave = useCallback(async () => {
    await supabase.rpc("truco_leave", { p_id: challenge.id }).catch(() => {});
  }, [challenge.id]);

  return { pvpState, gameState, error, busy, act, leave, isHost };
}
