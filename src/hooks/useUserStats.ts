// hooks/useUserStats.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserCardStats } from '../utils/userProgression';

interface UserStats {
  level: number;
  exp: number;
  expNeeded: number;
  rarity: string;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
}

export function useUserStats(userId: string) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userId) return;
    
    try {
      // Solo cargar stats de la carta, no club_rank
      const cardStats = await getUserCardStats(userId);
      setStats(cardStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { stats, loading, refresh: loadData };
}