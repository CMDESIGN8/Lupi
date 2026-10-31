import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
export type FutsalChoice = "angle" | "power" | "back";
export type FutsalTeamCard = { id: string; position: number; name: string; role: string };
export type FutsalEvent = { scenario?: string | null; scenarioOrder?: string[]; totalAttacks?: number; decisionSeconds?: number; resolutionMs?: number; rulesVersion?: number; stage?: "build" | "finish"; route?: string | null; hostAuto?: boolean; guestAuto?: boolean; version: number; turn: number; attackerId: string; attack: FutsalChoice; defense: FutsalChoice; defended: boolean; goal: boolean; support: boolean; keepAttack: boolean; narrative: string };
export type FutsalState = {
  scenario?: string | null; scenarioOrder?: string[]; totalAttacks?: number; decisionSeconds?: number; resolutionMs?: number; rulesVersion?: number; stage?: "build" | "finish"; route?: string | null;
  id: string; status: "waiting" | "playing" | "finished" | "expired" | "abandoned" | "cancelled";
  turn: number; version: number; support: boolean; attackerId: string;
  hostScore: number; guestScore: number; hostReady: boolean; guestReady: boolean;
  hostTeam: FutsalTeamCard[] | null; guestTeam: FutsalTeamCard[] | null;
  mineSubmitted: boolean; opponentSubmitted: boolean; winnerId: string | null;
  history: FutsalEvent[]; nextAt: string; deadline: string; serverNow: string;
};
export function useFutsalPvp(challenge: Challenge) {
  const [state, setState] = useState<FutsalState | null>(null);
  const [receivedAt, setReceivedAt] = useState(Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const actionError = useRef(false);
  const current = useRef<FutsalState | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const actionLock = useRef(false);
  const actionRevision = useRef(0);
  const refreshSoon = useRef<(() => void) | null>(null);
  const changedChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    const token = ++generation.current;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    lock.current = false; actionLock.current = false; actionRevision.current++; actionError.current = false; current.current = null; setState(null); setError(""); setBusy(false);
    let refreshPending=false;
    let failures=0;
    const schedule = (ms:number) => {clearTimeout(timer);timer=setTimeout(()=>void poll(),ms);};
    const wake = () => {
      if(disposed || (current.current && !["waiting","playing"].includes(current.current.status)))return;
      if(lock.current || actionLock.current){refreshPending=true;return;}
      schedule(120);
    };
    refreshSoon.current=wake;
    const poll = async () => {
      if (disposed) return;
      if (lock.current || actionLock.current) { refreshPending=true; return; }
      lock.current = true;
      const revision=actionRevision.current;
      try {
        const { data, error: e } = await supabase.rpc(current.current ? "futsal_state" : "futsal_open", current.current
          ? { p_id: challenge.id }
          : { p_id: challenge.id, p_host: challenge.fromId, p_guest: challenge.toId });
        if (disposed || revision!==actionRevision.current) return;
        if (e) throw e;
        failures=0;
        current.current = data as FutsalState; setState(current.current); setReceivedAt(Date.now());
        if (!actionError.current) setError("");
      } catch (e) { if (!disposed && revision===actionRevision.current) {failures++;setError(String((e as { message?: string })?.message || "No se pudo conectar con la cancha."));} }
      finally {
        if (!disposed) {
          lock.current = false;
          if (!current.current || ["waiting", "playing"].includes(current.current.status)) {
            const waiting=current.current?.status==='waiting';
            const deadline=current.current?Date.parse(current.current.deadline)-Date.parse(current.current.serverNow):Infinity;
            schedule(failures?Math.min(10000,1500*2**Math.min(failures,3)):refreshPending?120:Math.min(waiting?1800:1500,Math.max(150,deadline+60)));
            refreshPending=false;
          }
        }
      }
    };
    // Broadcast is a wake-up hint only. Every state/result still comes from an authenticated RPC.
    // No choices or scores are transmitted on this channel; polling remains the fallback.
    let channel:ReturnType<typeof supabase.channel>|null=null;
    if(typeof supabase.channel==='function'){
      channel=supabase.channel(`futsal-wake:${challenge.id}`,{config:{broadcast:{self:false}}});
      changedChannel.current=channel;
      channel.on('broadcast',{event:'changed'},wake).subscribe(status=>{if(status==='SUBSCRIBED')wake();});
    }
    void poll();
    return () => { disposed = true; if(refreshSoon.current===wake)refreshSoon.current=null; if(changedChannel.current===channel)changedChannel.current=null; if(channel)void supabase.removeChannel(channel).catch(()=>{}); clearTimeout(timer); if (generation.current === token) generation.current++; };
  }, [challenge.id, challenge.fromId, challenge.toId, retry]);
  // Best effort on browser close/navigation. Visibility changes alone do not abandon.
  useEffect(() => {
    let accessToken: string | undefined;
    let disposed = false;
    void supabase.auth.getSession().then(({ data }) => { if (!disposed) accessToken = data.session?.access_token; });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { accessToken = session?.access_token; });
    const exitPage = () => {
      if (!accessToken || !current.current || !["waiting", "playing"].includes(current.current.status)) return;
      void fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/futsal_leave`, {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ p_id: challenge.id }),
      }).catch(() => {});
    };
    window.addEventListener("pagehide", exitPage);
    window.addEventListener("popstate", exitPage);
    return () => { disposed = true; listener.subscription.unsubscribe(); window.removeEventListener("pagehide", exitPage); window.removeEventListener("popstate", exitPage); };
  }, [challenge.id]);
  const action = async (name: "futsal_join" | "futsal_play" | "futsal_leave", choice?: FutsalChoice) => {
    if (actionLock.current || !current.current) return false;
    const token = generation.current;
    const version = current.current.version;
    actionLock.current = true; actionRevision.current++; actionError.current = false; setBusy(true); setError("");
    try {
      // Send immediately. An older background response is ignored by its revision.
      if (name === "futsal_play" && current.current.mineSubmitted) return true;
      const { data, error: e } = await supabase.rpc(name, name === "futsal_play"
        ? { p_id: challenge.id, p_version: version, p_choice: choice }
        : { p_id: challenge.id });
      if (generation.current !== token) return false;
      if (e) throw e;
      current.current = data as FutsalState; setState(current.current); setReceivedAt(Date.now());
      const channel=changedChannel.current;
      if(channel)void channel.send({type:'broadcast',event:'changed',payload:{}}).catch(()=>{});
      return true;
    } catch (e) {
      if (generation.current === token) { actionError.current = true; setError(String((e as { message?: string })?.message || "No se pudo guardar tu decisión. Reintentá.")); }
      return false;
    } finally { if (generation.current === token) { actionLock.current = false; setBusy(false); refreshSoon.current?.(); } }
  };
  return { state, receivedAt, error, busy, join: () => action("futsal_join"), play: (choice: FutsalChoice) => action("futsal_play", choice), leave: () => action("futsal_leave"), reconnect: () => setRetry(n => n + 1) };
}
