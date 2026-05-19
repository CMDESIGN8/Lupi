// src/hooks/useSeason.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  bossName: string;
  bossIcon: string;
  bossOvr: number;
  rewardCardId?: string;
  rewardCardName?: string;
}

export interface SeasonProgress {
  wins: number;
  bossDefeated: boolean;
  rewardsClaimed: string[];
}

export function useSeason(userId: string) {
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [seasonProgress, setSeasonProgress] = useState<SeasonProgress>({ wins: 0, bossDefeated: false, rewardsClaimed: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeason();
  }, [userId]);

  const loadSeason = async () => {
    setLoading(true);
    try {
      // Obtener temporada activa
      const { data: season } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (season) {
        setCurrentSeason({
          id: season.id,
          name: season.name,
          startDate: new Date(season.start_date),
          endDate: new Date(season.end_date),
          bossName: season.boss_name,
          bossIcon: season.boss_icon,
          bossOvr: season.boss_ovr,
          rewardCardId: season.reward_card_id,
          rewardCardName: season.reward_card_name,
        });
      }

      // Obtener progreso
      const { data: progress } = await supabase
        .from('season_progress')
        .select('wins, boss_defeated, rewards_claimed')
        .eq('user_id', userId)
        .eq('season_id', season?.id)
        .single();

      if (progress) {
        setSeasonProgress({
          wins: progress.wins || 0,
          bossDefeated: progress.boss_defeated || false,
          rewardsClaimed: progress.rewards_claimed || [],
        });
      }
    } catch (error) {
      console.error('Error loading season:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordSeasonWin = async (defeatedBoss: boolean = false) => {
    if (!currentSeason) return;

    const newWins = seasonProgress.wins + 1;
    const updates: any = { wins: newWins };
    
    if (defeatedBoss) {
      updates.boss_defeated = true;
    }

    const { error } = await supabase
      .from('season_progress')
      .upsert({
        user_id: userId,
        season_id: currentSeason.id,
        ...updates,
        rewards_claimed: seasonProgress.rewardsClaimed,
      });

    if (!error) {
      setSeasonProgress(prev => ({
        ...prev,
        wins: newWins,
        bossDefeated: defeatedBoss || prev.bossDefeated,
      }));
    }
  };

  const claimReward = async (rewardId: string) => {
    if (!currentSeason || seasonProgress.rewardsClaimed.includes(rewardId)) return;

    const newRewards = [...seasonProgress.rewardsClaimed, rewardId];
    const { error } = await supabase
      .from('season_progress')
      .update({ rewards_claimed: newRewards })
      .eq('user_id', userId)
      .eq('season_id', currentSeason.id);

    if (!error) {
      setSeasonProgress(prev => ({ ...prev, rewardsClaimed: newRewards }));
      return true;
    }
    return false;
  };

  const isBossAvailable = seasonProgress.wins >= 10 && !seasonProgress.bossDefeated;
  const winsToBoss = Math.max(0, 10 - seasonProgress.wins);

  return {
    currentSeason,
    seasonProgress,
    loading,
    recordSeasonWin,
    claimReward,
    isBossAvailable,
    winsToBoss,
  };
}