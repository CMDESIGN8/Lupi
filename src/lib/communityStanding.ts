/** Fila del ranking competitivo semanal de una comunidad (RPC get_community_pvp_ranking). */
export type PvpRow = { user_id: string; username?: string; wins: number; losses: number; draws: number; played: number; competitive_points: number };
export type Standing = { position: number; total: number; points: number; played: number; hint: string | null };

const WIN_POINTS = 3; // regla que ya muestra el ranking: victoria 3 · empate 1 · derrota 0
const pts = (n: number) => `${n} ${n === 1 ? "pt" : "pts"}`;

/** Tu lugar en la semana y qué te falta para subir, solo con datos del ranking. */
export function standingFrom(rows: PvpRow[] | null | undefined, userId: string): Standing | null {
  if (!Array.isArray(rows)) return null;
  const sorted = [...rows].sort((a, b) => Number(b.competitive_points) - Number(a.competitive_points)); // sort estable: respeta el orden del servidor en empates
  const i = sorted.findIndex((r) => r.user_id === userId);
  if (i < 0) return null;
  const me = sorted[i], mine = Number(me.competitive_points) || 0;
  let hint: string | null = null;
  if (i > 0) {
    const above = Number(sorted[i - 1].competitive_points) || 0, diff = above - mine;
    hint = diff <= 0 ? `Empatado en puntos con el #${i}: una victoria te adelanta`
      : diff < WIN_POINTS ? `A ${pts(diff)} del #${i}: ¡con 1 victoria lo pasás!`
      : diff === WIN_POINTS ? `A ${pts(diff)} del #${i}: una victoria te iguala`
      : `A ${pts(diff)} del #${i}`;
  } else if (sorted.length > 1) {
    const lead = mine - (Number(sorted[1].competitive_points) || 0);
    hint = lead > 0 ? `¡Vas primero! Sacás ${pts(lead)} al #2` : "¡Vas primero! Empatado con el #2: una victoria te despega";
  }
  return { position: i + 1, total: sorted.length, points: mine, played: Number(me.played) || 0, hint };
}
