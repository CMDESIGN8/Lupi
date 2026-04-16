// src/components/DailyCardReward.tsx (versión simplificada y corregida)
import { useState, useEffect } from 'react';
import { cardApi, PlayerCard } from '../lib/api';

interface DailyCardRewardProps {
  userId: string;
  onCardReceived: (card: PlayerCard) => void;
}

export function DailyCardReward({ userId, onCardReceived }: DailyCardRewardProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  const checkStatus = async () => {
    try {
      const result = await cardApi.checkDailyBoxStatus(userId);
      console.log('📦 Estado:', result);
      setCanClaim(!result.claimed);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [userId]);

  useEffect(() => {
    if (canClaim) {
      setTimeLeft('');
      return;
    }

    // Calcular tiempo hasta medianoche
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      
      if (diff <= 0) {
        checkStatus();
        return;
      }
      
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [canClaim]);

  const handleClaim = async () => {
    if (!canClaim) return;
    try {
      const result = await cardApi.openDailyBox(userId);
      if (result.card) {
        onCardReceived(result.card);
        await checkStatus();
      }
    } catch (error) {
      console.error('Error claiming:', error);
    }
  };

  if (loading) return <div className="daily-card-compact loading">Cargando...</div>;

  return (
    <div className="daily-card-compact">
      <div className="daily-card-header">
        <div className="daily-header-left">
          <span className="daily-icon">📦</span>
          <span className="daily-title">CARTA DIARIA</span>
        </div>
        {!canClaim && timeLeft && (
          <div className="daily-timer-badge">
            <span className="timer-icon">⏰</span>
            <span className="timer-value">{timeLeft}</span>
          </div>
        )}
      </div>
      
      <div className="daily-card-body">
        {canClaim ? (
          <button className="daily-claim-btn" onClick={handleClaim}>
            🎁 RECLAMAR CARTA GRATIS
          </button>
        ) : (
          <div className="next-card-info">
            <div className="next-card-message">
              <span>📅 Próxima carta disponible en</span>
              <div className="countdown-display">
                <div className="countdown-block">
                  <span className="countdown-number">{timeLeft.split(':')[0] || '00'}</span>
                  <span className="countdown-label">horas</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-block">
                  <span className="countdown-number">{timeLeft.split(':')[1] || '00'}</span>
                  <span className="countdown-label">min</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-block">
                  <span className="countdown-number">{timeLeft.split(':')[2] || '00'}</span>
                  <span className="countdown-label">seg</span>
                </div>
              </div>
            </div>
            <div className="claimed-badge">✅ Reclamada hoy</div>
          </div>
        )}
      </div>
      
      <div className="daily-footer">
        <span className="collection-info">📖 150 cartas disponibles para coleccionar</span>
      </div>
      
      <style>{`
        .daily-card-compact {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 20px;
          padding: 16px 20px;
          margin: 8px 0 16px 0;
          border: 1px solid rgba(24, 157, 245, 0.2);
        }
        .daily-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .daily-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .daily-icon { font-size: 24px; }
        .daily-title {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--accent);
          font-weight: bold;
        }
        .daily-timer-badge {
          background: rgba(24, 157, 245, 0.15);
          border: 1px solid rgba(24, 157, 245, 0.3);
          border-radius: 40px;
          padding: 6px 14px;
        }
        .timer-value {
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
          color: var(--accent);
        }
        .daily-claim-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--accent), #0f6bc0);
          border: none;
          border-radius: 40px;
          padding: 12px;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        .next-card-info { text-align: center; }
        .next-card-message span {
          font-size: 12px;
          color: var(--text2);
          display: block;
          margin-bottom: 8px;
        }
        .countdown-display {
          display: flex;
          justify-content: center;
          gap: 8px;
          background: rgba(0,0,0,0.3);
          border-radius: 60px;
          padding: 8px 16px;
          margin: 8px 0;
        }
        .countdown-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 50px;
        }
        .countdown-number {
          font-family: monospace;
          font-size: 24px;
          font-weight: bold;
          color: var(--accent);
        }
        .countdown-label {
          font-size: 8px;
          color: var(--text2);
          text-transform: uppercase;
        }
        .countdown-sep {
          font-size: 20px;
          color: var(--accent);
          margin-bottom: 12px;
        }
        .claimed-badge {
          display: inline-flex;
          background: rgba(61,255,160,0.15);
          border: 1px solid rgba(61,255,160,0.3);
          border-radius: 40px;
          padding: 8px 16px;
          font-size: 13px;
          color: var(--success);
          margin-top: 8px;
        }
        .daily-footer {
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .collection-info {
          font-size: 11px;
          color: var(--text2);
        }
      `}</style>
    </div>
  );
}