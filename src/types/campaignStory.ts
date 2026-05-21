// src/types/campaignStory.ts
import { BotConfig } from './campaign'; // Importar desde campaign.ts

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  order: number;
  requiredDay: number; // Día de la historia
  isUnlocked: boolean;
  cinematics: {
    background: string;
    characterDialogues: Dialogue[];
  };
}

export interface Dialogue {
  character: string;
  avatar: string;
  text: string;
  emotion?: 'happy' | 'sad' | 'determined' | 'angry';
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'play_match' | 'share' | 'open_pack' | 'watch_ad' | 'complete_training' | 'claim_reward' | 'social_share'| 'training';
  requirement: number;
  currentProgress: number;
  reward: {
    xp: number;
    coins?: number;
    itemId?: string;
  };
  isCompleted: boolean;
  isClaimed: boolean;
  storyTrigger?: string; // ID del trigger de historia que activa
}

export interface CampaignDay {
  day: number;
  title: string;
  storyChapters: StoryChapter[];
  dailyMissions: DailyMission[];
  requiredMatches: BotConfig[];
  isCompleted: boolean;
  canAdvance: boolean;
  specialEvent?: {
    title: string;
    description: string;
    trigger: string;
  };
}