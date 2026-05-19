// src/components/CardBattle.tsx — v4
// Posesión alternada · Keys únicas · XP guardada correctamente

import { useState, useRef, useEffect, useCallback } from 'react';
import { UserCard, Deck } from '../types/cards';
import {
  generateTurn,
  resolveDecision,
  addExperienceToCard,
  getCardData,
  calcGroupValue,
  SKILL_GROUP_INFO,
  MomentContext,
  DecisionOption,
  SkillGroup,
} from '../utils/battleEngine';
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
  name: string; overall_rating: number; category: string;
  level: number; avatar: string; color: string;
  xpBase: number; reqWins: number;
}

interface UserStats {
  level: number; xp: number; xp_needed: number;
  total_wins: number; streak: number;
}

interface LogLine { id: number; text: string; type: 'neutral'|'good'|'bad'|'event'|'goal'; }

interface MatchResult {
  winner: 'user' | 'draw' | 'rival';
  userScore: number; 
  rivalScore: number;
  xpGained: number;
  streakBonus: number;
  leveledUpCards: string[];
  skillUpgrade: { group: SkillGroup; label: string; icon: string; delta: number } | null;
  newStreak: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const BOTS: BotPlayer[] = [
  { name:'Bot Novato',  overall_rating:55, category:'8va', level:1, avatar:'🥉', color:'#7a7a9a', xpBase:10, reqWins:0 },
  { name:'Bot Experto', overall_rating:65, category:'7ma', level:2, avatar:'🥈', color:'#a0a0c0', xpBase:25, reqWins:0 },
  { name:'Bot Leyenda', overall_rating:78, category:'6ta', level:3, avatar:'🥇', color:'#ffd700', xpBase:50, reqWins:0 },
];

// Posiciones en % para las 5 fichas — índice 0..4
type Pos = { x: number; y: number };
type Formation = Record<number, Pos>;

const USER_BASE: Formation = {
  0:{ x:10, y:50 }, // ARQ
  1:{ x:25, y:50 }, // CIE
  2:{ x:35, y:22 }, // ALA izq
  3:{ x:35, y:78 }, // ALA der
  4:{ x:44, y:50 }, // PIV
};
const RIVAL_BASE: Formation = {
  0:{ x:90, y:50 },
  1:{ x:75, y:50 },
  2:{ x:65, y:22 },
  3:{ x:65, y:78 },
  4:{ x:56, y:50 },
};

const FORMATIONS: Record<string, Formation> = {
  base:         { 0:{ x:10,y:50 }, 1:{ x:25,y:50 }, 2:{ x:35,y:22 }, 3:{ x:35,y:78 }, 4:{ x:44,y:50 } },
  attack:       { 0:{ x:12,y:50 }, 1:{ x:32,y:50 }, 2:{ x:58,y:18 }, 3:{ x:58,y:82 }, 4:{ x:68,y:50 } },
  counterAttack:{ 0:{ x:10,y:50 }, 1:{ x:30,y:50 }, 2:{ x:62,y:20 }, 3:{ x:62,y:80 }, 4:{ x:72,y:50 } },
  defense:      { 0:{ x:8, y:50 }, 1:{ x:18,y:50 }, 2:{ x:24,y:28 }, 3:{ x:24,y:72 }, 4:{ x:32,y:50 } },
  celebrate:    { 0:{ x:15,y:50 }, 1:{ x:60,y:48 }, 2:{ x:68,y:35 }, 3:{ x:68,y:65 }, 4:{ x:75,y:50 } },
  mourn:        { 0:{ x:10,y:50 }, 1:{ x:22,y:50 }, 2:{ x:30,y:30 }, 3:{ x:30,y:70 }, 4:{ x:40,y:50 } },
};

function mirror(f: Formation): Formation {
  return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, { x: 100 - v.x, y: 100 - v.y }])) as Formation;
}

