// components/home/AppHeader.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useUserStats } from '../../hooks/useUserStats';
import { useClubRanking } from '../../hooks/useClubRanking';
import { RARITY_CONFIG } from '../../utils/userProgression';
import { Notifications } from '../Notifications';

interface AppHeaderProps {
  userId: string;
}

export function AppHeader({ userId }: AppHeaderProps) {
  const [user, setUser] = useState<any>(null);
  const { stats, loading } = useUserStats(userId);
  const { clubRanking } = useClubRanking(userId);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      // ✅ Selecciona solo las columnas que existen en tu tabla profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('username, club, points') // coins y gems probablemente no existen
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      
      if (data) {
        setUser({
          ...data,
          coins: data.points || 0,     // Usar points como coins si no existe
          gems: 0                       // Valor por defecto si no existe
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Si aún hay error, mostrar algo simple mientras cargas
  if (loading || !user || !stats) {
    return (
      <header className="app-header">
        <div className="header-inner">
          <div className="header-skeleton">
            <div className="skel-avatar" />
            <div className="skel-info" />
          </div>
        </div>
        <style>{headerStyles}</style>
      </header>
    );
  }

  const xpPercentage = Math.min((stats.exp / stats.expNeeded) * 100, 100);
  const rarity = RARITY_CONFIG[stats.rarity as keyof typeof RARITY_CONFIG];
  const clubRank = clubRanking?.rank || 0;

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* LEFT: Avatar + Info */}
        <div className="user-left">
          <div className="avatar-wrap" style={{ borderColor: rarity?.color || '#189df5' }}>
            <img src="/images/avatar.png" alt="avatar" className="avatar-img" />
            <span className="lvl-badge" style={{ background: rarity?.color || '#189df5' }}>
              {stats.level}
            </span>
          </div>

          <div className="user-info">
            <div className="name-row">
              <span className="username">{user.username}</span>
              {rarity && (
                <span className="rarity-pill" style={{ background: rarity.color }}>
                  {rarity.icon} {rarity.name}
                </span>
              )}
            </div>

            <div className="club-row">
              <span className={`club-name-text ${clubRank === 1 ? 'gold' : clubRank === 2 ? 'silver' : clubRank === 3 ? 'bronze' : ''}`}>
                {user.club}
              </span>
              {clubRank > 0 && clubRank <= 3 && (
                <span className={`club-rank-badge rank-${clubRank}`}>
                  {clubRank === 1 ? '🏆 #1' : clubRank === 2 ? '🥈 #2' : '🥉 #3'}
                </span>
              )}
            </div>

            <div className="xp-wrap">
              <div className="xp-top-row">
                <span className="xp-level-label">NIVEL {stats.level}</span>
                <span className="xp-nums">{stats.exp} / {stats.expNeeded} XP</span>
              </div>
              <div className="xp-track">
                <div
                  className="xp-fill"
                  style={{
                    width: `${xpPercentage}%`,
                    background: rarity?.color || '#189df5',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Currencies + Bell */}
        <div className="header-right">
          <div className="currencies">
            <div className="currency-pill gold-pill">
              <span className="currency-emoji">🌟</span>
              <span className="currency-amount gold-amount">{user.points?.toLocaleString('es-AR') || 0}</span>
            </div>
            {/* Si no tienes gems, oculta esta sección o muestra puntos */}
          </div>
          <Notifications userId={userId} />
        </div>
      </div>
      <style>{headerStyles}</style>
    </header>
  );
}

const headerStyles = `
  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10, 12, 22, 0.97);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 10px 16px;
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    max-width: 480px;
    margin: 0 auto;
  }

  /* ---- LEFT ---- */
  .user-left {
    display: flex;
    align-items: center;
    gap: 11px;
    flex: 1;
    min-width: 0;
  }

  .avatar-wrap {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 2.5px solid #189df5;
    flex-shrink: 0;
    overflow: visible;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  .lvl-badge {
    position: absolute;
    bottom: -5px;
    right: -8px;
    background: #189df5;
    color: #000;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 12px;
    border: 2px solid #0a0c16;
    white-space: nowrap;
    line-height: 1.3;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 3px;
    flex-wrap: wrap;
  }

  .username {
    font-size: 18px;
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
    letter-spacing: 0.3px;
  }

  .rarity-pill {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 2px 7px;
    border-radius: 20px;
    color: #000;
  }

  .club-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    flex-wrap: wrap;
  }

  .club-icon-emoji {
    font-size: 12px;
    line-height: 1;
  }

  .club-name-text {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    font-weight: 600;
  }

  .club-name-text.gold {
    background: linear-gradient(135deg, #00ff00, #4eff6c);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 800;
    animation: goldPulse 2.5s ease-in-out infinite;
  }

  .club-name-text.silver {
    background: linear-gradient(135deg, #e0e0e0, #c0c0c0);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }

  .club-name-text.bronze {
    background: linear-gradient(135deg, #cd7f32, #b87333);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }

  @keyframes goldPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .club-rank-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .club-rank-badge.rank-1 {
    background: rgba(255,215,0,0.15);
    color: #00ff4c;
    border: 1px solid rgba(255,215,0,0.35);
  }
  .club-rank-badge.rank-2 {
    background: rgba(192,192,192,0.15);
    color: #c0c0c0;
    border: 1px solid rgba(192,192,192,0.35);
  }
  .club-rank-badge.rank-3 {
    background: rgba(205,127,50,0.15);
    color: #cd7f32;
    border: 1px solid rgba(205,127,50,0.35);
  }

  .xp-wrap {
    width: 100%;
  }

  .xp-top-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .xp-level-label {
    font-size: 10px;
    font-weight: 800;
    color: #189df5;
    letter-spacing: 1px;
  }

  .xp-nums {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-family: monospace;
  }

  .xp-track {
    height: 5px;
    background: rgba(255,255,255,0.08);
    border-radius: 4px;
    overflow: hidden;
  }

  .xp-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
    position: relative;
    overflow: hidden;
  }

  .xp-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    animation: shine 2s infinite;
  }

  @keyframes shine {
    to { left: 160%; }
  }

  /* ---- RIGHT ---- */
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .currencies {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .currency-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px 4px 7px;
    border-radius: 20px;
    cursor: pointer;
  }

  .gold-pill {
    background: rgba(255, 200, 0, 0.1);
    border: 1px solid rgba(255, 200, 0, 0.25);
  }

  .green-pill {
    background: rgba(0, 200, 100, 0.1);
    border: 1px solid rgba(0, 200, 100, 0.25);
  }

  .currency-emoji {
    font-size: 15px;
    line-height: 1;
  }

  .currency-amount {
    font-size: 13px;
    font-weight: 700;
    min-width: 36px;
  }

  .gold-amount { color: #ffd700; }
  .green-amount { color: #00e070; }

  .plus-btn {
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 13px;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .gold-plus {
    background: rgba(255,200,0,0.2);
    color: #ffd700;
  }

  .green-plus {
    background: rgba(0,200,100,0.2);
    color: #00e070;
  }

  /* ---- SKELETON ---- */
  .header-skeleton {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .skel-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(90deg, #1a1a2e, #2a2a3e);
    animation: skPulse 1.5s infinite;
  }

  .skel-info {
    width: 160px;
    height: 56px;
    border-radius: 10px;
    background: linear-gradient(90deg, #1a1a2e, #2a2a3e);
    animation: skPulse 1.5s infinite;
  }

  @keyframes skPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }

  /* ---- RESPONSIVE ---- */
  @media (max-width: 380px) {
    .app-header { padding: 8px 12px; }
    .username { font-size: 16px; }
    .avatar-wrap { width: 48px; height: 48px; }
    .currency-amount { min-width: 28px; font-size: 12px; }
  }
`;