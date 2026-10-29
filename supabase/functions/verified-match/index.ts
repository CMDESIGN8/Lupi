import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return reply({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "Server not configured" }, 500);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await admin.auth.getUser(auth.slice(7));
    if (authError || !user) return reply({ error: "Invalid session" }, 401);
    const body = await request.json();
    if (body.action === "start") {
      if (typeof body.opponent !== "string" || !/^[a-zA-Z0-9 _-]{1,80}$/.test(body.opponent))
        return reply({ error: "Invalid opponent" }, 400);
      // Serialize against renewals and other starts by locking via a dedicated RPC in a future revision.
      const { data: equipped, error: eqError } = await admin.from("user_items")
        .select("item_id,aura_items!inner(slot)").eq("user_id", user.id).eq("equipped", true);
      if (eqError) throw eqError;
      const ids = (equipped ?? []).filter((x) => {
        const a = x.aura_items as unknown as {slot:string} | {slot:string}[];
        const slot = Array.isArray(a) ? a[0]?.slot : a?.slot;
        return slot === "socks" || slot === "boots";
      }).map((x) => x.item_id);
      if (ids.length) {
        const { data: wear, error: wearError } = await admin.from("equipment_durability")
          .select("item_id,remaining").eq("user_id", user.id).in("item_id", ids);
        if (wearError) throw wearError;
        if ((wear ?? []).some((x) => x.remaining <= 0))
          return reply({ error: "Equipment exhausted" }, 409);
      }
      // Score is decided on the server and not supplied by the browser.
      const bytes = crypto.getRandomValues(new Uint32Array(2));
      const userScore = bytes[0] % 6;
      const opponentScore = bytes[1] % 6;
      const { data: session, error } = await admin.from("verified_match_sessions")
        .insert({ user_id: user.id, opponent_key: body.opponent,
          user_score: userScore, opponent_score: opponentScore })
        .select("id").single();
      if (error) throw error;
      return reply({ session_id: session.id });
    }
    if (body.action === "finish") {
      if (typeof body.session_id !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(body.session_id))
        return reply({ error: "Invalid session" }, 400);
      const { data: session, error } = await admin.from("verified_match_sessions")
        .select("user_id,created_at,user_score,opponent_score")
        .eq("id", body.session_id).single();
      if (error || !session || session.user_id !== user.id)
        return reply({ error: "Session not found" }, 404);
      // Minimum elapsed time prevents immediate start/finish farming.
      if (Date.now() - new Date(session.created_at).getTime() < 60_000)
        return reply({ error: "Match still in progress" }, 409);
      const { data: matchId, error: finishError } = await admin.rpc("finalize_verified_match",
        { p_session_id: body.session_id });
      if (finishError) throw finishError;
      return reply({ match_id: matchId, user_score: session.user_score,
        opponent_score: session.opponent_score });
    }
    return reply({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("verified-match:", error);
    return reply({ error: "Could not process match" }, 500);
  }
});
