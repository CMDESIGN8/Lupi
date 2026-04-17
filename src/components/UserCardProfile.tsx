// src/components/UserCardProfile.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserCardStats, RARITY_CONFIG } from '../utils/userProgression';

interface UserCardProfileProps {
  userId: string;
  onLevelUp?: (newLevel: number, newRarity: string) => void;
}

export function UserCardProfile({ userId, onLevelUp }: UserCardProfileProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'level' | 'stat'; message: string; icon: string } | null>(null);
  
  // Guardar stats anteriores para comparar
  const prevStatsRef = useRef<any>(null);
  const isFirstLoad = useRef(true);
  
  useEffect(() => {
    loadStats();
    
    // Escuchar cambios en tiempo real
    const subscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          console.log('🔄 Detectado cambio en perfil, recargando...');
          loadStats();
        }
      )
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, [userId]);
  
  const loadStats = async () => {
    try {
      const newStats = await getUserCardStats(userId);
      console.log('📊 Stats cargados:', { 
        level: newStats.level, 
        pace: newStats.pace,
        oldLevel: prevStatsRef.current?.level,
        oldPace: prevStatsRef.current?.pace,
        isFirstLoad: isFirstLoad.current
      });
      
      // Si NO es la primera carga y tenemos stats anteriores, comparar
      if (!isFirstLoad.current && prevStatsRef.current) {
        const old = prevStatsRef.current;
        
        // 1. Detectar LEVEL UP
        if (newStats.level > old.level) {
          console.log(`🎉 LEVEL UP DETECTADO! ${old.level} → ${newStats.level}`);
          setNotification({
            type: 'level',
            message: `¡SUBISTE A NIVEL ${newStats.level}!`,
            icon: '🎉'
          });
          if (onLevelUp) onLevelUp(newStats.level, newStats.rarity);
          setTimeout(() => setNotification(null), 3000);
        }
        
        // 2. Detectar cambios en STATS
        const statChanges = [
          { name: '⚡ Velocidad', key: 'pace', oldValue: old.pace, newValue: newStats.pace },
          { name: '✨ Regate', key: 'dribbling', oldValue: old.dribbling, newValue: newStats.dribbling },
          { name: '⚽ Pase', key: 'passing', oldValue: old.passing, newValue: newStats.passing },
          { name: '🛡️ Defensa', key: 'defending', oldValue: old.defending, newValue: newStats.defending },
          { name: '🎯 Remate', key: 'finishing', oldValue: old.finishing, newValue: newStats.finishing },
          { name: '💪 Físico', key: 'physical', oldValue: old.physical, newValue: newStats.physical }
        ];
        
        for (const change of statChanges) {
          if (change.newValue > change.oldValue) {
            const diff = change.newValue - change.oldValue;
            console.log(`⬆️ STAT UP DETECTADO! ${change.name}: ${change.oldValue} → ${change.newValue} (+${diff})`);
            setNotification({
              type: 'stat',
              message: `${change.name} +${diff} → ${change.newValue}`,
              icon: '⬆️'
            });
            setTimeout(() => setNotification(null), 2500);
            break;
          }
        }
      }
      
      // Guardar stats actuales para próxima comparación
      prevStatsRef.current = newStats;
      setStats(newStats);
      
      // Marcar que ya no es la primera carga
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
      
    } catch (error) {
      console.error('Error loading user card stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div className="user-card-skeleton"><div className="spinner" /></div>;
  if (!stats) return null;
  
  const rarity = RARITY_CONFIG[stats.rarity as keyof typeof RARITY_CONFIG];
  const progressPercent = (stats.exp / stats.expNeeded) * 100;
  
  return (
    <>
      {/* Notificación flotante */}
      {notification && (
        <div className={`notification-popup ${notification.type}`}>
          <span className="notification-icon">{notification.icon}</span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}
      
      {/* Card principal */}
      <div className="user-card-container" style={{ borderColor: rarity.color, boxShadow: `0 0 20px ${rarity.color}40` }}>
        <div className="user-card-header">
          <div className="user-card-rarity" style={{ background: rarity.color }}>
            {rarity.icon} {rarity.name}
          </div>
          <div className="user-card-level">Nivel {stats.level}</div>
        </div>
        
        <div className="user-card-stats">
          <div className="user-card-avatar">
            <div className="avatar-icon">👤</div>
            <div className="avatar-level">{stats.level}</div>
          </div>
          <div className="user-card-stats-grid">
            <div className="stat" title="Velocidad (cargá entradas)">
              <span>⚡</span> {stats.pace}
            </div>
            <div className="stat" title="Regate (abrí sobres diarios)">
              <span>✨</span> {stats.dribbling}
            </div>
            <div className="stat" title="Pase (compartí la app)">
              <span>⚽</span> {stats.passing}
            </div>
            <div className="stat" title="Defensa (batallas perdidas)">
              <span>🛡️</span> {stats.defending}
            </div>
            <div className="stat" title="Remate (batallas ganadas)">
              <span>🎯</span> {stats.finishing}
            </div>
            <div className="stat" title="Físico (referí amigos)">
              <span>💪</span> {stats.physical}
            </div>
          </div>
        </div>
        
        <div className="user-card-progress">
          <div className="progress-label">
            <span>⭐ Experiencia</span>
            <span>{stats.exp} / {stats.expNeeded}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%`, background: rarity.color }} />
          </div>
        </div>
        
        {stats.rarity !== 'elite' && (
          <div className="user-card-next">
            <span>📈 Próxima rareza: {getNextRarityIcon(stats.rarity)} en nivel {getNextRarityLevel(stats.rarity)}</span>
          </div>
        )}
        
        <div className="user-card-stats-tracking">
          <div className="track-item" title="Entradas cargadas">🎟️ {stats.total_tickets}</div>
          <div className="track-item" title="Batallas jugadas">⚔️ {stats.total_battles}</div>
          <div className="track-item" title="Victorias">🏆 {stats.total_wins}</div>
          <div className="track-item" title="Compartidos">📤 {stats.total_shares}</div>
          <div className="track-item" title="Referidos">👥 {stats.total_referrals}</div>
        </div>
      </div>
      
      <style>{`
        .user-card-container {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 24px;
          padding: 20px;
          margin: 16px 0;
          border: 2px solid;
          transition: all 0.3s;
        }
        .user-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .user-card-rarity {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          color: #0a0a0f;
        }
        .user-card-level {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--text);
        }
        .user-card-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        .user-card-avatar {
          position: relative;
          width: 80px;
          height: 80px;
          background: var(--surface2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-icon { font-size: 40px; }
        .avatar-level {
          position: absolute;
          bottom: -8px;
          right: -8px;
          background: var(--accent);
          color: #0a0a0f;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        .user-card-stats-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .stat {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 8px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          cursor: help;
          transition: transform 0.2s;
        }
        .stat:hover {
          transform: scale(1.05);
          background: rgba(255,255,255,0.1);
        }
        .stat span { font-size: 14px; margin-right: 4px; }
        .user-card-progress { margin-bottom: 16px; }
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 4px;
        }
        .progress-bar {
          height: 8px;
          background: var(--surface2);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill { height: 100%; transition: width 0.3s; }
        .user-card-next {
          text-align: center;
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 16px;
          padding: 8px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }
        .user-card-stats-tracking {
          display: flex;
          justify-content: space-around;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text2);
        }
        .track-item { cursor: help; }
        
        /* NOTIFICACIÓN FLOTANTE */
        .notification-popup {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          border-radius: 60px;
          font-weight: bold;
          font-size: 16px;
          white-space: nowrap;
          animation: slideDown 0.3s ease-out;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .notification-popup.level {
          background: linear-gradient(135deg, #ffd700, #ff8c00);
          color: #0a0a0f;
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .notification-popup.stat {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .notification-icon {
          font-size: 24px;
          background: rgba(255,255,255,0.2);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .notification-message {
          letter-spacing: 0.5px;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .user-card-skeleton {
          background: var(--surface);
          border-radius: 24px;
          padding: 20px;
          margin: 16px 0;
          min-height: 280px;
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