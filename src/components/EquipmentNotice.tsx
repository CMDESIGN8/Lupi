import {useEffect,useRef,useState,useCallback} from 'react';
import {createPortal} from 'react-dom';
import './EquipmentNotice.css';
type Notice={title:string;message:string;allowPlay:boolean;onChangeEquipment?:()=>void};
function EquipmentNoticeDialog({notice,onAnswer}:{notice:Notice;onAnswer:(answer:boolean)=>void}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{const old=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onAnswer(false);if(e.key==='Tab'){const buttons=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button')??[]);if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[buttons.length-1]?.focus();}else if(!e.shiftKey&&document.activeElement===buttons[buttons.length-1]){e.preventDefault();buttons[0]?.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);old?.focus();};},[onAnswer]);
 return createPortal(<div className="lp-wear-overlay"><section className="lp-wear-dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby="lp-wear-title" aria-describedby="lp-wear-message"><small>LUPI · ANTES DEL PITAZO</small><span className="lp-wear-icon" aria-hidden="true">{notice.allowPlay?'🥾':'⚠'}</span><h2 id="lp-wear-title">{notice.title}</h2><p id="lp-wear-message">{notice.message}</p><div><button type="button" onClick={()=>onAnswer(false)}>{notice.allowPlay?'Volver a la previa':'Entendido'}</button>{notice.onChangeEquipment&&<button type="button" className="lp-wear-play" onClick={()=>{onAnswer(false);notice.onChangeEquipment?.();}}>Cambiar medias y botines →</button>}{notice.allowPlay&&<button type="button" className="lp-wear-play" onClick={()=>onAnswer(true)}>Jugar igual →</button>}</div></section></div>,document.body);
}
export function useEquipmentNotice(){
 const [notice,setNotice]=useState<Notice|null>(null);const answerRef=useRef<((answer:boolean)=>void)|null>(null);
 const answer=useCallback((value:boolean)=>{const resolve=answerRef.current;answerRef.current=null;setNotice(null);resolve?.(value);},[]);
 useEffect(()=>()=>{answerRef.current?.(false);answerRef.current=null;},[]);
 const ask=useCallback((next:Notice)=>new Promise<boolean>(resolve=>{answerRef.current?.(false);answerRef.current=resolve;setNotice(next);}),[]);
 return {ask,dialog:notice?<EquipmentNoticeDialog notice={notice} onAnswer={answer}/>:null};
}
