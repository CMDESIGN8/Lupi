// src/utils/cardRarity.ts
import { designTokens } from '../styles/designTokens';

export type CardRarity = 'bronze' | 'silver' | 'gold' | 'legendary';

export function getRarityFromOverall(overall: number): CardRarity {
  if (overall >= 85) return 'legendary';
  if (overall >= 75) return 'gold';
  if (overall >= 65) return 'silver';
  return 'bronze';
}

export function getRarityColor(overall: number): string {
  const rarity = getRarityFromOverall(overall);
  return designTokens.colors.rarity[rarity].primary;
}

export function getRarityGradient(overall: number): string {
  const rarity = getRarityFromOverall(overall);
  const r = designTokens.colors.rarity[rarity];
  return `linear-gradient(145deg, ${r.primary}20, ${r.secondary}10)`;
}

export function getRarityGlow(overall: number): string {
  const rarity = getRarityFromOverall(overall);
  return designTokens.colors.rarity[rarity].glow;
}

export function getRarityLabel(overall: number): string {
  if (overall >= 85) return '👑 LEGENDARIO';
  if (overall >= 75) return '⭐ DORADO';
  if (overall >= 65) return '🥈 PLATEADO';
  return '🥉 BRONCE';
}