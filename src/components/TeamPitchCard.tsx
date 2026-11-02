import type {ReactNode} from 'react';
import type {UserCard} from '../types/cards';
import {CardFace} from './SigningWelcome';
import './PitchIllustratedCards.css';
/** Uses the same illustrated card and six real stats as the deck/preview. */
export function TeamPitchCard({card,portrait,onClick}:{card:UserCard;portrait?:ReactNode;onClick?:()=>void}){
 const data=card.card;return <button type="button" className="lp-pitch-player lp-pitch-player--illustrated" onClick={onClick} aria-label={`${data?.name??'Jugador'}, valoración ${data?.overall_rating??0}. Ver seis atributos y cambiar jugador.`}>
 <CardFace item={card} index={0} variant="full" portrait={portrait}/>
 </button>;
}
