import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {learningAnswer,learningOverview,learningStart,learningState,type LearningOverview,type LearningSession} from '../lib/triviaLearning';
import './TriviaLearningHub.css';
export function TriviaLearningHub({compact=false,onOpenChange}:{compact?:boolean;onOpenChange?:(open:boolean)=>void}){
 const[info,setInfo]=useState<LearningOverview|null>(null),[session,setSession]=useState<LearningSession|null>(null);
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[feedback,setFeedback]=useState(false),[left,setLeft]=useState(25);
 const alive=useRef(true),locked=useRef(false),generation=useRef(0),deadline=useRef(0),current=useRef(session),notify=useRef(onOpenChange);notify.current=onOpenChange;current.current=session;
 const load=useCallback(async()=>{try{const r=await learningOverview();if(alive.current)setInfo(r)}catch(e){if(alive.current)setError(e instanceof Error?e.message:'No se pudo consultar el progreso.')}},[]);
 useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false;generation.current++;notify.current?.(false)}},[load]);
 const apply=(s:LearningSession)=>{current.current=s;setSession(s);deadline.current=s.deadline?Date.now()+Math.max(0,Date.parse(s.deadline)-Date.parse(s.serverNow)):0;setLeft(deadline.current?Math.max(0,Math.ceil((deadline.current-Date.now())/1000)):25)};
 const run=async(action:()=>Promise<LearningSession>,afterAnswer=false)=>{if(locked.current)return;locked.current=true;setBusy(true);setError('');const token=generation.current;try{const s=await action();if(!alive.current||token!==generation.current)return;apply(s);setFeedback(afterAnswer);notify.current?.(true);void load()}catch(e){if(alive.current&&token===generation.current)setError(e instanceof Error?e.message:'No se pudo continuar.')}finally{locked.current=false;if(alive.current&&token===generation.current)setBusy(false)}};
 const start=(mode:'daily'|'review')=>void run(()=>learningStart(mode));
 const answer=(index:number)=>{const s=current.current;if(!s?.question||feedback||locked.current)return;deadline.current=0;void run(()=>learningAnswer(s.id,s.question!.index,index),true)};
 const submitRef=useRef(answer);submitRef.current=answer;
 useEffect(()=>{if(!session?.question||feedback)return;const t=window.setInterval(()=>{if(!deadline.current||locked.current)return;const remaining=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setLeft(remaining);if(!remaining)submitRef.current(-1)},250);return()=>window.clearInterval(t)},[session?.id,session?.question?.index,feedback]);
 const close=()=>{if(locked.current)return;generation.current++;setSession(null);current.current=null;setFeedback(false);setError('');notify.current?.(false);void load()};
 const closeRef=useRef(close);closeRef.current=close;
 useEffect(()=>{if(!session)return;const prior=document.activeElement as HTMLElement|null;const modal=document.querySelector<HTMLElement>('.tl-practice');if(!modal)return;modal.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();closeRef.current();return}if(e.key!=='Tab')return;const nodes=Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);prior?.focus()};
 },[session?.id]);
 const practiceFinished=!!session&&session.status==='finished';
 return <section className={`tl-hub ${compact?'tl-hub--compact':''}`} aria-label="Entrenamiento de Preguntados">
  <div className="tl-heading"><small>PREGUNTADOS · APRENDÉ JUGANDO</small><h3>Tu cancha del conocimiento</h3><p>2 de futsal + 2 de fútbol + 1 de otro deporte por partida.</p></div>
  {info&&<div className="tl-topics">{info.topics.map(t=><div key={t.code}><strong>{t.label}</strong><b>{t.mastered}/{t.total}</b><progress max={Math.max(1,t.total)} value={Math.min(t.mastered,t.total)} aria-label={`${t.label}: ${t.mastered} temas acertados de ${t.total}`}/><small>{t.correct}/{t.attempts} respuestas acertadas</small></div>)}</div>}
  <div className="tl-actions"><button type="button" disabled={busy||!info} onClick={()=>start('daily')}>{info?.daily?.status==='finished'?`Ver desafío de hoy · ${info.daily.score}/5`:info?.daily?'Continuar desafío diario':'Desafío diario · 5 preguntas'}</button><button type="button" disabled={busy||!info||info.reviewDue===0} onClick={()=>start('review')}>Revancha de aprendizaje{info?` · ${info.reviewDue}`:''}</button></div>
  <p className="tl-note">Práctica sin monedas ni XP extra. Las falladas vuelven para repasar después de 10 minutos. El desafío cambia a las 00:00 de Argentina.</p>
  {error&&!session&&<p role="alert" className="tl-error">{error} <button type="button" onClick={()=>void load()}>Reintentar</button></p>}
  {session&&createPortal(<div className="tl-overlay"><section className="tl-practice" role="dialog" aria-modal="true" aria-label={session.mode==='daily'?'Desafío diario':'Revancha de aprendizaje'}>
   <header><button type="button" disabled={busy} onClick={close}>← Volver</button><strong>{session.mode==='daily'?'DESAFÍO DIARIO':'REVANCHA DE APRENDIZAJE'}</strong><b>{session.score}/5</b></header>
   {error&&<p role="alert" className="tl-error">{error} <button type="button" disabled={busy} onClick={()=>void run(()=>learningState(session.id))}>Reintentar</button></p>}
   {feedback&&session.lastResult?<div className="tl-feedback" role="status"><small>LUPI · TU ENTRENADOR</small><h3>{session.lastResult.ok?'¡Bien leída!':'¡Ahora ya la sabés!'}</h3><strong>{session.lastResult.correct}</strong><p>{session.lastResult.explanation}</p><button type="button" disabled={busy} onClick={()=>practiceFinished?setFeedback(false):void run(()=>learningState(session.id))}>{practiceFinished?'Ver resultado':'Siguiente pregunta →'}</button></div>:practiceFinished?<div className="tl-feedback"><h3>¡Práctica completada!</h3><b className="tl-final-score">{session.score}/5</b><p>Tu progreso por temas ya está guardado.</p><button type="button" onClick={close}>Volver al club</button></div>:session.question?<div className="tl-question"><div className="tl-question-top"><span>PREGUNTA {session.question.index+1}/5</span><b role="timer" aria-label={`${left} segundos restantes`}>{left}s</b></div><h3>{session.question.prompt}</h3><div className="tl-options">{session.question.options.map((option,i)=><button type="button" key={i} aria-label={`${String.fromCharCode(65+i)}. ${option}`} disabled={busy||left===0} onClick={()=>answer(i)}><b>{String.fromCharCode(65+i)}</b>{option}</button>)}</div></div>:<button type="button" disabled={busy} onClick={()=>void run(()=>learningState(session.id))}>Continuar práctica</button>}
  </section></div>,document.body)}
 </section>
}
