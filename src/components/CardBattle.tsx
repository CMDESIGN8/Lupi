// src/components/CardBattle.tsx (versión corregida)
import { useState } from 'react';
import { UserCard, Deck } from '../types/cards';
import { calculateBattle, addExperienceToCard } from '../utils/battleEngine';
import { supabase } from '../lib/supabaseClient';
import { POSITION_ICONS } from '../utils/cardGenerator';

interface CardBattleProps {
  userCards: UserCard[];
  userDeck: Deck;  // Deck tiene cards: (UserCard & { position: number })[]
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
}

// Bots predefinidos
const BOT_PLAYERS = [
  { name: 'Bot Novato', overall_rating: 55, category: '8va', position: 'ala', level: 1 },
  { name: 'Bot Experto', overall_rating: 65, category: '7ma', position: 'cierre', level: 2 },
  { name: 'Bot Leyenda', overall_rating: 75, category: '6ta', position: 'pivot', level: 3 },
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
    // Verificar que el mazo tiene 5 cartas
    if (!userDeck.cards || userDeck.cards.length < 5) {
      alert('Necesitás 5 cartas en tu mazo para jugar');
      return;
    }
    
    setBattling(true);
    
    // Seleccionar bot aleatorio
    const randomBot = BOT_PLAYERS[Math.floor(Math.random() * BOT_PLAYERS.length)];
    
    // Crear cartas del oponente (5 veces la misma carta base)
    const opponentCards: UserCard[] = Array(5).fill(null).map((_, i) => ({
      id: `bot-${i}`,
      user_id: 'bot',
      player_id: `bot-${randomBot.name}`,
      level: randomBot.level,
      experience: 0,
      is_favorite: false,
      obtained_at: new Date().toISOString(),
      player: {
        id: `bot-${randomBot.name}`,
        name: randomBot.name,
        position: randomBot.position as any,
        category: randomBot.category as any,
        overall_rating: randomBot.overall_rating,
        pace: 50 + randomBot.level * 5,
        dribbling: 50 + randomBot.level * 5,
        passing: 50 + randomBot.level * 5,
        defending: 50 + randomBot.level * 5,
        finishing: 50 + randomBot.level * 5,
        physical: 50 + randomBot.level * 5,
        created_at: new Date().toISOString()
      }
    }));
    
    // Simular delay de batalla
    setTimeout(async () => {
      // Extraer las cartas del mazo (sin la posición)
      const userBattleCards = userDeck.cards.map(card => ({
        ...card,
        position: undefined  // Quitamos position para la batalla
      })) as UserCard[];
      
      const userCategory = userBattleCards[0]?.player?.category;
      const opponentCategory = opponentCards[0]?.player?.category;
      
      const battleResult = calculateBattle(
        userBattleCards,
        opponentCards,
        userCategory,
        opponentCategory
      );
      
      // Aplicar experiencia a las cartas del usuario
      let leveledUpCards: string[] = [];
      const updatedCards = [...userBattleCards];
      
      for (let i = 0; i < updatedCards.length; i++) {
        if (!updatedCards[i]) continue;
        
        const { card, leveledUp } = addExperienceToCard(updatedCards[i], battleResult.experienceGained);
        updatedCards[i] = card;
        if (leveledUp) leveledUpCards.push(card.player.name);
        
        // Actualizar en base de datos
        await supabase
          .from('user_cards')
          .update({ level: card.level, experience: card.experience })
          .eq('id', card.id);
      }
      
      // Registrar partida
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
      
      {/* Vista previa del mazo */}
      <div className="deck-preview">
        <div className="deck-title">📋 Tu mazo ({userDeck.cards?.length || 0}/5)</div>
        <div className="deck-cards">
          {userDeck.cards?.map((card, idx) => (
            <div key={card.id} className="deck-card">
              <div className="deck-card-name">{card.player?.name || '???'}</div>
              <div className="deck-card-level">Nv.{card.level}</div>
            </div>
          ))}
          {userDeck.cards?.length < 5 && Array(5 - (userDeck.cards?.length || 0)).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="deck-card empty">
              <div className="deck-card-name">❓ Vacío</div>
              <div className="deck-card-level">-</div>
            </div>
          ))}
        </div>
      </div>
      
      {!battling && !result && (
        <div className="battle-options">
          <button 
            className="battle-btn bot" 
            onClick={startBattle}
            disabled={!userDeck.cards || userDeck.cards.length < 5}
          >
            <span className="btn-icon">🤖</span>
            ENTRENAR vs BOT
            <span className="btn-reward">+10-50 exp</span>
          </button>
          {(!userDeck.cards || userDeck.cards.length < 5) && (
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
        
        .deck-preview {
          background: var(--surface2);
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .deck-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
          color: var(--text2);
        }
        .deck-cards {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .deck-card {
          flex: 1;
          min-width: 60px;
          background: var(--surface);
          border-radius: 12px;
          padding: 8px;
          text-align: center;
          border: 1px solid var(--border);
        }
        .deck-card.empty {
          opacity: 0.5;
          background: rgba(255,255,255,0.02);
        }
        .deck-card-name {
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .deck-card-level {
          font-size: 9px;
          color: var(--accent);
          margin-top: 4px;
        }
        
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
        .battle-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .battle-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
