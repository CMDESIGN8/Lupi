import {
  calculateSeededTurn, calculateSeededDecision,
} from "../../src/utils/verifiedMatchEngine.ts";
import type { UserCard } from "../../src/types/cards.ts";

const makeCard = (id: string): UserCard => ({
  id, user_id: "test-user", card_type: "npc", level: 1,
  experience: 0, is_favorite: false, obtained_at: "2026-01-01",
  card: {
    id, card_type: "npc", can_be_replaced: true, is_replaced: false,
    name: "Jugador " + id, position: "pivot", category: "8va",
    overall_rating: 75, pace: 70, dribbling: 72, passing: 68,
    defending: 66, finishing: 76, physical: 74,
  },
});
const cards = Array.from({ length: 5 }, (_, i) => makeCard(String(i)));

Deno.test("server turn is reproducible across repeated calls", () => {
  const a = calculateSeededTurn(cards, 5, 0.2, "Bot", 123456, 0);
  const b = calculateSeededTurn(cards, 5, 0.2, "Bot", 123456, 0);
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error("Turn mismatch");
});

Deno.test("server rejects decisions not offered by current moment", () => {
  const turn = calculateSeededTurn(cards, 5, 1, "Bot", 123456, 0);
  const ctx = turn.userPhase.moment;
  if (!ctx) throw new Error("Expected an attacking moment");
  let rejected = false;
  try { calculateSeededDecision(ctx, "invented-option", 123456, 0); }
  catch { rejected = true; }
  if (!rejected) throw new Error("Unlisted decision was accepted");
  const chosen = calculateSeededDecision(ctx, ctx.options[0].id, 123456, 0);
  const repeated = calculateSeededDecision(ctx, ctx.options[0].id, 123456, 0);
  if (JSON.stringify(chosen) !== JSON.stringify(repeated)) throw new Error("Decision mismatch");
});
