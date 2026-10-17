// src/components/player-card/XpBar.tsx
import type { CSSProperties } from "react";

type Props = {
  level: number;
  xp: number;
  xpToNext: number;
  /** Los números de XP son solo para el dueño del perfil. */
  showNumbers: boolean;
};

export function XpBar({ level, xp, xpToNext, showNumbers }: Props) {
  const progress = xpToNext > 0 ? Math.max(0, Math.min(1, xp / xpToNext)) : 0;
  return (
    <div className="lw-xp">
      <div className="lw-xp__row">
        <span>Nivel {level}</span>
        {showNumbers && (
          <span>
            {xp} / {xpToNext} XP
          </span>
        )}
      </div>
      <div
        className="lw-xp__track"
        role="progressbar"
        aria-label={`Progreso hacia el nivel ${level + 1}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="lw-xp__fill" style={{ "--lw-xp": progress } as CSSProperties} />
      </div>
    </div>
  );
}
