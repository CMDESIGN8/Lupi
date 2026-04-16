/**
 * MysteryBox.tsx
 * Caja misteriosa diaria — estilo cancha de fútbol / arena de entrenamiento
 */

import { useState, useEffect } from "react";
import { cardApi, PlayerCard } from "../lib/api";
import { FifaCard } from "./FifaCard";

// ── CSS (estilo cancha/arena) ─────────────────────────────────
const BOX_CSS = `
@keyframes pitch-shimmer {
  0%, 100% { 
    background-position: 0% 0%;
    box-shadow: 0 0 20px rgba(61,255,160,0.2);
  }
  50% { 
    background-position: 100% 0%;
    box-shadow: 0 0 40px rgba(61,255,160,0.4), 0 0 60px rgba(245,197,24,0.15);
  }
}

@keyframes ball-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ground-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@keyfield card-reveal {
  0% { transform: scale(0.2) translateY(50px); opacity: 0; }
  40% { transform: scale(1.1) translateY(-10px); opacity: 1; }
  70% { transform: scale(0.98) translateY(5px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes confetti-explosion {
  0% { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}

.mystery-box-container {
  text-align: center;
  padding: 0;
  background: linear-gradient(135deg, #0a2e1a, #0a1a0f);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
}

/* Líneas de cancha de fondo */
.mystery-box-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(90deg, rgba(61,255,160,0.08) 0px, rgba(61,255,160,0.08) 2px, transparent 2px, transparent 40px),
    repeating-linear-gradient(0deg, rgba(61,255,160,0.08) 0px, rgba(61,255,160,0.08) 2px, transparent 2px, transparent 40px);
  pointer-events: none;
  border-radius: 24px;
}

/* Círculo central */
.mystery-box-container::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 2px solid rgba(61,255,160,0.15);
  border-radius: 50%;
  pointer-events: none;
}

.mystery-box-inner {
  position: relative;
  z-index: 2;
  padding: 24px 20px;
}

.mystery-box-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #1a3a2a, #0a2a1a);
  border: 3px solid var(--success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 0 20px rgba(61,255,160,0.3);
}

.mystery-box-icon.ready {
  animation: pitch-shimmer 2s ease-in-out infinite;
  border-color: var(--success);
  cursor: pointer;
}

.mystery-box-icon.shaking {
  animation: ball-rotate 0.5s ease-in-out;
}

.mystery-box-icon.opening {
  animation: ground-pulse 0.5s ease-out forwards;
}

.mystery-box-icon.ready:hover {
  transform: scale(1.08);
  box-shadow: 0 0 40px rgba(61,255,160,0.5);
}

.mystery-box-icon.claimed {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.mystery-box-title {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 2px;
  margin-bottom: 4px;
  color: var(--success);
  text-shadow: 0 0 10px rgba(61,255,160,0.5);
}

.mystery-box-subtitle {
  font-size: 12px;
  color: var(--text2);
  font-weight: 600;
  margin-bottom: 16px;
}

/* Botón de cancha */
.mystery-box-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--success), #2a8a5a);
  color: #0a0a0f;
  border: none;
  border-radius: 40px;
  padding: 12px 28px;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 220px;
  margin: 0 auto;
}

.mystery-box-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(61,255,160,0.4);
}

.mystery-box-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Estado reclamado */
.mystery-box-claimed {
  background: rgba(61,255,160,0.1);
  border: 1px solid rgba(61,255,160,0.3);
  border-radius: 40px;
  padding: 10px 20px;
  font-size: 13px;
  color: var(--success);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* Carta revelada */
.mystery-card-reveal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: card-reveal 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}

.mystery-result-label {
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 2px;
  color: var(--success);
}

.mystery-result-sub {
  font-size: 12px;
  color: var(--text2);
  font-weight: 600;
}

/* Contador de cartas */
.mystery-counter {
  background: rgba(61,255,160,0.1);
  border: 1px solid rgba(61,255,160,0.2);
  border-radius: 40px;
  padding: 6px 16px;
  font-size: 12px;
  color: var(--success);
  font-weight: 700;
}

/* Próxima caja */
.mystery-next-claim {
  margin-top: 12px;
  font-size: 11px;
  color: var(--text2);
  font-weight: 600;
}

/* Progreso del álbum */
.mystery-progress {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(61,255,160,0.2);
}

.mystery-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text2);
  margin-bottom: 8px;
}

.mystery-progress-bar {
  height: 6px;
  background: rgba(61,255,160,0.1);
  border-radius: 100px;
  overflow: hidden;
}

.mystery-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success), #3dffa0);
  border-radius: 100px;
  transition: width 0.6s ease;
}

/* Partículas estilo césped */
.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  animation: confetti-explosion 0.8s ease-out forwards;
}

/* Badge de arena */
.arena-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(61,255,160,0.15);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 10px;
  color: var(--success);
  margin-bottom: 12px;
}
`;

// ── Partículas ────────────────────────────────────────────────
const PARTICLE_COLORS = ['#3dffa0', '#2a8a5a', '#f5c518', '#189df5', '#ffd700'];

