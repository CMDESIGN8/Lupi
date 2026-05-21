// src/hooks/useTrainingSystem.ts
// ─────────────────────────────────────────────────────────────────────────────
// VERSIÓN CORREGIDA - Sistema de entrenamiento con progresión real
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { UserCard } from '../types/cards';
import { TrainingResult, TrainingStat } from '../components/campaign/TrainingGames';
import { supabase } from '../lib/supabaseClient';
import { getCardData } from '../utils/battleEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyLoopState {
  energy: number;
  maxEnergy: number;
  energyRefillsAt: string;
  streak: number;
  lastLoginDate: string;
  dailyTrainings: number;
  maxDailyTrainings: number;
  weeklyChallenge: WeeklyChallenge | null;
  achievements: string[];
  totalTrainings: number;
  totalSkillPoints: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  reward: { xp: number; stat: TrainingStat; delta: number };
  expiresAt: string;
}

export interface TrainingHistory {
  date: string;
  gameId: string;
  stat: TrainingStat;
  grade: string;
  delta: number;
  xpBonus: number;
  cardId?: string;
  cardName?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTrainingSystem(userId: string, userCards: UserCard[]) {
  const [dailyLoop, setDailyLoop] = useState<DailyLoopState>({
    energy: 5,
    maxEnergy: 5,
    energyRefillsAt: '',
    streak: 0,
    lastLoginDate: '',
    dailyTrainings: 0,
    maxDailyTrainings: 8,
    weeklyChallenge: null,
    achievements: [],
    totalTrainings: 0,
    totalSkillPoints: 0,
  });
  const [history, setHistory] = useState<TrainingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const storageKey = `training_loop_${userId}`;
  const historyKey = `training_history_${userId}`;

  // ── Cargar estado ──────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const today = new Date().toISOString().split('T')[0];

    if (saved) {
      const parsed: DailyLoopState = JSON.parse(saved);
      if (parsed.lastLoginDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = parsed.lastLoginDate === yesterday.toISOString().split('T')[0];
        const newStreak = wasYesterday ? parsed.streak + 1 : 1;
        
        const updated = {
          ...parsed,
          energy: 5,
          streak: newStreak,
          lastLoginDate: today,
          dailyTrainings: 0,
        };
        setDailyLoop(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } else {
        const refillTime = new Date(parsed.energyRefillsAt);
        const now = new Date();
        if (parsed.energy < parsed.maxEnergy && now > refillTime) {
          const hoursElapsed = Math.floor((now.getTime() - refillTime.getTime()) / 3600000);
          const newEnergy = Math.min(parsed.maxEnergy, parsed.energy + hoursElapsed);
          const nextRefill = new Date();
          nextRefill.setHours(nextRefill.getHours() + 1);
          const updated = { ...parsed, energy: newEnergy, energyRefillsAt: nextRefill.toISOString() };
          setDailyLoop(updated);
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } else {
          setDailyLoop(parsed);
        }
      }
    } else {
      const nextRefill = new Date();
      nextRefill.setHours(nextRefill.getHours() + 1);
      
      const initial: DailyLoopState = {
        energy: 5,
        maxEnergy: 5,
        energyRefillsAt: nextRefill.toISOString(),
        streak: 1,
        lastLoginDate: today,
        dailyTrainings: 0,
        maxDailyTrainings: 8,
        weeklyChallenge: null,
        achievements: [],
        totalTrainings: 0,
        totalSkillPoints: 0,
      };
      setDailyLoop(initial);
      localStorage.setItem(storageKey, JSON.stringify(initial));
    }

    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [userId]);

  // ── Función para obtener nombre de carta ────────────────────────────────────
  const getCardName = (card: UserCard): string => {
    const cardData = getCardData(card);
    return cardData.name || `Carta ${card.id.slice(0, 4)}`;
  };

  // ── Función principal para aplicar entrenamiento ────────────────────────────

  const applyTraining = useCallback(async (
    result: TrainingResult,
    cardsToTrain: UserCard[],
    selectedCardId?: string
  ) => {
    if (result.delta === 0) return { success: false };
    setIsLoading(true);

    try {
      let cardsToUpgrade: UserCard[] = [];
      
      if (selectedCardId) {
        const card = cardsToTrain.find(c => c.id === selectedCardId);
        if (card) cardsToUpgrade = [card];
      } else {
        cardsToUpgrade = [...cardsToTrain];
      }

      if (cardsToUpgrade.length === 0) {
        console.error('No hay cartas para mejorar');
        return { success: false, error: 'No hay cartas' };
      }

      const totalDelta = result.delta;
      const perCardDelta = Math.max(1, Math.floor(totalDelta / cardsToUpgrade.length));
      const remainder = totalDelta - (perCardDelta * cardsToUpgrade.length);
      
      const statColumn = statToColumn(result.stat);
      const upgradedCards: UserCard[] = [];

      for (let i = 0; i < cardsToUpgrade.length; i++) {
        const card = cardsToUpgrade[i];
        const extra = i < remainder ? 1 : 0;
        const finalDelta = perCardDelta + extra;
        
        const cardData = getCardData(card);
        let currentValue = 50;
        
        switch (result.stat) {
          case 'finishing': currentValue = cardData.finishing || 50; break;
          case 'dribbling': currentValue = cardData.dribbling || 50; break;
          case 'defending': currentValue = cardData.defending || 50; break;
          case 'passing': currentValue = cardData.passing || 50; break;
          case 'physical': currentValue = cardData.physical || 50; break;
        }
        
        const newValue = Math.min(99, currentValue + finalDelta);
        
        await supabase
          .from('user_cards')
          .update({ [statColumn]: newValue })
          .eq('id', card.id);
        
        upgradedCards.push({ ...card, [result.stat]: newValue });
      }

      // Actualizar estado local del daily loop
      setDailyLoop(prev => {
        const newEnergy = Math.max(0, prev.energy - 1);
        const newTrainings = prev.dailyTrainings + 1;
        
        // Clonar el weekly challenge para modificarlo
        const currentWc = prev.weeklyChallenge;
        let updatedWc = currentWc;
        
        if (currentWc !== null) {
          const matchesGame = (
            (currentWc.id === 'wc_shot' && result.stat === 'finishing') ||
            (currentWc.id === 'wc_dribble' && result.stat === 'dribbling') ||
            (currentWc.id === 'wc_defense' && result.stat === 'defending') ||
            (currentWc.id === 'wc_perfect' && result.grade === 'S')
          );
          if (matchesGame) {
            const newProgress = Math.min(currentWc.goal, currentWc.progress + 1);
            updatedWc = { ...currentWc, progress: newProgress };
            
            if (newProgress >= currentWc.goal && !prev.achievements.includes(`wc_${currentWc.id}`)) {
              setTimeout(() => {
                alert(`🎉 ¡Completaste el desafío! +${currentWc.reward.delta} ${currentWc.reward.stat} y ${currentWc.reward.xp} XP`);
              }, 100);
            }
          }
        }
        
        const achievements = [...prev.achievements];
        if (result.grade === 'S' && !achievements.includes('first_S')) {
          achievements.push('first_S');
        }
        if (newTrainings >= 5 && !achievements.includes('five_trainings')) {
          achievements.push('five_trainings');
        }
        if (prev.streak >= 7 && !achievements.includes('week_streak')) {
          achievements.push('week_streak');
        }
        if (prev.totalTrainings + 1 >= 50 && !achievements.includes('50_trainings')) {
          achievements.push('50_trainings');
        }
        
        const nextRefill = new Date();
        nextRefill.setHours(nextRefill.getHours() + 1);
        
        const updated = {
          ...prev,
          energy: newEnergy,
          dailyTrainings: newTrainings,
          weeklyChallenge: updatedWc,
          achievements,
          energyRefillsAt: newEnergy < prev.maxEnergy ? nextRefill.toISOString() : prev.energyRefillsAt,
          totalTrainings: prev.totalTrainings + 1,
          totalSkillPoints: prev.totalSkillPoints + result.delta,
        };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      
      const entry: TrainingHistory = {
        date: new Date().toISOString(),
        gameId: result.stat,
        stat: result.stat,
        grade: result.grade,
        delta: result.delta,
        xpBonus: result.xpBonus,
        cardId: selectedCardId || cardsToTrain[0]?.id,
        cardName: selectedCardId 
          ? getCardName(cardsToTrain.find(c => c.id === selectedCardId)!) 
          : 'Todo el equipo',
      };
      
      setHistory(prev => {
        const updated = [entry, ...prev].slice(0, 50);
        localStorage.setItem(historyKey, JSON.stringify(updated));
        return updated;
      });
      
      return { success: true, upgradedCards };
      
    } catch (error) {
      console.error('Error aplicando entrenamiento:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, historyKey]);

  const canTrain = dailyLoop.energy > 0 && dailyLoop.dailyTrainings < dailyLoop.maxDailyTrainings;
  const energyPercentage = (dailyLoop.energy / dailyLoop.maxEnergy) * 100;
  const trainingsLeftToday = dailyLoop.maxDailyTrainings - dailyLoop.dailyTrainings;

  return { 
    dailyLoop, 
    applyTraining, 
    canTrain, 
    history, 
    isLoading,
    energyPercentage,
    trainingsLeftToday,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statToColumn(stat: TrainingStat): string {
  const map: Record<TrainingStat, string> = {
    finishing: 'finishing',
    dribbling: 'dribbling',
    defending: 'defending',
    passing: 'passing',
    physical: 'physical',
  };
  return map[stat];
}

export function getEnergyRefillMinutes(refillsAt: string): number {
  if (!refillsAt) return 0;
  const diff = new Date(refillsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60000));
}