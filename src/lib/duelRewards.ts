import { supabase } from "./supabaseClient";

export type DuelGame = "rps" | "trivia";
export type DuelRewardResult = {
  ok: boolean; duplicate?: boolean; result?: "win" | "loss" | "draw";
  xp?: number; coins?: number; chest?: "comun" | "raro" | "epico" | null;
  firstWin?: boolean; capped?: boolean; rivalCapped?: boolean; vsBot?: boolean;
  h2h?: { wins: number; losses: number; draws: number } | null;
  streak?: number; bestStreak?: number; wins?: number; losses?: number; draws?: number;
};
export type ClaimOptions = { vsBot?: boolean; botResult?: "win" | "loss" | "draw"; rivalId?: string };

export async function claimDuelReward(game: DuelGame, matchId: string, opts: ClaimOptions = {}): Promise<DuelRewardResult> {
  const { data, error } = await supabase.rpc("duel_claim_reward", {
    p_game: game, p_match_id: matchId, p_vs_bot: !!opts.vsBot, p_bot_result: opts.botResult ?? null, p_rival_id: opts.rivalId ?? null,
  });
  if (error) throw error;
  const result = data as DuelRewardResult;
  // Refresca HUD/XP/monedas y la racha visible (mismo evento que usa el resto de la progresión).
  window.dispatchEvent(new CustomEvent("lupi:progression-updated", { detail: { actionType: "duel", result } }));
  return result;
}
