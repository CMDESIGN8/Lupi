/**
 * Tarjeta de victoria para compartir (PNG 1080×1350). Se dibuja 100 % por código (sin imágenes externas),
 * así funciona sin conexión y sin depender de fuentes con emojis.
 */
export type ShareCardModel = {
  game: string;            // "Piedra, papel o tijera"
  myName?: string;
  rivalName: string;
  streak?: number;         // racha de victorias del duelo (solo si ≥ 2)
  playStreakDays?: number; // racha de juego (días)
  h2h?: { wins: number; losses: number; draws: number } | null;
  host?: string;           // dominio a mostrar al pie
};
export const CARD_W = 1080, CARD_H = 1350;

/** Textos de la tarjeta, separados del dibujo para poder probarlos. */
export function cardLines(m: ShareCardModel) {
  const streak = Math.trunc(m.streak ?? 0), days = Math.trunc(m.playStreakDays ?? 0);
  const h = m.h2h && m.h2h.wins + m.h2h.losses + m.h2h.draws > 1 ? m.h2h : null;
  return {
    title: "¡VICTORIA!",
    game: m.game.toUpperCase(),
    versus: m.myName ? `${m.myName.toUpperCase()}  VS  ${m.rivalName.toUpperCase()}` : `VS  ${m.rivalName.toUpperCase()}`,
    streak: streak >= 2 ? `RACHA DE ${streak} VICTORIAS` : null,
    history: h ? `HISTORIAL: ${h.wins} G · ${h.losses} P · ${h.draws} E` : null,
    play: days >= 2 ? `RACHA DE JUEGO: ${days} DÍAS` : null,
    cta: "¿ME GANÁS LA PRÓXIMA?",
    footer: `LUPIAPP · FUTSAL ENTRE AMIGOS${m.host ? ` · ${m.host}` : ""}`,
  };
}

type Ctx = CanvasRenderingContext2D;
export function drawShareCard(c: Ctx, m: ShareCardModel): void {
  const L = cardLines(m);
  const bg = c.createLinearGradient(0, 0, 0, CARD_H); bg.addColorStop(0, "#041827"); bg.addColorStop(.55, "#06283a"); bg.addColorStop(1, "#02101a");
  c.fillStyle = bg; c.fillRect(0, 0, CARD_W, CARD_H);
  // cancha de futsal en perspectiva
  c.save(); c.strokeStyle = "#4fe1eb55"; c.lineWidth = 5;
  c.beginPath(); c.moveTo(120, 1250); c.lineTo(960, 1250); c.lineTo(840, 830); c.lineTo(240, 830); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(540, 830); c.lineTo(540, 1250); c.stroke();
  c.beginPath(); c.ellipse(540, 1040, 120, 60, 0, 0, Math.PI * 2); c.stroke(); c.restore();
  const halo = c.createRadialGradient(540, 470, 20, 540, 470, 520); halo.addColorStop(0, "#ffd23f40"); halo.addColorStop(1, "#ffd23f00");
  c.fillStyle = halo; c.fillRect(0, 0, CARD_W, 1000);
  // rayos estilo manga detrás del título
  c.save(); c.translate(540, 470); c.fillStyle = "#ffffff0d";
  for (let i = 0; i < 18; i++) { c.rotate((Math.PI * 2) / 18); c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -26); c.lineTo(900, 26); c.closePath(); c.fill(); }
  c.restore();
  c.strokeStyle = "#ffd23f"; c.lineWidth = 4; c.strokeRect(42, 42, CARD_W - 84, CARD_H - 84);
  c.textAlign = "center";
  const line = (text: string, y: number, size: number, color = "#ffffff", weight = 800) => {
    const fit = (s: number) => { c.font = `italic ${weight} ${s}px Impact, 'Arial Narrow', Arial, sans-serif`; return c.measureText(text).width; };
    while (fit(size) > 900 && size > 20) size--;
    c.fillStyle = color; c.shadowColor = "#000"; c.shadowBlur = 16; c.shadowOffsetY = 4; c.fillText(text, 540, y); c.shadowBlur = 0; c.shadowOffsetY = 0;
  };
  line("LUPIAPP · DUELO", 140, 40, "#7fe8f0", 900);
  line(L.title, 420, 190, "#ffd23f", 900);
  line(L.game, 520, 46, "#ffffff");
  line(L.versus, 620, 52, "#bfe9f0");
  let y = 740;
  for (const [text, color] of [[L.streak, "#ff9a3d"], [L.history, "#e9f7fa"], [L.play, "#ffd23f"]] as const) { if (text) { line(text, y, 42, color); y += 70; } }
  line(L.cta, 1110, 60, "#ffd23f", 900);
  line(L.footer, 1280, 28, "#7fe8f0", 700);
}

export async function renderShareBlob(m: ShareCardModel): Promise<Blob> {
  const canvas = document.createElement("canvas"); canvas.width = CARD_W; canvas.height = CARD_H;
  const c = canvas.getContext("2d"); if (!c) throw new Error("No pudimos crear la imagen.");
  drawShareCard(c, m);
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("No pudimos crear la imagen."))), "image/png"));
}

export type ShareOutcome = "image" | "text" | "copied" | "cancelled" | "failed";
export type ShareDeps = {
  render?: (m: ShareCardModel) => Promise<Blob>;
  nav?: Pick<Navigator, "share" | "canShare" | "clipboard"> | Partial<Navigator>;
  origin?: string;
};
const isAbort = (e: unknown) => (e as { name?: string } | null)?.name === "AbortError";

/** Imagen si el dispositivo puede compartir archivos; si no, el texto de siempre; si no, copia al portapapeles. */
export async function shareDuelWin(m: ShareCardModel, text: string, deps: ShareDeps = {}): Promise<ShareOutcome> {
  const nav = (deps.nav ?? navigator) as Navigator, origin = deps.origin ?? window.location.origin;
  if (nav.share && nav.canShare) {
    try {
      const blob = await (deps.render ?? renderShareBlob)({ ...m, host: m.host ?? origin.replace(/^https?:\/\//, "") });
      const file = new File([blob], "mi-victoria-lupi.png", { type: "image/png" });
      if (nav.canShare({ files: [file] })) { await nav.share({ files: [file], text, title: "Mi victoria en Lupi" }); return "image"; }
    } catch (e) { if (isAbort(e)) return "cancelled"; /* cualquier otro error: probamos con texto */ }
  }
  try {
    if (nav.share) { await nav.share({ text, url: origin }); return "text"; }
    await nav.clipboard.writeText(`${text} ${origin}`); return "copied";
  } catch (e) { return isAbort(e) ? "cancelled" : "failed"; }
}
