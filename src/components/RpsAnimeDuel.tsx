import {DuelGameHeader} from './DuelGameHeader';
import { SkillMatchReward } from './SkillMatchReward';
import { DuelResultEffects } from './DuelResultEffects';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
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
import { DuelAnimeEntrance } from './DuelAnimeEntrance';
import { AvatarFace } from './AvatarFace';
import { LupiStoryPose } from './LupiStoryPose';
import { DEFAULT_APPEARANCE } from '../lib/avatarAppearance';
import { OwnedCardPortrait } from './OwnedCardPortrait';
import "./RockPaperScissors.css";
import "./DuelResolution.css";
import "./RpsAnimeVersus.css";
import "./RpsFutsalBattle.css";
type Props = { challenge: Challenge; meId: string; players?: LobbyPlayer[]; catalog?: InventoryItem[]; onExit: () => void; onFinished?: (finished: boolean) => void; onRematch?: () => void };
const choices = [{id:"rock",label:"PIEDRA",beats:"Vence a tijera"},{id:"paper",label:"PAPEL",beats:"Vence a piedra"},{id:"scissors",label:"TIJERA",beats:"Vence a papel"}] as const;
type Move=typeof choices[number]['id'];
const valid=(value?:string):value is Move=>choices.some(c=>c.id===value);
const label=(value:string)=>choices.find(c=>c.id===value)?.label??"MANO SECRETA";
export function RpsHand({move}:{move:Move}){return <span className="rps-hand" data-move={move} aria-hidden="true"/>;}
export function RockPaperScissors({challenge,meId,players=[],catalog=[],onExit,onFinished,onRematch}:Props){
 const [portraits]=useState(()=>players);
 const isBot=!!challenge.vsBot;
 const remote=useRpsMatch(challenge,!isBot),local=useRpsBotMatch(challenge,isBot);
 const {state,error,busy,play,refresh}=isBot?local:remote;
 const reported=useRef(false),sending=useRef(false);
 const [communityReport,setCommunityReport]=useState("");
 const [selection,setSelection]=useState<{round:number;move:Move}|null>(null);
 const [revealing,setRevealing]=useState(false);
 const [chant,setChant]=useState("");
 const [muted,setMuted]=useState(()=>duelFx.isMuted());
 const host=challenge.fromId===meId, myName=host?challenge.fromName:challenge.toName,rivalName=host?challenge.toName:challenge.fromName;
 const rivalId=host?challenge.toId:challenge.fromId;
 const myWins=state?(host?state.hostWins:state.guestWins):0,rivalWins=state?(host?state.guestWins:state.hostWins):0;
 const finished=state?.status==="finished";
 const [entrance,setEntrance]=useState(true);
 useEffect(()=>{setEntrance(true);if(!state)return;const timer=window.setTimeout(()=>setEntrance(false),3500);return()=>window.clearTimeout(timer);},[challenge.id,!!state]);
 const connection=useDuelConnection(challenge,!!state&&!finished&&!isBot);
 const exit=()=>{connection.leave();onExit();};
 const botResult=isBot&&finished?(state?.winnerId===meId?"win":state?.winnerId===null?"draw":"loss"):undefined;
 const {reward,error:rewardError,retry:retryReward}=useDuelReward("rps",challenge.id,!!finished,{vsBot:isBot,botResult,rivalId:isBot?undefined:rivalId});
 const mine=state?.lastMoves?(host?state.lastMoves.host:state.lastMoves.guest):undefined;
 const theirs=state?.lastMoves?(host?state.lastMoves.guest:state.lastMoves.host):undefined;
 const revealKey=state?.lastMoves?`${challenge.id}:${state.round}:${state.status}`:"";
 useLayoutEffect(()=>{if(!revealKey)return;setRevealing(false);setChant("¡PIEDRA!");
  const timers=[window.setTimeout(()=>setChant("¡PAPEL!"),320),window.setTimeout(()=>setChant("¡TIJERA!"),640),window.setTimeout(()=>{setChant("");setRevealing(true);
    if(valid(mine)&&valid(theirs)){const tie=mine===theirs;const win=(mine==="rock"&&theirs==="scissors")||(mine==="paper"&&theirs==="rock")||(mine==="scissors"&&theirs==="paper");duelFx.reveal(tie?"tie":win?"win":"lose");}},960),window.setTimeout(()=>setRevealing(false),2600)];
  return()=>timers.forEach(timer=>window.clearTimeout(timer));},[revealKey]);
 useEffect(()=>{onFinished?.(!!finished||connection.stopped);},[finished,connection.stopped,onFinished]);
 useEffect(()=>{if(isBot||!challenge.communityId||!finished||reported.current)return;reported.current=true;
 void supabase.rpc("record_community_rps_result",{p_community_id:challenge.communityId,p_match_id:challenge.id,p_host_id:challenge.fromId,p_guest_id:challenge.toId}).then(({data,error:e})=>setCommunityReport(e?"No se pudo registrar en la comunidad: "+e.message:data?.confirmed?"✓ Resultado confirmado para el ranking comunitario":"El ranking espera la confirmación del rival."));
 },[challenge,finished]);
 const selected=selection && selection.round===state?.round?selection.move:null;
 const reveal=!chant&&(revealing||finished)&&valid(mine)&&valid(theirs);
 const roundWin=mine===theirs?"¡MISMA MANO!":(mine==="rock"&&theirs==="scissors")||(mine==="paper"&&theirs==="rock")||(mine==="scissors"&&theirs==="paper")?"¡RONDA TUYA!":"RONDA DEL RIVAL";
 const verdict=state?.winnerId===null?"¡EMPATE!":state?.winnerId===meId?"¡GANASTE!":"ESTA VEZ NO FUE";
 const choose=async(move:Move)=>{if(!state||finished||connection.stopped||connection.networkError||busy||entrance||chant||revealing||state.mineSubmitted||sending.current)return;sending.current=true;duelFx.tap();const round=state.round;setRevealing(false);setSelection({round,move});try{if(!await play(move))setSelection(value=>value?.round===round?null:value);}finally{sending.current=false;}};
 const face=(id:string,name:string, battle=false)=>{
 const p=players.find(p=>p.userId===id)??portraits.find(p=>p.userId===id);
 const matchOver=finished&&!chant;
 const userWon=state?.winnerId===meId;
 const draw=state?.winnerId===null;
 const roundOutcome=reveal?(mine===theirs?'draw':roundWin==='¡RONDA TUYA!'?'win':'loss'):null;
 if(isBot&&id===rivalId){
  const pose=matchOver?(userWon?'sad':draw?'surprised':'celebrate'):roundOutcome==='win'?'sad':roundOutcome==='loss'?'celebrate':roundOutcome==='draw'?'surprised':'determined';
  const emotion=pose==='celebrate'?'win':pose==='sad'?'loss':pose==='surprised'?'draw':'focus';
  if(matchOver&&!battle)return <span className={`rps-anime-player rps-result-avatar is-emotion-${emotion}`}><LupiStoryPose className="trivia-lupi-pose" pose={pose} label={`Lupi · ${name}`}/></span>;
  return <span className={`rps-anime-player rps-anime-player--face is-emotion-${emotion}`}><LupiStoryPose className="rps-score-lupi-face" pose={pose} label={`Lupi · ${name}`}/></span>;
 }
 const outcome=matchOver?(draw?'draw':state?.winnerId===id?'win':'loss')
  :roundOutcome?(roundOutcome==='draw'?'draw':(roundOutcome==='win')===(id===meId)?'win':'loss'):'focus';
 const expression=outcome==='win'?(p?.appearance?.expressionPresets?.celebrate??'happy')
  :outcome==='loss'?'sad':outcome==='draw'?'surprised':(p?.appearance?.expressionPresets?.focus??'determined');
 const appearance={...(p?.appearance??DEFAULT_APPEARANCE),expression};
 const mood=outcome==='win'?'celebrate':outcome==='focus'?'focus':undefined;
 if(matchOver&&p&&!battle)return <span className={`rps-anime-player rps-result-avatar is-emotion-${outcome}`}><OwnedCardPortrait userId={id} appearanceOverride={appearance} mood={outcome==='win'?'celebrate':outcome==='loss'?'miss':undefined}/></span>;
 return <span className={`rps-anime-player rps-anime-player--face is-emotion-${outcome}`}><AvatarFace mood={mood} appearance={appearance}/></span>;
 };
 return <section className={`rps-arena rps-anime-duel rps-futsal-battle ${chant?"is-chanting":""} ${reveal?"is-revealing":""} ${finished&&!chant?"is-complete":""}`} data-outcome={finished ? state.winnerId===meId?"win":state.winnerId===null?"draw":"loss" : undefined} aria-label="Piedra, papel o tijera">
 {entrance&&state&&<DuelAnimeEntrance game="FUTSAL BATTLE" leftName={myName} rightName={rivalName} leftAvatar={<OwnedCardPortrait userId={meId}/>} rightAvatar={isBot?<LupiStoryPose pose="determined" label="Profe Lupi"/>:<ArenaAvatar player={players.find(p=>p.userId===rivalId)??portraits.find(p=>p.userId===rivalId)} catalog={catalog} name={rivalName}/>} leftLine="¡Esta mano la juego con todo!" rightLine={isBot?"¡A ver si podés leer mi estrategia!":"¡No vas a anticipar mi jugada!"} onDone={()=>setEntrance(false)}/>}
 {finished&&!chant&&<DuelResultEffects key={challenge.id} outcome={state.winnerId===meId?"win":state.winnerId===null?"draw":"loss"}/> }
  <DuelGameHeader game="rps" onBack={exit} mode={isBot?'VS BOT':'1 VS 1'} subtitle="FUTSAL BATTLE · LEÉ LA JUGADA" title={<>PIEDRA, PAPEL <em>O TIJERA</em></>}/>

  <div data-round-outcome={reveal ? mine===theirs?"draw":roundWin==="¡RONDA TUYA!"?"win":"loss" : undefined} className={`rps-clash ${reveal?'is-revealed':''} ${finished?'is-final':''} ${chant?'is-chanting':''} ${selected&&!reveal&&!chant?"is-selected":""}`} key={reveal?revealKey:'secret'}>
   <div className="rps-battle-world" aria-hidden="true"><div className="rps-battle-lights"/><div className="rps-battle-court"><i/><i/></div><div className="rps-battle-goal"/><div className="rps-battle-speed"/></div>
   <div className="rps-battle-cast">
    {[{id:meId,name:myName,own:true},{id:rivalId,name:rivalName,own:false}].map(player=>{
     const outcome=finished&&!chant?(state.winnerId===null?'draw':state.winnerId===player.id?'win':'loss'):reveal?(mine===theirs?'draw':(roundWin==='¡RONDA TUYA!')===player.own?'win':'loss'):'focus';
     return <div key={player.id} className={`rps-battle-fighter ${player.own?'is-own':'is-rival'} is-${outcome}`}>
      <div className="rps-battle-aura"/>{face(player.id,player.name,true)}
      <span key={`${revealKey}:${reveal}:${chant}`} className="rps-battle-emote" aria-hidden="true">{chant?'👀':outcome==='win'?'🤩':outcome==='loss'?'😵':outcome==='draw'?'😳':selected&&player.own?'🤫':'🔥'}</span>
      <strong className="rps-battle-name">{player.name}</strong><small>{reveal?(outcome==='win'?'¡TE LEÍ!':outcome==='loss'?'¡¿CÓMO?!':'¡IGUALES!'):player.own?'VOS':'RIVAL'}</small>
     </div>;
    })}
    <div className="rps-scoreboard rps-battle-score" aria-label={`Marcador: ${myName} ${myWins}, ${rivalName} ${rivalWins}`}><b><span>{myWins}</span><i>:</i><span>{rivalWins}</span></b><span>{chant?'MANOS SELLADAS':finished?'FINAL':`RONDA ${state?.round??1} / 3`}</span></div>
   </div>
   <div className="rps-battle-ball" aria-hidden="true">⚽</div>
   {reveal&&<div className="rps-battle-impact" aria-hidden="true"><b>{mine===theirs?'¡BLOQUEO!':roundWin==='¡RONDA TUYA!'?'¡GOLAZO!':'¡CONTRAATAQUE!'}</b>{Array.from({length:18},(_,i)=><i key={i} style={{'--angle':`${i*20}deg`,'--distance':`${65+(i%4)*25}px`,'--delay':`${(i%3)*35}ms`} as CSSProperties}/>)}</div>}
   <div className="rps-clash__side">{chant?<RpsHand move="rock"/>:reveal?<RpsHand move={mine as Move}/>:selected?<RpsHand move={selected}/>:<RpsHand move="rock"/>}<small>{reveal?label(mine!):selected?"TU MANO · SECRETA":"TU PRÓXIMA JUGADA"}</small></div>
   <div className="rps-clash__center"><b key={chant}>{chant|| (reveal?"⚡":"VS")}</b><span>{chant?"LAS DOS MANOS ESTÁN SELLADAS":reveal?roundWin:state?.opponentSubmitted?"RIVAL LISTO":"ELECCIÓN SECRETA"}</span></div>
   <div className="rps-clash__side rps-clash__side--rival">{chant?<RpsHand move="rock"/>:reveal?<RpsHand move={theirs as Move}/>:<span className="rps-mystery" aria-label="Mano rival oculta">?</span>}<small>{reveal?label(theirs!):"NO MUESTRES TU JUEGO"}</small></div>
  </div>
  <div className={finished&&!chant?"rps-result-scene":"rps-live-scene"}>
  <div className="rps-live" role="status"><button className="rps-battle-sound" type="button" aria-pressed={!muted} onClick={()=>{const next=!muted;duelFx.setMuted(next);setMuted(next);}}>{muted?"♪ ACTIVAR SONIDO":"♪ SONIDO ACTIVADO"}</button>{connection.stopped?<h3>DUELO INTERRUMPIDO</h3>:chant?<h3>¡A LA CUENTA DE TRES!</h3>:finished?<h3>{verdict}</h3>:revealing?<><h3>{roundWin}</h3><p>Preparando el próximo choque…</p></>:<><h3>{busy?"SELLANDO TU MANO…":state?.mineSubmitted?"MANO ENVIADA ✓":"ELEGÍ TU JUGADA"}</h3><p>{!state?"Entrando a la arena…":state.mineSubmitted?"Tu elección está oculta. Esperando al rival…":"Leé su gesto, elegí tu mano y ganá el choque."}</p></>}{reveal&&<aside className={`rps-anime-dialogue ${mine===theirs?'is-tie':roundWin==='¡RONDA TUYA!'?'is-positive':'is-focus'}`}><small>{isBot?'PROFE LUPI':mine===theirs?'DUELO PAREJO':roundWin==='¡RONDA TUYA!'?'VOS':'RIVAL'}</small><p>{mine===theirs?'¡Misma lectura! Esta mano se define en la próxima.':roundWin==='¡RONDA TUYA!'?(isBot?'¡Muy bien leída! Esa jugada fue toda tuya.':'¡Leíste el movimiento y te quedaste con la ronda!'):(isBot?'¡Te anticipé esta vez! Ajustá la estrategia y vamos otra.':'El rival leyó tu jugada. Cambiá el ritmo en la próxima.')}</p></aside>}</div>
  {error&&<p role="alert" className="rps-error">{error} <button type="button" onClick={()=>void refresh()}>RECONECTAR</button></p>}
  <DuelConnectionNotice {...connection} onRetry={()=>void connection.ping()} onExit={exit}/>
  {!finished&&!connection.stopped&&<div className="rps-choices">{choices.map(c=><button key={c.id} type="button" aria-pressed={selected===c.id} disabled={!state||connection.networkError||busy||entrance||!!chant||revealing||state.mineSubmitted} onClick={()=>void choose(c.id)}><RpsHand move={c.id}/><strong>{c.label}</strong><em>{c.id==="rock"?"POTENCIA":c.id==="paper"?"CONTROL":"VELOCIDAD"}</em><small>{c.beats}</small></button>)}</div>}
  {finished&&!chant&&<div className="rps-result-stack">{reward&&<SkillMatchReward key={`${challenge.id}:${reward.duplicate}`} game="rps" matchId={challenge.id} userId={meId}/>}<DuelRewardCard reward={reward} error={rewardError} onRetry={retryReward} rivalName={rivalName} gameLabel="Piedra, papel o tijera"/><div className="rps-finish"><p className="rps-winner-name">{state.winnerId===null?"NADIE CEDE TERRENO":`${state.winnerId===meId?myName:rivalName} SE LLEVA EL DUELO`}</p>{onRematch&&<button className="duel-rematch" type="button" onClick={onRematch}>OTRA MANO · REVANCHA ↻</button>}<button className="rps-exit" type="button" onClick={exit}>VOLVER AL CLUB →</button></div></div>}
  </div>
  {state?.lastMoves&&!chant&&<p className="rps-last">ÚLTIMA RONDA · {label(mine!)} vs {label(theirs!)} · {roundWin}</p>}
  {communityReport&&<p className="rps-community-report" role="status">{communityReport}</p>}
  <footer className="rps-rule rps-rule--detailed"><strong>REGLAS DEL DUELO</strong><span>Mejor de 3 · elección secreta</span><span>Piedra vence a tijera · papel vence a piedra · tijera vence a papel</span></footer>
 </section>;
}
