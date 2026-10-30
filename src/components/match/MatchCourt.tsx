import type { CSSProperties, ReactNode } from "react";
import { USER_BASE, RIVAL_BASE, type Formation, type Pos } from "./formations";
import "./MatchCourt.css";
export type CourtPlayer = { id: string; name: string; rating?: number; badge?: string; icon?: string };
type Props = {
  home: CourtPlayer[]; away: CourtPlayer[]; homePositions?: Formation; awayPositions?: Formation;
  homeHighlight?: number | null; awayHighlight?: number | null;
  ball?: Pos | null; ballTeam?: "user" | "rival" | null;
  className?: string; children?: ReactNode; homeName?: string; awayName?: string;
};
const LABELS = ["ARQ", "CIE", "ALA", "ALA", "PIV"];
/** Cancha compartida: solo representa datos. No simula ni persiste resultados. */
export function MatchCourt({home,away,homePositions=USER_BASE,awayPositions=RIVAL_BASE,homeHighlight,awayHighlight,ball,ballTeam,className="",children,homeName,awayName}:Props) {
  const tokens = (cards:CourtPlayer[], side:"user"|"rival", positions:Formation, highlight:number|null|undefined) => cards.slice(0,5).map((card,index) => {
    const pos=positions[index] ?? (side==="user"?USER_BASE:RIVAL_BASE)[index];
    const active=highlight===index;
    return <div key={`${side}-${card.id}`} className={`player-on-court${active?" token-active":""}`} style={{left:`${pos.x}%`,top:`${pos.y}%`,zIndex:active?10:6} as CSSProperties}>
      <div className={`player-token ${side}-token${active?` token-glow-${side}`:""}`}>
        {ballTeam===side && active && <div className="ball-on-token" aria-hidden="true">⚽</div>}
        <div className="token-icon"><img src={card.icon ?? "/images/player.png"} alt="" draggable={false} onError={e=>{e.currentTarget.style.visibility="hidden";}} /></div>
        <div className="token-name" title={card.name}>{card.name}</div>
        <span className={`token-overall ${side}-overall`}>{card.rating ?? card.badge ?? LABELS[index]}</span>
      </div><div className="pos-label">{LABELS[index]}</div>
    </div>;
  });
  return <div className={`lupi-match-court ${className}`} aria-label="Cancha del partido">
    {homeName && <span className="lmc-team lmc-team--home">{homeName}</span>}
    {awayName && <span className="lmc-team lmc-team--away">{awayName}</span>}
    {tokens(home,"user",homePositions,homeHighlight)}{tokens(away,"rival",awayPositions,awayHighlight)}
    {ball && <div className="ball-token" style={{left:`${ball.x}%`,top:`${ball.y}%`}} aria-hidden="true">⚽</div>}
    {children}
  </div>;
}
