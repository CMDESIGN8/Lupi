import React from 'react';
import { DailyMission } from '../../types/campaignStory';

interface Props {
  mission?: DailyMission;
  onOpenAll: () => void;
  onStartMission: (mission: DailyMission) => void;
  onClaimReward: (id: string) => void;
  streak: number;
}

export function DailyMissionPreview({
  mission,
  onOpenAll,
  onStartMission,
  onClaimReward,
  streak,
}: Props) {
  if (!mission) return null;

  const progress =
    (mission.currentProgress / mission.requirement) * 100;

  const isClaim =
    mission.isCompleted && !mission.isClaimed;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>
            DAILY QUEST
          </div>

          <div style={styles.title}>
            MISIONES DIARIAS
          </div>

          <div style={styles.subtitle}>
            COMPLETA DESAFÍOS Y GANA PODER
          </div>
        </div>

        <button
          style={styles.allButton}
          onClick={onOpenAll}
        >
          VER
        </button>
      </div>

      {/* CARD */}
      <div style={styles.card}>
        <div style={styles.iconBox}>
          {mission.icon || '⚽'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={styles.missionTitle}>
            {mission.title}
          </div>

          <div style={styles.desc}>
            {mission.description}
          </div>

          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress}%`,
              }}
            />
          </div>

          <div style={styles.progressText}>
            {mission.currentProgress}/
            {mission.requirement}
          </div>

          <div style={styles.rewardRow}>
            ✨ +{mission.reward.xp} XP
            {mission.reward.coins &&
              ` • 🪙 ${mission.reward.coins}`}
          </div>
        </div>

        <button
          style={
            isClaim
              ? styles.claimButton
              : styles.playButton
          }
          onClick={() =>
            isClaim
              ? onClaimReward(mission.id)
              : onStartMission(mission)
          }
        >
          {isClaim ? 'CLAIM' : 'JUGAR'}
        </button>
      </div>

      {/* STREAK */}
      <div style={styles.footer}>
        🔥 RACHA {streak} DÍAS
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> =
  {
    container: {
      borderRadius: 28,
      padding: 18,
      background:
        'linear-gradient(180deg,#07111d,#04070f)',
      border:
        '1px solid rgba(0,220,255,.18)',
      marginBottom: 18,
      boxShadow:
        '0 0 20px rgba(0,180,255,.15)',
    },

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 14,
    },

    badge: {
      fontSize: 9,
      color: '#00d9ff',
      marginBottom: 4,
      letterSpacing: 2,
    },

    title: {
      color: '#fff',
      fontWeight: 900,
      fontSize: 28,
      lineHeight: 1,
    },

    subtitle: {
      color: '#7ddfff',
      fontSize: 10,
      marginTop: 4,
    },

    allButton: {
      border: 'none',
      borderRadius: 999,
      padding: '10px 18px',
      background:
        'linear-gradient(135deg,#00c6ff,#0047ff)',
      color: '#fff',
      fontWeight: 900,
      cursor: 'pointer',
    },

    card: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      borderRadius: 24,
      padding: 16,
      background:
        'rgba(255,255,255,.03)',
      border:
        '1px solid rgba(255,255,255,.06)',
    },

    iconBox: {
      width: 70,
      height: 70,
      borderRadius: 20,
      background:
        'linear-gradient(135deg,#00c6ff,#0047ff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 30,
      flexShrink: 0,
    },

    missionTitle: {
      color: '#fff',
      fontWeight: 900,
      fontSize: 15,
    },

    desc: {
      color: '#98a6b5',
      fontSize: 11,
      marginTop: 4,
      marginBottom: 10,
    },

    progressBar: {
      height: 10,
      borderRadius: 999,
      background: '#09131f',
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      background:
        'linear-gradient(90deg,#00e1ff,#0077ff)',
    },

    progressText: {
      fontSize: 10,
      color: '#8cefff',
      marginTop: 6,
    },

    rewardRow: {
      marginTop: 10,
      color: '#ffd700',
      fontSize: 11,
    },

    playButton: {
      border: 'none',
      borderRadius: 999,
      padding: '14px 18px',
      background:
        'linear-gradient(135deg,#00c6ff,#0047ff)',
      color: '#fff',
      fontWeight: 900,
      cursor: 'pointer',
    },

    claimButton: {
      border: 'none',
      borderRadius: 999,
      padding: '14px 18px',
      background:
        'linear-gradient(135deg,#ffe259,#ffa751)',
      color: '#111',
      fontWeight: 900,
      cursor: 'pointer',
    },

    footer: {
      marginTop: 12,
      fontSize: 11,
      color: '#ffd700',
      textAlign: 'center',
    },
  };