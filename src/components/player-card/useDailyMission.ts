// src/components/player-card/useDailyMission.ts
// Misión del día: placeholder determinístico por usuario+día.
// Reemplazar por fetch a Supabase (tabla daily_missions) cuando esté lista.
import { useMemo } from "react";

export type DailyMission = {
  description: string;
  current: number;
  target: number;
  /** 0..1 */
  progress: number;
  xpReward: number;
  done: boolean;
};

export function useDailyMission(userId: string): DailyMission | null {
  return useMemo(() => {
    if (!userId) return null;
    const day = new Date().toISOString().slice(0, 10);
    const seed = [...(userId + day)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const target = 3;
    const current = seed % (target + 1);
    return {
      description: "Jugá 3 partidos hoy para mantener la racha.",
      current,
      target,
      progress: current / target,
      xpReward: 120,
      done: current >= target,
    };
  }, [userId]);
}