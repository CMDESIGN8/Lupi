// src/components/UserFifaCard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserCardStats, RARITY_CONFIG } from '../utils/userProgression';
import { StreakBadge } from './StreakBadge';

interface UserFifaCardProps {
  userId: string;
  username: string;
  club: string;
  clubRank?: number;
  onLevelUp?: (newLevel: number, newRarity: string) => void;
}

export function UserFifaCard({ userId, username, club, clubRank = 0, onLevelUp }: UserFifaCardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastLevel, setLastLevel] = useState(0);
  const [lastStatUpgrade, setLastStatUpgrade] = useState<{ stat: string; value: number; oldValue: number } | null>(null);

  useEffect(() => {
    loadStats();
    
    const subscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => loadStats()
      )
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, [userId]);

  const loadStats = async () => {
    try {
      const newStats = await getUserCardStats(userId);
      
      if (stats && newStats.level > stats.level) {
        setLastLevel(newStats.level);
        setShowLevelUp(true);
        if (onLevelUp) onLevelUp(newStats.level, newStats.rarity);
        setTimeout(() => setShowLevelUp(false), 3000);
      }

      // Detectar cambios en stats
      if (stats) {
        const statChanges = [
          { stat: '⚡ Velocidad', key: 'pace', oldValue: stats.pace, newValue: newStats.pace },
          { stat: '✨ Regate', key: 'dribbling', oldValue: stats.dribbling, newValue: newStats.dribbling },
          { stat: '⚽ Pase', key: 'passing', oldValue: stats.passing, newValue: newStats.passing },
          { stat: '🛡️ Defensa', key: 'defending', oldValue: stats.defending, newValue: newStats.defending },
          { stat: '🎯 Remate', key: 'finishing', oldValue: stats.finishing, newValue: newStats.finishing },
          { stat: '💪 Físico', key: 'physical', oldValue: stats.physical, newValue: newStats.physical }
        ];
        
        for (const change of statChanges) {
          if (change.newValue > change.oldValue) {
            setLastStatUpgrade({
              stat: change.stat,
              value: change.newValue,
              oldValue: change.oldValue
            });
            setTimeout(() => setLastStatUpgrade(null), 2500);
            break;
          }
        }
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="user-card-skeleton"><div className="spinner" /></div>;
  if (!stats) return null;

  const rarity = RARITY_CONFIG[stats.rarity as keyof typeof RARITY_CONFIG];
  const progressPercent = (stats.exp / stats.expNeeded) * 100;

  // Determinar el color del borde según rareza
  const getBorderGradient = () => {
    switch (stats.rarity) {
      case 'elite': return 'linear-gradient(135deg, #9B59B6, #FFD700)';
      case 'ruby': return 'linear-gradient(135deg, #E0115F, #FF6B6B)';
      case 'sapphire': return 'linear-gradient(135deg, #0F52BA, #4A90E2)';
      case 'gold': return 'linear-gradient(135deg, #FFD700, #FFA500)';
      case 'silver': return 'linear-gradient(135deg, #C0C0C0, #E8E8E8)';
      default: return 'linear-gradient(135deg, #CD7F32, #A0522D)';
    }
  };

  return (
    <>
      {/* Notificaciones flotantes */}
      {showLevelUp && (
        <div className="level-up-notification">
          <div className="level-up-content">
            <span className="level-up-icon">🎉</span>
            <div>
              <div className="level-up-title">¡SUBISTE DE NIVEL!</div>
              <div className="level-up-detail">Nivel {lastLevel} → {stats.level}</div>
            </div>
          </div>
        </div>
      )}

      {lastStatUpgrade && (
        <div className="stat-upgrade-notification">
          <span className="stat-upgrade-icon">⬆️</span>
          <span>{lastStatUpgrade.stat} {lastStatUpgrade.oldValue} → {lastStatUpgrade.value}</span>
        </div>
      )}

      {/* Carta FIFA principal */}
<div className="fifa-card" style={{ 
  borderImage: getBorderGradient(), 
  borderImageSlice: 1,
  width: '100%',
  marginBottom: '20px',
  boxSizing: 'border-box'
}}>
        {/* Header con rareza y nivel */}
        <div className="fifa-card-header">
          <div className="fifa-rarity" style={{ background: rarity.color }}>
            {rarity.icon} {rarity.name}
          </div>
          <div className="fifa-level">Nivel {stats.level}</div>
        </div>

        {/* Info del jugador */}
        <div className="fifa-player-info">
          <div className="fifa-avatar" style={{ borderColor: rarity.color }}>
            <span className="fifa-avatar-icon">👤</span>
            <span className="fifa-avatar-level">{stats.level}</span>
          </div>
          <div className="fifa-player-details">
            <div className="fifa-player-name">{username}</div>
            <div className="fifa-player-club">🏟️ {club}</div>
          </div>
          <div className="fifa-overall">
            <span className="fifa-overall-label">OVR</span>
            <span className="fifa-overall-value">{Math.floor((stats.pace + stats.dribbling + stats.passing + stats.defending + stats.finishing + stats.physical) / 6)}</span>
          </div>
        </div>

        {/* Stats grid estilo FIFA */}
        <div className="fifa-stats-grid">
          <div className="fifa-stat">
            <div className="fifa-stat-icon">⚡</div>
            <div className="fifa-stat-info">
              <span className="fifa-stat-label">Velocidad</span>
              <span className="fifa-stat-value">{stats.pace}</span>
            </div>
            <div className="fifa-stat-bar">
              <div className="fifa-stat-fill" style={{ width: `${(stats.pace / 99) * 100}%`, background: '#4CAF50' }} />
            </div>
          </div>
          <div className="fifa-stat">
            <div className="fifa-stat-icon">✨</div>
            <div className="fifa-stat-info">
              <span className="fifa-stat-label">Regate</span>
              <span className="fifa-stat-value">{stats.dribbling}</span>
            </div>
            <div className="fifa-stat-bar">
              <div className="fifa-stat-fill" style={{ width: `${(stats.dribbling / 99) * 100}%`, background: '#2196F3' }} />
            </div>
          </div>
          <div className="fifa-stat">
            <div className="fifa-stat-icon">⚽</div>
            <div className="fifa-stat-info">
              <span className="fifa-stat-label">Pase</span>
              <span className="fifa-stat-value">{stats.passing}</span>
            </div>
            <div className="fifa-stat-bar">
              <div className="fifa-stat-fill" style={{ width: `${(stats.passing / 99) * 100}%`, background: '#FF9800' }} />
            </div>
          </div>
          <div className="fifa-stat">
            <div className="fifa-stat-icon">🛡️</div>
            <div className="fifa-stat-info">
              <span className="fifa-stat-label">Defensa</span>
              <span className="fifa-stat-value">{stats.defending}</span>
            </div>
            <div className="fifa-stat-bar">
              <div className="fifa-stat-fill" style={{ width: `${(stats.defending / 99) * 100}%`, background: '#9C27B0' }} />
            </div>
          </div>
          <div className="fifa-stat">
            <div className="fifa-stat-icon">🎯</div>
            <div className="fifa-stat-info">
              <span className="fifa-stat-label">Remate</span>
              <span className="fifa-stat-value">{stats.finishing}</span>
            </div>
            <div className="fifa-stat-bar">
              <div className="fifa-stat-fill" style={{ width: `${(stats.finishing / 99) * 100}%`, background: '#E91E63' }} />
            </div>
          </div>
          <div className="fifa-stat">
            <div className="fifa-stat-icon">💪</div>
            <div className="fifa-stat-info">
              <span className="fifa-stat-label">Físico</span>
              <span className="fifa-stat-value">{stats.physical}</span>
            </div>
            <div className="fifa-stat-bar">
              <div className="fifa-stat-fill" style={{ width: `${(stats.physical / 99) * 100}%`, background: '#00BCD4' }} />
            </div>
          </div>
        </div>

        {/* Barra de experiencia */}
        <div className="fifa-exp-section">
          <div className="fifa-exp-header">
            <span className="fifa-exp-icon">⭐</span>
            <span className="fifa-exp-label">Experiencia</span>
            <span className="fifa-exp-values">{stats.exp} / {stats.expNeeded}</span>
          </div>
          <div className="fifa-exp-bar">
            <div className="fifa-exp-fill" style={{ width: `${progressPercent}%`, background: rarity.color }} />
          </div>
        </div>

        {/* Próxima rareza */}
        {stats.rarity !== 'elite' && (
          <div className="fifa-next-rarity">
            <span>📈 Próxima rareza: {getNextRarityIcon(stats.rarity)} en nivel {getNextRarityLevel(stats.rarity)}</span>
          </div>
        )}

        {/* Estadísticas de tracking */}
        <div className="fifa-tracking">
          <div className="fifa-tracking-item" title="Entradas cargadas">
            <span className="tracking-icon">🎟️</span>
            <span className="tracking-value">{stats.total_tickets}</span>
          </div>
          <div className="fifa-tracking-item" title="Batallas jugadas">
            <span className="tracking-icon">⚔️</span>
            <span className="tracking-value">{stats.total_battles}</span>
          </div>
          <div className="fifa-tracking-item" title="Victorias">
            <span className="tracking-icon">🏆</span>
            <span className="tracking-value">{stats.total_wins}</span>
          </div>
          <div className="fifa-tracking-item" title="Compartidos">
            <span className="tracking-icon">📤</span>
            <span className="tracking-value">{stats.total_shares}</span>
          </div>
          <div className="fifa-tracking-item" title="Referidos">
            <span className="tracking-icon">👥</span>
            <span className="tracking-value">{stats.total_referrals}</span>
          </div>
        </div>

        {/* Badge de racha y ranking de club */}
        <div className="fifa-badges">
          <StreakBadge userId={userId} variant="full" />
          {clubRank > 0 && (
            <div className={`club-rank-badge ${clubRank === 1 ? 'top' : clubRank <= 3 ? 'good' : ''}`}>
  <div className="rank-icon">
    {clubRank === 1 ? '🏆' : clubRank <= 3 ? '🔥' : '⭐'}
  </div>

  <div className="rank-info">
    <span className="rank-position">#{clubRank}</span>
    <span className="rank-text">Ranking del Club</span>
  </div>
</div>
          )}
        </div>
      </div>

      <style>{`
        .fifa-card {
  background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
  border-radius: 24px;
  padding: 20px;
  margin: 0 0 20px 0;
  border: 2px solid transparent;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}
        
        .fifa-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .fifa-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .fifa-rarity {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          color: #0a0a0f;
        }
        
        .fifa-level {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--text2);
          background: rgba(255,255,255,0.05);
          padding: 4px 12px;
          border-radius: 20px;
        }
        
        .fifa-player-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .fifa-avatar {
          position: relative;
          width: 64px;
          height: 64px;
          background: var(--surface2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
        }
        
        .fifa-avatar-icon {
          font-size: 32px;
        }
        
        .fifa-avatar-level {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: var(--accent);
          color: #0a0a0f;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }
        
        .fifa-player-details {
          flex: 1;
        }
        
        .fifa-player-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: bold;
        }
        
        .fifa-player-club {
          font-size: 12px;
          color: var(--text2);
        }
        
        .fifa-overall {
          text-align: center;
          background: rgba(0,0,0,0.5);
          padding: 6px 12px;
          border-radius: 12px;
        }
        
        .fifa-overall-label {
          font-size: 10px;
          color: var(--text2);
          display: block;
        }
        
        .fifa-overall-value {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
        }
        
        .fifa-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 12px;
        }
        
        .fifa-stat {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .fifa-stat-icon {
          font-size: 20px;
          width: 32px;
        }
        
        .fifa-stat-info {
          flex: 1;
        }
        
        .fifa-stat-label {
          font-size: 10px;
          color: var(--text2);
          display: block;
        }
        
        .fifa-stat-value {
          font-size: 14px;
          font-weight: bold;
        }
        
        .fifa-stat-bar {
          width: 60px;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .fifa-stat-fill {
          height: 100%;
          border-radius: 2px;
        }
        
        .fifa-exp-section {
          margin-bottom: 16px;
        }
        
        .fifa-exp-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .fifa-exp-icon {
          font-size: 14px;
        }
        
        .fifa-exp-label {
          flex: 1;
          color: var(--text2);
        }
        
        .fifa-exp-values {
          color: var(--accent);
        }
        
        .fifa-exp-bar {
          height: 8px;
          background: var(--surface2);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .fifa-exp-fill {
          height: 100%;
          transition: width 0.3s;
        }
        
        .fifa-next-rarity {
          text-align: center;
          font-size: 11px;
          color: var(--text2);
          margin-bottom: 16px;
          padding: 8px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }
        
        .fifa-tracking {
          display: flex;
          justify-content: space-around;
          padding: 12px;
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          margin-bottom: 12px;
        }
        
        .fifa-tracking-item {
          text-align: center;
          cursor: help;
        }
        
        .tracking-icon {
          font-size: 16px;
          display: block;
          margin-bottom: 4px;
        }
        
        .tracking-value {
          font-size: 12px;
          font-weight: bold;
        }
        
        .fifa-badges {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .club-rank-badge {
  display: flex;
  align-items: center;
  gap: 12px;

  margin: 12px 0;
  padding: 12px 16px;

  border-radius: 14px;

  background: linear-gradient(
    145deg,
    rgba(255,255,255,0.05),
    rgba(255,255,255,0.02)
  );

  border: 1px solid rgba(255,255,255,0.12);

  backdrop-filter: blur(6px);

  box-shadow:
    0 4px 14px rgba(0,0,0,0.25),
    inset 0 1px 2px rgba(255,255,255,0.1);

  transition: all 0.25s ease;
}

/* ICONO */
.rank-icon {
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* CONTENIDO */
.rank-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

/* NUMERO GRANDE */
.rank-position {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

/* TEXTO CHICO */
.rank-text {
  font-size: 11px;
  opacity: 0.7;
}

/* 🟢 TOP */
.club-rank-badge.top {
  border-color: rgba(0,255,136,0.6);
  color: #00ff88;

  box-shadow:
    0 0 12px rgba(0,255,136,0.4),
    inset 0 0 10px rgba(0,255,136,0.15);
}

/* 🟡 TOP 3 */
.club-rank-badge.good {
  border-color: rgba(255,200,0,0.6);
  color: #ffd54f;

  box-shadow:
    0 0 10px rgba(255,200,0,0.3),
    inset 0 0 8px rgba(255,200,0,0.1);
}

/* HOVER */
.club-rank-badge:hover {
  transform: translateY(-2px) scale(1.02);
}
        
        .level-up-notification {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          animation: slideDown 0.3s ease-out;
        }
        
        .level-up-content {
          background: linear-gradient(135deg, #ffd700, #ff8c00);
          border-radius: 60px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .level-up-icon { font-size: 28px; }
        .level-up-title { font-weight: bold; color: #0a0a0f; }
        .level-up-detail { font-size: 12px; color: #0a0a0f; opacity: 0.8; }
        
        .stat-upgrade-notification {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          padding: 10px 20px;
          border-radius: 60px;
          font-size: 14px;
          font-weight: bold;
          z-index: 1000;
          animation: fadeUp 0.3s ease-out;
          white-space: nowrap;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        .user-card-skeleton {
          background: var(--surface);
          border-radius: 24px;
          padding: 20px;
          margin: 16px 0;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}

function getNextRarityIcon(currentRarity: string): string {
  const order = ['bronze', 'silver', 'gold', 'sapphire', 'ruby', 'elite'];
  const icons: Record<string, string> = {
    bronze: '🟤 Bronce', silver: '⚪ Plata', gold: '🟡 Oro', 
    sapphire: '💎 Zafiro', ruby: '🔥 Rubí', elite: '👑 Élite'
  };
  const index = order.indexOf(currentRarity);
  const next = order[index + 1];
  return icons[next] || '👑 Élite';
}

function getNextRarityLevel(currentRarity: string): number {
  const levels: Record<string, number> = {
    bronze: 20, silver: 40, gold: 60, sapphire: 80, ruby: 100
  };
  return levels[currentRarity] || 100;
}