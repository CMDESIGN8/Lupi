/**
 * Staging-only integration smoke test for the deployed verified-match Edge Function.
 * Required env: STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY,
 * STAGING_TEST_EMAIL, STAGING_TEST_PASSWORD.
 *
 * Creates one verified session with the test user's EXISTING five-card deck.
 * It intentionally does not finish or consume equipment.
 * The session expires after two hours.
 *
 * Run: deno run --allow-env --allow-net scripts/test-verified-match-staging.ts
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
const url = env("STAGING_SUPABASE_URL");
const anon = env("STAGING_SUPABASE_ANON_KEY");
if (!/\/\//.test(url) || !url.startsWith("https://")) {
  throw new Error("Invalid staging URL");
}
if (Deno.env.get("CONFIRM_STAGING_ONLY") !== "YES") {
  throw new Error("Set CONFIRM_STAGING_ONLY=YES after verifying this is NOT production");
}
const client = createClient(url, anon, { auth: { persistSession: false } });
const { data: auth, error: authError } = await client.auth.signInWithPassword({
  email: env("STAGING_TEST_EMAIL"), password: env("STAGING_TEST_PASSWORD"),
});
if (authError || !auth.user) throw new Error("Staging test authentication failed");

async function call(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await client.functions.invoke("verified-match", {
    body: { action, ...extra },
  });
  // Functions.invoke may return an error object for HTTP 4xx; retain it.
  return { data: data as Record<string, unknown> | null, error };
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const started = await call("start", { opponent: "Staging Bot" });
assert(!started.error && typeof started.data?.session_id === "string",
  "Cannot start verified staging session (check migrations, deck, equipment)");
const sessionId = started.data.session_id as string;
console.log("Created staging session", sessionId);

const active = await call("active");
assert(!active.error && active.data?.active_session,
  "Active match lookup failed");
const activeSession = active.data.active_session as Record<string, unknown>;
assert(activeSession.id === sessionId, "Active lookup returned a different session");
assert(!("simulation_seed" in activeSession) && !("deck_snapshot" in activeSession),
  "Active lookup exposed private match data");
console.log("PASS: active match discovery is owner-scoped and hides secrets");


const early = await call("finish", { session_id: sessionId });
assert(!!early.error || !!early.data?.error, "Premature finish was accepted");
console.log("PASS: premature finish rejected");

const resume = await call("resume", { session_id: sessionId });
assert(!resume.error && resume.data?.session, "Owner cannot resume own session");
const session = resume.data.session as Record<string, unknown>;
assert(!("simulation_seed" in session), "Private seed leaked to browser");
assert(!("deck_snapshot" in session), "Private deck snapshot leaked");
assert(session.state === "started", "Unexpected session state");
console.log("PASS: owner resume hides private state");

const invalid = await call("decision", {
  session_id: sessionId, expected_version: 0, option_id: "invented-option",
});
assert(!!invalid.error || !!invalid.data?.error,
  "Decision without pending moment was accepted");
console.log("PASS: decision without pending moment rejected");

const first = await call("turn", {
  session_id: sessionId, expected_version: 0,
});
assert(!first.error && first.data?.turn && first.data.state_version === 1,
  "First authoritative turn failed");
console.log("PASS: first server-generated turn");

const recovered = await call("resume", { session_id: sessionId });
assert(!recovered.error && recovered.data?.session, "Cannot recover committed turn");
const recoveredSession = recovered.data.session as Record<string, unknown>;
assert(recoveredSession.turn_index === 1 && recoveredSession.state_version === 1,
  "Recovered turn index or state version mismatch");
assert((recoveredSession.simulation_state as Record<string, unknown>)?.last_turn,
  "Committed turn was not preserved for recovery");
console.log("PASS: recovery resumes from committed turn without replay");

if (recoveredSession.pending_decision) {
  const pending = recoveredSession.pending_decision as {
    options?: { id: string }[];
  };
  assert(Array.isArray(pending.options) && pending.options.length > 0,
    "Pending decision has no available options");
  const invalidPending = await call("decision", {
    session_id: sessionId, expected_version: 1, option_id: "invented-option",
  });
  assert(!!invalidPending.error || !!invalidPending.data?.error,
    "Invalid pending decision was accepted");
  const pendingStillThere = await call("resume", { session_id: sessionId });
  const pendingSession = pendingStillThere.data?.session as Record<string, unknown> | undefined;
  assert(!pendingStillThere.error && pendingSession?.state_version === 1 &&
    pendingSession.pending_decision,
    "Invalid decision unexpectedly changed committed state");
  console.log("PASS: invalid pending decision does not mutate session");
}


const duplicate = await call("turn", {
  session_id: sessionId, expected_version: 0,
});
assert(!!duplicate.error || !!duplicate.data?.error,
  "Replayed turn with stale version was accepted");
console.log("PASS: replayed turn rejected");

console.log("Staging smoke checks passed. Session intentionally left unfinished.");
