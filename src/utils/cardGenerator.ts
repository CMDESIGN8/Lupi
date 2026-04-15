// src/utils/cardGenerator.ts
import { Player, UserCard } from '../types/cards';

export function generateCardStats(position: string, category: string): Partial<Player> {
  const categoryMultiplier: Record<string, number> = {
    'Promocionales': 0.55,
    '8va': 0.60,
    '7ma': 0.65,
    '6ta': 0.70,
    '5ta': 0.75,
    '4ta': 0.80,
    '3ra': 0.85,
    '1era': 1.0
  };
  
  const multiplier = categoryMultiplier[category] || 0.7;
  
  const baseStats: Record<string, any> = {
    arquero: { 
      pace: 40, dribbling: 50, passing: 65, defending: 90, finishing: 30, physical: 75 
    },
    cierre: { 
      pace: 70, dribbling: 65, passing: 70, defending: 85, finishing: 50, physical: 80 
    },
    ala: { 
      pace: 85, dribbling: 85, passing: 70, defending: 55, finishing: 70, physical: 65 
    },
    pivot: { 
      pace: 70, dribbling: 70, passing: 65, defending: 45, finishing: 85, physical: 85 
    }
  };
  
  const base = baseStats[position];
  if (!base) throw new Error(`Posición inválida: ${position}`);
  
  const variance = () => 0.85 + Math.random() * 0.3;
  
  const overall = Math.floor(
    (base.pace * 0.12 +
     base.dribbling * 0.18 +
     base.passing * 0.12 +
     base.defending * 0.18 +
     base.finishing * 0.25 +
     base.physical * 0.15) * multiplier * variance()
  );
  
  return {
    overall_rating: Math.min(99, Math.max(40, overall)),
    pace: Math.min(99, Math.max(30, Math.floor(base.pace * multiplier * variance()))),
    dribbling: Math.min(99, Math.max(30, Math.floor(base.dribbling * multiplier * variance()))),
    passing: Math.min(99, Math.max(30, Math.floor(base.passing * multiplier * variance()))),
    defending: Math.min(99, Math.max(30, Math.floor(base.defending * multiplier * variance()))),
    finishing: Math.min(99, Math.max(30, Math.floor(base.finishing * multiplier * variance()))),
    physical: Math.min(99, Math.max(30, Math.floor(base.physical * multiplier * variance())))
  };
}

export function calculateTeamBonus(cards: UserCard[]): { bonus: number; message: string } {
  if (cards.length < 3) return { bonus: 0, message: '' };
  
  const categories = cards.map(c => c.player.category);
  const allSameCategory = categories.every(cat => cat === categories[0]);
  
  if (allSameCategory) {
    const bonusPercent = cards.length === 5 ? 35 : cards.length === 4 ? 25 : 15;
    return {
      bonus: bonusPercent,
      message: `⚡ ¡Bonus de equipo! +${bonusPercent}% poder (${categories[0]})`
    };
  }
  
  return { bonus: 0, message: '' };
}

export const POSITION_ICONS: Record<string, { icon: string; name: string; color: string }> = {
  arquero: { icon: "🧤", name: "ARQ", color: "#4CAF50" },
  cierre: { icon: "🛡️", name: "CIE", color: "#2196F3" },
  ala: { icon: "⚡", name: "ALA", color: "#FF9800" },
  pivot: { icon: "🎯", name: "PIV", color: "#9C27B0" }
};