import type { DuelRewardResult } from "../lib/duelRewards";
import { nextGoalFor } from "../lib/nextGoal";
import "./DuelNextGoal.css";

/** Premios del día + meta de racha. Se muestra dentro de la carta de premio de cualquier duelo. */
export function DuelNextGoal({ reward }: { reward: DuelRewardResult }) {
  const { stamps, record, chest } = nextGoalFor(reward);
  if (!stamps && !record && !chest) return null;
  return <div className="dng">
    {stamps && <p className="dng__stamps" aria-label={`Premios de hoy: ${stamps.played} de ${stamps.limit}`}>
      <span className="dng__dots" aria-hidden="true">{Array.from({ length: stamps.limit }, (_, i) => <i key={i} className={i < stamps.played ? "is-on" : ""} />)}</span>
      <b>PREMIOS DE HOY {stamps.played}/{stamps.limit}</b>
      <small>{stamps.left > 0 ? `Te quedan ${stamps.left}` : "¡Llegaste al tope de premios de hoy!"}</small>
    </p>}
    {chest && <p className="dng__record dng__record--chest">🎁 {chest.text}</p>}
    {record && <p className={`dng__record dng__record--${record.kind}`}>🎯 {record.text}</p>}
  </div>;
}
