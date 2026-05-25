// src/components/campaign/TrainingCenter.tsx
// ─────────────────────────────────────────────────────────────
// TRAINING CENTER - ANIME AAA VERSION
// BLUELOCK + FIFA ULTIMATE TEAM + CAPTAIN TSUBASA STYLE
// COMPLETO Y FUNCIONAL
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import { UserCard } from '../../types/cards';
import { useTrainingSystem } from '../../hooks/useTrainingSystem';
import { TrainingModal } from './TrainingModal';
import { getCardData } from '../../utils/battleEngine';

// ─────────────────────────────────────────────────────────────
// COLORS / FONTS
// ─────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#00f3ff',
  primaryDark: '#0099ff',
  secondary: '#ff00ff',
  accent: '#ffd500',

  bg: '#020617',
  bg2: '#071226',
  bgCard: '#0f172a',

  text: '#ffffff',
  textDim: '#8ba3c7',

  pace: '#e4ff6b',
  dribbling: '#00e5ff',
  passing: '#a855f7',
  defending: '#2ed573',
  finishing: '#ff7b00',
  physical: '#ff5e7a',
};

const FONT_TITLE = `'Orbitron', sans-serif`;
const FONT_BODY = `'Rajdhani', sans-serif`;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface TrainingCenterProps {
  userId: string;
  userCards: UserCard[];
  deckCards: UserCard[];
  onCardsUpdated: (updatedCards: UserCard[]) => void;
  onClose: () => void;
  isDevMode?: boolean;
}

// ─────────────────────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────────────────────

