import type {ReactNode} from 'react';
import './DuelGameHeader.css';
/** Shared navigation and title for Lupi's social minigames. */
export function DuelGameHeader({game,onBack,title,subtitle,mode}:{game:'rps'|'trivia'|'truco';onBack:()=>void;title:ReactNode;subtitle:string;mode:string}){
 const prefix=game==='trivia'?'trivia':'rps';
 return <>
  <header className={`${prefix}-header lupi-game-header`}>
   <button type="button" onClick={onBack} aria-label="Volver al club">← CLUB</button>
   <span>LUPI WORLD · ARENA SOCIAL</span><b>{mode}</b>
  </header>
  <div className={`${prefix}-title lupi-game-title`}><small>{subtitle}</small><h2>{title}</h2></div>
 </>;
}
