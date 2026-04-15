// src/components/CardBattle.tsx
import { useState } from 'react';
import { UserCard, Deck } from '../types/cards';
import { calculateBattle, addExperienceToCard } from '../utils/battleEngine';
import { supabase } from '../lib/supabaseClient';
import { POSITION_ICONS } from '../utils/cardGenerator';

interface CardBattleProps {
  userCards: UserCard[];
  userDeck: Deck;
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
}

const BOT_DECK: UserCard[] = [
  { level: 1, player: { overall_rating: 55, name: 'Bot Novato', category: '8va', position: 'ala' } } as UserCard,
  { level: 2, player: { overall_rating: 65, name: 'Bot Experto', category: '7ma', position: 'cierre' } } as UserCard,
  { level: 3, player: { overall_rating: 75, name: 'Bot Leyenda', category: '6ta', position: 'pivot' } } as UserCard,
];

export function CardBattle({ userCards, userDeck, userId, onBattleComplete }: CardBattleProps) {
  const [battling, setBattling] = useState(false);
  const [result, setResult] = useState<{
    winner: 'user' | 'opponent';
    userScore: number;
    opponentScore: number;
    experienceGained: number;
    leveledUpCards: string[];
    bonusMessage?: string;
  } | null>(null);

  const startBattle = async () => {
    if (userDeck.cards.length < 5) {
      alert('Necesitás 5 cartas en tu mazo para jugar');
      return;
    }
    
    setBattling(true);
    
    const randomBot = BOT_DECK[Math.floor(Math.random() * BOT_DECK.length)];
    const opponentCards = [randomBot, randomBot, randomBot, randomBot, randomBot];
    
    setTimeout(async () => {
      const userCategory = userDeck.cards[0]?.player.category;
      const opponentCategory = opponentCards[0]?.player.category;
      
      const battleResult = calculateBattle(
        userDeck.cards,
        opponentCards,
        userCategory,
        opponentCategory
      );
      
      let leveledUpCards: string[] = [];
      const updatedCards = [...userDeck.cards];
      
      for (let i = 0; i < updatedCards.length; i++) {
        const { card, leveledUp } = addExperienceToCard(updatedCards[i], battleResult.experienceGained);
        updatedCards[i] = card;
        if (leveledUp) leveledUpCards.push(card.player.name);
        
        await supabase
          .from('user_cards')
          .update({ level: card.level, experience: card.experience })
          .eq('id', card.id);
      }
      
      await supabase.from('matches').insert({
        user_id: userId,
        opponent_type: 'bot',
        user_deck_id: userDeck.id,
        user_score: battleResult.userScore,
        opponent_score: battleResult.opponentScore,
        winner_id: battleResult.winner === 'user' ? userId : null,
        experience_gained: battleResult.experienceGained
      });
      
      setResult({
        winner: battleResult.winner,
        userScore: battleResult.userScore,
        opponentScore: battleResult.opponentScore,
        experienceGained: battleResult.experienceGained,
        leveledUpCards,
        bonusMessage: battleResult.bonusMessage
      });
      
      setBattling(false);
      onBattleComplete(updatedCards);
    }, 2000);
  };

  return (
    <div className="card-battle-container">
      <div className="battle-header">
        <h3>⚔️ ENTRENAMIENTO</h3>
        <p>Elegí 5 cartas y enfrentate a un rival</p>
      </div>
      
      {!battling && !result && (
        <div className="battle-options">
          <button className="battle-btn bot" onClick={startBattle}>
            <span className="btn-icon">🤖</span>
            ENTRENAR vs BOT
            <span className="btn-reward">+10-50 exp</span>
          </button>
          {userDeck.cards.length < 5 && (
            <div className="warning">⚠️ Necesitás 5 cartas en tu mazo para jugar</div>
          )}
        </div>
      )}
      
      {battling && (
        <div className="battle-arena">
          <div className="battle-loading">
            <div className="spinner-lg" />
            <p>¡Preparando la batalla!</p>
            <div className="vs-text">VS</div>
          </div>
        </div>
      )}
      
      {result && (
        <div className={`battle-result ${result.winner === 'user' ? 'victory' : 'defeat'}`}>
          <div className="result-icon">{result.winner === 'user' ? '🏆' : '💔'}</div>
          <div className="result-title">{result.winner === 'user' ? '¡VICTORIA!' : 'DERROTA'}</div>
          <div className="result-score">{result.userScore} - {result.opponentScore}</div>
          {result.bonusMessage && <div className="result-bonus">{result.bonusMessage}</div>}
          <div className="result-exp">⭐ +{result.experienceGained} experiencia</div>
          {result.leveledUpCards.length > 0 && (
            <div className="level-up-list">
              {result.leveledUpCards.map(name => (
                <div key={name} className="level-up-item">🎉 {name} subió de nivel!</div>
              ))}
            </div>
          )}
          <button className="close-result" onClick={() => setResult(null)}>Continuar</button>
        </div>
      )}
      
      <style>{`
        .card-battle-container {
          background: var(--surface);
          border-radius: 20px;
          padding: 20px;
          margin: 16px 0;
        }
        .battle-header { text-align: center; margin-bottom: 20px; }
        .battle-header h3 { font-family: var(--font-display); font-size: 24px; color: var(--accent); }
        .battle-options { display: flex; flex-direction: column; gap: 12px; }
        .battle-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border: none;
          border-radius: 16px;
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .battle-btn.bot { background: linear-gradient(135deg, #4a4a6a, #2a2a4a); color: white; }
        .battle-btn:hover { transform: translateY(-2px); }
        .btn-reward { font-size: 12px; opacity: 0.8; }
        .warning { text-align: center; color: #ff4d6d; font-size: 12px; margin-top: 8px; }
        .battle-arena { text-align: center; padding: 40px; }
        .vs-text { font-size: 48px; font-weight: bold; color: var(--accent); margin-top: 20px; animation: pulse 1s infinite; }
        .battle-result { text-align: center; padding: 20px; border-radius: 16px; }
        .battle-result.victory { background: linear-gradient(135deg, rgba(61,255,160,0.1), rgba(61,255,160,0.02)); border: 1px solid var(--success); }
        .battle-result.defeat { background: linear-gradient(135deg, rgba(255,77,109,0.1), rgba(255,77,109,0.02)); border: 1px solid var(--accent2); }
        .result-icon { font-size: 64px; margin-bottom: 8px; }
        .result-title { font-family: var(--font-display); font-size: 32px; margin-bottom: 8px; }
        .result-score { font-size: 36px; font-weight: bold; margin-bottom: 16px; }
        .result-exp { font-size: 16px; color: var(--accent); margin-bottom: 16px; }
        .result-bonus { font-size: 14px; color: #ffd700; margin-bottom: 12px; }
        .level-up-list { margin: 16px 0; padding: 12px; background: rgba(255,215,0,0.1); border-radius: 12px; }
        .level-up-item { font-size: 14px; margin: 4px 0; }
        .close-result { background: var(--accent); border: none; border-radius: 12px; padding: 12px 24px; font-family: var(--font-display); font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 16px; }
      `}</style>
    </div>
  );
}