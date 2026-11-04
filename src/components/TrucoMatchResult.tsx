import type {ReactNode} from 'react';
import {AvatarFace} from './AvatarFace';
import {useAvatarAppearance} from '../hooks/useAvatarAppearance';
import lupi from '../assets/lupi-truco-avatar.png';
export function TrucoMatchResult({meId,rivalId,myName,rivalName,myScore,rivalScore,won,onExit,onRematch,children}:{meId:string;rivalId?:string;myName:string;rivalName:string;myScore:number;rivalScore:number;won:boolean;onExit:()=>void;onRematch?:()=>void;children?:ReactNode}){
 const mine=useAvatarAppearance(meId);const rival=useAvatarAppearance(rivalId??'');
 return <div className={`tr-result tr-result--${won?'win':'loss'}`} role="dialog" aria-modal="true" aria-label="Resultado del duelo"><section className="tr-result__panel"><small>LUPITRUCO · DUELO FINALIZADO</small><h2>{won?'¡GANASTE!':'ESTA VEZ NO FUE'}</h2><p>{won?'La mesa es tuya. ¡Bien jugado!':`${rivalName} se lleva este duelo. ¡La próxima puede ser tuya!`}</p><div className="tr-result__players"><div><AvatarFace appearance={mine.appearance}/><strong>{myName}</strong><b>{myScore}</b><span>VOS</span></div><em>VS</em><div>{rivalId?<AvatarFace appearance={rival.appearance}/>:<img src={lupi} alt="Lupi"/>}<strong>{rivalName}</strong><b>{rivalScore}</b><span>RIVAL</span></div></div>{children}<div className="tr-result__actions">{onRematch&&<button type="button" onClick={onRematch}>OTRA PARTIDA ↻</button>}<button type="button" onClick={onExit}>VOLVER AL CLUB →</button></div></section></div>;
}
