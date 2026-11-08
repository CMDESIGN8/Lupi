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

/** Ruido filtrado: base de las gradas, el pitazo y el chasquido del pelotazo. */
function noise(start: number, dur: number, gain = 0.08, freq = 1200, q = 0.7, type: BiquadFilterType = "bandpass") {
  const c = audio(); if (!c) return;
  const t0 = c.currentTime + start, len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, len, c.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(), filter = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buffer; filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter); filter.connect(g); g.connect(c.destination);
  src.start(t0); src.stop(t0 + dur + 0.03);
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
  /** Pitazo de árbitro (inicio del partido). */
  whistle() {
    const c = audio(); if (!c) return;
    const t0 = c.currentTime, osc = c.createOscillator(), lfo = c.createOscillator(), lfoGain = c.createGain(), g = c.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(2600, t0); osc.frequency.linearRampToValueAtTime(2850, t0 + 0.28);
    lfo.frequency.value = 34; lfoGain.gain.value = 110; lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
    g.gain.setValueAtTime(0.09, t0 + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
    osc.connect(g); g.connect(c.destination);
    lfo.start(t0); osc.start(t0); osc.stop(t0 + 0.45); lfo.stop(t0 + 0.45);
    noise(0, 0.4, 0.02, 4200, 2); vibrate([30, 30, 60]);
  },
  /** Cuenta regresiva del "piedra, papel, tijera": cada golpe sube un poco el tono. */
  beat(step: number) { tone(300 + step * 110, 0, 0.07, "square", 0.05); vibrate(10); },
  /** Pelotazo: golpe grave + chasquido. */
  kick(power = 1) {
    const c = audio(); if (!c) return;
    const t0 = c.currentTime, osc = c.createOscillator(), g = c.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(190, t0); osc.frequency.exponentialRampToValueAtTime(48, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22 * power, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g); g.connect(c.destination); osc.start(t0); osc.stop(t0 + 0.25);
    noise(0, 0.06, 0.06 * power, 2400, 1); vibrate(power > 0.8 ? [30, 15, 60] : 25);
  },
  /** Las gradas reaccionan: rugen si ganás, hacen "uh" si perdés. */
  crowd(kind: "win" | "lose" | "tie") {
    if (kind === "win") { noise(0.05, 1.3, 0.07, 1100, 0.5); tone(NOTES.g5, 0.1, 0.18, "triangle", 0.05); tone(NOTES.c6, 0.25, 0.3, "triangle", 0.05); }
    else if (kind === "lose") { noise(0.05, 0.9, 0.04, 520, 0.6); tone(260, 0.1, 0.35, "sine", 0.05); tone(200, 0.3, 0.4, "sine", 0.05); }
    else noise(0.05, 0.5, 0.03, 900, 0.8);
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
