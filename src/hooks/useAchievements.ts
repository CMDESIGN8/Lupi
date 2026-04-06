import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppUser } from '../lib/api';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  condition_type: string;
  condition_value: number;
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

export function useAchievements(user: AppUser | null) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los logros disponibles
  const loadAllAchievements = useCallback(async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('condition_value', { ascending: true });
    
    if (!error && data) {
      setAllAchievements(data);
    }
  }, []);

  // Cargar logros desbloqueados del usuario
  const loadUnlockedAchievements = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('achievements_unlocked')
      .select(`
        *,
        achievements:achievement_id (*)
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });
    
    if (!error && data) {
      setUnlockedAchievements(data);
    }
    setLoading(false);
  }, [user]);

  // Verificar y desbloquear nuevos logros
  const checkAndUnlock = useCallback(async (ctx: AchievementContext) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_and_unlock_achievements', {
        p_user_id: user.id
      });

      if (!error && data) {
        // Recargar logros desbloqueados
        await loadUnlockedAchievements();
        
        // Mostrar toasts para nuevos logros
        const newlyUnlocked = data.filter((d: any) => d.newly_unlocked);
        for (const unlocked of newlyUnlocked) {
          const achievement = allAchievements.find(a => a.id === unlocked.achievement_id);
          if (achievement) {
            setToastQueue(prev => [...prev, achievement]);
          }
        }
      }
    } catch (err) {
      console.error('Error checking achievements:', err);
    }
  }, [user, allAchievements, loadUnlockedAchievements]);

  // Efecto inicial
  useEffect(() => {
    loadAllAchievements();
    loadUnlockedAchievements();
  }, [loadAllAchievements, loadUnlockedAchievements]);

  // Calcular progreso para un tipo específico
  const getProgress = useCallback((conditionType: string, target: number): number => {
    // Esta función debería calcular el progreso actual basado en el contexto
    // Por ahora retorna 0, se puede implementar más adelante
    return 0;
  }, []);

  return {
    unlockedAchievements,
    allAchievements,
    toastQueue,
    setToastQueue,
    loading,
    checkAndUnlock,
    getProgress,
    loadUnlockedAchievements
  };
}