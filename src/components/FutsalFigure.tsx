import attackerKick from '../assets/characters/futsal-attacker-kick-anime.webp';
import defenderSlide from '../assets/characters/futsal-defender-slide-anime.webp';
import type { CSSProperties } from 'react';
import keeperAnime from '../assets/characters/futsal-keeper-anime.webp';
import keeperSave from '../assets/characters/futsal-keeper-save-anime.webp';
import defenderAnime from '../assets/characters/futsal-defender-anime.webp';
import attackerAnime from '../assets/characters/futsal-attacker-anime.webp';
import './FutsalFigure.css';
export type FigureKit = 'keeper' | 'rival' | 'mate' | 'ourKeeper';
export type FigureLook = 'neutral' | 'focus' | 'shock';
type Props={action?:'ready'|'kick'|'slide';kit:FigureKit;look?:FigureLook;crop?:'full'|'bust';className?:string;style?:CSSProperties};
export function FutsalFigure({kit,action='ready',look='neutral',crop='full',className='',style}:Props){
 const keeper=kit==='keeper'||kit==='ourKeeper';
 const src=keeper?keeperAnime:kit==='rival'?(action==='kick'?attackerKick:attackerAnime):defenderAnime;
 return <span className={`fig fig--anime ${keeper?'fig--keeper-art':''} fig--${kit} fig--${look} fig--action-${action} ${crop==='bust'?'fig--bust':''} ${className}`} style={style} aria-hidden="true">
  <img className="fig__ready" src={src} alt="" draggable={false}/>
  {kit==='mate'&&action==='slide'&&crop==='full'&&<img className="fig__slide" src={defenderSlide} alt="" draggable={false}/>}
  {keeper&&crop==='full'&&<img className="fig__save" src={keeperSave} alt="" draggable={false}/>}
 </span>;
}

export function FutsalBall({ className = '' }: { className?: string }) {
  return <svg className={`fig-ball ${className}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <circle cx="20" cy="20" r="18" fill="#f5f8f9" stroke="#0f202b" strokeWidth="2.2" />
    <polygon points="20,11 28.5,17 25.5,27 14.5,27 11.5,17" fill="#0f202b" />
    <path d="M20 11V3M28.5 17L36 13.5M25.5 27L31 34M14.5 27L9 34M11.5 17L4 13.5" stroke="#0f202b" strokeWidth="2.2" strokeLinecap="round" />
  </svg>;
}
