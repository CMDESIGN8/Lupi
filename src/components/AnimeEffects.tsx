import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface AnimeEffectsHandle {
  triggerGoal: (side: 'user' | 'rival') => void;
  triggerSave: () => void;
  triggerDanger: () => void;
  triggerKeyMoment: () => void;
}

export const AnimeEffects = forwardRef<AnimeEffectsHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const courtRef  = useRef<HTMLElement | null>(null);

  // ── helpers internos ──────────────────────────────────────────────

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const screenShake = useCallback((mag: number, frames: number) => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    let f = frames;
    const tick = () => {
      if (f-- <= 0) { el.style.transform = ''; return; }
      el.style.transform = `translate(${(Math.random()-.5)*mag}px,${(Math.random()-.5)*mag}px)`;
      requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const drawSpeedLines = useCallback((
    cx: number, cy: number, color: string, alpha: number,
    count: number, minLen: number, maxLen: number
  ) => {
    const ctx = getCtx(); if (!ctx) return;
    ctx.save();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * .15;
      const len   = minLen + Math.random() * (maxLen - minLen);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.strokeStyle = color;
      ctx.globalAlpha  = alpha * (.4 + Math.random() * .6);
      ctx.lineWidth    = .5 + Math.random() * 2;
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  type Particle = {
    x: number; y: number; vx: number; vy: number;
    life: number; decay: number; size: number; color: string; star: boolean;
  };

  const spawnParticles = useCallback((
    x: number, y: number, colors: string[], count: number
  ): Particle[] =>
    Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: .025 + Math.random() * .03,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        star: Math.random() > .5,
      };
    }),
  []);

  const runLoop = useCallback((particles: Particle[], ripples: {x:number;y:number;r:number;maxR:number;life:number;color:string}[]) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ripples
      for (const rip of ripples) {
        rip.r += 5;
        rip.life = 1 - rip.r / rip.maxR;
        if (rip.life <= 0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI*2);
        ctx.strokeStyle = rip.color;
        ctx.globalAlpha = rip.life * .7;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
      // particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += .15;
        p.life -= p.decay; p.size *= .97;
        if (p.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        if (p.star) {
          for (let i = 0; i < 5; i++) {
            const a = (Math.PI*2/5)*i - Math.PI/2;
            ctx.lineTo(Math.cos(a)*p.size, Math.sin(a)*p.size);
            const a2 = a + Math.PI/5;
            ctx.lineTo(Math.cos(a2)*p.size*.4, Math.sin(a2)*p.size*.4);
          }
          ctx.closePath();
        } else {
          ctx.arc(0, 0, p.size/2, 0, Math.PI*2);
        }
        ctx.fill();
        ctx.restore();
      }
      const alive = particles.some(p => p.life > 0) || ripples.some(r => r.life > 0);
      if (alive) animRef.current = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
  }, []);

  // ── efectos públicos ──────────────────────────────────────────────

  useImperativeHandle(ref, () => ({

    triggerGoal(side) {
      const canvas = canvasRef.current; if (!canvas) return;
      const cx = canvas.width  * (side === 'user' ? .88 : .12);
      const cy = canvas.height * .5;
      screenShake(10, 18);
      [0, 60, 120].forEach(delay =>
        setTimeout(() => drawSpeedLines(cx, cy, '#ffd700', .6, 32, 60, 160), delay)
      );
      const ripples = [
        { x:cx, y:cy, r:10, maxR:130, life:1, color:'#ffd700' },
        { x:cx, y:cy, r:10, maxR:100, life:1, color:'#ff8c00' },
      ];
      const parts = spawnParticles(cx, cy, ['#ffd700','#ff8c00','#fff','#ff4d6d','#3dffa0'], 60);
      runLoop(parts, ripples);
    },

    triggerSave() {
      const canvas = canvasRef.current; if (!canvas) return;
      const cx = canvas.width * .08, cy = canvas.height * .4;
      screenShake(6, 10);
      [0, 80].forEach(d =>
        setTimeout(() => drawSpeedLines(cx, cy, '#3dffa0', .5, 24, 40, 120), d)
      );
      const ripples = [{ x:cx, y:cy, r:10, maxR:110, life:1, color:'#3dffa0' }];
      const parts   = spawnParticles(cx, cy, ['#3dffa0','#00ffcc','#fff'], 30);
      runLoop(parts, ripples);
    },

    triggerDanger() {
      const canvas = canvasRef.current; if (!canvas) return;
      const cx = canvas.width * .5, cy = canvas.height * .5;
      screenShake(5, 8);
      [0, 70].forEach(d =>
        setTimeout(() => drawSpeedLines(cx, cy, '#ff6b6b', .45, 20, 50, 130), d)
      );
      const ripples = [{ x:cx, y:cy, r:10, maxR:120, life:1, color:'#ff6b6b' }];
      const parts   = spawnParticles(cx, cy, ['#ff6b6b','#ff4d6d','#ff9060'], 25);
      runLoop(parts, ripples);
    },

    triggerKeyMoment() {
      const canvas = canvasRef.current; if (!canvas) return;
      const cx = canvas.width * .5, cy = canvas.height * .45;
      screenShake(4, 6);
      [0, 60].forEach(d =>
        setTimeout(() => drawSpeedLines(cx, cy, '#a78bfa', .5, 28, 50, 140), d)
      );
      const ripples = [
        { x:cx, y:cy, r:10, maxR:130, life:1, color:'#a78bfa' },
        { x:cx, y:cy, r:10, maxR: 90, life:1, color:'#7c3aed' },
      ];
      const parts = spawnParticles(cx, cy, ['#a78bfa','#c4b5fd','#fff','#ffd700'], 40);
      runLoop(parts, ripples);
    },

  }), [drawSpeedLines, runLoop, screenShake, spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 25,
      }}
      width={800}
      height={340}
    />
  );
});