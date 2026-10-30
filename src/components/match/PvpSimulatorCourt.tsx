import { useEffect, useRef, type ReactNode } from "react";
import { AnimeEffects, type AnimeEffectsHandle } from "../AnimeEffects";
import { MatchCourt } from "./MatchCourt";
import { eventChoiceLabel } from "./futsalTactics";
import { pvpPresentation } from "./pvpPresentation";
import type { FutsalState } from "../../hooks/useFutsalPvp";
import "./PvpSimulatorCourt.css";
type Props={state:FutsalState;meId:string;mine:string;rival:string;now:number;receivedAt:number;isHost:boolean;overlay?:ReactNode};
export function PvpSimulatorCourt({state,meId,mine,rival,now,receivedAt,isHost,overlay}:Props){
  const fx=useRef<AnimeEffectsHandle>(null);
  const seen=useRef<number|null>(null);
  const attackingHome=meId===state.attackerId; // posesión actual, independiente del lado anfitrión
  const event=state.history[state.history.length - 1];
  const serverNow=Date.parse(state.serverNow)+Math.max(0,now-receivedAt);
  const next=Date.parse(state.nextAt);
  const revealAge=event && serverNow<next?Math.max(0,4000-(next-serverNow)):null;
  const ended=!["waiting","playing"].includes(state.status) && revealAge===null;
  const a=isHost?state.hostTeam:state.guestTeam;
  const b=isHost?state.guestTeam:state.hostTeam;
  const presentation=pvpPresentation(attackingHome,event,event?.attackerId===meId,revealAge,Math.max(0,serverNow-next),state.support,state);
  useEffect(()=>{
    if(!event || seen.current===event.version) return;
    seen.current=event.version;
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const age=4000-(Date.parse(state.nextAt)-Date.parse(state.serverNow));
    if(age<0 || age>=4000)return;
    const timer=window.setTimeout(()=>{
      if(event.goal)fx.current?.triggerGoal(event.attackerId===meId?"user":"rival");
      else if(event.defended && event.stage!=="build")fx.current?.triggerSave(event.attackerId===meId?"rival":"user");
      else fx.current?.triggerKeyMoment();
    },Math.max(0,850-age));
    return ()=>window.clearTimeout(timer);
  },[event?.version,meId]);
  return <div className="pvp-simulator-stage">
    <AnimeEffects ref={fx}/>
    <MatchCourt className={`pvp-simulator-court ${overlay ? "pvp-court-decision" : ""} ${!ended && revealAge===null?"pvp-court-tension":""} ${presentation.phase==="celebrate"?"pvp-court-goal":""}`}
      homeName={mine} awayName={rival} home={(a??[]).map(c=>({id:c.id,name:c.name}))} away={(b??[]).map(c=>({id:c.id,name:c.name}))}
      homePositions={ended&&revealAge===null?undefined:presentation.home} awayPositions={ended&&revealAge===null?undefined:presentation.away}
      homeHighlight={ended?null:presentation.homeHighlight} awayHighlight={ended?null:presentation.awayHighlight}
      ball={ended&&revealAge===null?null:presentation.ball} ballTeam={presentation.ballTeam}>
      {revealAge!==null && event && <div key={event.version} className={`pvp-sim-flash ${event.goal?"is-goal":""}`} role="status"><b>{event.goal?"¡GOL!":event.defended?event.stage==="build"?"¡RECUPERACIÓN!":"¡JUGADA FRENADA!":event.keepAttack?event.stage==="build"?"¡CAMINO AL ARCO!":"¡PASE COMPLETADO!":"SIN GOL"}</b><small>{eventChoiceLabel(event,true)} · {eventChoiceLabel(event,false)}</small></div>}
      <div className="pvp-court-atmosphere" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
      {overlay}
      {!ended && <span className="pvp-sim-live"><i/> {revealAge!==null?"REPETICIÓN DE LA JUGADA":overlay?"MOMENTO CLAVE":"EN JUEGO"}</span>}
    </MatchCourt>
    {event && revealAge!==null && <div className="pvp-sim-commentary" role="status"><strong>{event.narrative}</strong><small>{state.status==="finished"?"Cierre del partido en":"Próxima decisión en"} {Math.max(0,Math.ceil((next-serverNow)/1000))}…</small></div>}
  </div>;
}
