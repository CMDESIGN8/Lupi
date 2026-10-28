import { CardFace } from './SigningWelcome';
import './PackExperience.css';
// src/components/DailyCardReward.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UnifiedCard } from '../types/cards';

interface DailyCardRewardProps {
  userId: string;
  onCardReceived: (card: UnifiedCard) => void;
}

// ============================================================
// FUNCIONES AUXILIARES - MOVER AQUÍ (FUERA DEL COMPONENTE)
// ============================================================



const getRarityColor = (rating: number): string => {
  if (rating >= 90) return '#FFD700';
  if (rating >= 80) return '#9C27B0';
  if (rating >= 70) return '#2196F3';
  if (rating >= 60) return '#4CAF50';
  return '#888888';
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function DailyCardReward({ userId, onCardReceived }: DailyCardRewardProps) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [obtainedCard, setObtainedCard] = useState<UnifiedCard | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

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
    if (claimed || loading || isOpening) return;
    
    setIsOpening(true);
    setLoading(true);
    
    // Animación de apertura
    await new Promise(r => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1800));
    
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
        setIsOpening(false);
        setLoading(false);
        return;
      }
      
      // 2. Obtener carta aleatoria
      const { data: availableCards } = await supabase
        .from('players')
        .select('*')
        .eq('can_be_replaced', true)
        .eq('is_replaced', false);
      
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
      
      const allCards = [
        ...(availableCards || []).map(c => ({ ...c, card_type: 'npc' })),
        ...filteredSocios.map((profile): UnifiedCard => {
          const stat = (value: unknown): number => {
            const number = Number(value ?? 10);
            return Number.isFinite(number) ? number : 10;
          };
          const pace = stat(profile.user_card_pace);
          const dribbling = stat(profile.user_card_dribbling);
          const passing = stat(profile.user_card_passing);
          const defending = stat(profile.user_card_defending);
          const finishing = stat(profile.user_card_finishing);
          const physical = stat(profile.user_card_physical);
          const position = profile.position === 'arquero' || profile.position === 'cierre' || profile.position === 'pivot' ? profile.position : 'ala';
          return {
            id: profile.id,
            name: String(profile.username || profile.name || 'Jugador').trim() || 'Jugador',
            card_type: 'socio',
            profile_id: profile.id,
            is_real: true,
            position,
            category: 'socios',
            pace, dribbling, passing, defending, finishing, physical,
            overall_rating: Math.floor((pace + dribbling + passing + defending + finishing + physical) / 6),
            total_wins_lifetime: Number(profile.total_wins_lifetime) || 0,
            total_battles_lifetime: Number(profile.total_battles_lifetime) || 0,
          };
        })
      ];
      
      if (allCards.length === 0) {
        alert('¡Completaste todo el álbum! 🎉');
        setIsOpening(false);
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
      
      // 5. Mostrar la carta obtenida
      setObtainedCard(randomCard as UnifiedCard);
      setShowCardModal(true);
      
      setClaimed(true);
      onCardReceived(randomCard as UnifiedCard);
      
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Error al obtener la carta. Intenta de nuevo.');
    } finally {
      setIsOpening(false);
      setLoading(false);
    }
  };

  const closeCardModal = () => {
    setShowCardModal(false);
    setObtainedCard(null);
  };

  // Modal para mostrar la carta obtenida
  if (showCardModal && obtainedCard) {
    const rarityColor = getRarityColor(obtainedCard.overall_rating);
    
    return (
      <div className="card-obtained-overlay" onClick={closeCardModal}>
        <div className="card-obtained-container" onClick={(e) => e.stopPropagation()}>
          <div className="card-obtained-glow" />
          
          <div className="card-obtained-title">
            ¡CARTA OBTENIDA!
          </div>
          
          <div className="pack-revealed-card" style={{ borderColor: rarityColor }}>
            <CardFace item={{ card: obtainedCard }} index={0} variant="full" />
          </div>
          <p className="pack-added-note">La carta ya está en tu colección.</p>

          <button className="card-obtained-button" onClick={closeCardModal}>
            CONTINUAR
          </button>
        </div>
        <style>{modalStyles}</style>
      </div>
    );
  }

  return (
    <div className="daily-card-reward">
      <div className={`pack-wrapper ${isOpening ? 'opening' : ''}`}>
        <div className={`pack ${!claimed && !isOpening ? 'available' : 'opened'} ${isOpening ? 'opening-animation' : ''}`}>
          
          <div className="pack-shine" />
          <div className="pack-sparkles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="sparkle" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          
          <div className="pack-content">
            {!isOpening && !claimed && (
              <>
                <span className="pack-eyebrow">LUPI WORLD · INVENTARIO</span>
                <div className="pack-icon pack-sealed" aria-hidden="true"><span className="pack-sealed-mark">L<span>W</span></span><small>PLAYER CARD</small><i>✦</i></div>
                <h3>Tu próxima carta</h3>
                <p className="pack-description">
                  Abrí el sobre y descubrí quién se suma a tu equipo.
                </p>
                <button 
                  className="open-pack-btn"
                  onClick={handleClaim}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading">⚡ ABRIENDO...</span>
                  ) : (
                    <span className="btn-text">ABRIR SOBRE →</span>
                  )}
                </button>
              </>
            )}
            
            {(isOpening || claimed) && !showCardModal && (
              <div className="opening-state">
                {isOpening ? <div className="pack-opening-scene" role="status" aria-live="polite">
                  <span className="pack-scene-kicker">LUPI WORLD · REVELACIÓN</span>
                  <div className="pack-burst" aria-hidden="true">
                    <div className="pack-rays" />
                    <div className="pack-rip-top"><span>✦</span></div>
                    <div className="pack-rip-body"><strong>LW</strong><small>PLAYER CARD</small></div>
                    <div className="pack-emerging-card"><span>♛</span><strong>?</strong></div>
                    {Array.from({length:18},(_,i)=><i key={i} className="pack-particle" style={{'--p':i} as React.CSSProperties}/>)}
                  </div>
                  <h3>El próximo fichaje…</h3>
                  <p className="pack-scene-copy">Abriendo tu sobre. Prepará tu quinteto.</p>
                  <div className="pack-energy" aria-hidden="true"><span/></div>
                </div> : <div className="pack-complete-scene" role="status">
                  <span className="pack-scene-kicker">LUPI WORLD · INVENTARIO</span>
                  <div className="pack-complete-cards" aria-hidden="true"><i/><i/><i><span>♛</span><b>✓</b></i></div>
                  <h3>Fichaje completado</h3>
                  <p className="pack-scene-copy">Tu carta ya forma parte de la colección.</p>
                  <div className="pack-next-drop"><span>PRÓXIMO SOBRE</span><strong>{timeLeft || 'Calculando…'}</strong><small>Volvé para descubrir otro jugador.</small></div>
                </div>}

              </div>
            )}
          </div>

          <div className="pack-ribbon ribbon-left" />
          <div className="pack-ribbon ribbon-right" />
        </div>
      </div>
      
      <style>{dailyStyles}</style>
    </div>
  );
}

