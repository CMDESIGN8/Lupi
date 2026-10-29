// Shared deterministic match simulation. The import path is intentionally
// relative to the repository so Vite and Deno execute identical logic.
export {
  calculateSeededTurn,
  calculateSeededDecision,
} from "../../../src/utils/verifiedMatchEngine.ts";
export type {
  TurnResult, MomentContext, MomentResult,
} from "../../../src/utils/battleEngine.ts";
