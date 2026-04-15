// src/types/cards.ts
export interface Player {
  id: string;
  name: string;
  position: 'arquero' | 'cierre' | 'ala' | 'pivot';
  category: '8va' | '7ma' | '6ta' | '5ta' | '4ta' | '3ra' | '1era' | 'Promocionales';
  photo_url?: string;
  overall_rating: number;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
}

export interface UserCard {
  id: string;
  user_id: string;
  player_id: string;
  player: Player;
  level: number;
  experience: number;
  is_favorite: boolean;
  obtained_at: string;
}

export interface Deck {
  id: string;
  name: string;
  is_active: boolean;
  cards: (UserCard & { position: number })[];
}

export interface Match {
  id: string;
  user_id: string;
  opponent_type: 'bot' | 'user';
  opponent_id?: string;
  user_score: number;
  opponent_score: number;
  winner_id?: string;
  experience_gained: number;
  played_at: string;
}

export interface DailyReward {
  id: string;
  user_id: string;
  reward_date: string;
  claimed: boolean;
  player_id?: string;
  claimed_at?: string;
}