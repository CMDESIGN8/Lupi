// src/components/UnlockProgress.tsx
import { useState } from 'react';
import { Unlockable, getUnlockablesForWins, getNextUnlockable, getUnlockProgress } from '../utils/unlockSystem';
import { designTokens } from '../styles/designTokens';

interface UnlockProgressProps {
  totalWins: number;
}

export function UnlockProgress({ totalWins }: UnlockProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const unlockables = getUnlockablesForWins(totalWins);
  const nextUnlock = getNextUnlockable(totalWins);
  const progress = getUnlockProgress(totalWins);
  const unlockedCount = unlockables.filter(u => u.isUnlocked).length;

  return (
    <div className="unlock-progress">
      <div className="progress-header" onClick={() => setExpanded(!expanded)}>
        <div className="header-left">
          <span className="header-icon">🏆</span>
          <span className="header-title">PROGRESO DE DESBLOQUEOS</span>
        </div>
        <div className="header-right">
          <span className="unlocked-count">{unlockedCount}/{unlockables.length}</span>
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
        </div>
        <div className="progress-stats">
          <span>{progress.current} victorias</span>
          <span>🎯 {progress.total} necesarias</span>
        </div>
      </div>

      {expanded && (
        <div className="unlockables-grid">
          {unlockables.map(unlock => (
            <div key={unlock.id} className={`unlock-card ${unlock.isUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="unlock-icon">{unlock.icon}</div>
              <div className="unlock-info">
                <div className="unlock-name">{unlock.name}</div>
                <div className="unlock-desc">{unlock.description}</div>
                <div className="unlock-requirement">
                  {unlock.isUnlocked ? (
                    <span className="requirement-met">✅ Desbloqueado</span>
                  ) : (
                    <span className="requirement-pending">🔒 {unlock.requiredWins} victorias necesarias</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {nextUnlock && !expanded && (
        <div className="next-unlock-hint">
          <span>⏩ Próximo: {nextUnlock.name}</span>
          <span className="wins-needed">({nextUnlock.requiredWins - totalWins} victorias más)</span>
        </div>
      )}

      <style>{`
        .unlock-progress {
          background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
          border-radius: 20px;
          margin: 16px 0;
          overflow: hidden;
          border: 1px solid ${designTokens.colors.border};
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .progress-header:hover {
          background: rgba(255,255,255,0.03);
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-icon {
          font-size: 22px;
        }
        .header-title {
          font-weight: bold;
          font-size: 13px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .unlocked-count {
          background: ${designTokens.colors.victory.primary}20;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          color: ${designTokens.colors.victory.primary};
        }
        .expand-icon {
          color: ${designTokens.colors.textMuted};
          font-size: 10px;
        }
        .progress-bar-container {
          padding: 0 18px 14px 18px;
        }
        .progress-track {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: ${designTokens.colors.achievement.gradient};
          border-radius: 10px;
          transition: width 0.5s ${designTokens.animations.springBounce};
          position: relative;
        }
        .progress-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 10px;
          color: ${designTokens.colors.textMuted};
        }
        .unlockables-grid {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid ${designTokens.colors.border};
        }
        .unlock-card {
          display: flex;
          gap: 14px;
          padding: 12px;
          border-radius: 16px;
          transition: all 0.2s;
        }
        .unlock-card.unlocked {
          background: ${designTokens.colors.victory.primary}10;
          border-left: 3px solid ${designTokens.colors.victory.primary};
        }
        .unlock-card.locked {
          background: rgba(255,255,255,0.03);
          border-left: 3px solid ${designTokens.colors.textMuted};
          opacity: 0.7;
        }
        .unlock-icon {
          font-size: 36px;
        }
        .unlock-info {
          flex: 1;
        }
        .unlock-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .unlock-desc {
          font-size: 11px;
          color: ${designTokens.colors.textMuted};
          margin-bottom: 6px;
        }
        .unlock-requirement {
          font-size: 10px;
        }
        .requirement-met {
          color: ${designTokens.colors.victory.primary};
        }
        .requirement-pending {
          color: ${designTokens.colors.achievement.primary};
        }
        .next-unlock-hint {
          padding: 12px 18px;
          background: ${designTokens.colors.achievement.primary}10;
          border-top: 1px solid ${designTokens.colors.border};
          font-size: 11px;
          display: flex;
          justify-content: space-between;
        }
        .wins-needed {
          color: ${designTokens.colors.achievement.primary};
        }
      `}</style>
    </div>
  );
}