// Estilos del sobre
const dailyStyles = `
  .daily-card-reward {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 400px;
  }

  .pack-wrapper {
    perspective: 1000px;
  }

  .pack {
    width: 340px;
    height: 420px;
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 215, 0, 0.6);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    background: linear-gradient(135deg, #1a1a2e 0%, #0a0a15 100%);
  }

  .pack.available {
    cursor: pointer;
    animation: floatPack 3s ease-in-out infinite;
  }

  .pack.available:hover {
    transform: translateY(-10px) scale(1.02);
    border-color: rgba(255, 215, 0, 0.9);
    box-shadow: 0 30px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3);
  }

  .pack.opening-animation {
    animation: packOpen 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes packOpen {
    0% { transform: rotate(0deg) scale(1); opacity: 1; }
    50% { transform: rotate(5deg) scale(1.1); opacity: 0.8; }
    100% { transform: rotate(10deg) scale(0.9); opacity: 0; }
  }

  @keyframes floatPack {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  .pack::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 100, 0, 0.05));
    z-index: 0;
  }

  .pack::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%);
    pointer-events: none;
  }

  .pack-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    animation: packShine 3s infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes packShine {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }

  .pack-sparkles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }

  .sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, #ffd700, transparent);
    border-radius: 50%;
    opacity: 0;
    animation: sparkleFloat 2s infinite;
    top: calc(20% + (var(--i) * 8%));
    left: calc(10% + (var(--i) * 12%));
    animation-delay: calc(var(--i) * 0.2s);
  }

  @keyframes sparkleFloat {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1.5); }
  }

  .pack-content {
    position: relative;
    z-index: 4;
    padding: 40px 20px;
    text-align: center;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .pack-icon {
    font-size: 64px;
    margin-bottom: 20px;
    animation: bounceIcon 1s ease-in-out infinite;
    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
  }

  @keyframes bounceIcon {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .pack-content h3 {
    font-size: 28px;
    letter-spacing: 3px;
    margin-bottom: 15px;
    background: linear-gradient(135deg, #ffd700, #ffaa00);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 900;
  }

  .pack-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 30px;
    line-height: 1.6;
  }

  .open-pack-btn {
    background: linear-gradient(135deg, #ffd700, #ff9800);
    border: none;
    border-radius: 50px;
    padding: 14px 32px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #1a1a2e;
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .open-pack-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
  }

  .btn-loading {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .opening-state {
    text-align: center;
  }

  .opening-loader {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
  }

  .loader-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-top-color: #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loader-ring:nth-child(2) {
    width: 70%;
    height: 70%;
    top: 15%;
    left: 15%;
    border-top-color: #ffaa00;
    animation-duration: 0.8s;
  }

  .loader-ring:nth-child(3) {
    width: 40%;
    height: 40%;
    top: 30%;
    left: 30%;
    border-top-color: #ff6600;
    animation-duration: 0.6s;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .opening-text {
    font-size: 18px;
    font-weight: bold;
    color: #ffd700;
    letter-spacing: 2px;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .claimed-info {
    text-align: center;
    padding: 20px;
  }

  .claimed-info p {
    font-size: 18px;
    margin: 10px 0;
    color: #ffd700;
    font-weight: bold;
  }

  .proximo {
    font-size: 12px;
    letter-spacing: 3px;
    background: rgba(0, 0, 0, 0.4);
    padding: 6px 16px;
    border-radius: 30px;
    display: inline-block;
    backdrop-filter: blur(4px);
  }

  .countdown {
    font-size: 28px;
    font-family: monospace;
    color: #3dffa0;
    text-shadow: 0 0 15px rgba(61, 255, 160, 0.5);
  }

  .pack-ribbon {
    position: absolute;
    width: 60px;
    height: 30px;
    background: linear-gradient(135deg, #ffd700, #ff9800);
    top: 20px;
    z-index: 5;
  }

  .ribbon-left {
    left: -15px;
    transform: rotate(-45deg);
  }

  .ribbon-right {
    right: -15px;
    transform: rotate(45deg);
  }
`;
const modalStyles = `
  .card-obtained-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(12px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeInModal 0.3s ease;
  }

  @keyframes fadeInModal {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .card-obtained-container {
    position: relative;
    text-align: center;
    animation: slideUpModal 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
    max-width: 340px;
    width: 90%;
  }

  @keyframes slideUpModal {
    from {
      opacity: 0;
      transform: translateY(50px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .card-obtained-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent 70%);
    animation: glowPulseModal 1.5s infinite;
    pointer-events: none;
    border-radius: 50%;
  }

  @keyframes glowPulseModal {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
  }

  .card-obtained-title {
    font-size: 22px;
    font-weight: 900;
    background: linear-gradient(135deg, #ffd700, #ffaa00);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 20px;
    letter-spacing: 2px;
    text-align: center;
  }

  /* ============================================
     ESTILO DE CARTA - IGUAL QUE EN EL ÁLBUM
     ============================================ */
  .obtained-card {
    background: linear-gradient(145deg, #1a3a1a, #0d2a0d);
    border-radius: 16px;
    padding: 16px;
    position: relative;
    border: 2px solid;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .obtained-card-inner {
    position: relative;
    z-index: 2;
  }

  /* Brillo diagonal */
  .obtained-card-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      115deg,
      transparent 35%,
      rgba(255, 255, 255, 0.15) 48%,
      rgba(255, 255, 255, 0.08) 52%,
      transparent 65%
    );
    transform: rotate(28deg);
    animation: cardShine 4s infinite linear;
    pointer-events: none;
  }

  @keyframes cardShine {
    0% { transform: translateX(-35%) rotate(28deg); }
    100% { transform: translateX(35%) rotate(28deg); }
  }

  /* Brillo superior */
  .obtained-card-gloss {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
    border-radius: 16px 16px 0 0;
  }

  /* OVR */
  .obtained-card-rarity {
    position: absolute;
    top: 12px;
    left: 12px;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 16px;
    color: #fff;
    z-index: 5;
    font-family: monospace;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }

  /* Posición */
  .obtained-card-position {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    background: rgba(0,0,0,0.6);
    z-index: 5;
    border: 1px solid rgba(255,255,255,0.3);
  }

  /* Imagen */
  .obtained-card-image {
    display: flex;
    justify-content: center;
    margin: 35px 0 12px;
  }

  .obtained-card-image img {
    width: 90px;
    height: 90px;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  }

  /* Nombre */
  .obtained-card-name {
    text-align: center;
    font-weight: 800;
    font-size: 16px;
    color: white;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: linear-gradient(135deg, #fff, #ddd);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  /* Nivel */
  .obtained-card-level {
    text-align: center;
    font-size: 11px;
    color: #FFD700;
    font-weight: bold;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }

  /* Stats Grid - 3x2 como en el álbum */
  .obtained-card-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    background: rgba(0, 0, 0, 0.55);
    padding: 10px;
    border-radius: 12px;
    margin: 10px 0;
  }

  .obtained-card-stats .stat {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: rgba(0,0,0,0.3);
    padding: 4px 6px;
    border-radius: 8px;
  }

  .obtained-card-stats .stat span {
    font-size: 13px;
  }

  /* Categoría */
  .obtained-card-category {
    text-align: center;
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 8px;
    background: rgba(0,0,0,0.3);
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    width: auto;
    margin-left: auto;
    margin-right: auto;
  }

  /* Badge jugador real */
  .obtained-card-real-badge {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #e91e63, #c2185b);
    color: white;
    font-size: 8px;
    font-weight: 800;
    padding: 3px 14px;
    border-radius: 0 0 16px 16px;
    z-index: 6;
    white-space: nowrap;
    letter-spacing: 1px;
  }

  /* Botón continuar */
  .card-obtained-button {
    background: linear-gradient(135deg, #ffd700, #ff9800);
    border: none;
    border-radius: 50px;
    padding: 12px 32px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #1a1a2e;
    text-transform: uppercase;
    letter-spacing: 2px;
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
    display: block;
  }

  .card-obtained-button:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
  }

  @media (max-width: 480px) {
    .card-obtained-title {
      font-size: 18px;
      margin-bottom: 16px;
    }
    .obtained-card-name {
      font-size: 14px;
    }
    .obtained-card-stats .stat {
      font-size: 10px;
      gap: 3px;
    }
    .obtained-card-stats .stat span {
      font-size: 11px;
    }
    .obtained-card-image img {
      width: 70px;
      height: 70px;
    }
    .card-obtained-button {
      padding: 10px 24px;
      font-size: 14px;
    }
  }
`;

export default DailyCardReward;