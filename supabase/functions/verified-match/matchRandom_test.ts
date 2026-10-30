import { matchRandom, matchRandomCursor } from "../../../src/utils/matchRandom.ts";

Deno.test("same coordinates yield the same result", () => {
  const a = matchRandom(123456, 7, "user", 2);
  const b = matchRandom(123456, 7, "user", 2);
  if (a !== b || a < 0 || a >= 1) throw new Error("Not deterministic");
});

Deno.test("phase, turn and draw coordinates are independent", () => {
  const a = matchRandom(123456, 7, "user", 2);
  if (a === matchRandom(123456, 8, "user", 2)) throw new Error("Turn collision");
  if (a === matchRandom(123456, 7, "rival", 2)) throw new Error("Phase collision");
  if (a === matchRandom(123456, 7, "user", 3)) throw new Error("Draw collision");
});

Deno.test("cursor produces reproducible stream", () => {
  const a = matchRandomCursor(44, 1, "decision");
  const b = matchRandomCursor(44, 1, "decision");
  for (let i = 0; i < 20; i++) {
    if (a() !== b()) throw new Error("Cursor mismatch");
  }
});

Deno.test("rejects invalid coordinates", () => {
  let rejected = false;
  try { matchRandom(1, -1, "user", 0); } catch { rejected = true; }
  if (!rejected) throw new Error("Expected invalid coordinate rejection");
});
