import { supabase } from "./supabaseClient";
export function trackDuel(event: "search_started"|"search_cancelled"|"search_timeout"|"match_found"|"bot_started"|"entrance_timeout",game:string,waitMs=0,matchId?:string) {
 if(typeof crypto==='undefined'||!crypto.randomUUID)return;
 try { void Promise.resolve(supabase.rpc("duel_track_event",{p_event_id:crypto.randomUUID(),p_event:event,p_game:game,p_wait_ms:Math.max(0,Math.round(waitMs)),p_match_id:matchId??null})).catch(()=>{}); } catch { /* Telemetry never blocks gameplay. */ }
}
