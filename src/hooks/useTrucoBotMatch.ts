import { useCallback, useEffect, useState } from "react";
import { actor, apply, newGame, safeBotAction, type Action, type BotLevel, type Seat, type TrucoState } from "../utils/trucoEngine";

/** Partida de Truco contra un bot local. Vos sos el asiento 0 y el bot el 1. */
export function useTrucoBotMatch(botIndex: number) {
  const level = (Number.isFinite(botIndex)?Math.min(Math.max(Math.trunc(botIndex), 0), 2):1) as BotLevel;
  const [state, setState] = useState<TrucoState>(() => newGame(Math.random, Math.random() < 0.5 ? 0 : 1));
  const [thinking, setThinking] = useState(false);

  const act = useCallback((action: Action) => {
    setState((s) => apply(s, 0 as Seat, action, Math.random));
  }, []);

  useEffect(() => {
    if (state.phase !== "playing" || actor(state) !== 1) { setThinking(false); return; }
    setThinking(true);
    const delay = 750 + Math.random() * 650;
    const timer = window.setTimeout(() => {
      setState((s) => (s.phase !== "playing" || actor(s) !== 1 ? s : apply(s, 1, safeBotAction(s, 1, level, Math.random), Math.random)));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [state, level]);

  return { state, thinking, act };
}
