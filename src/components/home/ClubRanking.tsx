// components/ClubRanking.tsx
import { useState } from 'react';
import { useClubRanking } from '../../hooks/useClubRanking';

interface ClubRankingProps {
  userId: string;
}

export function ClubRanking({ userId }: ClubRankingProps) {
  const [showRanking, setShowRanking] = useState(false);
  const { clubRanking, allClubsRanking, userClub, loading } = useClubRanking(userId);

  if (loading) {
    return (
      <div className="club-ranking-loading">
        <div className="spinner-small"></div>
      </div>
    );
  }

  if (!clubRanking) return null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div className="club-ranking-container">
      <button 
        className="club-ranking-trigger"
        onClick={() => setShowRanking(!showRanking)}
      >
        <span className="trigger-icon">🏆</span>
        <span className="trigger-text">Ranking por club</span>
        <span className="trigger-arrow">{showRanking ? '▲' : '▼'}</span>
      </button>

      {showRanking && (
        <div className="club-ranking-dropdown">
          <div className="ranking-header">
            <h3>🏆 Ranking de Clubes</h3>
            <button className="close-btn" onClick={() => setShowRanking(false)}>✕</button>
          </div>

          <div className="user-club-highlight">
            <div className="highlight-icon">🔥</div>
            <div className="highlight-text">
              Tu club <strong>{userClub}</strong> está 
              <span className={`highlight-rank rank-${clubRanking.rank}`}>
                ¡{clubRanking.rank === 1 ? '1°' : clubRanking.rank === 2 ? '2°' : clubRanking.rank === 3 ? '3°' : `${clubRanking.rank}°`} en el ranking!
              </span>
            </div>
          </div>

          <div className="ranking-list">
            {allClubsRanking.slice(0, 10).map((club) => (
              <div 
                key={club.club} 
                className={`ranking-item ${club.club === userClub ? 'is-user-club' : ''}`}
              >
                <div className="rank-number">
                  {getRankIcon(club.rank)}
                </div>
                <div className="club-info">
                  <div className="club-name">
                    <span className="club-icon">🏟️</span>
                    <span>{club.club}</span>
                    {club.club === userClub && <span className="your-club-badge">(tu club)</span>}
                  </div>
                  <div className="club-stats">
                    <span className="members">{club.members} miembros</span>
                    <span className="points">{club.totalPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .club-ranking-container {
          position: relative;
        }

        .club-ranking-trigger {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 40px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #ffd700;
          font-size: 14px;
          font-weight: 600;
        }

        .club-ranking-trigger:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.02);
        }

        .trigger-icon {
          font-size: 18px;
        }

        .trigger-arrow {
          font-size: 12px;
          opacity: 0.7;
        }

        .club-ranking-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          width: 360px;
          max-width: 90vw;
          background: linear-gradient(145deg, #12121f, #0a0a14);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          overflow: hidden;
          backdrop-filter: blur(10px);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ranking-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ranking-header h3 {
          font-family: 'Teko', 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: rgba(255, 255, 255, 0.6);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .user-club-highlight {
          background: linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.05));
          margin: 16px;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 107, 107, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .highlight-icon {
          font-size: 32px;
        }

        .highlight-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }

        .highlight-text strong {
          color: #fff;
        }

        .highlight-rank {
          display: inline-block;
          margin-left: 6px;
          font-weight: 800;
        }

        .highlight-rank.rank-1 {
          color: #ffd700;
        }

        .highlight-rank.rank-2 {
          color: #c0c0c0;
        }

        .highlight-rank.rank-3 {
          color: #cd7f32;
        }

        .ranking-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .ranking-list::-webkit-scrollbar {
          width: 6px;
        }

        .ranking-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .ranking-list::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 3px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s ease;
        }

        .ranking-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .ranking-item.is-user-club {
          background: rgba(255, 215, 0, 0.08);
          border-left: 3px solid #ffd700;
        }

        .rank-number {
          width: 40px;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
        }

        .club-info {
          flex: 1;
        }

        .club-name {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 4px;
          font-weight: 600;
          color: #fff;
        }

        .club-icon {
          font-size: 14px;
        }

        .your-club-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(255, 215, 0, 0.15);
          border-radius: 12px;
          color: #ffd700;
        }

        .club-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .club-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .club-ranking-loading {
          padding: 8px;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 215, 0, 0.2);
          border-top-color: #ffd700;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .club-ranking-dropdown {
            position: fixed;
            top: 56px;
            left: 16px;
            right: 16px;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}