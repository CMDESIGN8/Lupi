// src/utils/userProgression.ts
import { supabase } from '../lib/supabaseClient';

export const RARITY_CONFIG: Record<string, { name: string; color: string; icon: string; minLevel: number; maxLevel: number; statBonus: number }> = {
  bronze: { name: 'Bronce', color: '#CD7F32', icon: '🟤', minLevel: 1, maxLevel: 19, statBonus: 0 },
  silver: { name: 'Plata', color: '#C0C0C0', icon: '⚪', minLevel: 20, maxLevel: 39, statBonus: 5 },
  gold: { name: 'Oro', color: '#FFD700', icon: '🟡', minLevel: 40, maxLevel: 59, statBonus: 10 },
  sapphire: { name: 'Zafiro', color: '#0F52BA', icon: '💎', minLevel: 60, maxLevel: 79, statBonus: 15 },
  ruby: { name: 'Rubí', color: '#E0115F', icon: '🔥', minLevel: 80, maxLevel: 99, statBonus: 20 },
  elite: { name: 'Élite', color: '#9B59B6', icon: '👑', minLevel: 100, maxLevel: 100, statBonus: 30 }
};

export function getExpNeededForLevel(level: number): number {
  return level * 100;
}

export async function getUserCardStats(userId: string): Promise<{
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
  total_tickets: number;
  total_battles: number;
  total_wins: number;
  total_shares: number;
  total_referrals: number;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      user_card_level,
      user_card_exp,
      user_card_rarity,
      user_card_pace,
      user_card_dribbling,
      user_card_passing,
      user_card_defending,
      user_card_finishing,
      user_card_physical,
      total_tickets_lifetime,
      total_battles_lifetime,
      total_wins_lifetime,
      total_shares_lifetime,
      total_referrals_lifetime
    `)
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user card stats:', error);
    return {
      level: 1,
      exp: 0,
      expNeeded: 100,
      rarity: 'bronze',
      pace: 40,
      dribbling: 40,
      passing: 40,
      defending: 40,
      finishing: 40,
      physical: 40,
      total_tickets: 0,
      total_battles: 0,
      total_wins: 0,
      total_shares: 0,
      total_referrals: 0
    };
  }
  
  const level = data.user_card_level || 1;
  
  return {
    level,
    exp: data.user_card_exp || 0,
    expNeeded: getExpNeededForLevel(level),
    rarity: data.user_card_rarity || 'bronze',
    pace: data.user_card_pace || 40,
    dribbling: data.user_card_dribbling || 40,
    passing: data.user_card_passing || 40,
    defending: data.user_card_defending || 40,
    finishing: data.user_card_finishing || 40,
    physical: data.user_card_physical || 40,
    total_tickets: data.total_tickets_lifetime || 0,
    total_battles: data.total_battles_lifetime || 0,
    total_wins: data.total_wins_lifetime || 0,
    total_shares: data.total_shares_lifetime || 0,
    total_referrals: data.total_referrals_lifetime || 0
  };
}

// ✅ ESTA ES LA FUNCIÓN QUE FALTA - EXPORTADA CORRECTAMENTE
export async function updateUserProgression(
  userId: string,
  action: {
    type: 'ticket' | 'daily_card' | 'battle_win' | 'battle_lose' | 
          'share' | 'referral' | 'mission' | 'album_percent';
    value?: number;
  }
): Promise<any> {
  const expValues: Record<string, number> = {
    ticket: 10,
    daily_card: 25,
    battle_win: 15,
    battle_lose: 10,
    share: 30,
    referral: 100,
    mission: 50
  };
  
  const expGained = expValues[action.type] || 0;
  
  // Obtener stats ANTES de actualizar
  const { data: oldStats } = await supabase
    .from('profiles')
    .select('user_card_pace, user_card_dribbling, user_card_passing, user_card_defending, user_card_finishing, user_card_physical, user_card_level')
    .eq('id', userId)
    .single();
  
  console.log('📊 Stats ANTES:', oldStats);
  
  // Llamar a la RPC
  const { data, error } = await supabase.rpc('update_user_progression', {
    p_user_id: userId,
    p_points_gained: expGained,
    p_exp_gained: expGained,
    p_action_type: action.type,
    p_action_value: action.value || 0
  });
  
  if (error) {
    console.error('Error en RPC:', error);
    return null;
  }
  
  // Obtener stats DESPUÉS de actualizar
  const { data: newStats } = await supabase
    .from('profiles')
    .select('user_card_pace, user_card_dribbling, user_card_passing, user_card_defending, user_card_finishing, user_card_physical, user_card_level')
    .eq('id', userId)
    .single();
  
  console.log('📊 Stats DESPUÉS:', newStats);
  
  // Determinar qué stat cambió
  let statUpgraded = null;
  let oldStatValue = null;
  let newStatValue = null;
  
  if (action.type === 'ticket' && newStats?.user_card_pace > oldStats?.user_card_pace) {
    statUpgraded = 'pace';
    oldStatValue = oldStats?.user_card_pace;
    newStatValue = newStats?.user_card_pace;
  } else if (action.type === 'daily_card' && newStats?.user_card_dribbling > oldStats?.user_card_dribbling) {
    statUpgraded = 'dribbling';
    oldStatValue = oldStats?.user_card_dribbling;
    newStatValue = newStats?.user_card_dribbling;
  } else if ((action.type === 'battle_win') && newStats?.user_card_finishing > oldStats?.user_card_finishing) {
    statUpgraded = 'finishing';
    oldStatValue = oldStats?.user_card_finishing;
    newStatValue = newStats?.user_card_finishing;
  } else if (action.type === 'battle_lose' && newStats?.user_card_defending > oldStats?.user_card_defending) {
    statUpgraded = 'defending';
    oldStatValue = oldStats?.user_card_defending;
    newStatValue = newStats?.user_card_defending;
  } else if (action.type === 'share' && newStats?.user_card_passing > oldStats?.user_card_passing) {
    statUpgraded = 'passing';
    oldStatValue = oldStats?.user_card_passing;
    newStatValue = newStats?.user_card_passing;
  } else if (action.type === 'referral' && newStats?.user_card_physical > oldStats?.user_card_physical) {
    statUpgraded = 'physical';
    oldStatValue = oldStats?.user_card_physical;
    newStatValue = newStats?.user_card_physical;
  }
  
  return {
    ...data,
    stat_upgraded: statUpgraded,
    old_stat_value: oldStatValue,
    new_stat_value: newStatValue
  };
}