// components/AppHeader.tsx
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
    const { data } = await supabase
      .from('profiles')
      .select('username, club, points')
      .eq('id', userId)
      .single();
    if (data) setUser(data);
  };

  if (loading || !user || !stats) {
    return (
      <header className="app-header">
        <div className="header-inner">
          <div className="user-profile skeleton">
            <div className="avatar-skeleton"></div>
            <div className="user-info-skeleton"></div>
          </div>
        </div>
      </header>
    );
  }

  const xpPercentage = (stats.exp / stats.expNeeded) * 100;
  const rarity = RARITY_CONFIG[stats.rarity as keyof typeof RARITY_CONFIG];
  const clubRank = clubRanking?.rank || 0;

  return (
    <header className="app-header">
      <div className="header-inner">
        
        <div className="user-profile">
          <div 
            className="avatar-container"
            style={{ borderColor: rarity?.color || '#CD7F32' }}
          >
            <img src="/images/avatar.png" alt="User" className="avatar" />
            <span className="avatar-level" style={{ background: rarity?.color }}>
              {stats.level}
            </span>
          </div>

          <div className="user-info">
            <div className="username-row">
              <span className="username">{user.username}</span>
              <span className="rarity-badge" style={{ background: rarity?.color }}>
                {rarity?.icon} {rarity?.name}
              </span>
            </div>

<div className="club-row">
  <span className="club-icon">🏟️</span>
  <span className={`club-name ${clubRank === 1 ? 'rank-first' : clubRank === 2 ? 'rank-second' : clubRank === 3 ? 'rank-third' : ''}`}>
    {user.club}
  </span>
  {clubRank > 0 && clubRank <= 3 && (
    <span className={`club-rank rank-${clubRank}`}>
      {clubRank === 1 ? '🏆 #1' : clubRank === 2 ? '🥈 #2' : '🥉 #3'}
    </span>
  )}
</div>

            <div className="level-container">
              <div className="level-header">
                <span className="level-label">Nivel {stats.level}</span>
              </div>
              <div className="xp-bar-wrapper">
                <div 
                  className="xp-progress" 
                  style={{ 
                    width: `${xpPercentage}%`,
                    background: rarity?.color || 'linear-gradient(90deg, #FFD700, #FFA500)'
                  }}
                />
              </div>
              <div className="xp-footer">
                <span className="xp-text">{stats.exp} / {stats.expNeeded} XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right-group">
          <div className="points-pill">
            <span className="points-icon">⭐</span>
            <span className="points-value">{user.points || 0}</span>
          </div>
          <Notifications userId={userId} />
        </div>

      </div>

      <style>{`
        .app-header {
          background: linear-gradient(145deg, #0a0a14, #12121f);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 12px 20px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar-container {
          position: relative;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 2px solid;
          transition: all 0.3s ease;
        }

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-level {
          position: absolute;
          bottom: -4px;
          right: -8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: #0a0a0f;
          border: 2px solid #12121f;
        }

        .user-info {
          flex: 1;
        }

        .username-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .username {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #ccc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .rarity-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .club-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.club-icon {
  font-size: 20px;
}

/* Estilo base del nombre del club */
.club-name {
  font-size: 16px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Puesto #1 - Dorado */
.club-name.rank-first {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: goldPulse 2s ease-in-out infinite;
}

@keyframes goldPulse {
  0%, 100% {
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  }
  50% {
    text-shadow: 0 0 16px rgba(255, 215, 0, 0.8);
  }
}

/* Puesto #2 - Plateado */
.club-name.rank-second {
  color: #c0c0c0;
  text-shadow: 0 0 6px rgba(192, 192, 192, 0.4);
  font-weight: 700;
  background: linear-gradient(135deg, #e0e0e0, #c0c0c0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Puesto #3 - Bronce */
.club-name.rank-third {
  color: #cd7f32;
  text-shadow: 0 0 6px rgba(205, 127, 50, 0.4);
  font-weight: 700;
  background: linear-gradient(135deg, #cd7f32, #b87333);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Efecto hover para el nombre del club */
.club-name:hover {
  transform: scale(1.02);
  letter-spacing: 0.5px;
}

/* Badge de ranking */
.club-rank {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.club-rank.rank-1 {
  background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.3);
}

.club-rank.rank-2 {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.25), rgba(192, 192, 192, 0.1));
  color: #c0c0c0;
  border: 1px solid rgba(192, 192, 192, 0.4);
}

.club-rank.rank-3 {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.25), rgba(205, 127, 50, 0.1));
  color: #cd7f32;
  border: 1px solid rgba(205, 127, 50, 0.4);
}

/* Hover en el badge */
.club-rank:hover {
  transform: scale(1.05);
}

        .club-rank.rank-1 {
          background: rgba(0, 255, 136, 0.15);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.3);
        }

        .club-rank.rank-2, .club-rank.rank-3 {
          background: rgba(255, 200, 0, 0.15);
          color: #ffd54f;
          border: 1px solid rgba(255, 200, 0, 0.3);
        }

        .level-container {
          margin-top: 4px;
        }

        

        .level-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }

        .level-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .xp-bar-wrapper {
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          height: 6px;
          overflow: hidden;
          position: relative;
          margin-bottom: 4px;
        }

        .xp-progress {
          height: 100%;
          border-radius: 8px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .xp-progress::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: progressShine 1.5s infinite;
        }

        .xp-footer {
          display: flex;
          justify-content: flex-start;
        }

        .xp-text {
          font-size: 11px;
          font-family: monospace;
          font-weight: 600;
          color: #ffd700;
        }

        .header-right-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .points-pill {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 40px;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .points-icon {
          font-size: 14px;
        }

        .points-value {
          font-weight: 700;
          font-size: 14px;
          color: #ffd700;
        }

        .avatar-skeleton {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(90deg, #1a1a2e, #2a2a3e);
          animation: skeletonPulse 1.5s infinite;
        }

        .user-info-skeleton {
          width: 180px;
          height: 70px;
          background: linear-gradient(90deg, #1a1a2e, #2a2a3e);
          border-radius: 12px;
          animation: skeletonPulse 1.5s infinite;
        }

        @keyframes progressShine {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @media (max-width: 560px) {
          .app-header {
            padding: 10px 16px;
          }

          .username {
            font-size: 18px;
          }

          .avatar-container {
            width: 72px;
            height: 72px;
          }

          .avatar-level {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }

          .club-name {
            font-size: 14px;
          }

          .points-pill {
            padding: 5px 12px;
          }

          .points-value {
            font-size: 13px;
          }
        }
      `}</style>
    </header>
  );
}