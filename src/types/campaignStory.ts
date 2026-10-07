// src/types/campaignStory.ts

import { BotConfig } from './campaign';

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  order: number;
  requiredDay: number;
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

export type DailyMissionType =
  | 'play_match'
  | 'share'
  | 'open_pack'
  | 'watch_ad'
  | 'complete_training'
  | 'claim_reward'
  | 'social_share'
  | 'training'
  | 'challenge'
  | 'chat'
  | 'challenge_accept'
  | 'challenge_win';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;

  type: DailyMissionType;

  requirement: number;
  currentProgress: number;

  reward: {
  xp: number;
  coins?: number;
  points?: number;
  itemId?: string;
};

  isCompleted: boolean;
  isClaimed: boolean;

  storyTrigger?: string;
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