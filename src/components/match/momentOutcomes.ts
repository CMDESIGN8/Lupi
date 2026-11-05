import type { DecisionOption, MomentContext, MomentResult } from "../../utils/battleEngine";
import type { FutsalEvent } from "../../hooks/useFutsalPvp";
import type { MomentOutcome } from "../MatchMoment";

/** Partido contra bot: qué escena corresponde a la decisión que tomó la persona. null = sin cinemática (queda el flash de siempre). */
export function outcomeFromBotDecision(ctx: MomentContext, chosen: DecisionOption, res: MomentResult): MomentOutcome | null {
  if (res.goalFor === "user") return "goal";
  if (res.goalFor === "rival") return "concede";
  if (ctx.type === "defense" || ctx.type === "block") {
    return res.success ? (chosen.id.startsWith("block") ? "blocked" : "recovered") : null;
  }
  const playOn = /^(pass_|counter_pass|corner_short|drib_)/.test(chosen.id);
  if (res.success) return playOn ? "chance" : "saved";
  if (/^(shoot_|pen_|corner_)/.test(chosen.id)) return res.narrative.length % 2 ? "miss" : "saved";
  return null;
}

/** PvP: escena desde la perspectiva de quien mira. null = la jugada sigue sin momento destacado. */
export function outcomeFromPvpEvent(e: FutsalEvent, meAttacks: boolean): MomentOutcome | null {
  if (e.goal) return meAttacks ? "goal" : "concede";
  const build = (e.rulesVersion ?? 1) >= 2 && e.stage === "build";
  if (meAttacks) {
    if (build) return e.defended ? null : "chance";
    if (e.keepAttack) return "chance";
    if (e.defended) return e.version % 2 ? "miss" : "saved";
    return null;
  }
  if (build) return e.defended ? "recovered" : null;
  if (e.defended) return "blocked";
  return null;
}
