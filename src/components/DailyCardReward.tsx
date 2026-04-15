// src/components/DailyCardReward.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Player, UserCard } from '../types/cards';
import { generateCardStats } from '../utils/cardGenerator';

interface DailyCardRewardProps {
  userId: string;
  onCardReceived: (card: UserCard) => void;
}

export function DailyCardReward({ userId, onCardReceived }: DailyCardRewardProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(false);
  const [newCard, setNewCard] = useState<Player | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    checkDailyReward();
  }, [userId]);

  const checkDailyReward = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_rewards')
      .select('claimed')
      .eq('user_id', userId)
      .eq('reward_date', today)
      .maybeSingle();
    
    if (error) console.error(error);
    setCanClaim(!data?.claimed);
    setLoading(false);
  };

  const claimDailyCard = async () => {
    if (!canClaim) return;
    setLoading(true);
    
    try {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*');
      
      if (playersError) throw playersError;
      if (!players || players.length === 0) throw new Error('No hay jugadores');
      
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      const stats = generateCardStats(randomPlayer.position, randomPlayer.category);
      
      const { data: userCard, error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          player_id: randomPlayer.id,
          level: 1,
          experience: 0
        })
        .select('*, player:players(*)')
        .single();
      
      if (insertError) throw insertError;
      
      await supabase.from('daily_rewards').insert({
        user_id: userId,
        reward_date: new Date().toISOString().split('T')[0],
        claimed: true,
        player_id: randomPlayer.id,
        claimed_at: new Date().toISOString()
      });
      
      setNewCard(randomPlayer);
      setShowReveal(true);
      
      setTimeout(() => {
        setShowReveal(false);
        onCardReceived(userCard);
        setCanClaim(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al obtener tu carta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canClaim && !loading) {
      const updateTimer = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const diff = tomorrow.getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [canClaim, loading]);

  if (loading) return <div className="daily-card-placeholder"><div className="spinner" /></div>;

  return (
    <>
      <div className="daily-card-container fade-up">
        <div className="daily-card-header">
          <span className="daily-icon">🎴</span>
          <span className="daily-title">CARTA DIARIA</span>
        </div>
        <div className="daily-card-content">
          {canClaim ? (
            <button className="daily-claim-btn pulse" onClick={claimDailyCard}>
              <span className="btn-icon">✨</span>
              ABRIR SOBRE
              <span className="btn-sub">¡Nueva carta gratis!</span>
            </button>
          ) : (
            <div className="daily-cooldown">
              <span className="cooldown-icon">⏰</span>
              <span>Próxima carta en</span>
              <strong>{timeLeft}</strong>
            </div>
          )}
        </div>
        <div className="daily-card-footer">
          <span>📊 150 cartas disponibles</span>
          <span>⭐ Completa el álbum</span>
        </div>
      </div>
      
      {showReveal && newCard && (
        <div className="card-reveal-modal">
          <div className="card-reveal-content">
            <div className="card-pack">🎴✨</div>
            <div className="card-name">{newCard.name}</div>
            <div className="card-badge">
              <span className="position">{newCard.position}</span>
              <span className="category">{newCard.category}</span>
            </div>
            <div className="card-stats">
              <div className="stat">OVR {newCard.overall_rating}</div>
              <div className="stat-row">
                <span>⚡ {newCard.pace}</span>
                <span>🪄 {newCard.dribbling}</span>
                <span>🎯 {newCard.finishing}</span>
              </div>
            </div>
            <div className="card-message">¡Nueva carta agregada!</div>
          </div>
        </div>
      )}
      
      <style>{`
        .daily-card-container {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid #ffd700;
          border-radius: 20px;
          padding: 16px;
          margin: 16px 0;
          position: relative;
          overflow: hidden;
        }
        .daily-card-container::before {
          content: '🎴';
          position: absolute;
          right: -20px;
          bottom: -20px;
          font-size: 80px;
          opacity: 0.1;
        }
        .daily-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .daily-icon { font-size: 28px; }
        .daily-title {
          font-family: var(--font-display);
          font-size: 20px;
          letter-spacing: 2px;
          color: #ffd700;
        }
        .daily-claim-btn {
          width: 100%;
          background: linear-gradient(135deg, #ffd700, #ff8c00);
          border: none;
          border-radius: 16px;
          padding: 20px;
          color: #0a0a0f;
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .daily-claim-btn:hover { transform: scale(1.02); }
        .btn-sub { font-size: 12px; opacity: 0.8; }
        .daily-cooldown {
          text-align: center;
          padding: 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
        }
        .cooldown-icon { font-size: 32px; display: block; margin-bottom: 8px; }
        .daily-cooldown strong { font-size: 24px; color: #ffd700; display: block; margin-top: 4px; }
        .daily-card-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 11px;
          color: var(--text2);
        }
        .card-reveal-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-reveal-content {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 32px;
          padding: 32px;
          text-align: center;
          max-width: 300px;
          border: 2px solid #ffd700;
        }
        .card-pack { font-size: 80px; margin-bottom: 16px; }
        .card-name { font-family: var(--font-display); font-size: 24px; margin-bottom: 8px; }
        .card-badge { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
        .position { background: #ffd700; color: #0a0a0f; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .category { background: #ff4d6d; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .card-stats { background: rgba(255,255,255,0.1); border-radius: 16px; padding: 12px; margin-bottom: 16px; }
        .stat-row { display: flex; justify-content: space-around; margin-top: 8px; }
      `}</style>
    </>
  );
}