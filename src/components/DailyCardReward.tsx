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
            <p className='proximo'>Próximo Sobre</p>
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
  align-items: center;

  width: 100%;
  flex: 1;              /* 👈 clave */
  min-height: 300px;    /* fallback */
}

/* SOBRE */
.pack {
          width: 320px;
          height: 390px;
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
          
        }

        

/* 👇 ESTE ES EL FIX CLAVE */
.pack::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55); /* oscurece la imagen */
  
}
  .pack-content {
  position: relative;
  top: 10px;
  
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
          font-size: 28px;
          letter-spacing: 2px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        /* TEXTO PRINCIPAL - ESTILO FIFA ULTIMATE TEAM */
.pack-content p {
  font-size: 22px;
  color: #ffffff;
  margin-top: 20px;
  font-weight: 700;
  font-family: 'Teko', 'Poppins', sans-serif;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  background: linear-gradient(135deg, #fff, #e0e0e0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  display: inline-block;
}

/* Versión con número (ej: x3, x5) */
.pack-content p strong,
.pack-content .pack-quantity {
  font-size: 32px;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
  animation: quantityPop 0.4s ease-out;
}

@keyframes quantityPop {
  0% { transform: scale(0.5); opacity: 0; }
  80% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

        /* BOTON */
        .open-pack-btn {
          margin-top:90px;
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
          margin-top: 1px;
          color: #ffd700;
        }

        .claimed-info {
  text-align: center;
  padding: 12px;
}

.claimed-info p {
  font-size: 20px;
  margin: 8px 0;
  color: #ffd700;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

.claimed-info p:first-child {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 3px;
}

.claimed-info p:last-child {
  font-size: 28px;
  color: #3dffa0;
  text-shadow: 0 0 15px rgba(61, 255, 160, 0.5);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .claimed-info p {
    font-size: 16px;
  }
  
  .claimed-info p:last-child {
    font-size: 22px;
  }
}
        .proximo {
  /* Colores y texto */
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 3px;
  
  /* Fondo y bordes */
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 16px;
  border-radius: 30px;
  display: inline-block;
  
  /* Efectos */
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 215, 0, 0.3);
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  
  /* Animación sutil */
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  }
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