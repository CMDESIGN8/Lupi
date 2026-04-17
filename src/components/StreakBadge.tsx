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

  const {
    currentStreak,
    bestStreak,
    canClaimReward,
    daysUntilNextMilestone,
    nextMilestone
  } = streakInfo;

  const getStreakStyle = () => {
    if (currentStreak >= 30) return 'legendary';
    if (currentStreak >= 14) return 'epic';
    if (currentStreak >= 7) return 'great';
    if (currentStreak >= 3) return 'good';
    return 'normal';
  };

  const streakStyle = getStreakStyle();

  if (variant === 'compact') {
    return (
      <div className={`streak-compact ${streakStyle}`}>
        🔥 <strong>{currentStreak}</strong>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="streak-minimal">
        🔥 {currentStreak} días
      </div>
    );
  }

  return (
    <div className={`streak-card ${streakStyle}`}>
      
      {/* HEADER */}
      <div className="streak-header">
        <span className="streak-icon">🔥</span>
        <div>
          <div className="streak-current">
            {currentStreak} días consecutivos
          </div>
          {bestStreak > 0 && (
            <div className="streak-best">
              Récord: {bestStreak} días
            </div>
          )}
        </div>
      </div>

      {/* REWARD DISPONIBLE */}
      {canClaimReward && (
        <div className="streak-reward pulse">
          🎁 ¡Recompensa disponible!
        </div>
      )}

      {/* ALERTA (retención fuerte) */}
      {!canClaimReward && currentStreak > 0 && (
        <div className="streak-warning">
          ⚠️ No pierdas tu racha hoy
        </div>
      )}

      {/* PROGRESO */}
      <div className="streak-progress">
        <div
          className="streak-progress-bar"
          style={{
            width: `${Math.min((currentStreak / nextMilestone) * 100, 100)}%`
          }}
        />
      </div>

      {/* SIGUIENTE META */}
      {daysUntilNextMilestone > 0 && (
        <div className="streak-next-milestone">
          🔥 Te falta {daysUntilNextMilestone} día{daysUntilNextMilestone !== 1 ? 's' : ''} para {nextMilestone}
        </div>
      )}
    </div>
  );
}