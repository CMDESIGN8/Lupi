/**
 * Stateless, reproducible random stream for server-authoritative matches.
 * Each draw is derived from (seed, turn, phase, drawIndex); no shared mutable
 * generator state, so concurrent Supabase requests cannot influence each other.
 *
 * This is a deterministic simulation primitive, NOT a cryptographic proof.
 * The seed must be generated and kept by the trusted server, never accepted
 * from the player. The authoritative engine still needs to be migrated.
 */
export type MatchRandomPhase = "user" | "rival" | "decision" | "narrative";

export function matchRandom(
  seed: number,
  turn: number,
  phase: MatchRandomPhase,
  drawIndex: number,
): number {
  if (![seed, turn, drawIndex].every(Number.isSafeInteger) ||
      turn < 0 || drawIndex < 0) {
    throw new Error("Invalid match random coordinates");
  }
  const phaseId: Record<MatchRandomPhase, number> = {
    user: 1, rival: 2, decision: 3, narrative: 4,
  };
  if (!(phase in phaseId)) throw new Error("Invalid random phase");
  let x = (seed ^ Math.imul(turn + 1, 0x9e3779b9) ^
    Math.imul(phaseId[phase], 0x85ebca6b) ^
    Math.imul(drawIndex + 1, 0xc2b2ae35)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 0x100000000;
}

/** Per-phase sequential draw cursor, local to a single calculation only. */
export function matchRandomCursor(seed: number, turn: number, phase: MatchRandomPhase) {
  let index = 0;
  return () => matchRandom(seed, turn, phase, index++);
}
