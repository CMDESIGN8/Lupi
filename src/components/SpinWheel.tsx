import { useState, useEffect, useRef } from "react";
 
// ── Tipos ──────────────────────────────────────────────────
export interface SpinPrize {
  id: string;
  label: string;
  sublabel: string;
  points: number;           // 0 si el premio no es puntos (ej: racha x2)
  isStreak?: boolean;       // true → activa racha x2 por 24hs
  probability: number;      // 0-1, deben sumar 1
  color: string;
  glow: string;
  emoji: string;
}
 
export interface SpinResult {
  prize: SpinPrize;
  extraPoints: number;
  streakDouble: boolean;
}
 
interface SpinWheelProps {
  onClose: () => void;
  onResult: (result: SpinResult) => void;
}
 
// ── Premios (probabilidades suman 1) ───────────────────────
const PRIZES: SpinPrize[] = [
  {
    id: "p5",
    label: "+5 pts",
    sublabel: "Bonus",
    points: 5,
    probability: 0.40,
    color: "#2a3a5a",
    glow: "rgba(24,157,245,0.6)",
    emoji: "⭐",
  },
  {
    id: "p15",
    label: "+15 pts",
    sublabel: "Bonus",
    points: 15,
    probability: 0.25,
    color: "#1a3a2a",
    glow: "rgba(61,255,160,0.6)",
    emoji: "💫",
  },
  {
    id: "p25",
    label: "+25 pts",
    sublabel: "Bonus",
    points: 25,
    probability: 0.15,
    color: "#2a2a1a",
    glow: "rgba(245,197,24,0.6)",
    emoji: "🌟",
  },
  {
    id: "streak",
    label: "RACHA x2",
    sublabel: "24 horas",
    points: 0,
    isStreak: true,
    probability: 0.10,
    color: "#3a1a1a",
    glow: "rgba(255,77,109,0.7)",
    emoji: "🔥",
  },
  {
    id: "p50",
    label: "+50 pts",
    sublabel: "JACKPOT",
    points: 50,
    probability: 0.08,
    color: "#2a1a0a",
    glow: "rgba(255,165,0,0.8)",
    emoji: "🎰",
  },
  // Segmento extra (+5) para que la rueda tenga 8 secciones y se vea bien
  {
    id: "p5b",
    label: "+5 pts",
    sublabel: "Bonus",
    points: 5,
    probability: 0,           // probabilidad 0 → nunca se sortea, solo visual
    color: "#2a3a5a",
    glow: "rgba(24,157,245,0.6)",
    emoji: "⭐",
  },
  {
    id: "p15b",
    label: "+15 pts",
    sublabel: "Bonus",
    points: 15,
    probability: 0,
    color: "#1a3a2a",
    glow: "rgba(61,255,160,0.6)",
    emoji: "💫",
  },
  {
    id: "p25b",
    label: "+25 pts",
    sublabel: "Bonus",
    points: 25,
    probability: 0,
    color: "#2a2a1a",
    glow: "rgba(245,197,24,0.6)",
    emoji: "🌟",
  },
];
 
// Segmentos reales (los que sortea, sin los duplicados visuales)
const REAL_PRIZES = PRIZES.filter((p) => p.probability > 0);
 
// Sortear según probabilidades
function pickPrize(): SpinPrize {
  const r = Math.random();
  let acc = 0;
  for (const p of REAL_PRIZES) {
    acc += p.probability;
    if (r < acc) return p;
  }
  return REAL_PRIZES[0];
}
 
// Ángulo de inicio de cada segmento (8 segmentos → 45° cada uno)
const SEGMENT_DEG = 360 / PRIZES.length; // 45°
 
// El puntero está en la parte superior (270° en coords canvas = 12 en reloj).
// Para que el premio quede apuntado arriba, calculamos cuánto girar.
function targetAngle(prizeIndex: number, extra: number): number {
  // Centro del segmento ganador tiene que quedar en 270° (arriba)
  const center = prizeIndex * SEGMENT_DEG + SEGMENT_DEG / 2;
  // Cuánto falta desde 0 hasta 270 - center (en sentido contrario a las agujas)
  const base = (270 - center + 360) % 360;
  return base + 360 * (5 + extra); // 5+ vueltas completas
}
 
