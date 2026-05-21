// src/components/DailyMissionsPanel.tsx
import { DailyMission } from '../types/campaignStory';

interface DailyMissionsPanelProps {
  missions: DailyMission[];
  onClaimReward: (missionId: string) => void;
  onStartMission: (mission: DailyMission) => void;
  currentDay: number;
}

export function DailyMissionsPanel({ missions, onClaimReward, onStartMission, currentDay }: DailyMissionsPanelProps) {
  const getMissionButton = (mission: DailyMission) => {
    if (mission.isCompleted && !mission.isClaimed) {
      return (
        <button style={styles.claimButton} onClick={() => onClaimReward(mission.id)}>
          🎁 RECLAMAR
        </button>
      );
    }
    if (!mission.isCompleted) {
      return (
        <button style={styles.startButton} onClick={() => onStartMission(mission)}>
          {getMissionIcon(mission.type)} EMPEZAR
        </button>
      );
    }
    return <div style={styles.completedBadge}>✅ COMPLETADA</div>;
  };

  const getMissionIcon = (type: string) => {
    const icons = {
      play_match: '⚽',
      share: '📱',
      open_pack: '📦',
      watch_ad: '📺',
      complete_training: '💪',
      social_share: '🤝'
    };
    return icons[type as keyof typeof icons] || '✨';
  };

  const getProgressText = (mission: DailyMission) => {
    if (mission.type === 'play_match') {
      return `Partidos: ${mission.currentProgress}/${mission.requirement}`;
    }
    if (mission.type === 'open_pack') {
      return `Sobres: ${mission.currentProgress}/${mission.requirement}`;
    }
    return `${mission.currentProgress}/${mission.requirement}`;
  };

  return (
    <div style={styles.container} className="daily-missions-panel">
      <div style={styles.header}>
        <span style={styles.sunIcon}>☀️</span>
        <h3 style={styles.title}>MISIONES DEL DÍA {currentDay}</h3>
        <span style={styles.streakIcon}>🔥</span>
      </div>
      
      <div style={styles.missionsList}>
        {missions.map(mission => (
          <div key={mission.id} style={styles.missionCard}>
            <div style={styles.missionIcon}>{mission.icon}</div>
            <div style={styles.missionInfo}>
              <div style={styles.missionTitle}>{mission.title}</div>
              <div style={styles.missionDesc}>{mission.description}</div>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${(mission.currentProgress / mission.requirement) * 100}%`
                }} />
              </div>
              <div style={styles.progressText}>{getProgressText(mission)}</div>
              <div style={styles.rewardChip}>✨ +{mission.reward.xp} XP</div>
            </div>
            {getMissionButton(mission)}
          </div>
        ))}
      </div>

      <div style={styles.dailyBonus}>
        <span>⭐ BONUS POR RACHA DIARIA ⭐</span>
        <div>¡Completa todas las misiones por {missions.length} días seguidos y gana un sobre legendario!</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    border: '1px solid #ffd700',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,215,0,0.3)',
  },
  title: {
    color: '#ffd700',
    margin: 0,
    fontSize: 18,
  },
  sunIcon: { fontSize: 24 },
  streakIcon: { fontSize: 24 },
  missionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  missionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 12,
    transition: 'all 0.2s',
  },
  missionIcon: { fontSize: 32 },
  missionInfo: { flex: 1 },
  missionTitle: { fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  missionDesc: { fontSize: 11, color: '#aaa', marginBottom: 8 },
  progressBar: {
    height: 6,
    background: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4ade80, #ffd700)',
    transition: 'width 0.3s',
  },
  progressText: { fontSize: 10, color: '#888', marginBottom: 6 },
  rewardChip: {
    fontSize: 10,
    color: '#ffd700',
    background: 'rgba(255,215,0,0.1)',
    padding: '2px 8px',
    borderRadius: 12,
    display: 'inline-block',
  },
  startButton: {
    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  claimButton: {
    background: '#4ade80',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    animation: 'pulse 1s infinite',
  },
  completedBadge: {
    color: '#4ade80',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  dailyBonus: {
    marginTop: 16,
    padding: 12,
    background: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#ffd700',
  },
};