const LABELS = ['ARQ','CIE','ALA','ALA','PIV'];
const TOTAL_TURNS = 10;
const TURN_MS     = 900;   // pausa entre eventos de narrativa
const GOAL_MS     = 1800;

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }
function calcOvr(cards: UserCard[]) {
  if (!cards.length) return 50;
  return Math.round(cards.reduce((s, c) => s + getCardData(c).overall_rating, 0) / cards.length);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CardBattle({ userCards, userDeck, userId, onBattleComplete, onNavigateToDeck }: CardBattleProps) {

  const [phase, setPhase] = useState<'select'|'battle'|'result'>('select');
  const [bot, setBot]     = useState<BotPlayer>(BOTS[0]);
  const [userStats, setUserStats] = useState<UserStats>({ level:1, xp:0, xp_needed:100, total_wins:0, streak:0 });

  // marcador
  const [uGoals, setUGoals] = useState(0);
  const [rGoals, setRGoals] = useState(0);
  const [minute, setMinute] = useState(0);

  // log
  const [log, setLog] = useState<LogLine[]>([]);
  const logId  = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  // posiciones fichas
  const [uPos, setUPos] = useState<Formation>({ ...FORMATIONS.base });
  const [rPos, setRPos] = useState<Formation>({ ...mirror(FORMATIONS.base) });
  const [uHL,  setUHL]  = useState<number | null>(null); // highlight índice
  const [rHL,  setRHL]  = useState<number | null>(null);

  // pelota
  const [ball, setBall]           = useState<Pos>({ x:50, y:50 });
  const [ballVisible, setBallVis] = useState(false);
  const [ballTeam, setBallTeam]   = useState<'user'|'rival'|null>(null); // quién tiene la pelota
  const [activeTab, setActiveTab] = useState<'court' | 'tactics'>('court');

  // flash en cancha
  const [flash, setFlash] = useState<{ text:string; type:'goal'|'miss'|'ok'|'bad'; x:number; y:number } | null>(null);

  // decisión
  const [moment, setMoment]     = useState<MomentContext | null>(null);
  const [timerPct, setTimerPct] = useState(100);
  const [decidedId, setDecidedId] = useState<string | null>(null);
  const decisionResolve = useRef<((o: DecisionOption) => void) | null>(null);
  const timerInterval   = useRef<ReturnType<typeof setInterval> | null>(null);

  // resultado
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => { loadStats(); }, [userId]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  async function loadStats() {
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    if (data) setUserStats({
      level:      data.level      ?? 1,
      xp:         data.xp         ?? 0,
      xp_needed:  data.xp_needed  ?? 100,
      total_wins: data.total_wins ?? 0,
      streak:     data.streak     ?? 0,
    });
  }

  function addLog(text: string, type: LogLine['type'] = 'neutral') {
    logId.current++;
    setLog(prev => [...prev.slice(-50), { id: logId.current, text, type }]);
  }

  // ── Animaciones de posición ────────────────────────────────────────────────

  function applyUFormation(name: string) { setUPos({ ...FORMATIONS[name] }); }
  function applyRFormation(name: string) { setRPos({ ...mirror(FORMATIONS[name]) }); }

  function resetAll() {
    setUPos({ ...FORMATIONS.base }); setRPos({ ...mirror(FORMATIONS.base) });
    setUHL(null); setRHL(null);
    setBallVis(false); setBall({ x:50, y:50 }); setBallTeam(null);
  }

  function showFlash(text: string, type: 'goal'|'miss'|'ok'|'bad', x = 50, y = 38) {
    setFlash({ text, type, x, y });
    setTimeout(() => setFlash(null), 2000);
  }

  // Mueve la pelota a una posición con transición CSS
  function moveBall(x: number, y: number, team: 'user'|'rival'|null = null) {
    setBall({ x, y }); setBallVis(true); if (team) setBallTeam(team);
  }

  // Secuencia: usuario construye jugada
  async function animateBuildUp(protagonistIdx: number) {
    applyUFormation('attack');
    applyRFormation('defense');
    moveBall(50, 50, 'user');
    await delay(300);
    moveBall(60, 50, 'user');
    await delay(250);
    const pos = FORMATIONS.attack[protagonistIdx];
    if (pos) moveBall(pos.x, pos.y, 'user');
    setUHL(protagonistIdx);
    await delay(300);
  }

  // Secuencia: rival construye jugada
  async function animateRivalBuild() {
    applyUFormation('defense');
    applyRFormation('attack');
    moveBall(50, 50, 'rival');
    await delay(300);
    moveBall(40, 50, 'rival');
    await delay(250);
    const rPivot = mirror(FORMATIONS.attack)[4];
    if (rPivot) moveBall(rPivot.x, rPivot.y, 'rival');
    setRHL(4);
    await delay(300);
  }

  async function animateGoalUser() {
    moveBall(93, 50);
    await delay(300);
    setBallVis(false);
    applyUFormation('celebrate');
    applyRFormation('mourn');
  }

  async function animateGoalRival() {
    moveBall(7, 50);
    await delay(300);
    setBallVis(false);
    applyUFormation('mourn');
    applyRFormation('celebrate');
  }

  async function animateSave() {
    // arquero (idx 0) se desplaza
    setUPos(prev => ({ ...prev, 0: { x: 8, y: 38 } }));
    moveBall(10, 40);
    await delay(450);
    setBallVis(false);
  }

  async function backToMidfield() {
    await delay(400);
    resetAll();
    moveBall(50, 50, null);
    await delay(200);
    setBallVis(false);
  }

  // ── Timer ──────────────────────────────────────────────────────────────────

  function startTimer(sec: number, onTimeout: () => void) {
    setTimerPct(100);
    let rem = 100;
    timerInterval.current = setInterval(() => {
      rem--;
      setTimerPct(Math.max(0, rem));
      if (rem <= 0) { clearInterval(timerInterval.current!); onTimeout(); }
    }, (sec * 1000) / 100);
  }

  function clearTimer() {
    if (timerInterval.current) { clearInterval(timerInterval.current); timerInterval.current = null; }
  }

  function waitForDecision(ctx: MomentContext): Promise<DecisionOption> {
    return new Promise(resolve => {
      decisionResolve.current = resolve;
      setMoment(ctx); setDecidedId(null);
      const safe = ctx.options.find(o => o.isSafe) ?? ctx.options[ctx.options.length - 1];
      startTimer(ctx.timeLimit, () => {
        decisionResolve.current = null;
        setDecidedId(safe.id);
        setTimeout(() => { setMoment(null); resolve(safe); }, 500);
      });
    });
  }

  function handleDecision(opt: DecisionOption) {
    clearTimer();
    setDecidedId(opt.id);
    setTimeout(() => {
      decisionResolve.current?.(opt);
      decisionResolve.current = null;
      setMoment(null);
    }, 380);
  }

  // ── Loop ───────────────────────────────────────────────────────────────────

  const isRunning = useRef(false);

  const startBattle = useCallback(async () => {
    const deckCards = (userDeck.cards ?? []) as UserCard[];
    if (deckCards.length < 5) { alert('Necesitás 5 cartas en el mazo'); return; }
    if (isRunning.current) return;
    isRunning.current = true;

    const adv = Math.max(-0.3, Math.min(0.3, (calcOvr(deckCards) - bot.overall_rating) / 100));
    let ug = 0, rg = 0;

    setLog([]); setUGoals(0); setRGoals(0); setMinute(0);
    resetAll(); setPhase('battle');

    addLog('⚽ ¡Silbato inicial! Arrancan los equipos.', 'event');
    moveBall(50, 50, 'user'); setBallVis(true);
    await delay(500);

    for (let t = 1; t <= TOTAL_TURNS; t++) {
      const min = Math.round((t / TOTAL_TURNS) * 40);
      setMinute(min);
      await delay(TURN_MS);

      const turn = generateTurn(deckCards, min, adv, bot.name);

      // ══════════════════════════════════════
      // FASE USUARIO — construye y llega al momento
      // ══════════════════════════════════════
      {
        const up = turn.userPhase;

        // Mostrar eventos de build-up
        for (const ev of up.events) {
          addLog(ev.text, ev.type === 'good' ? 'good' : ev.type === 'bad' ? 'bad' : 'neutral');
          // Mover pelota según zona del evento
          if (ev.zone === 'user_left_wing')  moveBall(60, 18, 'user');
          else if (ev.zone === 'user_right_wing') moveBall(60, 82, 'user');
          else if (ev.zone === 'user_attack')      moveBall(72, 50, 'user');
          else moveBall(50, 50, 'user');
          applyUFormation('attack'); applyRFormation('defense');
          await delay(TURN_MS);
        }

        if (up.moment) {
          // Hay momento de decisión para el usuario
          const ctx = up.moment;
          const pIdx = Math.max(0, deckCards.indexOf(ctx.mainCard));
          await animateBuildUp(pIdx);

          const chosen = await waitForDecision(ctx);
          await delay(200);

          const res = resolveDecision(chosen, ctx.mainCard, ctx.type, min);
          addLog(res.narrative, res.goalFor === 'user' ? 'goal' : res.success ? 'good' : 'neutral');

          if (res.goalFor === 'user') {
            await animateGoalUser();
            ug++; setUGoals(ug);
            addLog(`  Marcador: ${ug} – ${rg}`, 'good');
            showFlash('⚽ ¡GOOOOL!', 'goal', 50, 38);
            await delay(GOAL_MS);
          } else if (res.goalFor === 'rival') {
            await animateGoalRival();
            rg++; setRGoals(rg);
            addLog(`  Marcador: ${ug} – ${rg}`, 'bad');
            showFlash(`⚽ ${bot.name}`, 'bad', 50, 38);
            await delay(GOAL_MS);
          } else {
            showFlash(res.success ? '✨ ¡Buena jugada!' : '😤 ¡Qué cerca!', res.success ? 'ok' : 'miss', 75, 50);
            await delay(600);
          }
        } else {
          // No llegó al momento
          addLog(up.narrative, 'neutral');
          await delay(400);
        }

        setUHL(null); setRHL(null);
        await backToMidfield();
        await delay(300);
      }

      // ══════════════════════════════════════
      // FASE RIVAL — construye y llega a su momento
      // ══════════════════════════════════════
      {
        const rp = turn.rivalPhase;

        for (const ev of rp.events) {
          addLog(ev.text, ev.type === 'good' ? 'good' : ev.type === 'bad' ? 'bad' : 'neutral');
          if (ev.zone === 'rival_attack')    moveBall(30, 50, 'rival');
          else if (ev.zone === 'user_defense') moveBall(22, 52, 'rival');
          else moveBall(50, 50, 'rival');
          applyUFormation('defense'); applyRFormation('attack');
          await delay(TURN_MS);
        }

        if (rp.autoGoal === 'rival') {
          // Rival metió gol sin decisión del usuario
          await animateRivalBuild();
          await delay(300);
          await animateGoalRival();
          rg++; setRGoals(rg);
          addLog(`💔 ¡${bot.name} convierte! Qué golpe.`, 'bad');
          addLog(`  Marcador: ${ug} – ${rg}`, 'bad');
          showFlash(`⚽ GOL ${bot.name.toUpperCase()}`, 'bad', 50, 38);
          await delay(GOAL_MS);
        } else if (rp.narrative) {
          // Rival no llegó
          addLog(rp.narrative, 'good');
          await animateRivalBuild();
          await animateSave();
        }

        setUHL(null); setRHL(null);
        await backToMidfield();
        await delay(300);
      }
    }

    addLog('📯 ¡Silbato final! Terminó el partido.', 'event');
    setMinute(40); setBallVis(false);
    await delay(600);
    await handleMatchEnd(ug, rg, deckCards);
    isRunning.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, userDeck]);

  // ── Post-partido ──────────────────────────────────────────────────────────

  async function handleMatchEnd(ug: number, rg: number, deckCards: UserCard[]) {
  const won         = ug > rg;
  const tied        = ug === rg;
  
  // Racha y bonus de racha solo si gana el partido
  const newStreak   = won ? Math.min(userStats.streak + 1, 10) : 0;
  const streakBonus = won ? newStreak * 5 : 0;
  
  // Calcular XP ganada según el resultado
  let xpGained = 5;
  if (won) {
    xpGained = bot.xpBase + streakBonus;
  } else if (tied) {
    xpGained = Math.max(5, Math.floor(bot.xpBase / 2));
  } else {
    xpGained = Math.max(5, Math.floor(bot.xpBase / 3));
  }

  // LÓGICA DE SKILLS SEGÚN TU JSON REAL:
  let upgradeGroup: SkillGroup = 'technique'; 
  let columnToUpdate = 'user_card_passing'; // Por defecto técnica sube pase
  
  if (won) {
    upgradeGroup = 'attack';
    columnToUpdate = 'user_card_finishing';  // Victoria -> Sube Finalización 🎯
  } else if (ug < rg) {
    upgradeGroup = 'defense';
    columnToUpdate = 'user_card_defending';  // Derrota -> Sube Defendiendo 🛡️
  }

  const skillInfo    = SKILL_GROUP_INFO[upgradeGroup];
  const skillUpgrade = { group: upgradeGroup, label: skillInfo.label, icon: skillInfo.icon, delta: 1 };

  // Calcular nuevo nivel de usuario global (user_stats o profile)
  let newXp  = userStats.xp + xpGained;
  let newLv  = userStats.level;
  let newXpN = userStats.xp_needed;
  while (newXp >= newXpN) { 
    newXp -= newXpN; 
    newLv++; 
    newXpN = Math.round(newXpN * 1.4); 
  }

  const newStats: UserStats = {
    level:      newLv,
    xp:         newXp,
    xp_needed:  newXpN,
    total_wins: userStats.total_wins + (won ? 1 : 0),
    streak:     newStreak,
  };

  // Dar XP a las cartas individuales en memoria (lo que ya hacías)
  const leveledUpCards: string[] = [];
  const cardMap = new Map<string, UserCard>();
  for (const c of deckCards) {
    const { card, leveledUp } = addExperienceToCard(c, xpGained);
    if (leveledUp) leveledUpCards.push(getCardData(card).name);
    cardMap.set(card.id, card);
  }
  const updatedCards = Array.from(cardMap.values());

  try {
    // 1. Guardar XP y nivel de cada carta en la tabla user_cards
    for (const card of updatedCards) {
      await supabase
        .from('user_cards')
        .update({ level: card.level, experience: card.experience })
        .eq('id', card.id);
    }

    /* =====================================================================
       🔥 CORRECCIÓN CRÍTICA: TRABAJAR TODO SOBRE LA TABLA 'profiles'
       ===================================================================== */
    
    // 2. Traer los datos actuales del perfil del usuario (usando 'id' como primary key de profiles)
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select(`id, streak, total_wins_lifetime, user_card_level, user_card_exp, ${columnToUpdate}`)
      .eq('id', userId) // 💡 Si en profiles tu columna se llama 'user_id', cámbialo por .eq('user_id', userId)
      .single();

    if (profileError) console.error('Error al recuperar perfil de profiles:', profileError);

    // Mapeamos de forma segura para TypeScript y extraemos el valor actual
    const profileData = currentProfile as Record<string, any> | null;
    const currentStatValue = profileData ? (profileData[columnToUpdate] || 50) : 50;
    
    // Acumuladores históricos por si la base de datos no tenía el registro completo
    const currentWinsLifetime = profileData ? (profileData['total_wins_lifetime'] || 0) : 0;

    // 3. Guardar stats globales Y el nuevo skill incrementado directamente en 'profiles'
    const { error: statsError } = await supabase
      .from('profiles')
      .update({
        // Incrementamos la racha y los niveles globales
        streak:                 newStreak,
        user_card_level:        newLv, 
        user_card_exp:          newXp,   
        total_wins_lifetime:    currentWinsLifetime + (won ? 1 : 0),
        
        // 🔥 Aquí se suma el skill dinámicamente en la columna correcta de profiles
        [columnToUpdate]:       currentStatValue + 1 
      })
      .eq('id', userId); // 💡 Cambiar a 'user_id' si esa es la columna en profiles

    if (statsError) {
      console.error('Error guardando stats y skills en profiles:', statsError);
    } else {
      console.log(`¡Skill ${columnToUpdate} subió con éxito a ${currentStatValue + 1}!`);
    }

    // 4. Registrar el partido jugado en la tabla matches (Para el historial)
    await supabase
      .from('matches')
      .insert({
        user_id:           userId,
        user_deck_id:      userDeck.id,
        user_score:        ug,
        opponent_score:    rg,
        winner_id:         won ? userId : null,
        experience_gained: xpGained,
      });

  } catch (err) {
    console.error('Error general en persistencia de handleMatchEnd:', err);
  }

  // Actualizar estado local siempre
  setUserStats(newStats);
  onBattleComplete(updatedCards);

  setMatchResult({
    winner:     won ? 'user' : (tied ? 'draw' : 'rival'),
    userScore:  ug,
    rivalScore: rg,
    xpGained,
    streakBonus,
    leveledUpCards,
    skillUpgrade,
    newStreak,
  });
  setPhase('result');
}
  // ─── Render ───────────────────────────────────────────────────────────────────

  const xpPct       = Math.min(100, Math.round((userStats.xp / userStats.xp_needed) * 100));
  const deckCards   = (userDeck.cards ?? []) as UserCard[];
  const needsCards  = deckCards.length < 5;
  const timerColor  = timerPct > 50 ? '#3DFFA0' : timerPct > 25 ? '#FFD700' : '#FF6B6B';
  const flashColors = {
    goal: { bg:'rgba(255,215,0,0.95)', text:'#000' },
    miss: { bg:'rgba(255,100,60,0.88)', text:'#fff' },
    ok:   { bg:'rgba(61,255,160,0.88)', text:'#000' },
    bad:  { bg:'rgba(255,60,60,0.92)',  text:'#fff' },
  };

  return (
    <div className="arena-container">

      {/* ── Header ── */}
      <div className="arena-header">
        <div className="arena-title">
          <span>⚽</span><span>FLORES CLUB ARENA</span>
          <span className="arena-badge">FUTSAL</span>
        </div>
        <button className="deck-link-btn" onClick={onNavigateToDeck}>
          📋 MI EQUIPO <span className="deck-count">{deckCards.length}/5</span>
        </button>
      </div>

      {/* ════════════════════════ CANCHA ════════════════════════ */}
    <div className="arena-match-core">
      <div className={`futsal-court ${moment ? 'court-tension' : ''} ${flash?.type === 'goal' ? 'flash-futsal-gol' : ''}`}>

        {/* Marcador */}
        {phase === 'battle' && (
          <div className="court-scoreboard">
            <div className="csb-side">
              <span className="csb-label">VOS</span>
              <span className="csb-score user-sc">{uGoals}</span>
            </div>
            <div className="csb-center">
              <span className="csb-min">MIN {minute}'</span>
              <div className="csb-prog"><div className="csb-prog-fill" style={{ width:`${(minute/40)*100}%` }}/></div>
            </div>
            <div className="csb-side csb-right">
              <span className="csb-score rival-sc">{rGoals}</span>
              <span className="csb-label">{bot.avatar}</span>
            </div>
          </div>
        )}

        {/* Pelota */}
        {ballVisible && (
          <div className="ball-token" style={{ left:`${ball.x}%`, top:`${ball.y}%` }}>⚽</div>
        )}

        {/* Flash de evento */}
        {flash && (
          <div className="court-flash" style={{
            left:`${flash.x}%`, top:`${flash.y}%`,
            background: flashColors[flash.type].bg,
            color:      flashColors[flash.type].text,
          }}>
            {flash.text}
          </div>
        )}

        {/* ── Panel de decisión superpuesto ── */}
        {moment && (
          <div className="decision-overlay">
            <div className="decision-panel">
              <div className="dp-intro">{moment.intro}</div>
              <div className="dp-header">
                <div>
                  <div className="dp-kicker">⚡ MOMENTO CLAVE · MIN {moment.minute}'</div>
                  <div className="dp-player">{getCardData(moment.mainCard).name}</div>
                </div>
                <div className="dp-timer-wrap">
                  <svg width="44" height="44" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke={timerColor}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*18}`}
                      strokeDashoffset={`${2*Math.PI*18*(1-timerPct/100)}`}
                      style={{ transition:'stroke-dashoffset 0.1s linear,stroke 0.3s' }}
                    />
                  </svg>
                  <span className="dp-timer-num" style={{ color:timerColor }}>
                    {Math.max(1, Math.ceil(moment.timeLimit * timerPct / 100))}
                  </span>
                </div>
              </div>

              {/* Stats de la carta por grupo */}
              <div className="dp-stats-row">
                {(['attack','defense','technique'] as SkillGroup[]).map(g => {
                  const info = SKILL_GROUP_INFO[g];
                  const val  = calcGroupValue(moment.mainCard, g);
                  return (
                    <div key={g} className="dp-stat-badge"
                      style={{ borderColor:info.color+'55', background:info.color+'14' }}>
                      <span>{info.icon}</span>
                      <div>
                        <div className="dp-stat-label" style={{ color:info.color }}>{info.label}</div>
                        <div className="dp-stat-val">{val}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Opciones */}
              <div className="dp-options">
                {moment.options.map((opt, i) => {
                  const g      = SKILL_GROUP_INFO[opt.skillGroup];
                  const chosen = decidedId === opt.id;
                  const faded  = !!(decidedId && !chosen);
                  return (
                    <button key={opt.id}
                      className={`dp-option${chosen?' dp-chosen':''}${faded?' dp-faded':''}`}
                      style={{ animationDelay:`${i*0.07}s`, '--gc':g.color } as React.CSSProperties}
                      onClick={() => !decidedId && handleDecision(opt)}
                      disabled={!!decidedId}
                    >
                      <span className="dp-opt-icon">{opt.icon}</span>
                      <div className="dp-opt-text">
                        <div className="dp-opt-label">{opt.label}</div>
                        <div className="dp-opt-hint">{opt.hint}</div>
                      </div>
                      <div className="dp-opt-group"
                        style={{ background:g.color+'20', border:`1px solid ${g.color}50`, color:g.color }}>
                        {g.icon} {g.label}
                      </div>
                      {opt.isSafe && <span className="dp-safe-tag">AUTO</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Fichas usuario ── */}
        {deckCards.slice(0, 5).map((card, idx) => {
          // KEY única: combinamos posición en formación + id de carta
          const key = `u_slot${idx}_${card.id}`;
          const d   = getCardData(card);
          const pos = uPos[idx] ?? USER_BASE[idx];
          const hl  = uHL === idx;
          const hasBall = ballTeam === 'user' && hl;
          return (
            <div key={key}
              className={`player-on-court${hl?' token-active':''}`}
              style={{
                left:`${pos.x}%`, top:`${pos.y}%`,
                transition:'left 0.5s cubic-bezier(0.4,0,0.2,1),top 0.5s cubic-bezier(0.4,0,0.2,1)',
                zIndex: hl ? 10 : 6,
              }}
            >
              <div className={`player-token user-token${hl?' token-glow-user':''}`}>
                {hasBall && <div className="ball-on-token">⚽</div>}
                <div className="token-icon">
                  <img src="/images/player.png" alt="u" style={{ width:24, height:24, objectFit:'contain' }}/>
                </div>
                <div className="token-name">{d.name?.substring(0,9) || 'Jugador'}</div>
                <span className="token-overall user-overall">{d.overall_rating||50}</span>
              </div>
              <div className="pos-label">{LABELS[idx]}</div>
            </div>
          );
        })}

        {/* ── Fichas rival ── */}
        {[0,1,2,3,4].map(i => {
          const pos = rPos[i] ?? RIVAL_BASE[i];
          const hl  = rHL === i;
          const hasBall = ballTeam === 'rival' && hl;
          return (
            <div key={`r_slot${i}`}
              className={`player-on-court${hl?' token-active':''}`}
              style={{
                left:`${pos.x}%`, top:`${pos.y}%`,
                transition:'left 0.5s cubic-bezier(0.4,0,0.2,1),top 0.5s cubic-bezier(0.4,0,0.2,1)',
                zIndex: hl ? 10 : 6,
              }}
            >
              <div className={`player-token rival-token${hl?' token-glow-rival':''}`}>
                {hasBall && <div className="ball-on-token">⚽</div>}
                <div className="token-icon">
                  <img src="/images/bot.png" alt="r" style={{ width:24, height:24, objectFit:'contain' }}/>
                </div>
                <div className="token-name">{bot.name.split(' ')[1]?.substring(0,6) ?? bot.name.substring(0,6)}</div>
                <div className="token-level rival-level">Nv.{bot.level}</div>
              </div>
              <div className="pos-label">{LABELS[i]}</div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════ FASE SELECT ════════════════════════ */}
      {phase === 'select' && (
        <div className="rival-selector">
          <div className="rival-selector-title">⚔️ ELEGIR RIVAL</div>
          <div className="rival-selector-row">
            {BOTS.map(b => (
              <button key={b.name}
                className={`bot-card${bot.name === b.name?' selected':''}`}
                onClick={() => setBot(b)}
                style={{ '--bc':b.color } as React.CSSProperties}
              >
                <span className="bot-avatar">{b.avatar}</span>
                <span className="bot-name">{b.name.replace('Bot ','')}</span>
                <span className="bot-ovr">OVR {b.overall_rating}</span>
                <span className="bot-exp">+{b.xpBase} XP</span>
              </button>
            ))}
          </div>
          {needsCards
            ? <button className="cta-btn deck-btn" onClick={onNavigateToDeck}>📦 AGREGAR JUGADORES</button>
            : <button className="cta-btn start-btn" onClick={startBattle}>▶ JUGAR VS {bot.name.toUpperCase()}</button>
          }
        </div>
      )}
    
      {/* ════════════════════════ LOG BATTLE ════════════════════════ */}
      {/* FASE BATTLE: Transmisión en directo integrada */}
{phase === 'battle' && (
  <div className="live-ticker-container">
    <div className="ticker-header-row">
      <div className="ticker-badge">🔴 EN DIRECTO</div>
      
      {/* 📊 BARRA DE POSESIÓN DINÁMICA */}
      <div className="possession-bar-wrap">
        <div className="possession-bar">
          {/* Si ballTeam es 'user', simulamos 58% de dominio, si no, 42% (con sutiles variantes) */}
          <div 
            className="possession-fill user-fill" 
            style={{ width: `${ballTeam === 'user' ? 58 : 42}%` }}
          >
            {ballTeam === 'user' ? '58%' : '42%'}
          </div>
          <div 
            className="possession-fill rival-fill" 
            style={{ width: `${ballTeam === 'rival' ? 58 : 42}%` }}
          >
            {ballTeam === 'rival' ? '58%' : '42%'}
          </div>
        </div>
        <span className="possession-label">POSESIÓN</span>
      </div>
    </div>

    <div className="battle-log-strip" ref={logRef}>
      {log.slice(-7).map((l, idx) => (
        <div key={`log_strip_${l.id}_${idx}`} className={`log-line log-${l.type}`}>
          {l.text}
        </div>
      ))}
      {log.length === 0 && <div className="log-line">⏳ El partido está por comenzar…</div>}
    </div>
  </div>
)}
      {/* ════════════════════════ MODAL RESULTADO ════════════════════════ */}
      {phase === 'result' && matchResult && (
  <div className="result-modal-overlay" onClick={() => { setMatchResult(null); setPhase('select'); }}>
    <div 
      className={`result-modal ${
        matchResult.winner === 'user' ? 'win' : matchResult.winner === 'draw' ? 'draw' : 'lose'
      }`}
      onClick={e => e.stopPropagation()}
    >

      <div className="rm-title">
        {matchResult.winner === 'user' && '🏆 ¡VICTORIA!'}
        {matchResult.winner === 'draw' && '🤝 ¡EMPATE!'}
        {matchResult.winner === 'rival' && '💔 DERROTA'}
      </div>

      <div className="rm-score">
        <div className="rm-score-side">
          <div className="rm-score-label">VOS</div>
          <div className="rm-score-num user-color">{matchResult.userScore}</div>
        </div>
        <div className="rm-score-sep">–</div>
        <div className="rm-score-side">
          <div className="rm-score-label">{bot.avatar} {bot.name.replace('Bot ','')}</div>
          <div className="rm-score-num rival-color">{matchResult.rivalScore}</div>
        </div>
      </div>

      {/* Recompensas */}
      <div className="rm-rewards-title">RECOMPENSAS</div>
      <div className="rm-rewards">
        <div className="rm-reward-box">
          <div className="rm-reward-icon">✨</div>
          <div className="rm-reward-val">+{matchResult.xpGained}</div>
          <div className="rm-reward-lbl">XP</div>
        </div>

        {/* Caja dinámica que muestra los puntos ganados según el trigger */}
        <div className="rm-reward-box points-box">
          <div className="rm-reward-icon">🪙</div>
          <div className="rm-reward-val">
            +{matchResult.winner === 'user' ? 15 : matchResult.winner === 'draw' ? 7 : 5}
          </div>
          <div className="rm-reward-lbl">Puntos</div>
        </div>

        {matchResult.streakBonus > 0 && (
          <div className="rm-reward-box streak-box">
            <div className="rm-reward-icon">🔥</div>
            <div className="rm-reward-val">+{matchResult.streakBonus}</div>
            <div className="rm-reward-lbl">Bonus racha</div>
          </div>
        )}
      </div>

      {matchResult.winner === 'user' && matchResult.newStreak > 1 && (
        <div className="rm-streak-banner">🔥 Racha {matchResult.newStreak} — ¡seguí así!</div>
      )}

      {/* Skill upgrade */}
      {matchResult.skillUpgrade && (
        <div className="rm-skill-upgrade"
          style={{ '--sc': SKILL_GROUP_INFO[matchResult.skillUpgrade.group].color } as React.CSSProperties}>
          <div className="rm-skill-icon">{matchResult.skillUpgrade.icon}</div>
          <div className="rm-skill-text">
            <div className="rm-skill-label">SKILL {matchResult.skillUpgrade.label} +{matchResult.skillUpgrade.delta}</div>
            <div className="rm-skill-desc">
              {matchResult.winner === 'user' && 'La victoria agudizó tu ataque.'}
              {matchResult.winner === 'draw' && 'El equilibrio del empate pulió tus habilidades.'}
              {matchResult.winner === 'rival' && 'La derrota te endureció en defensa.'}
            </div>
          </div>
          <div className="rm-skill-pill">+{matchResult.skillUpgrade.delta}</div>
        </div>
      )}

      {matchResult.leveledUpCards.length > 0 && (
        <div className="rm-cards-levelup">
          ⬆️ {matchResult.leveledUpCards.join(', ')} subieron de nivel
        </div>
      )}

      <button className="cta-btn start-btn rm-btn"
        onClick={() => { setMatchResult(null); setPhase('select'); }}>
        JUGAR DE NUEVO
      </button>
    </div>
  </div>
)}
</div>  

      {/* ════════════════════════ ESTILOS ════════════════════════ */}
      <style>{`
        *{user-select:none;-webkit-tap-highlight-color:transparent;}

        .arena-container {
  background: linear-gradient(150deg, #0a2a18, #06120c);
  border-radius: 28px;
  padding: 20px;
  margin: 16px 0;
  border: 1px solid rgba(61,255,160,0.25);
  box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative;
  overflow: hidden;
      width: 10%;
}

/* Efecto de brillo en bordes */
.arena-container::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    rgba(61,255,160,0.2), 
    transparent 30%, 
    transparent 70%, 
    rgba(61,255,160,0.2));
  border-radius: 30px;
  pointer-events: none;
  z-index: -1;
}

        .arena-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;}
        .arena-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:bold;color:#3dffa0;letter-spacing:1px;}
        .arena-badge{font-size:9px;padding:2px 8px;border-radius:20px;background:rgba(61,255,160,0.15);color:#3dffa0;border:1px solid rgba(61,255,160,0.3);letter-spacing:1.5px;}
        .deck-link-btn{background:rgba(61,255,160,0.1);border:1px solid #3dffa0;border-radius:40px;padding:6px 14px;color:#3dffa0;font-size:12px;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;}
        .deck-link-btn:hover{background:rgba(61,255,160,0.2);}
        .deck-count{background:#3dffa0;color:#0a0a0f;border-radius:20px;padding:1px 6px;font-size:10px;}

        .xp-section{background:rgba(255,255,255,0.04);border-radius:14px;padding:10px 14px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.08);}
        .xp-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .xp-level{font-size:12px;font-weight:bold;color:#ffd700;white-space:nowrap;}
        .xp-bar-wrap{flex:1;background:rgba(255,255,255,0.1);border-radius:8px;height:8px;overflow:hidden;}
        .xp-bar-fill{height:100%;background:linear-gradient(90deg,#ffd700,#ffaa00);border-radius:8px;transition:width 0.8s ease;}
        .xp-label{font-size:11px;color:rgba(255,255,255,0.5);white-space:nowrap;}
        .stats-mini-row{display:flex;gap:14px;}
        .mini-stat{font-size:11px;color:rgba(255,255,255,0.55);}

        /* Cancha */
        .futsal-court{
          position:relative;width:100%;height:340px;border-radius:16px;overflow:hidden;
          border:2px solid rgba(255,255,255,0.15);
          background:linear-gradient(135deg,rgba(30,200,120,0.08),rgba(0,0,0,0.2)),
                     url('/images/cancha.jpg') center/cover no-repeat,
                     linear-gradient(145deg,#0a2a18,#0a1510);
          margin-bottom:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);
        }
        .futsal-court::before{
          content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:70px;height:70px;border:1.5px solid rgba(255,255,255,0.15);border-radius:50%;pointer-events:none;
        }
        /* línea de medio campo */
        .futsal-court::after{
          content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
          width:1.5px;height:100%;background:rgba(255,255,255,0.1);pointer-events:none;
        }

        /* Textura de césped */
.futsal-court::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 10% 20%, rgba(0,0,0,0.05) 2%, transparent 2.5%);
  background-size: 28px 28px;
  pointer-events: none;
  z-index: 1;
}

        /* Marcador */
        .court-scoreboard{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);border-radius:20px;padding:6px 14px;border:1px solid rgba(255,255,255,0.1);z-index:20;}
        .csb-side{display:flex;align-items:center;gap:6px;}
        .csb-right{flex-direction:row-reverse;}
        .csb-label{font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.45);}
        .csb-score{font-size:26px;font-weight:900;line-height:1;}
        @keyframes scorePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); color: #FFD700; }
  100% { transform: scale(1); }
}

.csb-score {
  transition: all 0.1s ease;
}

/* Agrega esta clase cuando el marcador cambia */
.csb-score.changed {
  animation: scorePop 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}
        .user-sc{color:#3dffa0;} .rival-sc{color:#ff7060;}
        .csb-center{text-align:center;min-width:56px;}
        .csb-min{font-size:9px;color:rgba(255,255,255,0.5);display:block;margin-bottom:3px;}
        .csb-prog{height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;}
        .csb-prog-fill{height:100%;background:#A78BFA;border-radius:2px;transition:width 1s ease;}

        /* Pelota */
        .ball-token{position:absolute;transform:translate(-50%,-50%);font-size:18px;z-index:15;pointer-events:none;
          transition:left 0.4s cubic-bezier(0.4,0,0.2,1),top 0.4s cubic-bezier(0.4,0,0.2,1);
          filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));}
        .ball-on-token{position:absolute;top:-10px;right:-6px;font-size:11px;z-index:5;animation:bb 0.4s ease infinite alternate;}
        @keyframes bb{from{transform:translateY(0)}to{transform:translateY(-3px)}}

        /* Flash */
        .court-flash{position:absolute;transform:translate(-50%,-50%);z-index:30;pointer-events:none;font-size:14px;font-weight:900;padding:8px 16px;border-radius:24px;white-space:nowrap;animation:cf 2s ease forwards;}
        @keyframes cf{0%{opacity:0;transform:translate(-50%,-50%) scale(0.7)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}70%{opacity:1;transform:translate(-50%,-62%) scale(1)}100%{opacity:0;transform:translate(-50%,-85%) scale(0.95)}}

        /* Decisión */
        .decision-overlay{position:absolute;inset:0;z-index:40;background:rgba(0,0,0,0.68);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;animation:ov 0.2s ease;}
        @keyframes ov{from{opacity:0}to{opacity:1}}
        .decision-panel{background:rgba(8,14,22,0.97);border:1px solid rgba(167,139,250,0.4);border-radius:18px;padding:14px 16px;width:90%;max-width:330px;animation:pp 0.25s cubic-bezier(0.34,1.3,0.64,1);}
        @keyframes pp{from{transform:scale(0.88) translateY(12px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        .dp-intro{font-size:13px;font-weight:700;color:#fff;text-align:center;margin-bottom:10px;padding:6px 10px;background:rgba(167,139,250,0.1);border-radius:10px;}
        .dp-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
        .dp-kicker{font-size:9px;letter-spacing:1.8px;color:#A78BFA;font-weight:700;margin-bottom:3px;}
        .dp-player{font-size:14px;color:#fff;font-weight:700;}
        .dp-timer-wrap{position:relative;width:44px;height:44px;}
        .dp-timer-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;}
        .dp-stats-row{display:flex;gap:6px;margin-bottom:10px;}
        .dp-stat-badge{flex:1;display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:10px;border:1px solid;}
        .dp-stat-badge span{font-size:14px;}
        .dp-stat-label{font-size:8px;font-weight:700;letter-spacing:0.8px;}
        .dp-stat-val{font-size:14px;font-weight:800;color:#fff;line-height:1;}
        .dp-options{display:flex;flex-direction:column;gap:7px;}
        .dp-option{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:9px 11px;cursor:pointer;color:#fff;font-size:13px;text-align:left;transition:background 0.15s,border-color 0.15s,transform 0.1s;animation:op 0.22s ease both;position:relative;}
        @keyframes op{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .dp-option:hover:not(:disabled){background:rgba(255,255,255,0.09);transform:translateY(-1px);}
        .dp-option.dp-chosen{border-color:#3DFFA0;background:rgba(61,255,160,0.12);}
        .dp-option.dp-faded{opacity:0.28;}
        .dp-opt-icon{font-size:20px;line-height:1;flex-shrink:0;}
        .dp-opt-text{flex:1;min-width:0;}
        .dp-opt-label{font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dp-opt-hint{font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px;}
        .dp-opt-group{font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap;letter-spacing:0.5px;flex-shrink:0;}
        .dp-safe-tag{position:absolute;top:4px;right:4px;font-size:8px;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;}

        /* Fichas */
        .player-on-court{position:absolute;transform:translate(-50%,-50%);z-index:6;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .token-active{z-index:10;}
        .player-token {
  width: 58px;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(4px);
  transition: all 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
  position: relative;
  transform: translateY(0);
  cursor: pointer;
}

.player-token:hover {
  transform: translateY(-4px) scale(1.02);
}

.user-token {
  background: linear-gradient(145deg, rgba(30,200,120,0.28), rgba(20,150,90,0.2));
  border-bottom: 3px solid #3dffa0;
  box-shadow: 0 6px 14px rgba(61,255,160,0.2);
}

/* Sombra en el suelo */
.player-token::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  filter: blur(3px);
  transition: all 0.2s;
}

.player-token:hover::before {
  width: 100%;
  bottom: -10px;
}
        .rival-token{background:linear-gradient(145deg,rgba(255,110,60,0.22),rgba(200,70,35,0.16));border-bottom:3px solid #ff6e3c;box-shadow:0 4px 12px rgba(255,110,60,0.15);}
        .token-glow-user{box-shadow:0 0 0 3px rgba(61,255,160,0.75),0 4px 20px rgba(61,255,160,0.45)!important;animation:pg 0.8s ease infinite alternate;}
        .token-glow-rival{box-shadow:0 0 0 3px rgba(255,100,60,0.75),0 4px 20px rgba(255,100,60,0.45)!important;animation:pr 0.8s ease infinite alternate;}
        @keyframes pg{from{box-shadow:0 0 0 2px rgba(61,255,160,0.6),0 4px 14px rgba(61,255,160,0.3)}to{box-shadow:0 0 0 5px rgba(61,255,160,0.9),0 4px 24px rgba(61,255,160,0.6)}}
        @keyframes pr{from{box-shadow:0 0 0 2px rgba(255,100,60,0.6),0 4px 14px rgba(255,100,60,0.3)}to{box-shadow:0 0 0 5px rgba(255,100,60,0.9),0 4px 24px rgba(255,100,60,0.6)}}
        .token-icon{background:rgba(0,0,0,0.4);border-radius:6px 6px 4px 4px;padding:4px;margin:3px 4px 0;display:flex;align-items:center;justify-content:center;min-height:32px;}
        .token-icon img{width:22px;height:22px;object-fit:contain;}
        .token-name{font-size:7px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48px;padding:2px 3px;background:linear-gradient(90deg,rgba(0,0,0,0.65),rgba(0,0,0,0.35));text-transform:uppercase;display:block;}
        .token-overall{font-size:9px;font-weight:900;padding:2px 4px;border-radius:5px;background:linear-gradient(135deg,#1a1a2e,#0a0a15);color:#ffd700;border:1px solid rgba(255,215,0,0.3);display:block;margin:2px auto 3px;width:fit-content;}
        .user-overall{color:#3dffa0;border-color:rgba(61,255,160,0.4);}
        .token-level{font-size:8px;font-weight:800;padding:2px 4px;border-radius:8px;background:rgba(0,0,0,0.5);display:block;margin:0 auto 3px;width:fit-content;}
        .rival-level{color:#ff9060;border:1px solid rgba(255,144,96,0.3);}
        .pos-label{font-size:7px;font-weight:800;letter-spacing:1px;color:rgba(255,255,255,0.7);background:rgba(0,0,0,0.72);padding:2px 6px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);}

        /* Log */
        .battle-log-strip{height:120px;overflow-y:auto;padding:10px 14px;background:rgba(0,0,0,0.35);border-radius:14px;border:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:4px;margin-bottom:10px;scrollbar-width:none;}
        .log-line{font-size:12px;line-height:1.45;animation:ls 0.22s ease;}
        @keyframes ls{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:none}}
        .log-neutral{color:rgba(255,255,255,0.6);} .log-good{color:#3dffa0;} .log-bad{color:#ff7060;}
        .log-goal{color:#FFD700;font-weight:700;background:rgba(255,215,0,0.07);padding:4px 8px;border-radius:7px;border:1px solid rgba(255,215,0,0.14);}
        .log-event{color:#A78BFA;font-weight:600;}
        .log-loading{color:rgba(255,255,255,0.25);font-size:12px;text-align:center;margin-top:36px;animation:pl 1.5s ease infinite;}
        .log-cursor{width:7px;height:13px;background:#3dffa0;opacity:0.6;border-radius:2px;animation:bl 1s step-end infinite;}
        @keyframes bl{0%,100%{opacity:0.6}50%{opacity:0}}
        @keyframes pl{0%,100%{opacity:1}50%{opacity:0.35}}

        /* Selector */
        .rival-selector{margin-bottom:14px;background:rgba(0,0,0,0.3);border-radius:18px;padding:14px 16px 16px;border:1px solid rgba(255,100,50,0.2);}
        .rival-selector-title{font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,0.35);text-align:center;margin-bottom:10px;}
        .rival-selector-row{display:flex;gap:8px;margin-bottom:12px;}
        .bot-card{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px;border-radius:14px;border:1.5px solid rgba(255,100,50,0.3);background:rgba(255,100,50,0.06);cursor:pointer;color:#fff;transition:all 0.18s;}
        .bot-card:hover{background:rgba(255,100,50,0.14);border-color:rgba(255,100,50,0.65);transform:translateY(-3px);}
        .bot-card.selected{background:rgba(255,100,50,0.2);border-color:var(--bc,#ff7040);box-shadow:0 0 12px rgba(255,100,50,0.25);}
        .bot-avatar{font-size:20px;} .bot-name{font-size:11px;font-weight:bold;}
        .bot-ovr{font-size:9px;color:#ff9060;} .bot-exp{font-size:9px;color:#3dffa0;}

        .cta-btn{width:100%;padding:13px;border-radius:40px;border:none;font-weight:bold;font-size:13px;cursor:pointer;transition:all 0.2s;}
        .cta-btn:hover{transform:translateY(-2px);opacity:0.92;}
        .start-btn{background:linear-gradient(90deg,#ff4d6d,#ff7040);color:#fff;}
        .deck-btn{background:rgba(61,255,160,0.1);border:1px solid #3dffa0!important;color:#3dffa0;}

        /* Modal resultado */
        .result-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi 0.25s ease;}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        .result-modal{background:linear-gradient(145deg,#0e1a10,#0a1208);border-radius:24px;padding:28px 24px;max-width:380px;width:100%;border:1px solid rgba(255,255,255,0.1);animation:mp 0.35s cubic-bezier(0.34,1.2,0.64,1);box-shadow:0 20px 60px rgba(0,0,0,0.6);max-height:90vh;overflow-y:auto;scrollbar-width:none;}
        @keyframes mp{from{transform:scale(0.88) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        .result-modal.win{border-color:rgba(61,255,160,0.3);}
        .result-modal.lose{border-color:rgba(255,100,60,0.3);}
        .rm-title{font-size:24px;font-weight:900;text-align:center;margin-bottom:16px;}
        .result-modal.win .rm-title{color:#3dffa0;} .result-modal.lose .rm-title{color:#ff7060;}
        .rm-score{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px;}
        .rm-score-side{text-align:center;}
        .rm-score-label{font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:1px;margin-bottom:4px;}
        .rm-score-num{font-size:52px;font-weight:900;line-height:1;}
        .user-color{color:#3dffa0;} .rival-color{color:#ff7060;}
        .rm-score-sep{font-size:28px;color:rgba(255,255,255,0.2);font-weight:200;}
        .rm-rewards-title{font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:10px;}
        .rm-rewards{display:flex;gap:10px;margin-bottom:14px;justify-content:center;}
        .rm-reward-box{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:12px 18px;text-align:center;min-width:80px;}
        .rm-reward-box.streak-box{border-color:rgba(255,144,60,0.3);background:rgba(255,100,50,0.08);}
        .rm-reward-icon{font-size:20px;margin-bottom:4px;}
        .rm-reward-val{font-size:22px;font-weight:900;color:#fff;}
        .rm-reward-lbl{font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;}
        .rm-streak-banner{background:rgba(255,100,50,0.12);border:1px solid rgba(255,100,50,0.25);border-radius:12px;padding:10px 14px;text-align:center;font-size:12px;color:#ff9060;font-weight:600;margin-bottom:12px;}
        .rm-skill-upgrade{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;margin-bottom:14px;border:1px solid var(--sc,#3dffa0);background:rgba(255,255,255,0.04);animation:sk 0.5s cubic-bezier(0.34,1.3,0.64,1) 0.3s both;}
        @keyframes sk{from{opacity:0;transform:scale(0.9) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .rm-skill-icon{font-size:28px;flex-shrink:0;}
        .rm-skill-text{flex:1;}
        .rm-skill-label{font-size:13px;font-weight:800;color:#fff;margin-bottom:2px;}
        .rm-skill-desc{font-size:11px;color:rgba(255,255,255,0.5);}
        .rm-skill-pill{background:var(--sc,#3dffa0);color:#000;font-weight:900;font-size:14px;border-radius:20px;padding:4px 12px;flex-shrink:0;}
        .rm-cards-levelup{font-size:12px;color:#ffd700;background:rgba(255,215,0,0.07);border-radius:10px;padding:8px 12px;text-align:center;margin-bottom:12px;}
        .rm-btn{margin-top:4px;}
        .result-modal.draw {
  border-color: #ffca28; /* Amarillo/Dorado para empate */
  background: linear-gradient(180deg, rgba(40, 40, 45, 0.95) 0%, rgba(25, 25, 30, 0.98) 100%);
}
 /* =====================================================================
   📊 CONTENEDOR BASE DEL TICKER (Común para ambos)
   ===================================================================== */
.live-ticker-container {
  background: #0d1117;
  border: 1px solid #1f2937;
  border-radius: 14px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.4);
  position: relative;
  display: flex;
  flex-direction: column;
}

.ticker-badge {
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: flex-start;
}

.battle-log-strip {
  display: flex;
  flex-direction: column;
  gap: 6px; /* Espacio entre eventos para que no se peguen */
}

/* =====================================================================
   📱 AJUSTES ULTRA-LIMPIOS PARA CELULARES (Mobile View)
   ===================================================================== */
@media (max-width: 900px) {
  .live-ticker-container {
    padding: 14px;
    /* Subimos a 210px para darle aire a los 7 mensajes con sus espacios */
    height: 210px; 
  }

  .ticker-badge {
    position: absolute;
    top: 0;
    left: 0;
    border-bottom-right-radius: 8px;
  }

  .battle-log-strip {
    height: 100%;
    margin-top: 14px;
    overflow-y: hidden;
    justify-content: flex-end; /* Los nuevos empujan hacia arriba */
  }

  .log-line {
    font-size: 12px;
    line-height: 1.4;
    /* En vez de borde largo, un detalle sutil a la izquierda */
    border-left: 2px solid rgba(61, 255, 160, 0.5);
    padding-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    animation: slideNewLog 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
  }
    /* Animación: entra desde abajo con un sutil rebotecito */
@keyframes slideNewLog {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
}

/* =====================================================================
   🖥️ AJUSTES PARA ESCRITORIO (Desktop Grid View)
   ===================================================================== */
@media (min-width: 901px) {
  .arena-match-core {
    display: grid;
    /* Ajustamos el tamaño: 62% cancha, 38% relatos */
    grid-template-columns: 1.62fr 1fr; 
    gap: 20px;
    align-items: stretch; /* Fuerza a que ambos paneles midan exactamente lo mismo de alto */
    max-width: 100%;
  }

  .live-ticker-container {
    padding: 20px;
    /* Al usar stretch en el grid, el ticker mide lo mismo que la cancha. 
       Le damos height 100% para que use ese espacio */
    height: 100%; 
  }

  .ticker-badge {
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .battle-log-strip {
    flex: 1;
    overflow-y: auto; /* En PC sí dejamos scroll por si quiere revisar el historial */
    padding-right: 4px;
    /* Aseguramos que si hay pocos o muchos elementos se vea estético */
    max-height: 400px; 
  }

  .log-line {
    font-size: 13px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    border-left: 2px solid transparent;
  }
  
  /* Destacamos levemente el último evento (el más nuevo) en PC */
  .log-line:last-child {
    background: rgba(61, 255, 160, 0.04);
    border-left-color: #3dffa0;
  }
}
  .live-ticker-container::after {
  content: " ";
  display: block;
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  z-index: 2;
  background-size: 100% 2px, 3px 100%;
  pointer-events: none; /* Para que no te rompa los clicks */
  opacity: 0.4;
}
  /* --- Cabecera del Ticker --- */
.ticker-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  z-index: 3; /* Por encima del filtro CRT */
}

/* --- Contenedor de la Barra de Posesión --- */
.possession-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.possession-label {
  font-size: 9px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
}

.possession-bar {
  display: flex;
  width: 120px;
  height: 14px;
  border-radius: 4px;
  overflow: hidden;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* --- Rellenos de la barra con transiciones suaves --- */
.possession-fill {
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.possession-fill.user-fill {
  background: #3dffa0; /* Verde LupiApp */
  color: #0d1117;
}

.possession-fill.rival-fill {
  background: #1f2937;
  color: rgba(255, 255, 255, 0.6);
  border-left: 1px solid rgba(0,0,0,0.3);
}

/* =====================================================================
   📺 EFECTO CRT SCANLINES PARA EL TRANSMISOR (Estilo Monitor de Estadio)
   ===================================================================== */
.live-ticker-container::after {
  content: " ";
  display: block;
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  /* Capa de líneas horizontales de 2px de alto */
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%, 
    rgba(0, 0, 0, 0.3) 50%
  );
  background-size: 100% 4px;
  z-index: 2;
  pointer-events: none; /* Permite clicks e interacciones debajo de la capa */
  opacity: 0.6;
}

/* Aseguramos que los textos queden por encima del filtro para que no pierdan nitidez */
.battle-log-strip {
  position: relative;
  z-index: 3;
}
  /* =====================================================================
   🚨 ATMÓSFERA DE MOMENTO CLAVE (Cancha en Tensión)
   ===================================================================== */

.futsal-court {
  /* Aseguramos que tu cancha tenga transición para que el cambio no sea brusco */
  transition: box-shadow 0.5s ease, border-color 0.5s ease, filter 0.5s ease;
  position: relative;
}

/* Cuando se activa el momento clave: */
.futsal-court.court-tension {
  /* 1. Sombra interna pesada que oscurece los córners y bordes de la cancha */
  box-shadow: 
    inset 0 0 80px rgba(0, 0, 0, 0.85),
    0 0 15px rgba(255, 174, 0, 0.2);
    
  /* 2. El borde exterior de la cancha cambia a un color de alerta (dorado/ámbar) */
  border-color: #ffae00 !important;
  
  /* 3. Animación de pulso para simular luces perimetrales de estadio en pausa */
  animation: courtPulseAlerta 2s infinite ease-in-out;
}

/* Si querés llevarlo al extremo: atenuamos un toque el fondo del pasto/parqué 
   para que resalte el triple el modal de decisión que está flotando arriba */
.futsal-court.court-tension .player-token:not(.token-active) {
  filter: grayscale(0.3) brightness(0.7);
  transition: filter 0.5s ease;
}

/* ── Animación del pulso de luz de la Arena ── */
@keyframes courtPulseAlerta {
  0% {
    border-color: rgba(255, 174, 0, 0.4);
    box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.85);
  }
  50% {
    border-color: rgba(255, 174, 0, 0.8);
    /* El destello invade un poquito más la cancha en el pico de tensión */
    box-shadow: 
      inset 0 0 100px rgba(0, 0, 0, 0.9),
      0 0 20px rgba(255, 174, 0, 0.3);
  }
  100% {
    border-color: rgba(255, 174, 0, 0.4);
    box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.85);
  }
}
  .flash-futsal-gol {
  animation: flashFocos 0.4s ease-out;
}

@keyframes flashFocos {
  0% { filter: brightness(1); }
  30% { filter: brightness(1.8); } /* Destello de luz */
  100% { filter: brightness(1); }
}
        @media(max-width:640px){.futsal-court{height:280px;}.rival-selector-row{flex-direction:column;}.result-modal{padding:20px 16px;} .court-scoreboard {top:-8px;}}
      `}</style>
    </div>
  );
}