// components/home/AppHeader.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

import { useClubRanking } from '../../hooks/useClubRanking';
import { RARITY_CONFIG } from '../../utils/userProgression';
import { Notifications } from '../Notifications';
import { useHeroDataCached } from '../../hooks/useHeroData';

interface AppHeaderProps {
  userId: string;
}

interface UserProfile {
  username: string | null;
  club: string | null;
}

export function AppHeader({ userId }: AppHeaderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);

  

const { clubRanking } = useClubRanking(userId);

const {
  data: heroData,
  loading: heroLoading,
  refetch: refetchHero,
} = useHeroDataCached(userId);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
  .from('profiles')
  .select(`
    username,
    club
  `)
  .eq('id', userId)
  .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
  setUser({
    username: data.username,
    club: data.club,
  });
}
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };
  useEffect(() => {
  const handleProgressionUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;

    if (customEvent.detail?.userId !== userId) return;

    console.log("🔄 Header: progresión actualizada");

    refetchHero();
  };

  window.addEventListener(
    "lupi:progression-updated",
    handleProgressionUpdate
  );

  return () => {
    window.removeEventListener(
      "lupi:progression-updated",
      handleProgressionUpdate
    );
  };
}, [userId, refetchHero]);

  if (heroLoading || !user || !heroData) {
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

const currentLevel = heroData.level ?? 1;
const currentExp = heroData.exp ?? 0;
const currentExpNeeded = heroData.expNeeded ?? 100;

const xpPercentage = Math.min(
  (currentExp / Math.max(currentExpNeeded, 1)) * 100,
  100
);

const currentRarity = heroData.rarity ?? "bronze";

const rarity =
  RARITY_CONFIG[
    currentRarity as keyof typeof RARITY_CONFIG
  ];

  const clubRank = clubRanking?.rank || 0;

  return (
    <header className="app-header">
      <div className="header-inner">

        {/* =====================================================
            LEFT — PLAYER
        ====================================================== */}

        <div className="user-left">

          <div
            className="avatar-wrap"
            style={{
              borderColor: rarity?.color || '#189df5',
              boxShadow: rarity
                ? `0 0 14px ${rarity.color}55`
                : 'none',
            }}
          >
            <img
              src="/images/avatar.png"
              alt="avatar"
              className="avatar-img"
            />

            <span
              className="lvl-badge"
              style={{
                background: rarity?.color || '#189df5',
              }}
            >
              {currentLevel}
            </span>
          </div>

          <div className="user-info">

            {/* NAME */}
            <div className="name-row">

              <span className="username">
                {user.username || 'Jugador'}
              </span>

              {rarity && (
                <span
                  className="rarity-pill"
                  style={{
                    background: rarity.color,
                  }}
                >
                  {rarity.icon} {rarity.name}
                </span>
              )}

            </div>

            {/* CLUB + STREAK */}
            <div className="club-row">

              <span
                className={`club-name-text ${
                  clubRank === 1
                    ? 'gold'
                    : clubRank === 2
                    ? 'silver'
                    : clubRank === 3
                    ? 'bronze'
                    : ''
                }`}
              >
                {user.club || 'Sin club'}
              </span>

              {clubRank > 0 && clubRank <= 3 && (
                <span
                  className={`club-rank-badge rank-${clubRank}`}
                >
                  {clubRank === 1
                    ? '🏆 #1'
                    : clubRank === 2
                    ? '🥈 #2'
                    : '🥉 #3'}
                </span>
              )}

              {/* STREAK */}
              {(heroData.streak ?? 0) > 0 && (
                <span className="streak-badge">
                  🔥 {heroData.streak}
                </span>
              )}

            </div>

            {/* XP */}
            <div className="xp-wrap">

              <div className="xp-top-row">

                <span className="xp-level-label">
                  NIVEL {currentLevel}
                </span>

                <span className="xp-nums">
                  {currentExp} / {currentExpNeeded} XP
                </span>

              </div>

              <div className="xp-track">

                <div
                  className="xp-fill"
                  style={{
                    width: `${xpPercentage}%`,
                    background:
                      rarity?.color || '#189df5',
                  }}
                />

              </div>

            </div>

          </div>
        </div>

        {/* =====================================================
            RIGHT — CURRENCIES + NOTIFICATIONS
        ====================================================== */}

        <div className="header-right">

          <div className="currencies">

            <div className="currency-pill gold-pill">
              <span className="currency-emoji">
                💰
              </span>

              <span className="currency-amount gold-amount">
                {(heroData.coins ?? 0).toLocaleString('es-AR')}
              </span>
            </div>

            <div className="currency-pill green-pill">
              <span className="currency-emoji">
                ⭐
              </span>

              <span className="currency-amount green-amount">
                {(heroData.points ?? 0).toLocaleString('es-AR')}
              </span>
            </div>

          </div>

          <Notifications userId={userId} />

        </div>

      </div>

      {/* =====================================================
          PLAYER STATS STRIP
      ====================================================== */}

      <div className="header-stats">

        <div className="stat-mini">
          <span className="stat-icon">⚡</span>
          <span className="stat-label">PAC</span>
          <strong>{heroData.stats?.pace ?? 0}</strong>
        </div>

        <div className="stat-mini">
          <span className="stat-icon">🌀</span>
          <span className="stat-label">DRI</span>
          <strong>{heroData.stats?.dribbling ?? 0}</strong>
        </div>

        <div className="stat-mini">
          <span className="stat-icon">🤝</span>
          <span className="stat-label">PAS</span>
          <strong>{heroData?.stats?.passing ?? 0}</strong>
        </div>

        <div className="stat-mini">
          <span className="stat-icon">🛡️</span>
          <span className="stat-label">DEF</span>
          <strong>{heroData.stats?.defending ?? 0}</strong>
        </div>

        <div className="stat-mini">
          <span className="stat-icon">🎯</span>
          <span className="stat-label">FIN</span>
          <strong>{heroData?.stats?.finishing ?? 0}</strong>
        </div>

        <div className="stat-mini">
          <span className="stat-icon">💪</span>
          <span className="stat-label">PHY</span>
          <strong>{heroData?.stats?.physical ?? 0}</strong>
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
    padding: calc(10px + var(--safe-top, 0px)) 16px 8px;
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    max-width: min(100%, 580px);
    margin: 0 auto;
  }

  /* ===============================
     PLAYER
  =============================== */

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
    transition: all 0.3s ease;
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
    font-size: clamp(15px, 4.5vw, 18px);
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
    letter-spacing: 0.3px;
    max-width: clamp(100px, 32vw, 220px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rarity-pill {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 2px 7px;
    border-radius: 20px;
    color: #000;
  }

  /* ===============================
     CLUB / STREAK
  =============================== */

  .club-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    flex-wrap: wrap;
  }

  .club-name-text {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    font-weight: 600;
  }

  .streak-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 20px;
    background: rgba(255, 88, 40, 0.12);
    border: 1px solid rgba(255, 88, 40, 0.3);
    color: #ff7043;
    font-size: 10px;
    font-weight: 800;
  }

  .club-name-text.gold {
    color: #00ff4c;
    font-weight: 800;
  }

  .club-name-text.silver {
    color: #c0c0c0;
    font-weight: 700;
  }

  .club-name-text.bronze {
    color: #cd7f32;
    font-weight: 700;
  }

  .club-rank-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 20px;
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

  /* ===============================
     XP
  =============================== */

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
    color: rgba(255,255,255,0.7);
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
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.35),
      transparent
    );
    animation: shine 2s infinite;
  }

  @keyframes shine {
    to {
      left: 160%;
    }
  }

  /* ===============================
     CURRENCIES
  =============================== */

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
  }

  .gold-pill {
    background: rgba(255,200,0,0.1);
    border: 1px solid rgba(255,200,0,0.25);
  }

  .green-pill {
    background: rgba(61,255,160,0.1);
    border: 1px solid rgba(61,255,160,0.25);
  }

  .gold-amount {
    color: #ffd700;
  }

  .green-amount {
    color: #3dffa0;
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

  /* ===============================
     STATS
  =============================== */

  .header-stats {
    max-width: min(100%, 580px);
    margin: 8px auto 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    padding-top: 7px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .stat-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 3px 0;
  }

  .stat-icon {
    font-size: 11px;
    line-height: 1;
  }

  .stat-label {
    font-size: 7px;
    font-weight: 700;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.5px;
  }

  .stat-mini strong {
    font-size: 12px;
    color: #fff;
    font-weight: 900;
    line-height: 1;
  }

  /* ===============================
     SKELETON
  =============================== */

  .header-skeleton {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .skel-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(
      90deg,
      #1a1a2e,
      #2a2a3e
    );
    animation: skPulse 1.5s infinite;
  }

  .skel-info {
    width: 160px;
    height: 56px;
    border-radius: 10px;
    background: linear-gradient(
      90deg,
      #1a1a2e,
      #2a2a3e
    );
    animation: skPulse 1.5s infinite;
  }

  @keyframes skPulse {
    0%, 100% {
      opacity: 0.4;
    }

    50% {
      opacity: 0.8;
    }
  }

  /* ===============================
     RESPONSIVE
  =============================== */

  @media (max-width: 420px) {

    .currencies {
      gap: 4px;
    }

    .currency-pill {
      padding: 3px 6px;
    }

    .currency-emoji {
      font-size: 13px;
    }

    .currency-amount {
      font-size: 11px;
      min-width: 28px;
    }

    .header-stats {
      gap: 1px;
    }

    .stat-icon {
      font-size: 10px;
    }

    .stat-label {
      font-size: 6px;
    }

    .stat-mini strong {
      font-size: 11px;
    }
  }

  @media (max-width: 380px) {

    .app-header {
      padding: 8px 12px;
    }

    .username {
      font-size: 15px;
    }

    .avatar-wrap {
      width: 48px;
      height: 48px;
    }

    .currency-amount {
      min-width: 28px;
      font-size: 12px;
    }

    .header-stats {
      margin-top: 6px;
    }
  }

  @media (max-width: 360px) {
    .app-header {
      padding: 6px 8px;
    }

    .user-left {
      gap: 7px;
    }

    .avatar-wrap {
      width: 42px;
      height: 42px;
    }

    .lvl-badge {
      font-size: 9px;
      padding: 1px 4px;
      right: -5px;
      bottom: -3px;
    }

    .username {
      font-size: 13px;
      max-width: 85px;
    }

    .rarity-pill {
      font-size: 8px;
      padding: 1px 5px;
    }

    .club-name-text {
      font-size: 11px;
    }

    .currency-pill {
      padding: 2px 5px;
      gap: 3px;
    }

    .currency-emoji {
      font-size: 11px;
    }

    .currency-amount {
      font-size: 10px;
      min-width: 22px;
    }

    .header-stats {
      gap: 0;
    }

    .stat-label {
      font-size: 6px;
    }

    .stat-mini strong {
      font-size: 10px;
    }
  }
`;