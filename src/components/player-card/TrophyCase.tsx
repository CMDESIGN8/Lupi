// src/components/player-card/TrophyCase.tsx
import { ArenaSymbol } from "../match/ArenaSymbol";
import type { PlayerCompetitiveStats } from "./types";

const SLOTS = 6;

export function TrophyCase({ achievements }: { achievements?: PlayerCompetitiveStats["achievements"] }) {
  if (!achievements?.length) {
    return <section className="lw-trophy-empty" aria-label="Vitrina sin logros públicos"><span className="lw-player-passport__kicker">HISTORIAS QUE DEJAN HUELLA</span><div className="lw-trophy-empty__podium"><ArenaSymbol kind="trophy"/></div><h4>LA VITRINA DEL JUGADOR</h4><p>Todavía no hay logros públicos para mostrar.</p><small>Cuando estén disponibles, sus reconocimientos aparecerán acá.</small></section>;
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
