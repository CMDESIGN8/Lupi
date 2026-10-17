// src/components/player-card/DailyMission.tsx
import type { CSSProperties } from "react";
import type { DailyMission as DailyMissionData } from "./useDailyMission";

export type DailyMissionProps = {
  mission: DailyMissionData;
};

export function DailyMission({ mission }: DailyMissionProps) {
  const pct = Math.round(mission.progress * 100);
  return (
    <section className="lw-mission" data-done={mission.done}>
      <header className="lw-mission__head">
        <h4 className="lw-mission__title">Misión del día</h4>
        <span className="lw-mission__reward">+{mission.xpReward} XP</span>
      </header>
      <p className="lw-mission__desc">{mission.description}</p>
      <div
        className="lw-mission__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Progreso de la misión del día"
      >
        <div
          className="lw-mission__fill"
          style={{ "--m": mission.progress } as CSSProperties}
        />
      </div>
      <div className="lw-mission__foot">
        <span>
          {mission.current} / {mission.target}
        </span>
        <span>{mission.done ? "Completada" : "En curso"}</span>
      </div>
    </section>
  );
}