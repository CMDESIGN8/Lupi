import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";

/** Presentation handshake only; match RPCs start after this screen unmounts. */
export function useDuelEntrance(challenge: Challenge, meId: string, onStart: () => void) {
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
    let disposed = false;
    mine.current = false; peer.current = false; startAt.current = 0; done.current = false;
    setReady(false); setRivalReady(false); setConnected(false); setCancelled(false); setSeconds(null);
    const channel = supabase.channel(`duel-entry:${challenge.id}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;
    const send = (event: string, extra = {}) => void channel.send({ type: "broadcast", event, payload: { fromId: meId, ...extra } });
    const announce = () => {
      if (disposed) return;
      if (mine.current) send("ready");
      if (meId === challenge.fromId && mine.current && peer.current) {
        if (!startAt.current) startAt.current = Date.now() + 3000;
        send("start", { remainingMs: Math.max(0, startAt.current - Date.now()) });
      }
    };
    channel.on("broadcast", { event: "ready" }, ({ payload }) => {
      if (disposed || payload?.fromId !== rivalId || peer.current) return;
      peer.current = true; setRivalReady(true); announce();
    }).on("broadcast", { event: "start" }, ({ payload }) => {
      if (disposed || meId === challenge.fromId || payload?.fromId !== challenge.fromId || !mine.current || startAt.current) return;
      const remaining = Number(payload.remainingMs);
      if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 3000) return;
      peer.current = true; setRivalReady(true); startAt.current = Date.now() + remaining;
    }).on("broadcast", { event: "cancel" }, ({ payload }) => {
      if (disposed || payload?.fromId !== rivalId) return;
      startAt.current = 0; mine.current = false; setCancelled(true); setSeconds(null);
    }).subscribe(status => { if (!disposed) { setConnected(status === "SUBSCRIBED"); if (status === "SUBSCRIBED") announce(); } });
    const heartbeat = window.setInterval(announce, 700);
    const clock = window.setInterval(() => {
      if (!startAt.current || done.current || disposed) return;
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
  return { ready, rivalReady, connected, cancelled, seconds, confirm, cancel };
}
