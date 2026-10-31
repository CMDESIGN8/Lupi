import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
export type FutsalChoice = "angle" | "power" | "back";
export type FutsalTeamCard = { id: string; position: number; name: string; role: string };
export type FutsalEvent = { scenario?: string | null; scenarioOrder?: string[]; totalAttacks?: number; decisionSeconds?: number; resolutionMs?: number; rulesVersion?: number; stage?: "build" | "finish"; route?: string | null; hostAuto?: boolean; guestAuto?: boolean; version: number; turn: number; attackerId: string; attack: FutsalChoice; defense: FutsalChoice; defended: boolean; goal: boolean; support: boolean; keepAttack: boolean; narrative: string };
export type FutsalState = {
  scenario?: string | null; scenarioOrder?: string[]; totalAttacks?: number; decisionSeconds?: number; resolutionMs?: number; rulesVersion?: number; stage?: "build" | "finish"; route?: string | null;
  id: string; status: "waiting" | "playing" | "finished" | "expired" | "abandoned" | "cancelled";
  turn: number; version: number; support: boolean; attackerId: string;
  hostScore: number; guestScore: number; hostReady: boolean; guestReady: boolean;
  hostTeam: FutsalTeamCard[] | null; guestTeam: FutsalTeamCard[] | null;
  mineSubmitted: boolean; opponentSubmitted: boolean; winnerId: string | null;
  history: FutsalEvent[]; nextAt: string; deadline: string; serverNow: string;
};
export function useFutsalPvp(challenge: Challenge) {
  const [state, setState] = useState<FutsalState | null>(null);
  const [receivedAt, setReceivedAt] = useState(Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const actionError = useRef(false);
  const current = useRef<FutsalState | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const actionLock = useRef(false);
  const pollDone = useRef<Promise<void> | null>(null);
  useEffect(() => {
    const token = ++generation.current;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    lock.current = false; actionLock.current = false; pollDone.current = null; actionError.current = false; current.current = null; setState(null); setError(""); setBusy(false);
    const poll = async () => {
      if (disposed) return;
      if (lock.current || actionLock.current) { timer = setTimeout(() => void poll(), 900); return; }
      lock.current = true;
      let releasePoll!: () => void;
      const pending = new Promise<void>(resolve => { releasePoll = resolve; });
      pollDone.current = pending;
      try {
        const { data, error: e } = await supabase.rpc(current.current ? "futsal_state" : "futsal_open", current.current
          ? { p_id: challenge.id }
          : { p_id: challenge.id, p_host: challenge.fromId, p_guest: challenge.toId });
        if (disposed) return;
        if (e) throw e;
        current.current = data as FutsalState; setState(current.current); setReceivedAt(Date.now());
        if (!actionError.current) setError("");
      } catch (e) { if (!disposed) setError(String((e as { message?: string })?.message || "No se pudo conectar con la cancha.")); }
      finally {
        releasePoll();
        if (pollDone.current === pending) pollDone.current = null;
        if (!disposed) {
          lock.current = false;
          if (!current.current || ["waiting", "playing"].includes(current.current.status)) timer = setTimeout(() => void poll(), 900);
        }
      }
    };
    void poll();
    return () => { disposed = true; clearTimeout(timer); if (generation.current === token) generation.current++; };
  }, [challenge.id, challenge.fromId, challenge.toId, retry]);
  // Best effort on browser close/navigation. Visibility changes alone do not abandon.
  useEffect(() => {
    let accessToken: string | undefined;
    let disposed = false;
    void supabase.auth.getSession().then(({ data }) => { if (!disposed) accessToken = data.session?.access_token; });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { accessToken = session?.access_token; });
    const exitPage = () => {
      if (!accessToken || !current.current || !["waiting", "playing"].includes(current.current.status)) return;
      void fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/futsal_leave`, {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ p_id: challenge.id }),
      }).catch(() => {});
    };
    window.addEventListener("pagehide", exitPage);
    window.addEventListener("popstate", exitPage);
    return () => { disposed = true; listener.subscription.unsubscribe(); window.removeEventListener("pagehide", exitPage); window.removeEventListener("popstate", exitPage); };
  }, [challenge.id]);
  const action = async (name: "futsal_join" | "futsal_play" | "futsal_leave", choice?: FutsalChoice) => {
    if (actionLock.current || !current.current) return false;
    const token = generation.current;
    const version = current.current.version;
    actionLock.current = true; actionError.current = false; setBusy(true); setError("");
    try {
      // Keep the first tap while a background poll is running; do not discard it.
      await pollDone.current;
      if (generation.current !== token) return false;
      if (name === "futsal_play" && current.current.version !== version) {
        if (current.current.history.some(event => event.version === version)) return true;
        throw new Error("La jugada cambió. Elegí para la situación actual.");
      }
      if (name === "futsal_play" && current.current.mineSubmitted) return true;
      const { data, error: e } = await supabase.rpc(name, name === "futsal_play"
        ? { p_id: challenge.id, p_version: version, p_choice: choice }
        : { p_id: challenge.id });
      if (generation.current !== token) return false;
      if (e) throw e;
      current.current = data as FutsalState; setState(current.current); setReceivedAt(Date.now());
      return true;
    } catch (e) {
      if (generation.current === token) { actionError.current = true; setError(String((e as { message?: string })?.message || "No se pudo guardar tu decisión. Reintentá.")); }
      return false;
    } finally { if (generation.current === token) { actionLock.current = false; setBusy(false); } }
  };
  return { state, receivedAt, error, busy, join: () => action("futsal_join"), play: (choice: FutsalChoice) => action("futsal_play", choice), leave: () => action("futsal_leave"), reconnect: () => setRetry(n => n + 1) };
}
