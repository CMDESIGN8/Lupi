// components/StreakBadge.tsx
import React from 'react';
import { useStreak } from '../hooks/useStreak';

interface StreakBadgeProps {
  userId: string;
  variant?: 'compact' | 'full' | 'minimal';
}

export function StreakBadge({ userId, variant = 'full' }: StreakBadgeProps) {
  const { streakInfo, loading } = useStreak(userId);

  if (loading) {
    return <div className="streak-skeleton">🔥 --</div>;
  }

  const { currentStreak, bestStreak, canClaimReward, daysUntilNextMilestone, nextMilestone } = streakInfo;

  // Estilo según la racha
  const getStreakStyle = () => {
    if (currentStreak >= 30) return 'legendary';
    if (currentStreak >= 14) return 'epic';
    if (currentStreak >= 7) return 'great';
    if (currentStreak >= 3) return 'good';
    return 'normal';
  };

  const streakStyle = getStreakStyle();

  const styles: Record<string, any> = {
    normal: { background: 'var(--surface2)', borderColor: 'var(--border)' },
    good: { background: 'linear-gradient(135deg, #189df5, #0f6bc0)', borderColor: '#189df5' },
    great: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', borderColor: '#ffd700' },
    epic: { background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', borderColor: '#9b59b6' },
    legendary: { background: 'linear-gradient(135deg, #ff4d6d, #ff6b4a)', borderColor: '#ff4d6d', animation: 'pulse-glow 1s infinite' }
  };

  if (variant === 'compact') {
    return (
      <div className="streak-compact" style={styles[streakStyle]}>
        <span>🔥</span>
        <span style={{ fontWeight: 'bold' }}>{currentStreak}</span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="streak-minimal">
        <span>🔥 {currentStreak} días</span>
      </div>
    );
  }

  return (
    <div className="streak-card" style={styles[streakStyle]}>
      <div className="streak-header">
        <span className="streak-icon">🔥</span>
        <div className="streak-info">
          <div className="streak-current">
            <strong>{currentStreak}</strong> días consecutivos
          </div>
          {bestStreak > 0 && (
            <div className="streak-best">
              Récord: {bestStreak} días
            </div>
          )}
        </div>
      </div>

      {canClaimReward && (
        <div className="streak-reward">
          🎁 ¡Recompensa disponible! +{currentStreak === 3 ? '15' : currentStreak === 7 ? '50' : currentStreak === 14 ? '100' : '500'} puntos
        </div>
      )}

      {daysUntilNextMilestone > 0 && daysUntilNextMilestone <= 7 && (
        <div className="streak-next-milestone">
          A {daysUntilNextMilestone} día{daysUntilNextMilestone !== 1 ? 's' : ''} para {nextMilestone} días 🔥
        </div>
      )}

      <div className="streak-progress">
        <div 
          className="streak-progress-bar" 
          style={{ 
            width: `${(currentStreak / nextMilestone) * 100}%`,
            background: 'rgba(255,255,255,0.3)'
          }} 
        />
      </div>
    </div>
  );
}