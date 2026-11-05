import type { CSSProperties } from 'react';
import type { Card } from '../utils/trucoEngine';
import { TRUCO_EDITION, TRUCO_BACK, type CardCrop } from './trucoCardEdition';
import './TrucoCard.css';

const SUITS = ['espada','basto','oro','copa'] as const;
function Art({ src, size, box }: {src:string;size:readonly [number,number];box:CardCrop}) {
  const [x,y,w,h] = box;
  const style: CSSProperties = {width:`${size[0]/w*100}%`,height:`${size[1]/h*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`};
  return <span className="tr-edition-art" aria-hidden="true"><img src={src} style={style} alt="" draggable={false}/></span>;
}
export function TrucoCard({card,back,onClick,disabled,played}:{card?:Card|null;back?:boolean;onClick?:()=>void;disabled?:boolean;played?:boolean}) {
  if (!card || back) return <span className={`tr-card tr-card--back tr-card--library${card===null?' is-empty':''}`} aria-hidden="true">{card!==null && <Art {...TRUCO_BACK}/>}</span>;
  const sheet=TRUCO_EDITION[card.num];
  const box=sheet?.boxes[SUITS.indexOf(card.suit)];
  const label=`${card.num} de ${card.suit}`;
  const body=sheet&&box ? <Art src={sheet.src} size={sheet.size} box={box}/> : <span className="tr-edition-fallback">{label}</span>;
  const className=`tr-card tr-card--${card.suit} tr-card--illustrated tr-card--library${played?' is-played':''}`;
  return onClick ? <button type="button" className={className} onClick={onClick} disabled={disabled} aria-label={`Jugar ${label}`}>{body}</button> : <span className={className} role="img" aria-label={label}>{body}</span>;
}
