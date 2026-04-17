// src/utils/cardGenerator.ts - Agregar la función faltante

import { UserCard } from '../types/cards';

export const POSITION_ICONS: Record<string, { icon: string; name: string; color: string }> = {
  arquero: { icon: '🧤', name: 'ARQ', color: '#4a90d9' },
  cierre: { icon: '🛡️', name: 'DEF', color: '#e67e22' },
  ala: { icon: '⚡', name: 'ALA', color: '#2ecc71' },
  pivot: { icon: '🎯', name: 'PIV', color: '#e74c3c' },
};

// Función helper para obtener datos de la carta
function getCardData(card: UserCard): any {
  if (!card) return null;
  const data = card.card || (card as any).player;
  return data;
}

export function calculateTeamBonus(cards: UserCard[]): { bonus: number; details: string } {
  if (!cards || cards.length === 0) {
    return { bonus: 0, details: 'Sin cartas en el equipo' };
  }

  let bonus = 0;
  const details: string[] = [];
  
  const positions: string[] = [];
  const categories: string[] = [];
  
  for (const card of cards) {
    const cardData = getCardData(card);
    if (cardData) {
      if (cardData.position) positions.push(cardData.position);
      if (cardData.category) categories.push(cardData.category);
    }
  }
  
  const uniquePositions = new Set(positions);
  if (uniquePositions.size === 4) {
    bonus += 10;
    details.push('Equipo balanceado: +10%');
  } else if (uniquePositions.size >= 3) {
    bonus += 5;
    details.push('Buena formación: +5%');
  }
  
  const positionCount: Record<string, number> = {};
  positions.forEach(pos => {
    positionCount[pos] = (positionCount[pos] || 0) + 1;
  });
  
  for (const [pos, count] of Object.entries(positionCount)) {
    if (count >= 2) {
      const posBonus = count === 2 ? 3 : 5;
      bonus += posBonus;
      details.push(`${POSITION_ICONS[pos]?.name || pos.toUpperCase()} x${count}: +${posBonus}%`);
    }
  }
  
  const categoryCount: Record<string, number> = {};
  categories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  for (const [cat, count] of Object.entries(categoryCount)) {
    if (count >= 3) {
      const catBonus = count === 3 ? 4 : 6;
      bonus += catBonus;
      details.push(`Misma categoría (${cat}): +${catBonus}%`);
    }
  }
  
  const avgLevel = cards.reduce((sum, card) => sum + (card.level || 1), 0) / cards.length;
  if (avgLevel >= 4) {
    bonus += 8;
    details.push('Jugadores veteranos: +8%');
  } else if (avgLevel >= 3) {
    bonus += 4;
    details.push('Jugadores experimentados: +4%');
  }
  
  return { 
    bonus, 
    details: details.join(', ') || 'Sin bonificaciones activas'
  };
}

// Función para generar stats aleatorios
export function generateRandomStats(baseStats?: Partial<{
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
}>) {
  return {
    pace: baseStats?.pace || Math.floor(Math.random() * (85 - 40 + 1) + 40),
    dribbling: baseStats?.dribbling || Math.floor(Math.random() * (85 - 40 + 1) + 40),
    passing: baseStats?.passing || Math.floor(Math.random() * (85 - 40 + 1) + 40),
    defending: baseStats?.defending || Math.floor(Math.random() * (85 - 40 + 1) + 40),
    finishing: baseStats?.finishing || Math.floor(Math.random() * (85 - 40 + 1) + 40),
    physical: baseStats?.physical || Math.floor(Math.random() * (85 - 40 + 1) + 40),
  };
}

// Función para generar stats completos de una carta (para DevTools)
export function generateCardStats(level: number = 1): {
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  overall_rating: number;
} {
  const baseStats = generateRandomStats();
  const levelBonus = 1 + (level - 1) * 0.05;
  
  const pacedWithBonus = Math.min(99, Math.floor(baseStats.pace * levelBonus));
  const dribblingWithBonus = Math.min(99, Math.floor(baseStats.dribbling * levelBonus));
  const passingWithBonus = Math.min(99, Math.floor(baseStats.passing * levelBonus));
  const defendingWithBonus = Math.min(99, Math.floor(baseStats.defending * levelBonus));
  const finishingWithBonus = Math.min(99, Math.floor(baseStats.finishing * levelBonus));
  const physicalWithBonus = Math.min(99, Math.floor(baseStats.physical * levelBonus));
  
  const overall_rating = Math.floor(
    (pacedWithBonus + dribblingWithBonus + passingWithBonus + 
     defendingWithBonus + finishingWithBonus + physicalWithBonus) / 6
  );
  
  return {
    pace: pacedWithBonus,
    dribbling: dribblingWithBonus,
    passing: passingWithBonus,
    defending: defendingWithBonus,
    finishing: finishingWithBonus,
    physical: physicalWithBonus,
    overall_rating,
  };
}