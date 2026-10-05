// src/hooks/usePendingRewards.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function usePendingRewards(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const check = useCallback(async () => {
    if (!userId) return;

    let hasPack = false;
    let missionsCount = 0;

    // 1. Chequear sobre diario (si la tabla no existe, devuelve 404 y no rompe)
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_packs")
        .select("id")
        .eq("user_id", userId)
        .eq("claimed_date", today)
        .maybeSingle();

      // Solo contamos si la tabla existe Y no hay fila (sin reclamar)
      if (!error) hasPack = !data;
    } catch {
      // tabla no existe todavía — ignorar silenciosamente
    }

    // 2. Chequear misiones completadas sin reclamar
    try {
      const { data, error } = await supabase
        .from("user_missions")
        .select("id")
        .eq("user_id", userId)
        .eq("completed", true)
        .eq("claimed", false);

      if (!error && data) missionsCount = data.length;
    } catch {
      // tabla no existe todavía — ignorar silenciosamente
    }

    setCount((hasPack ? 1 : 0) + missionsCount);
  }, [userId]);

  useEffect(() => {
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [check]);

  return { count, refresh: check };
}