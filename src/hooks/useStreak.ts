import { useMemo } from "react";
import type { AppUser } from "../lib/api";
import { isStreakActive, isStreakAtRisk } from "../lib/streak";

export function useStreak(user: AppUser | null) {
  return useMemo(() => {
    const streak = user?.streak ?? 0;
    const bestStreak = user?.best_streak ?? 0;
    // El servidor mueve la racha con cualquier actividad y guarda last_activity_date; last_ticket_date queda como respaldo.
    const lastDate = [user?.last_activity_date, user?.last_ticket_date].filter((d): d is string => !!d).sort().pop() ?? null;
    const activeToday = isStreakActive(lastDate);

    return {
      current: streak,
      best: Math.max(bestStreak, streak),
      activeToday,
      atRisk: isStreakAtRisk(streak, lastDate),
      lastActivity: lastDate,
    };
  }, [user?.streak, user?.best_streak, user?.last_ticket_date, user?.last_activity_date]);
}
