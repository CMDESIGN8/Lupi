// src/types/campaign.ts
export interface League {
  id: string;
  name: string;
  tier: number;
  icon: string;
  color: string;
  requiredOverall: number;
  bots: BotConfig[];
  rewardXp: number;
  rewardPoints: number;
  rewardTitle?: string;
  rewardBadge?: string;
}

export interface BotConfig {
  name: string;
  overall: number;
  avatar: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpBase: number;
  level?: number;   // ← agregar
  color?: string;   // ← agregar
}

export interface CampaignProgress {
  currentLeagueId: string;
  completedLeagueIds: string[];
  starsEarned: number;
  unlockedBadges: string[];
  currentStreak: number;
  bestStreak: number;
}

export interface CampaignMatch {
  leagueId: string;
  opponent: BotConfig;
  matchNumber: number;
  totalMatches: number;
  isBoss: boolean;
  requiredStars?: number;
}

export interface LeagueReward {
  type: 'xp' | 'points' | 'title' | 'badge' | 'card';
  value: string | number;
  description: string;
}