function Particles() {
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360;
    const dist = 50 + Math.random() * 50;
    const tx = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
    const ty = Math.round(Math.sin((angle * Math.PI) / 180) * dist);
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const delay = Math.random() * 0.2;
    return { tx, ty, color, delay };
  });

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            background: p.color,
            top: '50%',
            left: '50%',
            marginTop: -3,
            marginLeft: -3,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Tiempo hasta medianoche ───────────────────────────────────
function useCountdownToMidnight() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

// ── Componente principal ──────────────────────────────────────
interface MysteryBoxProps {
  userId: string;
  albumProgress: { owned: number; total: number };
  onCardObtained?: (card: PlayerCard) => void;
}

type BoxState = 'idle' | 'shaking' | 'opening' | 'revealed' | 'claimed' | 'complete';

export function MysteryBox({ userId, albumProgress, onCardObtained }: MysteryBoxProps) {
  const [boxState, setBoxState] = useState<BoxState>('idle');
  const [revealedCard, setRevealedCard] = useState<PlayerCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const countdown = useCountdownToMidnight();

  useEffect(() => {
    cardApi.checkDailyBoxStatus(userId).then(({ claimed }) => {
      if (claimed) setBoxState('claimed');
      setLoading(false);
    });
  }, [userId]);

  const handleOpenBox = async () => {
    if (boxState !== 'idle') return;

    setBoxState('shaking');
    await new Promise(r => setTimeout(r, 500));

    setBoxState('opening');
    await new Promise(r => setTimeout(r, 400));

    try {
      const result = await cardApi.openDailyBox(userId);

      if (result.already_claimed) {
        setBoxState('claimed');
        return;
      }

      if (!result.card) {
        setBoxState('complete');
        return;
      }

      setRevealedCard(result.card);
      setShowParticles(true);
      setBoxState('revealed');

      setTimeout(() => setShowParticles(false), 1000);
      onCardObtained?.(result.card);
    } catch (err) {
      console.error('Error opening box:', err);
      setBoxState('idle');
    }
  };

  if (loading) return null;

  const isComplete = boxState === 'complete';
  const isClaimed = boxState === 'claimed';
  const isRevealed = boxState === 'revealed';
  const isIdle = boxState === 'idle';

  return (
    <>
      <style>{BOX_CSS}</style>

      <div className="mystery-box-container">
        <div className="mystery-box-inner">
          
          {/* Badde de arena */}
          <div className="arena-badge">
            <span>⚽</span> ARENA DE ENTRENAMIENTO <span>🏟️</span>
          </div>

          {isRevealed && revealedCard ? (
            <div className="mystery-card-reveal">
              <div className="mystery-result-label">✨ ¡NUEVA CARTA! ✨</div>
              <div className="mystery-result-sub">
                Agregada a tu colección
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <FifaCard card={revealedCard} size="lg" showFlip animate />
                {showParticles && <Particles />}
              </div>
              <div className="mystery-counter">
                📚 {albumProgress.owned + 1} / {albumProgress.total} cartas
              </div>
              <div className="mystery-next-claim">
                ⏰ Próxima caja en {countdown}
              </div>
            </div>
          ) : (
            <>
              {/* Caja / Pelota */}
              <div
                className={`mystery-box-icon ${
                  isClaimed || isComplete ? 'claimed' :
                  isIdle ? 'ready' : boxState
                }`}
                onClick={isIdle ? handleOpenBox : undefined}
              >
                {isClaimed || isComplete ? '🏆' :
                 boxState === 'shaking' || boxState === 'opening' ? '⚽' :
                 '🎁'}
              </div>

              <div className="mystery-box-title">
                {isClaimed ? 'CAJA RECLAMADA' :
                 isComplete ? '¡ÁLBUM COMPLETO!' :
                 'CAJA MISTERIOSA'}
              </div>

              <div className="mystery-box-subtitle">
                {isClaimed ? 'Volvé mañana para tu nueva carta' :
                 isComplete ? '¡Tenés todas las cartas! Sos un crack 🏆' :
                 `⭐ Una carta nueva cada día · Te faltan ${albumProgress.total - albumProgress.owned} cartas ⭐`}
              </div>

              {isIdle && (
                <button className="mystery-box-btn" onClick={handleOpenBox}>
                  ⚽ ABRIR CAJA 🎁
                </button>
              )}

              {isClaimed && (
                <>
                  <div className="mystery-box-claimed">
                    ✅ Caja de hoy reclamada
                  </div>
                  <div className="mystery-next-claim" style={{ marginTop: 12 }}>
                    ⏰ Próxima en {countdown}
                  </div>
                </>
              )}

              {(boxState === 'shaking' || boxState === 'opening') && (
                <button className="mystery-box-btn" disabled>
                  ⚽ Abriendo...
                </button>
              )}

              {/* Progreso del álbum */}
              {!isComplete && (
                <div className="mystery-progress">
                  <div className="mystery-progress-header">
                    <span>📖 PROGRESO DEL ÁLBUM</span>
                    <span style={{ color: 'var(--success)' }}>
                      {albumProgress.owned}/{albumProgress.total}
                    </span>
                  </div>
                  <div className="mystery-progress-bar">
                    <div 
                      className="mystery-progress-fill"
                      style={{ width: `${(albumProgress.owned / albumProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default MysteryBox;