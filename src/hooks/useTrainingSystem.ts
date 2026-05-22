// src/hooks/useTrainingSystem.ts
// ─────────────────────────────────────────────────────────────────────────────
// VERSIÓN COMPLETA - Con soporte para todas las 6 stats (incluyendo pace)
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

// Tipo para las estadísticas de un jugador
interface PlayerStats {
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  overall_rating?: number;
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
    return cardData.name || `Jugador ${card.id.slice(0, 4)}`;
  };

  // Función para obtener el player_id de una user_card y verificar si es entrenable
  const getCardInfo = async (userCardId: string): Promise<{ playerId: string | null; isTrainable: boolean }> => {
    const { data, error } = await supabase
      .from('user_cards')
      .select('player_id, socio_id')
      .eq('id', userCardId)
      .single();
    
    if (error || !data) {
      console.error('Error obteniendo información de la carta:', error);
      return { playerId: null, isTrainable: false };
    }
    
    // Una carta es entrenable si tiene player_id (NPC) y NO tiene socio_id
    const isTrainable = data.player_id !== null && data.player_id !== undefined && !data.socio_id;
    
    return { playerId: data.player_id, isTrainable };
  };

  // Función para actualizar estadística específica en players
  const updatePlayerStat = async (playerId: string, stat: TrainingStat, newValue: number) => {
    const updateData: Record<string, number> = {};
    updateData[stat] = newValue;
    
    const { error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId);
    
    return { error };
  };

  // Función para obtener estadísticas actuales de un jugador
  const getPlayerStats = async (playerId: string): Promise<PlayerStats | null> => {
    const { data, error } = await supabase
      .from('players')
      .select('pace, dribbling, passing, defending, finishing, physical, overall_rating')
      .eq('id', playerId)
      .single();
    
    if (error || !data) {
      console.error('Error obteniendo stats:', error);
      return null;
    }
    return data as PlayerStats;
  };

  // Función principal para aplicar entrenamiento
  const applyTraining = useCallback(async (
    result: TrainingResult,
    cardsToTrain: UserCard[],
    selectedCardId?: string
  ) => {
    console.log('=== 🏋️ ENTRENAMIENTO ===');
    console.log('Estadística:', result.stat);
    console.log('Mejora base:', result.delta);
    console.log('Cartas a entrenar:', cardsToTrain.length);
    
    
    if (result.delta === 0) {
      console.log('⚠️ Delta es 0, no se aplican mejoras');
      return { success: false };
    }
    
    setIsLoading(true);

    try {
      // Determinar cartas a mejorar
      let cardsToUpgrade: UserCard[] = [];
      
      if (selectedCardId) {
        const card = cardsToTrain.find(c => c.id === selectedCardId);
        if (card) {
          cardsToUpgrade = [card];
          console.log('🎯 Entrenando carta específica:', getCardName(card));
        }
      } else {
        cardsToUpgrade = [...cardsToTrain];
        console.log('👥 Entrenando todo el equipo:', cardsToUpgrade.length, 'cartas');
      }

      if (cardsToUpgrade.length === 0) {
        console.error('❌ No hay cartas para mejorar');
        return { success: false, error: 'No hay cartas' };
      }

      // Primero, verificar qué cartas son entrenables (tienen player_id y no son socios)
      const validCards: { card: UserCard; playerId: string }[] = [];
      const skippedCards: { card: UserCard; reason: string }[] = [];

      for (const card of cardsToUpgrade) {
        const { playerId, isTrainable } = await getCardInfo(card.id);
        
        if (isTrainable && playerId) {
          validCards.push({ card, playerId });
          console.log(`✅ Carta entrenable: ${getCardName(card)}`);
        } else {
          const reason = !playerId ? 'No tiene player_id (posiblemente socio)' : 'Es una carta de socio';
          skippedCards.push({ card, reason });
          console.log(`⏭️ Saltando carta no entrenable: ${getCardName(card)} - ${reason}`);
        }
      }

      if (validCards.length === 0) {
        console.error('❌ Ninguna carta seleccionada es entrenable');
        return { success: false, error: 'No hay cartas entrenables', skippedCards };
      }

      console.log(`📊 Entrenando ${validCards.length} cartas válidas, saltando ${skippedCards.length}`);

      // Calcular mejora por carta (solo para las válidas)
      const totalDelta = result.delta;
      const perCardDelta = Math.max(1, Math.floor(totalDelta / validCards.length));
      const remainder = totalDelta - (perCardDelta * validCards.length);
      
      const statColumn = result.stat;
      console.log('📊 Columna a actualizar:', statColumn);
      console.log('📈 Mejora por carta:', perCardDelta, '+ distribución:', remainder);
      
      const upgradedCards: UserCard[] = [];

      // Aplicar mejoras solo a cartas válidas
      for (let i = 0; i < validCards.length; i++) {
        const { card, playerId } = validCards[i];
        const extra = i < remainder ? 1 : 0;
        const finalDelta = perCardDelta + extra;
        
        console.log(`\n🃏 Procesando carta: ${getCardName(card)}`);
        console.log('  player_id:', playerId);
        
        // Obtener estadísticas actuales
        const currentStats = await getPlayerStats(playerId);
        if (!currentStats) {
          console.error('  ❌ No se pudieron obtener estadísticas actuales');
          continue;
        }
        
        // Obtener valor actual según la estadística
        let currentValue = 50;
        switch (statColumn) {
          case 'finishing': currentValue = currentStats.finishing; break;
          case 'dribbling': currentValue = currentStats.dribbling; break;
          case 'defending': currentValue = currentStats.defending; break;
          case 'passing': currentValue = currentStats.passing; break;
          case 'physical': currentValue = currentStats.physical; break;
          case 'pace': currentValue = currentStats.pace; break;
          default: currentValue = 50;
        }
        
        const newValue = Math.min(99, currentValue + finalDelta);
        
        console.log(`  ${statColumn}: ${currentValue} → +${finalDelta} → ${newValue}`);
        
        // Actualizar en la tabla players
        const { error: updateError } = await updatePlayerStat(playerId, statColumn, newValue);
        
        if (updateError) {
          console.error('  ❌ Error actualizando players:', updateError);
          continue;
        }
        console.log('  ✅ Actualizado correctamente');
        
        // Recalcular y actualizar overall_rating
        const updatedStats = await getPlayerStats(playerId);
        if (updatedStats) {
          const newOverall = Math.round(
            (updatedStats.pace + updatedStats.dribbling + updatedStats.passing + 
             updatedStats.defending + updatedStats.finishing + updatedStats.physical) / 6
          );
          
          await supabase
            .from('players')
            .update({ overall_rating: newOverall })
            .eq('id', playerId);
          
          console.log(`  📊 Nuevo overall: ${newOverall}`);
        }
        
        upgradedCards.push(card);
      }

      // Solo consumir energía si al menos una carta fue entrenada
      if (upgradedCards.length > 0) {
        setDailyLoop(prev => {
          const newEnergy = Math.max(0, prev.energy - 1);
          const newTrainings = prev.dailyTrainings + 1;
          
          // Actualizar desafío semanal si existe
          let wc = prev.weeklyChallenge;
          if (wc) {
            const matchesGame = (
              (wc.id === 'wc_shot' && result.stat === 'finishing') ||
              (wc.id === 'wc_dribble' && result.stat === 'dribbling') ||
              (wc.id === 'wc_defense' && result.stat === 'defending') ||
              (wc.id === 'wc_perfect' && result.grade === 'S')
            );
            if (matchesGame) {
              wc = { ...wc, progress: Math.min(wc.goal, wc.progress + 1) };
            }
          }
          
          // Logros
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
          
          const nextRefill = new Date();
          nextRefill.setHours(nextRefill.getHours() + 1);
          
          const updated = {
            ...prev,
            energy: newEnergy,
            dailyTrainings: newTrainings,
            weeklyChallenge: wc,
            achievements,
            energyRefillsAt: newEnergy < prev.maxEnergy ? nextRefill.toISOString() : prev.energyRefillsAt,
            totalTrainings: prev.totalTrainings + 1,
            totalSkillPoints: prev.totalSkillPoints + result.delta,
          };
          localStorage.setItem(storageKey, JSON.stringify(updated));
          return updated;
        });
        
        // Guardar historial
        const entry: TrainingHistory = {
          date: new Date().toISOString(),
          gameId: result.stat,
          stat: result.stat,
          grade: result.grade,
          delta: result.delta,
          xpBonus: result.xpBonus,
          cardId: selectedCardId || cardsToTrain[0]?.id,
          cardName: selectedCardId ? getCardName(cardsToTrain.find(c => c.id === selectedCardId)!) : 'Todo el equipo',
        };
        
        setHistory(prev => {
          const updated = [entry, ...prev].slice(0, 50);
          localStorage.setItem(historyKey, JSON.stringify(updated));
          return updated;
        });
      }
      
      console.log('=== ✅ ENTRENAMIENTO COMPLETADO ===');
      console.log(`📊 ${upgradedCards.length} cartas mejoradas, ${skippedCards.length} cartas ignoradas`);
      
      return { success: upgradedCards.length > 0, upgradedCards, skippedCards };
      
    } catch (error) {
      console.error('❌ Error aplicando entrenamiento:', error);
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

export function getEnergyRefillMinutes(refillsAt: string): number {
  if (!refillsAt) return 0;
  const diff = new Date(refillsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60000));
}