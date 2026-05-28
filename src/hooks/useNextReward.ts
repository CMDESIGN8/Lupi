// hooks/useNextReward.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LEAGUES } from '../data/campaignData';

interface NextReward {
  type: 'league' | 'mission' | 'match';
  icon: string;
  amount: number;
  description: string;
  nextLeagueName?: string;
}

export function useNextReward(userId: string | undefined) {
  const [reward, setReward] = useState<NextReward>({
    type: 'match',
    icon: '⚽',
    amount: 15,
    description: 'Por partido ganado'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchNextReward = async () => {
      try {
        // 1. Obtener progreso de campaña
        const { data: campaignProgress } = await supabase
          .from('campaign_progress')
          .select('current_league_id, completed_league_ids')
          .eq('user_id', userId)
          .maybeSingle();

        const currentLeagueId = campaignProgress?.current_league_id || 'rookie';
        const completedLeagueIds = campaignProgress?.completed_league_ids || [];
        
        // 2. Encontrar la liga actual y la siguiente
        const currentLeagueIndex = LEAGUES.findIndex(l => l.id === currentLeagueId);
        const currentLeague = LEAGUES[currentLeagueIndex];
        const nextLeague = LEAGUES[currentLeagueIndex + 1];
        
        // 3. Verificar si hay una misión diaria disponible
        const today = new Date().toDateString();
        const { data: dailyMission } = await supabase
          .from('daily_missions')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .eq('is_completed', false)
          .maybeSingle();
        
        // 4. Determinar qué recompensa mostrar (prioridad: misión > siguiente liga > partido)
        if (dailyMission && dailyMission.reward_xp) {
          setReward({
            type: 'mission',
            icon: '🎯',
            amount: dailyMission.reward_xp,
            description: `Completar: ${dailyMission.title || 'misión diaria'}`
          });
        } else if (nextLeague) {
          // Mostrar recompensa de la siguiente liga
          setReward({
            type: 'league',
            icon: nextLeague.icon || '🏆',
            amount: nextLeague.rewardPoints,
            description: `Completar ${nextLeague.name}`,
            nextLeagueName: nextLeague.name
          });
        } else {
          // Recompensa por partido normal
          const currentMatches = currentLeague?.bots || [];
          const nextMatch = currentMatches.find((_, idx) => {
            // Verificar si este partido no está completado
            return true; // Lógica simplificada
          });
          
          setReward({
            type: 'match',
            icon: '⚽',
            amount: nextMatch?.xpBase || 15,
            description: 'Por ganar el próximo partido'
          });
        }
      } catch (err) {
        console.error('Error fetching next reward:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNextReward();

    // Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel(`next_reward_${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_progress', filter: `user_id=eq.${userId}` },
        () => fetchNextReward()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'daily_missions', filter: `user_id=eq.${userId}` },
        () => fetchNextReward()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { reward, loading };
}