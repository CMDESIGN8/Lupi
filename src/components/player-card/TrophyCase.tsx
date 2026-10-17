// src/components/player-card/TrophyCase.tsx
import type { PlayerCompetitiveStats } from "./types";

const SLOTS = 6;

export function TrophyCase({ achievements }: { achievements?: PlayerCompetitiveStats["achievements"] }) {
  if (!achievements?.length) {
    return <p className="lw-note">Todavía no hay logros públicos disponibles.</p>;
  }
  const shown = achievements.slice(0, SLOTS);
  const locked = Math.max(0, SLOTS - shown.length);
  return (
    <>
      <h4 className="lw-heading">
        Vitrina <span>{achievements.length} desbloqueados</span>
      </h4>
      <ul className="lw-trophies">
        {shown.map((achievement) => (
          <li key={achievement.id} className="lw-trophy">
            <span className="lw-trophy__icon" aria-hidden="true">
              {achievement.icon || "🏆"}
            </span>
            <span className="lw-trophy__title">{achievement.title}</span>
          </li>
        ))}
        {Array.from({ length: locked }, (_, i) => (
          <li key={`locked-${i}`} className="lw-trophy" data-locked="true">
            <span className="lw-trophy__icon" aria-hidden="true">
              🏆
            </span>
            <span className="lw-trophy__title">Por desbloquear</span>
          </li>
        ))}
      </ul>
    </>
  );
}
