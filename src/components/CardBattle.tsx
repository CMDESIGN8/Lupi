// src/components/CardBattle.tsx - Versión CORREGIDA

import { useState } from 'react';
import { UserCard, Deck, UnifiedCard } from '../types/cards';
import { calculateBattle, addExperienceToCard } from '../utils/battleEngine';
import { supabase } from '../lib/supabaseClient';

interface CardBattleProps {
  userCards: UserCard[];
  userDeck: Deck;
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
  onNavigateToDeck?: () => void;
}

// Función helper para obtener datos de la carta (ya sea de card o de player)
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
    // Usar UnifiedCard
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
  
  // Fallback para compatibilidad (si card.player existía antes)
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

function getPlayerPosition(card: UserCard): string {
  return getCardData(card).position;
}

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  arquero: { x: 8,  y: 50 },
  cierre:  { x: 22, y: 28 },
  ala:     { x: 22, y: 72 },
  pivot:   { x: 38, y: 50 },
};

const RIVAL_POSITION_COORDS: Record<string, { x: number; y: number }> = {
  arquero: { x: 92, y: 50 },
  cierre:  { x: 78, y: 28 },
  ala:     { x: 78, y: 72 },
  pivot:   { x: 62, y: 50 },
};

const BOT_PLAYERS = [
  { name: 'Bot Novato',  overall_rating: 55, category: '8va', position: 'ala',   level: 1, avatar: '🥉', color: '#7a7a9a' },
  { name: 'Bot Experto', overall_rating: 65, category: '7ma', position: 'cierre', level: 2, avatar: '🥈', color: '#a0a0c0' },
  { name: 'Bot Leyenda', overall_rating: 75, category: '6ta', position: 'pivot',  level: 3, avatar: '🥇', color: '#ffd700' },
];

const POSITION_ICONS: Record<string, string> = {
  arquero: '🧤',
  cierre:  '🛡️',
  ala:     '⚡',
  pivot:   '🎯',
};

