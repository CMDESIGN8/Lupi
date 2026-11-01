import { useEffect, useRef, useState } from "react";
import { claimDuelReward, type ClaimOptions, type DuelGame, type DuelRewardResult } from "../lib/duelRewards";

/** Cobra el premio una sola vez cuando la partida termina. */
export function useDuelReward(game: DuelGame, matchId: string, finished: boolean, opts: ClaimOptions = {}) {
  const [reward, setReward] = useState<DuelRewardResult | null>(null);
  const [error, setError] = useState(false);
  const claimed = useRef("");
  const mounted = useRef(false);
  const activeMatch = useRef(matchId); activeMatch.current = matchId;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!finished) { setReward(null); setError(false); return; }
    if (claimed.current === matchId) return;
    if (opts.vsBot && !opts.botResult) return;
    claimed.current = matchId;
    claimDuelReward(game, matchId, opts)
      .then(r => { if (mounted.current && activeMatch.current === matchId) setReward(r); })
      .catch(() => { if (mounted.current && activeMatch.current === matchId) setError(true); });
  }, [finished, game, matchId, opts.vsBot, opts.botResult, opts.rivalId]);
  return { reward, error };
}
