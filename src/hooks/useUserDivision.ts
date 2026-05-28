// hooks/useUserDivision.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserDivisionData {
  division: string;        // División basada en puntos (BRONCE, PLATA, ORO)
  campaignLeagueId: string; // Liga actual en campaña (rookie, bronze, silver, gold)
  campaignLeagueName: string;
  points: number;
  level: number;
}

export function useUserDivision(userId: string | undefined) {
  const [data, setData] = useState<UserDivisionData>({
    division: 'BRONCE',
    campaignLeagueId: 'rookie',
    campaignLeagueName: 'LIGA ROOKIE',
    points: 0,
    level: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchDivisionData = async () => {
      try {
        // 1. Obtener puntos del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('points, level')
          .eq('id', userId)
          .single();

        const points = profile?.points || 0;
        const level = profile?.level || 1;

        // 2. Calcular división por puntos (para HomeHero)
        let division = 'BRONCE';
        if (points >= 2000) division = 'ORO';
        else if (points >= 1000) division = 'PLATA';

        // 3. Obtener progreso de campaña (para CampaignMode)
        const { data: campaignProgress } = await supabase
          .from('campaign_progress')
          .select('current_league_id, completed_league_ids')
          .eq('user_id', userId)
          .maybeSingle();

        // Mapeo de IDs de liga a nombres
        const leagueNames: Record<string, string> = {
          'rookie': 'LIGA ROOKIE',
          'bronze': 'LIGA BRONCE',
          'silver': 'LIGA PLATA',
          'gold': 'LIGA ORO',
          'platinum': 'LIGA PLATINO',
          'legend': 'LIGA LEYENDA'
        };

        const currentLeagueId = campaignProgress?.current_league_id || 'rookie';
        const campaignLeagueName = leagueNames[currentLeagueId] || currentLeagueId.toUpperCase();

        if (isMounted) {
          setData({
            division,
            campaignLeagueId: currentLeagueId,
            campaignLeagueName,
            points,
            level
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching division data:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDivisionData();

    // Suscripción a cambios - CORREGIDO
    const subscription = supabase
      .channel(`division_${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          // Llamar a fetchDivisionData sin esperar directamente
          fetchDivisionData();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_progress', filter: `user_id=eq.${userId}` },
        () => {
          fetchDivisionData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [userId]);

  return { data, loading };
}