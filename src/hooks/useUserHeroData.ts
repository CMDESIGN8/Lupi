// hooks/useUserHeroData.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LEAGUES } from '../data/campaignData';

interface UserHeroData {
  level: number;
  exp: number;
  expNeeded: number;
  division: string;
  nextRewardCoins: number;
  nextRewardIcon: string;
  nextRewardDescription: string;
}

export function useUserHeroData(userId: string | undefined) {
  const [data, setData] = useState<UserHeroData>({
    level: 1,
    exp: 0,
    expNeeded: 100,
    division: 'BRONCE',
    nextRewardCoins: 30,
    nextRewardIcon: '⚽',
    nextRewardDescription: 'Ganar un partido'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchHeroData = async () => {
      try {
        // 1. Obtener perfil del usuario (puntos, nivel, exp)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('points, level, exp')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        const points = profile?.points || 0;
        const level = profile?.level || 1;
        const currentExp = profile?.exp || 0;
        const expNeeded = level * 100;

        // 2. Calcular división por puntos
        let division = 'BRONCE';
        if (points >= 2000) division = 'ORO';
        else if (points >= 1000) division = 'PLATA';

        // 3. Calcular próxima recompensa basada en campaña
        let nextRewardCoins = 30;
        let nextRewardIcon = '⚽';
        let nextRewardDescription = 'Ganar un partido';

        // Obtener progreso de campaña
        const { data: campaignProgress, error: campaignError } = await supabase
          .from('campaign_progress')
          .select('current_league_id, completed_league_ids')
          .eq('user_id', userId)
          .maybeSingle();

        if (!campaignError && campaignProgress) {
          const currentLeagueId = campaignProgress.current_league_id || 'rookie';
          const currentLeagueIndex = LEAGUES.findIndex(l => l.id === currentLeagueId);
          const nextLeague = LEAGUES[currentLeagueIndex + 1];

          if (nextLeague) {
            nextRewardCoins = nextLeague.rewardPoints;
            nextRewardIcon = nextLeague.icon || '🏆';
            nextRewardDescription = `Completar ${nextLeague.name}`;
          }
        }

        if (isMounted) {
          setData({
            level,
            exp: currentExp,
            expNeeded,
            division,
            nextRewardCoins,
            nextRewardIcon,
            nextRewardDescription
          });
        }
      } catch (err) {
        console.error('Error in useUserHeroData:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHeroData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { data, loading };
}