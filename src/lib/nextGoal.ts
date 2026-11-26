import type { DuelRewardResult } from "./duelRewards";

/**
 * "Siguiente meta" tras un duelo. Solo usa datos que el servidor ya devuelve en duel_claim_reward
 * (dailyLimit/dailyPlayed, streak/bestStreak, chestDry/chestPityAfter); no inventa reglas.
 * Las prácticas contra bot no cuentan para la racha ni para el cofre, así que no muestran esas metas.
 */
export type NextGoal = {
  stamps: { played: number; limit: number; left: number } | null;
  record: { kind: "chase" | "rebuild"; text: string } | null;
  chest: { left: number; text: string } | null;
};

type Input = Pick<DuelRewardResult, "result" | "vsBot" | "dailyLimit" | "dailyPlayed" | "streak" | "bestStreak" | "chestDry" | "chestPityAfter">;
const wins = (n: number) => `${n} ${n === 1 ? "victoria" : "victorias"}`;

export function nextGoalFor(reward: Input): NextGoal {
  const limit = Math.trunc(reward.dailyLimit ?? 0), played = Math.trunc(reward.dailyPlayed ?? -1);
  const stamps = limit > 0 && played >= 0 ? { played: Math.min(played, limit), limit, left: Math.max(0, limit - played) } : null;
  if (reward.vsBot) return { stamps, record: null, chest: null };

  const streak = Math.max(0, Math.trunc(reward.streak ?? 0)), best = Math.max(0, Math.trunc(reward.bestStreak ?? 0));
  let record: NextGoal["record"] = null;
  if (reward.result === "win" && best >= 2 && streak < best) {
    const need = best - streak;
    record = { kind: "chase", text: need === 1 ? `Te falta 1 victoria más para igualar tu récord de ${best}` : `Te faltan ${need} victorias seguidas para igualar tu récord de ${best}` };
  } else if (reward.result === "loss" && best >= 3) {
    record = { kind: "rebuild", text: `Tu récord son ${wins(best)} seguidas: ¡andá por otra racha!` };
  }

  // Cofre garantizado: solo cuando falta poco (1 a 3 victorias), que es cuando motiva.
  let chest: NextGoal["chest"] = null;
  const after = Math.trunc(reward.chestPityAfter ?? 0), dry = Math.trunc(reward.chestDry ?? -1);
  if (after > 0 && dry >= 0) {
    const left = after - dry;
    if (left >= 1 && left <= 3) chest = { left, text: left === 1 ? "¡Tu próxima victoria contra una persona trae cofre!" : `Cofre garantizado en ${left} victorias contra personas` };
  }
  return { stamps, record, chest };
}
