// Sonido sintetizado (sin archivos) + vibración. Un solo interruptor para ambos.
const KEY = "lupi:duel-fx-muted";
let muted = false;
try { muted = localStorage.getItem(KEY) === "1"; } catch { /* sin storage */ }
let ctx: AudioContext | null = null;

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.1) {
  const c = audio(); if (!c) return;
  const t0 = c.currentTime + start, osc = c.createOscillator(), g = c.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}

function vibrate(pattern: number | number[]) {
  if (muted || reducedMotion()) return;
  try { navigator.vibrate?.(pattern); } catch { /* no soportado */ }
}

const NOTES = { c5: 523.25, e5: 659.25, g5: 783.99, c6: 1046.5, a4: 440, e4: 329.63, c4: 261.63 };

export const duelFx = {
  isMuted: () => muted,
  setMuted(value: boolean) { muted = value; try { localStorage.setItem(KEY, value ? "1" : "0"); } catch { /* sin storage */ } },
  shout() { tone(160, 0, 0.12, "sawtooth", 0.07); tone(440, 0.08, 0.18, "triangle", 0.08); vibrate([20, 20, 45]); },
  /** Toque al elegir una opción. */
  tap() { tone(NOTES.a4, 0, 0.06, "triangle", 0.06); vibrate(12); },
  /** Revelación de una ronda de Piedra-Papel-Tijera. */
  reveal(outcome: "win" | "lose" | "tie") {
    tone(180, 0, 0.12, "square", 0.08); vibrate(outcome === "tie" ? 25 : [20, 20, 40]);
    if (outcome === "win") { tone(NOTES.e5, 0.1, 0.12, "triangle"); tone(NOTES.g5, 0.2, 0.18, "triangle"); }
    else if (outcome === "lose") { tone(NOTES.e4, 0.1, 0.18, "sawtooth", 0.06); }
    else tone(NOTES.a4, 0.1, 0.12, "triangle", 0.07);
  },
  /** Respuesta de Preguntados. */
  answer(ok: boolean) {
    if (ok) { tone(NOTES.e5, 0, 0.1, "triangle"); tone(NOTES.c6, 0.09, 0.2, "triangle"); vibrate(30); }
    else { tone(220, 0, 0.22, "sawtooth", 0.07); vibrate([40, 30, 40]); }
  },
  /** Resultado final del duelo. */
  result(res: "win" | "loss" | "draw") {
    if (res === "win") { [NOTES.c5, NOTES.e5, NOTES.g5, NOTES.c6].forEach((f, i) => tone(f, i * 0.11, 0.25, "triangle", 0.11)); vibrate([40, 30, 40, 30, 140]); }
    else if (res === "draw") { tone(NOTES.g5, 0, 0.15, "triangle"); tone(NOTES.g5, 0.18, 0.2, "triangle"); vibrate(50); }
    else { tone(NOTES.e4, 0, 0.25, "sine", 0.09); tone(NOTES.c4, 0.2, 0.35, "sine", 0.09); vibrate(90); }
  },
  /** Cofre: más brillo cuanto más raro. */
  chest(tier: "comun" | "raro" | "epico") {
    const seq = tier === "epico" ? [NOTES.c5, NOTES.e5, NOTES.g5, NOTES.c6, 1318.5, 1568] : tier === "raro" ? [NOTES.e5, NOTES.g5, NOTES.c6, 1318.5] : [NOTES.g5, NOTES.c6];
    seq.forEach((f, i) => tone(f, i * 0.07, 0.18, "sine", 0.08));
    vibrate(tier === "epico" ? [30, 20, 30, 20, 30, 20, 160] : [30, 20, 60]);
  },
};
