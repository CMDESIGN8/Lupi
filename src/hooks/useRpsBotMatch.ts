import { useCallback, useEffect, useRef, useState } from "react";
import type { Challenge } from "./useLobbyChallenges";
import type { RpsState } from "./useRpsMatch";

type Move = "rock" | "paper" | "scissors";
const MOVES: Move[] = ["rock", "paper", "scissors"];
/** La jugada que le gana a `m`. */
const counter = (m: Move): Move => (m === "rock" ? "paper" : m === "paper" ? "scissors" : "rock");
const rand = (): Move => MOVES[Math.floor(Math.random() * 3)];

export const BOT_NAMES = ["Pibe Cebollita", "El Tano", "La Bruja"] as const;
export const BOT_BLURBS = ["Tira lo que se le ocurre", "Repite lo que le funciona", "Te lee la última mano"] as const;

/** Tres personalidades, todas vencibles: leerlas es parte de la gracia. */
function botMove(botIndex: number, mine: Move[], bots: Move[], lastBotWon: boolean | null): Move {
  if (botIndex === 1 && bots.length) {            // El Tano: gana y repite, pierde y cambia
    const last = bots[bots.length - 1];
    return lastBotWon ? last : Math.random() < 0.7 ? counter(last) : rand();
  }
  if (botIndex === 2 && mine.length) {            // La Bruja: apuesta a que repetís o la sacás
    return Math.random() < 0.55 ? counter(mine[mine.length - 1]) : rand();
  }
  return rand();                                   // Pibe Cebollita
}

/** Misma forma que useRpsMatch, pero sin servidor: el rival es un bot local (el jugador siempre es host). */
export function useRpsBotMatch(challenge: Challenge, enabled: boolean) {
  const fresh = useCallback((): RpsState => ({ id: challenge.id, round: 1, hostWins: 0, guestWins: 0, status: "playing", winnerId: null, mineSubmitted: false, opponentSubmitted: false, lastMoves: null }), [challenge.id]);
  const [state, setState] = useState<RpsState | null>(null);
  const [busy, setBusy] = useState(false);
  const current = useRef<RpsState | null>(null);
  const history = useRef<{ mine: Move[]; bot: Move[]; lastBotWon: boolean | null }>({ mine: [], bot: [], lastBotWon: null });
  const timer = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    window.clearTimeout(timer.current);
    history.current = { mine: [], bot: [], lastBotWon: null };
    current.current = fresh(); setState(current.current); setBusy(false);
    return () => window.clearTimeout(timer.current);
  }, [enabled, fresh]);

  const play = useCallback(async (choice: Move) => {
    const s = current.current;
    if (!enabled || !s || s.status !== "playing" || busy) return false;
    setBusy(true);
    await new Promise<void>(resolve => { timer.current = window.setTimeout(resolve, 650); }); // suspenso: “sellando tu mano…”
    const h = history.current;
    const bot = botMove(challenge.botIndex, h.mine, h.bot, h.lastBotWon);
    const meWins = counter(bot) === choice, tie = bot === choice;
    h.mine.push(choice); h.bot.push(bot); h.lastBotWon = tie ? null : !meWins;
    const hostWins = s.hostWins + (meWins ? 1 : 0), guestWins = s.guestWins + (!meWins && !tie ? 1 : 0);
    const played = h.mine.length;
    const finished = hostWins === 2 || guestWins === 2 || played >= 3;
    const next: RpsState = {
      ...s, hostWins, guestWins, round: finished ? played : played + 1, mineSubmitted: false, opponentSubmitted: false,
      lastMoves: { host: choice, guest: bot }, status: finished ? "finished" : "playing",
      winnerId: finished ? (hostWins > guestWins ? challenge.fromId : guestWins > hostWins ? challenge.toId : null) : null,
    };
    current.current = next; setState(next); setBusy(false);
    return true;
  }, [enabled, busy, challenge.botIndex, challenge.fromId, challenge.toId]);

  return { state, error: "", busy, play, refresh: async () => {} };
}
