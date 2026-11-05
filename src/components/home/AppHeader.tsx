// components/home/AppHeader.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

import { useClubRanking } from '../../hooks/useClubRanking';
import { RARITY_CONFIG } from '../../utils/userProgression';
import { Notifications } from '../Notifications';
import { useHeroDataCached } from '../../hooks/useHeroData';
import { useAvatarAppearance } from '../../hooks/useAvatarAppearance';
import { AvatarFace } from '../AvatarFace';

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
const { appearance, loading: appearanceLoading } = useAvatarAppearance(userId);

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

  if (heroLoading || appearanceLoading || !user || !heroData) {
    return (
      <header className="app-header">
        <div className="user-panel-shell user-panel-shell--loading">
          <div className="header-inner">
            <div className="header-skeleton">
              <div className="skel-avatar" />
              <div className="skel-info" />
            </div>
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
      <div className="user-panel-shell">
      <div className="header-inner">

        {/* =====================================================
            LEFT — PLAYER
        ====================================================== */}

        <div className="user-left">

          <div
            className="avatar-wrap"
          >
            <span className="avatar-face-frame">
              <AvatarFace appearance={appearance} mood="presentation" className="avatar-face" />
            </span>

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
                    background: 'linear-gradient(90deg, #168bda, #22d7e8 58%, #7af3e1)',
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
    background: rgba(5, 13, 22, 0.78);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(89, 205, 220, .12);
    padding: calc(12px + var(--safe-top, 0px)) 16px 12px;
  }

  .user-panel-shell {
    position: relative;
    isolation: isolate;
    width: min(100%, 1100px);
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid rgba(64, 197, 231, .34);
    border-radius: 18px;
    background:
      radial-gradient(ellipse at 8% 0%, rgba(17, 143, 205, .2), transparent 40%),
      linear-gradient(112deg, rgba(7, 28, 49, .99), rgba(5, 17, 34, .99) 56%, rgba(7, 24, 43, .99));
    box-shadow: 0 14px 34px rgba(0, 0, 0, .28), 0 0 28px rgba(15, 156, 215, .08), inset 0 1px rgba(191, 240, 255, .09);
  }

  .user-panel-shell::before {
    content: "";
    position: absolute;
    z-index: -1;
    top: -90px;
    left: 15%;
    width: 38%;
    height: 150px;
    border-radius: 50%;
    background: rgba(16, 178, 229, .14);
    filter: blur(38px);
    pointer-events: none;
  }

  .user-panel-shell::after {
    content: "";
    position: absolute;
    z-index: -1;
    top: -116px;
    right: 7%;
    width: 250px;
    height: 250px;
    border: 1px solid rgba(60, 206, 245, .17);
    border-radius: 50%;
    box-shadow: 0 0 0 19px rgba(60, 206, 245, .05), 0 0 0 42px rgba(60, 206, 245, .035);
    pointer-events: none;
  }

  .user-panel-shell--loading {
    min-height: 94px;
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: none;
    margin: 0 auto;
    padding: 14px 18px 8px;
    position: relative;
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
    isolation: isolate;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2.5px solid #22c9ed;
    flex-shrink: 0;
    overflow: visible;
    box-shadow: 0 0 0 3px rgba(49, 198, 242, .2), 0 0 20px rgba(20, 160, 238, .28);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .avatar-wrap::before {
    content: "";
    position: absolute;
    z-index: -1;
    inset: -5px;
    border-radius: 50%;
    background: conic-gradient(from 35deg, #36eff4, #1689dc 30%, #72e8ff 52%, #1467bd 74%, #36eff4);
    opacity: .94;
  }

  .avatar-wrap:hover {
    transform: translateY(-2px) scale(1.035);
    box-shadow: 0 0 0 4px rgba(49, 198, 242, .25), 0 0 28px rgba(20, 160, 238, .38);
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  .avatar-face-frame {
    position: absolute;
    inset: 3px;
    display: block;
    overflow: hidden;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 25%, #274c63, #07131f 75%);
  }

  .avatar-face-frame .avatar-face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    transform: scale(.92);
    transform-origin: center 54%;
    filter: saturate(1.12) contrast(1.04) drop-shadow(0 2px 4px rgba(0, 0, 0, .38));
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
    color: #17120a;
    box-shadow: inset 0 1px rgba(255,255,255,.35), 0 2px 8px rgba(0,0,0,.2);
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
    color: #73dce9;
    letter-spacing: 1px;
  }

  .xp-nums {
    font-size: 10px;
    color: rgba(255,255,255,0.7);
    font-family: monospace;
  }

  .xp-track {
    height: 7px;
    background: linear-gradient(90deg, rgba(255,255,255,.1), rgba(255,255,255,.045));
    border: 1px solid rgba(190, 236, 240, .08);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0,0,0,.35);
  }

  .xp-fill {
    height: 100%;
    border-radius: 8px;
    transition: width 0.5s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(40, 222, 217, .28);
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
    box-shadow: inset 0 1px rgba(255,255,255,.05), 0 3px 10px rgba(0,0,0,.12);
  }

  .gold-pill {
    background: rgba(255,200,0,0.1);
    border: 1px solid rgba(255,200,0,0.25);
  }

  .green-pill {
    background: rgba(28, 203, 232, .1);
    border: 1px solid rgba(60, 214, 244, .3);
  }

  .gold-amount {
    color: #ffd700;
  }

  .green-amount {
    color: #61e8f1;
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
    position: relative;
    max-width: none;
    margin: 7px 18px 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    padding-top: 7px;
    border-top: 1px solid rgba(148, 221, 231, .12);
  }

  .stat-mini {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 5px 2px 4px;
    border: 1px solid rgba(116, 196, 209, .12);
    border-radius: 9px;
    background: linear-gradient(145deg, rgba(18, 49, 62, .62), rgba(7, 20, 31, .68));
    box-shadow: inset 0 1px rgba(255,255,255,.035);
    transition: border-color .2s ease, transform .2s ease, background .2s ease;
  }

  .stat-mini:hover {
    transform: translateY(-2px);
    border-color: rgba(104, 226, 228, .4);
    background: linear-gradient(145deg, rgba(22, 65, 78, .8), rgba(8, 25, 36, .82));
  }

  .stat-icon {
    font-size: 11px;
    line-height: 1;
  }

  .stat-label {
    font-size: 7px;
    font-weight: 700;
    color: rgba(180, 221, 226, .62);
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

    .app-header {
      padding: calc(8px + var(--safe-top, 0px)) 10px 9px;
    }

    .user-panel-shell {
      border-radius: 15px;
    }

    .header-inner {
      gap: 7px;
      padding: 10px 10px 7px;
    }

    .header-stats {
      margin: 6px 10px 0;
      padding-top: 6px;
    }

    .header-right {
      gap: 6px;
    }

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
      padding: calc(7px + var(--safe-top, 0px)) 8px 8px;
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
      padding: calc(6px + var(--safe-top, 0px)) 6px 7px;
    }

    .user-left {
      gap: 7px;
    }

    .avatar-wrap {
      width: 46px;
      height: 46px;
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
