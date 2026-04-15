// src/utils/battleEngine.ts
import { UserCard } from '../types/cards';
import { calculateTeamBonus } from './cardGenerator';

export interface BattleResult {
  userScore: number;
  opponentScore: number;
  winner: 'user' | 'opponent';
  experienceGained: number;
  categoryBonus: boolean;
  bonusMessage?: string;
}

export function calculateBattle(
  userCards: UserCard[],
  opponentCards: UserCard[],
  userCategory?: string,
  opponentCategory?: string
): BattleResult {
  const calculateCardPower = (card: UserCard): number => {
    return card.player.overall_rating * (1 + (card.level - 1) * 0.05);
  };
  
  let userPower = userCards.reduce((sum, card) => sum + calculateCardPower(card), 0);
  let opponentPower = opponentCards.reduce((sum, card) => sum + calculateCardPower(card), 0);
  
  const userTeamBonus = calculateTeamBonus(userCards);
  const opponentTeamBonus = calculateTeamBonus(opponentCards);
  
  if (userTeamBonus.bonus > 0) userPower *= (1 + userTeamBonus.bonus / 100);
  if (opponentTeamBonus.bonus > 0) opponentPower *= (1 + opponentTeamBonus.bonus / 100);
  
  let classicBonus = false;
  let classicMessage = '';
  if (userCategory && opponentCategory && userCategory === opponentCategory) {
    classicBonus = true;
    userPower *= 1.2;
    opponentPower *= 1.2;
    classicMessage = `🏆 ¡CLÁSICO DE ${userCategory.toUpperCase()}! +20% poder`;
  }
  
  const randomFactor = 0.85 + Math.random() * 0.3;
  const userFinal = userPower * randomFactor;
  const opponentFinal = opponentPower * (0.9 + Math.random() * 0.2);
  
  const userScore = Math.floor(userFinal);
  const opponentScore = Math.floor(opponentFinal);
  const winner = userScore > opponentScore ? 'user' : 'opponent';
  
  const diff = Math.abs(userScore - opponentScore);
  const performanceBonus = winner === 'user' ? Math.floor(diff / 10) : 0;
  const baseExp = winner === 'user' ? 30 : 10;
  const experienceGained = Math.min(100, baseExp + performanceBonus + (classicBonus ? 20 : 0));
  
  return {
    userScore,
    opponentScore,
    winner,
    experienceGained,
    categoryBonus: classicBonus || userTeamBonus.bonus > 0,
    bonusMessage: userTeamBonus.message || classicMessage
  };
}

export function addExperienceToCard(card: UserCard, exp: number): { card: UserCard; leveledUp: boolean } {
  let newExp = card.experience + exp;
  let newLevel = card.level;
  let leveledUp = false;
  
  const expNeeded = card.level * 100;
  
  if (newExp >= expNeeded) {
    newLevel++;
    newExp = 0;
    leveledUp = true;
  }
  
  return {
    card: { ...card, level: newLevel, experience: newExp },
    leveledUp
  };
}