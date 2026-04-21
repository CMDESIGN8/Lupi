// src/components/CardBattle.tsx — Versión ADICTIVA completa
// Mejoras incluidas:
//   1. Sistema de racha con bonus XP multiplicado
//   2. Log de batalla por turnos async con HP en tiempo real
//   3. Rivales bloqueados por victorias acumuladas
//   4. Monedas como recompensa variable
//   5. Desafíos diarios persistidos en Supabase
//   6. Barra de XP visible en el header de batalla

import { useState, useRef, useEffect } from 'react';
import { UserCard, Deck, UnifiedCard } from '../types/cards';
import { calculateBattle, addExperienceToCard } from '../utils/battleEngine';
import { supabase } from '../lib/supabaseClient';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CardBattleProps {
  userCards: UserCard[];
  userDeck: Deck;
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
  onNavigateToDeck?: () => void;
}

interface BotPlayer {
  name: string;
  overall_rating: number;
  category: string;
  position: string;
  level: number;
  avatar: string;
  color: string;
  xpBase: number;
  ptsBase: number;
  coinsBase: number;
  reqWins: number; // victorias necesarias para desbloquear
}

interface DailyChallenge {
  id: string;
  icon: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
}

interface BattleLogLine {
  text: string;
  type: 'neutral' | 'good' | 'bad' | 'event';
}

interface BattleState {
  userHP: number;
  rivalHP: number;
  userGoals: number;
  rivalGoals: number;
}

interface UserStats {
  level: number;
  xp: number;
  xp_needed: number;
  total_wins: number;
  streak: number;
  coins: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const BOT_PLAYERS: BotPlayer[] = [
  {
    name: 'Bot Novato',
    overall_rating: 55,
    category: '8va',
    position: 'ala',
    level: 1,
    avatar: '🥉',
    color: '#7a7a9a',
    xpBase: 10,
    ptsBase: 8,
    coinsBase: 5,
    reqWins: 0,
  },
  {
    name: 'Bot Experto',
    overall_rating: 65,
    category: '7ma',
    position: 'cierre',
    level: 2,
    avatar: '🥈',
    color: '#a0a0c0',
    xpBase: 25,
    ptsBase: 15,
    coinsBase: 12,
    reqWins: 3,
  },
  {
    name: 'Bot Leyenda',
    overall_rating: 78,
    category: '6ta',
    position: 'pivot',
    level: 3,
    avatar: '🥇',
    color: '#ffd700',
    xpBase: 50,
    ptsBase: 30,
    coinsBase: 25,
    reqWins: 10,
  },
];  


// Reemplazar POSITION_COORDS con esta nueva configuración
// En futsal formación rombo: 1 arquero + 2 laterales/alas + 1 cierre + 1 pivot
const FORMATION_ROMBO = [
  { role: 'arquero', x: 8, y: 50, requiredPosition: 'arquero' },
  { role: 'cierre', x: 22, y: 50, requiredPosition: 'cierre' },      // defensa central
  { role: 'ala_izq', x: 30, y: 25, requiredPosition: 'ala' },        // ala izquierda
  { role: 'ala_der', x: 30, y: 75, requiredPosition: 'ala' },        // ala derecha
  { role: 'pivot', x: 45, y: 50, requiredPosition: 'pivot' },        // delantero
];


const POSITION_ICONS: Record<string, string> = {
  arquero: '🧤',
  cierre: '🛡️',
  ala: '⚡',
  pivot: '🎯',
};

const GOAL_MESSAGES = [
  (name: string) => `⚽ ¡GOOOL! ${name} la clava en el ángulo!`,
  (name: string) => `🔥 ¡${name} no perdona y marca!`,
  (name: string) => `💥 ¡Golazo de ${name}!`,
  (name: string) => `🎯 ¡${name} define solo ante el arquero!`,
];

const MISS_MESSAGES = [
  '😤 Tiro al palo, qué mala suerte.',
  '🧤 El arquero lo para con una mano.',
  '😱 Solo ante el arco... y la manda afuera.',
  '🛡️ La defensa despeja en el último momento.',
];

const RIVAL_GOAL_MESSAGES = [
  (botName: string) => `💔 El ${botName} marca de contra!`,
  (botName: string) => `😤 El ${botName} aprovecha el error y convierte!`,
  (botName: string) => `😰 Golazo del ${botName}! Hay que reaccionar.`,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCardData(card: UserCard) {
  if (card.card) return card.card;
  const player = (card as any).player;
  if (player) return player;
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
    category: '1era',
  };
}

function getPlayerPosition(card: UserCard): string {
  return getCardData(card).position;
}

function calcTeamOvr(cards: UserCard[]): number {
  if (!cards.length) return 50;
  return Math.round(cards.reduce((s, c) => s + getCardData(c).overall_rating, 0) / cards.length);
}

// ─── Desafíos diarios base ────────────────────────────────────────────────────

function buildDailyChallenges(): DailyChallenge[] {
  return [
    {
      id: 'win3',
      icon: '🏆',
      name: 'Hat-trick de victorias',
      description: 'Ganar 3 partidos hoy',
      target: 3,
      progress: 0,
      xpReward: 50,
      completed: false,
    },
    {
      id: 'score5',
      icon: '⚽',
      name: 'Goleador del día',
      description: 'Marcar 5 goles en total',
      target: 5,
      progress: 0,
      xpReward: 30,
      completed: false,
    },
    {
      id: 'beat_legend',
      icon: '🥇',
      name: 'Mata-gigantes',
      description: 'Vencer a Bot Leyenda',
      target: 1,
      progress: 0,
      xpReward: 100,
      completed: false,
    },
  ];
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CardBattle({
  userCards,
  userDeck,
  userId,
  onBattleComplete,
  onNavigateToDeck,
}: CardBattleProps) {
  // ── Estados de UI ──
  const [phase, setPhase] = useState<'select' | 'battle' | 'result'>('select');
  const [selectedBot, setSelectedBot] = useState<BotPlayer>(BOT_PLAYERS[0]);

  // ── Stats del usuario ──
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xp_needed: 100,
    total_wins: 0,
    streak: 0,
    coins: 0,
  });
  const [leveledUp, setLeveledUp] = useState(false);

