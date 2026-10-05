import { useMemo } from "react";
import type { AppUser } from "../lib/api";
import { isStreakActive, isStreakAtRisk } from "../lib/streak";

export function useStreak(user: AppUser | null) {
  return useMemo(() => {
    const streak = user?.streak ?? 0;
    const bestStreak = user?.best_streak ?? 0;
    const activeToday = isStreakActive(user?.last_ticket_date);

    return {
      current: streak,
      best: Math.max(bestStreak, streak),
      activeToday,
      atRisk: isStreakAtRisk(streak, user?.last_ticket_date),
      lastActivity: user?.last_ticket_date ?? null,
    };
  }, [user?.streak, user?.best_streak, user?.last_ticket_date]);
}
