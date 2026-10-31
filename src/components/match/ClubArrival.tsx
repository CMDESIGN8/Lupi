import type { ReactNode, CSSProperties } from 'react';
import clubEntrance from '../../assets/futsal-club-entry.webp';
import './ClubArrival.css';
type Props={mine:string;rival:string;ownFace:ReactNode;rivalFace:ReactNode;ownReady:boolean;rivalReady:boolean;club:string};
export function ClubArrival({mine,rival,ownFace,rivalFace,ownReady,rivalReady,club}:Props){return <div className="club-arrival" style={{'--club-entrance':`url(${clubEntrance})`} as CSSProperties} aria-label={`Llegada al ${club}`}>
 <div className="club-arrival__lights" aria-hidden="true"/>
 <div className="club-arrival__sign"><small>LA PREVIA · FUTSAL</small><strong>{club}</strong><span>Del vestuario a la cancha</span></div>
 <div className="club-arrival__players"><div className={`club-arrival__player${ownReady?' is-ready':''}`}>{ownFace}<div className="club-arrival__identity"><b>{mine}</b><small>{ownReady?'✓ EQUIPO CONFIRMADO':'EN EL VESTUARIO'}</small></div></div><span className="club-arrival__vs" aria-hidden="true">VS</span><div className={`club-arrival__player club-arrival__player--away${rivalReady?' is-ready':''}`}>{rivalFace}<div className="club-arrival__identity"><b>{rival}</b><small>{rivalReady?'✓ EQUIPO CONFIRMADO':'PREPARANDO EQUIPO'}</small></div></div></div>
 <div className="club-arrival__floor"><span>01 · LLEGADA AL CLUB</span><i/><span>02 · ARMÁ TU EQUIPO</span><i/><span>03 · A JUGAR</span></div>
 </div>}
