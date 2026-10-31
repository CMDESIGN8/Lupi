import type { UserCard } from '../types/cards';
import './DeckPlayerCard.css';
const slots:Record<number,string>={1:'🧤',2:'🛡️',3:'⚡',4:'⚡',5:'🎯'};
/** Same owned-card presentation in the deck builder and in the PvP arena. */
export function DeckPlayerCard({card,slot,onClick,onRemove}:{card:UserCard;slot?:number;onClick?:()=>void;onRemove?:()=>void}){
 const data=card.card ?? (card as UserCard & {player?:UserCard['card']}).player;
 const rating=data?.overall_rating ?? 0;
 const background=rating>=85?'linear-gradient(135deg,#9B59B6,#7D3C98)':rating>=75?'linear-gradient(135deg,#FFD700,#DAA520)':rating>=65?'linear-gradient(135deg,#C0C0C0,#A9A9A9)':'linear-gradient(135deg,#CD7F32,#B87333)';
 return <div className={`deck-player-card${onClick?' is-interactive':''}`} style={{background}} role={onClick?'button':undefined} tabIndex={onClick?0:undefined} aria-label={`${data?.name ?? 'Jugador'}, valoración ${rating}, nivel ${card.level}`} onClick={onClick} onKeyDown={onClick?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}}:undefined}>
  <div className="deck-player-card__pattern"/>
  <div className="deck-player-card__head"><span>{slots[slot??card.position??1]??'⚽'}</span><b>{rating}</b></div>
  <div className="deck-player-card__body"><strong title={data?.name}>{data?.name ?? 'Sin nombre'}</strong><span>⭐ NIVEL {card.level}</span></div>
  <div className="deck-player-card__stats">{[['VEL',data?.pace],['DEF',data?.defending],['GOL',data?.finishing]].map(([label,value])=><span key={String(label)}><small>{label}</small><b>{value??0}</b></span>)}</div>
  {onRemove&&<button type="button" className="deck-player-card__remove" onClick={e=>{e.stopPropagation();onRemove();}} aria-label={`Quitar a ${data?.name??'jugador'}`}>✕</button>}
 </div>;
}
