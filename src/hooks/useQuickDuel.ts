import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { trackDuel } from "../lib/duelTelemetry";
import type { ChallengeGame } from "./useLobbyChallenges";

export type QuickGame = "rps" | "trivia";
type Searcher = { userId: string; name: string; ts: number };

const BOT_AFTER_MS = 8_000;     // Piedra-Papel-Tijera: si nadie aparece, entrenás contra un bot
const RESEND_MS = 11_000;       // > FROM_COOLDOWN de useLobbyChallenges

type Options = {
  room: string; meId: string; meName: string;
  /** Mismo flag `available` del lobby: si pasa a false (llegó el duelo) se corta la búsqueda. */
  available: boolean;
  /** Ref compartida con useLobbyChallenges para que el rival que busca acepte solo. */
  quickGameRef: { current: ChallengeGame | null };
  send: (target: { userId: string; username: string }, game: QuickGame) => boolean;
  cancelOutgoing: () => void;
  onBot: (game: QuickGame) => void;
};

/**
 * Cola de duelo rápido por presence. Todos ven la misma lista ordenada (ts, userId) y se
 * emparejan de a dos; el segundo de cada pareja manda el desafío (con quick=true) y el primero
 * lo acepta solo. Sin servidor nuevo.
 */
export function useQuickDuel({ room, meId, meName, available, quickGameRef, send, cancelOutgoing, onBot }: Options) {
  const searchStartedAt=useRef(0);
  const [game, setGame] = useState<QuickGame | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [others, setOthers] = useState(0);
  const [notice, setNotice] = useState("");
  const latest = useRef({ send, cancelOutgoing, onBot, available });
  latest.current = { send, cancelOutgoing, onBot, available };

  useEffect(() => { quickGameRef.current = game; return () => { quickGameRef.current = null; }; }, [game, quickGameRef]);

  useEffect(() => {
    if (game && !available) setGame(null); // llegó el duelo (o salió del lobby)
  }, [game, available]);

  useEffect(() => {
    if (!game || !meId) return;
    const started = Date.now();
    let pairedAt = 0, lastSent = 0, hasMate = false, initiator = false, mate: Searcher | null = null, stopped = false;
    setSeconds(0); setOthers(0); setNotice("");
    const channel = supabase.channel(`quick-duel:${room}:${game}`, { config: { presence: { key: meId } } });

    const list = (): Searcher[] => {
      const state = channel.presenceState() as Record<string, Array<Partial<Searcher>>>;
      return Object.entries(state)
        .map(([userId, metas]) => ({ userId, name: String(metas?.[0]?.name ?? "Jugador").slice(0, 24), ts: Number(metas?.[0]?.ts) || 0 }))
        .sort((a, b) => a.ts - b.ts || (a.userId < b.userId ? -1 : 1));
    };
    const trySend = () => {
      if (stopped || !latest.current.available || !initiator || !mate) return;
      const now = Date.now();
      if (lastSent && now - lastSent < RESEND_MS) return;
      if (lastSent) latest.current.cancelOutgoing();
      if (latest.current.send({ userId: mate.userId, username: mate.name }, game)) lastSent = now;
    };
    const pair = () => {
      if(stopped)return;
      const oldMate=mate?.userId;
      const all = list(); setOthers(Math.max(0, all.length - 1));
      const idx = all.findIndex(s => s.userId === meId);
      mate = idx < 0 ? null : all[idx % 2 === 0 ? idx + 1 : idx - 1] ?? null;
      if(oldMate!==mate?.userId){if(lastSent)latest.current.cancelOutgoing();lastSent=0;pairedAt=mate?Date.now():0;}
      hasMate = !!mate; initiator = hasMate && idx % 2 === 1;   // el segundo de la pareja desafía, el primero acepta solo
      trySend();
    };

    channel.on("presence", { event: "sync" }, pair).subscribe(async status => {
      if (status === "SUBSCRIBED" && !stopped) await channel.track({ name: meName, ts: started });
    });

    const clock = window.setInterval(() => {
      if(stopped)return;
      const elapsed = Date.now() - started;
      setSeconds(Math.floor(elapsed / 1000));
      trySend();                             // reintenta si el canal de desafíos recién estaba listo o venció la invitación
      if ((pairedAt && Date.now()-pairedAt>=15000) || elapsed>=30000) {
        stopped=true;quickGameRef.current=null;if(lastSent)latest.current.cancelOutgoing();setGame(null);trackDuel("search_timeout",game,elapsed);
        if(game==='rps'){trackDuel("bot_started",game,elapsed);latest.current.onBot("rps");}
        else setNotice(hasMate?"El rival no confirmó a tiempo. Podés buscar otra vez.":"No encontramos rival ahora. Podés volver a buscar.");
        return;
      }
      if (hasMate) return;                   // hay pareja armada: esperá la respuesta
      if (game === "rps" && elapsed >= BOT_AFTER_MS) { stopped = true; setGame(null); quickGameRef.current=null;trackDuel("bot_started",game,elapsed); latest.current.onBot("rps"); }

    }, 500);

    return () => {
      stopped = true; window.clearInterval(clock);
      if (lastSent) latest.current.cancelOutgoing();
      void supabase.removeChannel(channel);
    };
  }, [game, room, meId, meName]);

  return { game, seconds, others, notice, matched:(matchId?:string)=>{if(game&&searchStartedAt.current){trackDuel("match_found",game,Date.now()-searchStartedAt.current,matchId);searchStartedAt.current=0;}}, start: (g: QuickGame) => { if(!latest.current.available)return;searchStartedAt.current=Date.now();trackDuel("search_started",g);setNotice(""); setGame(g); }, cancel: () => {quickGameRef.current=null;if(game)trackDuel("search_cancelled",game,seconds*1000);setGame(null);}, dismissNotice: () => setNotice("") };
}
