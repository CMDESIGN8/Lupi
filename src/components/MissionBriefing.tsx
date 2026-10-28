import { useEffect, useId, useRef } from "react";
import type { DailyMission } from "../types/campaignStory";
import "./MissionBriefing.css";
export function MissionBriefing({mission,onStart,onTeam,onClose}:{mission:DailyMission;onStart:()=>void;onTeam:()=>void;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);const title=useId();
 // Native close events can be queued by StrictMode effect cleanup.
 // Only explicit actions and Escape dismiss this controlled dialog.
 useEffect(()=>{const dialog=ref.current;if(!dialog)return;dialog.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{if(dialog.open)dialog.close();document.body.style.overflow=previous;};},[]);
 return <dialog ref={ref} className="mission-briefing" aria-labelledby={title} onCancel={(event)=>{event.preventDefault();onClose();}}>
   <div className="mb-cinema" aria-hidden="true"><i/><i/></div>
   <header><span><i/> MISIÓN DISPONIBLE</span><button type="button" onClick={onClose} aria-label="Cerrar previa de misión">×</button></header>
   <div className="mb-body">
     <div className="mb-emblem" aria-hidden="true"><span>⚽</span><i/></div>
     <span className="mb-eyebrow">LUPI WORLD · LA ARENA TE ESPERA</span>
     <h2 id={title}>{mission.title.replace(/^[^\p{L}\p{N}]+/u,'')}</h2>
     <p className="mb-goal">{mission.requirement===1?'Tu primer desafío empieza en la cancha.':`Tu desafío: completar ${mission.requirement} partidos.`}</p>
     <div className="mb-objective"><span aria-hidden="true">◎</span><div><strong>{mission.requirement===1?'Completá un partido':`Completá ${mission.requirement} partidos`}</strong><small>No necesitás ganar. Jugá hasta el final.</small></div></div>
     <section className="mb-loot" aria-label="Recompensa de la misión"><span className="mb-loot-label">TU RECOMPENSA AL COMPLETARLA</span><div className="mb-loot-items"><div><span aria-hidden="true">⚡</span><strong>+{mission.reward.xp}<small>XP</small></strong></div>{!!mission.reward.coins&&<div><span aria-hidden="true">◉</span><strong>+{mission.reward.coins}<small>MONEDAS</small></strong></div>}{!!mission.reward.points&&<div><span aria-hidden="true">★</span><strong>+{mission.reward.points}<small>PUNTOS</small></strong></div>}</div></section>
     <div className="mb-actions"><button type="button" className="mb-start" onClick={onStart}>Explorar la Arena <span aria-hidden="true">→</span></button><p className="mb-note">Primero conocés el juego. El partido empieza cuando vos decidas.</p><button type="button" className="mb-team" onClick={onTeam}>♟ Revisar mi equipo</button><button type="button" className="mb-later" onClick={onClose}>Ahora no</button></div>
   </div>
 </dialog>;
}
