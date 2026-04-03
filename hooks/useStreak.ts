// hooks/useStreak.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastTicketDate: string | null;
  canClaimReward: boolean;
  nextMilestone: number;
  daysUntilNextMilestone: number;
}

export function useStreak(userId: string | undefined) {
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    bestStreak: 0,
    lastTicketDate: null,
    canClaimReward: false,
    nextMilestone: 3,
    daysUntilNextMilestone: 3
  });
  const [loading, setLoading] = useState(true);

  const loadStreak = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('streak, best_streak, last_ticket_date')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const currentStreak = profile?.streak || 0;
      const bestStreak = profile?.best_streak || 0;
      const lastTicketDate = profile?.last_ticket_date;

      // Calcular próximo hito
      let nextMilestone = 3;
      if (currentStreak >= 30) nextMilestone = 60;
      else if (currentStreak >= 14) nextMilestone = 30;
      else if (currentStreak >= 7) nextMilestone = 14;
      else if (currentStreak >= 3) nextMilestone = 7;
      else nextMilestone = 3;

      const daysUntilNextMilestone = nextMilestone - currentStreak;

      // Verificar si puede reclamar recompensa (para días específicos)
      const canClaimReward = [3, 7, 14, 30].includes(currentStreak);

      setStreakInfo({
        currentStreak,
        bestStreak,
        lastTicketDate,
        canClaimReward,
        nextMilestone,
        daysUntilNextMilestone
      });
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  return { streakInfo, loading, refreshStreak: loadStreak };
}