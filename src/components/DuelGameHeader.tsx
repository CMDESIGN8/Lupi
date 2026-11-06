import type {ReactNode} from 'react';
import './DuelGameHeader.css';
/** Shared navigation and title for Lupi's social minigames. */
export function DuelGameHeader({game,onBack,title,subtitle,mode,description,compact=false}:{game:'rps'|'trivia'|'truco'|'futsal';onBack:()=>void;title:ReactNode;subtitle:string;mode:string;description?:string;compact?:boolean}){
 const prefix=game==='rps'||game==='truco'?'rps':'trivia';
 return <>
  <header className={`${prefix}-header lupi-game-header`}>
   <button type="button" onClick={onBack} aria-label="Volver al club">← CLUB</button>
   <span className={game==='truco'?'tr-lupitruco-brand':undefined}>{game==='truco'?<>Lupi<em>Truco</em></>:'LUPI WORLD · ARENA SOCIAL'}</span><b>{mode}</b>
  </header>
  {!compact&&<div className={`${prefix}-title lupi-game-title`}><small>{subtitle}</small><h2>{title}</h2>{description&&<p>{description}</p>}</div>}
 </>;
}