  // ── Batalla en tiempo real ──
  const [battleState, setBattleState] = useState<BattleState>({
    userHP: 100,
    rivalHP: 100,
    userGoals: 0,
    rivalGoals: 0,
  });
  const [battleLog, setBattleLog] = useState<BattleLogLine[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // ── Resultado ──
  const [result, setResult] = useState<{
    winner: 'user' | 'opponent';
    userScore: number;
    opponentScore: number;
    xpGained: number;
    ptsGained: number;
    coinsGained: number;
    leveledUpCards: string[];
    streakBonus: number;
    statUpgrade: {
      cardName: string;
      stat: 'finishing' | 'defending';
      oldValue: number;
      newValue: number;
    } | null;
  } | null>(null);

  // ── Desafíos ──
  const [challenges, setChallenges] = useState<DailyChallenge[]>(buildDailyChallenges());

  // ─── Cargar stats del usuario ──────────────────────────────────────────────

  useEffect(() => {
    loadUserStats();
    loadDailyChallenges();
  }, [userId]);

  const loadUserStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setUserStats({
        level: data.level || 1,
        xp: data.xp || 0,
        xp_needed: data.xp_needed || 100,
        total_wins: data.total_wins || 0,
        streak: data.streak || 0,
        coins: data.coins || 0,
      });
    }
  };

  const loadDailyChallenges = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    if (data && data.length > 0) {
      const base = buildDailyChallenges();
      const merged = base.map(c => {
        const saved = data.find((d: any) => d.challenge_id === c.id);
        if (saved) return { ...c, progress: saved.progress, completed: saved.completed };
        return c;
      });
      setChallenges(merged);
    }
  };

  const saveDailyChallenges = async (updated: DailyChallenge[]) => {
    const today = new Date().toISOString().split('T')[0];
    for (const c of updated) {
      await supabase.from('daily_challenges').upsert({
        user_id: userId,
        date: today,
        challenge_id: c.id,
        progress: c.progress,
        completed: c.completed,
      }, { onConflict: 'user_id,date,challenge_id' });
    }
  };

  // ─── Auto-scroll del log ───────────────────────────────────────────────────

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  // ─── Helpers de batalla ───────────────────────────────────────────────────

  const addLog = (text: string, type: BattleLogLine['type'] = 'neutral') => {
    setBattleLog(prev => [...prev, { text, type }]);
  };

  const makeBot = (id: string, pos: string, label: string, bot: BotPlayer): UserCard => ({
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

  // ─── Batalla principal: loop por turnos ───────────────────────────────────

  const startBattle = async () => {
    if (!userDeck.cards || userDeck.cards.length < 5) {
      alert('Necesitás 5 cartas en tu mazo para jugar');
      return;
    }

    const bot = selectedBot;
    setBattleLog([]);
    setBattleState({ userHP: 100, rivalHP: 100, userGoals: 0, rivalGoals: 0 });
    setPhase('battle');

    const userBattleCards = userDeck.cards as UserCard[];
    const opponentCards: UserCard[] = [
      makeBot('bot-0', 'arquero', 'Arq', bot),
      makeBot('bot-1', 'cierre', 'Cierre', bot),
      makeBot('bot-2', 'ala', 'Ala', bot),
      makeBot('bot-3', 'pivot', 'Pivot', bot),
      makeBot('bot-4', 'ala', 'Ala 2', bot),
    ];

    const userOvr = calcTeamOvr(userBattleCards);
    const advantage = Math.max(-0.3, Math.min(0.3, (userOvr - bot.overall_rating) / 100));

    let uHP = 100, rHP = 100, uGoals = 0, rGoals = 0;
    const rounds = 8;
    const playerNames = userBattleCards.map(c => getCardData(c).name);

    await delay(300);
    addLog('⚽ ¡Silbato inicial! El partido arranca.', 'event');

    for (let r = 1; r <= rounds; r++) {
      await delay(600);

      // Calcular probabilidades con advantage del usuario
      const uAttack = 0.3 + advantage * 0.4 + Math.random() * 0.45;
      const rAttack = 0.3 - advantage * 0.3 + Math.random() * 0.45;

      if (uAttack > 0.58) {
        const dmg = Math.round(6 + Math.random() * 14);
        rHP = Math.max(0, rHP - dmg);

        if (Math.random() < 0.4) {
          uGoals++;
          const msg = GOAL_MESSAGES[Math.floor(Math.random() * GOAL_MESSAGES.length)];
          const scorer = playerNames[Math.floor(Math.random() * playerNames.length)];
          addLog(msg(scorer), 'good');
          addLog(`  Marcador: ${uGoals} – ${rGoals}`, 'good');
        } else {
          addLog(MISS_MESSAGES[Math.floor(Math.random() * MISS_MESSAGES.length)], 'neutral');
        }
      } else if (rAttack > 0.58) {
        const dmg = Math.round(4 + Math.random() * 10);
        uHP = Math.max(0, uHP - dmg);

        if (Math.random() < 0.35) {
          rGoals++;
          const msg = RIVAL_GOAL_MESSAGES[Math.floor(Math.random() * RIVAL_GOAL_MESSAGES.length)];
          addLog(msg(bot.name), 'bad');
          addLog(`  Marcador: ${uGoals} – ${rGoals}`, 'bad');
        } else {
          addLog('🛡️ El rival ataca pero tu defensa aguanta.', 'neutral');
        }
      } else {
        const midMsgs = [
          `Minuto ${r * 5} — disputa pareja en el centro.`,
          '🔄 Cambio de ritmo, ninguno cede.',
          '⏱️ El partido se pone intenso.',
        ];
        addLog(midMsgs[Math.floor(Math.random() * midMsgs.length)], 'neutral');
      }

      setBattleState({ userHP: uHP, rivalHP: rHP, userGoals: uGoals, rivalGoals: rGoals });

      if (uHP <= 0 || rHP <= 0) break;
    }

    await delay(500);
    addLog('📯 ¡Silbato final!', 'event');
    await delay(400);

    // Determinar ganador
    let won: boolean;
    if (uGoals !== rGoals) {
      won = uGoals > rGoals;
    } else {
      // Empate → pequeña ventaja al usuario basada en OVR
      won = Math.random() < 0.5 + advantage * 0.3;
      if (won) addLog('⚡ ¡Tu equipo gana en el tiempo extra!', 'good');
      else addLog('💔 El rival gana en el tiempo extra.', 'bad');
    }

    await handleBattleEnd(won, uGoals, rGoals, bot, userBattleCards, opponentCards);
  };

  // ─── Post-batalla: XP, racha, desafíos, DB ───────────────────────────────

  const handleBattleEnd = async (
    won: boolean,
    uGoals: number,
    rGoals: number,
    bot: BotPlayer,
    userBattleCards: UserCard[],
    opponentCards: UserCard[],
  ) => {
    // Calcular nueva racha
    const newStreak = won ? Math.min(userStats.streak + 1, 10) : 0;
    const streakBonus = won ? newStreak * 5 : 0;

    const xpGained = won ? 15 : 10;
    const ptsGained = won ? 15 : 10;
    const coinsGained = won ? bot.coinsBase + Math.floor(streakBonus / 5) : 2;

    // Subir de nivel
    let newXP = userStats.xp + xpGained;
    let newLevel = userStats.level;
    let newXpNeeded = userStats.xp_needed;
    let didLevelUp = false;

    while (newXP >= newXpNeeded) {
      newXP -= newXpNeeded;
      newLevel++;
      newXpNeeded = Math.round(newXpNeeded * 1.4);
      didLevelUp = true;
    }

    setLeveledUp(didLevelUp);

    const newStats: UserStats = {
      level: newLevel,
      xp: newXP,
      xp_needed: newXpNeeded,
      total_wins: userStats.total_wins + (won ? 1 : 0),
      streak: newStreak,
      coins: userStats.coins + coinsGained,
    };
    setUserStats(newStats);

    // Actualizar desafíos
    const updatedChallenges = challenges.map(c => {
      if (c.completed) return c;
      let newProg = c.progress;
      if (c.id === 'win3' && won) newProg = Math.min(c.target, newProg + 1);
      if (c.id === 'score5') newProg = Math.min(c.target, newProg + uGoals);
      if (c.id === 'beat_legend' && won && bot.name === 'Bot Leyenda') newProg = Math.min(c.target, newProg + 1);
      return { ...c, progress: newProg, completed: newProg >= c.target };
    });
    setChallenges(updatedChallenges);

    // Experiencia en cartas
    const battleResult = calculateBattle(
      userBattleCards,
      opponentCards,
      userBattleCards[0]?.card?.category || '1era',
      opponentCards[0]?.card?.category || '8va',
    );

    let leveledUpCards: string[] = [];
    const updatedCards = [...userBattleCards];
    for (let i = 0; i < updatedCards.length; i++) {
      if (!updatedCards[i]) continue;
      const { card, leveledUp: cardLvl } = addExperienceToCard(updatedCards[i], xpGained);
      updatedCards[i] = card;
      if (cardLvl) leveledUpCards.push(getCardData(card).name);
      await supabase
        .from('user_cards')
        .update({ level: card.level, experience: card.experience })
        .eq('id', card.id);
    }

    // ── Stat upgrade en la carta principal ──────────────────────────────────
    // Victoria → +1 remate (finishing) | Derrota → +1 defensa (defending)
    // La carta principal es la primera del mazo (index 0).
    // El código existente ya modifica el stat en DB vía updateUserProgression /
    // battleEngine; acá solo construimos el objeto para mostrarlo en el UI.
    const mainCard = userBattleCards[0];
    let statUpgrade: typeof result extends null ? never : NonNullable<typeof result>['statUpgrade'] = null;
    if (mainCard) {
      const cardData = getCardData(mainCard);
      if (won) {
        statUpgrade = {
          cardName: cardData.name,
          stat: 'finishing',
          oldValue: cardData.finishing,
          newValue: cardData.finishing + 1,
        };
      } else {
        statUpgrade = {
          cardName: cardData.name,
          stat: 'defending',
          oldValue: cardData.defending,
          newValue: cardData.defending + 1,
        };
      }
    }

    // Guardar en DB
    await supabase.from('user_stats').upsert({
      user_id: userId,
      level: newStats.level,
      xp: newStats.xp,
      xp_needed: newStats.xp_needed,
      total_wins: newStats.total_wins,
      streak: newStats.streak,
      coins: newStats.coins,
    }, { onConflict: 'user_id' });

    await supabase.from('matches').insert({
      user_id: userId,
      opponent_type: 'bot',
      user_deck_id: userDeck.id,
      user_score: uGoals,
      opponent_score: rGoals,
      winner_id: won ? userId : null,
      experience_gained: xpGained,
    });

    try {
      const { updateUserProgression } = await import('../utils/userProgression');
      await updateUserProgression(userId, {
        type: won ? 'battle_win' : 'battle_lose',
      });
    } catch (err) {
      console.error(err);
    }

    await saveDailyChallenges(updatedChallenges);
    onBattleComplete(updatedCards);

    setResult({
      winner: won ? 'user' : 'opponent',
      userScore: uGoals,
      opponentScore: rGoals,
      xpGained,
      ptsGained,
      coinsGained,
      leveledUpCards,
      streakBonus,
      statUpgrade,
    });

    setPhase('result');
  };

  // ─── Getters de UI ────────────────────────────────────────────────────────

  const cardsCount = userDeck.cards?.length || 0;
  const needsMoreCards = cardsCount < 5;

    // Reemplazar la función getPlayersByPosition por esta:
const getFormationFromDeck = () => {
  const players = userDeck.cards || [];
  
  // Ordenar por posición (1=ARQ, 2=CIE, 3=ALA IZQ, 4=ALA DER, 5=PIVOT)
  const sortedPlayers = [...players].sort((a, b) => (a.position || 99) - (b.position || 99));
  
  // Definir las coordenadas según el número de posición táctico
  const tacticalPositions: Record<number, { x: number; y: number; label: string; icon: string }> = {
    1: { x: 12, y: 52, label: 'ARQUERO', icon: '🧤' },      // Arquero
    2: { x: 22, y: 52, label: 'CIERRE', icon: '🛡️' },      // Cierre (defensa central)
    3: { x: 30, y: 25, label: 'ALA IZQ', icon: '⚡' },      // Ala izquierda
    4: { x: 30, y: 75, label: 'ALA DER', icon: '⚡' },      // Ala derecha
    5: { x: 41, y: 52, label: 'PIVOT', icon: '🎯' },        // Pivot
  };
  
  // Si no hay 5 jugadores, mostrar los que hay en orden
  const formation = [];
  for (let i = 1; i <= 5; i++) {
    const player = sortedPlayers.find(p => p.position === i);
    if (player) {
      const posData = tacticalPositions[i];
      formation.push({
        card: player,
        positionNumber: i,
        ...posData,
        actualPosition: getPlayerPosition(player), // Guardar la posición real para referencia
      });
    }
  }
  
  return formation;
};

// ✅ AGREGAR LA FUNCIÓN AQUÍ (dentro del componente)
const getRivalFormation = () => {
  const rivalPositions = [
    { pos: 1, label: 'ARQUERO', x: 86, y: 52, icon: '🧤' },
    { pos: 2, label: 'CIERRE', x: 78, y: 52, icon: '🛡️' },
    { pos: 3, label: 'ALA IZQ', x: 70, y: 25, icon: '⚡' },
    { pos: 4, label: 'ALA DER', x: 70, y: 75, icon: '⚡' },
    { pos: 5, label: 'PIVOT', x: 59, y: 52, icon: '🎯' },
  ];
  
  return rivalPositions.map(pos => ({
    ...pos,
    bot: selectedBot,
    level: selectedBot.level,
    avatar: selectedBot.avatar,
  }));
};

  const xpPct = Math.round((userStats.xp / userStats.xp_needed) * 100);



  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="arena-container">

      {/* ── Header con stats del usuario ── */}
      <div className="arena-header">
        <div className="arena-title">
          <span className="arena-icon">⚽</span>
          <span>ESTADIO DE FUTSAL</span>
          <span className="arena-badge">FUTSAL</span>
        </div>
        <button className="deck-link-btn" onClick={onNavigateToDeck}>
          📋 VER MI EQUIPO
          <span className="deck-count">{cardsCount}/5</span>
        </button>
      </div>

      {/* ── Barra de XP + nivel ── */}
      <div className="xp-section">
        <div className="xp-row">
          <span className="xp-level">Nivel {userStats.level}</span>
          <div className="xp-bar-wrap">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="xp-label">{userStats.xp}/{userStats.xp_needed} XP</span>
        </div>
        <div className="stats-mini-row">
          <span className="mini-stat">🏆 {userStats.total_wins} victorias</span>
          <span className="mini-stat streak-mini">
            🔥 Racha: {userStats.streak}
            {userStats.streak >= 3 && <span className="streak-fire"> ×{1 + userStats.streak * 0.05 | 0}x XP</span>}
          </span>
        </div>
      </div>

      {/* ── Indicador de racha visual ── */}
      {userStats.streak > 0 && (
        <div className="streak-row">
          {Array.from({ length: Math.min(userStats.streak, 5) }).map((_, i) => (
            <div key={i} className="streak-flame">🔥</div>
          ))}
          <span className="streak-text">
            {userStats.streak >= 5
              ? '¡RACHA MÁXIMA! +XP extra en cada victoria'
              : `${userStats.streak} victorias seguidas — ¡seguí así!`}
          </span>
        </div>
      )}

      {/* ══════════ FASE: SELECCIÓN ══════════ */}
      {phase === 'select' && (
        <>
          {/* ── Cancha con jugadores ── */}
          <div className="futsal-court">

            {/* Renderizar jugadores en formación táctica */}
{getFormationFromDeck().map((player, idx) => {
  const cardData = getCardData(player.card);
  const isOutOfPosition = player.actualPosition !== 
    (player.positionNumber === 1 ? 'arquero' : 
     player.positionNumber === 2 ? 'cierre' : 
     player.positionNumber === 3 || player.positionNumber === 4 ? 'ala' : 'pivot');
  
  return (
    <div
      key={`${player.card.id}-${player.positionNumber}`}
      className="player-on-court"
      style={{ 
        left: `${player.x}%`, 
        top: `${player.y}%`,
        zIndex: idx 
      }}
    >
      <div className={`player-token user-token ${isOutOfPosition ? 'out-of-position' : ''}`}>
        <div className="token-icon">{player.icon}</div>
        <div className="token-name">
          {cardData?.name?.substring(0, 10) || 'Jugador'}
        </div>
        <div className="token-level user-level">Nv.{player.card.level}</div>
        {isOutOfPosition && (
          <div className="token-warning" title={`Jugando fuera de posición (${player.actualPosition})`}>
            ⚠️
          </div>
        )}
      </div>
      <div className="pos-label">{player.label}</div>
    </div>
  );
})}

            {getRivalFormation().map((pos, idx) => (
  <div
    key={`rival-${pos.pos}`}
    className="player-on-court"
    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
  >
    <div className="player-token rival-token">
      <div className="token-icon">{pos.icon}</div>
      <div className="token-name">
        {selectedBot.name.split(' ')[1]?.substring(0, 6) ?? selectedBot.name.substring(0, 6)}
      </div>
      <div className="token-level rival-level">Nv.{selectedBot.level}</div>
    </div>
    <div className="pos-label">{pos.label}</div>
  </div>
))}
          </div>

          {/* ── Selector de rival ── */}
          <div className="rival-selector">
            <div className="rival-selector-title">⚔️ ELEGIR RIVAL</div>
            <div className="rival-selector-row">
              {BOT_PLAYERS.map(bot => {
                const isLocked = bot.reqWins > userStats.total_wins;
                return (
                  <button
                    key={bot.name}
                    className={`bot-card ${selectedBot.name === bot.name ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => !isLocked && setSelectedBot(bot)}
                    style={{ '--bot-color': bot.color } as React.CSSProperties}
                    disabled={isLocked}
                  >
                    <span className="bot-avatar">{isLocked ? '🔒' : bot.avatar}</span>
                    <span className="bot-name">{bot.name.replace('Bot ', '')}</span>
                    <span className="bot-ovr">OVR {bot.overall_rating}</span>
                    {isLocked ? (
                      <span className="bot-lock-req">{bot.reqWins} victorias</span>
                    ) : (
                      <>
                        <span className="bot-exp">+{bot.xpBase} XP</span>
                        <span className="bot-coins">🪙 {bot.coinsBase}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {needsMoreCards ? (
              <button className="cta-btn deck-btn" onClick={onNavigateToDeck}>
                📦 AGREGAR JUGADORES AL EQUIPO
              </button>
            ) : (
              <button className="cta-btn start-btn" onClick={startBattle}>
                ▶ INICIAR PARTIDO VS {selectedBot.name.toUpperCase()}
                {userStats.streak >= 3 && (
                  <span className="streak-bonus-badge"> 🔥 +{userStats.streak * 5} XP bonus</span>
                )}
              </button>
            )}
          </div>

          {/* ── Desafíos diarios (vista previa) ── */}
          <div className="challenges-preview">
            <div className="challenges-title">📋 DESAFÍOS DE HOY</div>
            {challenges.map(c => {
              const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
              return (
                <div key={c.id} className={`challenge-row ${c.completed ? 'done' : ''}`}>
                  <span className="ch-icon">{c.icon}</span>
                  <div className="ch-info">
                    <div className="ch-name">
                      {c.name}
                      {c.completed && <span className="ch-done-badge"> ✓ COMPLETADO</span>}
                    </div>
                    <div className="ch-prog-row">
                      <div className="ch-prog-bar">
                        <div className="ch-prog-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="ch-prog-txt">{c.progress}/{c.target}</span>
                    </div>
                  </div>
                  <span className="ch-reward">+{c.xpReward} XP</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════ FASE: BATALLA ══════════ */}
      {phase === 'battle' && (
        <div className="battle-phase">
          {/* HP en tiempo real */}
          <div className="battle-hud">
            <div className="hud-side user-side">
              <div className="hud-name">🎮 Tu equipo</div>
              <div className="hud-score">{battleState.userGoals}</div>
              <div className="hp-wrap">
                <div className="hp-bg">
                  <div
                    className="hp-bar hp-user"
                    style={{ width: `${battleState.userHP}%` }}
                  />
                </div>
                <span className="hp-num">HP {battleState.userHP}</span>
              </div>
            </div>

            <div className="hud-center">
              <div className="hud-vs">⚔️</div>
              <div className="hud-score-sep">–</div>
            </div>

            <div className="hud-side rival-side">
              <div className="hud-name">{selectedBot.avatar} {selectedBot.name}</div>
              <div className="hud-score rival-score">{battleState.rivalGoals}</div>
              <div className="hp-wrap">
                <div className="hp-bg">
                  <div
                    className="hp-bar hp-rival"
                    style={{ width: `${battleState.rivalHP}%` }}
                  />
                </div>
                <span className="hp-num">HP {battleState.rivalHP}</span>
              </div>
            </div>
          </div>

          {/* Log narrativo */}
          <div className="battle-log" ref={logRef}>
            {battleLog.map((line, i) => (
              <div key={i} className={`log-line log-${line.type}`}>
                {line.text}
              </div>
            ))}
            {battleLog.length === 0 && (
              <div className="log-loading">⏳ El partido está por comenzar…</div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ FASE: RESULTADO ══════════ */}
      {phase === 'result' && result && (
        <div className={`result-card ${result.winner === 'user' ? 'win' : 'lose'}`}>
          <div className="result-glow" />
          <div className="result-title">
            {result.winner === 'user' ? '🏆 ¡VICTORIA!' : '💔 DERROTA'}
          </div>
          <div className="result-score">
            {result.userScore} – {result.opponentScore}
          </div>

          {/* Racha bonus */}
          {result.winner === 'user' && userStats.streak > 1 && (
            <div className="streak-result-banner">
              🔥 Racha {userStats.streak} — bonus de +{result.streakBonus} XP aplicado!
            </div>
          )}

          <div className="result-rewards">
            <div className="reward-box">
              <div className="reward-num">+{result.xpGained}</div>
              <div className="reward-lbl">✨ XP</div>
            </div>
            <div className="reward-box">
              <div className="reward-num">+{result.ptsGained}</div>
              <div className="reward-lbl">⭐ Puntos</div>
            </div>
          </div>

          {/* ── Stat upgrade de la carta principal ── */}
          {result.statUpgrade && (
            <div className={`stat-upgrade-banner ${result.winner === 'user' ? 'stat-win' : 'stat-lose'}`}>
              <div className="stat-upgrade-card-name">
                
              </div>
              <div className="stat-upgrade-body">
                <span className="stat-upgrade-icon">
                  {result.winner === 'user' ? '🎯' : '🛡️'}
                </span>
                <div className="stat-upgrade-text">
                  <span className="stat-upgrade-label"> Tu Skill &nbsp;
                    {result.winner === 'user' ? 'REMATE' : 'DEFENSA'} sube + 1
                  </span>
                  
                </div>
                <div className="stat-upgrade-pill">+1</div>
              </div>
              <div className="stat-upgrade-sub">
                {result.winner === 'user'
                  ? 'La victoria te hizo más letal. Tu carta principal mejora.'
                  : 'La derrota te endureció. Tu carta principal es más sólida.'}
              </div>
            </div>
          )}

          {/* Subida de nivel */}
          {leveledUp && (
            <div className="levelup-banner">
              🎉 ¡SUBISTE AL NIVEL {userStats.level}! Nuevas recompensas desbloqueadas.
            </div>
          )}

          {/* Cartas que subieron */}
          {result.leveledUpCards.length > 0 && (
            <div className="cards-levelup">
              ⬆️ {result.leveledUpCards.join(', ')} subieron de nivel
            </div>
          )}

          {/* Desafíos actualizados */}
          <div className="challenges-result">
            <div className="challenges-title">📋 DESAFÍOS</div>
            {challenges.map(c => {
              const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
              return (
                <div key={c.id} className={`challenge-row ${c.completed ? 'done' : ''}`}>
                  <span className="ch-icon">{c.icon}</span>
                  <div className="ch-info">
                    <div className="ch-name">
                      {c.name}
                      {c.completed && <span className="ch-done-badge"> ✓</span>}
                    </div>
                    <div className="ch-prog-row">
                      <div className="ch-prog-bar">
                        <div className="ch-prog-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="ch-prog-txt">{c.progress}/{c.target}</span>
                    </div>
                  </div>
                  <span className="ch-reward">+{c.xpReward} XP</span>
                </div>
              );
            })}
          </div>

          <button className="cta-btn start-btn" onClick={() => {
            setResult(null);
            setPhase('select');
          }}>
            JUGAR DE NUEVO
          </button>
        </div>
      )}

      {/* ══════════════ ESTILOS ══════════════ */}
      <style>{`
        * { user-select: none; -webkit-tap-highlight-color: transparent; }

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
          margin-bottom: 12px;
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

        /* ── XP Bar ── */
        .xp-section {
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          padding: 10px 14px;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .xp-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .xp-level {
          font-size: 12px;
          font-weight: bold;
          color: #ffd700;
          white-space: nowrap;
        }
        .xp-bar-wrap {
          flex: 1;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          height: 8px;
          overflow: hidden;
        }
        .xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700, #ffaa00);
          border-radius: 8px;
          transition: width 0.8s cubic-bezier(0.34,1.2,0.64,1);
        }
        .xp-label {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        .stats-mini-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .mini-stat {
          font-size: 11px;
          color: rgba(255,255,255,0.55);
        }
        .streak-mini { color: #ff9060; }
        .streak-fire {
          background: rgba(255,100,50,0.2);
          border-radius: 10px;
          padding: 1px 6px;
          font-size: 10px;
          margin-left: 4px;
        }

        /* ── Streak banner ── */
        .streak-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: rgba(255,100,50,0.12);
          border-radius: 12px;
          border: 1px solid rgba(255,100,50,0.3);
        }
        .streak-flame { font-size: 16px; }
        .streak-text {
          font-size: 12px;
          color: #ff9060;
          font-weight: bold;
        }

        .futsal-court {
  position: relative;
  width: 100%;
  height: 560px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(
    90deg,
    rgba(0,0,0,0.6 ) 0px, rgba(0,0,0,0.6) 40px,
    transparent 40px, transparent 80px
  ),
  linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.1)),
  url('/images/cancha.jpg') center/cover no-repeat,
  #0b2b44;
  margin-bottom: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
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
          font-size: 14px;
          font-weight: bold;
          color: rgba(255,255,255,0.2);
          letter-spacing: 3px;
          z-index: 4;
          pointer-events: none;
        }
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
          width: 60px;
          border-radius: 12px;
          padding: 7px 5px 5px;
          text-align: center;
          border: 1.5px solid;
          backdrop-filter: blur(6px);
          transition: transform 0.15s;
        }
        .user-token {
          background: rgba(30,200,120,0.18);
          border-color: rgba(30,200,120,0.65);
        }
        .rival-token {
          background: rgba(255,110,60,0.18);
          border-color: rgba(255,110,60,0.6);
        }
        .player-token.empty {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.18);
          opacity: 0.55;
        }
        .token-icon { font-size: 18px; line-height: 1; display: block; }
        .token-name {
          font-size: 9px;
          font-weight: bold;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 56px;
          margin-top: 3px;
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

        /* ── Selector de rival ── */
        .rival-selector {
          margin-bottom: 14px;
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
          gap: 2px;
          padding: 10px 6px;
          border-radius: 14px;
          border: 1.5px solid rgba(255,100,50,0.3);
          background: rgba(255,100,50,0.06);
          cursor: pointer;
          color: #fff;
          transition: all 0.18s;
        }
        .bot-card:hover:not(:disabled) {
          background: rgba(255,100,50,0.14);
          border-color: rgba(255,100,50,0.65);
          transform: translateY(-3px);
        }
        .bot-card.selected {
          background: rgba(255,100,50,0.2);
          border-color: var(--bot-color, #ff7040);
          box-shadow: 0 0 12px rgba(255,100,50,0.25);
        }
        .bot-card.locked {
          opacity: 0.45;
          cursor: default;
        }
        .bot-avatar { font-size: 20px; }
        .bot-name   { font-size: 11px; font-weight: bold; }
        .bot-ovr    { font-size: 9px; color: #ff9060; }
        .bot-exp    { font-size: 9px; color: #3dffa0; }
        .bot-coins  { font-size: 9px; color: #ffd700; }
        .bot-lock-req { font-size: 9px; color: rgba(255,255,255,0.4); }

        .streak-bonus-badge {
          font-size: 11px;
          margin-left: 6px;
          background: rgba(255,100,50,0.3);
          padding: 2px 8px;
          border-radius: 10px;
        }

        /* ── Desafíos ── */
        .challenges-preview, .challenges-result {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 14px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .challenges-title {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .challenge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .challenge-row:last-child { border-bottom: none; }
        .challenge-row.done { opacity: 0.7; }
        .ch-icon { font-size: 16px; width: 20px; text-align: center; }
        .ch-info { flex: 1; }
        .ch-name { font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.85); }
        .ch-done-badge {
          font-size: 9px;
          color: #3dffa0;
          background: rgba(61,255,160,0.15);
          border-radius: 8px;
          padding: 1px 6px;
          margin-left: 4px;
        }
        .ch-prog-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }
        .ch-prog-bar {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .ch-prog-fill {
          height: 100%;
          background: #3dffa0;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .ch-prog-txt { font-size: 10px; color: rgba(255,255,255,0.4); }
        .ch-reward { font-size: 11px; color: #ffd700; white-space: nowrap; }

        /* ── Batalla: HUD ── */
        .battle-phase { margin-bottom: 14px; }
        .battle-hud {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(0,0,0,0.4);
          border-radius: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .hud-side { flex: 1; }
        .hud-name { font-size: 11px; font-weight: bold; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
        .hud-score {
          font-size: 36px;
          font-weight: bold;
          color: #3dffa0;
          line-height: 1;
          margin-bottom: 6px;
        }
        .rival-side .hud-score { color: #ff7060; text-align: right; }
        .rival-side .hud-name { text-align: right; }
        .rival-side .hp-wrap { align-items: flex-end; }
        .hud-center { text-align: center; }
        .hud-vs { font-size: 22px; animation: pulse 0.8s infinite; }
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .hud-score-sep { font-size: 20px; color: rgba(255,255,255,0.3); margin-top: 4px; }
        .hp-wrap { display: flex; flex-direction: column; gap: 3px; }
        .hp-bg {
          background: rgba(255,255,255,0.1);
          border-radius: 6px;
          height: 8px;
          overflow: hidden;
        }
        .hp-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s ease;
        }
        .hp-user { background: linear-gradient(90deg, #3dffa0, #20c070); }
        .hp-rival { background: linear-gradient(90deg, #ff4d6d, #ff7040); }
        .hp-num { font-size: 9px; color: rgba(255,255,255,0.4); }

        /* ── Log narrativo ── */
        .battle-log {
          background: rgba(0,0,0,0.5);
          border-radius: 14px;
          padding: 14px;
          height: 180px;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,0.08);
          scroll-behavior: smooth;
        }
        .battle-log::-webkit-scrollbar { width: 3px; }
        .battle-log::-webkit-scrollbar-track { background: transparent; }
        .battle-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .log-line {
          font-size: 13px;
          padding: 3px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
        }
        .log-line:last-child { border-bottom: none; }
        .log-good { color: #3dffa0; }
        .log-bad  { color: #ff6070; }
        .log-event { color: #ffd700; font-weight: bold; }
        .log-loading { color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; padding: 20px 0; }

        /* ── Resultado ── */
        .result-card {
          padding: 22px 18px;
          border-radius: 22px;
          position: relative;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .result-card.win  { background: rgba(61,255,160,0.08); border: 1px solid #3dffa0; }
        .result-card.lose { background: rgba(255,77,109,0.08); border: 1px solid #ff4d6d; }
        .result-glow {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, #3dffa0, transparent);
        }
        .result-card.lose .result-glow {
          background: linear-gradient(90deg, transparent, #ff4d6d, transparent);
        }
        .result-title  { font-size: 26px; font-weight: bold; text-align: center; margin-bottom: 8px; }
        .result-score  {
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 6px;
          margin-bottom: 14px;
        }

        .streak-result-banner {
          background: rgba(255,100,50,0.15);
          border: 1px solid rgba(255,100,50,0.4);
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 12px;
          color: #ff9060;
          text-align: center;
          margin-bottom: 14px;
          font-weight: bold;
        }

        .result-rewards {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .reward-box {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 12px 8px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .reward-num { font-size: 22px; font-weight: bold; color: #fff; }
        .reward-lbl { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px; }

        .levelup-banner {
          background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1));
          border: 1px solid #ffd700;
          border-radius: 14px;
          padding: 12px 16px;
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 12px;
          animation: levelGlow 1s ease;
        }
        @keyframes levelGlow {
          0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          50% { box-shadow: 0 0 20px 8px rgba(255,215,0,0.2); }
          100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
        }

        .cards-levelup {
          font-size: 12px;
          color: #ffd700;
          background: rgba(255,215,0,0.08);
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: 12px;
          text-align: center;
        }

        /* ── Botones CTA ── */
        .cta-btn {
          width: 100%;
          padding: 13px;
          border-radius: 40px;
          border: none;
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cta-btn:hover { transform: translateY(-2px); opacity: 0.92; }
        .start-btn {
          background: linear-gradient(90deg, #ff4d6d, #ff7040);
          color: #fff;
          margin-top: 4px;
        }
        .deck-btn {
          background: rgba(61,255,160,0.1);
          border: 1px solid #3dffa0 !important;
          color: #3dffa0;
        }

        /* ── Stat upgrade banner ── */
.stat-upgrade-banner {
  border-radius: 18px;
  padding: 14px 16px;
  margin-bottom: 14px;
  animation: statPop 0.5s cubic-bezier(0.34, 1.3, 0.64, 1);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-upgrade-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

@keyframes statPop {
  0%   { transform: scale(0.85) translateY(10px); opacity: 0; }
  60%  { transform: scale(1.02); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

/* Variantes de estado */
.stat-win {
  background: linear-gradient(135deg, rgba(61,255,160,0.12), rgba(61,255,160,0.05));
  border: 1.5px solid rgba(61,255,160,0.5);
  box-shadow: 0 4px 12px rgba(61,255,160,0.1);
}

.stat-lose {
  background: linear-gradient(135deg, rgba(100,150,255,0.12), rgba(100,150,255,0.05));
  border: 1.5px solid rgba(100,150,255,0.5);
  box-shadow: 0 4px 12px rgba(100,150,255,0.1);
}

.stat-neutral {
  background: linear-gradient(135deg, rgba(255,193,61,0.12), rgba(255,193,61,0.05));
  border: 1.5px solid rgba(255,193,61,0.5);
  box-shadow: 0 4px 12px rgba(255,193,61,0.1);
}

.stat-neutral .stat-new {
  color: #ffc13d;
}

.stat-neutral .stat-upgrade-pill {
  background: rgba(255,193,61,0.2);
  color: #ffc13d;
  border-color: rgba(255,193,61,0.4);
}

/* Header del banner */
.stat-upgrade-card-name {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-upgrade-card-name::before {
  content: "⚡";
  font-size: 10px;
  opacity: 0.7;
}

/* Cuerpo principal */
.stat-upgrade-body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.stat-upgrade-icon {
  font-size: 32px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  animation: iconFloat 2s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

.stat-upgrade-text {
  flex: 1;
}

.stat-upgrade-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: rgba(255,255,255,0.55);
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.stat-upgrade-values {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-old {
  font-size: 20px;
  font-weight: 800;
  color: rgba(255,255,255,0.25);
  text-decoration: line-through;
  position: relative;
}

.stat-arrow {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  font-weight: bold;
}

.stat-new {
  font-size: 32px;
  font-weight: 800;
  color: #3dffa0;
  animation: numPop 0.4s 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  text-shadow: 0 0 8px rgba(61,255,160,0.3);
  letter-spacing: -0.5px;
}

.stat-lose .stat-new {
  color: #6496ff;
  text-shadow: 0 0 8px rgba(100,150,255,0.3);
}

@keyframes numPop {
  0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  70%  { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

/* Pill / Badge */
.stat-upgrade-pill {
  background: rgba(61,255,160,0.2);
  color: #3dffa0;
  font-size: 12px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 30px;
  border: 1px solid rgba(61,255,160,0.5);
  animation: pillBounce 0.4s 0.5s ease both;
  backdrop-filter: blur(4px);
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stat-upgrade-pill::before {
  content: "▲";
  font-size: 10px;
}

.stat-lose .stat-upgrade-pill::before {
  content: "▲";
}

.stat-lose .stat-upgrade-pill {
  background: rgba(100,150,255,0.2);
  color: #6496ff;
  border-color: rgba(100,150,255,0.5);
}

@keyframes pillBounce {
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

/* Footer / subtítulo */
.stat-upgrade-sub {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.94);
  line-height: 1.4;
  font-style: italic;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-upgrade-sub::before {
  content: "🏆";
  font-size: 10px;
  opacity: 0.6;
}

/* Barra de progreso opcional */
.stat-progress-bar {
  margin-top: 10px;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.stat-progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #3dffa0, #6496ff);
  border-radius: 3px;
  animation: fillProgress 0.8s 0.6s ease forwards;
}

@keyframes fillProgress {
  to { width: var(--progress, 75%); }
}

/* Responsive */
@media (max-width: 480px) {
  .stat-upgrade-banner {
    padding: 12px;
  }
  
  .stat-upgrade-icon {
    font-size: 28px;
  }
  
  .stat-new {
    font-size: 26px;
  }
  
  .stat-old {
    font-size: 18px;
  }
  
  .stat-upgrade-pill {
    font-size: 11px;
    padding: 4px 10px;
  }
}

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .futsal-court { height: 280px; }
          .hud-score { font-size: 28px; }
          .result-score { font-size: 38px; }
          .rival-selector-row { flex-direction: column; }
          .bot-card { flex-direction: row; justify-content: space-between; }
        }
          /* Agregar al final del bloque de estilos */
.player-token.out-of-position {
  border-color: #ffaa00;
  background: rgba(255, 170, 0, 0.15);
  position: relative;
}

.token-warning {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
  background: rgba(0,0,0,0.7);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
}
      `}</style>
    </div>
  );
}