import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/** Mejor racha de victorias actual entre tus juegos de duelo (se refresca al terminar cada duelo). */
export function useDuelStreak(userId: string | undefined) {
  const [streak, setStreak] = useState(0);
  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("duel_stats").select("win_streak").eq("user_id", userId);
    if (error || !data) return;   // si la tabla todavía no existe, queda en 0
    setStreak(Math.min(99, Math.max(0, ...data.map((r: { win_streak: number }) => Number(r.win_streak) || 0))));
  }, [userId]);
  useEffect(() => {
    void load();
    const onProgress = (e: Event) => { if ((e as CustomEvent).detail?.actionType === "duel") void load(); };
    window.addEventListener("lupi:progression-updated", onProgress);
    return () => window.removeEventListener("lupi:progression-updated", onProgress);
  }, [load]);
  return streak;
}
