// src/components/MatchSimulator.tsx
// Simulador de partido estilo PC Fútbol + decisiones estilo Supercampeones SNES

import { useState, useEffect, useRef, useCallback } from 'react';
import { UserCard } from '../types/cards';
import {
  generateTurn,
  resolveDecision,
  calculateTeamPower,
  addExperienceToCard,
  MomentContext,
  MomentResult,
  DecisionOption,
  TurnResult,
} from '../utils/battleEngine';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface MatchSimulatorProps {
  userCards: UserCard[];
  rivalName: string;
  rivalOvr: number;
  userOvr: number;
  onMatchEnd: (result: MatchEndResult) => void;
}

export interface MatchEndResult {
  winner: 'user' | 'rival';
  userGoals: number;
  rivalGoals: number;
  xpGained: number;
  updatedCards: UserCard[];
}

interface LogLine {
  id: number;
  text: string;
  type: 'neutral' | 'good' | 'bad' | 'event' | 'goal';
}

type MatchPhase = 'playing' | 'decision' | 'ended';

// ─── Constantes ────────────────────────────────────────────────────────────────

const TOTAL_TURNS = 10;         // turnos por partido
const TURN_DELAY_MS = 1200;     // ms entre turnos automáticos
const GOAL_PAUSE_MS = 1800;     // pausa extra después de un gol

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function getCardData(card: UserCard) {
  if (card.card) return card.card;
  if ((card as any).player) return (card as any).player;
  return { name: 'Jugador', overall_rating: 50, finishing: 50, pace: 50,
           dribbling: 50, passing: 50, defending: 50, physical: 50, position: 'ala' };
}

// ─── Componente ────────────────────────────────────────────────────────────────