const GAMES = [
  {
    id: 'shooting',
    name: 'REMATE',
    icon: '🎯',
    stat: 'finishing',
    color: '#ff4757',
    aura: '#ff475755',

    desc: 'Disparo letal',
    description: '🎯 Reventá el arco con tiros perfectos',
    difficulty: '⭐⭐',
    timeSeconds: 10,
  },

  {
    id: 'dribbling',
    name: 'GAMBETA',
    icon: '⚡',
    stat: 'dribbling',
    color: '#00f0ff',
    aura: '#00f0ff55',

    desc: 'Velocidad extrema',
    description: '⚡ Esquivá rivales y rompé líneas',
    difficulty: '⭐⭐⭐',
    timeSeconds: 14,
  },

  {
    id: 'passing',
    name: 'PASE',
    icon: '🌀',
    stat: 'passing',
    color: '#a855f7',
    aura: '#a855f755',

    desc: 'Visión total',
    description: '🌀 Ejecutá pases imposibles',
    difficulty: '⭐⭐⭐',
    timeSeconds: 12,
  },

  {
    id: 'defending',
    name: 'DEFENSA',
    icon: '🛡️',
    stat: 'defending',
    color: '#22c55e',
    aura: '#22c55e55',

    desc: 'Muro absoluto',
    description: '🛡️ Frená cada ataque rival',
    difficulty: '⭐⭐',
    timeSeconds: 11,
  },

  {
    id: 'physical',
    name: 'FÍSICO',
    icon: '💪',
    stat: 'physical',
    color: '#ff8800',
    aura: '#ff880055',

    desc: 'Potencia brutal',
    description: '💪 Reaccioná rápido y resistí todo',
    difficulty: '⭐⭐⭐⭐',
    timeSeconds: 15,
  },

  {
    id: 'pace',
    name: 'RITMO',
    icon: '🏃',
    stat: 'pace',
    color: '#eaff00',
    aura: '#eaff0055',

    desc: 'Sprint relámpago',
    description: '🏃 Superá al rival en velocidad',
    difficulty: '⭐⭐⭐',
    timeSeconds: 12,
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getAvatar(card: UserCard) {
  const data = getCardData(card);
  const pos = data.position?.toLowerCase() || '';

  if (pos.includes('del') || pos.includes('striker')) return '⚽';
  if (pos.includes('mid')) return '⚡';
  if (pos.includes('def')) return '🛡️';
  if (pos.includes('goal')) return '🧤';

  return '👤';
}

function getStats(card: UserCard) {
  const data = getCardData(card);

  return {
    name: data.name || 'Jugador',
    overall: data.overall_rating || 50,

    pace: data.pace || 50,
    dribbling: data.dribbling || 50,
    passing: data.passing || 50,
    defending: data.defending || 50,
    finishing: data.finishing || 50,
    physical: data.physical || 50,
  };
}

function statColor(stat: string) {
  switch (stat) {
    case 'pace':
      return COLORS.pace;
    case 'dribbling':
      return COLORS.dribbling;
    case 'passing':
      return COLORS.passing;
    case 'defending':
      return COLORS.defending;
    case 'finishing':
      return COLORS.finishing;
    case 'physical':
      return COLORS.physical;
    default:
      return COLORS.primary;
  }
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'S':
      return '#ffd700';
    case 'A':
      return '#00ff87';
    case 'B':
      return '#00e5ff';
    case 'C':
      return '#ff7b7b';
    default:
      return '#fff';
  }
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function TrainingCenter({
  userId,
  deckCards,
  onCardsUpdated,
  onClose,
  isDevMode = false,
}: TrainingCenterProps) {
  const {
    dailyLoop,
    applyTraining,
    canTrain,
    history,
    trainingsLeftToday,
  } = useTrainingSystem(userId, deckCards);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [selectedGame, setSelectedGame] =
    useState<(typeof GAMES)[0] | null>(null);

  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const [showIntro, setShowIntro] = useState(false);

  // ───────────────────────────────────────────────────────────
  // INTRO
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (showTrainingModal) {
      setShowIntro(true);

      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [showTrainingModal]);

  // ───────────────────────────────────────────────────────────
  // SELECTED PLAYER
  // ───────────────────────────────────────────────────────────

  const selectedPlayerName = useMemo(() => {
    if (!selectedCardId) return 'TODO EL EQUIPO';

    const found = deckCards.find((c) => c.id === selectedCardId);

    if (!found) return 'JUGADOR';

    return getStats(found).name;
  }, [selectedCardId, deckCards]);

  // ───────────────────────────────────────────────────────────
  // TRAIN
  // ───────────────────────────────────────────────────────────

  const handleTrain = async (result: any) => {
    const cardsToTrain = selectedCardId
      ? deckCards.filter((c) => c.id === selectedCardId)
      : deckCards;

    const updated = await applyTraining(
      result,
      cardsToTrain,
      selectedCardId || undefined
    );

    if (updated?.success && updated.upgradedCards) {
      onCardsUpdated(updated.upgradedCards);
    }

    setSelectedGame(null);
    setShowTrainingModal(false);
  };

  // ───────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────

  return (
    <>
      <style>
        {`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes pulseGlow {
          0% { opacity: .5; }
          50% { opacity: 1; }
          100% { opacity: .5; }
        }

        @keyframes aura {
          0% { transform: scale(1); opacity: .6; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: .6; }
        }

        @keyframes floatCard {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }

        @keyframes shine {
          0% { left: -40%; }
          100% { left: 140%; }
        }

        @keyframes animeIntro {
          0% {
            opacity:0;
            transform:scale(1.4);
            filter:blur(20px);
          }

          100% {
            opacity:1;
            transform:scale(1);
            filter:blur(0px);
          }
        }

        @keyframes flashMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}
      </style>

      <div style={styles.overlay}>
        {/* scanlines */}
        <div style={styles.scanlines} />

        {/* particles */}
        <div style={styles.particles} />

        <div style={styles.container}>
          {/* HEADER */}

          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.logo}>🏋️</div>

              <div>
                <div style={styles.title}>
                  CAMPO DE ENTRENAMIENTO
                </div>

                <div style={styles.subtitle}>
                  BLUELOCK TRAINING SYSTEM
                </div>
              </div>
            </div>

            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          {/* SELECTED */}

          <div style={styles.selectedBanner}>
            <div style={styles.selectedText}>
              ⚡ ENTRENANDO A:
            </div>

            <div style={styles.selectedPlayer}>
              {selectedPlayerName}
            </div>

            {selectedCardId && (
              <button
                style={styles.clearButton}
                onClick={() => setSelectedCardId(null)}
              >
                CAMBIAR
              </button>
            )}
          </div>

          {/* CARDS */}

          <div style={styles.cardsGrid}>
            {/* TEAM CARD */}

            <div
              style={{
                ...styles.card,
                ...(selectedCardId === null
                  ? styles.cardSelected
                  : {}),
              }}
              onClick={() => setSelectedCardId(null)}
            >
              <div style={styles.cardGlow} />

              <div style={styles.cutIn}>
                <div style={styles.cutInText}>
                  TEAM BOOST
                </div>
              </div>

              <div style={styles.cardHeader}>
                <div style={styles.cardAvatar}>👥</div>

                <div>
                  <div style={styles.cardName}>
                    TODO EL EQUIPO
                  </div>

                  <div style={styles.cardRole}>
                    GENERAL TRAINING
                  </div>
                </div>
              </div>

              <div style={styles.teamInfo}>
                ⚡ Mejora global para todas las cartas
              </div>
            </div>

            {/* PLAYER CARDS */}

            {deckCards.slice(0, 8).map((card) => {
              const stats = getStats(card);

              const selected = selectedCardId === card.id;

              return (
                <div
                  key={card.id}
                  style={{
                    ...styles.card,
                    ...(selected ? styles.cardSelected : {}),
                  }}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <div style={styles.cardGlow} />

                  {/* CUT-IN */}

                  <div style={styles.cutIn}>
                    <div style={styles.cutInText}>
                      {selected
                        ? 'LOCKED IN'
                        : 'EGO PLAYER'}
                    </div>
                  </div>

                  {/* HEADER */}

                  <div style={styles.cardHeader}>
                    <div style={styles.cardAvatar}>
                      {getAvatar(card)}
                    </div>

                    <div>
                      <div style={styles.cardName}>
                        {stats.name}
                      </div>

                      <div style={styles.ovrBox}>
                        <span style={styles.ovrValue}>
                          {stats.overall}
                        </span>

                        <span style={styles.ovrLabel}>
                          OVR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STATS */}

                  <div style={styles.stats}>
                    {[
                      {
                        label: 'RITMO',
                        value: stats.pace,
                        color: COLORS.pace,
                        icon: '⚡',
                      },
                      {
                        label: 'GAMBETA',
                        value: stats.dribbling,
                        color: COLORS.dribbling,
                        icon: '🪄',
                      },
                      {
                        label: 'PASE',
                        value: stats.passing,
                        color: COLORS.passing,
                        icon: '🌀',
                      },
                      {
                        label: 'DEFENSA',
                        value: stats.defending,
                        color: COLORS.defending,
                        icon: '🛡️',
                      },
                      {
                        label: 'REMATE',
                        value: stats.finishing,
                        color: COLORS.finishing,
                        icon: '⚽',
                      },
                      {
                        label: 'FÍSICO',
                        value: stats.physical,
                        color: COLORS.physical,
                        icon: '💪',
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={styles.statRow}
                      >
                        <div style={styles.statLeft}>
                          <span>{s.icon}</span>

                          <span>{s.label}</span>
                        </div>

                        <div style={styles.barTrack}>
                          <div
                            style={{
                              ...styles.barFill,
                              width: `${s.value}%`,
                              background: s.color,
                              boxShadow: `0 0 14px ${s.color}`,
                            }}
                          />
                        </div>

                        <div style={styles.statValue}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={styles.cardFooter}>
                    {selected
                      ? '✨ SELECCIONADO ✨'
                      : 'CLICK PARA ENTRENAR'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ENERGY */}

          <div style={styles.energyPanel}>
            <div style={{ flex: 1 }}>
              <div style={styles.energyLabel}>
                <span>⚡ ENERGÍA</span>

                <span>
                  {dailyLoop.energy}/
                  {dailyLoop.maxEnergy}
                </span>
              </div>

              <div style={styles.energyTrack}>
                <div
                  style={{
                    ...styles.energyFill,
                    width: `${
                      (dailyLoop.energy /
                        dailyLoop.maxEnergy) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div style={styles.energyText}>
                🎯 {trainingsLeftToday} entrenamientos
                disponibles
              </div>
            </div>

            <div style={styles.streakBox}>
              <div style={styles.streakNumber}>
                {dailyLoop.streak}
              </div>

              <div style={styles.streakLabel}>
                🔥 STREAK
              </div>
            </div>
          </div>

          {/* GAMES */}

          <div style={styles.sectionTitle}>
            ENTRENAMIENTOS ESPECIALES
          </div>

          <div style={styles.gamesGrid}>
            {GAMES.map((game) => (
              <button
                key={game.id}
                disabled={!canTrain && !isDevMode}
                style={{
                  ...styles.gameButton,
                  borderColor: game.color,
                  boxShadow: `0 0 20px ${game.aura}55`,
                  opacity:
                    !canTrain && !isDevMode ? 0.5 : 1,
                }}
                onClick={() => {
                  setSelectedGame(game);
                  setShowTrainingModal(true);
                }}
              >
                <div
                  style={{
                    ...styles.gameAura,
                    background: game.aura,
                  }}
                />

                <div style={styles.gameIcon}>
                  {game.icon}
                </div>

                <div style={styles.gameName}>
                  {game.name}
                </div>

                <div style={styles.gameDesc}>
                  {game.desc}
                </div>
              </button>
            ))}
          </div>

          {/* HISTORY */}

          {history.length > 0 && (
            <>
              <div style={styles.sectionTitle}>
                HISTORIAL
              </div>

              <div style={styles.historyBox}>
                {history.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    style={styles.historyRow}
                  >
                    <div style={styles.historyTime}>
                      {new Date(
                        h.date
                      ).toLocaleTimeString()}
                    </div>

                    <div style={styles.historyStat}>
                      {h.stat}
                    </div>

                    <div
                      style={{
                        ...styles.historyGrade,
                        color: getGradeColor(h.grade),
                      }}
                    >
                      {h.grade}
                    </div>

                    <div style={styles.historyDelta}>
                      +{h.delta}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DEV */}

          {isDevMode && (
            <div style={styles.devBox}>
              <div style={styles.devTitle}>
                🛠 DEV MODE
              </div>

              <div style={styles.devButtons}>
                <button
                  style={styles.devButton}
                  onClick={() => {
                    const saved = localStorage.getItem(
                      `training_loop_${userId}`
                    );

                    if (saved) {
                      const parsed = JSON.parse(saved);

                      parsed.energy = 5;
                      parsed.dailyTrainings = 0;

                      localStorage.setItem(
                        `training_loop_${userId}`,
                        JSON.stringify(parsed)
                      );
                    }

                    window.location.reload();
                  }}
                >
                  ⚡ RECARGAR
                </button>

                <button
                  style={styles.devButtonDanger}
                  onClick={() => {
                    localStorage.removeItem(
                      `training_loop_${userId}`
                    );

                    localStorage.removeItem(
                      `training_history_${userId}`
                    );

                    window.location.reload();
                  }}
                >
                  🔄 RESET
                </button>
              </div>
            </div>
          )}
        </div>

        {/* INTRO */}

        {showIntro && selectedGame && (
          <div style={styles.introOverlay}>
            <div style={styles.introFlash} />

            <div style={styles.introContent}>
              <div style={styles.introMini}>
                SPECIAL TRAINING
              </div>

              <div style={styles.introTitle}>
                {selectedGame.icon}{' '}
                {selectedGame.name}
              </div>

              <div style={styles.introSub}>
                ⚡ PREPARATE ⚡
              </div>
            </div>
          </div>
        )}

        {/* MODAL */}

        {selectedGame && (
          <TrainingModal
            isOpen={showTrainingModal}
            onClose={() => {
              setShowTrainingModal(false);

              setTimeout(() => {
                setSelectedGame(null);
              }, 400);
            }}
            onTrain={handleTrain}
            deckCardIds={
              selectedCardId
                ? [selectedCardId]
                : deckCards.map((c) => c.id)
            }
            selectedGame={selectedGame}
            isDevMode={isDevMode}
          />
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
  position: 'fixed',
  inset: 0,

  background: `
    linear-gradient(
      180deg,
      #020617 0%,
      #071226 40%,
      #020617 100%
    )
  `,

  backgroundImage: `
    repeating-linear-gradient(
      0deg,
      rgba(0,255,255,0.03) 0px,
      rgba(0,255,255,0.03) 1px,
      transparent 1px,
      transparent 3px
    )
  `,

  zIndex: 1000,

  overflowY: 'auto',

  padding: '24px 0',

  WebkitOverflowScrolling: 'touch',

  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
},

  scanlines: {
    position: 'absolute',
    inset: 0,

    background: `
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,0.02),
        rgba(255,255,255,0.02) 1px,
        transparent 1px,
        transparent 3px
      )
    `,

    pointerEvents: 'none',
  },

  particles: {
    position: 'absolute',
    inset: 0,

    backgroundImage: `
      radial-gradient(circle, rgba(0,243,255,.18) 1px, transparent 1px)
    `,

    backgroundSize: '40px 40px',

    opacity: 0.4,

    pointerEvents: 'none',
  },

  container: {
    width: '100%',
    maxWidth: 1450,
    marginTop: '60px',

    position: 'relative',

    borderRadius: 28,

    background: `
      linear-gradient(
        180deg,
        rgba(10,15,35,.95),
        rgba(3,7,18,.98)
      )
    `,

    border: '1px solid rgba(0,243,255,.25)',

    padding: 24,

    boxShadow: `
      0 0 50px rgba(0,243,255,.15),
      inset 0 0 50px rgba(0,243,255,.05)
    `,
    maxHeight: 'unset',
overflow: 'visible',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 24,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },

  logo: {
    fontSize: 58,

    filter: 'drop-shadow(0 0 12px #00f3ff)',
  },

  title: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 900,
    letterSpacing: 3,
    fontFamily: FONT_TITLE,

    textShadow: `
      0 0 12px rgba(0,243,255,.8)
    `,
  },

  subtitle: {
    color: COLORS.primary,
    letterSpacing: 3,
    fontSize: 12,
    marginTop: 4,
  },

  closeButton: {
    width: 52,
    height: 52,

    borderRadius: 14,

    border: '1px solid rgba(255,255,255,.1)',

    background: 'rgba(255,255,255,.04)',

    color: '#fff',

    cursor: 'pointer',

    fontSize: 20,
  },

  selectedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,

    padding: 18,

    borderRadius: 20,

    marginBottom: 28,

    background: `
      linear-gradient(
        90deg,
        rgba(0,243,255,.08),
        rgba(255,0,255,.08)
      )
    `,

    border: '1px solid rgba(0,243,255,.2)',
  },

  selectedText: {
    color: COLORS.primary,
    fontSize: 14,
    letterSpacing: 2,
  },

  selectedPlayer: {
    fontSize: 20,
    fontWeight: 900,
    color: '#fff',

    textShadow: `
      0 0 14px rgba(0,243,255,.8)
    `,
  },

  clearButton: {
    marginLeft: 'auto',

    padding: '8px 16px',

    borderRadius: 999,

    border: 'none',

    background: 'rgba(255,255,255,.08)',

    color: '#fff',

    cursor: 'pointer',
  },

  cardsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(340px, 1fr))',

    gap: 18,

    marginBottom: 28,
  },

  card: {
    position: 'relative',

    overflow: 'hidden',

    borderRadius: 24,

    padding: 18,

    background: `
      linear-gradient(
        135deg,
        rgba(0,243,255,.08),
        rgba(0,0,0,.9)
      )
    `,

    border: '1px solid rgba(0,243,255,.15)',

    cursor: 'pointer',

    transition: 'all .25s ease',

    animation: 'floatCard 4s ease-in-out infinite',

    backdropFilter: 'blur(10px)',
  },

  cardSelected: {
    transform: 'scale(1.03)',

    border: '1px solid #00f3ff',

    boxShadow: `
      0 0 22px rgba(0,243,255,.8),
      0 0 60px rgba(0,243,255,.3)
    `,
  },

  cardGlow: {
    position: 'absolute',
    inset: -100,

    background: `
      radial-gradient(circle, rgba(0,243,255,.18), transparent 60%)
    `,

    animation: 'pulseGlow 3s ease infinite',
  },

  cutIn: {
    position: 'absolute',

    top: 10,
    left: -20,

    transform: 'skew(-20deg)',

    background: `
      linear-gradient(
        90deg,
        rgba(0,243,255,.15),
        rgba(0,243,255,.45),
        rgba(0,243,255,.15)
      )
    `,

    padding: '8px 40px',

    border: '1px solid rgba(0,243,255,.25)',

    zIndex: 5,
  },

  cutInText: {
    transform: 'skew(20deg)',

    color: '#fff',

    fontWeight: 900,

    letterSpacing: 2,

    fontSize: 13,
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,

    marginTop: 38,
    marginBottom: 18,

    position: 'relative',
    zIndex: 2,
  },

  cardAvatar: {
    fontSize: 58,

    filter: 'drop-shadow(0 0 12px rgba(0,243,255,.7))',
  },

  cardName: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 20,
  },

  cardRole: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 4,
  },

  ovrBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,

    marginTop: 4,
  },

  ovrValue: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: 900,
  },

  ovrLabel: {
    color: COLORS.textDim,
    fontSize: 11,
  },

  stats: {
    position: 'relative',
    zIndex: 2,
  },

  statRow: {
    display: 'flex',
    alignItems: 'center',

    gap: 10,

    marginBottom: 10,
  },

  statLeft: {
    width: 90,

    display: 'flex',
    alignItems: 'center',
    gap: 6,

    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
  },

  barTrack: {
    flex: 1,

    height: 10,

    borderRadius: 999,

    overflow: 'hidden',

    background: 'rgba(255,255,255,.06)',

    border: '1px solid rgba(255,255,255,.04)',
  },

  barFill: {
    height: '100%',

    borderRadius: 999,

    transition: 'width .4s ease',
  },

  statValue: {
    width: 32,

    color: '#fff',

    fontSize: 12,
    fontWeight: 900,
  },

  cardFooter: {
    marginTop: 18,

    textAlign: 'center',

    color: COLORS.primary,

    fontWeight: 900,

    letterSpacing: 1,
  },

  teamInfo: {
    color: '#fff',
    marginTop: 24,
    fontSize: 14,
  },

  energyPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,

    padding: 22,

    borderRadius: 24,

    marginBottom: 28,

    background: `
      linear-gradient(
        135deg,
        rgba(0,243,255,.08),
        rgba(255,0,255,.05)
      )
    `,

    border: '1px solid rgba(0,243,255,.15)',
  },

  energyLabel: {
    display: 'flex',
    justifyContent: 'space-between',

    marginBottom: 10,

    color: '#fff',
    fontWeight: 700,
  },

  energyTrack: {
    height: 14,

    borderRadius: 999,

    overflow: 'hidden',

    background: 'rgba(255,255,255,.06)',
  },

  energyFill: {
    height: '100%',

    borderRadius: 999,

    background: `
      linear-gradient(
        90deg,
        #00f3ff,
        #ff00ff
      )
    `,

    boxShadow: `
      0 0 18px rgba(0,243,255,.8)
    `,
  },

  energyText: {
    marginTop: 10,
    color: COLORS.accent,
    fontSize: 12,
  },

  streakBox: {
    width: 140,

    textAlign: 'center',

    padding: 16,

    borderRadius: 20,

    background: 'rgba(255,255,255,.04)',

    border: '1px solid rgba(255,255,255,.08)',
  },

  streakNumber: {
    fontSize: 40,
    color: COLORS.accent,
    fontWeight: 900,
  },

  streakLabel: {
    color: '#fff',
    letterSpacing: 2,
    fontSize: 12,
  },

  sectionTitle: {
    color: '#fff',

    fontSize: 22,

    fontWeight: 900,

    letterSpacing: 2,

    marginBottom: 18,

    marginTop: 10,

    fontFamily: FONT_TITLE,

    textShadow: `
      0 0 10px rgba(0,243,255,.5)
    `,
  },

  gamesGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(220px, 1fr))',

    gap: 18,

    marginBottom: 28,
  },

  gameButton: {
    position: 'relative',

    overflow: 'hidden',

    padding: 22,

    borderRadius: 24,

    background: `
      linear-gradient(
        180deg,
        rgba(0,243,255,.12),
        rgba(0,0,0,.95)
      )
    `,

    borderWidth: 2,
    borderStyle: 'solid',

    cursor: 'pointer',

    transition: 'all .25s ease',
  },

  gameAura: {
    position: 'absolute',

    width: 180,
    height: 180,

    borderRadius: '50%',

    filter: 'blur(70px)',

    top: -80,
    right: -50,

    opacity: 0.3,
  },

  gameIcon: {
    fontSize: 54,

    marginBottom: 12,

    position: 'relative',
    zIndex: 2,
  },

  gameName: {
    color: '#fff',

    fontSize: 22,
    fontWeight: 900,

    position: 'relative',
    zIndex: 2,
  },

  gameDesc: {
    color: COLORS.textDim,

    marginTop: 6,

    fontSize: 13,

    position: 'relative',
    zIndex: 2,
  },

  historyBox: {
    borderRadius: 20,

    overflow: 'hidden',

    border: '1px solid rgba(255,255,255,.08)',

    marginBottom: 24,
  },

  historyRow: {
    display: 'flex',
    alignItems: 'center',

    padding: 14,

    background: 'rgba(255,255,255,.03)',

    borderBottom: '1px solid rgba(255,255,255,.04)',
  },

  historyTime: {
    width: 110,

    color: COLORS.textDim,
  },

  historyStat: {
    flex: 1,

    color: '#fff',
    fontWeight: 700,
  },

  historyGrade: {
    width: 50,

    fontWeight: 900,
  },

  historyDelta: {
    width: 50,

    color: COLORS.accent,

    fontWeight: 900,
  },

  devBox: {
    marginTop: 20,

    padding: 20,

    borderRadius: 20,

    background: 'rgba(255,255,255,.04)',

    border: '1px solid rgba(255,255,255,.08)',
  },

  devTitle: {
    color: COLORS.accent,

    fontWeight: 900,

    marginBottom: 16,
  },

  devButtons: {
    display: 'flex',
    gap: 14,
  },

  devButton: {
    padding: '10px 18px',

    borderRadius: 12,

    border: 'none',

    background: COLORS.primary,

    color: '#000',

    fontWeight: 900,

    cursor: 'pointer',
  },

  devButtonDanger: {
    padding: '10px 18px',

    borderRadius: 12,

    border: 'none',

    background: '#ff4d6d',

    color: '#fff',

    fontWeight: 900,

    cursor: 'pointer',
  },

  introOverlay: {
    position: 'fixed',
    inset: 0,

    background: 'rgba(0,0,0,.85)',

    zIndex: 999999,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    animation: 'animeIntro .4s ease forwards',
  },

  introFlash: {
    position: 'absolute',
    inset: 0,

    background: `
      linear-gradient(
        120deg,
        transparent,
        rgba(255,255,255,.25),
        transparent
      )
    `,

    animation: 'flashMove .7s linear infinite',
  },

  introContent: {
    position: 'relative',

    textAlign: 'center',

    padding: 50,

    borderRadius: 28,

    background: `
      linear-gradient(
        135deg,
        rgba(0,243,255,.18),
        rgba(0,0,0,.95)
      )
    `,

    border: '2px solid rgba(0,243,255,.5)',

    boxShadow: `
      0 0 60px rgba(0,243,255,.35)
    `,
  },

  introMini: {
    color: COLORS.primary,

    letterSpacing: 6,

    marginBottom: 14,
  },

  introTitle: {
    fontSize: 72,

    color: '#fff',

    fontWeight: 900,

    letterSpacing: 2,

    textShadow: `
      0 0 24px rgba(0,243,255,.9)
    `,
  },

  introSub: {
    marginTop: 14,

    color: COLORS.accent,

    letterSpacing: 4,

    fontWeight: 900,
  },
};