import { MatchCourt } from './match/MatchCourt';
import { FORMATIONS, mirror, type Formation, type Pos } from './match/formations';
import { MatchTutorial } from './MatchTutorial';
import { createPortal } from 'react-dom';
// src/components/CardBattle.tsx — v6 (con soporte para modo campaña)
// Fix #1: arena-container width:10% removido
// Fix #2: scoreboard top corregido en mobile
// Fix #3: battle log reescrito sin Tailwind, usando CSS custom
// Fix #4: Modo campaña con rival forzado y selector condicional

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
import { verifiedMatchApi } from '../lib/verifiedMatchApi';
import { AnimeEffects, AnimeEffectsHandle } from './AnimeEffects';


// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CardBattleProps {
  userCards: UserCard[];
  userDeck: Deck;
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
  onMatchRecorded?: () => void;
  onResultClosed?: () => void;
  onNavigateToDeck?: () => void;
  forcedOpponent?: BotPlayer | null;
  isCampaignMode?: boolean;
  autoStart?: boolean;
  onCampaignMatchComplete?: (won: boolean, bot: BotPlayer) => void;

  onDailyChallengesUpdated?: (
    challenges: {
      challenge_id: string;
      progress: number;
      requirement: number;
      completed: boolean;
    }[]
  ) => void;
}

