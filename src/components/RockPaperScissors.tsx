import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "../hooks/useLobbyChallenges";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import { AvatarFace } from "./AvatarFace";
import { useRpsMatch } from "../hooks/useRpsMatch";
import "./RockPaperScissors.css";
type Props = { challenge: Challenge; meId: string; players?: LobbyPlayer[]; onExit: () => void; onFinished?: (finished: boolean) => void; onRematch?: () => void };
const choices = [{id:"rock",label:"PIEDRA",beats:"Vence a tijera"},{id:"paper",label:"PAPEL",beats:"Vence a piedra"},{id:"scissors",label:"TIJERA",beats:"Vence a papel"}] as const;
type Move=typeof choices[number]['id'];
const valid=(value?:string):value is Move=>choices.some(c=>c.id===value);
const label=(value:string)=>choices.find(c=>c.id===value)?.label??"MANO SECRETA";
export function RpsHand({move}:{move:Move}){return <span className="rps-hand" data-move={move} aria-hidden="true"/>;}
export function RockPaperScissors({challenge,meId,players=[],onExit,onFinished,onRematch}:Props){
 const [portraits]=useState(()=>players);
 const {state,error,busy,play,refresh}=useRpsMatch(challenge);
 const reported=useRef(false),sending=useRef(false);
 const [communityReport,setCommunityReport]=useState("");
 const [selection,setSelection]=useState<{round:number;move:Move}|null>(null);
 const [revealing,setRevealing]=useState(false);
 const host=challenge.fromId===meId, myName=host?challenge.fromName:challenge.toName,rivalName=host?challenge.toName:challenge.fromName;
 const rivalId=host?challenge.toId:challenge.fromId;
 const myWins=state?(host?state.hostWins:state.guestWins):0,rivalWins=state?(host?state.guestWins:state.hostWins):0;
 const finished=state?.status==="finished";
 const mine=state?.lastMoves?(host?state.lastMoves.host:state.lastMoves.guest):undefined;
 const theirs=state?.lastMoves?(host?state.lastMoves.guest:state.lastMoves.host):undefined;
 const revealKey=state?.lastMoves?`${state.round}:${state.status}`:"";
 useEffect(()=>{if(!revealKey)return;setRevealing(true);const timer=window.setTimeout(()=>setRevealing(false),1700);return()=>window.clearTimeout(timer);},[revealKey]);
 useEffect(()=>{onFinished?.(!!finished);},[finished,onFinished]);
 useEffect(()=>{if(!challenge.communityId||!finished||reported.current)return;reported.current=true;
 void supabase.rpc("record_community_rps_result",{p_community_id:challenge.communityId,p_match_id:challenge.id,p_host_id:challenge.fromId,p_guest_id:challenge.toId}).then(({data,error:e})=>setCommunityReport(e?"No se pudo registrar en la comunidad: "+e.message:data?.confirmed?"✓ Resultado confirmado para el ranking comunitario":"El ranking espera la confirmación del rival."));
 },[challenge,finished]);
 const selected=selection && selection.round===state?.round?selection.move:null;
 const reveal=(revealing||finished)&&valid(mine)&&valid(theirs);
 const roundWin=mine===theirs?"¡MISMA MANO!":(mine==="rock"&&theirs==="scissors")||(mine==="paper"&&theirs==="rock")||(mine==="scissors"&&theirs==="paper")?"¡RONDA TUYA!":"RONDA DEL RIVAL";
 const verdict=state?.winnerId===null?"¡EMPATE!":state?.winnerId===meId?"¡GANASTE!":"¡BUEN DUELO!";
 const choose=async(move:Move)=>{if(!state||finished||busy||state.mineSubmitted||sending.current)return;sending.current=true;const round=state.round;setRevealing(false);setSelection({round,move});try{if(!await play(move))setSelection(value=>value?.round===round?null:value);}finally{sending.current=false;}};
 const face=(id:string,name:string)=>{const p=players.find(p=>p.userId===id)??portraits.find(p=>p.userId===id);return <span className="rps-player-face">{p?.appearance?<AvatarFace appearance={p.appearance}/>:name.charAt(0)}</span>;};
 return <section className="rps-arena" aria-label="Piedra, papel o tijera">
  <header className="rps-header"><button type="button" onClick={onExit}>← CLUB</button><span>LUPI WORLD · DUELO DE MANOS</span><span>1 VS 1</span></header>
  <div className="rps-title"><small>LEÉ AL RIVAL · JUGÁ TU MANO</small><h2>PIEDRA, PAPEL <em>O TIJERA</em></h2></div>
  <div className="rps-score"><div>{face(meId,myName)}<strong>{myName}</strong><small>VOS</small></div><div className="rps-scoreboard"><b>{myWins}<i>:</i>{rivalWins}</b><span>{finished?"FINAL":`RONDA ${state?.round??1} / 3`}</span></div><div>{face(rivalId,rivalName)}<strong>{rivalName}</strong><small>RIVAL</small></div></div>
  <div className={`rps-clash ${reveal?'is-revealed':''} ${finished?'is-final':''}`} key={reveal?revealKey:'secret'}>
   <div className="rps-clash__side">{reveal?<RpsHand move={mine as Move}/>:selected?<RpsHand move={selected}/>:<RpsHand move="rock"/>}<small>{reveal?label(mine!):selected?"TU MANO · SECRETA":"TU PRÓXIMA JUGADA"}</small></div>
   <div className="rps-clash__center"><b>{reveal?"⚡":"VS"}</b><span>{reveal?roundWin:state?.opponentSubmitted?"RIVAL LISTO":"ELECCIÓN SECRETA"}</span></div>
   <div className="rps-clash__side rps-clash__side--rival">{reveal?<RpsHand move={theirs as Move}/>:<span className="rps-mystery" aria-label="Mano rival oculta">?</span>}<small>{reveal?label(theirs!):"NO MUESTRES TU JUEGO"}</small></div>
  </div>
  <div className="rps-live" role="status">{finished?<h3>{verdict}</h3>:<><h3>{busy?"SELLANDO TU MANO…":state?.mineSubmitted?"MANO ENVIADA ✓":"ELEGÍ TU JUGADA"}</h3><p>{!state?"Entrando a la arena…":state.mineSubmitted?"Tu elección está oculta. Esperando al rival…":"Una elección. Un instante. Sorprendelo."}</p></>}</div>
  {error&&<p role="alert" className="rps-error">{error} <button type="button" onClick={()=>void refresh()}>RECONECTAR</button></p>}
  {!finished&&<div className="rps-choices">{choices.map(c=><button key={c.id} type="button" aria-pressed={selected===c.id} disabled={!state||busy||state.mineSubmitted} onClick={()=>void choose(c.id)}><RpsHand move={c.id}/><strong>{c.label}</strong><small>{c.beats}</small></button>)}</div>}
  {finished&&<div className="rps-finish">{onRematch&&<button className="duel-rematch" type="button" onClick={onRematch}>OTRA MANO · REVANCHA ↻</button>}<button className="rps-exit" type="button" onClick={onExit}>VOLVER AL CLUB →</button></div>}
  {state?.lastMoves&&<p className="rps-last">ÚLTIMA RONDA · {label(mine!)} vs {label(theirs!)} · {roundWin}</p>}
  {communityReport&&<p className="rps-community-report" role="status">{communityReport}</p>}
  <footer className="rps-rule">PIEDRA → TIJERA → PAPEL → PIEDRA <span>3 RONDAS · ELECCIONES SECRETAS</span></footer>
 </section>;
}