export function MatchSimulator({
  userCards,
  rivalName,
  rivalOvr,
  userOvr,
  onMatchEnd,
}: MatchSimulatorProps) {
  const [phase, setPhase] = useState<MatchPhase>('playing');
  const [userGoals, setUserGoals] = useState(0);
  const [rivalGoals, setRivalGoals] = useState(0);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [currentMoment, setCurrentMoment] = useState<MomentContext | null>(null);
  const [timerPct, setTimerPct] = useState(100); // 0-100 para la barra
  const [decidedOption, setDecidedOption] = useState<string | null>(null); // feedback visual post-click
  const [lastGoalFlash, setLastGoalFlash] = useState<'user' | 'rival' | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  const decisionResolveRef = useRef<((opt: DecisionOption) => void) | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  // Scroll log automático
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  function addLog(text: string, type: LogLine['type'] = 'neutral') {
    logIdRef.current += 1;
    setLog(prev => [...prev, { id: logIdRef.current, text, type }]);
  }

  // ─── Timer de decisión ──────────────────────────────────────────────────────

  function startDecisionTimer(seconds: number, onTimeout: () => void) {
    setTimerPct(100);
    const step = 100;
    const intervalMs = (seconds * 1000) / step;
    let remaining = step;

    timerIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimerPct(Math.max(0, (remaining / step) * 100));
      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        onTimeout();
      }
    }, intervalMs);
  }

  function clearDecisionTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  // ─── Pedir decisión al usuario ──────────────────────────────────────────────

  function waitForDecision(moment: MomentContext): Promise<DecisionOption> {
    return new Promise(resolve => {
      decisionResolveRef.current = resolve;
      setCurrentMoment(moment);
      setDecidedOption(null);
      setPhase('decision');

      // Timeout → elegir opción segura
      const safeOption = moment.options.find(o => o.isSafe) ?? moment.options[moment.options.length - 1];
      startDecisionTimer(moment.timeLimit, () => {
        decisionResolveRef.current = null;
        setDecidedOption(safeOption.id);
        setTimeout(() => {
          setCurrentMoment(null);
          setPhase('playing');
          resolve(safeOption);
        }, 600);
      });
    });
  }

  function handleDecision(option: DecisionOption) {
    clearDecisionTimer();
    setDecidedOption(option.id);
    setTimeout(() => {
      if (decisionResolveRef.current) {
        decisionResolveRef.current(option);
        decisionResolveRef.current = null;
      }
      setCurrentMoment(null);
      setPhase('playing');
    }, 400);
  }

  // ─── Loop principal del partido ─────────────────────────────────────────────

  const runMatch = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const advantage = Math.max(-0.3, Math.min(0.3, (userOvr - rivalOvr) / 100));
    let uGoals = 0;
    let rGoals = 0;

    addLog('⚽ ¡Silbato inicial! Empieza el partido.', 'event');
    await delay(600);

    for (let t = 1; t <= TOTAL_TURNS; t++) {
      const minute = Math.round((t / TOTAL_TURNS) * 40); // partido de 40 min
      setCurrentMinute(minute);
      await delay(TURN_DELAY_MS);

      const turn: TurnResult = generateTurn(userCards, minute, advantage, rivalName);

      if (turn.type === 'neutral' || turn.type === 'rival_miss') {
        addLog(turn.narrative, turn.type === 'rival_miss' ? 'good' : 'neutral');
        continue;
      }

      if (turn.type === 'rival_goal') {
        rGoals += 1;
        setRivalGoals(rGoals);
        addLog(turn.narrative, 'bad');
        addLog(`  Marcador: ${uGoals} – ${rGoals}`, 'bad');
        setLastGoalFlash('rival');
        setTimeout(() => setLastGoalFlash(null), 1200);
        await delay(GOAL_PAUSE_MS);
        continue;
      }

      if (turn.type === 'moment' && turn.moment) {
        // Pausar y pedir decisión
        const chosen = await waitForDecision(turn.moment);
        await delay(300);

        const result: MomentResult = resolveDecision(
          chosen,
          turn.moment.mainCard,
          turn.moment.type,
          minute,
        );

        if (result.goalFor === 'user') {
          uGoals += 1;
          setUserGoals(uGoals);
          addLog(result.narrative, 'goal');
          addLog(`  Marcador: ${uGoals} – ${rGoals}`, 'good');
          setLastGoalFlash('user');
          setTimeout(() => setLastGoalFlash(null), 1800);
          await delay(GOAL_PAUSE_MS);
        } else if (result.goalFor === 'rival') {
          rGoals += 1;
          setRivalGoals(rGoals);
          addLog(result.narrative, 'bad');
          addLog(`  Marcador: ${uGoals} – ${rGoals}`, 'bad');
          setLastGoalFlash('rival');
          setTimeout(() => setLastGoalFlash(null), 1200);
          await delay(GOAL_PAUSE_MS);
        } else {
          addLog(result.narrative, result.success ? 'good' : 'neutral');
          await delay(400);
        }
      }
    }

    // Fin del partido
    await delay(600);
    addLog('📯 ¡Silbato final! El partido terminó.', 'event');
    setCurrentMinute(40);
    setPhase('ended');

    // Dar XP a las cartas
    const xpBase = uGoals > rGoals ? 30 : uGoals === rGoals ? 18 : 12;
    let updatedCards = [...userCards];
    for (let i = 0; i < updatedCards.length; i++) {
      const { card } = addExperienceToCard(updatedCards[i], xpBase);
      updatedCards[i] = card;
    }

    await delay(1200);
    onMatchEnd({
      winner: uGoals >= rGoals ? 'user' : 'rival',
      userGoals: uGoals,
      rivalGoals: rGoals,
      xpGained: xpBase,
      updatedCards,
    });

    isRunningRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    runMatch();
    return () => {
      clearDecisionTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers de color de log ────────────────────────────────────────────────

  function logColor(type: LogLine['type']): string {
    switch (type) {
      case 'goal':    return '#FFD700';
      case 'good':    return '#3DFFA0';
      case 'bad':     return '#FF6B6B';
      case 'event':   return '#A78BFA';
      default:        return 'rgba(255,255,255,0.65)';
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const timerColor = timerPct > 50
    ? `#3DFFA0`
    : timerPct > 25
      ? `#FFD700`
      : `#FF6B6B`;

  const flashBg = lastGoalFlash === 'user'
    ? 'rgba(61,255,160,0.08)'
    : lastGoalFlash === 'rival'
      ? 'rgba(255,107,107,0.08)'
      : 'transparent';

  return (
    <div style={{
      fontFamily: "'Space Mono', 'Courier New', monospace",
      background: '#0D0D1A',
      borderRadius: 20,
      overflow: 'hidden',
      maxWidth: 480,
      margin: '0 auto',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'background 0.4s ease',
      backgroundColor: flashBg !== 'transparent' ? flashBg : '#0D0D1A',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        @keyframes goalPop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flashIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes optionPop {
          0% { transform: scale(0.92) translateY(8px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .log-line { animation: flashIn 0.25s ease both; }
        .decision-option {
          animation: optionPop 0.22s ease both;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.04);
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .decision-option:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .decision-option:active { transform: scale(0.97); }
        .decision-option.chosen {
          border-color: #3DFFA0;
          background: rgba(61,255,160,0.12);
        }
        .decision-option.safe-auto {
          border-color: #FFD700;
          background: rgba(255,215,0,0.10);
        }
      `}</style>

      {/* ── HUD: marcador ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Equipo usuario */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>
            MI EQUIPO
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 52,
            color: lastGoalFlash === 'user' ? '#3DFFA0' : '#fff',
            lineHeight: 1,
            transition: 'color 0.3s',
            animation: lastGoalFlash === 'user' ? 'goalPop 0.4s ease' : 'none',
          }}>
            {userGoals}
          </div>
        </div>

        {/* Centro */}
        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
            marginBottom: 6,
          }}>
            {phase === 'ended' ? 'FIN' : `MIN ${currentMinute}`}
          </div>
          <div style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: 4,
          }}>—</div>
          <div style={{
            marginTop: 6,
            width: 48,
            height: 3,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(currentMinute / 40) * 100}%`,
              height: '100%',
              background: '#A78BFA',
              borderRadius: 2,
              transition: 'width 0.8s ease',
            }}/>
          </div>
        </div>

        {/* Rival */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>
            {rivalName.toUpperCase()}
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 52,
            color: lastGoalFlash === 'rival' ? '#FF6B6B' : 'rgba(255,255,255,0.7)',
            lineHeight: 1,
            transition: 'color 0.3s',
            animation: lastGoalFlash === 'rival' ? 'goalPop 0.4s ease' : 'none',
          }}>
            {rivalGoals}
          </div>
        </div>
      </div>

      {/* ── Panel de decisión ─────────────────────────────────────────────────── */}
      {phase === 'decision' && currentMoment && (
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(167,139,250,0.05)',
        }}>
          {/* Encabezado momento */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div>
              <div style={{
                fontSize: 10,
                letterSpacing: 2,
                color: '#A78BFA',
                fontWeight: 700,
                marginBottom: 2,
              }}>
                ¡MOMENTO CLAVE! Min {currentMoment.minute}
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.85)',
              }}>
                {getCardData(currentMoment.mainCard).name} tiene la pelota
              </div>
            </div>

            {/* Timer circular */}
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - timerPct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
                />
              </svg>
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: timerColor,
                transition: 'color 0.3s',
              }}>
                {Math.ceil(currentMoment.timeLimit * timerPct / 100)}
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentMoment.options.map((opt, i) => (
              <button
                key={opt.id}
                className={`decision-option${decidedOption === opt.id ? ' chosen' : ''}${decidedOption && opt.isSafe && decidedOption !== opt.id ? ' safe-auto' : ''}`}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  opacity: decidedOption && decidedOption !== opt.id ? 0.4 : 1,
                  fontFamily: "'Space Mono', monospace",
                  color: '#fff',
                  fontSize: 13,
                  textAlign: 'left',
                  border: 'none',
                  outline: 'none',
                }}
                onClick={() => !decidedOption && handleDecision(opt)}
                disabled={!!decidedOption}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>
                    {opt.stat.toUpperCase()} · {getCardData(currentMoment.mainCard)[opt.stat as keyof ReturnType<typeof getCardData>] ?? '—'}
                    {opt.isSafe ? ' · OPCIÓN SEGURA' : ''}
                  </div>
                </div>
                {opt.isSafe && (
                  <span style={{
                    fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4, padding: '2px 6px',
                  }}>
                    AUTO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Log narrativo ─────────────────────────────────────────────────────── */}
      <div
        ref={logRef}
        style={{
          padding: '14px 20px',
          height: 200,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          scrollbarWidth: 'none',
        }}
      >
        {log.length === 0 && (
          <div style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 40,
            animation: 'pulse 1.5s ease infinite',
          }}>
            Cargando partido...
          </div>
        )}
        {log.map(line => (
          <div
            key={line.id}
            className="log-line"
            style={{
              fontSize: line.type === 'goal' ? 14 : 12,
              fontWeight: line.type === 'goal' ? 700 : 400,
              color: logColor(line.type),
              lineHeight: 1.5,
              padding: line.type === 'goal' ? '6px 10px' : '0 4px',
              borderRadius: line.type === 'goal' ? 8 : 0,
              background: line.type === 'goal' ? 'rgba(255,215,0,0.08)' : 'transparent',
              border: line.type === 'goal' ? '1px solid rgba(255,215,0,0.2)' : 'none',
            }}
          >
            {line.text}
          </div>
        ))}
        {phase === 'playing' && log.length > 0 && (
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
            animation: 'pulse 1s ease infinite',
            paddingLeft: 4,
          }}>
            ▌
          </div>
        )}
      </div>

      {/* ── Footer con OVRs ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 20px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 1,
      }}>
        <span>OVR {userOvr}</span>
        <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
        <span>OVR {rivalOvr}</span>
      </div>
    </div>
  );
}