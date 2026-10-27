import { closingClock, closingDate } from "./prodePresentation";
export function ProdeClosing({ deadline, now, saved = false }: { deadline: number; now: number; saved?: boolean }) {
 const clock=closingClock(deadline,now);
 const blocks=[...(clock.days>0?[{value:clock.days,label:"DÍAS"}]:[]),{value:clock.hours,label:"HORAS"},{value:clock.minutes,label:"MIN"},{value:clock.seconds,label:"SEG"}];
 return <section className={`pc-closing pc-${clock.tone}`} aria-label="Cierre de pronósticos"><span className="pc-title">⏱ {clock.tone==="closed"?"PRONÓSTICOS CERRADOS":saved?"PODÉS EDITAR HASTA EL CIERRE":clock.tone==="urgent"?"ÚLTIMOS MINUTOS PARA PRONOSTICAR":clock.tone==="soon"?"EL CIERRE SE ACERCA":"CIERRE DE PRONÓSTICOS"}</span>{clock.tone!=="closed"&&<div className="pc-digits" role="timer" aria-live="off" aria-label={`${clock.days} días, ${clock.hours} horas, ${clock.minutes} minutos y ${clock.seconds} segundos para el cierre`}>{blocks.map(b=><span key={b.label} aria-hidden="true"><strong>{String(b.value).padStart(2,"0")}</strong><small>{b.label}</small></span>)}</div>}<time dateTime={new Date(deadline).toISOString()}>{closingDate(deadline,now)}</time></section>;
}
