import type { UserCard } from "../types/cards.ts";
import {
  generateTurn, resolveDecision, type DecisionOption, type MomentContext,
  type MomentResult, type TurnResult,
} from "./battleEngine.ts";
import { matchRandomCursor } from "./matchRandom.ts";

/**
 * Reproducible calculations, shared by Vite and Supabase Deno.
 * Only the server should know/choose the seed in a verified match.
 * IMPORTANT: deck data, option selection and turn version must still be
 * validated by the authoritative session endpoint.
 */
export function calculateSeededTurn(
  cards: UserCard[], minute: number, advantage: number,
  opponent: string, seed: number, turnIndex: number,
): TurnResult {
  return generateTurn(
    cards, minute, advantage, opponent,
    matchRandomCursor(seed, turnIndex, "user"),
    matchRandomCursor(seed, turnIndex, "rival"),
  );
}

export function calculateSeededDecision(
  context: MomentContext, optionId: string, seed: number, turnIndex: number,
): MomentResult {
  const option: DecisionOption | undefined = context.options.find((x) => x.id === optionId);
  if (!option) throw new Error("Invalid decision for this moment");
  return resolveDecision(
    option, context.mainCard, context.type, context.minute,
    matchRandomCursor(seed, turnIndex, "decision"),
  );
}
