import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Deck,UserCard} from '../types/cards';
import type {FutsalStoryState,StoryChoice} from '../hooks/useFutsalStory';
import {CardBattle} from './CardBattle';
import {OwnedCardPortrait} from './OwnedCardPortrait';
import './FutsalStoryChapter.css';
const RESPONSES:Record<StoryChoice,string>={confident:'Esa confianza me gusta. Ahora acompañala con juego.',team:'Entonces mirá también al que corre al lado tuyo.',nervous:'Perfecto. Significa que te importa.'};
const ENDINGS={win:'Buen debut. Ahora viene lo difícil: demostrar que podés hacerlo otra vez.',draw:'No regalaste nada. Hay equipo para construir acá.',loss:'El resultado no te dio, pero terminaste la prueba. Mañana trabajamos lo que faltó.'};
export function FutsalStoryChapter({story,userId,deck,cards,onClose,onTeam,onBattleComplete,onMatchRecorded}:{story:FutsalStoryState;userId:string;deck:Deck;cards:UserCard[];onClose:()=>void;onTeam:()=>void;onBattleComplete:()=>void;onMatchRecorded:()=>void}){
 const [playing,setPlaying]=useState(false),[endingStep,setEndingStep]=useState(0);const root=useRef<HTMLElement>(null);
 const p=story.progress;const step=p?.intro_step??0;const completed=p?.status==='completed';const ending=p?.status==='ending'||completed;
 const activeMatch=playing;
 const act=(action:Parameters<typeof story.run>[0],choice?:StoryChoice)=>{void story.run(action,choice).catch(()=>{});};
 const close=()=>{if(!story.busy)onClose();};
 useEffect(()=>{const old=document.body.style.overflow;const focused=document.activeElement as HTMLElement|null;document.body.style.overflow='hidden';root.current?.focus();return()=>{document.body.style.overflow=old;focused?.focus();};},[]);
 useEffect(()=>{root.current?.focus();},[step,endingStep,ending]);
 const verifiedEnabled=import.meta.env.VITE_VERIFIED_MATCHES==='true';
 const footer=<p className="lp-story-save">Tu historia se guarda con tu cuenta. Los premios del partido se acreditan una sola vez.</p>;
 return createPortal(<section className={`lp-story ${activeMatch?'lp-story--playing':''}`} role="dialog" aria-modal="true" aria-labelledby="lp-story-title" tabIndex={-1} ref={root} onKeyDown={e=>{
  if(e.key==='Escape'&&!activeMatch){e.preventDefault();close();}
  if(e.key==='Tab'&&!activeMatch){const items=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')??[]);if(!items.length)return;if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===root.current)){e.preventDefault();items[items.length-1]?.focus();}else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0]?.focus();}}
 }}>
  <header className="lp-story-nav"><button type="button" disabled={story.busy} onClick={close}>‹ VOLVER AL CLUB</button><span>MANGA · CAPÍTULO 01</span></header>
  <div className="lp-story-heading"><small>LUPI WORLD · HISTORIA ORIGINAL</small><h1 id="lp-story-title">La primera oportunidad</h1><p>Leé la escena. Elegí la respuesta. Entrá a la cancha.</p></div>
  {story.error&&<div className="lp-story-error" role="alert"><strong>No pudimos sincronizar tu historia</strong><p>{story.error}</p><button type="button" disabled={story.busy} onClick={()=>act('get')}>Reintentar sincronización</button></div>}
  {activeMatch?<div className="lp-story-match"><p className="lp-story-objective">OBJETIVO · Completá la prueba. No necesitás ganar para avanzar.</p>
    <CardBattle userCards={cards} userDeck={deck} userId={userId} isCampaignMode autoStart={false}
      forcedOpponent={{name:'Bot Novato',overall_rating:55,category:'8va',level:1,avatar:'🥉',color:'#7a7a9a',xpBase:10,reqWins:0}}
      onBattleComplete={onBattleComplete} onMatchRecorded={onMatchRecorded}
      onVerifiedMatchStarted={async id=>{await story.run('bind',undefined,id);}}
      onVerifiedMatchCompleted={async id=>{await story.run('complete',undefined,id);}}
      onResultClosed={()=>{setPlaying(false);void story.run('get').catch(()=>{});}}
      onNavigateToDeck={()=>{setPlaying(false);onTeam();}}/>
   </div>:story.loading?<p role="status">Abriendo tu historia…</p>:<>
    <div className={`lp-story-stage ${step===1&&!ending?'lp-story-stage--rival':''}`}>
      <div className="lp-story-lights" aria-hidden="true"/>
      <div className="lp-story-player"><OwnedCardPortrait userId={userId}/></div>
      <img className="lp-story-coach" src="/images/lupi-welcome.png" alt="Lupi, tu entrenador"/>
      <span className="lp-story-panel-tag">VIÑETA {ending ? 'FINAL' : String(Math.min(step + 1, 3)).padStart(2, '0')}</span>
      <span className="lp-story-location">{ending?'DESPUÉS DEL SILBATO':'CLUB DE BARRIO · CANCHA DE ENTRENAMIENTO'}</span>
    </div>
    <div className="lp-story-dialogue" key={`${step}-${ending}-${endingStep}`}>
      {ending ? <>
       <small>{completed||endingStep===2?'CAPÍTULO 01 COMPLETADO':endingStep===1?'TU PRIMER RIVAL':'LUPI · TU ENTRENADOR'}</small>
       {completed||endingStep===2?<><h2>Diste el primer paso.</h2><p>Lupi te alcanza una pechera de entrenamiento.</p><blockquote>“Todavía no te ganaste la camiseta. Pero ya tenés un lugar en la práctica.”</blockquote><div className="lp-story-next"><small>PRÓXIMO CAPÍTULO · EN PREPARACIÓN</small><h3>Ganarse un lugar</h3><p>El sábado hay partido. Quedan cinco puestos… y alguien va a quedarse afuera.</p></div><button type="button" onClick={close}>VOLVER AL CLUB →</button></>
       :endingStep===0?<><h2>{p?.result==='win'?'Una entrada con personalidad':p?.result==='draw'?'Nadie regaló nada':'Una prueba no define tu historia'}</h2><div className="lp-story-score">VOS <b>{p?.user_score} : {p?.opponent_score}</b> EQUIPO DE PRÁCTICA</div><blockquote>“{p?.result?ENDINGS[p.result]:''}”</blockquote><p className="lp-story-objective">Prueba completada · Tu resultado quedó guardado.</p><button type="button" disabled={story.busy} onClick={()=>setEndingStep(1)}>CONTINUAR →</button></>
       :<><h2>Esto recién empieza</h2><blockquote>“Nos vemos en el próximo entrenamiento, nuevo.”</blockquote><p>Tu rival se aleja. Lupi te hace una seña para que te acerques al banco.</p><button type="button" disabled={story.busy} onClick={()=>{void story.run('finish').then(()=>setEndingStep(2)).catch(()=>{});}}>CERRAR EL CAPÍTULO →</button></>}
      </>:p?.status==='ready'||p?.status==='match'?<>
       <small>PARTIDO DE PRUEBA · {p.status==='match'?'EN CURSO':'LISTO PARA ENTRAR'}</small><h2>{p.status==='match'?'Tu prueba sigue acá':'Es tu turno de entrar'}</h2>
       <p>El equipo de práctica te espera. Jugás con tu quinteto y tomás las decisiones dentro de la cancha.</p><div className="lp-story-objective">Completá el partido. Ganar, empatar o perder tiene un cierre diferente.</div>
       {!verifiedEnabled?<p role="status">El modo historia todavía no está habilitado para jugar.</p>:(deck.cards?.length??0)<5?<><p>Necesitás cinco cartas en tu equipo para entrar.</p><button type="button" onClick={onTeam}>PREPARAR MI EQUIPO →</button></>:<button type="button" disabled={story.busy} onClick={()=>setPlaying(true)}>{p.status==='match'?'RETOMAR LA PRUEBA':'ENTRAR A LA CANCHA'} →</button>}
       {p.status==='match'&&<button className="lp-story-secondary" type="button" disabled={story.busy} onClick={()=>act('get')}>Comprobar el resultado guardado</button>}
      </>:step===0?<><small>LUPI · TU ENTRENADOR</small><h2>Hay una luz encendida para vos.</h2><p>La pelota rebota en la cancha. Llegaste al club y Lupi te espera junto al banco.</p><blockquote>“Viniste. Bien. Acá todos quieren hacer el gol de la victoria… pero primero hay que animarse a pedir la pelota.”</blockquote><button type="button" disabled={story.busy||!p} onClick={()=>act('next')}>ACERCARME A LA CANCHA →</button></>
      :step===1?<><small>JUGADOR DEL EQUIPO DE PRÁCTICA</small><h2>¿Vos sos el nuevo?</h2><blockquote>“Dale, entrenador. Que entre. Vamos a ver qué tiene.”</blockquote><p>No suena como una amenaza. Suena como una invitación a demostrar quién sos con la pelota.</p><button type="button" disabled={story.busy} onClick={()=>act('next')}>ESCUCHAR A LUPI →</button></>
      :step===2?<><small>LUPI · TU ENTRENADOR</small><h2>Antes de entrar…</h2><blockquote>“No tenés que demostrar todo hoy. Entrá, elegí tus jugadas y terminá la prueba.”</blockquote><p>¿Qué le respondés?</p><div className="lp-story-choices">{([['confident','Dame la pelota.'],['team','Voy a jugar para el equipo.'],['nervous','Estoy un poco nervioso.']] as const).map(([choice,label])=><button key={choice} type="button" disabled={story.busy} onClick={()=>act('choose',choice)}>{label} →</button>)}</div><small className="lp-story-choice-hint">Tu respuesta cambia el diálogo; tus atributos se mantienen.</small></>
      :<><small>LUPI · TU ENTRENADOR</small><h2>Una jugada a la vez.</h2><blockquote>“{p?.choice?RESPONSES[p.choice]:''}”</blockquote><div className="lp-story-objective">OBJETIVO · Completá tu primer partido de prueba.</div><p>En esta prueba no necesitás ganar para seguir tu historia.</p><button type="button" disabled={story.busy} onClick={()=>act('next')}>PREPARAR LA PRUEBA →</button></>}
      {story.busy&&<p role="status">Guardando tu avance…</p>}
    </div>{footer}
   </>}
 </section>,document.body);
}
