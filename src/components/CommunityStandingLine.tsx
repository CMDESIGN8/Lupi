import { useCommunityStanding } from "../hooks/useCommunityStanding";
import "./CommunityStandingLine.css";

/** "TU POSICIÓN #3 · 12 pts" + qué falta para subir. No muestra nada si no hay ranking o falla la consulta. */
export function CommunityStandingLine({ communityId, userId, refreshKey }: { communityId?: string; userId: string; refreshKey: string }) {
  const s = useCommunityStanding(communityId, userId, refreshKey);
  if (!s) return null;
  return <p className="csl" role="status">
    <span>🏟️ TU POSICIÓN ESTA SEMANA <b>#{s.position}</b></span>
    <small>{s.points} pts · {s.played} PJ{s.hint ? ` · ${s.hint}` : ""}</small>
  </p>;
}
