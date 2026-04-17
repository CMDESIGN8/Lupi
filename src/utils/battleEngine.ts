// src/utils/battleEngine.ts

import { UserCard } from '../types/cards';

// Función helper para obtener datos de la carta (misma que en CardBattle)
function getCardData(card: UserCard): {
  name: string;
  position: string;
  overall_rating: number;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  category?: string;
} {
  if (card.card) {
    return {
      name: card.card.name,
      position: card.card.position,
      overall_rating: card.card.overall_rating,
      pace: card.card.pace,
      dribbling: card.card.dribbling,
      passing: card.card.passing,
      defending: card.card.defending,
      finishing: card.card.finishing,
      physical: card.card.physical,
      category: card.card.category,
    };
  }
  
  // Fallback para compatibilidad
  const player = (card as any).player;
  if (player) {
    return {
      name: player.name,
      position: player.position,
      overall_rating: player.overall_rating,
      pace: player.pace,
      dribbling: player.dribbling,
      passing: player.passing,
      defending: player.defending,
      finishing: player.finishing,
      physical: player.physical,
      category: player.category,
    };
  }
  
  // Default fallback
  return {
    name: 'Desconocido',
    position: 'ala',
    overall_rating: 50,
    pace: 50,
    dribbling: 50,
    passing: 50,
    defending: 50,
    finishing: 50,
    physical: 50,
  };
}

// Calcula el poder de una carta individual
export function calculateCardPower(card: UserCard): number {
  const data = getCardData(card);
  const levelBonus = 1 + (card.level - 1) * 0.05;
  return Math.floor(data.overall_rating * levelBonus);
}

// Calcula el poder total de un equipo (5 cartas) con bonificaciones
export function calculateTeamPower(cards: UserCard[]): {
  totalPower: number;
  bonus: number;
  finalPower: number;
  synergyDetails: string[];
} {
  if (!cards || cards.length === 0) {
    return { totalPower: 0, bonus: 0, finalPower: 0, synergyDetails: [] };
  }

  // Calcular poder base de cada carta
  const cardPowers = cards.map(card => calculateCardPower(card));
  const totalPower = cardPowers.reduce((sum, power) => sum + power, 0);
  
  // Calcular bonificaciones por sinergias
  let bonus = 0;
  const synergyDetails: string[] = [];
  
  const positions = cards.map(card => getCardData(card).position);
  const uniquePositions = new Set(positions);
  
  // Bonus por tener todas las posiciones diferentes
  if (uniquePositions.size === 4) {
    bonus += 10;
    synergyDetails.push('Equipo balanceado: +10%');
  } else if (uniquePositions.size >= 3) {
    bonus += 5;
    synergyDetails.push('Buena formación: +5%');
  }
  
  // Bonus por duplicados (química)
  const positionCount: Record<string, number> = {};
  positions.forEach(pos => {
    positionCount[pos] = (positionCount[pos] || 0) + 1;
  });
  
  for (const [pos, count] of Object.entries(positionCount)) {
    if (count >= 2) {
      const posBonus = count === 2 ? 3 : 5;
      bonus += posBonus;
      synergyDetails.push(`${pos.toUpperCase()} x${count}: +${posBonus}%`);
    }
  }
  
  // Bonus por nivel promedio alto
  const avgLevel = cards.reduce((sum, card) => sum + card.level, 0) / cards.length;
  if (avgLevel >= 4) {
    bonus += 8;
    synergyDetails.push('Jugadores veteranos: +8%');
  } else if (avgLevel >= 3) {
    bonus += 4;
    synergyDetails.push('Jugadores experimentados: +4%');
  }
  
  const finalPower = Math.floor(totalPower * (1 + bonus / 100));
  
  return { totalPower, bonus, finalPower, synergyDetails };
}

// Simula un partido entre dos equipos
export function calculateBattle(
  userCards: UserCard[],
  opponentCards: UserCard[],
  userCategory: string = '1era',
  opponentCategory: string = '8va'
): {
  winner: 'user' | 'opponent';
  userScore: number;
  opponentScore: number;
  experienceGained: number;
  bonusMessage: string | null;
} {
  // Calcular poder de cada equipo
  const userPower = calculateTeamPower(userCards).finalPower;
  const opponentPower = calculateTeamPower(opponentCards).finalPower;
  
  // Bonus por categoría (equipos de categorías más altas tienen ventaja)
  const categoryBonus: Record<string, number> = {
    '1era': 20,
    '3ra': 15,
    '4ta': 12,
    '5ta': 10,
    '6ta': 8,
    '7ma': 5,
    '8va': 0,
    'femenino': 5,
    'Promocionales': 15,
  };
  
  const userCategoryBonus = categoryBonus[userCategory] || 0;
  const opponentCategoryBonus = categoryBonus[opponentCategory] || 0;
  
  // Poder final con bonificaciones
  const userFinalPower = userPower + userCategoryBonus;
  const opponentFinalPower = opponentPower + opponentCategoryBonus;
  
  // Calcular probabilidad de ganar (entre 20% y 80%)
  const totalPower = userFinalPower + opponentFinalPower;
  let userWinChance = totalPower > 0 ? (userFinalPower / totalPower) * 100 : 50;
  userWinChance = Math.min(80, Math.max(20, userWinChance));
  
  // Determinar ganador
  const random = Math.random() * 100;
  const userWins = random < userWinChance;
  
  // Calcular goles (entre 0 y 5)
  const userScore = Math.floor(Math.random() * 6);
  const opponentScore = userWins 
    ? Math.max(0, Math.floor(Math.random() * userScore))
    : Math.min(5, userScore + Math.floor(Math.random() * 3) + 1);
  
  // Experiencia ganada
  const baseExp = 20;
  const winBonus = userWins ? 15 : 5;
  const scoreDiffBonus = Math.min(10, Math.abs(userScore - opponentScore) * 2);
  const experienceGained = baseExp + winBonus + scoreDiffBonus;
  
  // Mensaje de bonus por sinergia
  const userSynergy = calculateTeamPower(userCards);
  let bonusMessage: string | null = null;
  if (userSynergy.bonus > 0) {
    bonusMessage = `✨ Bonificación por sinergia: +${userSynergy.bonus}% al poder del equipo`;
  }
  
  return {
    winner: userWins ? 'user' : 'opponent',
    userScore,
    opponentScore,
    experienceGained,
    bonusMessage,
  };
}

// Agrega experiencia a una carta y maneja el level up
export function addExperienceToCard(
  card: UserCard,
  experienceGained: number
): { card: UserCard; leveledUp: boolean } {
  let newExp = (card.experience || 0) + experienceGained;
  let newLevel = card.level;
  let leveledUp = false;
  
  const expNeeded = card.level * 100;
  
  while (newExp >= expNeeded && newLevel < 10) {
    newExp -= expNeeded;
    newLevel++;
    leveledUp = true;
  }
  
  return {
    card: {
      ...card,
      level: newLevel,
      experience: newExp,
    },
    leveledUp,
  };
}