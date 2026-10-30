import { FORMATIONS as SIMULATOR_FORMATIONS, mirror, type Formation, type Pos } from "./formations";
import type { FutsalEvent } from "../../hooks/useFutsalPvp";
// Mantiene el movimiento del simulador y abre carriles para evitar fichas superpuestas.
const FORMATIONS: Record<string, Formation> = {
  ...SIMULATOR_FORMATIONS,
  attack: {0:{x:10,y:50},1:{x:27,y:50},2:{x:48,y:22},3:{x:48,y:78},4:{x:64,y:50}},
  defense: {0:{x:9,y:50},1:{x:20,y:30},2:{x:33,y:18},3:{x:33,y:82},4:{x:20,y:73}},
};
type Presentation = { home: Formation; away: Formation; ball: Pos | null; homeHighlight: number | null; awayHighlight: number | null; ballTeam: "user" | "rival" | null; phase: "build" | "resolve" | "celebrate" | "stopped" };
/** Mismas formaciones que CardBattle; la línea de tiempo solo anima el resultado recibido. */
export function pvpPresentation(attackingHome: boolean, event: FutsalEvent | undefined, eventHome: boolean, revealAgeMs: number | null, buildAgeMs = Infinity, support = false, context?: {rulesVersion?:number;stage?:string;route?:string|null}): Presentation {
  const home={...(attackingHome?FORMATIONS.attack:FORMATIONS.defense)};
  const away=mirror(attackingHome?FORMATIONS.defense:FORMATIONS.attack);
  const side=attackingHome?"user":"rival";
  const initial:Presentation={home,away,ball:attackingHome?home[4]:away[4],homeHighlight:attackingHome?4:null,awayHighlight:attackingHome?null:4,ballTeam:side,phase:"build"};
  if(!event || revealAgeMs===null) {
    if(buildAgeMs<400) initial.ball=support?(attackingHome?home[1]:away[1]):{x:50,y:50};
    else if(buildAgeMs<850) initial.ball={x:attackingHome?57:43,y:50};
    else if(buildAgeMs<1300) {initial.ball=attackingHome?home[2]:away[2];initial.homeHighlight=attackingHome?2:null;initial.awayHighlight=attackingHome?null:2;}
    if(context?.rulesVersion===2 && buildAgeMs>=1300){
      const slot=context.stage==='build'?2:context.route==='wing'?3:context.route==='wall'?2:4;
      initial.ball=attackingHome?home[slot]:away[slot];initial.homeHighlight=attackingHome?slot:null;initial.awayHighlight=attackingHome?null:slot;
    }
    return initial;
  }
  initial.home={...(eventHome?FORMATIONS.attack:FORMATIONS.defense)};
  initial.away=mirror(eventHome?FORMATIONS.defense:FORMATIONS.attack);
  initial.homeHighlight=eventHome?4:0;initial.awayHighlight=eventHome?0:4;
  initial.ballTeam=eventHome?"user":"rival";
  initial.ball=eventHome?initial.home[4]:initial.away[4];
  if(revealAgeMs<550) return initial;
  initial.phase="resolve";initial.ballTeam=null;
  if(event.rulesVersion===2 && event.stage==='build'){
    const slot=event.route==='wing'?3:event.route==='wall'?2:4;
    if(event.defended){
      const interception={x:eventHome?60:40,y:event.route==='wing'?70:50};
      initial.ball=interception;initial.phase='stopped';
      if(eventHome){initial.away={...initial.away,1:interception};initial.awayHighlight=1;initial.homeHighlight=null;}
      else{initial.home={...initial.home,1:interception};initial.homeHighlight=1;initial.awayHighlight=null;}
    }else{
      initial.ball=eventHome?initial.home[slot]:initial.away[slot];initial.homeHighlight=eventHome?slot:null;initial.awayHighlight=eventHome?null:slot;
    }
    return initial;
  }
  if(event.goal){
    initial.ball={x:eventHome?94:6,y:event.attack==="angle"?35:50};
    if(revealAgeMs>=1400){initial.home={...(eventHome?FORMATIONS.celebrate:FORMATIONS.mourn)};initial.away=mirror(eventHome?FORMATIONS.mourn:FORMATIONS.celebrate);initial.phase="celebrate";initial.ball=null;}
  }else if(event.keepAttack){
    initial.ball=eventHome?initial.home[1]:initial.away[1];initial.homeHighlight=eventHome?1:null;initial.awayHighlight=eventHome?null:1;
  }else if(event.defended){
    const keeper={x:eventHome?86:14,y:event.attack==="angle"?38:50};
    if(event.defense==="back" && event.rulesVersion!==2){
      const interceptor={x:eventHome?72:28,y:50};initial.ball=interceptor;
      if(eventHome){initial.home={...initial.home,4:{x:55,y:50}};initial.away={...initial.away,1:interceptor};initial.awayHighlight=1;}else{initial.away={...initial.away,4:{x:45,y:50}};initial.home={...initial.home,1:interceptor};initial.homeHighlight=1;}
    }else{initial.ball=keeper;if(eventHome)initial.away={...initial.away,0:keeper};else initial.home={...initial.home,0:keeper};}
    initial.phase="stopped";
  }else{initial.ball={x:50,y:50};initial.phase="stopped";}
  return initial;
}
