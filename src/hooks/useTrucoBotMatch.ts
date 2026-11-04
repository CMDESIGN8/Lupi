import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { actor, apply, newGame, safeBotAction, type Action, type BotLevel, type Seat, type TrucoState } from "../utils/trucoEngine";

export type TrucoFinishResult =
  | { ok: true; duplicate?: boolean; result?: "win" | "loss"; xp?: number; coins?: number; vsBot?: boolean; capped?: boolean; hardCapped?: boolean }
  | null;

/** Partida de Truco contra un bot local. Vos sos el asiento 0 y el bot el 1.
 *  Al terminar llama a truco_bot_finish para registrar el resultado server-side
 *  y habilitar la acreditación de premios. */
export function useTrucoBotMatch(matchId: string, botIndex: number) {
  const level = (Number.isFinite(botIndex) ? Math.min(Math.max(Math.trunc(botIndex), 0), 2) : 1) as BotLevel;
  const [state, setState] = useState<TrucoState>(() => newGame(Math.random, Math.random() < 0.5 ? 0 : 1));
  const [thinking, setThinking] = useState(false);
  const [finishResult, setFinishResult] = useState<TrucoFinishResult>(null);
  const [finishError, setFinishError] = useState(false);
  const claimed = useRef("");

  const act = useCallback((action: Action) => {
    setState((s) => apply(s, 0 as Seat, action, Math.random));
  }, []);

  // Turno del bot
  useEffect(() => {
    if (state.phase !== "playing" || actor(state) !== 1) { setThinking(false); return; }
    setThinking(true);
    const delay = 750 + Math.random() * 650;
    const timer = window.setTimeout(() => {
      setState((s) => (s.phase !== "playing" || actor(s) !== 1 ? s : apply(s, 1, safeBotAction(s, 1, level, Math.random), Math.random)));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [state, level]);

  // Registrar resultado al terminar (una sola vez por matchId)
  useEffect(() => {
    if (state.phase !== "finished" || claimed.current === matchId) return;
    claimed.current = matchId;

    const history = state.trickResults.map((r, i) => ({
      trick: i + 1,
      result: r,
      cards: [state.table[0][i], state.table[1][i]],
    }));

    supabase
      .rpc("truco_bot_finish", {
        p_match_id: matchId,
        p_bot: botIndex,
        p_host_wins: state.scores[0],
        p_guest_wins: state.scores[1],
        p_history: history,
      })
      .then(({ data, error }) => {
        if (error) { console.error("[truco_bot_finish]", error); setFinishError(true); return; }
        setFinishResult(data as TrucoFinishResult);
        window.dispatchEvent(new CustomEvent("lupi:progression-updated", { detail: { actionType: "duel", result: data } }));
      })
      .catch(() => setFinishError(true));
  }, [state.phase, state.scores, state.trickResults, state.table, matchId, botIndex]);

  return { state, thinking, act, finishResult, finishError };
}
