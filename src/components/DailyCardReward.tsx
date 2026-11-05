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
      <div className="card-obtained-overlay" onClick={(event) => { event.stopPropagation(); closeCardModal(); }}>
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
    <section className="daily-card-reward" aria-label="Recompensa diaria">
      <div className={`pack-wrapper ${isOpening ? 'opening' : ''}`}>
        <div className={`pack ${!claimed && !isOpening ? 'available' : 'opened'} ${claimed && !isOpening ? 'completed' : ''} ${isOpening ? 'opening-animation' : ''}`}>
          <div className="pack-ambient-glow" aria-hidden="true" />
          <div className="pack-shine" aria-hidden="true" />
          <div className="pack-sparkles" aria-hidden="true">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="sparkle" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>

          <div className="pack-content">
            {!isOpening && !claimed && (
              <>
                <span className="pack-eyebrow">LUPI WORLD · INVENTARIO</span>
                <div className="pack-envelope-wrap" aria-hidden="true">
                  <span className="pack-envelope-halo" />
                  <img
                    className="pack-envelope-art"
                    src="/images/lupi-pack-envelope.png"
                    alt=""
                    draggable={false}
                  />
                </div>
                <h3>Tu próxima carta</h3>
                <p className="pack-description">Abrí el sobre y descubrí quién se suma a tu equipo.</p>
                <button className="open-pack-btn" onClick={handleClaim} disabled={loading} type="button">
                  {loading ? <span className="btn-loading">⚡ ABRIENDO...</span> : <span className="btn-text">ABRIR SOBRE →</span>}
                </button>
              </>
            )}

            {(isOpening || claimed) && !showCardModal && (
              <div className="opening-state">
                {isOpening ? (
                  <div className="pack-opening-scene" role="status" aria-live="polite">
                    <span className="pack-scene-kicker">LUPI WORLD · REVELACIÓN</span>
                    <div className="pack-burst" aria-hidden="true">
                      <div className="pack-rays" />
                      <div className="pack-rip-top"><span>✦</span></div>
                      <div className="pack-rip-body"><strong>LW</strong><small>PLAYER CARD</small></div>
                      <div className="pack-emerging-card"><span>♛</span><strong>?</strong></div>
                      {Array.from({ length: 18 }, (_, i) => <i key={i} className="pack-particle" style={{ '--p': i } as React.CSSProperties} />)}
                    </div>
                    <h3>El próximo fichaje…</h3>
                    <p className="pack-scene-copy">Abriendo tu sobre. Prepará tu quinteto.</p>
                    <div className="pack-energy" aria-hidden="true"><span /></div>
                  </div>
                ) : (
                  <div className="pack-complete-scene" role="status">
                    <span className="pack-scene-kicker">LUPI WORLD · INVENTARIO</span>
                    <div className="pack-complete-cards" aria-hidden="true"><i /><i /><i><span>♛</span><b>✓</b></i></div>
                    <h3>Fichaje completado</h3>
                    <p className="pack-scene-copy">Tu carta ya forma parte de la colección.</p>
                    <div className="pack-next-drop"><span>PRÓXIMO SOBRE</span><strong>{timeLeft || 'Calculando…'}</strong><small>Volvé para descubrir otro jugador.</small></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="pack-ribbon ribbon-left" aria-hidden="true" />
          <div className="pack-ribbon ribbon-right" aria-hidden="true" />
        </div>
      </div>
      <style>{dailyStyles}</style>
    </section>
  );
}

// Estilos del sobre
const dailyStyles = `
.daily-card-reward {
  --lupi-gold: #f2d18a;
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 610px;
  padding: 36px 18px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 42%, rgba(34, 128, 170, .40), transparent 48%),
    radial-gradient(ellipse at 12% 90%, rgba(21, 67, 100, .42), transparent 42%),
    linear-gradient(145deg, #071725 0%, #102b3b 52%, #07131f 100%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.daily-card-reward::before,
.daily-card-reward::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
.daily-card-reward::before {
  opacity: .5;
  background:
    radial-gradient(circle at 14% 19%, #81efff 0 1.5px, transparent 4px),
    radial-gradient(circle at 87% 27%, #81efff 0 1.5px, transparent 4px),
    radial-gradient(circle at 79% 78%, #81efff 0 1.5px, transparent 4px),
    repeating-linear-gradient(118deg, transparent 0 52px, rgba(159, 222, 255, .035) 53px 54px);
}
.daily-card-reward::after {
  background: linear-gradient(90deg, rgba(1, 8, 15, .26), transparent 22% 78%, rgba(1, 8, 15, .26));
}
.daily-card-reward .pack-wrapper {
  position: relative;
  z-index: 1;
  width: min(100%, 410px);
  perspective: 1000px;
}
.daily-card-reward .pack {
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: 570px;
  overflow: hidden;
  border: 1px solid rgba(127, 220, 245, .22);
  border-radius: 28px;
  background:
    radial-gradient(ellipse at 50% 35%, rgba(31, 112, 147, .29), transparent 58%),
    linear-gradient(155deg, rgba(10, 31, 46, .96), rgba(4, 14, 24, .98));
  box-shadow: 0 28px 80px rgba(0, 0, 0, .48), 0 0 46px rgba(54, 191, 220, .09), inset 0 1px rgba(255,255,255,.06);
  transition: transform .3s ease, box-shadow .3s ease;
}
.daily-card-reward .pack::before { content: none !important; }
.daily-card-reward .pack::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,.035) 48%, transparent 72%);
  pointer-events: none;
}
.daily-card-reward .pack-ambient-glow {
  position: absolute;
  top: 8%;
  left: 50%;
  width: min(76%, 300px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(38, 209, 227, .20), rgba(30, 121, 167, .10) 38%, transparent 70%);
  filter: blur(12px);
  transform: translateX(-50%);
  pointer-events: none;
}
.daily-card-reward .pack-shine {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.10) 50%, transparent 65%);
  animation: lupiPackShine 5s ease-in-out infinite;
  pointer-events: none;
}
.daily-card-reward .pack-sparkles { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.daily-card-reward .sparkle {
  position: absolute;
  top: calc(10% + (var(--i) * 6.5%));
  left: calc(8% + (var(--i) * 7%));
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8cf0ff;
  box-shadow: 0 0 10px 2px rgba(88, 222, 255, .65);
  opacity: 0;
  animation: lupiPackSparkle 2.8s ease-in-out infinite;
  animation-delay: calc(var(--i) * .17s);
}
.daily-card-reward .pack-content {
  box-sizing: border-box;
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 570px;
  padding: 34px clamp(20px, 6vw, 34px) 30px;
  text-align: center;
}
.daily-card-reward .pack-eyebrow,
.daily-card-reward .pack-scene-kicker {
  display: block;
  margin: 0 0 8px;
  color: #9bd8e5;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: .21em;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0,0,0,.65);
}
.daily-card-reward .pack-envelope-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 272px;
  margin: 0 0 4px;
  perspective: 900px;
}
.daily-card-reward .pack-envelope-halo {
  position: absolute;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(46, 210, 230, .22), rgba(39, 125, 182, .11) 42%, transparent 72%);
  filter: blur(8px);
  animation: lupiEnvelopeGlow 3.8s ease-in-out infinite;
}
.daily-card-reward .pack-envelope-art {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  height: 252px;
  max-width: min(68%, 210px);
  object-fit: contain;
  filter: drop-shadow(0 18px 24px rgba(0,0,0,.48)) drop-shadow(0 0 18px rgba(49,216,234,.18));
  transform-origin: 50% 65%;
  animation: lupiEnvelopeFloat 3.8s ease-in-out infinite;
  user-select: none;
  pointer-events: none;
}
.daily-card-reward .pack-content h3 {
  margin: 4px 0 10px;
  color: #f7fbff;
  font-size: clamp(24px, 6vw, 30px);
  font-weight: 950;
  letter-spacing: -.035em;
  line-height: 1.08;
  text-shadow: 0 3px 14px rgba(0,0,0,.65);
}
.daily-card-reward .pack-description,
.daily-card-reward .pack-scene-copy {
  max-width: 292px;
  margin: 0 0 22px;
  color: rgba(218, 237, 246, .82);
  font-size: 13px;
  line-height: 1.55;
  text-shadow: 0 2px 8px rgba(0,0,0,.6);
}
.daily-card-reward .open-pack-btn {
  box-sizing: border-box;
  width: 100%;
  max-width: 300px;
  min-height: 50px;
  border: 1px solid rgba(255, 238, 190, .62);
  border-radius: 14px;
  padding: 13px 20px;
  background: linear-gradient(110deg, #ffe5a0, #e4b84f);
  color: #102238;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: .09em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(231, 185, 76, .23), inset 0 1px rgba(255,255,255,.42);
  transition: transform .2s ease, filter .2s ease, box-shadow .2s ease;
}
.daily-card-reward .open-pack-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 12px 28px rgba(231,185,76,.34); }
.daily-card-reward .open-pack-btn:active:not(:disabled) { transform: scale(.985); }
.daily-card-reward .open-pack-btn:disabled { cursor: wait; opacity: .78; }
.daily-card-reward .btn-loading { animation: lupiPackPulse 1s ease-in-out infinite; }
.daily-card-reward .pack.available { cursor: pointer; }
.daily-card-reward .pack.available:hover { transform: translateY(-3px); box-shadow: 0 34px 90px rgba(0,0,0,.52), 0 0 54px rgba(54,191,220,.14); }
.daily-card-reward .pack.opening-animation { animation: none; opacity: 1; transform: none; }
.daily-card-reward .pack.opening-animation .pack-opening-scene { animation: lupiRevealEnter .45s cubic-bezier(.16,1,.3,1) both; }
.daily-card-reward .opening-state,
.daily-card-reward .pack-opening-scene,
.daily-card-reward .pack-complete-scene { width: 100%; text-align: center; }
.daily-card-reward .pack-burst { position: relative; width: 180px; height: 200px; margin: 12px auto 20px; }
.daily-card-reward .pack-rays { position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(rgba(255,222,121,.32) 0 7deg, transparent 7deg 18deg); animation: lupiPackSpin 12s linear infinite; mask-image: radial-gradient(circle, transparent 0 20%, #000 65%, transparent 72%); }
.daily-card-reward .pack-rip-top,
.daily-card-reward .pack-rip-body,
.daily-card-reward .pack-emerging-card { position: absolute; top: 34px; left: 50%; display: grid; place-items: center; width: 88px; height: 118px; border: 1px solid rgba(255,222,121,.8); border-radius: 9px; background: linear-gradient(145deg,#164765,#071b2c); color: #eafaff; box-shadow: 0 0 26px rgba(89,218,255,.25); transform: translateX(-50%) rotate(-6deg); }
.daily-card-reward .pack-rip-body strong { color: #48d9ee; font-size: 26px; }
.daily-card-reward .pack-rip-body small { font-size: 7px; letter-spacing: 1px; }
.daily-card-reward .pack-emerging-card { top: 8px; z-index: 2; width: 78px; height: 106px; color: #ffe08a; font-size: 30px; transform: translateX(-50%) rotate(7deg); animation: lupiCardRise 1.2s ease-in-out infinite alternate; }
.daily-card-reward .pack-particle { position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; border-radius: 50%; background: #ffe28a; box-shadow: 0 0 10px #ffe28a; animation: lupiParticle 1.4s ease-out infinite; animation-delay: calc(var(--p) * .04s); }
.daily-card-reward .pack-energy { width: min(80%,220px); height: 4px; margin: 20px auto 0; overflow: hidden; border-radius: 9px; background: rgba(255,255,255,.15); }
.daily-card-reward .pack-energy span { display: block; width: 35%; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#40d9ff,#ffe28a); box-shadow: 0 0 14px #40d9ff; animation: lupiPackProgress 1.2s ease-in-out infinite alternate; }
.daily-card-reward .pack-complete-cards { position: relative; width: 150px; height: 115px; margin: 12px auto 22px; }
.daily-card-reward .pack-complete-cards i { position: absolute; top: 8px; left: 50%; width: 70px; height: 100px; border: 1px solid rgba(255,222,121,.75); border-radius: 8px; background: linear-gradient(145deg,#164765,#071b2c); transform: translateX(-50%) rotate(-12deg); }
.daily-card-reward .pack-complete-cards i:nth-child(2) { transform: translateX(-50%) rotate(12deg); }
.daily-card-reward .pack-complete-cards i:nth-child(3) { display: grid; place-items: center; color: #ffe28a; font-size: 28px; transform: translateX(-50%); }
.daily-card-reward .pack-complete-cards b { position: absolute; right: -8px; bottom: -8px; display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #38d69f; color: #05271c; font-size: 15px; }
.daily-card-reward .pack-next-drop { display: grid; gap: 8px; width: min(100%,270px); margin: 12px auto 0; padding: 14px; border: 1px solid rgba(132,223,255,.2); border-radius: 14px; background: rgba(0,0,0,.3); }
.daily-card-reward .pack-next-drop span { color: #aeeaff; font-size: 9px; font-weight: 800; letter-spacing: 2px; }
.daily-card-reward .pack-next-drop strong { color: #70f0b2; font-family: monospace; font-size: 24px; }
.daily-card-reward .pack-next-drop small { color: rgba(255,255,255,.72); font-size: 11px; }
.daily-card-reward .pack.completed { min-height: 450px; }
.daily-card-reward .pack.completed .pack-content {
  min-height: 450px;
  padding: 24px 26px;
}
.daily-card-reward .pack.completed .pack-scene-kicker { margin-bottom: 6px; }
.daily-card-reward .pack.completed .pack-complete-cards {
  width: 126px;
  height: 88px;
  margin: 2px auto 14px;
}
.daily-card-reward .pack.completed .pack-complete-cards i {
  top: 4px;
  left: 50%;
  width: 58px;
  height: 80px;
}
.daily-card-reward .pack.completed .pack-complete-cards i:nth-child(2) { transform: translateX(-50%) rotate(12deg); }
.daily-card-reward .pack.completed .pack-complete-cards i:nth-child(3) { transform: translateX(-50%); }
.daily-card-reward .pack.completed .pack-complete-cards span { font-size: 24px; }
.daily-card-reward .pack.completed .pack-complete-cards b { width: 23px; height: 23px; right: -6px; bottom: -6px; }
.daily-card-reward .pack.completed .pack-content h3 { margin-bottom: 8px; font-size: clamp(23px, 5.5vw, 27px); }
.daily-card-reward .pack.completed .pack-scene-copy { margin-bottom: 14px; font-size: 12px; }
.daily-card-reward .pack.completed .pack-next-drop { gap: 5px; margin-top: 6px; padding: 11px 14px; }
.daily-card-reward .pack.completed .pack-next-drop strong { font-size: 22px; }
.daily-card-reward .pack-ribbon { display: none; }

@keyframes lupiPackShine { 0%,35% { transform: translateX(-120%); } 70%,100% { transform: translateX(120%); } }
@keyframes lupiPackSparkle { 0%,100% { opacity: 0; transform: scale(.4); } 50% { opacity: .9; transform: scale(1.15); } }
@keyframes lupiEnvelopeFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-9px) rotate(2deg); } }
@keyframes lupiEnvelopeGlow { 0%,100% { opacity: .68; transform: translateX(-50%) scale(.92); } 50% { opacity: 1; transform: translateX(-50%) scale(1.08); } }
@keyframes lupiCardRise { to { margin-top: -12px; } }
@keyframes lupiParticle { from { transform: rotate(calc(var(--p) * 20deg)) translateY(0) scale(1); opacity: 1; } to { transform: rotate(calc(var(--p) * 20deg)) translateY(-82px) scale(0); opacity: 0; } }
@keyframes lupiPackProgress { to { transform: translateX(185%); } }
@keyframes lupiPackSpin { to { transform: rotate(360deg); } }
@keyframes lupiPackPulse { 50% { opacity: .55; } }
@keyframes lupiRevealEnter { from { opacity: 0; transform: translateY(12px) scale(.96); filter: brightness(1.5); } to { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); } }

@media (max-width: 480px) {
  .daily-card-reward { min-height: 560px; padding: 24px 12px; }
  .daily-card-reward .pack { min-height: 540px; border-radius: 24px; }
  .daily-card-reward .pack-content { min-height: 540px; padding: 28px 20px 24px; }
  .daily-card-reward .pack-envelope-wrap { height: 246px; }
  .daily-card-reward .pack-envelope-art { height: 224px; max-width: min(66%, 190px); }
  .daily-card-reward .pack-description { margin-bottom: 18px; font-size: 12px; }
}
@media (max-width: 360px) {
  .daily-card-reward { min-height: 520px; }
  .daily-card-reward .pack, .daily-card-reward .pack-content { min-height: 500px; }
  .daily-card-reward .pack-envelope-wrap { height: 218px; }
  .daily-card-reward .pack-envelope-art { height: 202px; }
  .daily-card-reward .pack-content h3 { font-size: 23px; }
}
@media (prefers-reduced-motion: reduce) {
  .daily-card-reward *, .daily-card-reward *::before, .daily-card-reward *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
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