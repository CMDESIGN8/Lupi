# Server-authoritative CardBattle protocol (implementation contract)

## Current reality
CardBattle runs generateTurn and resolveDecision in the browser, then inserts a recreational row in matches. Neither client scores nor elapsed time are proof of match completion. The experimental verified-match Edge Function intentionally returns 501 for finish; do not deploy it as a live gameplay endpoint yet.

## Required migration path
1. Move pure deterministic match logic from src/utils/battleEngine.ts into a shared module usable by Deno and Vite. Keep animations in CardBattle.
2. Server starts a match with authenticated user, authoritative deck snapshot and opponent configuration. Store random seed, match state, turn index, score and state version. Enforce a single active session per user, rate limits, and an expiry.
3. Client requests each next turn; server calculates turn from stored seed/state and returns animation events. Never accept client-generated turns or scores.
4. For moments requiring input, client sends only the selected option ID plus expected state version. Server validates the option belongs to the current moment and resolves it once. Retries with the same version return the same response; stale or invalid choices are rejected.
5. On the final turn, the server marks completion and atomically creates matches row, records equipment_match_consumptions, and reduces durability once. Match completion cannot be invoked directly from the browser.
6. Reconnect the UI: render server events, preserve existing animations, display the authoritative score and the remaining equipment uses.
7. Ensure abandoned sessions can expire without spending durability, and users cannot bypass a 0/10 equipment check by changing gear mid-session. Snapshot equipped items at start, or lock changes until finalization.
8. Keep existing client-side recreational matches separate until every mode is migrated. Do not award competitive rewards or consume wear for recreational matches.

## Acceptance checks
- Double-click start: only one session.
- Duplicate decision requests: no repeated goal or state advancement.
- Fake score, fake turn index, fake session owner: rejected.
- Disconnect/reconnect: resume same state.
- Complete once: exactly one match and one durability decrement for each eligible equipped item.
- Complete twice: no additional match or wear.
- 0/10 boots or socks: start rejected by server.
- 3/10: warning displayed before start.
- Unfinished/cancelled/expired match: zero wear.
- Renewal remains atomic and uses current shop price.

## Deployment gate
Do not run 20261031_verified_match_durability.sql or 20261101_verified_match_sessions.sql on production until the shared deterministic server engine and end-to-end integration are implemented and tested in staging.
