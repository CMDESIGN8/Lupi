// src/components/DailyCardReward.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UnifiedCard } from '../types/cards';

interface DailyCardRewardProps {
  userId: string;
  onCardReceived: (card: UnifiedCard) => void;
}

export function DailyCardReward({ userId, onCardReceived }: DailyCardRewardProps) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (userId) {
      checkDailyReward();
    }
  }, [userId]);

  useEffect(() => {
    if (claimed) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [claimed]);

  const checkDailyReward = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Usar maybeSingle para evitar error 406
    const { data, error } = await supabase
      .from('daily_rewards')
      .select('id, claimed')
      .eq('user_id', userId)
      .eq('reward_date', today)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking daily reward:', error);
      return;
    }
    
    setClaimed(data?.claimed || false);
  };

  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const handleClaim = async () => {
    if (claimed || loading) return;
    
    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Verificar si ya reclamó
      const { data: existing } = await supabase
        .from('daily_rewards')
        .select('id')
        .eq('user_id', userId)
        .eq('reward_date', today)
        .maybeSingle();
      
      if (existing?.id) {
        setClaimed(true);
        setLoading(false);
        return;
      }
      
      // 2. Obtener carta aleatoria (NPC no reemplazado o socio)
      const { data: availableCards } = await supabase
        .from('players')
        .select('*')
        .eq('can_be_replaced', true)
        .eq('is_replaced', false);
      
      // También obtener socios que el usuario no tiene
      const { data: userCards } = await supabase
        .from('user_cards')
        .select('socio_id')
        .eq('user_id', userId);
      
      const ownedSocioIds = new Set(userCards?.map(c => c.socio_id) || []);
      
      const { data: availableSocios } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId);
      
      const filteredSocios = (availableSocios || []).filter(s => !ownedSocioIds.has(s.id));
      
      // Combinar NPCs y socios disponibles
      const allCards = [
        ...(availableCards || []).map(c => ({ ...c, card_type: 'npc' })),
        ...filteredSocios.map(s => ({ 
          ...s, 
          card_type: 'socio',
          overall_rating: Math.floor(
            (s.user_card_pace + s.user_card_dribbling + s.user_card_passing + 
             s.user_card_defending + s.user_card_finishing + s.user_card_physical) / 6
          )
        }))
      ];
      
      if (allCards.length === 0) {
        alert('¡Completaste todo el álbum! 🎉');
        setLoading(false);
        return;
      }
      
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      
      // 3. Guardar la carta
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          card_type: randomCard.card_type,
          ...(randomCard.card_type === 'npc' 
            ? { player_id: randomCard.id }
            : { socio_id: randomCard.id }),
          level: 1,
          obtained_at: new Date(),
        });
      
      if (insertError) throw insertError;
      
      // 4. Registrar daily reward
      await supabase
        .from('daily_rewards')
        .insert({
          user_id: userId,
          reward_date: today,
          claimed: true,
          claimed_at: new Date(),
        });
      
      setClaimed(true);
      onCardReceived(randomCard as UnifiedCard);
      
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Error al obtener la carta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="daily-card-reward">
      <div className="reward-card">
        <div className="reward-icon">🎁</div>
        <h3>¡Carta Diaria!</h3>
        <p>Una nueva carta para tu colección</p>
        
        {!claimed ? (
          <button 
            className="claim-btn"
            onClick={handleClaim}
            disabled={loading}
          >
            {loading ? 'Obteniendo...' : '📦 Abrir Caja'}
          </button>
        ) : (
          <div className="claimed-info">
            <p>✅ Ya reclamaste tu carta hoy</p>
            <p className="countdown">⏰ Próxima en {timeLeft}</p>
          </div>
        )}
      </div>
      
      <style>{`
        .daily-card-reward {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          border: 1px solid var(--accent);
        }
        
        .reward-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        
        .reward-card h3 {
          font-family: var(--font-display);
          font-size: 20px;
          margin-bottom: 8px;
          color: var(--accent);
        }
        
        .reward-card p {
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 20px;
        }
        
        .claim-btn {
          background: linear-gradient(135deg, var(--accent), #ffd700);
          border: none;
          border-radius: 40px;
          padding: 12px 24px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .claim-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .claim-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .claimed-info {
          color: var(--success);
        }
        
        .countdown {
          font-size: 14px;
          font-family: monospace;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}