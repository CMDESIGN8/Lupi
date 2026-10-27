import { useEffect, useState } from "react";
import { prodeService, type ProdeRound, type Ticket } from "../../services/prodeService";
import { nextPlayable, kickoff, isFloresHomeRound } from "../futsal/prodePresentation";

import { ProdeTeam } from "../futsal/ProdeTeam";
import { ProdeClosing } from "../futsal/ProdeClosing";
import "./HomeFutsalStadium.css";

export function HomeFutsal({userId}:{userId:string}) {
 const [data,setData]=useState<{rounds:ProdeRound[];picks:Ticket}|null>(null);
 const [error,setError]=useState(false);
 const [now,setNow]=useState(Date.now());
 const [retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;setData(null);setError(false);Promise.all([prodeService.rounds(),prodeService.picks(userId)]).then(([rounds,picks])=>{if(live)setData({rounds,picks});}).catch(()=>{if(live)setError(true);});return()=>{live=false;};},[userId,retry]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
 const open=data?nextPlayable(data.rounds,now):undefined;
 const latest=data?.rounds.filter(r=>r.published&&r.matches.length).sort((a,b)=>kickoff(b)-kickoff(a))[0];
 const round=open||latest;
 const match=round?.matches[0];
 const saved=!!open&&open.matches.every(m=>data?.picks[m.id]);
 const results=round?.matches.filter(m=>m.home_score!==null&&m.away_score!==null).length||0;
 const href=open?`/futsal?section=prode&boleta=${encodeURIComponent(open.id)}`:'/futsal?section=resultados';
 const count=open?.matches.filter(m=>data?.picks[m.id]).length||0;
 const home=!!round&&isFloresHomeRound(round);
 return <section className={`home-futsal home-stadium${home?" home-stadium-local":""}`} aria-labelledby="home-futsal-title">
 <div className="home-section-heading"><span className="home-kicker">{open?saved?"● TU BOLETA ESTÁ GUARDADA":"● TU PRÓXIMO DESAFÍO":"● FLORES FUTSAL"}</span><a href="/futsal">Ver Futsal ↗</a></div>
 {!data&&!error?<><h2 id="home-futsal-title">Flores Futsal</h2><p role="status">Buscando la próxima fecha…</p></>:error?<><h2 id="home-futsal-title">Flores Futsal</h2><p role="status">No pudimos cargar la fecha.</p><button type="button" onClick={()=>setRetry(v=>v+1)}>Reintentar</button></>:round&&match?<>
 <div className="hs-title"><span>{open?'PREVIA':'LA JORNADA'}{home?' · FLORES JUEGA EN CASA':''}</span><h2 id="home-futsal-title">{round.name}</h2><small>{round.matches.length} categorías</small></div>
 <div className="hs-duel"><div><small>LOCAL</small><ProdeTeam name={match.home}/></div><b className="hs-vs">VS</b><div><small>VISITANTE</small><ProdeTeam name={match.away}/></div></div>
 <div className="hs-console">{open?<ProdeClosing deadline={kickoff(open)} now={now} saved={saved}/>:<div className="hs-results"><span>RESULTADOS DE LA FECHA</span><strong>{results} / {round.matches.length}</strong><p>{results?`${results} de ${round.matches.length} resultados disponibles`:'La fecha ya cerró. Esperamos los resultados.'}</p></div>}
 <div className="hs-play">{open&&<><div className="hs-progress-label"><strong>{count}/{open.matches.length} guardados</strong><span>{saved?'✓ Tu boleta está guardada':'Tu boleta está pendiente'}</span></div><div className="hs-progress" role="progressbar" aria-label="Pronósticos guardados" aria-valuemin={0} aria-valuemax={open.matches.length} aria-valuenow={count}><span style={{width:`${count/open.matches.length*100}%`}}/></div></>}
 <a className="home-main-button gold" href={href}>{open?saved?'Revisar mi pronóstico →':'Completar mi pronóstico →':'Ver resultados →'}</a><small>Una boleta. Todas tus miniligas.</small></div></div>
 </>:<><h2 id="home-futsal-title">Flores Futsal</h2><p>Tablas, resultados y pronósticos de tu club en un solo lugar.</p></>}
 <div className="home-futsal-links"><a href="/futsal?section=tablas">Tablas</a><a href="/futsal?section=resultados">Resultados</a><a href="/futsal?section=prode">Prode y miniligas</a></div></section>;
}
