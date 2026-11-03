import {useCallback,useEffect,useRef,useState} from 'react';
import type {FutsalStoryState,StoryChoice,StoryProgress} from '../hooks/useFutsalStory';
import {OwnedCardPortrait} from './OwnedCardPortrait';
import {LupiStoryPose} from './LupiStoryPose';
import {AvatarFace} from './AvatarFace';
import type {AvatarAppearance} from '../lib/avatarAppearance';
import {useAvatarAppearance} from '../hooks/useAvatarAppearance';
import mysteryPlayer from '../assets/story-mystery-player.png';
import './StoryMotionPage.css';
import './StoryFullscreen.css';
import './StoryMangaEffects.css';

const replies:Record<StoryChoice,string>={confident:'Esa confianza me gusta. Ahora acompañala con juego.',team:'Entonces mirá también al que corre al lado tuyo.',nervous:'Perfecto. Significa que te importa.'};
const choiceLines:Record<StoryChoice,string>={confident:'Dame la pelota.',team:'Voy a jugar para el equipo.',nervous:'Estoy un poco nervioso.'};
function StoryTypeText({text,active,delay=0,complete=false,reduced=false}:{text:string;active:boolean;delay?:number;complete?:boolean;reduced?:boolean}){
 const [count,setCount]=useState(0);
 useEffect(()=>{
  setCount(0);if(!active||complete||reduced)return;
  let timer:number;let cancelled=false;let n=0;
  const tick=()=>{if(cancelled)return;setCount(++n);if(n<text.length)timer=window.setTimeout(tick,22);};
  timer=window.setTimeout(tick,delay);return()=>{cancelled=true;window.clearTimeout(timer);};
 },[text,active,delay,complete,reduced]);
 const visible=complete||reduced?text.length:count;
 return <span className="story-type" data-typing={active&&visible<text.length?'true':undefined} aria-label={text}><span className="story-type__space" aria-hidden="true">{text}</span><span className="story-type__ink" aria-hidden="true">{text.slice(0,visible)}</span></span>;
}
function ArrivalFace({appearance}:{appearance:AvatarAppearance}){
 return <AvatarFace appearance={appearance} className="manga-arrival-face"/>;
}
export function StoryMotionReplay({userId,playerName,onDone}:{userId:string;playerName?:string;onDone:()=>void}){
 const [progress,setProgress]=useState<StoryProgress>({intro_step:0,status:'intro',choice:null,session_id:null,result:null,user_score:null,opponent_score:null});
 const run=useCallback<FutsalStoryState['run']>(async(action,choice)=>{
  setProgress(previous=>action==='choose'&&choice?{...previous,intro_step:3,choice}:action==='next'?{...previous,intro_step:Math.min(3,previous.intro_step+1),status:previous.intro_step===3?'ready':'intro'}:previous);
  return null;
 },[]);
 return <StoryMotionPage story={{progress,run,busy:false,loading:false,error:''}} userId={userId} playerName={playerName} canPlay onPlay={onDone} onTeam={onDone} replay/>;
}
type StoryMotionPageProps={story:FutsalStoryState;userId:string;playerName?:string;canPlay:boolean;onPlay:()=>void;onTeam:()=>void;replay?:boolean};
export function StoryMotionPage(props:StoryMotionPageProps){
 const {appearance,loading}=useAvatarAppearance(props.userId);
 if(loading)return <div className="motion-page motion-page--loading" role="status">Preparando tu personaje…</div>;
 return <StoryMotionPageReady {...props} appearance={appearance}/>;
}
function StoryMotionPageReady({story,userId,playerName,canPlay,onPlay,onTeam,replay=false,appearance}:{story:FutsalStoryState;userId:string;playerName?:string;canPlay:boolean;onPlay:()=>void;onTeam:()=>void;replay?:boolean;appearance:AvatarAppearance}){
 const p=story.progress;
 const ready=p?.status==='ready'||p?.status==='match';
 const step=ready?4:p?.intro_step??0;
 const [paused,setPaused]=useState(true),[hidden,setHidden]=useState(document.hidden),[arrivalBeat,setArrivalBeat]=useState(false);
 const panels=useRef<HTMLDivElement>(null);const [completeText,setCompleteText]=useState(false);
 const [playerReplyFinished,setPlayerReplyFinished]=useState(false);
 useEffect(()=>setPlayerReplyFinished(false),[step]);
 const [reduced,setReduced]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const change=()=>setReduced(query.matches);query.addEventListener?.('change',change);return()=>query.removeEventListener?.('change',change);},[]);
 useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[]);
 const advance=()=>{if(panels.current?.querySelector('[data-typing="true"]')){setCompleteText(true);return;}if(story.busy||story.error||ready||step===2)return;if(step===0&&!arrivalBeat){setArrivalBeat(true);return;}void story.run('next').catch(()=>{});};
 useEffect(()=>{
  if(paused||hidden||reduced||story.busy||story.error||ready||step===2)return;
  const timer=window.setTimeout(advance,12000);
  return()=>window.clearTimeout(timer);
 },[step,arrivalBeat,paused,hidden,reduced,story.busy,story.error,ready,story.run]);
 useEffect(()=>{if(step!==0)setArrivalBeat(true);},[step]);
 const active=step===0?(arrivalBeat?1:0):step===1?2:3;
 useEffect(()=>setCompleteText(false),[active,step]);
 const type=(text:string,index:number,delay=150)=><StoryTypeText text={text} active={active===index} delay={delay} complete={completeText} reduced={reduced}/>;
 const state=(index:number)=>index===active?'is-lit':index<active?'is-read':'is-waiting';
 return <div className={`motion-page motion-page--cinema motion-page--manga-fx ${hidden?'is-paused':''}`} data-scene={active}>
  <div className="motion-page__controls"><span>CAPÍTULO 01 · ESCENA {active+1} / 4 {step===2?'· TU RESPUESTA':''}</span><button type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={!paused}>{paused?'▷ Automático':'Ⅱ Pausar avance'}</button></div>
  <div ref={panels} className="motion-page__panels" role="group" tabIndex={0} aria-label="La primera oportunidad. Tocá la escena o presioná la flecha derecha para avanzar." onClick={event=>{if(!(event.target as HTMLElement).closest('button,a,input,select,textarea'))advance();}} onKeyDown={event=>{if(event.target===event.currentTarget&&['ArrowRight','Enter',' '].includes(event.key)){event.preventDefault();advance();}}}>
   <article className={`motion-panel motion-panel--arrival ${state(0)}`} aria-label="Llegada al club">
    <div className="motion-panel__art"/><span className="motion-caption">Una tarde. Un club. Tu primera oportunidad.</span>
    <div className="motion-arrival-player" aria-hidden="true"><OwnedCardPortrait userId={userId} appearanceOverride={appearance}/></div>
    <strong className="motion-sfx" aria-hidden="true">TUM… TUM…</strong><span className="motion-location">La pelota sigue sonando al fondo.</span>
    <div className="manga-arrival-intro">
     <div className="manga-arrival-cutin" aria-hidden="true"><ArrivalFace appearance={appearance}/><strong>{playerName?.trim()||'TU PERSONAJE'}</strong></div>
     <p className="manga-arrival-vow"><b>{playerName?.trim()||'TU HISTORIA'}</b><strong>{type(`¡Es enorme! ¡Y es una cancha de verdad! Soy ${playerName?.trim()||'quien viene del barrio'}. Vengo del concreto. ¡Voy a vencerte y llegar a la cima de la Liga Lupi!`,0,1800)}</strong></p>
    </div>
   </article>
   <article className={`motion-panel motion-panel--coach ${state(1)}`} aria-label="Lupi te recibe">
    <div className="motion-panel__art"/><LupiStoryPose pose="welcome" className="motion-coach"/>
    <p className="motion-bubble motion-coach-speech"><b>LUPI COACH</b>{type('Llegaste a tiempo. Todos sueñan con hacer el gol del triunfo en el último minuto. Primero hay que animarse a pedir la pelota.',1,1800)}</p>
   </article>
   <article className={`motion-panel motion-panel--rival ${state(2)}`} aria-label="Una voz desde la cancha">
    <div className="motion-panel__art"/><img className="motion-mystery-player" src={mysteryPlayer} alt="Un jugador misterioso llama desde la cancha, con los ojos en sombra"/><span className="motion-caption">Una voz desde la cancha…</span>
    <p className="motion-bubble motion-rival-speech"><b>??? · TU COMPAÑERO</b><strong className="motion-rival-question">¿VOS SOS EL NUEVO?</strong><span>{type('Dale, entrenador. Que entre. Vamos a ver qué tiene.',2,2000)}</span></p>
   </article>
   <article className={`motion-panel motion-panel--decision ${state(3)} ${step===2?'is-choosing':''} ${step===3?'is-final-reply':''}`} aria-label="Antes de entrar a la cancha">
    <div className="motion-panel__art"/>
    <div className={`motion-decision-player ${step===2?'is-speaking':''}`} aria-hidden="true"><OwnedCardPortrait userId={userId} appearanceOverride={appearance}/></div>
    <LupiStoryPose pose={step===3?'determined':'explain'} className={`motion-decision-coach ${step!==2?'is-speaking':''}`} label=""/>
    <div className="motion-decision-copy" key={step} aria-live="polite">
     <span className="motion-caption">{ready?'ES TU TURNO':step===3?(playerReplyFinished||reduced||!p?.choice?'LUPI TE RESPONDE':'TU RESPUESTA'):'ANTES DE ENTRAR'}</span>
     <p className="motion-bubble"><b>LUPI COACH</b>{type(ready?'Entrá, elegí tus jugadas y terminá la prueba. No necesitás ganar para seguir.':step===3&&p?.choice?`${replies[p.choice]} Mientras yo esté aquí, eres invencible.`:'No tenés que demostrar todo hoy. Entrá y terminá la prueba.',3,step===2?1800:step===3?5100:150)}</p>
     {step===2&&<div className="motion-choices" aria-label="Elegí tu respuesta">{([['confident','Dame la pelota.'],['team','Voy a jugar para el equipo.'],['nervous','Estoy un poco nervioso.']] as const).map(([choice,label])=><button key={choice} type="button" disabled={story.busy} onClick={()=>{void story.run('choose',choice).catch(()=>{});}}>{label} <span>→</span></button>)}</div>}
     {ready&&(replay?<button className="motion-play" type="button" onClick={onPlay}>TERMINAR REPRODUCCIÓN →</button>:import.meta.env.VITE_VERIFIED_MATCHES!=='true'?<p className="motion-message">La prueba todavía no está habilitada.</p>:<button className="motion-play" type="button" disabled={story.busy} onClick={canPlay?onPlay:onTeam}>{canPlay?(p?.status==='match'?'RETOMAR LA PRUEBA':'ENTRAR A LA CANCHA'):'PREPARAR MI EQUIPO'} →</button>)}
    </div>
   </article>
   <div className="motion-dust" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${i*8+3}%`,animationDelay:`-${i*.8}s`}}/>)}</div>
   <div className="motion-ink-cut" key={`${step}-${arrivalBeat}`} aria-hidden="true"/>
   <div className="manga-scene-fx" key={`fx-${active}-${step}`} aria-hidden="true">
    <i className="manga-scene-fx__ink"/><i className="manga-scene-fx__rays"/><i className="manga-scene-fx__flare"/>
    {active===1&&<div className="manga-coach-cutin"><LupiStoryPose pose="welcome" label=""/><strong>LUPI<br/>COACH</strong></div>}
    {active===3&&step===2&&<div className="manga-coach-cutin manga-coach-cutin--entry"><LupiStoryPose pose="explain" label=""/><strong>A UN PASO<br/>DE LA CANCHA</strong></div>}
    {active===3&&step===3&&<>
     {p?.choice&&<div className="manga-arrival-cutin manga-player-reply" onAnimationEnd={event=>{if(event.target===event.currentTarget)setPlayerReplyFinished(true);}}><ArrivalFace appearance={appearance}/><strong><small>{playerName?.trim()||'VOS'}</small>{choiceLines[p.choice]}</strong></div>}
     <div className="manga-coach-cutin manga-coach-cutin--final"><LupiStoryPose pose="determined" label=""/><strong>Mientras yo esté aquí,<br/>eres invencible.</strong></div>
    </>}
    {active===2&&<div className="manga-rival-cutin"><img src={mysteryPlayer} alt=""/><span>¿VOS SOS<br/>EL NUEVO?</span></div>}
   </div>
  </div>
  <div className="motion-page__transport"><span role="status">{story.busy?'Guardando tu avance…':story.error?'Secuencia pausada. Reintentá la sincronización.':ready?'Tu primera prueba te espera.':step===2?'Elegí tu respuesta para seguir.':'Tocá la escena para continuar →'}</span>{!ready&&step!==2&&<button type="button" disabled={story.busy||!!story.error} onClick={advance}>CONTINUAR →</button>}</div>
 </div>;
}
