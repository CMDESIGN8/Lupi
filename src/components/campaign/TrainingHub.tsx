
import { useState } from 'react';
import { DailyLoopState, TrainingHistory, getEnergyRefillMinutes } from '../../hooks/useTrainingSystem';
import { TrainingResult } from './TrainingGames';

const RUSSO = "'Russo One', sans-serif";

interface TrainingHubProps {
  dailyLoop: DailyLoopState;
  history: TrainingHistory[];
  canTrain: boolean;
  onOpenTraining: () => void;
}

const STAT_LABELS: Record<string, string> = {
  finishing: '⚽ REMATE',
  dribbling: '⚡ GAMBETA',
  defending: '🛡️ DEFENSA',
  passing:   '🌀 TIRO LIBRE',
  physical:  '💪 FÍSICO',
};

const GRADE_COLORS: Record<string, string> = {
  S: '#FFD700', A: '#00FF87', B: '#00E5FF', C: '#FF6B6B',
};

export function TrainingHub({ dailyLoop, history, canTrain, onOpenTraining }: TrainingHubProps) {
  const [expanded, setExpanded] = useState(false);

  const todayHistory = history.filter(h => {
    const today = new Date().toISOString().split('T')[0];
    return h.date.startsWith(today);
  });

  const refillMins = getEnergyRefillMinutes(dailyLoop.energyRefillsAt);
  const wc = dailyLoop.weeklyChallenge;

  return (
    <div style={s.container}>
      {/* Header clickeable */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={s.header}
      >
        <div style={s.headerLeft}>
          <span style={{ fontSize: 20 }}>🏋️</span>
          <div>
            <div style={s.headerTitle}>SALA DE ENTRENAMIENTO</div>
            <div style={s.headerSub}>
              {canTrain
                ? `${dailyLoop.dailyTrainings}/${dailyLoop.maxDailyTrainings} entrenamientos hoy`
                : '¡Límite diario alcanzado! Volvé mañana'}
            </div>
          </div>
        </div>
        <div style={s.headerRight}>
          {/* Energía */}
          <div style={s.energyRow}>
            {Array.from({ length: dailyLoop.maxEnergy }, (_, i) => (
              <div
                key={i}
                style={{
                  ...s.energyDot,
                  background: i < dailyLoop.energy ? '#FFD700' : 'rgba(255,255,255,0.1)',
                  boxShadow: i < dailyLoop.energy ? '0 0 6px rgba(255,215,0,0.5)' : 'none',
                }}
              />
            ))}
          </div>
          <span style={s.expandArrow}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div style={s.body}>

          {/* Energía detalle */}
          <div style={s.section}>
            <div style={s.sectionTitle}>⚡ ENERGÍA</div>
            <div style={s.energyDetail}>
              <div style={s.energyBig}>{dailyLoop.energy}/{dailyLoop.maxEnergy}</div>
              {dailyLoop.energy < dailyLoop.maxEnergy && refillMins > 0 && (
                <div style={s.energyRefill}>
                  +1 en {refillMins} min
                </div>
              )}
              {dailyLoop.energy === dailyLoop.maxEnergy && (
                <div style={s.energyFull}>¡ENERGÍA COMPLETA!</div>
              )}
            </div>
          </div>

          {/* Racha */}
          <div style={s.streakCard}>
            <div style={s.streakNum}>{dailyLoop.streak}</div>
            <div>
              <div style={s.streakLabel}>DÍAS SEGUIDOS</div>
              <div style={s.streakSub}>
                {dailyLoop.streak >= 7
                  ? '🔥 ¡RACHA LEGENDARIA!'
                  : dailyLoop.streak >= 3
                  ? '⚡ ¡Vas muy bien!'
                  : 'Entrenás todos los días para mantener la racha'}
              </div>
            </div>
          </div>

          {/* Desafío semanal */}
          {wc && (
            <div style={s.weeklyCard}>
              <div style={s.weeklyTitle}>{wc.title}</div>
              <div style={s.weeklyDesc}>{wc.description}</div>
              <div style={s.weeklyProgress}>
                <div style={s.weeklyBar}>
                  <div style={{ ...s.weeklyFill, width: `${(wc.progress / wc.goal) * 100}%` }} />
                </div>
                <div style={s.weeklyCount}>{wc.progress}/{wc.goal}</div>
              </div>
              <div style={s.weeklyReward}>
                🎁 RECOMPENSA: +{wc.reward.delta} {STAT_LABELS[wc.reward.stat]?.split(' ')[1]} · {wc.reward.xp} XP
              </div>
            </div>
          )}

          {/* Historial de hoy */}
          {todayHistory.length > 0 && (
            <div style={s.section}>
              <div style={s.sectionTitle}>📋 HOY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayHistory.slice(0, 5).map((h, i) => (
                  <div key={i} style={s.historyRow}>
                    <div style={s.historyLabel}>{STAT_LABELS[h.stat] || h.stat}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ ...s.gradeTag, color: GRADE_COLORS[h.grade] || '#fff' }}>
                        {h.grade}
                      </span>
                      {h.delta > 0 && (
                        <span style={s.deltaTag}>+{h.delta}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logros desbloqueados */}
          {dailyLoop.achievements.length > 0 && (
            <div style={s.section}>
              <div style={s.sectionTitle}>🏆 LOGROS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {dailyLoop.achievements.map(id => (
                  <div key={id} style={s.achievementChip}>
                    {ACHIEVEMENT_LABELS[id] || id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón entrenar */}
          <button
            onClick={onOpenTraining}
            disabled={!canTrain}
            style={{
              ...s.trainBtn,
              opacity: canTrain ? 1 : 0.45,
              cursor: canTrain ? 'pointer' : 'not-allowed',
            }}
          >
            {canTrain
              ? `🏋️ ENTRENAR (${dailyLoop.energy} ⚡ disponibles)`
              : `⏳ Sin energía · Próxima en ${refillMins} min`}
          </button>
        </div>
      )}
    </div>
  );
}

const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_S:         '🥇 Primera S',
  five_trainings:  '💪 5 entrenos/día',
  week_streak:     '🔥 7 días seguidos',
  ten_S:           '⭐ 10 calificaciones S',
  all_games:       '🎮 Todos los juegos',
};

const s: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(0,0,0,0.45)',
    borderRadius: 18,
    border: '1px solid rgba(255,215,0,0.2)',
    overflow: 'hidden',
    marginBottom: 16,
    fontFamily: RUSSO,
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    cursor: 'pointer',
    fontFamily: RUSSO,
    color: '#fff',
    gap: 12,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
  },
  headerTitle: {
    fontSize: 12,
    color: '#FFD700',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  energyRow: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  energyDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    transition: 'all 0.3s',
  },
  expandArrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  body: {
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  section: {},
  sectionTitle: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  energyDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  energyBig: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 900,
  },
  energyRefill: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  energyFull: {
    fontSize: 11,
    color: '#00FF87',
  },
  streakCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'rgba(255,100,50,0.08)',
    border: '1px solid rgba(255,100,50,0.3)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  streakNum: {
    fontSize: 36,
    color: '#FF8C00',
    fontWeight: 900,
    flexShrink: 0,
  },
  streakLabel: {
    fontSize: 10,
    color: '#FF8C00',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  streakSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.4,
  },
  weeklyCard: {
    background: 'rgba(168,85,247,0.08)',
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  weeklyTitle: {
    fontSize: 12,
    color: '#A855F7',
    marginBottom: 4,
  },
  weeklyDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  weeklyProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  weeklyBar: {
    flex: 1,
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weeklyFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #A855F7, #C084FC)',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  weeklyCount: {
    fontSize: 10,
    color: '#A855F7',
    minWidth: 30,
    textAlign: 'right',
  },
  weeklyReward: {
    fontSize: 9,
    color: '#FFD700',
    background: 'rgba(255,215,0,0.08)',
    borderRadius: 8,
    padding: '4px 8px',
  },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  historyLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  gradeTag: {
    fontSize: 12,
    fontWeight: 900,
  },
  deltaTag: {
    fontSize: 10,
    color: '#00FF87',
    background: 'rgba(0,255,135,0.1)',
    padding: '1px 6px',
    borderRadius: 8,
  },
  achievementChip: {
    fontSize: 10,
    color: '#FFD700',
    background: 'rgba(255,215,0,0.1)',
    border: '1px solid rgba(255,215,0,0.25)',
    borderRadius: 20,
    padding: '3px 10px',
  },
  trainBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF4500 100%)',
    border: 'none',
    borderRadius: 40,
    padding: '13px',
    fontSize: 12,
    fontWeight: 900,
    color: '#0f0020',
    fontFamily: RUSSO,
    letterSpacing: 1,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
};