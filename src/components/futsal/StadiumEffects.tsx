import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
/** Decorative only: no canvas loop, randomness or interaction over the pitch. */
export function StadiumEffects() {
 const ref=useRef<HTMLDivElement>(null);
 const [paused,setPaused]=useState(false);
 useEffect(()=>{
  const node=ref.current;
  if(!node||typeof IntersectionObserver==="undefined")return;
  const observer=new IntersectionObserver(entries=>setPaused(!entries[0]?.isIntersecting),{rootMargin:"60px"});
  observer.observe(node);return()=>observer.disconnect();
 },[]);
 return <div ref={ref} className={`fx-atmosphere${paused?" fx-paused":""}`} aria-hidden="true"><div className="fx-beam fx-beam-left"/><div className="fx-beam fx-beam-right"/><div className="fx-haze"/><div className="fx-dust">{Array.from({length:12},(_,i)=><i key={i} style={{"--fx-x":`${7+(i*19)%87}%`,"--fx-delay":`${-(i*1.7)}s`,"--fx-duration":`${12+(i%5)*2}s`,"--fx-drift":`${(i%2?1:-1)*(15+i*3)}px`} as CSSProperties}/>)}</div></div>;
}
export function SavedCelebration({ onDismiss }: { onDismiss: () => void }) {
 const dialog=useRef<HTMLDialogElement>(null);
 const button=useRef<HTMLButtonElement>(null);
 const title=useId(), description=useId();
 useEffect(()=>{
  const node=dialog.current;if(!node)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const overflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  if(!node.open)node.showModal();
  button.current?.focus();
  return()=>{if(node.open)node.close();document.body.style.overflow=overflow;if(previous?.isConnected){if(previous.matches(":disabled"))node.closest(".pt-detail")?.querySelector<HTMLButtonElement>(".pt-back")?.focus();else previous.focus();}};
 },[]);
 return <dialog ref={dialog} className="fx-confirm" aria-labelledby={title} aria-describedby={description} onCancel={e=>{e.preventDefault();onDismiss();}} onClick={e=>{if(e.target===e.currentTarget)onDismiss();}}>
  <div className="fx-confirm-panel"><span className="fx-confirm-check" aria-hidden="true">✓</span><span className="fx-confirm-kicker">PRONÓSTICO GUARDADO</span><h3 id={title}>¡BOLETA CONFIRMADA!</h3><p id={description}>Tu pronóstico ya está en juego.<br/>Sumás en el general y en tus miniligas.</p><button ref={button} type="button" className="lp-primary" onClick={onDismiss}>Seguir jugando →</button><small>Podés revisar tu boleta cuando quieras.</small><div className="fx-confetti" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} style={{"--fx-angle":`${i*36}deg`,"--fx-delay":`${(i%3)*.05}s`} as CSSProperties}/>)}</div></div>
 </dialog>;
}
