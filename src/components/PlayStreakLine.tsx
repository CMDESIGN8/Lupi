import { usePlayStreak } from "../hooks/usePlayStreak";
import "./PlayStreakLine.css";

const days = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;

/** "reward": línea dentro de la carta de premio. "nudge": recordatorio en el selector de duelo rápido. */
export function PlayStreakLine({ variant, server }: { variant: "reward" | "nudge"; server?: { days: number; changed: boolean; best?: number } | null }) {
  const local = usePlayStreak();
  const s = server ? { ...local, count: server.days, best: server.best ?? local.best, playsToday: server.changed ? 1 : 2 } : local;   // la racha real del servidor manda
  if (variant === "reward") {
    if (s.count < 1) return null;
    const first = s.playsToday === 1;
    return <p className={`psl psl--reward${first ? " is-new" : ""}`} role="status">
      <span aria-hidden="true">🔥</span><b>RACHA DE JUEGO · {days(s.count).toUpperCase()}</b>
      <small>{first ? "¡Hoy sumaste un día!" : "Hoy ya la tenés asegurada"}</small>
      {s.count >= 2 && s.count === s.best && <em>RÉCORD</em>}
    </p>;
  }
  if (s.activeToday) return s.count >= 1 ? <p className="psl psl--nudge is-safe">🔥 Racha de juego: {days(s.count)} · asegurada por hoy</p> : null;
  if (s.atRisk) return <p className="psl psl--nudge is-risk">🔥 Jugá 1 duelo hoy y mantené tu racha de {days(s.count)}</p>;
  if (s.broken) return <p className="psl psl--nudge">🔥 Empezá hoy una racha nueva: 1 duelo por día</p>;
  return <p className="psl psl--nudge">🔥 Jugá 1 duelo por día y armá tu racha</p>;
}
