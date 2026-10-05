// src/hooks/useLobbyModeration.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type ReportReason = "spam" | "abuso" | "acoso" | "otro";

const KEY_PREFIX = "lupi:lobby-muted:";
const MAX_MUTED = 200;

function load(meId: string): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(`${KEY_PREFIX}${meId}`) || "[]");
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id): id is string => typeof id === "string").slice(0, MAX_MUTED));
  } catch {
    return new Set();
  }
}

function save(meId: string, muted: Set<string>) {
  try {
    localStorage.setItem(`${KEY_PREFIX}${meId}`, JSON.stringify([...muted].slice(-MAX_MUTED)));
  } catch {
    // Silenciar sigue funcionando en memoria aunque localStorage no esté disponible.
  }
}

export function useLobbyModeration(meId: string) {
  const [muted, setMuted] = useState<Set<string>>(() => load(meId));

  useEffect(() => {
    setMuted(load(meId));
  }, [meId]);

  const isMuted = useCallback((userId: string) => muted.has(userId), [muted]);

  const toggleMute = useCallback(
    (userId: string) => {
      if (!userId || userId === meId) return;
      setMuted((current) => {
        const next = new Set(current);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        save(meId, next);
        return next;
      });
    },
    [meId]
  );

  /** Devuelve true si el reporte se guardó. reporter_id lo pone la base (auth.uid()). */
  const report = useCallback(
    async (reportedId: string, reason: ReportReason, messageId?: string) => {
      if (!reportedId || reportedId === meId) return false;
      const { error } = await supabase.from("lobby_reports").insert({
        reported_id: reportedId,
        reason,
        message_id: messageId ?? null,
      });
      return !error;
    },
    [meId]
  );

  return { muted, isMuted, toggleMute, report };
}