// ── CSS inyectado ────────────────────────────────────────────
const WHEEL_CSS = `
@keyframes sw-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sw-slideup {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes sw-prize-pop {
  0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); }
  80%  { transform: scale(0.95) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes sw-shine {
  0%   { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(300%) rotate(25deg); }
}
@keyframes sw-pointer-bounce {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(-6px); }
}
@keyframes sw-glow-pulse {
  0%,100% { box-shadow: 0 0 30px var(--sw-glow); }
  50%      { box-shadow: 0 0 60px var(--sw-glow), 0 0 100px var(--sw-glow); }
}
@keyframes sw-confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes sw-number-count {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); color: #ffd700; }
  100% { transform: scale(1); }
}
 
.sw-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: sw-fadein 0.3s ease;
  backdrop-filter: blur(6px);
}
 
.sw-modal {
  width: 100%; max-width: 400px;
  background: #0e0e18;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  overflow: hidden;
  animation: sw-slideup 0.4s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: 0 40px 80px rgba(0,0,0,0.6);
}
 
.sw-header {
  padding: 22px 24px 0;
  text-align: center;
}
 
.sw-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 32px;
  letter-spacing: 3px;
  background: #188af5;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 4px;
}
 
.sw-subtitle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgb(255, 255, 255);
}
 
.sw-wheel-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px 16px;
}
 
/* El puntero triangular arriba */
.sw-pointer {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 28px solid #fff;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));
  animation: sw-pointer-bounce 1.2s ease-in-out infinite;
}
.sw-pointer.spinning { animation: none; }
 
/* Canvas de la rueda */
.sw-canvas {
  border-radius: 50%;
  display: block;
}
 
/* Botón de giro */
.sw-spin-btn {
  display: block;
  width: calc(100% - 48px);
  margin: 0 24px 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f5c518, #e6a800);
  border: none;
  border-radius: 16px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px;
  letter-spacing: 2px;
  color: #0a0a0f;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
  overflow: hidden;
}
.sw-spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245,197,24,0.4);
}
.sw-spin-btn:active:not(:disabled) { transform: translateY(0); }
.sw-spin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sw-spin-btn::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: sw-shine 2s ease-in-out infinite;
}
 
/* Panel de resultado */
.sw-result {
  margin: 0 24px 24px;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: sw-prize-pop 0.6s cubic-bezier(0.34,1.56,0.64,1);
}
.sw-result-emoji { font-size: 52px; margin-bottom: 8px; line-height: 1; }
.sw-result-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 36px;
  letter-spacing: 2px;
  line-height: 1;
  margin-bottom: 4px;
}
.sw-result-sub {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 18px;
}
.sw-result-pts {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 28px;
  letter-spacing: 1px;
  animation: sw-number-count 0.6s ease 0.3s both;
}
 
.sw-close-btn {
  display: block;
  width: calc(100% - 48px);
  margin: 0 24px 24px;
  padding: 14px;
  background: transparent;
  border: 1.5px solid rgba(255,255,255,0.15);
  border-radius: 14px;
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  transition: all 0.2s;
}
.sw-close-btn:hover {
  border-color: rgba(255,255,255,0.4);
  color: #fff;
}
 
/* Confetti partícula */
.sw-confetti {
  position: fixed;
  pointer-events: none;
  z-index: 4000;
  border-radius: 2px;
  animation: sw-confetti-fall linear forwards;
}
`;
 
// ── Confetti burst ────────────────────────────────────────
function launchConfetti(count = 60) {
  const colors = ["#f5c518", "#ff4d6d", "#189df5", "#3dffa0", "#ff6b4a"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "sw-confetti";
    const size = Math.random() * 8 + 4;
    el.style.cssText = `
      width:${size}px; height:${size * 1.6}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}vw;
      top:-10px;
      animation-duration:${Math.random() * 2 + 1.5}s;
      animation-delay:${Math.random() * 0.5}s;
      transform:rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}
 
// ── Dibujar la rueda en canvas ────────────────────────────
function drawWheel(canvas: HTMLCanvasElement, rotation: number) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const cx = W / 2;
  const cy = W / 2;
  const R = W / 2 - 4;
 
  ctx.clearRect(0, 0, W, W);
 
  PRIZES.forEach((prize, i) => {
    const startAngle = ((i * SEGMENT_DEG - 90 + rotation) * Math.PI) / 180;
    const endAngle = (((i + 1) * SEGMENT_DEG - 90 + rotation) * Math.PI) / 180;
 
    // Segmento
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
 
    // Texto
    ctx.save();
    const midAngle = ((i * SEGMENT_DEG + SEGMENT_DEG / 2 - 90 + rotation) * Math.PI) / 180;
    const textR = R * 0.65;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    ctx.translate(tx, ty);
    ctx.rotate(midAngle + Math.PI / 2);
 
    // Emoji
    ctx.font = `${W * 0.06}px serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(prize.emoji, 0, -W * 0.045);
 
    // Label
    ctx.font = `bold ${W * 0.048}px 'Bebas Neue', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(prize.label, 0, W * 0.01);
 
    // Sublabel
    ctx.font = `${W * 0.032}px 'Barlow', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.shadowBlur = 0;
    ctx.fillText(prize.sublabel, 0, W * 0.048);
 
    ctx.restore();
  });
 
  // Borde exterior
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 3;
  ctx.stroke();
 
  // Centro
  ctx.beginPath();
  ctx.arc(cx, cy, W * 0.07, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.07);
  grad.addColorStop(0, "#2a2a3a");
  grad.addColorStop(1, "#12121a");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();
 
  // Logo en el centro
  ctx.font = `bold ${W * 0.05}px 'Bebas Neue', sans-serif`;
  ctx.fillStyle = "rgba(245,197,24,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LUPI", cx, cy);
}
 
