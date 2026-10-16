// hooks/usePacksCount.ts - Actualizar para contar también packs diarios no reclamados
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePacksCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPackCount = useCallback(async () => {
    if (!userId) { setCount(0); setLoading(false); return; }
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Contar packs sin abrir de la tabla user_packs
        const { count: packsCount, error: packsError } = await supabase
          .from('user_packs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('opened', false);

        if (packsError) console.error('Error fetching packs:', packsError);

        // 2. Verificar si el daily reward de hoy no está reclamado
        const { data: dailyReward, error: dailyError } = await supabase
          .from('daily_rewards')
          .select('claimed')
          .eq('user_id', userId)
          .eq('reward_date', today)
          .maybeSingle();

        if (dailyError && dailyError.code !== 'PGRST116') {
          console.error('Error fetching daily reward:', dailyError);
        }

        const hasDailyPack = !dailyReward?.claimed;
        const totalCount = (packsCount || 0) + (hasDailyPack ? 1 : 0);

        setCount(totalCount);
      } catch (err) {
        console.error('Error in usePacksCount:', err);
      } finally {
        setLoading(false);
      }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void fetchPackCount();
    const onRefresh = () => { void fetchPackCount(); };
    window.addEventListener("lupi:packs-updated", onRefresh);
    window.addEventListener("focus", onRefresh);

    const subscription = supabase
      .channel(`packs_${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_packs', filter: `user_id=eq.${userId}` },
        () => fetchPackCount()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'daily_rewards', filter: `user_id=eq.${userId}` },
        () => fetchPackCount()
      )
      .subscribe();

    return () => {
      window.removeEventListener("lupi:packs-updated", onRefresh);
      window.removeEventListener("focus", onRefresh);
      void supabase.removeChannel(subscription);
    };
  }, [userId, fetchPackCount]);

  return { count, loading, refresh: fetchPackCount };
}