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

  function getNextRarityData(currentRarity: string): { name: string; icon: string; levelRequired: number } {
  const rarityMap: Record<string, { name: string; icon: string; levelRequired: number }> = {
    bronze: { name: 'Plata', icon: '⚪', levelRequired: 20 },
    silver: { name: 'Oro', icon: '🟡', levelRequired: 40 },
    gold: { name: 'Zafiro', icon: '💎', levelRequired: 60 },
    sapphire: { name: 'Rubí', icon: '🔥', levelRequired: 80 },
    ruby: { name: 'Élite', icon: '👑', levelRequired: 100 },
  };
  return rarityMap[currentRarity] || { name: 'Élite', icon: '👑', levelRequired: 100 };
}

function getCurrentRarityMinLevel(rarity: string): number {
  const levels: Record<string, number> = {
    bronze: 1,
    silver: 20,
    gold: 40,
    sapphire: 60,
    ruby: 80,
    elite: 100,
  };
  return levels[rarity] || 1;
}

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
            <div 
  className="fifa-player-club"
  style={
    clubRank === 1 
      ? { background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))', borderColor: '#00ff88', color: '#00ff88' }
      : clubRank <= 3 
        ? { background: 'linear-gradient(135deg, rgba(255,200,0,0.15), rgba(255,200,0,0.05))', borderColor: '#ffc107', color: '#ffd54f' }
        : {}
  }
