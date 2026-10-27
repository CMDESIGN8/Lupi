import { useEffect, useState, type ReactNode } from "react";
import { prodeService, prodeError, type LeagueRecapData } from "../../services/prodeService";
import { ShareProdeResult } from "./ShareProdeResult";
import "./LeagueRecap.css";
import "./ProdeRecapPolish.css";
export function LeagueRecap({ leagueId, leagueName, inviteCode, userId, revision, ranking }: { leagueId: string; leagueName: string; inviteCode: string; userId: string; revision: number; ranking: ReactNode }) {
 const [rounds,setRounds]=useState<LeagueRecapData[]>([]);
 const [selected,setSelected]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{let live=true;setLoading(true);setError("");setRounds([]);prodeService.recap(leagueId).then(data=>{if(live){setRounds(data);setSelected(prev=>data.some(r=>r.id===prev)?prev:data[0]?.id||"");}}).catch(e=>{if(live)setError(prodeError(e));}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[leagueId,userId,revision,reload]);
 const round=rounds.find(r=>r.id===selected);
 const participants=round?.rows.filter(r=>r.picks>0)||[];
 const best=Math.max(...participants.map(r=>r.points),0);
 const winners=participants.filter(r=>r.points===best);
 const exacts=Math.max(...participants.map(r=>r.exacts),0);
 const sharps=participants.filter(r=>r.exacts===exacts);
 const me=round?.rows.find(r=>r.user_id===userId);
 const movement=me?me.before_position-me.after_position:0;
 return <section className="lr-recap lr-compact" aria-label="Resumen y clasificación de la miniliga">
  <div className="lr-heading"><div><h4>Tu resultado</h4></div><button type="button" disabled={loading} onClick={()=>setReload(n=>n+1)}>↻ Actualizar</button></div>
  {loading?<p role="status">Cargando resumen…</p>:error?<p role="alert">{error}</p>:!round?<p>El resumen aparece cuando estén validados todos los resultados de una fecha publicada.</p>:<>
   <label className="lr-select"><span className="lr-select-label">Elegir jornada finalizada</span><select value={selected} onChange={e=>setSelected(e.target.value)}>{rounds.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
   {me&&me.picks>0?<div className="lr-you"><span className="lr-finished">Jornada finalizada · {round.name}</span><div className="lr-personal-score"><strong>{me.points}<small>PUNTOS</small></strong><span><b>{me.round_position}.º puesto</b><small>🎯 {me.exacts} {me.exacts===1?"marcador exacto":"marcadores exactos"}</small></span></div><p>{movement>0?`↗ Subiste ${movement} ${movement===1?"puesto":"puestos"}`:movement<0?`↘ Bajaste ${-movement} ${movement===-1?"puesto":"puestos"}`:`→ Seguís ${me.after_position}.º`} {movement!==0?`· Quedaste ${me.after_position}.º`:""}<small>Acumulado de jornadas finalizadas</small></p></div>:<div className="lr-you"><strong>No participaste de esta fecha.</strong><p>Completá tu próxima boleta para competir con tu gente.</p></div>}
   <details className="lr-awards" key={`awards-${round.id}`}><summary>🏆 Ganadores de {round.name}</summary><div className="lr-highlights"><article><span>{winners.length>1?"COMPARTEN EL PRIMER PUESTO":"GANADOR DE LA FECHA"}</span><strong>{winners.length?winners.map(r=>r.nickname).join(" · "):"Sin participantes"}</strong><small>{winners.length?`${best} puntos en esta jornada`:"No hubo pronósticos guardados."}</small></article><article><span>🎯 MÁS MARCADORES EXACTOS</span><strong>{exacts?sharps.map(r=>r.nickname).join(" · "):"Ningún exacto esta fecha"}</strong><small>{exacts?`${exacts} ${exacts===1?"marcador exacto":"marcadores exactos"}`:"La próxima puede ser tuya."}</small></article></div></details>
  </>}
  <div className="lr-board"><h4>Así va tu miniliga</h4>{ranking}</div>
  {round&&me&&me.picks>0&&<details className="lr-share-toggle" key={`share-${round.id}`}><summary>↗ Compartir mi resultado</summary><ShareProdeResult result={{nickname:me.nickname,league:leagueName,inviteCode,round:round.name,points:me.points,position:me.round_position,exacts:me.exacts}}/></details>}
  {round&&<details className="lp-rules"><summary>Cómo se calculan los puntos</summary><p>Marcador exacto: 3 puntos. Ganador o empate: 1 punto. No se acumulan. El podio y la clasificación usan el total de todas las jornadas. La columna “Esta jornada” corresponde a la última publicada, indicada sobre la tabla; “Pendiente” significa que aún no hay resultados confirmados. Los empates comparten puesto. El movimiento compara el acumulado antes y después de esta fecha, contando solo jornadas publicadas y finalizadas, ordenadas por su primer partido. Se usan los miembros actuales y sus puntos históricos, incluso anteriores al ingreso a la liga. Si se corrige un resultado, el resumen se recalcula. Las boletas de otras personas siguen siendo privadas.</p></details>}
 </section>;
}
