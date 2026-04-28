// src/types/cards.ts
export type Position = 'arquero' | 'cierre' | 'ala' | 'pivot';
export type Category = '1era' | '3ra' | '4ta' | '5ta' | '6ta' | '7ma' | '8va' | 'femenino' | 'Promocionales'  | 'socios' | 'veteranos';
export type CardType = 'npc' | 'socio';

// Carta base (unificada)
export interface BaseCard {
  id: string;
  name: string;
  position: Position;
  category: Category;
  overall_rating: number;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  photo_url?: string;
}

// NPC Card
export interface NPCCard extends BaseCard {
  card_type: 'npc';
  can_be_replaced: boolean;
  is_replaced: boolean;
  replaces_profile_id?: string;
  original_name?: string;
}

// Socio Card (jugador real)
export interface SocioCard extends BaseCard {
  card_type: 'socio';
  profile_id: string;
  total_wins_lifetime: number;
  total_battles_lifetime: number;
  is_real: true;
}

// Carta unificada para UI
export type UnifiedCard = NPCCard | SocioCard;

// User Card (carta coleccionada por un usuario)
export interface UserCard {
  id: string;
  user_id: string;
  player_id?: string;      // Para NPCs
  socio_id?: string;       // Para socios
  card_type: CardType;
  card?: UnifiedCard;       // Datos del join
  level: number;
  experience: number;
  is_favorite: boolean;
  obtained_at: string;
  position?: number;        // Para el mazo (1-5)
}

// Deck
export interface Deck {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  cards: UserCard[];
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FW';
  category: 'standard' | 'rare' | 'epic' | 'legendary';
  team?: string;
  nationality?: string;
  overall?: number;
}

// Posiciones con íconos
export const POSITION_ICONS: Record<Position, { icon: string; name: string; color: string }> = {
  arquero: { icon: '🧤', name: 'ARQ', color: '#4a90d9' },
  cierre: { icon: '🛡️', name: 'DEF', color: '#e67e22' },
  ala: { icon: '⚡', name: 'ALA', color: '#2ecc71' },
  pivot: { icon: '🎯', name: 'PIV', color: '#e74c3c' },
};

// Función para calcular OVR
export function calculateOVR(card: { pace: number; dribbling: number; passing: number; defending: number; finishing: number; physical: number }): number {
  return Math.floor(
    (card.pace + card.dribbling + card.passing + card.defending + card.finishing + card.physical) / 6
  );
}

// Función para obtener color según rareza
export function getRarityColor(ovr: number): string {
  if (ovr >= 85) return '#9B59B6';
  if (ovr >= 75) return '#FFD700';
  if (ovr >= 65) return '#C0C0C0';
  return '#CD7F32';
}