export function CardBattle({ userCards, userDeck, userId, onBattleComplete, onNavigateToDeck }: CardBattleProps) {
  const [battling, setBattling]     = useState(false);
  const [selectedBot, setSelectedBot] = useState<typeof BOT_PLAYERS[0]>(BOT_PLAYERS[0]);
  const [result, setResult]         = useState<any>(null);

  const startBattle = async () => {
    if (!userDeck.cards || userDeck.cards.length < 5) {
      alert('Necesitás 5 cartas en tu mazo para jugar');
      return;
    }

    setBattling(true);

    const bot = selectedBot;

    const makeBot = (id: string, pos: string, label: string): UserCard => ({
      id,
      user_id: 'bot',
      player_id: `bot-${bot.name}`,
      level: bot.level,
      experience: 0,
      is_favorite: false,
      obtained_at: new Date().toISOString(),
      card_type: 'npc',
      card: {
        id: `bot-${bot.name}`,
        name: `${bot.name} (${label})`,
        position: pos as any,
        category: bot.category as any,
        overall_rating: bot.overall_rating,
        pace: 50 + bot.level * 5,
        dribbling: 50 + bot.level * 5,
        passing: 50 + bot.level * 5,
        defending: 50 + bot.level * 5,
        finishing: 50 + bot.level * 5,
        physical: 50 + bot.level * 5,
        card_type: 'npc',
        can_be_replaced: false,
        is_replaced: false,
      } as any,
    });

    const opponentCards: UserCard[] = [
      makeBot('bot-0', 'arquero', 'Arq'),
      makeBot('bot-1', 'cierre',  'Cierre'),
      makeBot('bot-2', 'ala',     'Ala'),
      makeBot('bot-3', 'pivot',   'Pivot'),
      makeBot('bot-4', 'ala',     'Ala 2'),
    ];

    setTimeout(async () => {
      const userBattleCards = userDeck.cards.map(card => ({ ...card, position: undefined })) as UserCard[];

      const battleResult = calculateBattle(
        userBattleCards,
        opponentCards,
        userBattleCards[0]?.card?.category || '1era',
        opponentCards[0]?.card?.category || '8va'
      );

      let leveledUpCards: string[] = [];
      const updatedCards = [...userBattleCards];

      for (let i = 0; i < updatedCards.length; i++) {
        if (!updatedCards[i]) continue;
        const { card, leveledUp } = addExperienceToCard(updatedCards[i], battleResult.experienceGained);
        updatedCards[i] = card;
        if (leveledUp) leveledUpCards.push(getCardData(card).name);
        await supabase.from('user_cards').update({ level: card.level, experience: card.experience }).eq('id', card.id);
      }

      try {
        const { updateUserProgression } = await import('../utils/userProgression');
        await updateUserProgression(userId, { type: battleResult.winner === 'user' ? 'battle_win' : 'battle_lose' });
      } catch (err) { console.error(err); }

      await supabase.from('matches').insert({
        user_id: userId,
        opponent_type: 'bot',
        user_deck_id: userDeck.id,
        user_score: battleResult.userScore,
        opponent_score: battleResult.opponentScore,
        winner_id: battleResult.winner === 'user' ? userId : null,
        experience_gained: battleResult.experienceGained,
      });

      setResult({
        winner: battleResult.winner,
        userScore: battleResult.userScore,
        opponentScore: battleResult.opponentScore,
        experienceGained: battleResult.experienceGained,
        leveledUpCards,
        bonusMessage: battleResult.bonusMessage,
        bot,
      });

      setBattling(false);
      onBattleComplete(updatedCards);
    }, 2500);
  };

  const cardsCount    = userDeck.cards?.length || 0;
  const needsMoreCards = cardsCount < 5;

  const getPlayersByPosition = () => {
    const players = userDeck.cards || [];
    const positions: Record<string, UserCard | null> = { arquero: null, cierre: null, ala: null, pivot: null };
    players.forEach(player => {
      const pos = getPlayerPosition(player);
      if (positions[pos] === null) positions[pos] = player;
    });
    return positions;
  };

  const playersByPosition = getPlayersByPosition();

  const expByLevel: Record<number, number> = { 1: 10, 2: 25, 3: 50 };

  return (
    <div className="arena-container">
      {/* ── Encabezado ── */}
      <div className="arena-header">
        <div className="arena-title">
          <span className="arena-icon">⚽</span>
          <span>PIZARRA TÁCTICA</span>
          <span className="arena-badge">FUTSAL</span>
        </div>
        <button className="deck-link-btn" onClick={onNavigateToDeck}>
          📋 MI EQUIPO
          <span className="deck-count">{cardsCount}/5</span>
        </button>
      </div>

      {/* ── Cancha ── */}
      <div className="futsal-court">
        {/* SVG de cancha (igual que antes) */}
        <svg className="court-svg" viewBox="0 0 600 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="14" width="572" height="372" rx="10" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
          <line x1="300" y1="14" x2="300" y2="386" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
          <circle cx="300" cy="200" r="58" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
          <circle cx="300" cy="200" r="4" fill="rgba(255,255,255,0.6)"/>
          <path d="M 14,105 A 95,95 0 0,1 14,295" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3"/>
          <path d="M 586,105 A 95,95 0 0,0 586,295" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3"/>
          <path d="M 14,155 A 45,45 0 0,1 14,245" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
          <path d="M 586,155 A 45,45 0 0,0 586,245" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
          <rect x="0" y="162" width="14" height="76" rx="2" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"/>
          <rect x="586" y="162" width="14" height="76" rx="2" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"/>
          <circle cx="110" cy="200" r="3.5" fill="rgba(255,255,255,0.65)"/>
          <circle cx="490" cy="200" r="3.5" fill="rgba(255,255,255,0.65)"/>
          <circle cx="300" cy="200" r="3" fill="rgba(255,255,255,0.5)"/>
        </svg>

        <div className="center-vs">VS</div>

        {/* ── Jugadores usuario ── */}
        {!battling && !result && (
          <>
            {(Object.keys(POSITION_COORDS) as string[]).map(pos => {
              const card = playersByPosition[pos];
              const cardData = card ? getCardData(card) : null;
              return (
                <div
                  key={pos}
                  className="player-on-court"
                  style={{ left: `${POSITION_COORDS[pos].x}%`, top: `${POSITION_COORDS[pos].y}%` }}
                >
                  <div className={`player-token user-token ${!card ? 'empty' : ''}`}>
                    <div className="token-icon">{POSITION_ICONS[pos]}</div>
                    <div className="token-name">{cardData?.name?.substring(0, 10) || pos.charAt(0).toUpperCase() + pos.slice(1)}</div>
                    {card
                      ? <div className="token-level user-level">Nv.{card.level}</div>
                      : <div className="token-empty">Sin jugador</div>
                    }
                  </div>
                  <div className="pos-label">{pos.toUpperCase()}</div>
                </div>
              );
            })}

            {/* ── Jugadores rival ── */}
            {(Object.keys(RIVAL_POSITION_COORDS) as string[]).map(pos => (
              <div
                key={`rival-${pos}`}
                className="player-on-court"
                style={{ left: `${RIVAL_POSITION_COORDS[pos].x}%`, top: `${RIVAL_POSITION_COORDS[pos].y}%` }}
              >
                <div className="player-token rival-token">
                  <div className="token-icon">{selectedBot.avatar}</div>
                  <div className="token-name">{selectedBot.name.split(' ')[1]?.substring(0, 6) ?? selectedBot.name.substring(0, 6)} {pos.substring(0, 3).toUpperCase()}</div>
                  <div className="token-level rival-level">Nv.{selectedBot.level}</div>
                </div>
                <div className="pos-label">{pos.toUpperCase()}</div>
              </div>
            ))}
          </>
        )}

        {/* ── Overlay de batalla ── */}
        {battling && (
          <div className="battle-overlay">
            <div className="battle-inner">
              <div className="battle-teams">
                <div className="battle-team">
                  <div className="battle-avatar">🎮</div>
                  <div className="battle-name">TU EQUIPO</div>
                  <div className="hp-bar"><div className="hp-fill" /></div>
                </div>
                <div className="battle-vs-icon">⚔️</div>
                <div className="battle-team">
                  <div className="battle-avatar">{selectedBot.avatar}</div>
                  <div className="battle-name">{selectedBot.name}</div>
                  <div className="hp-bar"><div className="hp-fill rival-hp" /></div>
                </div>
              </div>
              <div className="ball-wrap">
                <div className="ball-anim">⚽</div>
                <div className="loading-txt">¡Preparando el partido!</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Selector de rival ── */}
      {!battling && !result && (
        <div className="rival-selector">
          <div className="rival-selector-title">⚔️ ELEGIR RIVAL</div>
          <div className="rival-selector-row">
            {BOT_PLAYERS.map(bot => (
              <button
                key={bot.name}
                className={`bot-card ${selectedBot.name === bot.name ? 'selected' : ''}`}
                onClick={() => setSelectedBot(bot)}
                style={{ '--bot-color': bot.color } as React.CSSProperties}
              >
                <span className="bot-avatar">{bot.avatar}</span>
                <span className="bot-name">{bot.name.replace('Bot ', '')}</span>
                <span className="bot-ovr">OVR {bot.overall_rating}</span>
                <span className="bot-exp">+{expByLevel[bot.level]} exp</span>
              </button>
            ))}
          </div>

          {needsMoreCards ? (
            <button className="cta-btn deck-btn" onClick={onNavigateToDeck}>
              📦 AGREGAR JUGADORES AL EQUIPO
            </button>
          ) : (
            <button className="cta-btn start-btn" onClick={startBattle}>
              ▶ INICIAR PARTIDO VS {selectedBot.name.toUpperCase()}
            </button>
          )}
        </div>
      )}

      {/* ── Resultado ── */}
      {result && (
        <div className={`result-card ${result.winner === 'user' ? 'win' : 'lose'}`}>
          <div className="result-glow" />
          <div className="result-title">{result.winner === 'user' ? '🏆 ¡VICTORIA!' : '💔 DERROTA'}</div>
          <div className="result-score">{result.userScore} – {result.opponentScore}</div>
          <div className="result-rewards">
            <div className="reward-row">✨ +{result.experienceGained} EXP para tus jugadores</div>
            <div className="reward-row">⭐ +{result.winner === 'user' ? 15 : 10} puntos</div>
          </div>
          {result.leveledUpCards.length > 0 && (
            <div className="levelup-banner">
              🎉 {result.leveledUpCards.join(', ')} subieron de nivel
            </div>
          )}
          <button className="cta-btn start-btn" onClick={() => setResult(null)}>
            JUGAR DE NUEVO
          </button>
        </div>
      )}

      {/* ══════════════ ESTILOS ══════════════ */}
      <style>{`
        /* ── Contenedor principal ── */
        .arena-container {
          background: linear-gradient(150deg, #0a2a18, #0a1510);
          border-radius: 24px;
          padding: 18px;
          margin: 16px 0;
          border: 1px solid rgba(61,255,160,0.35);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        /* ── Header ── */
        .arena-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .arena-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: bold;
          color: #3dffa0;
          letter-spacing: 1px;
        }
        .arena-icon { font-size: 22px; }
        .arena-badge {
          font-size: 9px;
          padding: 2px 8px;
          border-radius: 20px;
          background: rgba(61,255,160,0.15);
          color: #3dffa0;
          border: 1px solid rgba(61,255,160,0.3);
          letter-spacing: 1.5px;
        }
        .deck-link-btn {
          background: rgba(61,255,160,0.1);
          border: 1px solid #3dffa0;
          border-radius: 40px;
          padding: 6px 14px;
          color: #3dffa0;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .deck-link-btn:hover { background: rgba(61,255,160,0.2); }
        .deck-count {
          background: #3dffa0;
          color: #0a0a0f;
          border-radius: 20px;
          padding: 1px 6px;
          font-size: 10px;
        }

        /* ── Cancha ── */
        .futsal-court {
          position: relative;
          width: 100%;
          height: 420px;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,0.12);
          /* Pasto con franjas */
          background:
            repeating-linear-gradient(
              90deg,
              rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 40px,
              transparent 40px, transparent 80px
            ),
            linear-gradient(90deg, #1a4a26 0%, #1e5c2e 50%, #1a4a26 100%);
        }

        .court-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .center-vs {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 16px;
          font-weight: bold;
          color: rgba(255,255,255,0.2);
          letter-spacing: 3px;
          z-index: 4;
          pointer-events: none;
        }

        /* ── Fichas de jugador ── */
        .player-on-court {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .player-token {
          width: 64px;
          border-radius: 12px;
          padding: 8px 6px 6px;
          text-align: center;
          border: 1.5px solid;
          backdrop-filter: blur(6px);
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: default;
        }
        .player-token:not(.empty):hover {
          transform: scale(1.06);
        }

        .user-token {
          background: rgba(30,200,120,0.18);
          border-color: rgba(30,200,120,0.65);
        }
        .user-token:not(.empty):hover {
          box-shadow: 0 0 14px rgba(30,200,120,0.35);
          border-color: #3dffa0;
        }

        .rival-token {
          background: rgba(255,110,60,0.18);
          border-color: rgba(255,110,60,0.6);
        }
        .rival-token:hover {
          box-shadow: 0 0 14px rgba(255,110,60,0.35);
          border-color: #ff7040;
        }

        .player-token.empty {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.18);
          opacity: 0.55;
        }

        .token-icon { font-size: 20px; line-height: 1; display: block; }
        .token-name {
          font-size: 9px;
          font-weight: bold;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 58px;
          margin-top: 4px;
        }
        .token-level { font-size: 8px; margin-top: 2px; }
        .user-level  { color: #3dffa0; }
        .rival-level { color: #ff9060; }
        .token-empty { font-size: 8px; color: rgba(255,255,255,0.35); margin-top: 2px; }

        .pos-label {
          font-size: 7px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.45);
          background: rgba(0,0,0,0.5);
          padding: 1px 5px;
          border-radius: 8px;
        }

        /* ── Overlay de batalla ── */
        .battle-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.88);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .battle-inner { text-align: center; padding: 24px; }
        .battle-teams {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          margin-bottom: 28px;
        }
        .battle-team { text-align: center; }
        .battle-avatar { font-size: 48px; margin-bottom: 8px; }
        .battle-name { font-size: 13px; font-weight: bold; color: #fff; margin-bottom: 8px; }
        .hp-bar {
          width: 110px;
          height: 6px;
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
          overflow: hidden;
        }
        .hp-fill {
          height: 100%;
          background: linear-gradient(90deg, #3dffa0, #20c070);
          border-radius: 4px;
          animation: hpPulse 1s infinite;
        }
        .rival-hp {
          background: linear-gradient(90deg, #ff4d6d, #ff7040);
        }
        @keyframes hpPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
        .battle-vs-icon {
          font-size: 30px;
          animation: pulse 0.6s infinite;
        }
        @keyframes pulse {
          0%,100% { transform: scale(1);    opacity: 0.7; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        .ball-wrap { margin-top: 8px; }
        .ball-anim {
          font-size: 44px;
          animation: ballRoll 1s infinite;
          display: inline-block;
          margin-bottom: 10px;
        }
        @keyframes ballRoll {
          0%   { transform: rotate(0deg)   translateX(-12px); }
          50%  { transform: rotate(180deg) translateX(12px); }
          100% { transform: rotate(360deg) translateX(-12px); }
        }
        .loading-txt { font-size: 13px; color: rgba(255,255,255,0.5); }

        /* ── Selector de rival ── */
        .rival-selector {
          margin-top: 14px;
          background: rgba(0,0,0,0.3);
          border-radius: 18px;
          padding: 14px 16px 16px;
          border: 1px solid rgba(255,100,50,0.2);
        }
        .rival-selector-title {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.35);
          text-align: center;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .rival-selector-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .bot-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 6px;
          border-radius: 14px;
          border: 1.5px solid rgba(255,100,50,0.3);
          background: rgba(255,100,50,0.06);
          cursor: pointer;
          color: #fff;
          transition: all 0.18s;
        }
        .bot-card:hover {
          background: rgba(255,100,50,0.14);
          border-color: rgba(255,100,50,0.65);
          transform: translateY(-3px);
        }
        .bot-card.selected {
          background: rgba(255,100,50,0.2);
          border-color: var(--bot-color, #ff7040);
          box-shadow: 0 0 12px rgba(255,100,50,0.25);
        }
        .bot-avatar { font-size: 22px; }
        .bot-name   { font-size: 11px; font-weight: bold; }
        .bot-ovr    { font-size: 9px; color: #ff9060; }
        .bot-exp    { font-size: 9px; color: #3dffa0; }

        /* ── Botones CTA ── */
        .cta-btn {
          width: 100%;
          padding: 12px;
          border-radius: 40px;
          border: none;
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cta-btn:hover { transform: translateY(-2px); opacity: 0.9; }

        .start-btn {
          background: linear-gradient(90deg, #ff4d6d, #ff7040);
          color: #fff;
        }
        .deck-btn {
          background: rgba(61,255,160,0.1);
          border: 1px solid #3dffa0 !important;
          color: #3dffa0;
        }
        .deck-btn:hover { background: rgba(61,255,160,0.2) !important; }

        /* ── Resultado ── */
        .result-card {
          text-align: center;
          padding: 24px 20px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          margin-top: 16px;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .result-card.win  { background: linear-gradient(135deg, rgba(61,255,160,0.18), rgba(61,255,160,0.04)); border: 1px solid #3dffa0; }
        .result-card.lose { background: linear-gradient(135deg, rgba(255,77,109,0.18), rgba(255,77,109,0.04)); border: 1px solid #ff4d6d; }
        .result-glow {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, #3dffa0, transparent);
        }
        .result-card.lose .result-glow {
          background: linear-gradient(90deg, transparent, #ff4d6d, transparent);
        }
        .result-title  { font-size: 26px; font-weight: bold; margin-bottom: 10px; }
        .result-score  { font-size: 44px; font-weight: bold; margin-bottom: 14px; letter-spacing: 4px; }
        .result-rewards { margin: 14px 0; }
        .reward-row    { font-size: 13px; margin: 6px 0; color: rgba(255,255,255,0.85); }
        .levelup-banner {
          font-size: 12px;
          color: #ffd700;
          padding: 8px 12px;
          background: rgba(255,215,0,0.1);
          border-radius: 12px;
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
}