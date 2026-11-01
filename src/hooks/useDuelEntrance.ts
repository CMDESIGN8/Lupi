import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { trackDuel } from "../lib/duelTelemetry";
import type { Challenge } from "./useLobbyChallenges";

/** Presentation handshake only; match RPCs start after this screen unmounts. */
export function useDuelEntrance(challenge: Challenge, meId: string, onStart: () => void) {
  const [timedOut,setTimedOut]=useState(false);
  const [ready, setReady] = useState(false);
  const [rivalReady, setRivalReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const mine = useRef(false), peer = useRef(false), startAt = useRef(0), done = useRef(false);
  const callback = useRef(onStart); callback.current = onStart;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const rivalId = meId === challenge.fromId ? challenge.toId : challenge.fromId;
  useEffect(() => {
    let disposed = false, aborted=false, peerSeen=Date.now();
    const openedAt=Date.now();
    mine.current = false; peer.current = false; startAt.current = 0; done.current = false;
    setReady(false); setRivalReady(false); setConnected(false); setCancelled(false); setSeconds(null);setTimedOut(false);
    const channel = supabase.channel(`duel-entry:${challenge.id}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;
    const send = (event: string, extra = {}) => void channel.send({ type: "broadcast", event, payload: { fromId: meId, ...extra } });
    const announce = () => {
      if (disposed || aborted || done.current) return;
      send("alive");
      if (mine.current) send("ready");
      if (meId === challenge.fromId && mine.current && peer.current) {
        if (!startAt.current) startAt.current = Date.now() + 3000;
        send("start", { remainingMs: Math.max(0, startAt.current - Date.now()) });
      }
    };
    channel.on("broadcast",{event:"alive"},({payload})=>{if(payload?.fromId===rivalId)peerSeen=Date.now();}).on("broadcast", { event: "ready" }, ({ payload }) => {
      if (disposed || aborted || payload?.fromId !== rivalId || peer.current) return;
      peerSeen=Date.now();
      peer.current = true; setRivalReady(true); announce();
    }).on("broadcast", { event: "start" }, ({ payload }) => {
      if (disposed || aborted || meId === challenge.fromId || payload?.fromId !== challenge.fromId || !mine.current || startAt.current) return;
      const remaining = Number(payload.remainingMs);
      if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 3000) return;
      peer.current = true; setRivalReady(true); startAt.current = Date.now() + remaining;
    }).on("broadcast", { event: "cancel" }, ({ payload }) => {
      if (disposed || payload?.fromId !== rivalId) return;
      aborted=true;startAt.current = 0; mine.current = false; setCancelled(true); setSeconds(null);
    }).subscribe(status => { if (!disposed) { setConnected(status === "SUBSCRIBED"); if (status === "SUBSCRIBED") announce(); } });
    const heartbeat = window.setInterval(announce, 700);
    const clock = window.setInterval(() => {
      if(done.current||disposed||aborted)return;
      if(Date.now()-openedAt>45000 || Date.now()-peerSeen>15000){aborted=true;startAt.current=0;setTimedOut(true);setCancelled(true);setSeconds(null);send("cancel");trackDuel("entrance_timeout",challenge.gameType,Date.now()-openedAt);return;}
      if (!startAt.current) return;
      const remaining = Math.max(0, Math.ceil((startAt.current - Date.now()) / 1000));
      setSeconds(Math.min(3, remaining));
      if (remaining === 0) { done.current = true; callback.current(); }
    }, 100);
    return () => { disposed = true; window.clearInterval(heartbeat); window.clearInterval(clock); channelRef.current = null; void supabase.removeChannel(channel); };
  }, [challenge.id, challenge.fromId, rivalId, meId]);
  const confirm = () => {
    if (!connected || cancelled || mine.current) return;
    mine.current = true; setReady(true);
    void channelRef.current?.send({ type: "broadcast", event: "ready", payload: { fromId: meId } });
  };
  const cancel = () => { void channelRef.current?.send({ type: "broadcast", event: "cancel", payload: { fromId: meId } }); };
  return { timedOut, ready, rivalReady, connected, cancelled, seconds, confirm, cancel };
}
