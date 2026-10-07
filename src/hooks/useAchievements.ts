import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppUser } from '../lib/api';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UnlockedAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements?: Achievement;
}

export interface AchievementContext {
  user: AppUser;
  totalTickets: number;
  completedMissions: number;
  rank: number;
  jackpotWon: boolean;
}

type UserStats = {
  total_tickets?: number;
  totalTickets?: number;

  current_streak?: number;
  currentStreak?: number;

  best_streak?: number;
  bestStreak?: number;

  current_rank?: number;
  currentRank?: number;

  referral_count?: number;
  referrals?: number;
  total_referrals?: number;

  completed_missions?: number;
  completedMissions?: number;

  jackpot_won?: boolean;
  jackpotWon?: boolean;
};

export function useAchievements(user: AppUser | null) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievement[]
  >([]);

  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);

  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  const [loading, setLoading] = useState(true);

  const [userStats, setUserStats] = useState<UserStats>({});

  // =========================================================
  // TODAS LAS DEFINICIONES DE LOGROS
  // =========================================================

  const loadAllAchievements = useCallback(async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) {
      console.error('🏆 Error cargando achievements:', error);
      return;
    }

    console.log('🏆 ALL ACHIEVEMENTS:', data);

    setAllAchievements(data ?? []);
  }, []);

  // =========================================================
  // STATS DEL USUARIO
  // =========================================================

  const loadUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_stats', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('🏆 Error cargando user stats:', error);
        return;
      }

      console.log('🏆 USER STATS:', data);

      if (data && typeof data === 'object') {
        setUserStats(data as UserStats);
      }
    } catch (error) {
      console.error('🏆 Error inesperado cargando user stats:', error);
    }
  }, [user]);

  // =========================================================
  // LOGROS DESBLOQUEADOS
  // =========================================================

  const loadUnlockedAchievements = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data: unlockedData, error: unlockedError } = await supabase
        .from('achievements_unlocked')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (unlockedError) {
        console.error(
          '🏆 Error cargando achievements_unlocked:',
          unlockedError
        );

        setUnlockedAchievements([]);
        return;
      }

      if (!unlockedData || unlockedData.length === 0) {
        console.log('🏆 Usuario sin logros desbloqueados');

        setUnlockedAchievements([]);
        return;
      }

      const achievementIds = unlockedData.map(
        item => item.achievement_id
      );

      const { data: achievementsData, error: achievementsError } =
        await supabase
          .from('achievements')
          .select('*')
          .in('id', achievementIds);

      if (achievementsError) {
        console.error(
          '🏆 Error cargando achievements:',
          achievementsError
        );

        setUnlockedAchievements([]);
        return;
      }

      const achievementsMap = new Map(
        (achievementsData ?? []).map(achievement => [
          achievement.id,
          achievement,
        ])
      );

      const merged = unlockedData.map(unlocked => ({
        ...unlocked,
        achievements: achievementsMap.get(unlocked.achievement_id),
      }));

      console.log('🏆 ACHIEVEMENTS UNLOCKED:', merged);

      setUnlockedAchievements(merged);
    } catch (error) {
      console.error(
        '🏆 Error inesperado cargando achievements:',
        error
      );

      setUnlockedAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // =========================================================
  // PROGRESO REAL
  // =========================================================

  const getProgress = useCallback(
    (conditionType: string, target: number): number => {
      if (!user) return 0;

      switch (conditionType) {
        // -----------------------------------------
        // ENTRADAS
        // -----------------------------------------

        case 'total_tickets': {
          return (
            userStats.total_tickets ??
            userStats.totalTickets ??
            0
          );
        }

        // -----------------------------------------
        // PUNTOS
        // -----------------------------------------

        case 'points': {
          return Number(user.points ?? 0);
        }

        // -----------------------------------------
        // RACHA
        // -----------------------------------------

        case 'streak': {
          const current =
            userStats.current_streak ??
            userStats.currentStreak ??
            0;

          const best =
            userStats.best_streak ??
            userStats.bestStreak ??
            0;

          // Usamos la mejor racha histórica porque el logro
          // debe quedar conseguido aunque luego se rompa la racha.
          return Math.max(current, best);
        }

        // -----------------------------------------
        // RANKING
        // -----------------------------------------

        case 'rank': {
          const rank =
            userStats.current_rank ??
            userStats.currentRank ??
            0;

          if (!rank || rank <= 0) return 0;

          /*
           * Para ranking:
           *
           * puesto 10 → 0/5
           * puesto 5  → 1/5
           * puesto 3  → 3/5
           * puesto 1  → 5/5
           *
           * Esto permite mostrar progreso visual.
           */
          return Math.max(0, target - rank + 1);
        }

        // -----------------------------------------
        // REFERIDOS
        // -----------------------------------------

        case 'referrals': {
          return (
            userStats.referral_count ??
            userStats.referrals ??
            userStats.total_referrals ??
            0
          );
        }

        // -----------------------------------------
        // MISIONES
        // -----------------------------------------

        case 'missions': {
          return (
            userStats.completed_missions ??
            userStats.completedMissions ??
            0
          );
        }

        // -----------------------------------------
        // JACKPOT
        // -----------------------------------------

        case 'jackpot': {
          const won =
            userStats.jackpot_won ??
            userStats.jackpotWon ??
            false;

          return won ? 1 : 0;
        }

        default:
          return 0;
      }
    },
    [user, userStats]
  );

  // =========================================================
  // CHECK + UNLOCK
  // =========================================================

  const checkAndUnlock = useCallback(
    async (ctx: AchievementContext) => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc(
          'check_and_unlock_achievements',
          {
            p_user_id: user.id,
          }
        );

        if (error) {
          console.error(
            '🏆 Error verificando achievements:',
            error
          );
          return;
        }

        console.log('🏆 CHECK ACHIEVEMENTS:', data);

        if (data) {
          await loadUnlockedAchievements();
          await loadUserStats();

          const newlyUnlocked = data.filter(
            (item: any) => item.newly_unlocked
          );

          for (const unlocked of newlyUnlocked) {
            const achievement = allAchievements.find(
              a => a.id === unlocked.achievement_id
            );

            if (achievement) {
              setToastQueue(prev => [
                ...prev,
                achievement,
              ]);
            }
          }
        }
      } catch (error) {
        console.error(
          '🏆 Error inesperado checking achievements:',
          error
        );
      }
    },
    [
      user,
      allAchievements,
      loadUnlockedAchievements,
      loadUserStats,
    ]
  );

  // =========================================================
  // INIT
  // =========================================================

  useEffect(() => {
    if (!user) return;

    loadAllAchievements();
    loadUnlockedAchievements();
    loadUserStats();
  }, [
    user,
    loadAllAchievements,
    loadUnlockedAchievements,
    loadUserStats,
  ]);

  return {
    unlockedAchievements,
    allAchievements,
    toastQueue,
    setToastQueue,
    loading,

    checkAndUnlock,

    getProgress,

    loadUnlockedAchievements,
    loadUserStats,
  };
}