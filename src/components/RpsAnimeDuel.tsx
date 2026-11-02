import {DuelGameHeader} from './DuelGameHeader';
import { SkillMatchReward } from './SkillMatchReward';
import { DuelResultEffects } from './DuelResultEffects';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "../hooks/useLobbyChallenges";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import { ArenaAvatar } from "./match/ArenaAvatar";
import type { InventoryItem } from "../hooks/useAuraInventory";
import { useDuelConnection } from "../hooks/useDuelConnection";
import { DuelConnectionNotice } from "./DuelConnectionNotice";
import { useRpsMatch } from "../hooks/useRpsMatch";
import { useRpsBotMatch } from "../hooks/useRpsBotMatch";
import { useDuelReward } from "../hooks/useDuelReward";
import { DuelRewardCard } from "./DuelRewardCard";
import { duelFx } from "../lib/duelFx";
import "./RockPaperScissors.css";
import "./DuelResolution.css";
import "./RpsAnimeVersus.css";
type Props = { challenge: Challenge; meId: string; players?: LobbyPlayer[]; catalog?: InventoryItem[]; onExit: () => void; onFinished?: (finished: boolean) => void; onRematch?: () => void };
const choices = [{id:"rock",label:"PIEDRA",beats:"Vence a tijera"},{id:"paper",label:"PAPEL",beats:"Vence a piedra"},{id:"scissors",label:"TIJERA",beats:"Vence a papel"}] as const;
type Move=typeof choices[number]['id'];
const valid=(value?:string):value is Move=>choices.some(c=>c.id===value);
const label=(value:string)=>choices.find(c=>c.id===value)?.label??"MANO SECRETA";
export function RpsHand({move}:{move:Move}){return <span className="rps-hand" data-move={move} aria-hidden="true"/>;}
export function RockPaperScissors({challenge,meId,players=[],catalog=[],onExit,onFinished,onRematch}:Props){
 const [portraits]=useState(()=>players);
 const [botImageFailed,setBotImageFailed]=useState(false);
 const isBot=!!challenge.vsBot;
 const remote=useRpsMatch(challenge,!isBot),local=useRpsBotMatch(challenge,isBot);
 const {state,error,busy,play,refresh}=isBot?local:remote;
 const reported=useRef(false),sending=useRef(false);
 const [communityReport,setCommunityReport]=useState("");
 const [selection,setSelection]=useState<{round:number;move:Move}|null>(null);
 const [revealing,setRevealing]=useState(false);
 const [chant,setChant]=useState("");
 const host=challenge.fromId===meId, myName=host?challenge.fromName:challenge.toName,rivalName=host?challenge.toName:challenge.fromName;
 const rivalId=host?challenge.toId:challenge.fromId;
 const myWins=state?(host?state.hostWins:state.guestWins):0,rivalWins=state?(host?state.guestWins:state.hostWins):0;
 const finished=state?.status==="finished";
 const connection=useDuelConnection(challenge,!!state&&!finished&&!isBot);
 const exit=()=>{connection.leave();onExit();};
 const botResult=isBot&&finished?(state?.winnerId===meId?"win":state?.winnerId===null?"draw":"loss"):undefined;
 const {reward,error:rewardError}=useDuelReward("rps",challenge.id,!!finished,{vsBot:isBot,botResult,rivalId:isBot?undefined:rivalId});
 const [shake,setShake]=useState(false);
 const mine=state?.lastMoves?(host?state.lastMoves.host:state.lastMoves.guest):undefined;
 const theirs=state?.lastMoves?(host?state.lastMoves.guest:state.lastMoves.host):undefined;
 const revealKey=state?.lastMoves?`${state.round}:${state.status}`:"";
 useLayoutEffect(()=>{if(!revealKey)return;setRevealing(false);setChant("¡PIEDRA!");
  const timers=[window.setTimeout(()=>setChant("¡PAPEL!"),320),window.setTimeout(()=>setChant("¡TIJERA!"),640),window.setTimeout(()=>{setChant("");setRevealing(true);
    if(valid(mine)&&valid(theirs)){const tie=mine===theirs;const win=(mine==="rock"&&theirs==="scissors")||(mine==="paper"&&theirs==="rock")||(mine==="scissors"&&theirs==="paper");duelFx.reveal(tie?"tie":win?"win":"lose");setShake(!tie);}},960),window.setTimeout(()=>setShake(false),1440),window.setTimeout(()=>setRevealing(false),2600)];
  return()=>timers.forEach(timer=>window.clearTimeout(timer));},[revealKey]);
 useEffect(()=>{onFinished?.(!!finished||connection.stopped);},[finished,connection.stopped,onFinished]);
 useEffect(()=>{if(isBot||!challenge.communityId||!finished||reported.current)return;reported.current=true;
 void supabase.rpc("record_community_rps_result",{p_community_id:challenge.communityId,p_match_id:challenge.id,p_host_id:challenge.fromId,p_guest_id:challenge.toId}).then(({data,error:e})=>setCommunityReport(e?"No se pudo registrar en la comunidad: "+e.message:data?.confirmed?"✓ Resultado confirmado para el ranking comunitario":"El ranking espera la confirmación del rival."));
 },[challenge,finished]);
 const selected=selection && selection.round===state?.round?selection.move:null;
 const reveal=!chant&&(revealing||finished)&&valid(mine)&&valid(theirs);
 const roundWin=mine===theirs?"¡MISMA MANO!":(mine==="rock"&&theirs==="scissors")||(mine==="paper"&&theirs==="rock")||(mine==="scissors"&&theirs==="paper")?"¡RONDA TUYA!":"RONDA DEL RIVAL";
 const verdict=state?.winnerId===null?"¡EMPATE!":state?.winnerId===meId?"¡GANASTE!":"ESTA VEZ NO FUE";
 const choose=async(move:Move)=>{if(!state||finished||connection.stopped||connection.networkError||busy||chant||state.mineSubmitted||sending.current)return;sending.current=true;duelFx.tap();const round=state.round;setRevealing(false);setSelection({round,move});try{if(!await play(move))setSelection(value=>value?.round===round?null:value);}finally{sending.current=false;}};
 const face=(id:string,name:string)=>{
 const p=players.find(p=>p.userId===id)??portraits.find(p=>p.userId===id);
 return <span className="rps-anime-player">{isBot&&id===rivalId&&!botImageFailed?<img src="/images/lupi-welcome.png" alt={`Lupi · ${name}`} onError={()=>setBotImageFailed(true)}/>:<ArenaAvatar player={p} catalog={catalog} isMe={id===meId} name={name}/>}<i className="rps-anime-base"/></span>;
 };
 return <section className={`rps-arena rps-anime-duel ${shake?"duel-shake":""} ${chant?"is-chanting":""} ${finished&&!chant?"is-complete":""}`} data-outcome={finished ? state.winnerId===meId?"win":state.winnerId===null?"draw":"loss" : undefined} aria-label="Piedra, papel o tijera">
 {finished&&!chant&&<DuelResultEffects key={challenge.id} outcome={state.winnerId===meId?"win":state.winnerId===null?"draw":"loss"}/> }
  <DuelGameHeader game="rps" onBack={exit} mode={isBot?'VS BOT':'1 VS 1'} subtitle="DUELO ANIME · LEÉ AL RIVAL" title={<>PIEDRA, PAPEL <em>O TIJERA</em></>}/>

  <div className="rps-score lupi-duel-score"><div className={finished&&!chant&&state.winnerId===meId?"is-winner":""}>{face(meId,myName)}<strong>{myName}</strong><small>VOS</small></div><div className="rps-scoreboard"><b>{myWins}<i>:</i>{rivalWins}</b><span>{chant?"MANOS SELLADAS":finished?"FINAL":`RONDA ${state?.round??1} / 3`}</span></div><div className={finished&&!chant&&state.winnerId===rivalId?"is-winner":""}>{face(rivalId,rivalName)}<strong>{rivalName}</strong><small>RIVAL</small></div></div>
  <div data-round-outcome={reveal ? mine===theirs?"draw":roundWin==="¡RONDA TUYA!"?"win":"loss" : undefined} className={`rps-clash ${reveal?'is-revealed':''} ${finished?'is-final':''} ${chant?'is-chanting':''} ${selected&&!reveal&&!chant?"is-selected":""}`} key={reveal?revealKey:'secret'}>
   <div className="rps-clash__side">{chant?<RpsHand move="rock"/>:reveal?<RpsHand move={mine as Move}/>:selected?<RpsHand move={selected}/>:<RpsHand move="rock"/>}<small>{reveal?label(mine!):selected?"TU MANO · SECRETA":"TU PRÓXIMA JUGADA"}</small></div>
   <div className="rps-clash__center"><b key={chant}>{chant|| (reveal?"⚡":"VS")}</b><span>{chant?"LAS DOS MANOS ESTÁN SELLADAS":reveal?roundWin:state?.opponentSubmitted?"RIVAL LISTO":"ELECCIÓN SECRETA"}</span></div>
   <div className="rps-clash__side rps-clash__side--rival">{chant?<RpsHand move="rock"/>:reveal?<RpsHand move={theirs as Move}/>:<span className="rps-mystery" aria-label="Mano rival oculta">?</span>}<small>{reveal?label(theirs!):"NO MUESTRES TU JUEGO"}</small></div>
  </div>
  <div className="rps-live" role="status">{connection.stopped?<h3>DUELO INTERRUMPIDO</h3>:chant?<h3>¡A LA CUENTA DE TRES!</h3>:finished?<h3>{verdict}</h3>:<><h3>{busy?"SELLANDO TU MANO…":state?.mineSubmitted?"MANO ENVIADA ✓":"ELEGÍ TU JUGADA"}</h3><p>{!state?"Entrando a la arena…":state.mineSubmitted?"Tu elección está oculta. Esperando al rival…":"Una elección. Un instante. Sorprendelo."}</p></>}</div>
  {error&&<p role="alert" className="rps-error">{error} <button type="button" onClick={()=>void refresh()}>RECONECTAR</button></p>}
  <DuelConnectionNotice {...connection} onRetry={()=>void connection.ping()} onExit={exit}/>
  {!finished&&!connection.stopped&&<div className="rps-choices">{choices.map(c=><button key={c.id} type="button" aria-pressed={selected===c.id} disabled={!state||connection.networkError||busy||!!chant||state.mineSubmitted} onClick={()=>void choose(c.id)}><RpsHand move={c.id}/><strong>{c.label}</strong><small>{c.beats}</small></button>)}</div>}
  {finished&&!chant&&<SkillMatchReward game="rps" matchId={challenge.id}/>}
  {finished&&!chant&&<DuelRewardCard reward={reward} error={rewardError} rivalName={rivalName} gameLabel="Piedra, papel o tijera"/>}
  {finished&&!chant&&<div className="rps-finish"><p className="rps-winner-name">{state.winnerId===null?"NADIE CEDE TERRENO":`${state.winnerId===meId?myName:rivalName} SE LLEVA EL DUELO`}</p>{onRematch&&<button className="duel-rematch" type="button" onClick={onRematch}>OTRA MANO · REVANCHA ↻</button>}<button className="rps-exit" type="button" onClick={exit}>VOLVER AL CLUB →</button></div>}
  {state?.lastMoves&&!chant&&<p className="rps-last">ÚLTIMA RONDA · {label(mine!)} vs {label(theirs!)} · {roundWin}</p>}
  {communityReport&&<p className="rps-community-report" role="status">{communityReport}</p>}
  <footer className="rps-rule">PIEDRA → TIJERA → PAPEL → PIEDRA <span>3 RONDAS · ELECCIONES SECRETAS</span></footer>
 </section>;
}
