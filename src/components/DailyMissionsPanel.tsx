  // src/components/DailyMissionsPanel.tsx
  import React from 'react';
  import { DailyMission } from '../types/campaignStory';

  interface DailyMissionsPanelProps {
    missions: DailyMission[];
    onClaimReward: (missionId: string) => void;
    onStartMission: (mission: DailyMission) => void;
    currentDay: number;
  }

  const RUSSO = "'Russo One', sans-serif";

  // ─────────────────────────────────────────────────────────────
  // IMPORTAR FUENTE
  // ─────────────────────────────────────────────────────────────
  if (
    typeof document !== 'undefined' &&
    !document.getElementById('russo-one-font')
  ) {
    const link = document.createElement('link');
    link.id = 'russo-one-font';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';

    document.head.appendChild(link);
  }

  // ─────────────────────────────────────────────────────────────
  // COMPONENTE
  // ─────────────────────────────────────────────────────────────
  export function DailyMissionsPanel({
    missions,
    onClaimReward,
    onStartMission,
    currentDay,
  }: DailyMissionsPanelProps) {
    const completedCount = missions.filter(m => m.isCompleted).length;
    const progressPercent =
      missions.length > 0
        ? (completedCount / missions.length) * 100
        : 0;

    const getMissionButton = (mission: DailyMission) => {
      if (mission.isCompleted && !mission.isClaimed) {
        return (
          <button
            style={styles.claimButton}
            onClick={() => onClaimReward(mission.id)}
          >
            <span style={styles.buttonGlow} />
            🎁 RECLAMAR
          </button>
        );
      }

      if (!mission.isCompleted) {
        return (
          <button
            style={styles.startButton}
            onClick={() => onStartMission(mission)}
          >
            <span style={styles.buttonGlow} />
            {getMissionIcon(mission.type)} EMPEZAR
          </button>
        );
      }

      return (
        <div style={styles.completedBadge}>
          ✨ COMPLETADA ✨
        </div>
      );
    };

    const getMissionIcon = (type: string) => {
      const icons = {
        play_match: '⚽',
        share: '📱',
        open_pack: '📦',
        watch_ad: '📺',
        complete_training: '💪',
        social_share: '🤝',
      };

      return icons[type as keyof typeof icons] || '✨';
    };

    const getMissionDifficulty = (
      requirement: number
    ) => {
      if (requirement <= 1)
        return {
          text: 'FÁCIL',
          color: '#4ade80',
        };

      if (requirement <= 3)
        return {
          text: 'NORMAL',
          color: '#ffd700',
        };

      return {
        text: 'ÉPICA',
        color: '#ff4444',
      };
    };

    const getProgressText = (
      mission: DailyMission
    ) => {
      if (mission.type === 'play_match') {
        return `PARTIDOS ${mission.currentProgress}/${mission.requirement}`;
      }

      if (mission.type === 'open_pack') {
        return `SOBRES ${mission.currentProgress}/${mission.requirement}`;
      }

      return `${mission.currentProgress}/${mission.requirement}`;
    };

    return (
      <div style={styles.container}>
        <style>{keyframes}</style>

        {/* ───────────────── HEADER ───────────────── */}
        <div style={styles.header}>
          <div style={styles.headerGlow} />

          <div style={styles.headerTop}>
            <div style={styles.headerBadge}>
              DAILY QUESTS
            </div>

            <div style={styles.dayChip}>
              ☀️ DÍA {currentDay}
            </div>
          </div>

          <div style={styles.titleRow}>
            <div style={styles.titleIcon}>
              ⚔️
            </div>

            <div>
              <h2 style={styles.title}>
                MISIONES DIARIAS
              </h2>

              <p style={styles.subtitle}>
                COMPLETA DESAFÍOS Y GANA PODER
              </p>
            </div>
          </div>

          {/* PROGRESO GENERAL */}
          <div style={styles.globalProgressWrapper}>
            <div style={styles.globalProgressHeader}>
              <span>
                ⚡ PROGRESO DE MISIONES
              </span>

              <span>
                {completedCount}/
                {missions.length}
              </span>
            </div>

            <div style={styles.globalProgressTrack}>
              <div
                style={{
                  ...styles.globalProgressFill,
                  width: `${progressPercent}%`,
                }}
              />

              <div style={styles.globalProgressShine} />
            </div>
          </div>
        </div>

        {/* ───────────────── MISIONES ───────────────── */}
        <div style={styles.missionsList}>
          {missions.map(mission => {
            const progress =
              (mission.currentProgress /
                mission.requirement) *
              100;

            const difficulty =
              getMissionDifficulty(
                mission.requirement
              );

            const isReady =
              mission.isCompleted &&
              !mission.isClaimed;

            return (
              <div
                key={mission.id}
                style={{
                  ...styles.missionCard,

                  ...(mission.isCompleted
                    ? styles.missionCompleted
                    : {}),

                  ...(isReady
                    ? styles.missionReady
                    : {}),
                }}
              >
                {/* EFECTOS */}
                <div style={styles.cardGlow} />

                {/* IZQUIERDA */}
                <div style={styles.leftSide}>
                  <div style={styles.iconFrame}>
                    <div style={styles.iconPulse} />

                    <span style={styles.missionIcon}>
                      {mission.icon ||
                        getMissionIcon(
                          mission.type
                        )}
                    </span>
                  </div>
                </div>

                {/* CENTRO */}
                <div style={styles.centerInfo}>
                  <div style={styles.topRow}>
                    <div
                      style={
                        styles.missionTitle
                      }
                    >
                      {mission.title}
                    </div>

                    <div
                      style={{
                        ...styles.difficultyChip,
                        borderColor:
                          difficulty.color,
                        color:
                          difficulty.color,
                      }}
                    >
                      {difficulty.text}
                    </div>
                  </div>

                  <div
                    style={
                      styles.missionDesc
                    }
                  >
                    {mission.description}
                  </div>

                  {/* BARRA */}
                  <div
                    style={
                      styles.progressWrapper
                    }
                  >
                    <div
                      style={
                        styles.progressTrack
                      }
                    >
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${progress}%`,
                        }}
                      />

                      <div
                        style={
                          styles.progressLight
                        }
                      />
                    </div>

                    <div
                      style={
                        styles.progressText
                      }
                    >
                      {getProgressText(
                        mission
                      )}
                    </div>
                  </div>

                  {/* RECOMPENSAS */}
                  <div style={styles.rewardRow}>
                    <div
                      style={
                        styles.rewardChip
                      }
                    >
                      ✨ +
                      {
                        mission.reward
                          .xp
                      }{' '}
                      XP
                    </div>

                    {mission.reward
                      .coins && (
                      <div
                        style={
                          styles.rewardChipCoins
                        }
                      >
                        💰 +
                        {
                          mission.reward
                            .coins
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* DERECHA */}
                <div style={styles.rightSide}>
                  {getMissionButton(
                    mission
                  )}
                </div>

                {/* CUT-IN */}
                {isReady && (
                  <div style={styles.cutIn}>
                    REWARD READY
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BONUS */}
        <div style={styles.dailyBonus}>
          <div style={styles.bonusGlow} />

          <div style={styles.bonusTitle}>
            ⭐ BONUS LEGENDARIO ⭐
          </div>

          <div style={styles.bonusText}>
            COMPLETA TODAS LAS MISIONES
            DURANTE VARIOS DÍAS Y
            DESBLOQUEÁ UN SOBRE
            ÉPICO DE CAMPEÓN
          </div>

          <div style={styles.bonusReward}>
            🎁 RECOMPENSA FINAL:
            SOBRE LEGENDARIO
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // KEYFRAMES
  // ─────────────────────────────────────────────────────────────
  const keyframes = `
  @keyframes animePulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 rgba(0,255,255,0);
    }

    50% {
      transform: scale(1.03);
      box-shadow: 0 0 25px rgba(0,255,255,0.35);
    }

    100% {
      transform: scale(1);
      box-shadow: 0 0 0 rgba(0,255,255,0);
    }
  }

  @keyframes glowMove {
    0% {
      transform: translateX(-150%);
    }

    100% {
      transform: translateX(250%);
    }
  }

  @keyframes floating {
    0% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(-5px);
    }

    100% {
      transform: translateY(0px);
    }
  }

  @keyframes pulseReward {
    0% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.06);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes cutInMove {
    0% {
      transform: translateX(140%);
    }

    100% {
      transform: translateX(-140%);
    }
  }
  `;

  // ─────────────────────────────────────────────────────────────
  // STYLES AAA
  // ─────────────────────────────────────────────────────────────
  const styles: Record<
    string,
    React.CSSProperties
  > = {
    container: {
      position: 'relative',

      borderRadius: 34,

      padding: 18,

      overflow: 'hidden',

      background:
        'linear-gradient(180deg, #07111d 0%, #04070f 100%)',

      border:
        '2px solid rgba(0,220,255,0.25)',

      boxShadow: `
        0 0 30px rgba(0,180,255,0.18),
        inset 0 0 20px rgba(0,180,255,0.08)
      `,

      fontFamily: RUSSO,

      marginBottom: 24,
    },

    // HEADER
    header: {
      position: 'relative',

      overflow: 'hidden',

      borderRadius: 28,

      padding: 20,

      marginBottom: 18,

      background:
        'linear-gradient(135deg, rgba(0,80,180,0.2), rgba(0,0,0,0.5))',

      border:
        '1px solid rgba(0,220,255,0.25)',
    },

    headerGlow: {
      position: 'absolute',
      top: -80,
      right: -80,

      width: 220,
      height: 220,

      borderRadius: '50%',

      background:
        'rgba(0,180,255,0.2)',

      filter: 'blur(70px)',
    },

    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',

      marginBottom: 18,
    },

    headerBadge: {
      padding: '5px 12px',

      borderRadius: 999,

      background:
        'linear-gradient(90deg, #00e1ff, #0077ff)',

      color: '#021018',

      fontSize: 10,
      letterSpacing: 1.8,
      fontWeight: 900,
    },

    dayChip: {
      padding: '6px 14px',

      borderRadius: 999,

      background:
        'rgba(255,255,255,0.08)',

      border:
        '1px solid rgba(255,255,255,0.08)',

      color: '#fff',

      fontSize: 11,
    },

    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,

      marginBottom: 18,
    },

    titleIcon: {
      width: 68,
      height: 68,

      borderRadius: 24,

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      fontSize: 34,

      background:
        'linear-gradient(135deg, #00c6ff, #0047ff)',

      boxShadow:
        '0 0 25px rgba(0,180,255,0.45)',

      animation:
        'animePulse 2s infinite',
    },

    title: {
      margin: 0,

      fontSize: 28,

      color: '#fff',

      letterSpacing: 2,

      textShadow:
        '0 0 15px rgba(0,180,255,0.6)',
    },

    subtitle: {
      margin: 0,
      marginTop: 6,

      color: '#9be7ff',

      fontSize: 11,

      letterSpacing: 1.8,
    },

    // PROGRESS
    globalProgressWrapper: {},

    globalProgressHeader: {
      display: 'flex',
      justifyContent: 'space-between',

      marginBottom: 8,

      fontSize: 11,

      color: '#8cefff',

      letterSpacing: 1.2,
    },

    globalProgressTrack: {
      position: 'relative',

      overflow: 'hidden',

      height: 18,

      borderRadius: 999,

      background: '#06111f',

      border:
        '1px solid rgba(0,220,255,0.3)',
    },

    globalProgressFill: {
      height: '100%',

      borderRadius: 999,

      background:
        'linear-gradient(90deg, #00c6ff, #0072ff, #00f0ff)',

      transition: 'width 0.4s ease',

      boxShadow:
        '0 0 20px rgba(0,180,255,0.6)',
    },

    globalProgressShine: {
      position: 'absolute',

      top: 0,
      left: -120,

      width: 120,
      height: '100%',

      background:
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',

      transform: 'skewX(-25deg)',

      animation:
        'glowMove 2s linear infinite',
    },

    // MISSIONS
    missionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },

    missionCard: {
      position: 'relative',

      overflow: 'hidden',

      display: 'flex',
      alignItems: 'center',
      gap: 16,

      borderRadius: 28,

      padding: 16,

      background:
        'linear-gradient(135deg, rgba(12,18,35,0.96), rgba(3,5,10,0.96))',

      border:
        '1px solid rgba(255,255,255,0.06)',

      transition: 'all 0.25s ease',

      backdropFilter: 'blur(10px)',

      boxShadow:
        '0 8px 25px rgba(0,0,0,0.4)',
    },

    missionCompleted: {
      border:
        '1px solid rgba(74,222,128,0.45)',

      boxShadow:
        '0 0 20px rgba(74,222,128,0.15)',
    },

    missionReady: {
      border:
        '1px solid rgba(255,215,0,0.5)',

      animation:
        'animePulse 1.5s infinite',
    },

    cardGlow: {
      position: 'absolute',

      inset: 0,

      background:
        'linear-gradient(120deg, transparent, rgba(255,255,255,0.03), transparent)',
    },

    leftSide: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconFrame: {
      position: 'relative',

      width: 84,
      height: 84,

      borderRadius: 28,

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      background:
        'linear-gradient(135deg, #0b2342, #04101f)',

      border:
        '2px solid rgba(0,220,255,0.35)',

      boxShadow:
        '0 0 18px rgba(0,180,255,0.25)',
    },

    iconPulse: {
      position: 'absolute',

      width: '100%',
      height: '100%',

      borderRadius: 28,

      boxShadow:
        '0 0 25px rgba(0,180,255,0.3)',

      animation:
        'animePulse 2s infinite',
    },

    missionIcon: {
      position: 'relative',

      zIndex: 2,

      fontSize: 38,

      animation:
        'floating 2s ease-in-out infinite',
    },

    centerInfo: {
      flex: 1,
    },

    topRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',

      gap: 12,

      marginBottom: 6,
    },

    missionTitle: {
      fontSize: 16,

      color: '#fff',

      letterSpacing: 1,
    },

    difficultyChip: {
      padding: '5px 10px',

      borderRadius: 999,

      border: '1px solid',

      fontSize: 10,

      fontWeight: 900,

      background:
        'rgba(255,255,255,0.04)',
    },

    missionDesc: {
      fontSize: 11,

      color: '#9aa6b2',

      marginBottom: 14,

      lineHeight: 1.5,
    },

    progressWrapper: {
      marginBottom: 12,
    },

    progressTrack: {
      position: 'relative',

      overflow: 'hidden',

      height: 12,

      borderRadius: 999,

      background: '#08131f',

      border:
        '1px solid rgba(255,255,255,0.06)',

      marginBottom: 6,
    },

    progressFill: {
      height: '100%',

      borderRadius: 999,

      background:
        'linear-gradient(90deg, #00e1ff, #0077ff)',

      boxShadow:
        '0 0 15px rgba(0,180,255,0.45)',

      transition: 'width 0.4s ease',
    },

    progressLight: {
      position: 'absolute',

      top: 0,
      left: -100,

      width: 100,
      height: '100%',

      background:
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',

      transform: 'skewX(-25deg)',

      animation:
        'glowMove 2s infinite',
    },

    progressText: {
      fontSize: 10,

      color: '#8cefff',

      letterSpacing: 1,
    },

    rewardRow: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
    },

    rewardChip: {
      padding: '6px 10px',

      borderRadius: 999,

      background:
        'rgba(0,180,255,0.14)',

      border:
        '1px solid rgba(0,220,255,0.2)',

      color: '#9be7ff',

      fontSize: 10,
    },

    rewardChipCoins: {
      padding: '6px 10px',

      borderRadius: 999,

      background:
        'rgba(255,215,0,0.14)',

      border:
        '1px solid rgba(255,215,0,0.3)',

      color: '#ffd700',

      fontSize: 10,
    },

    rightSide: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // BUTTONS
    startButton: {
      position: 'relative',

      overflow: 'hidden',

      border: 'none',

      padding: '14px 22px',

      borderRadius: 999,

      cursor: 'pointer',

      fontFamily: RUSSO,

      fontSize: 11,

      letterSpacing: 1.2,

      color: '#fff',

      background:
        'linear-gradient(135deg, #00c6ff, #0047ff)',

      boxShadow:
        '0 0 20px rgba(0,180,255,0.35)',

      transition: 'all 0.2s ease',
    },

    claimButton: {
      position: 'relative',

      overflow: 'hidden',

      border: 'none',

      padding: '14px 22px',

      borderRadius: 999,

      cursor: 'pointer',

      fontFamily: RUSSO,

      fontSize: 11,

      letterSpacing: 1.2,

      color: '#101010',

      background:
        'linear-gradient(135deg, #ffe259, #ffa751)',

      boxShadow:
        '0 0 20px rgba(255,200,0,0.45)',

      animation:
        'pulseReward 1.5s infinite',
    },

    buttonGlow: {
      position: 'absolute',

      top: 0,
      left: -120,

      width: 120,
      height: '100%',

      background:
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',

      transform: 'skewX(-20deg)',

      animation:
        'glowMove 1.8s infinite',
    },

    completedBadge: {
      padding: '10px 16px',

      borderRadius: 999,

      background:
        'rgba(74,222,128,0.14)',

      border:
        '1px solid rgba(74,222,128,0.4)',

      color: '#4ade80',

      fontSize: 11,

      fontWeight: 900,
    },

    // CUT-IN
    cutIn: {
      position: 'absolute',

      top: 10,
      right: -70,

      transform: 'rotate(25deg)',

      background:
        'linear-gradient(90deg, #ffe259, #ffa751)',

      color: '#111',

      fontSize: 10,

      padding: '6px 80px',

      fontWeight: 900,

      letterSpacing: 2,

      boxShadow:
        '0 0 18px rgba(255,200,0,0.4)',
    },

    // BONUS
    dailyBonus: {
      position: 'relative',

      overflow: 'hidden',

      marginTop: 20,

      borderRadius: 28,

      padding: 22,

      textAlign: 'center',

      background:
        'linear-gradient(135deg, rgba(255,180,0,0.16), rgba(255,90,0,0.1))',

      border:
        '1px solid rgba(255,180,0,0.25)',
    },

    bonusGlow: {
      position: 'absolute',

      top: -70,
      left: '50%',

      transform: 'translateX(-50%)',

      width: 200,
      height: 200,

      borderRadius: '50%',

      background:
        'rgba(255,180,0,0.2)',

      filter: 'blur(80px)',
    },

    bonusTitle: {
      position: 'relative',

      fontSize: 18,

      color: '#ffd700',

      marginBottom: 10,

      letterSpacing: 2,

      textShadow:
        '0 0 18px rgba(255,215,0,0.45)',
    },

    bonusText: {
      position: 'relative',

      fontSize: 12,

      color: '#fff',

      lineHeight: 1.8,

      letterSpacing: 1,
    },

    bonusReward: {
      position: 'relative',

      marginTop: 14,

      display: 'inline-block',

      padding: '10px 16px',

      borderRadius: 999,

      background:
        'linear-gradient(135deg, #ffe259, #ffa751)',

      color: '#111',

      fontSize: 11,

      fontWeight: 900,

      letterSpacing: 1.2,

      boxShadow:
        '0 0 20px rgba(255,180,0,0.4)',
    },
  };