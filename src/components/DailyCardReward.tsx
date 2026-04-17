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
    
    <div className={`pack ${!claimed ? 'available' : 'opened'}`}>
      
      {/* Brillo plástico */}
      <div className="pack-shine" />


      {/* Contenido */}
      <div className="pack-content">
        <br></br>
        <h3>SOBRE DIARIO</h3>
        <p className="pack-description">
    Abrí tu sobre 
    <br></br>Descubrí qué jugador <br></br>te toca hoy
  </p>

        {!claimed ? (
          <button 
            className="open-pack-btn"
            onClick={handleClaim}
            disabled={loading}
          >
            {loading ? 'Abriendo...' : '📦 Abrir Sobre'}
          </button>
        ) : (
          <div className="claimed-info">
            <p>✅ Ya abriste tu sobre</p>
            <p className="countdown">⏰ {timeLeft}</p>
          </div>
        )}
      </div>

      {/* Borde foil */}
      <div className="pack-border" />

    </div>
      
      <style>{`
        /* CONTENEDOR */
.daily-card-reward {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* SOBRE */
.pack {
  width: 220px;
          height: 290px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid rgb(255, 222, 38);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .pack-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
          pointer-events: none;
          z-index: 0;
        }

        

/* 👇 ESTE ES EL FIX CLAVE */
.pack::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55); /* oscurece la imagen */
  z-index: 1;
}
  .pack-content {
  position: relative;
  top: 10px;
  z-index: 2;
}
  .pack::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(10, 10, 20, 0.56), rgba(10, 10, 20, 0.63)),
  url('/images/fifa-pack-bg.png');
  background-size: cover;
background-position: center;
background-repeat: no-repeat;
  z-index: 1;
}
/* EFECTO HOVER */
.pack.available:hover {
          transform: translateY(-6px) scale(1.05) rotate(-1deg);
          box-shadow: 0 15px 40px rgba(0,0,0,0.5);
          border-color: rgba(255, 215, 0, 0.6);
        }


/* BRILLO */
.pack-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255,255,255,0.2),
            transparent
          );
          animation: packShine 4s infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes packShine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }

/* BORDE FOIL */
.pack-border {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          border: 2px solid transparent;
          pointer-events: none;
          z-index: 3;
        }

/* CONTENIDO */
        .pack-content {
          position: relative;
          z-index: 4;
          padding: 35px 10px;
          text-align: center;
        }

        /* ICONO */
        .pack-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 10px;
  animation: floatPack 2s infinite ease-in-out;
  filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));
}
        @keyframes floatPack {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }

        /* TITULO */
        .pack-content h3 {
          font-size: 16px;
          letter-spacing: 2px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        /* TEXTO */
        .pack-content p {
          font-size: 18px;
          color: rgb(255, 255, 255);
          margin-bottom: 10px;
          margin-top: 20px;
          font-weight: 500;
        }

        /* BOTON */
        .open-pack-btn {
          background: linear-gradient(135deg, #ffd700, #ff9800);
          border: none;
          border-radius: 30px;
          padding: 10px 20px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          color: #1a1a2e;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }

        .open-pack-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
        }

        .open-pack-btn:disabled {
          opacity: 0.6;
          transform: none;
        }

        /* CLAIMED */
        .pack.opened {
          opacity: 0.7;
          filter: grayscale(0.3);
          cursor: default;
        }

        .pack.opened:hover {
          transform: none;
        }

        /* COUNTDOWN */
        .claimed-info {
          margin-top: 10px;
        }

        .claimed-info p {
          font-size: 11px;
          margin: 4px 0;
        }

        .countdown {
          font-family: monospace;
          font-size: 13px;
          margin-top: 6px;
          color: #ffd700;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}