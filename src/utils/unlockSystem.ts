// src/utils/unlockSystem.ts
export interface Unlockable {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'rival' | 'mode' | 'reward';
  requiredWins: number;
  isUnlocked: boolean;
  reward?: {
    type: 'xp' | 'coins' | 'card';
    amount?: number;
  };
}

export const ALL_UNLOCKABLES: Unlockable[] = [
  {
    id: 'rival_veteran',
    name: 'Bot Veterano',
    description: 'Un experimentado rival con nuevas tácticas',
    icon: '👴',
    type: 'rival',
    requiredWins: 15,
    isUnlocked: false,
  },
  {
    id: 'mode_tournament',
    name: 'Modo Torneo',
    description: 'Ganá 3 partidos seguidos por premios épicos',
    icon: '🏆',
    type: 'mode',
    requiredWins: 10,
    isUnlocked: false,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'rival_legend_plus',
    name: 'Bot Leyenda +',
    description: 'La dificultad definitiva te espera',
    icon: '👑',
    type: 'rival',
    requiredWins: 50,
    isUnlocked: false,
  },
  {
    id: 'reward_streak_amulet',
    name: 'Amuleto de Racha',
    description: 'Las rachas dan +50% más de XP',
    icon: '🍀',
    type: 'reward',
    requiredWins: 25,
    isUnlocked: false,
    reward: { type: 'xp', amount: 0 },
  },
  {
    id: 'mode_endless',
    name: 'Modo Infinito',
    description: '¿Cuántos partidos podés ganar seguido?',
    icon: '♾️',
    type: 'mode',
    requiredWins: 40,
    isUnlocked: false,
  },
];

export function getUnlockablesForWins(totalWins: number): Unlockable[] {
  return ALL_UNLOCKABLES.map(u => ({
    ...u,
    isUnlocked: u.requiredWins <= totalWins,
  }));
}

export function getNextUnlockable(totalWins: number): Unlockable | null {
  const locked = ALL_UNLOCKABLES.filter(u => u.requiredWins > totalWins);
  if (locked.length === 0) return null;
  return locked.sort((a, b) => a.requiredWins - b.requiredWins)[0];
}

export function getUnlockProgress(totalWins: number): {
  current: number;
  total: number;
  percentage: number;
} {
  const highestReq = Math.max(...ALL_UNLOCKABLES.map(u => u.requiredWins));
  return {
    current: Math.min(totalWins, highestReq),
    total: highestReq,
    percentage: Math.min(100, (totalWins / highestReq) * 100),
  };
}