import React from 'react';
import { UnlockedAchievement, Achievement } from '../hooks/useAchievements';

interface AchievementsModalProps {
  unlocked: UnlockedAchievement[];
  allAchievements: Achievement[];
  onClose: () => void;
}

export function AchievementsModal({ unlocked, allAchievements, onClose }: AchievementsModalProps) {
  const unlockedIds = new Set(unlocked.map(u => u.achievement_id));
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏆 Logros</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <strong>{unlocked.length}</strong> de <strong>{allAchievements.length}</strong> desbloqueados
          </div>
          
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const unlockedData = unlocked.find(u => u.achievement_id === achievement.id);
            
            return (
              <div key={achievement.id} className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-name">
                    {achievement.name}
                    {isUnlocked && <span style={{ marginLeft: 8, fontSize: 12, color: '#4CAF50' }}>✓</span>}
                  </div>
                  <div className="achievement-description">{achievement.description}</div>
                  <div className="achievement-reward">+{achievement.points_reward} pts</div>
                  {unlockedData && (
                    <div className="achievement-date">
                      {new Date(unlockedData.unlocked_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}