export interface BotPlayer {
  name: string; 
  overall_rating: number; 
  category: string;
  level: number; 
  avatar: string; 
  color: string;
  xpBase: number; 
  reqWins: number;
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

const TOTAL_TURNS = 6;
const TURN_MS     = 400;
const GOAL_MS     = 750;

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, Math.round(ms * 0.55))); }
function calcOvr(cards: UserCard[]) {
  if (!cards.length) return 50;
  return Math.round(cards.reduce((s, c) => s + getCardData(c).overall_rating, 0) / cards.length);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CardBattle({ 
  userCards, 
  userDeck, 
  userId, 
  onBattleComplete,
  onMatchRecorded,
  onResultClosed,
  onNavigateToDeck,
  forcedOpponent = null,
  isCampaignMode = false,
  autoStart = true,
  onCampaignMatchComplete,
  onDailyChallengesUpdated,
}: CardBattleProps) {

  const [phase, setPhase] = useState<'select'|'battle'|'result'>(
  autoStart && isCampaignMode && forcedOpponent ? 'battle' : 'select'
);
  
  // En modo campaña, el bot se setea automáticamente al oponente forzado
  const [bot, setBot] = useState<BotPlayer>(
    forcedOpponent || BOTS[0]
  );
  
  const [userStats, setUserStats] = useState<UserStats>({ level:1, xp:0, xp_needed:100, total_wins:0, streak:0 });
  const animeRef = useRef<AnimeEffectsHandle>(null);

  const [uGoals, setUGoals] = useState(0);
  const [rGoals, setRGoals] = useState(0);
  const [minute, setMinute] = useState(0);

  const [log, setLog] = useState<LogLine[]>([]);
  const [showFullLog, setShowFullLog] = useState(false);
  const logId  = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  const [uPos, setUPos] = useState<Formation>({ ...FORMATIONS.base });
  const [rPos, setRPos] = useState<Formation>({ ...mirror(FORMATIONS.base) });
  const [uHL,  setUHL]  = useState<number | null>(null);
  const [rHL,  setRHL]  = useState<number | null>(null);

  const [ball, setBall]           = useState<Pos>({ x:50, y:50 });
  const [ballVisible, setBallVis] = useState(false);
  const [ballTeam, setBallTeam]   = useState<'user'|'rival'|null>(null);
  const [activeTab, setActiveTab] = useState<'court' | 'tactics'>('court');

  const [flash, setFlash] = useState<{ text:string; type:'goal'|'miss'|'ok'|'bad'; x:number; y:number } | null>(null);

  const [moment, setMoment]     = useState<MomentContext | null>(null);
  const [timerPct, setTimerPct] = useState(100);
  const [decidedId, setDecidedId] = useState<string | null>(null);
  const decisionResolve = useRef<((o: DecisionOption) => void) | null>(null);
  const timerInterval   = useRef<ReturnType<typeof setInterval> | null>(null);

  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  

  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => { loadStats(); }, [userId]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  
  // Si cambia el oponente forzado en modo campaña, actualizar el bot seleccionado
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && isCampaignMode && forcedOpponent && !autoStarted.current) {
      autoStarted.current = true;
      void startBattle();
    }
  // Solo una vez al montar; nunca reiniciar al cerrar un partido.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function calculateTeamStats(deckCards: UserCard[]) {
  if (!deckCards.length) return {
    overall: 0,
    attack: 0,
    defense: 0,
    technique: 0,
    cardCount: 0
  };
  
  const stats = deckCards.reduce((acc, card) => {
    const cardData = getCardData(card);
    return {
      overall: acc.overall + cardData.overall_rating,
      attack: acc.attack + calcGroupValue(card, 'attack'),
      defense: acc.defense + calcGroupValue(card, 'defense'),
      technique: acc.technique + calcGroupValue(card, 'technique')
    };
  }, { overall: 0, attack: 0, defense: 0, technique: 0 });
  
  const count = deckCards.length;
  return {
    overall: Math.round(stats.overall / count),
    attack: Math.round(stats.attack / count),
    defense: Math.round(stats.defense / count),
    technique: Math.round(stats.technique / count),
    cardCount: count
  };
}

  // ── Animaciones ────────────────────────────────────────────────────────────

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

  function moveBall(x: number, y: number, team: 'user'|'rival'|null = null) {
    setBall({ x, y }); setBallVis(true); if (team) setBallTeam(team);
  }

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
      animeRef.current?.triggerKeyMoment();
      const safe = ctx.options.find(o => o.isSafe) ?? ctx.options[ctx.options.length - 1];
      startTimer(Math.min(ctx.timeLimit, 3), () => {
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
    // Prevent double-start while asynchronous equipment checks are running.
    isRunning.current = true;
    // UX preflight only. The trusted match server must enforce this again.
    // Do not consume durability here: client-side matches are not verified.
    const { data: wornItems, error: wornError } = await supabase
      .from('user_items')
      .select('item_id, aura_items!inner(slot)')
      .eq('user_id', userId)
      .eq('equipped', true);
    if (wornError) {
      alert('No se pudo comprobar el equipamiento. Intentá nuevamente.');
      setPhase('select');
      isRunning.current = false;
      return;
    }
    const equipmentIds = (wornItems ?? [])
      .filter((row) => {
        const aura = row.aura_items as unknown as { slot?: string } | { slot?: string }[] | null;
        const slot = Array.isArray(aura) ? aura[0]?.slot : aura?.slot;
        return slot === 'boots' || slot === 'socks';
      })
      .map((row) => row.item_id);
    if (equipmentIds.length) {
      const { data: wear, error: wearError } = await supabase
        .from('equipment_durability')
        .select('item_id,remaining')
        .eq('user_id', userId)
        .in('item_id', equipmentIds);
      if (wearError) {
        alert('No se pudo comprobar la durabilidad. Intentá nuevamente.');
        setPhase('select');
        isRunning.current = false;
        return;
      }
      const exhausted = (wear ?? []).find((row) => row.remaining <= 0);
      if (exhausted) {
        alert('Tenés medias o botines agotados (0/10). Renoválos desde el armario antes de jugar.');
        setPhase('select');
        isRunning.current = false;
        return;
      }
      const lowDurability = (wear ?? []).filter((row) => row.remaining > 0 && row.remaining <= 3);
      if (lowDurability.length) {
        const uses = lowDurability.map((row) => `${row.remaining}/10`).join(', ');
        if (!window.confirm(`⚠️ Tu equipamiento está por agotarse (${uses}). ¿Querés jugar igual?`)) {
          setPhase('select');
          isRunning.current = false;
          return;
        }
      }
    }
    // Opt-in staging only until verified finalization and DB migrations pass E2E.
    const serverMode = import.meta.env.VITE_VERIFIED_MATCHES === 'true';
    let verifiedSession: { id: string; version: number } | null = null;
    let resumedTurnIndex = 0;
    let resumedPending: MomentContext | null = null;
    let resumedScore: { user: number; rival: number } | null = null;
    const recoveryKey = `lupi:verified-match:${userId}`;
    if (serverMode) {
      try {
        // Server discovery also works after clearing storage or switching devices.
        const active = await verifiedMatchApi.active();
        const saved = active?.id ?? null;
        if (saved) {
          window.localStorage.setItem(recoveryKey, saved);
          const session = await verifiedMatchApi.resume(saved);
          if (session.state === 'completed' || session.state === 'expired') {
            window.localStorage.removeItem(recoveryKey);
            if (session.state === 'expired')
              throw new Error('El partido anterior venció. Volvé a iniciar el partido.');
          } else {
            if (session.opponent_key !== bot.name)
              throw new Error(`Tenés un partido pendiente contra ${session.opponent_key}. Seleccioná ese rival para continuar.`);
            resumedTurnIndex = session.turn_index;
            resumedPending = session.pending_decision as MomentContext | null;
            resumedScore = { user: session.user_score, rival: session.opponent_score };
            if (resumedPending && !session.simulation_state?.last_turn)
              throw new Error('No se pudo reconstruir la decisión pendiente.');
            verifiedSession = { id: session.id, version: session.state_version };
          }
        }
        if (!verifiedSession) {
          verifiedSession = await verifiedMatchApi.start(bot.name);
          window.localStorage.setItem(recoveryKey, verifiedSession.id);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'No se pudo iniciar el partido verificado');
        setPhase('select');
        isRunning.current = false;
        return;
      }
    }
    const adv = Math.max(-0.3, Math.min(0.3, (calcOvr(deckCards) - bot.overall_rating) / 100));
    let ug = resumedScore?.user ?? 0, rg = resumedScore?.rival ?? 0;

    setLog([]); setShowFullLog(false); setUGoals(ug); setRGoals(rg);
    setMinute(resumedTurnIndex * 5);
    resetAll(); setPhase('battle');

    addLog('⚽ ¡Silbato inicial! Arrancan los equipos.', 'event');
    moveBall(50, 50, 'user'); setBallVis(true);
    await delay(500);

    try {
    // Verified SQL finalization requires exactly eight completed turns.
    // Preserve the six-turn recreational mode unchanged.
    const totalTurns = verifiedSession ? 8 : TOTAL_TURNS;
    let authoritativeScore: { user: number; rival: number } | null = resumedScore;
    // If a turn was committed before the tab closed, do not request it twice.
    // A pending decision is resolved from the server's stored moment first.
    if (verifiedSession && resumedPending) {
      addLog('↩️ Retomamos la decisión pendiente.', 'event');
      const chosen = await waitForDecision(resumedPending);
      const decision = await verifiedMatchApi.decision(
        verifiedSession.id, verifiedSession.version, chosen.id,
      );
      verifiedSession.version = decision.version;
      ug = decision.userScore;
      rg = decision.opponentScore;
      authoritativeScore = { user: ug, rival: rg };
      setUGoals(ug); setRGoals(rg);
      addLog(decision.result.narrative, decision.result.goalFor === 'user' ? 'goal' : 'event');
    } else if (verifiedSession && resumedTurnIndex > 0) {
      addLog(`↩️ Partido recuperado desde el turno ${resumedTurnIndex}.`, 'event');
    }
    for (let t = resumedTurnIndex + 1; t <= totalTurns; t++) {
      const min = Math.round((t / totalTurns) * 40);
      setMinute(min);
      await delay(TURN_MS);

      const serverTurn = verifiedSession
        ? await verifiedMatchApi.turn(verifiedSession.id, verifiedSession.version)
        : null;
      if (serverTurn && verifiedSession) {
        verifiedSession.version = serverTurn.version;
        authoritativeScore = { user: serverTurn.userScore, rival: serverTurn.opponentScore };
      }
      const turn = serverTurn?.turn ?? generateTurn(deckCards, min, adv, bot.name);

      // FASE USUARIO
      {
        const up = turn.userPhase;
        for (const ev of up.events) {
          addLog(ev.text, ev.type === 'good' ? 'good' : ev.type === 'bad' ? 'bad' : 'neutral');
          if (ev.zone === 'user_left_wing')       moveBall(60, 18, 'user');
          else if (ev.zone === 'user_right_wing') moveBall(60, 82, 'user');
          else if (ev.zone === 'user_attack')     moveBall(72, 50, 'user');
          else                                    moveBall(50, 50, 'user');
          applyUFormation('attack'); applyRFormation('defense');
          await delay(TURN_MS);
        }

        if (up.moment) {
          const ctx = up.moment;
          const pIdx = Math.max(0, deckCards.indexOf(ctx.mainCard));
          await animateBuildUp(pIdx);

          const chosen = await waitForDecision(ctx);
          await delay(200);

          const serverDecision = verifiedSession
            ? await verifiedMatchApi.decision(verifiedSession.id, verifiedSession.version, chosen.id)
            : null;
          if (serverDecision && verifiedSession) {
            verifiedSession.version = serverDecision.version;
            authoritativeScore = { user: serverDecision.userScore, rival: serverDecision.opponentScore };
          }
          const res = serverDecision?.result ?? resolveDecision(chosen, ctx.mainCard, ctx.type, min);
          addLog(res.narrative, res.goalFor === 'user' ? 'goal' : res.success ? 'good' : 'neutral');

          if (res.goalFor === 'user') {
            await animateGoalUser();
            animeRef.current?.triggerGoal('user');   // ← agregar
            ug++; setUGoals(ug);
            addLog(`  Marcador: ${ug} – ${rg}`, 'good');
            showFlash('⚽ ¡GOOOOL!', 'goal', 50, 38);
            await delay(GOAL_MS);
          } else if (res.goalFor === 'rival') {
            await animateGoalRival();
            animeRef.current?.triggerGoal('rival');  // ← agregar
            rg++; setRGoals(rg);
            addLog(`  Marcador: ${ug} – ${rg}`, 'bad');
            showFlash(`⚽ ${bot.name}`, 'bad', 50, 38);
            await delay(GOAL_MS);
          } else {
            showFlash(res.success ? '✨ ¡Buena jugada!' : '😤 ¡Qué cerca!', res.success ? 'ok' : 'miss', 75, 50);
            await delay(600);
          }
        } else {
          addLog(up.narrative, 'neutral');
          await delay(400);
        }

        setUHL(null); setRHL(null);
        await backToMidfield();
        await delay(300);
      }

      // FASE RIVAL
      {
        const rp = turn.rivalPhase;
        for (const ev of rp.events) {
          addLog(ev.text, ev.type === 'good' ? 'good' : ev.type === 'bad' ? 'bad' : 'neutral');
          if (ev.zone === 'rival_attack')      moveBall(30, 50, 'rival');
          else if (ev.zone === 'user_defense') moveBall(22, 52, 'rival');
          else                                 moveBall(50, 50, 'rival');
          applyUFormation('defense'); applyRFormation('attack');
          await delay(TURN_MS);
        }

        if (rp.autoGoal === 'rival') {
          await animateRivalBuild();
          animeRef.current?.triggerDanger();
          await delay(300);
          await animateGoalRival();
          rg++; setRGoals(rg);
          addLog(`💔 ¡${bot.name} convierte! Qué golpe.`, 'bad');
          addLog(`  Marcador: ${ug} – ${rg}`, 'bad');
          showFlash(`⚽ GOL ${bot.name.toUpperCase()}`, 'bad', 50, 38);
          await delay(GOAL_MS);
        } else if (rp.narrative) {
          addLog(rp.narrative, 'good');
          await animateRivalBuild();
          await animateSave();
        }

        setUHL(null); setRHL(null);
        await backToMidfield();
        await delay(300);
      }
      // Animations are cosmetic: the server is the source of truth for scores.
      if (verifiedSession && authoritativeScore) {
        ug = authoritativeScore.user;
        rg = authoritativeScore.rival;
        setUGoals(ug);
        setRGoals(rg);
      }
    }

    addLog('📯 ¡Silbato final! Terminó el partido.', 'event');
    setMinute(40); setBallVis(false);
    await delay(600);
    if (verifiedSession) {
      // The verified endpoint must confirm completion before displaying rewards.
      // It currently fails closed until the server transcript is fully validated.
      try {
        const final = await verifiedMatchApi.finish(verifiedSession.id);
        window.localStorage.removeItem(recoveryKey);
        // The server has finalized the match and consumed equipped wear once.
        // Tell every inventory hook instance to reload the authoritative values.
        window.dispatchEvent(new CustomEvent('lupi:inventory-updated', {
          detail: { userId, source: 'verified-match-finalized' },
        }));
        if (typeof final.user_score === 'number' && typeof final.opponent_score === 'number') {
          ug = final.user_score;
          rg = final.opponent_score;
          setUGoals(ug); setRGoals(rg);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'El servidor no pudo validar el partido');
        setPhase('select');
        isRunning.current = false;
        return;
      }
    }
    await handleMatchEnd(ug, rg, deckCards, Boolean(verifiedSession));
    } catch (error) {
      console.error('Partido interrumpido:', error);
      alert(error instanceof Error ? error.message : 'No se pudo completar el partido');
      setPhase('select');
    } finally {
      isRunning.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, userDeck]);

  // ── Post-partido ──────────────────────────────────────────────────────────
  // Seguridad: el resultado de un partido simulado no es evidencia verificable.
  // No llamar a update_daily_progress desde el cliente.
  // Los desafíos diarios competitivos quedan pendientes de un validador del servidor.

  async function handleMatchEnd(ug: number, rg: number, deckCards: UserCard[], verified = false) {
    const won   = ug > rg;
    const tied  = ug === rg;

    const newStreak   = won ? Math.min(userStats.streak + 1, 10) : 0;
    const streakBonus = won ? newStreak * 5 : 0;

    let xpGained = 5;
    if (won)       xpGained = bot.xpBase + streakBonus;
    else if (tied) xpGained = Math.max(5, Math.floor(bot.xpBase / 2));
    else           xpGained = Math.max(5, Math.floor(bot.xpBase / 3));

    let upgradeGroup: SkillGroup = 'technique';
    let columnToUpdate = 'user_card_passing';

    if (won)       { upgradeGroup = 'attack';  columnToUpdate = 'user_card_finishing'; }
    else if (ug < rg) { upgradeGroup = 'defense'; columnToUpdate = 'user_card_defending'; }

    const skillInfo    = SKILL_GROUP_INFO[upgradeGroup];
    const skillUpgrade = { group: upgradeGroup, label: skillInfo.label, icon: skillInfo.icon, delta: 1 };

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

    // A verified result does not authorize browser-written card XP.
    // Verified rewards must be granted atomically by the server in a later step.
    if (verified) xpGained = 0;
    const leveledUpCards: string[] = [];
    const cardMap = new Map<string, UserCard>();
    for (const c of deckCards) {
      const { card, leveledUp } = verified
        ? { card: c, leveledUp: false }
        : addExperienceToCard(c, xpGained);
      if (leveledUp) leveledUpCards.push(getCardData(card).name);
      cardMap.set(card.id, card);
    }
    const updatedCards = Array.from(cardMap.values());

    try {
      for (const card of verified ? [] : updatedCards) {
        await supabase
          .from('user_cards')
          .update({ level: card.level, experience: card.experience })
          .eq('id', card.id);
      }

      // El trigger on_match_finished ya NO acredita XP/puntos/stats.
      // El partido se registra como resultado recreativo, no verificable.
      const { error: matchError } = verified
        ? { error: null }
        : await supabase.from('matches').insert({
        user_id: userId,
        user_deck_id: userDeck.id,
        user_score: ug,
        opponent_score: rg,
        winner_id: won ? userId : null,
        experience_gained: xpGained,
      });
      if (matchError) throw matchError;
      window.dispatchEvent(new CustomEvent('lupi:progression-updated', {
        detail: { userId, actionType: 'match_result' },
      }));
      onMatchRecorded?.();
      // Comunicar resultado antes de que onBattleComplete desmonte CardBattle.
      if (isCampaignMode) onCampaignMatchComplete?.(won, bot);

    } catch (err) {
      console.error('Error en persistencia:', err);
    }

    if (!verified) setUserStats(newStats);
    onBattleComplete(updatedCards);

    setMatchResult({
      winner:     won ? 'user' : (tied ? 'draw' : 'rival'),
      userScore:  ug,
      rivalScore: rg,
      xpGained,
      streakBonus: verified ? 0 : streakBonus,
      leveledUpCards,
      skillUpgrade,
      newStreak,
    });
    setPhase('result');
  }

  // ─── Manejar cierre del modal en modo campaña ───────────────────────────────
  
  const handleCloseResult = () => {
    setMatchResult(null);
    setPhase('select');
    onResultClosed?.();
    // El resultado ya fue comunicado al persistir el partido.
  };

  // ─── Iniciar batalla desde el selector (modo campaña o rápido) ──────────────
  
  const handleStartBattle = () => {
  setPhase('battle'); // Oculta el selector inmediatamente
  startBattle();
};

  // ─── Render ───────────────────────────────────────────────────────────────────

  const deckCards   = (userDeck.cards ?? []) as UserCard[];
  const teamStats   = calculateTeamStats(deckCards); // <-- Agrega esta línea
  const needsCards  = deckCards.length < 5;
  const timerColor  = timerPct > 50 ? '#3DFFA0' : timerPct > 25 ? '#FFD700' : '#FF6B6B';
  const flashColors = {
    goal: { bg:'rgba(255,215,0,0.95)', text:'#000' },
    miss: { bg:'rgba(255,100,60,0.88)', text:'#fff' },
    ok:   { bg:'rgba(61,255,160,0.88)', text:'#000' },
    bad:  { bg:'rgba(255,60,60,0.92)',  text:'#fff' },
  };
  
  // Determinar si mostrar el selector de rivales
  const showRivalSelector = phase === 'select' && !isCampaignMode;
  
  // Determinar el texto del botón de inicio
  const getStartButtonText = () => {
    if (needsCards) return '📦 AGREGAR JUGADORES';
    if (isCampaignMode) return `▶ JUGAR PARTIDO (vs ${bot.name.replace('Bot ', '')})`;
    return `▶ JUGAR VS ${bot.name.toUpperCase()}`;
  };
  
  // Determinar la acción del botón de inicio
  const getStartButtonAction = () => {
    if (needsCards && onNavigateToDeck) return onNavigateToDeck;
    return handleStartBattle;
  };

  if (phase === 'select' && !autoStart) {
    return <MatchTutorial cards={deckCards} opponent={bot.name} onTeam={onNavigateToDeck} onStart={handleStartBattle} />;
  }

  return (
    <div className="arena-container">

      {/* ── Header ── */}
      

      {/* ════════════════════════ CANCHA ════════════════════════ */}
      <div className="arena-match-core">
        <AnimeEffects ref={animeRef} />
        <MatchCourt
          className={`futsal-court ${moment ? 'court-tension' : ''} ${flash?.type === 'goal' ? 'flash-futsal-gol' : ''}`}
          home={deckCards.slice(0,5).map(card => ({ id:card.id, name:getCardData(card).name ?? 'Jugador', rating:getCardData(card).overall_rating || 50 }))}
          away={[0,1,2,3,4].map(i => ({id:`bot-${i}`,name:bot.name.split(' ')[1] ?? bot.name,badge:`Nv.${bot.level}`,icon:'/images/bot.png'}))}
          homePositions={uPos} awayPositions={rPos} homeHighlight={uHL} awayHighlight={rHL}
          ball={ballVisible ? ball : null} ballTeam={ballTeam}
        >

          {/* Marcador integrado en el Centro de Partido; en móvil se ve en el encabezado. */}
          {phase === 'battle' && (
            <button type="button" className="mobile-relato-trigger" onClick={() => setShowFullLog(true)}
              aria-label={`Abrir relato del partido, ${log.length} eventos`}>
              <span className="mobile-relato-pulse" /> RELATO <strong>{log.length}</strong>
            </button>
          )}

          {/* Flash */}
          {flash && (
            <div className="court-flash" style={{
              left:`${flash.x}%`, top:`${flash.y}%`,
              background: flashColors[flash.type].bg,
              color:      flashColors[flash.type].text,
            }}>
              {flash.text}
            </div>
          )}

          {/* ── Panel de decisión ── */}
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
                      {Math.max(1, Math.ceil(Math.min(moment.timeLimit, 3) * timerPct / 100))}
                    </span>
                  </div>
                </div>

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

        </MatchCourt>

        {/* ════════════════════════ FASE SELECT ════════════════════════ */}
        {phase === 'select' && (
  <div className="rival-selector">

    {/* TARJETA DE ESTADÍSTICAS DEL EQUIPO - ARRIBA */}
    <div className="team-stats-card">
      <div className="team-stats-header">
        <span className="team-stats-icon">📊</span>
        <span className="team-stats-title">MI EQUIPO</span>
        <span className="team-stats-cards">{deckCards.length}/5 cartas</span>
      </div>
      
      <div className="team-stats-grid">
        <div className="team-stat">
          <div className="team-stat-value team-stat-overall">{teamStats.overall}</div>
          <div className="team-stat-label">OVR</div>
        </div>
        <div className="team-stat">
          <div className="team-stat-value" style={{ color: SKILL_GROUP_INFO.attack.color }}>
            {teamStats.attack}
          </div>
          <div className="team-stat-label">
            <span>{SKILL_GROUP_INFO.attack.icon}</span> ATAQUE
          </div>
        </div>
        <div className="team-stat">
          <div className="team-stat-value" style={{ color: SKILL_GROUP_INFO.defense.color }}>
            {teamStats.defense}
          </div>
          <div className="team-stat-label">
            <span>{SKILL_GROUP_INFO.defense.icon}</span> DEFENSA
          </div>
        </div>
        <div className="team-stat">
          <div className="team-stat-value" style={{ color: SKILL_GROUP_INFO.technique.color }}>
            {teamStats.technique}
          </div>
          <div className="team-stat-label">
            <span>{SKILL_GROUP_INFO.technique.icon}</span> TÉCNICA
          </div>
        </div>
      </div>
      
      {deckCards.length < 5 && (
        <div className="team-stats-warning">
          ⚠️ Necesitas {5 - deckCards.length} {5 - deckCards.length === 1 ? 'carta más' : 'cartas más'} para jugar
        </div>
      )}
    </div>

    <div className="rival-selector-title">
      {isCampaignMode ? '⚔️ PARTIDO DE CAMPAÑA' : '⚔️ ELEGIR RIVAL'}
    </div>
    
    {/* Selector de rivales - solo se muestra en modo rápido */}
    {showRivalSelector && (
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
    )}
    
    {/* En modo campaña, mostrar info del rival actual */}
    {isCampaignMode && forcedOpponent && (
      <div className="campaign-opponent-info">
        <div className="campaign-opponent-card" style={{ '--bc':forcedOpponent.color } as React.CSSProperties}>
          <span className="campaign-opponent-avatar">{forcedOpponent.avatar}</span>
          <div className="campaign-opponent-details">
            <div className="campaign-opponent-name">{forcedOpponent.name}</div>
            <div className="campaign-opponent-stats">
              <span>OVR {forcedOpponent.overall_rating}</span>
              <span>•</span>
              <span>Nv.{forcedOpponent.level}</span>
              <span>•</span>
              <span>+{forcedOpponent.xpBase} XP</span>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Botón de inicio */}
    <button 
      className="cta-btn start-btn" 
      onClick={getStartButtonAction()}
      disabled={needsCards}
      style={{ opacity: needsCards ? 0.6 : 1 }}
    >
      {getStartButtonText()}
    </button>
  </div>
)}

        {/* ════════════════════════ CENTRO DE PARTIDO ════════════════════════ */}
        {phase === 'battle' && showFullLog && <button type="button" className="mobile-relato-backdrop" aria-label="Cerrar relato" onClick={() => setShowFullLog(false)} />}
        {phase === 'battle' && (
          <aside className={`battle-log-strip${showFullLog ? ' mobile-relato-open' : ''}`} aria-label="Centro de partido">
            <div className="live-header">
              <div className="live-badge"><span className="live-dot" /> EN VIVO</div>
              <span className="match-center-minute">MIN {minute}' · FUTSAL</span>
              <button type="button" className="mobile-relato-close" onClick={() => setShowFullLog(false)} aria-label="Cerrar relato">✕</button>
            </div>

            <div className="match-center-score">
              <div className="match-center-team"><span>LOCAL</span><strong>{uGoals}</strong></div>
              <div className="match-center-divider">VS</div>
              <div className="match-center-team match-center-rival"><span>VISITANTE</span><strong>{rGoals}</strong></div>
            </div>

            <div className="match-center-possession">
              <div className="match-center-section-label">POSESIÓN ESTIMADA</div>
              <div className="match-center-pos-values"><span>VOS · {ballTeam === 'user' ? 58 : 42}%</span><span>{ballTeam === 'rival' ? 58 : 42}% · RIVAL</span></div>
              <div className="match-center-pos-track">
                <span style={{width: ballTeam === 'user' ? '58%' : '42%'}} />
              </div>
            </div>

            <div className="match-center-feed-title">
              <span><span className="match-center-feed-pulse" /> RELATO EN DIRECTO</span>
              <span>{log.length} EVENTOS</span>
            </div>
            <div className={`log-lines${showFullLog ? ' log-expanded' : ''}`} ref={logRef} aria-live="polite" aria-relevant="additions">
              {log.length === 0 && <div className="log-empty">⏳ El partido está por comenzar…</div>}
              {log.slice(showFullLog ? -25 : -2).map((l) => (
                <div key={l.id} className={`log-line log-${l.type}`}>
                  <span className="match-center-event-dot" />
                  <span>{l.type === 'goal' && '⚽ '}{l.text}</span>
                </div>
              ))}
            </div>
            {log.length > 2 && (
              <button type="button" className="log-toggle" onClick={() => setShowFullLog(v => !v)}>
                {showFullLog ? 'OCULTAR HISTORIAL' : `VER TODO EL RELATO (${log.length})`}
              </button>
            )}
            <div className="match-center-footer">⚡ CADA JUGADA CUENTA</div>
          </aside>
        )}

        {/* ════════════════════════ MODAL RESULTADO ════════════════════════ */}
        {phase === 'result' && matchResult && createPortal(
          <div className="result-modal-overlay" onClick={handleCloseResult}>
            <div
              className={`result-modal ${matchResult.winner === 'user' ? 'win' : matchResult.winner === 'draw' ? 'draw' : 'lose'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="rm-topline"><span className="rm-live-dot" /> LUPI WORLD <span>·</span> MATCH COMPLETE</div>
              <div className="rm-trophy" aria-hidden="true">{matchResult.winner === 'user' ? '🏆' : matchResult.winner === 'draw' ? '🤝' : '⚽'}</div>
              <div className="rm-title">
                {matchResult.winner === 'user'  && '¡VICTORIA!'}
                {matchResult.winner === 'draw'  && '¡EMPATE!'}
                {matchResult.winner === 'rival' && 'DERROTA'}
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

              <div className="rm-rewards-title"><span>RECOMPENSAS DEL PARTIDO</span></div>
              <div className="rm-rewards">
                <div className="rm-reward-box">
                  <div className="rm-reward-icon">✨</div>
                  <div className="rm-reward-val">+{matchResult.xpGained}</div>
                  <div className="rm-reward-lbl">XP</div>
                </div>
                <div className="rm-reward-box points-box">
                  <div className="rm-reward-icon">💰</div>
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

              {matchResult.skillUpgrade && (
                <div className="rm-skill-upgrade"
                  style={{ '--sc': SKILL_GROUP_INFO[matchResult.skillUpgrade.group].color } as React.CSSProperties}>
                  <div className="rm-skill-icon">{matchResult.skillUpgrade.icon}</div>
                  <div className="rm-skill-text">
                    <div className="rm-skill-label">SKILL {matchResult.skillUpgrade.label} +{matchResult.skillUpgrade.delta}</div>
                    <div className="rm-skill-desc">
                      {matchResult.winner === 'user'  && 'La victoria agudizó tu ataque.'}
                      {matchResult.winner === 'draw'  && 'El equilibrio del empate pulió tus habilidades.'}
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

              <button className="cta-btn start-btn rm-btn" onClick={handleCloseResult}>
                {isCampaignMode ? 'CONTINUAR' : 'JUGAR DE NUEVO'}
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* ════════════════════════ ESTILOS ADICIONALES ════════════════════════ */}
      <style>{`
        *{user-select:none;-webkit-tap-highlight-color:transparent;}

        /* ── FIX #1: removido width:10% que aplastaba el container ── */
        .arena-container {
          background: linear-gradient(150deg, #0a2a18, #06120c);
          border-radius: 28px;
          padding: 20px;
          margin: 16px 0;
          border: 1px solid rgba(61,255,160,0.25);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          width: 100%;
        }

        .arena-container::after {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: linear-gradient(45deg, rgba(61,255,160,0.2), transparent 30%, transparent 70%, rgba(61,255,160,0.2));
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

        /* Cancha */
        .futsal-court{
          position:relative;width:100%;height:340px;border-radius:16px;overflow:hidden;
          border:2px solid rgba(255,255,255,0.15);
          background:linear-gradient(135deg,rgba(30,200,120,0.08),rgba(0,0,0,0.2)),
                     url('/images/cancha.jpg') center/cover no-repeat,
                     linear-gradient(145deg,#0a2a18,#0a1510);
          margin-bottom:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);
          transition:box-shadow 0.5s ease,border-color 0.5s ease,filter 0.5s ease;
        }
        .futsal-court::before{
          content:'';position:absolute;inset:0;
          background-image:radial-gradient(circle at 10% 20%,rgba(0,0,0,0.05) 2%,transparent 2.5%);
          background-size:28px 28px;pointer-events:none;z-index:1;
        }
        .futsal-court::after{
          content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
          width:1.5px;height:100%;background:rgba(255,255,255,0.1);pointer-events:none;
        }

        /* Marcador */
        .court-scoreboard{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);border-radius:20px;padding:6px 14px;border:1px solid rgba(255,255,255,0.1);z-index:20;}
        .csb-side{display:flex;align-items:center;gap:6px;}
        .csb-right{flex-direction:row-reverse;}
        .csb-label{font-size:9px;letter-spacing:1px;color:rgba(255,255,255,0.45);}
        .csb-score{font-size:26px;font-weight:900;line-height:1;}
        .user-sc{color:#3dffa0;} .rival-sc{color:#ff7060;}
        .csb-center{text-align:center;min-width:56px;}
        .csb-min{font-size:9px;color:rgba(255,255,255,0.5);display:block;margin-bottom:3px;}
        .csb-prog{height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;}
        .csb-prog-fill{height:100%;background:#A78BFA;border-radius:2px;transition:width 1s ease;}

        /* Pelota */
        .ball-token{position:absolute;transform:translate(-50%,-50%);font-size:18px;z-index:15;pointer-events:none;transition:left 0.4s cubic-bezier(0.4,0,0.2,1),top 0.4s cubic-bezier(0.4,0,0.2,1);filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));}
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
        .player-token{width:58px;border-radius:12px;text-align:center;backdrop-filter:blur(4px);transition:all 0.2s cubic-bezier(0.34,1.2,0.64,1);position:relative;transform:translateY(0);cursor:pointer;}
        .player-token:hover{transform:translateY(-4px) scale(1.02);}
        .user-token{background:linear-gradient(145deg,rgba(30,200,120,0.28),rgba(20,150,90,0.2));border-bottom:3px solid #3dffa0;box-shadow:0 6px 14px rgba(61,255,160,0.2);}
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

        /* ── FIX #3: Battle log — CSS custom, sin Tailwind ── */
        .battle-log-strip{
          width:100%;
          background:rgba(5,10,20,0.92);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:14px;
          padding:10px 12px;
          margin-bottom:12px;
          box-sizing:border-box;
        }
        .live-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:8px;
          padding-bottom:8px;
          border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .live-badge{
          display:flex;align-items:center;gap:5px;
          background:rgba(239,68,68,0.15);
          border:1px solid rgba(239,68,68,0.3);
          color:#f87171;
          font-size:10px;font-weight:700;
          padding:3px 8px;border-radius:6px;
          letter-spacing:0.5px;
          animation:pulse 2s ease infinite;
        }
        .live-dot{
          width:6px;height:6px;border-radius:50%;
          background:#ef4444;display:inline-block;flex-shrink:0;
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .possession-bar{
          display:flex;width:130px;height:14px;
          border-radius:4px;overflow:hidden;
          border:1px solid rgba(255,255,255,0.08);
          flex-shrink:0;
        }
        .pos-fill{
          font-size:9px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          transition:width 0.5s cubic-bezier(0.4,0,0.2,1);
          overflow:hidden;
        }
        .pos-user{background:#3dffa0;color:#061208;}
        .pos-rival{background:rgba(255,110,60,0.7);color:#fff;}
        .log-lines{
          display:flex;flex-direction:column;
          gap:5px;
          max-height:130px;
          overflow-y:auto;
          scrollbar-width:none;
        }
        .log-lines::-webkit-scrollbar{display:none;}
        .log-line{
          font-size:11px;
          padding:5px 8px;
          border-radius:0 6px 6px 0;
          border-left:2px solid;
          line-height:1.45;
          word-break:break-word;
          animation:ls 0.2s ease;
        }
        @keyframes ls{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}
        .log-neutral{color:rgba(255,255,255,0.6);border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.03);}
        .log-good   {color:#3dffa0;border-color:#3dffa0;background:rgba(61,255,160,0.06);}
        .log-bad    {color:#ff7060;border-color:#ff7060;background:rgba(255,112,96,0.06);}
        .log-goal   {color:#ffd700;font-weight:700;border-color:#ffd700;background:rgba(255,215,0,0.08);}
        .log-event  {color:#a78bfa;border-color:#a78bfa;background:rgba(167,139,250,0.06);}
        .log-empty  {font-size:11px;color:rgba(255,255,255,0.3);text-align:center;padding:12px 0;font-style:italic;}

        /* Selector rival */
        .rival-selector{margin-bottom:14px;background:rgba(0,0,0,0.3);border-radius:18px;padding:14px 16px 16px;border:1px solid rgba(255,100,50,0.2);}
        .rival-selector-title{font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,0.35);text-align:center;margin-bottom:10px;}
        .rival-selector-row{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;}
        .bot-card{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px;border-radius:14px;border:1.5px solid rgba(255,100,50,0.3);background:rgba(255,100,50,0.06);cursor:pointer;color:#fff;transition:all 0.18s;}
        .bot-card:hover{background:rgba(255,100,50,0.14);border-color:rgba(255,100,50,0.65);transform:translateY(-3px);}
        .bot-card.selected{background:rgba(255,100,50,0.2);border-color:var(--bc,#ff7040);box-shadow:0 0 12px rgba(255,100,50,0.25);}
        .bot-avatar{font-size:20px;} .bot-name{font-size:11px;font-weight:bold;}
        .bot-ovr{font-size:9px;color:#ff9060;} .bot-exp{font-size:9px;color:#3dffa0;}

        /* Estilos para modo campaña */
        .campaign-opponent-info{margin-bottom:16px;}
        .campaign-opponent-card{display:flex;align-items:center;gap:14px;padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(255,100,50,0.12),rgba(255,100,50,0.05));border:2px solid var(--bc,#ff7040);margin-bottom:12px;}
        .campaign-opponent-avatar{font-size:42px;}
        .campaign-opponent-details{flex:1;}
        .campaign-opponent-name{font-size:16px;font-weight:bold;color:#fff;margin-bottom:4px;}
        .campaign-opponent-stats{display:flex;gap:8px;font-size:11px;color:rgba(255,255,255,0.6);}
        .campaign-opponent-stats span{color:#ff9060;}

        .cta-btn{width:100%;padding:13px;border-radius:40px;border:none;font-weight:bold;font-size:13px;cursor:pointer;transition:all 0.2s;}
        .cta-btn:hover{transform:translateY(-2px);opacity:0.92;}
        .start-btn{background:linear-gradient(90deg,#ff4d6d,#ff7040);color:#fff;}
        .deck-btn{background:rgba(61,255,160,0.1);border:1px solid #3dffa0!important;color:#3dffa0;}

        /* Modal resultado */
        .result-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,24px);box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;animation:fi 0.25s ease;}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        .result-modal{background:linear-gradient(145deg,#0e1a10,#0a1208);border-radius:24px;padding:28px 24px;max-width:380px;width:100%;border:1px solid rgba(255,255,255,0.1);animation:mp 0.35s cubic-bezier(0.34,1.2,0.64,1);box-shadow:0 20px 60px rgba(0,0,0,0.6);max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;margin:auto;box-sizing:border-box;}
        @keyframes mp{from{transform:scale(0.88) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        .result-modal.win {border-color:rgba(61,255,160,0.3);}
        .result-modal.lose{border-color:rgba(255,100,60,0.3);}
        .result-modal.draw{border-color:#ffca28;}
        .rm-title{font-size:24px;font-weight:900;text-align:center;margin-bottom:16px;}
        .result-modal.win  .rm-title{color:#3dffa0;}
        .result-modal.lose .rm-title{color:#ff7060;}
        .result-modal.draw .rm-title{color:#ffca28;}
        .rm-score{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px;}
        .rm-score-side{text-align:center;}
        .rm-score-label{font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:1px;margin-bottom:4px;}
        .rm-score-num{font-size:52px;font-weight:900;line-height:1;}
        .user-color{color:#3dffa0;} .rival-color{color:#ff7060;}
        .rm-score-sep{font-size:28px;color:rgba(255,255,255,0.2);font-weight:200;}
        .rm-rewards-title{font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:10px;}
        .rm-rewards{display:flex;gap:10px;margin-bottom:14px;justify-content:center;flex-wrap:wrap;}
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

        /* Tensión cancha */
        .futsal-court.court-tension{
          border-color:#ffae00!important;
          animation:courtPulseAlerta 2s infinite ease-in-out;
        }
        .futsal-court.court-tension .player-token:not(.token-active){
          filter:grayscale(0.3) brightness(0.7);transition:filter 0.5s ease;
        }
        @keyframes courtPulseAlerta{
          0%  {border-color:rgba(255,174,0,0.4);box-shadow:inset 0 0 60px rgba(0,0,0,0.85);}
          50% {border-color:rgba(255,174,0,0.8);box-shadow:inset 0 0 100px rgba(0,0,0,0.9),0 0 20px rgba(255,174,0,0.3);}
          100%{border-color:rgba(255,174,0,0.4);box-shadow:inset 0 0 60px rgba(0,0,0,0.85);}
        }
        .flash-futsal-gol{animation:flashFocos 0.4s ease-out;}
        @keyframes flashFocos{0%{filter:brightness(1)}30%{filter:brightness(1.8)}100%{filter:brightness(1)}}

        /* Desktop grid */
        @media(min-width:901px){
          .arena-match-core{
            display:grid;
            grid-template-columns:1.62fr 1fr;
            gap:20px;
            align-items:stretch;
          }
          .battle-log-strip{height:100%;box-sizing:border-box;}
          .log-lines{max-height:320px;overflow-y:auto;}
        }

        /* ── FIX #2: scoreboard corregido en mobile ── */
        @media(max-width:640px){
          .futsal-court{height:280px;}
          .court-scoreboard{top:8px;padding:4px 10px;}
          .csb-score{font-size:20px;}
          .rival-selector-row{flex-direction:column;}
          .result-modal{padding:20px 16px;}
          .campaign-opponent-card{padding:10px;}
          .campaign-opponent-avatar{font-size:32px;}
        }
          .team-stats-card {
  background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(20,40,20,0.4));
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid rgba(61,255,160,0.3);
  backdrop-filter: blur(4px);
}

.team-stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.team-stats-icon {
  font-size: 20px;
}

.team-stats-title {
  font-size: 13px;
  font-weight: bold;
  color: #3dffa0;
  letter-spacing: 1px;
}

.team-stats-cards {
  font-size: 10px;
  color: rgba(255,255,255,0.5);
  background: rgba(0,0,0,0.5);
  padding: 2px 8px;
  border-radius: 12px;
}

.team-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.team-stat {
  text-align: center;
  padding: 8px 4px;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.team-stat:hover {
  transform: translateY(-2px);
  background: rgba(0,0,0,0.5);
}

.team-stat-value {
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  margin-bottom: 4px;
}

.team-stat-overall {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255,215,0,0.3);
}

.team-stat-label {
  font-size: 8px;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.team-stat-label span {
  font-size: 10px;
}

.team-stats-warning {
  margin-top: 8px;
  padding: 6px;
  background: rgba(255,100,60,0.15);
  border: 1px solid rgba(255,100,60,0.3);
  border-radius: 8px;
  font-size: 10px;
  color: #ff9060;
  text-align: center;
}

/* Ajustes responsive */
@media(max-width: 640px) {
  .team-stat-value {
    font-size: 16px;
  }
  
  .team-stat-label {
    font-size: 7px;
  }
  
  .team-stats-grid {
    gap: 6px;
  }
  
  .team-stat {
    padding: 6px 2px;
  }
}

        /* LUPI Arena v7: legibilidad, controles táctiles y relato compacto */
        .arena-container .log-toggle {
          display:block; width:100%; margin-top:6px; padding:5px 8px;
          color:#3dffa0; background:rgba(61,255,160,.06);
          border:1px solid rgba(61,255,160,.18); border-radius:7px;
          font-size:10px; font-weight:800; letter-spacing:.6px; cursor:pointer;
        }
        .arena-container .log-lines.log-expanded { max-height: min(34vh, 250px); overflow-y:auto; }
        .arena-container .dp-option { min-height:44px; touch-action:manipulation; }
        .arena-container .court-scoreboard { white-space:nowrap; }
        @media (max-width: 640px) {
          .arena-container .player-token { width:clamp(38px, 10.4vw, 48px); border-radius:8px; }
          .arena-container .token-icon { min-height:23px; padding:2px; margin:2px 3px 0; }
          .arena-container .token-icon img { width:19px!important; height:19px!important; }
          .arena-container .token-name { font-size:8px; max-width:calc(100% - 2px); padding:2px 1px; }
          .arena-container .token-overall { font-size:11px; padding:2px 5px; }
          .arena-container .token-level { font-size:9px; }
          .arena-container .pos-label { font-size:8px; padding:1px 4px; }
          .arena-container .court-scoreboard { top:5px; gap:7px; padding:5px 11px; }
          .arena-container .csb-score { font-size:24px; }
          .arena-container .csb-label { font-size:9px; }
          .arena-container .csb-min { font-size:10px; }
          .arena-container .log-lines:not(.log-expanded) { max-height:83px; overflow:hidden; }
          .arena-container .log-line { font-size:11px; padding:4px 7px; }
          .arena-container .decision-panel { width:calc(100% - 18px); max-width:370px; padding:12px; max-height:calc(100% - 14px); overflow-y:auto; }
          .arena-container .dp-option { min-height:46px; padding:8px 10px; }
          .arena-container .dp-opt-label { white-space:normal; }
          .arena-container .dp-opt-group { font-size:8px; }
        }
        @media (max-width: 390px) {
          .arena-container .player-token { width:36px; }
          .arena-container .token-name { font-size:7px; }
          .arena-container .token-overall { font-size:10px; }
          .arena-container .pos-label { font-size:7px; }
        }

        /* LUPI MATCH CENTER V2 — panel completo, sin espacio muerto */
        .arena-match-core { min-width:0; }
        .arena-match-core > .battle-log-strip {
          min-width:0; display:flex; flex-direction:column; gap:0;
          background:linear-gradient(165deg,#101d2b 0%,#07121c 58%,#07150f 100%);
          border:1px solid rgba(57,229,208,.23); padding:16px;
          border-radius:16px; box-shadow:inset 0 1px rgba(255,255,255,.05);
        }
        .battle-log-strip .live-header {margin-bottom:14px; padding-bottom:12px;}
        .match-center-minute {font-size:11px; font-weight:900; letter-spacing:1px; color:#90b8bd;}
        .match-center-score {display:grid;grid-template-columns:1fr 40px 1fr;align-items:center;gap:5px;margin-bottom:14px;padding:13px 10px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.07);border-radius:12px;}
        .match-center-team {display:flex;flex-direction:column;align-items:center;gap:4px;}
        .match-center-team span {font-size:10px;letter-spacing:1.2px;font-weight:900;color:#85b6ae;}
        .match-center-team strong {font-size:clamp(28px,3vw,42px);line-height:1;font-weight:1000;color:#3dffa0;font-variant-numeric:tabular-nums;}
        .match-center-rival strong {color:#ff805e;}
        .match-center-divider {font-size:11px;text-align:center;font-weight:900;color:#66848b;}
        .match-center-possession {padding:0 2px 15px;border-bottom:1px solid rgba(255,255,255,.08);}
        .match-center-section-label {font-size:10px;letter-spacing:1.2px;font-weight:900;color:#8aadb5;margin-bottom:9px;}
        .match-center-pos-values {display:flex;justify-content:space-between;font-size:11px;font-weight:900;color:#c3ebdf;margin-bottom:7px;}
        .match-center-pos-track {height:8px;background:linear-gradient(90deg,#ff805e,#b54836);border-radius:10px;overflow:hidden;}
        .match-center-pos-track span {display:block;height:100%;background:linear-gradient(90deg,#29e6ce,#3dffa0);border-radius:10px;transition:width .5s ease;}
        .match-center-feed-title {display:flex;justify-content:space-between;gap:8px;align-items:center;padding:17px 0 12px;font-size:10px;letter-spacing:.8px;font-weight:900;color:#d5f9ef;}
        .match-center-feed-title > span:first-child {display:flex;align-items:center;gap:7px;}
        .match-center-feed-title > span:last-child {color:#7b9da6;font-size:9px;white-space:nowrap;}
        .match-center-feed-pulse {width:7px;height:7px;background:#35f4bd;box-shadow:0 0 10px #35f4bd;border-radius:50%;}
        .arena-container .battle-log-strip .log-lines {display:flex;flex-direction:column;gap:7px;flex:1;min-height:180px;max-height:none;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#22544e transparent;padding-right:3px;}
        .arena-container .battle-log-strip .log-line {display:flex;gap:9px;align-items:flex-start;padding:10px 11px;border-radius:9px;font-size:clamp(12px,1.1vw,14px);line-height:1.45;font-weight:600;}
        .match-center-event-dot {width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85;flex:none;margin-top:6px;}
        .match-center-footer {padding-top:13px;margin-top:12px;border-top:1px solid rgba(255,255,255,.07);font-size:10px;letter-spacing:1.5px;text-align:center;font-weight:900;color:#6f9b9b;}
        .arena-container .battle-log-strip .log-toggle {font-size:11px;padding:10px;margin-top:10px;}
        @media(min-width:901px) {
          .arena-match-core {grid-template-columns:minmax(0,1.85fr) minmax(285px,.75fr);gap:12px;align-items:stretch;}
          .arena-match-core > .battle-log-strip {height:100%;max-height:100%;margin:0;}
          .arena-container .battle-log-strip .log-lines {min-height:0;max-height:none;}
        }
        @media(max-width:900px) {
          .arena-match-core > .battle-log-strip {margin-top:12px;}
          .arena-container .battle-log-strip .log-lines {min-height:140px;max-height:330px;flex:none;}
        }
        @media(max-width:640px) {
          .arena-match-core > .battle-log-strip {padding:12px;}
          .arena-container .battle-log-strip .log-lines:not(.log-expanded) {max-height:240px;overflow-y:auto;}
          .arena-container .battle-log-strip .log-lines.log-expanded {max-height:440px;overflow-y:auto;}
          .arena-container .battle-log-strip .log-line {font-size:12px;padding:9px;}
        }


        /* LUPI MATCH CENTER V4 — marcador único y relato móvil accesible */
        .mobile-arena-score,.mobile-relato-trigger,.mobile-relato-close,.mobile-relato-backdrop{display:none;}
        .arena-container .battle-log-strip .log-lines {scroll-behavior:smooth;}
        @media(max-width:900px){
          .arena-container .arena-title {display:flex;align-items:center;flex-wrap:wrap;gap:7px;}
          .mobile-arena-score{display:inline-flex;align-items:center;gap:6px;margin-left:auto;padding:5px 8px;border:1px solid rgba(44,230,219,.35);border-radius:8px;background:rgba(4,17,26,.92);font-variant-numeric:tabular-nums;}
          .mobile-arena-score b{font-size:16px;line-height:1;color:#44f1c6;}
          .mobile-arena-score b:nth-of-type(2){color:#ff806c;}
          .mobile-arena-score i{font-style:normal;color:#6c9da6;}
          .mobile-arena-score small{font-size:9px;color:#9ac6c9;white-space:nowrap;}
          .mobile-relato-trigger{display:flex;align-items:center;gap:7px;position:absolute;bottom:12px;right:12px;z-index:24;border:1px solid rgba(63,240,221,.75);border-radius:12px;background:rgba(3,19,29,.94);color:#b9fff4;padding:10px 12px;font-size:11px;letter-spacing:1px;font-weight:900;box-shadow:0 0 18px rgba(28,215,208,.22);cursor:pointer;}
          .mobile-relato-trigger strong{border-radius:7px;background:#21dcca;color:#03151a;padding:2px 6px;}
          .mobile-relato-pulse{width:7px;height:7px;background:#25f5d2;border-radius:50%;box-shadow:0 0 8px #25f5d2;}
          .arena-match-core > .battle-log-strip{display:none!important;}
          .mobile-relato-backdrop{display:block;position:fixed;inset:0;z-index:2147482000;background:rgba(0,8,13,.72);border:0;backdrop-filter:blur(5px);}
          .arena-match-core > .battle-log-strip.mobile-relato-open{display:flex!important;position:fixed;bottom:0;left:0;right:0;z-index:2147482001;width:100%;max-width:650px;height:auto;max-height:min(76dvh,720px);margin:0 auto!important;border-radius:20px 20px 0 0;padding:18px!important;box-sizing:border-box;overflow:hidden;box-shadow:0 -24px 80px rgba(0,0,0,.7);animation:lupiSheetUp .28s ease-out;}
          .arena-match-core > .battle-log-strip.mobile-relato-open .log-lines{flex:1;min-height:80px;max-height:45dvh;overflow-y:auto;}
          .mobile-relato-close{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#c7f7f2;font-size:16px;cursor:pointer;margin-left:auto;}
          .arena-match-core > .battle-log-strip.mobile-relato-open .live-header{display:flex;align-items:center;gap:12px;}
          .arena-match-core > .battle-log-strip.mobile-relato-open .match-center-minute{margin-left:auto;}
          @keyframes lupiSheetUp{from{transform:translateY(45px);opacity:0}to{transform:translateY(0);opacity:1}}
        }
        /* LUPI MOBILE MATCH CENTER V5: resultado grande debajo de la cancha.
           El historial vive dentro del panel; no hay boton flotante sin contenido. */
        @media(max-width:900px){
          .arena-container .mobile-arena-score,
          .arena-container .mobile-relato-trigger{display:none!important;}
          .arena-container .arena-match-core{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;}
          .arena-container .arena-match-core > .battle-log-strip,
          .arena-container .arena-match-core > .battle-log-strip.mobile-relato-open{
            display:flex!important;position:relative!important;inset:auto!important;
            width:100%!important;max-width:none!important;height:auto!important;
            max-height:none!important;margin:0!important;padding:15px!important;
            border-radius:15px!important;transform:none!important;animation:none!important;
            box-shadow:none!important;overflow:visible!important;
          }
          .arena-container .battle-log-strip .match-center-score{display:flex!important;}
          .arena-container .battle-log-strip .match-center-score strong{font-size:clamp(32px,10vw,48px)!important;}
          .arena-container .battle-log-strip .log-lines{min-height:0!important;max-height:190px!important;overflow-y:auto!important;flex:none!important;}
          .arena-container .battle-log-strip .log-lines.log-expanded{max-height:360px!important;}
          .arena-container .battle-log-strip .log-toggle{display:block!important;}
          .arena-container .mobile-relato-backdrop,
          .arena-container .mobile-relato-close{display:none!important;}
        }
        /* LUPI MOBILE MATCH CENTER V6: panel debajo de la cancha, sin cortes.
           El relato siempre muestra dos eventos; el botón expande el historial. */
        @media (max-width:900px) {
          .arena-container .arena-match-core {
            display:flex!important; flex-direction:column!important;
            height:auto!important; min-height:0!important; max-height:none!important;
            overflow:visible!important; gap:8px!important;
          }
          .arena-container .arena-match-core > .futsal-court {
            flex:none!important; margin-bottom:0!important;
          }
          .arena-container .arena-match-core > .battle-log-strip {
            position:relative!important; display:flex!important; flex:none!important;
            width:100%!important; height:auto!important; min-height:0!important;
            max-height:none!important; overflow:visible!important;
            margin:0!important; padding:12px!important;
            border:1px solid rgba(45,225,210,.45)!important;
            border-radius:14px!important;
            background:linear-gradient(160deg,#102333,#06141c)!important;
          }
          .arena-container .battle-log-strip .live-header {margin-bottom:8px!important;padding-bottom:7px!important;}
          .arena-container .battle-log-strip .match-center-score {
            width:100%!important; display:grid!important;
            grid-template-columns:minmax(0,1fr) 36px minmax(0,1fr)!important;
            align-items:center!important; justify-items:stretch!important;
            margin:0 auto 8px!important; padding:10px 12px!important;
          }
          .arena-container .battle-log-strip .match-center-team {align-items:center!important; text-align:center!important;}
          .arena-container .battle-log-strip .match-center-score strong {font-size:clamp(34px,11vw,48px)!important;}
          .arena-container .battle-log-strip .match-center-possession,
          .arena-container .battle-log-strip .match-center-footer {display:none!important;}
          .arena-container .battle-log-strip .match-center-feed-title {padding:7px 0!important;}
          .arena-container .battle-log-strip .log-lines:not(.log-expanded) {
            display:flex!important; flex-direction:column!important;
            flex:none!important; min-height:0!important; max-height:none!important;
            height:auto!important; overflow:visible!important; gap:5px!important;
          }
          .arena-container .battle-log-strip .log-lines.log-expanded {
            display:flex!important; flex:none!important; min-height:0!important;
            max-height:260px!important; height:auto!important; overflow-y:auto!important;
          }
          .arena-container .battle-log-strip .log-line {
            font-size:12px!important; line-height:1.35!important; padding:8px 10px!important;
          }
          .arena-container .battle-log-strip .log-toggle {
            display:block!important; width:100%!important; margin-top:8px!important;
            padding:10px!important; border:1px solid rgba(45,225,210,.35)!important;
            color:#62f8e6!important; background:rgba(10,56,65,.55)!important;
            border-radius:9px!important; cursor:pointer!important;
          }
        }
        /* Cinematic AAA results: Lupi cyan/teal + deep navy, not the old black/amber box */
        .result-modal-overlay{background:radial-gradient(ellipse at 50% 35%,rgba(0,66,72,.36),rgba(0,5,12,.94) 68%);backdrop-filter:blur(13px);}
        .result-modal{position:relative;isolation:isolate;max-width:460px;padding:30px 28px 26px;background:linear-gradient(153deg,#102c3c 0%,#071b2c 44%,#04101c 100%);border:1px solid rgba(69,241,227,.47)!important;border-radius:24px;box-shadow:0 0 0 1px rgba(12,211,220,.12),0 0 75px rgba(0,227,209,.15),0 35px 95px rgba(0,0,0,.78);color:#f4ffff;}
        .result-modal::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(130deg,rgba(82,249,235,.13),transparent 30%,transparent 75%,rgba(0,167,195,.08));z-index:-1;}
        .result-modal::after{content:'';position:absolute;top:0;left:16%;right:16%;height:2px;background:linear-gradient(90deg,transparent,#4bf7e7,transparent);box-shadow:0 0 22px #39f1e4;}
        .rm-topline{display:flex;justify-content:center;align-items:center;gap:8px;font-size:10px;letter-spacing:2.5px;font-weight:900;color:#85cfd4;margin:2px 0 14px;}
        .rm-live-dot{width:6px;height:6px;background:#38e8d5;border-radius:50%;box-shadow:0 0 12px #38e8d5;}
        .rm-trophy{text-align:center;font-size:47px;line-height:1.15;margin:0 auto 5px;filter:drop-shadow(0 0 18px rgba(55,240,217,.45));animation:rmTrophy .65s cubic-bezier(.2,1.4,.4,1) both;}
        @keyframes rmTrophy{from{transform:translateY(15px) scale(.6);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        .rm-title{font-size:clamp(29px,5vw,38px);line-height:1.08;letter-spacing:1.3px;margin-bottom:19px;text-shadow:0 0 28px rgba(47,239,218,.23);}
        .result-modal.win .rm-title{color:#43f7c7;}.result-modal.draw .rm-title{color:#56e9f4;}.result-modal.lose .rm-title{color:#b7d5f2;}
        .rm-score{padding:16px 12px;margin-bottom:22px;background:linear-gradient(100deg,rgba(31,221,195,.09),rgba(8,20,38,.55),rgba(34,148,196,.08));border:1px solid rgba(82,221,221,.18);border-radius:16px;gap:24px;}
        .rm-score-side{min-width:76px;}.rm-score-label{font-size:11px;font-weight:800;color:#a6c8d2;letter-spacing:1.2px;}.rm-score-num{font-size:clamp(48px,9vw,65px);}.user-color{color:#42f4c5;}.rival-color{color:#ff8777;}
        .rm-rewards-title{display:flex;align-items:center;gap:12px;font-size:10px;color:#81cbd4;letter-spacing:1.8px;font-weight:900;margin-bottom:13px;}
        .rm-rewards-title::before,.rm-rewards-title::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(62,229,219,.3));}.rm-rewards-title::after{transform:rotate(180deg);}
        .rm-rewards{display:grid;grid-template-columns:repeat(auto-fit,minmax(85px,1fr));gap:10px;margin-bottom:18px;}
        .rm-reward-box{min-width:0;position:relative;overflow:hidden;border-radius:15px;padding:16px 9px;background:linear-gradient(165deg,rgba(30,105,120,.33),rgba(4,20,35,.7));border:1px solid rgba(65,221,222,.27);box-shadow:inset 0 1px rgba(255,255,255,.07);animation:rmRewardIn .5s ease both;}
        .rm-reward-box:nth-child(2){animation-delay:.12s;}.rm-reward-box:nth-child(3){animation-delay:.24s;}
        @keyframes rmRewardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .rm-reward-icon{font-size:25px;filter:drop-shadow(0 0 10px rgba(60,235,226,.35));}.rm-reward-val{font-size:27px;color:#ecffff;}.rm-reward-lbl{font-size:11px;color:#91c5cd;font-weight:700;}
        .rm-reward-box.streak-box{background:linear-gradient(165deg,rgba(218,126,39,.16),rgba(6,26,38,.7));border-color:rgba(255,191,94,.42);}
        .rm-skill-upgrade{background:linear-gradient(95deg,rgba(14,53,65,.86),rgba(7,23,36,.9));border-color:color-mix(in srgb,var(--sc,#41e4db) 60%,transparent);box-shadow:inset 3px 0 var(--sc,#41e4db);}
        .rm-skill-label{font-size:13px;}.rm-skill-desc{color:#9bbac4;font-size:12px;line-height:1.35;}
        .rm-btn{width:100%;min-height:51px;border-radius:13px!important;background:linear-gradient(105deg,#50f2e3,#1cc6e4)!important;color:#03222c!important;font-size:13px;font-weight:1000;letter-spacing:1.4px;box-shadow:0 8px 30px rgba(28,214,216,.23);transition:filter .2s,transform .2s;}
        .rm-btn:hover{filter:brightness(1.1);transform:translateY(-2px);}
        @media(max-width:480px){.result-modal{padding:22px 17px 18px;max-width:390px;border-radius:20px;}.rm-topline{font-size:9px;letter-spacing:1.6px;}.rm-trophy{font-size:40px;}.rm-score{padding:12px 8px;margin-bottom:15px;}.rm-reward-box{padding:11px 6px;}.rm-reward-val{font-size:23px;}.rm-rewards{gap:7px;}.rm-title{margin-bottom:14px;}.rm-skill-upgrade{padding:11px 12px;}.rm-btn{min-height:48px;}}
        @media(prefers-reduced-motion:reduce){.rm-trophy,.rm-reward-box,.result-modal{animation:none!important;}}
      `}</style>
    </div>
  );
}
