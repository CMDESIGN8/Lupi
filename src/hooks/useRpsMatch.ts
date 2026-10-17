import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";

export type RpsState = {
  id: string;
  round: number;
  hostWins: number;
  guestWins: number;
  status: "playing" | "finished";
  winnerId: string | null;
  mineSubmitted: boolean;
  opponentSubmitted: boolean;
  lastMoves: { host: string; guest: string } | null;
};

export function useRpsMatch(challenge: Challenge) {
  const [state, setState] = useState<RpsState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error: e } = await supabase.rpc("rps_state", { p_id: challenge.id });
    if (e) setError(e.message);
    else { setError(""); setState(data as RpsState); }
  }, [challenge.id]);

  useEffect(() => {
    let alive = true;
    const start = async () => {
      const { error: e } = await supabase.rpc("rps_start", {
        p_id: challenge.id,
        p_host: challenge.fromId,
        p_guest: challenge.toId,
      });
      if (!alive) return;
      if (e) setError(e.message);
      else void refresh();
    };
    void start();
    // Resiliente a eventos perdidos y reconexiones; más adelante se puede sumar Realtime.
    const timer = window.setInterval(() => { if (alive) void refresh(); }, 1200);
    return () => { alive = false; window.clearInterval(timer); };
  }, [challenge.id, challenge.fromId, challenge.toId, refresh]);

  const play = useCallback(async (choice: "rock" | "paper" | "scissors") => {
    if (busy || state?.mineSubmitted || state?.status !== "playing") return;
    setBusy(true);
    const { data, error: e } = await supabase.rpc("rps_play", {
      p_id: challenge.id, p_choice: choice,
    });
    if (e) setError(e.message);
    else { setError(""); setState(data as RpsState); }
    setBusy(false);
  }, [busy, state, challenge.id]);

  return { state, error, busy, play, refresh };
}