>
  <span className="club-icon">🏟️</span>
  <span className="club-name">{club}</span>
  {clubRank === 1 && <span className="rank-badge">🏆 #1</span>}
  {clubRank === 2 && <span className="rank-badge">🥈 #2</span>}
  {clubRank === 3 && <span className="rank-badge">🥉 #3</span>}
</div>
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
        {/* Próxima rareza - con progreso real */}
{stats.rarity !== 'elite' && (() => {
  const nextRarity = getNextRarityData(stats.rarity);
  const expToNextRarity = nextRarity.levelRequired - stats.level;
  const expProgress = ((stats.level - getCurrentRarityMinLevel(stats.rarity)) / 
                       (nextRarity.levelRequired - getCurrentRarityMinLevel(stats.rarity))) * 100;
  const isAlmostThere = expProgress >= 80;
  
  return (
    <div className="fifa-next-rarity">
      {isAlmostThere && <div className="next-rarity-badge">⚡ ¡CASI! ⚡</div>}
      
      <div className="next-rarity-tooltip">
        <div className="tooltip-title">🎁 Alcanza {nextRarity.name}</div>
        <div className="tooltip-reward">✨ +15% en todas las stats</div>
        <div className="tooltip-reward">🏆 Skin exclusiva de carta</div>
        <div className="tooltip-reward">⚡ Habilidad especial desbloqueada</div>
      </div>
      
      <div className="next-rarity-content">
        <div className="next-rarity-info">
          <span className="next-rarity-label">Próxima rareza</span>
          <div className="next-rarity-name">
            <span className="next-rarity-icon">{nextRarity.icon}</span>
            <span>{nextRarity.name}</span>
          </div>
        </div>
        
        <div className="next-rarity-progress">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, expProgress)}%` }} />
          </div>
          <div className="progress-text">
            <span>Nivel {stats.level}</span>
            <span>{nextRarity.levelRequired - stats.level} niveles para {nextRarity.name}</span>
          </div>
        </div>
        
        <div className="next-rarity-arrow">→</div>
      </div>
    </div>
  );
})()}

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
       background: linear-gradient(145deg,
    #1a3a1a 0%,
    #0d2a0d 30%,
    #2a1a0a 70%,
    #1a0f05 100%
  );
  border-radius: 20px;
  padding: 0;
  margin: 0 0 20px 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  backdrop-filter: blur(2px);
}

/* Efecto shine al hover */
.fifa-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

.fifa-card:hover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  animation: cardShine 0.6s ease-in-out;
  pointer-events: none;
}

/* Borde dinámico según rareza */
.fifa-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  background: 
  var(--card-border, linear-gradient(135deg, #CD7F32, #A0522D));
  
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}


/* Patrón de puntos de suerte sutil */
.fifa-card::after {
  content: '';
  position: absolute;
  bottom: 15%;
  left: -10%;
  width: 120%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255,255,255,0.08) 20%,
    rgba(255,255,255,0.12) 50%,
    rgba(255,255,255,0.08) 80%,
    transparent
  );
  transform: rotate(-3deg);
  pointer-events: none;
}
        
        /* Header con patrón de fondo */
.fifa-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

/* ── RARITY ESTILO FIFA ULTIMATE TEAM PREMIUM ── */

.fifa-rarity {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 40px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  background: var(--rarity-bg, linear-gradient(135deg, #CD7F32, #A0522D));
  background-size: 200% auto;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: default;
  white-space: nowrap;
}

/* Efecto shine al hover */
.fifa-rarity:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.25);
  letter-spacing: 2px;
}

.fifa-rarity:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
  animation: rarityShine 0.6s ease-in-out;
  pointer-events: none;
}

@keyframes rarityShine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Icono de rareza */
.fifa-rarity .rarity-icon {
  font-size: 12px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  transition: transform 0.2s ease;
}

.fifa-rarity:hover .rarity-icon {
  transform: scale(1.1) rotate(5deg);
}

/* Texto de rareza */
.fifa-rarity .rarity-text {
  font-family: 'Teko', 'Poppins', sans-serif;
  font-weight: 800;
}

/* ── VARIANTES POR RAREZA ── */

/* Rareza Bronce */
.fifa-rarity.bronze {
  background: linear-gradient(135deg, #cd7f32, #a0522d, #8b4513);
  background-size: 200% auto;
  box-shadow: 0 4px 12px rgba(205,127,50,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
}

.fifa-rarity.bronze:hover {
  box-shadow: 0 6px 18px rgba(205,127,50,0.4);
}

/* Rareza Plata */
.fifa-rarity.silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8, #909090);
  background-size: 200% auto;
  color: #1a1a2e;
  text-shadow: 0 1px 1px rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(192,192,192,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}

/* Rareza Oro */
.fifa-rarity.gold {
  background: linear-gradient(135deg, #ffd700, #ffaa00, #ff8c00);
  background-size: 200% auto;
  animation: goldShine 3s ease-in-out infinite;
  box-shadow: 0 4px 15px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25);
}

@keyframes goldShine {
  0%, 100% {
    background-position: 0% center;
    box-shadow: 0 4px 12px rgba(255,215,0,0.3);
  }
  50% {
    background-position: 100% center;
    box-shadow: 0 6px 20px rgba(255,215,0,0.5);
  }
}

/* Rareza Zafiro */
.fifa-rarity.sapphire {
  background: linear-gradient(135deg, #3498db, #2980b9, #1a5276);
  background-size: 200% auto;
  box-shadow: 0 4px 12px rgba(52,152,219,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
}

.fifa-rarity.sapphire:hover {
  box-shadow: 0 6px 18px rgba(52,152,219,0.4);
}

/* Rareza Rubí */
.fifa-rarity.ruby {
  background: linear-gradient(135deg, #e0115f, #c40e54, #8b0a3a);
  background-size: 200% auto;
  box-shadow: 0 4px 12px rgba(224,17,95,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  animation: rubyGlow 2s ease-in-out infinite;
}

@keyframes rubyGlow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(224,17,95,0.3);
  }
  50% {
    box-shadow: 0 6px 20px rgba(224,17,95,0.6);
  }
}

/* Rareza Élite */
.fifa-rarity.elite {
  background: linear-gradient(135deg, #9b59b6, #8e44ad, #6c3483);
  background-size: 200% auto;
  animation: elitePulse 2s ease-in-out infinite;
  box-shadow: 0 4px 15px rgba(155,89,182,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
}

@keyframes elitePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(155,89,182,0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(155,89,182,0.7);
  }
}

/* Rareza Legendaria */
.fifa-rarity.legendary {
  background: linear-gradient(135deg, #ffd700, #ff8c00, #ff4500, #ffd700);
  background-size: 300% auto;
  animation: legendaryShine 2s linear infinite;
  box-shadow: 0 4px 20px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
  letter-spacing: 2px;
}

@keyframes legendaryShine {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 300% center;
  }
}

/* ── VARIANTES DE TAMAÑO ── */

/* Rareza pequeña */
.fifa-rarity.small {
  padding: 3px 10px;
  font-size: 9px;
  letter-spacing: 1px;
}

.fifa-rarity.small .rarity-icon {
  font-size: 9px;
}

/* Rareza grande */
.fifa-rarity.large {
  padding: 8px 20px;
  font-size: 13px;
  letter-spacing: 2px;
}

.fifa-rarity.large .rarity-icon {
  font-size: 14px;
}

/* ── VARIANTES DE ESTILO ── */

/* Rareza con borde brillante */
.fifa-rarity.glow-border {
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.2),
    0 0 0 1px rgba(255,215,0,0.5);
}

/* Rareza tipo neon */
.fifa-rarity.neon {
  animation: neonPulse 1.5s ease-in-out infinite;
}

@keyframes neonPulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 5px currentColor;
  }
  50% {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 15px currentColor;
  }
}

/* Rareza con efecto de cristal */
.fifa-rarity.glass {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  text-shadow: none;
}

/* Rareza con gradiente animado vertical */
.fifa-rarity.vertical {
  background: linear-gradient(180deg, #ffd700, #ff8c00);
  background-size: 100% 200%;
  animation: verticalShine 3s ease-in-out infinite;
}

@keyframes verticalShine {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 0% 100%;
  }
}

/* ── CON BADGE DE NUEVO ── */
.fifa-rarity .new-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
  font-size: 8px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 20px;
  animation: newBadgeBounce 0.5s ease-out;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

@keyframes newBadgeBounce {
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.2) rotate(3deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .fifa-rarity {
    padding: 4px 12px;
    font-size: 9px;
    letter-spacing: 1px;
  }
  
  .fifa-rarity.large {
    padding: 6px 16px;
    font-size: 11px;
  }
  
  .fifa-rarity .rarity-icon {
    font-size: 10px;
  }
  
  .fifa-rarity.small {
    padding: 2px 8px;
    font-size: 8px;
  }
}

/* ── ANIMACIÓN DE ENTRADA ── */
.fifa-rarity.animate-in {
  animation: raritySlideIn 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}

@keyframes raritySlideIn {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ── EFECTO DE CARGA ── */
.fifa-rarity.loading {
  animation: rarityLoading 1.5s ease-in-out infinite;
  filter: grayscale(0.3);
}

@keyframes rarityLoading {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* ── ESTILO CON ÍCONO A LA DERECHA ── */
.fifa-rarity.icon-right {
  flex-direction: row-reverse;
}

/* ── VARIANTE CON SOLO ÍCONO ── */
.fifa-rarity.icon-only {
  padding: 6px 10px;
}

.fifa-rarity.icon-only .rarity-text {
  display: none;
}

.fifa-rarity.icon-only .rarity-icon {
  font-size: 14px;
  margin: 0;
}

.fifa-level {
  font-family: 'Teko', 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: #ffd700;
  background: linear-gradient(145deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8));
  padding: 5px 14px;
  border-radius: 40px;
  border: 1px solid rgba(255,215,0,0.4);
  letter-spacing: 1px;
  backdrop-filter: blur(4px);
  box-shadow: 
    0 2px 8px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

/* Efecto shine al hover */
.fifa-level:hover {
  transform: translateY(-2px);
  border-color: rgba(255,215,0,0.7);
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.15),
    0 0 10px rgba(255,215,0,0.3);
}

.fifa-level:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  animation: levelShine 0.6s ease-in-out;
  pointer-events: none;
}

@keyframes levelShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Número de nivel */
.fifa-level .level-number {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 16px;
  font-weight: 900;
  margin: 0 2px;
}

.fifa-player-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}



.fifa-player-info:hover::after {
  opacity: 1;
}

.fifa-avatar {
  position: relative;
  width: 70px;
  height: 70px;
  background: linear-gradient(145deg, #2a2a3e, #1a1a2e);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-color: var(--avatar-border, #ffd700);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

/* ── AVATAR ICON ESTILO FIFA ULTIMATE TEAM PREMIUM ── */

.fifa-avatar-icon {
  font-size: 42px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
}

/* Efecto hover en el icono */
.fifa-avatar:hover .fifa-avatar-icon {
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5));
}

/* Variantes de tamaño del icono */
.fifa-avatar-icon.small {
  font-size: 32px;
}

.fifa-avatar-icon.large {
  font-size: 52px;
}

.fifa-avatar-icon.xlarge {
  font-size: 64px;
}

/* Icono con brillo */
.fifa-avatar-icon.glow {
  animation: iconGlow 2s ease-in-out infinite;
}

@keyframes iconGlow {
  0%, 100% {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)) drop-shadow(0 0 0px rgba(255,215,0,0));
  }
  50% {
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(255,215,0,0.5));
  }
}

/* Icono con rotación continua (para ítems especiales) */
.fifa-avatar-icon.spin {
  animation: iconSpin 3s linear infinite;
}

@keyframes iconSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Icono con efecto de rebote */
.fifa-avatar-icon.bounce {
  animation: iconBounce 0.5s ease-out;
}

@keyframes iconBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── AVATAR LEVEL ESTILO FIFA ULTIMATE TEAM PREMIUM ── */

.fifa-avatar-level {
  position: absolute;
  bottom: -6px;
  right: -8px;
  background: linear-gradient(145deg, #ffd700, #ff8c00, #ffb347);
  background-size: 200% auto;
  color: #0a0a0f;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Teko', 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 900;
  border: 2.5px solid #1a1a2e;
  box-shadow: 
    0 3px 8px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 3;
  backdrop-filter: blur(2px);
}

/* Efecto hover en el nivel */
.fifa-avatar:hover .fifa-avatar-level {
  transform: scale(1.15);
  background: linear-gradient(145deg, #ffed4e, #ffaa00);
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.4),
    0 0 10px rgba(255,215,0,0.5);
}

/* Animación de subida de nivel */
.fifa-avatar-level.updating {
  animation: levelUpdate 0.5s cubic-bezier(0.34, 1.3, 0.64, 1);
}

@keyframes levelUpdate {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.3);
    background: linear-gradient(145deg, #ffed4e, #ffaa00);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

/* ── VARIANTES POR RAREZA DEL NIVEL ── */

/* Level Bronce */
.fifa-avatar-level.bronze {
  background: linear-gradient(145deg, #cd7f32, #b8682a);
  color: #fff;
}

/* Level Plata */
.fifa-avatar-level.silver {
  background: linear-gradient(145deg, #c0c0c0, #a0a0a0);
  color: #0a0a0f;
}

/* Level Oro */
.fifa-avatar-level.gold {
  background: linear-gradient(145deg, #ffd700, #ff8c00);
  animation: goldPulse 2s ease-in-out infinite;
}

@keyframes goldPulse {
  0%, 100% {
    box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0px rgba(255,215,0,0);
  }
  50% {
    box-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 12px rgba(255,215,0,0.6);
  }
}

/* Level Zafiro */
.fifa-avatar-level.sapphire {
  background: linear-gradient(145deg, #3498db, #2471a3);
  color: #fff;
  box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 8px rgba(52,152,219,0.3);
}

/* Level Rubí */
.fifa-avatar-level.ruby {
  background: linear-gradient(145deg, #e0115f, #c40e54);
  color: #fff;
  box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 8px rgba(224,17,95,0.3);
}

/* Level Élite */
.fifa-avatar-level.elite {
  background: linear-gradient(145deg, #9b59b6, #7d3c98);
  color: #fff;
  animation: eliteLevelGlow 1.5s ease-in-out infinite;
  box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 12px rgba(155,89,182,0.4);
}

@keyframes eliteLevelGlow {
  0%, 100% {
    box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 8px rgba(155,89,182,0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 20px rgba(155,89,182,0.8);
    transform: scale(1.05);
  }
}

/* ── VARIANTES DE TAMAÑO ── */

/* Level pequeño */
.fifa-avatar-level.small {
  width: 22px;
  height: 22px;
  font-size: 10px;
  bottom: -4px;
  right: -6px;
}

/* Level grande */
.fifa-avatar-level.large {
  width: 34px;
  height: 34px;
  font-size: 16px;
  bottom: -8px;
  right: -10px;
  border-width: 3px;
}

/* Level con borde doble */
.fifa-avatar-level.double-border {
  border: 2px solid #1a1a2e;
  outline: 1px solid rgba(255,215,0,0.5);
  outline-offset: 1px;
}

/* ── CON EFECTO DE CUENTA REGRESIVA ── */
.fifa-avatar-level.countdown {
  animation: countdownPulse 1s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% {
    transform: scale(1);
    background: linear-gradient(145deg, #ffd700, #ff8c00);
  }
  50% {
    transform: scale(1.1);
    background: linear-gradient(145deg, #ff4444, #cc0000);
  }
}

/* ── CON BADGE DE SUBIDA ── */
.fifa-avatar-level .level-up-indicator {
  position: absolute;
  top: -12px;
  right: -12px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: levelUpBounce 0.5s ease-out;
  border: 1px solid #fff;
}

@keyframes levelUpBounce {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* ── EFECTO DE BRILLO EN EL BORDE ── */
.fifa-avatar-level.glow-border {
  animation: borderGlow 2s ease-in-out infinite;
}

@keyframes borderGlow {
  0%, 100% {
    box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0px rgba(255,215,0,0);
  }
  50% {
    box-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,215,0,0.5);
  }
}

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .fifa-avatar-icon {
    font-size: 34px;
  }
  
  .fifa-avatar-icon.large {
    font-size: 44px;
  }
  
  .fifa-avatar-level {
    width: 24px;
    height: 24px;
    font-size: 11px;
    bottom: -5px;
    right: -7px;
  }
  
  .fifa-avatar-level.large {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
}

/* ── EFECTO DE CARGA DEL AVATAR ── */
.fifa-avatar-icon.loading {
  animation: iconLoading 1.5s ease-in-out infinite;
  filter: grayscale(0.5);
}

@keyframes iconLoading {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ── ESTILO LEGENDARIO PARA EL LEVEL ── */
.fifa-avatar-level.legendary {
  background: linear-gradient(145deg, #ffd700, #ff8c00, #ff4500);
  background-size: 200% auto;
  animation: legendaryLevel 2s linear infinite;
  border-color: #ffd700;
}

@keyframes legendaryLevel {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* ── EFECTO DE CRISTAL ── */
.fifa-avatar-level.glass {
  background: rgba(255,215,0,0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,215,0,0.5);
  color: #ffd700;
}

.fifa-player-details {
  flex: 1;
  display: flex;
  flex-direction: column;  /* ← Esto es clave */
  gap: 4px;               /* Espacio entre nombre y club */
}

.fifa-player-name {
  font-family: 'Teko', 'Poppins', sans-serif;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 30%, #d4d4d4 70%, #ffffff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  position: relative;
  display: inline-block;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: nameShine 3s linear infinite;
}

/* Animación de brillo en el nombre */
@keyframes nameShine {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* Efecto de subrayado animado */
.fifa-player-name::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #ffd700, #ffaa00, #ffd700);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.fifa-player-name:hover::after {
  width: 100%;
}

/* Efecto hover en el nombre */
.fifa-player-name:hover {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffaa00 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  transform: translateX(4px);
  letter-spacing: 1.5px;
}


/* ── CLUB ESTILO FIFA ULTIMATE TEAM PREMIUM ── */

.fifa-player-club {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  padding: 6px 12px;
  border-radius: 40px;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(4px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  letter-spacing: 0.3px;
  width: fit-content;
  max-width: 100%;
  position: relative;
  overflow: hidden;
}

/* Efecto shine al hover */
.fifa-player-club:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04));
  border-color: rgba(255,215,0,0.3);
  transform: translateX(4px);
  color: rgba(255,255,255,0.9);
}

.fifa-player-club:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  animation: clubShine 0.6s ease-in-out;
  pointer-events: none;
}

@keyframes clubShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Icono del estadio/club */
.fifa-player-club .club-icon {
  font-size: 14px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  transition: transform 0.2s ease;
}

.fifa-player-club:hover .club-icon {
  transform: scale(1.1) rotate(-5deg);
}

/* Nombre del club */
.fifa-player-club .club-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Badge de liga/país */
.fifa-player-club .league-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0.4);
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: rgba(255,215,0,0.9);
  margin-left: 4px;
  border: 1px solid rgba(255,215,0,0.2);
}

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .fifa-player-club {
    padding: 4px 10px;
    font-size: 10px;
    gap: 5px;
  }
  
  .fifa-player-club .club-name {
    max-width: 100px;
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
  }
  
  .fifa-player-club .league-badge {
    font-size: 7px;
    padding: 1px 4px;
  }
  
  .fifa-player-club.compact .club-name {
    max-width: 80px;
  }
  
  .fifa-player-club .club-tooltip {
    white-space: normal;
    max-width: 200px;
    text-align: center;
  }
}

/* ── VARIANTE DARK MODE ESPECIAL ── */
.fifa-player-club.dark {
  background: rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.05);
}

.fifa-player-club.dark:hover {
  border-color: rgba(255,215,0,0.2);
}

/* ── CON EFECTO DE NEÓN ── */
.fifa-player-club.neon {
  box-shadow: 0 0 5px rgba(255,215,0,0.2);
  animation: neonPulse 2s ease-in-out infinite;
}

@keyframes neonPulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255,215,0,0.2);
    border-color: rgba(255,215,0,0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(255,215,0,0.4);
    border-color: rgba(255,215,0,0.5);
  }
}

/* ── SEPARADOR ENTRE CLUB Y OTROS ELEMENTOS ── */
.fifa-player-details .fifa-player-club {
  margin-top: 4px;
}

.fifa-overall {
  position: relative;
  text-align: center;
  background: radial-gradient(ellipse at 30% 20%, rgba(20,20,40,0.95), rgba(0,0,0,0.98));
  padding: 6px 14px;
  border-radius: 20px;
  border: none;
  box-shadow: 
    0 8px 20px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 0 0 2px rgba(0,0,0,0.5),
    0 0 0 4px rgba(255,215,0,0.2);
  backdrop-filter: blur(4px);
  min-width: 70px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.fifa-overall:hover {
  transform: scale(1.05);
  box-shadow: 
    0 12px 28px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.15),
    0 0 0 2px rgba(0,0,0,0.5),
    0 0 0 4px rgba(255,215,0,0.4);
}

/* Label OVR */
.fifa-overall-label {
  font-size: 8px;
  font-weight: 800;
  color: rgba(255,215,0,0.9);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: block;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  font-family: 'Teko', 'Poppins', sans-serif;
}

/* Valor OVR principal */
.fifa-overall-value {
  font-family: 'Teko', 'Poppins', sans-serif;
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
  position: relative;
  display: inline-block;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 30%, #ffaa00 70%, #ffd700 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: overallGlow 2s ease-in-out infinite, overallPop 0.5s cubic-bezier(0.34, 1.3, 0.64, 1);
  text-shadow: 0 0 10px rgba(255,215,0,0.3);
}

/* Efecto de brillo en el número */
.fifa-overall-value::before {
  content: attr(data-value);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.5), transparent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: blur(4px);
  opacity: 0;
  animation: overallShine 3s ease-in-out infinite;
  pointer-events: none;
}

/* Animaciones */
@keyframes overallGlow {
  0%, 100% {
    filter: drop-shadow(0 0 2px rgba(255,215,0,0.3));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(255,215,0,0.6));
  }
}

@keyframes overallPop {
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

@keyframes overallShine {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}


/* Grid de stats - Estilo FIFA */
.fifa-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px 20px;
  background: rgba(0,0,0,0.3);
  margin: 0 16px 16px;
  border-radius: 16px;
}

.fifa-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  transition: all 0.2s;
}

.fifa-stat:hover {
  background: rgba(255,255,255,0.08);
  transform: translateX(4px);
}

.fifa-stat-icon {
  font-size: 20px;
  width: 30px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

.fifa-stat-info {
  flex: 1;
  min-width: 0;
}

.fifa-stat-label {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}

.fifa-stat-value {
  font-family: 'Teko', 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.fifa-stat-bar {
  width: 70px;
  height: 6px;
  background: rgba(255,255,255,0.15);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
}

.fifa-stat-fill {
  height: 100%;
  border-radius: 3px;
  animation: statBarFill 0.6s ease-out;
  position: relative;
  overflow: hidden;
}

.fifa-stat-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
}

/* Experiencia - Barra estilo FIFA */
.fifa-exp-section {
  padding: 0 20px 16px;
}

.fifa-exp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.fifa-exp-icon {
  font-size: 12px;
  color: #ffd700;
}

.fifa-exp-label {
  flex: 1;
  color: rgba(255,255,255,0.5);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fifa-exp-values {
  color: #ffd700;
  font-family: 'Teko', monospace;
  font-weight: 600;
}

.fifa-exp-bar {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
}

.fifa-exp-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  position: relative;
}

.fifa-exp-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 100%);
}

/* Próxima rareza - versión avanzada con progreso real */
.fifa-next-rarity {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #FFD966;
  margin: 0 20px 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(255,217,102,0.1) 0%, rgba(255,217,102,0.03) 100%);
  border-radius: 20px;
  border: 1px solid rgba(255,217,102,0.25);
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

/* Efecto de brillo al hover */
.fifa-next-rarity::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255,217,102,0.15), 
    transparent
  );
  transition: left 0.6s ease;
}

.fifa-next-rarity:hover::before {
  left: 100%;
}

/* Contenido principal */
.next-rarity-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  z-index: 2;
}

/* Info izquierda */
.next-rarity-info {
  text-align: left;
  flex: 1;
}

.next-rarity-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,217,102,0.6);
  margin-bottom: 4px;
  display: block;
}

.next-rarity-name {
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}

.next-rarity-icon {
  font-size: 18px;
  filter: drop-shadow(0 0 4px currentColor);
  animation: nextRarityPulse 2s ease-in-out infinite;
}

/* Barra de progreso hacia la rareza */
.next-rarity-progress {
  flex: 1;
  min-width: 100px;
}

.progress-bar-container {
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD966, #FFA500);
  border-radius: 20px;
  width: 0%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 0 6px rgba(255,217,102,0.5);
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
  animation: progressShimmer 1.5s infinite;
}

.progress-text {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,217,102,0.8);
  display: flex;
  justify-content: space-between;
}

/* Flecha animada a la derecha */
.next-rarity-arrow {
  font-size: 24px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.fifa-next-rarity:hover .next-rarity-arrow {
  transform: translateX(6px);
  opacity: 1;
}

/* Efecto hover general */
.fifa-next-rarity:hover {
  background: linear-gradient(135deg, rgba(255,217,102,0.15) 0%, rgba(255,217,102,0.05) 100%);
  border-color: rgba(255,217,102,0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}

/* Badge de "¡CASI!" cuando falta poco */
.next-rarity-badge {
  position: absolute;
  top: -8px;
  right: 16px;
  background: linear-gradient(135deg, #FF6B6B, #FF4444);
  font-size: 10px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  color: white;
  animation: badgeBounce 0.6s ease-out;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  letter-spacing: 0.5px;
}

/* Tooltip con recompensas */
.next-rarity-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: rgba(0,0,0,0.95);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  border: 1px solid rgba(255,217,102,0.3);
  z-index: 10;
}

.fifa-next-rarity:hover .next-rarity-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-12px);
}

.tooltip-title {
  font-weight: 800;
  color: #FFD966;
  margin-bottom: 8px;
  font-size: 12px;
}

.tooltip-reward {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  color: rgba(255,255,255,0.8);
}

/* Animaciones */
@keyframes nextRarityPulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes progressShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

@keyframes badgeBounce {
  0% {
    transform: scale(0) rotate(-10deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .next-rarity-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .next-rarity-info {
    text-align: center;
  }
  
  .next-rarity-progress {
    width: 100%;
  }
  
  .next-rarity-arrow {
    display: none;
  }
  
  .next-rarity-tooltip {
    white-space: normal;
    min-width: 200px;
    text-align: center;
  }
}
/* Tracking stats - Estilo FIFA */
.fifa-tracking {
  display: flex;
  justify-content: space-around;
  padding: 12px 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
  border-top: 1px solid rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 16px;
}

.fifa-tracking-item {
  text-align: center;
  cursor: help;
  transition: all 0.2s;
  padding: 4px 8px;
  border-radius: 10px;
}

.fifa-tracking-item:hover {
  background: rgba(255,255,255,0.05);
  transform: translateY(-2px);
}

.tracking-icon {
  font-size: 18px;
  display: block;
  margin-bottom: 4px;
  opacity: 0.7;
}

.tracking-value {
  font-family: 'Teko', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

/* Badges */
.fifa-badges {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 0 20px 20px;
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
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

/* TEXTO CHICO */
.rank-text {
  font-size: 20px;
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

        /* Animaciones globales */
@keyframes fifaCardGlow {
  0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,215,0,0); }
  50% { box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px 2px rgba(255,215,0,0.3); }
}

@keyframes statBarFill {
  from { width: 0%; opacity: 0; }
  to { opacity: 1; }
}

@keyframes cardShine {
  0% { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(200%) rotate(25deg); }
}

@keyframes overallPop {
  0% { transform: scale(0.8); opacity: 0; }
  80% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
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
          /* Responsive */
@media (max-width: 480px) {
  .fifa-player-info {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
  
  .fifa-player-details {
    text-align: center;
  }
  
  .fifa-stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .fifa-tracking {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .fifa-badges {
    flex-direction: column;
    align-items: center;
  }
  
  .club-rank-badge {
    width: 100%;
    justify-content: center;
  }
  
  .stat-upgrade-notification {
    white-space: normal;
    text-align: center;
    max-width: 90%;
    font-size: 11px;
  }
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