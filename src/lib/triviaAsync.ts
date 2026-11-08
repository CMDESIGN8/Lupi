import { supabase } from "./supabaseClient";

export type AsyncTriviaQuestion = { index: number; prompt: string; options: string[] };
export type AsyncTriviaLast = { index: number; prompt: string; explanation?: string; topic?: string; options: string[]; correctIndex: number; mine: number; ok: boolean; timeout: boolean; ms: number };
export type AsyncTriviaHistory = { prompt: string; correct: string; explanation?: string; hostOk: boolean; guestOk: boolean };

export type AsyncTriviaState = {
  id: string; mode: "async"; status: "open" | "finished" | "expired" | "declined"; role: "host" | "guest";
  hostId: string; guestId: string; total: number;
  myIndex: number; myScore: number; mineDone: boolean; opponentDone: boolean; opponentAnswered: number;
  question: AsyncTriviaQuestion | null; awaitingNext: boolean; qStartedAt: string | null; serverNow: string; timeLimitMs: number;
  deadline: string; lastResult: AsyncTriviaLast | null;
  winnerId: string | null; forfeit: boolean; finishedAt: string | null;
  hostScore: number | null; guestScore: number | null; history: AsyncTriviaHistory[] | null;
};

export type AsyncTriviaListItem = {
  id: string; role: "host" | "guest"; rivalId: string; rivalName: string; status: "open" | "finished";
  myIndex: number; rivalDone: boolean; deadline: string; finishedAt: string | null; winnerId: string | null; forfeit: boolean;
  needsAction: boolean; unseen: boolean;
};

export const newAsyncId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16); });

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const asyncStart = (id: string, guestId: string) => rpc<AsyncTriviaState>("trivia_async_start", { p_id: id, p_guest: guestId });
export const asyncState = (id: string) => rpc<AsyncTriviaState>("trivia_async_state", { p_id: id });
export const asyncAnswer = (id: string, index: number, answer: number) => rpc<AsyncTriviaState>("trivia_async_answer", { p_id: id, p_index: index, p_answer: answer });
export const asyncList = () => rpc<AsyncTriviaListItem[]>("trivia_async_list");
export const asyncDecline = (id: string) => rpc<{ ok: boolean }>("trivia_async_decline", { p_id: id });
export const asyncSeen = (id: string) => rpc<{ ok: boolean }>("trivia_async_seen", { p_id: id });
