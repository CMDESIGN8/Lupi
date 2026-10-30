import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
export type TriviaRoundResult = { round: number; prompt: string; correct: string; hostCorrect: boolean; guestCorrect: boolean };
export type TriviaState = {
  id: string; round: number; total: number; hostScore: number; guestScore: number;
  status: "playing" | "finished" | "expired"; winnerId: string | null;
  mineSubmitted: boolean; opponentSubmitted: boolean; deadline: string; serverNow: string;
  question: { prompt: string; options: string[] } | null;
  lastResult: TriviaRoundResult | null;
  history?: TriviaRoundResult[];
  rematch?: { status: "pending" | "accepted" | "declined" | "expired" | "cancelled" | null; requestedBy: string | null; deadline: string | null; id: string | null };
};
export function useTriviaMatch(challenge: Challenge) {
  const [state, setState] = useState<TriviaState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const session = useRef(0);
  const lock = useRef(false);
  const latest = useRef<TriviaState | null>(null);
  useEffect(() => {
    const token = ++session.current;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    lock.current = false; latest.current = null; setState(null); setBusy(false); setError("");
    const read = async (start = false) => {
      if (stopped) return;
      if (lock.current) { timer = setTimeout(() => void read(), 1200); return; }
      lock.current = true;
      try {
        const { data, error: e } = await supabase.rpc(start ? "trivia_start" : "trivia_state", start
          ? { p_id: challenge.id, p_host: challenge.fromId, p_guest: challenge.toId }
          : { p_id: challenge.id });
        if (stopped) return;
        if (e) throw e;
        latest.current = data as TriviaState; setState(latest.current); setError("");
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : String((e as { message?: string })?.message || "No se pudo conectar. Reintentá."));
      } finally {
        if (!stopped) {
          lock.current = false;
          if (latest.current?.rematch?.status !== "accepted") timer = setTimeout(() => void read(!latest.current), 1200);
        }
      }
    };
    void read(true);
    return () => { stopped = true; clearTimeout(timer); if (session.current === token) session.current++; };
  }, [challenge.id, challenge.fromId, challenge.toId, retry]);
  const answer = async (index: number) => {
    const current = latest.current;
    if (lock.current || !current || current.mineSubmitted || current.status !== "playing") return false;
    const token = session.current;
    lock.current = true; setBusy(true);
    try {
      const { data, error: e } = await supabase.rpc("trivia_answer", { p_id: challenge.id, p_round: current.round, p_answer: index });
      if (session.current !== token) return false;
      if (e) throw e;
      latest.current = data as TriviaState; setState(latest.current); setError("");
      return true;
    } catch (e) {
      if (session.current === token) setError(String((e as { message?: string })?.message || "No se pudo enviar. Reintentá."));
      return false;
    } finally { if (session.current === token) { lock.current = false; setBusy(false); } }
  };
  const rematch = async (action: "request" | "accept" | "decline" | "cancel") => {
    if (lock.current) return;
    const token = session.current;
    lock.current = true; setBusy(true);
    try {
      const { data, error: e } = await supabase.rpc("trivia_rematch", { p_id: challenge.id, p_action: action });
      if (session.current !== token) return;
      if (e) throw e;
      latest.current = data as TriviaState; setState(latest.current); setError("");
    } catch (e) {
      if (session.current === token) setError(String((e as { message?: string })?.message || "No se pudo enviar la revancha."));
    } finally { if (session.current === token) { lock.current = false; setBusy(false); } }
  };
  return { state, error, busy, answer, rematch, reconnect: () => setRetry(n => n + 1) };
}