// ── Componente principal ──────────────────────────────────
export function SpinWheel({ onClose, onResult }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [wonPrize, setWonPrize] = useState<SpinPrize | null>(null);
  const rotRef = useRef(0);       // rotación actual en grados
  const targetRef = useRef(0);    // ángulo destino
  const startTimeRef = useRef(0);
  const SPIN_DURATION = 4200;     // ms
 
  // Easing: desaceleración dramática tipo casino
  function easeOut(t: number) {
    return 1 - Math.pow(1 - t, 4);
  }
 
  // Redibuja en cada frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawWheel(canvas, rotRef.current);
  }, []);
 
  function spin() {
    if (phase !== "idle") return;
    setPhase("spinning");
 
    const prize = pickPrize();
    // Encontrar el índice del segmento ganador (puede ser el duplicado visual o el real)
    // Elegimos el índice real del id dentro de PRIZES
    const idx = PRIZES.findIndex((p) => p.id === prize.id);
    const target = targetAngle(idx, Math.floor(Math.random() * 3));
    targetRef.current = target;
    startTimeRef.current = performance.now();
 
    function animate(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const currentRot = easeOut(progress) * targetRef.current;
      rotRef.current = currentRot % 360;
 
      const canvas = canvasRef.current;
      if (canvas) drawWheel(canvas, rotRef.current);
 
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Fin del giro
        setWonPrize(prize);
        setPhase("result");
 
        const isBig = prize.points >= 25 || prize.isStreak;
        launchConfetti(isBig ? 80 : 40);
 
        if ("vibrate" in navigator) {
          navigator.vibrate(isBig ? [80, 40, 80, 40, 200] : [100, 50, 100]);
        }
 
        onResult({
          prize,
          extraPoints: prize.points,
          streakDouble: !!prize.isStreak,
        });
      }
    }
 
    rafRef.current = requestAnimationFrame(animate);
  }
 
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
 
  const CANVAS_SIZE = Math.min(window.innerWidth - 80, 320);
 
  return (
    <>
      <style>{WHEEL_CSS}</style>
      <div className="sw-overlay" onClick={(e) => e.target === e.currentTarget && phase === "result" && onClose()}>
        <div className="sw-modal">
          {/* Header */}
          <div className="sw-header">
            <div className="sw-title">¡GIRÁ Y GANÁ!</div>
            <div className="sw-subtitle">Bonus semanal por tu primera entrada</div>
          </div>
 
          {/* Rueda */}
          <div className="sw-wheel-wrap">
            <div className={`sw-pointer${phase === "spinning" ? " spinning" : ""}`} />
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="sw-canvas"
              style={{
                filter: phase === "result" && wonPrize
                  ? `drop-shadow(0 0 20px ${wonPrize.glow})`
                  : "drop-shadow(0 8px 20px rgba(0,0,0,0.5))",
                transition: "filter 0.5s",
              }}
            />
          </div>
 
          {/* Resultado */}
          {phase === "result" && wonPrize && (
            <div
              className="sw-result"
              style={{
                background: `linear-gradient(135deg, ${wonPrize.color}, rgba(10,10,15,0.8))`,
                border: `1px solid ${wonPrize.glow}`,
                ["--sw-glow" as any]: wonPrize.glow,
                animation: "sw-prize-pop 0.6s cubic-bezier(0.34,1.56,0.64,1), sw-glow-pulse 2s ease-in-out 0.6s infinite",
              }}
            >
              <div className="sw-result-emoji">{wonPrize.emoji}</div>
              <div className="sw-result-title" style={{ color: "#fff" }}>
                {wonPrize.isStreak ? "¡RACHA DOBLE!" : "¡GANASTE!"}
              </div>
              <div className="sw-result-sub">
                {wonPrize.isStreak
                  ? "Tus próximas entradas valen x2 por 24hs"
                  : wonPrize.sublabel === "JACKPOT"
                  ? "🎰 ¡JACKPOT! Premio máximo"
                  : "Premio desbloqueado"}
              </div>
              {wonPrize.points > 0 && (
                <div className="sw-result-pts" style={{ color: wonPrize.id === "p50" ? "#ffd700" : "#fff" }}>
                  +{wonPrize.points} PUNTOS EXTRA
                </div>
              )}
            </div>
          )}
 
          {/* Botones */}
          {phase !== "result" ? (
            <button
              className="sw-spin-btn"
              onClick={spin}
              disabled={phase === "spinning"}
            >
              {phase === "spinning" ? "GIRANDO..." : "🎰 ¡GIRAR RULETA!"}
            </button>
          ) : (
            <button className="sw-close-btn" onClick={onClose}>
              Continuar →
            </button>
          )}
        </div>
      </div>
    </>
  );
}