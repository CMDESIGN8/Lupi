import { useEffect, useState } from "react";
import { getRealMatchResults, type RealMatchResult } from "../../services/prodeService";
import "./RealMatchResults.css";
export function RealMatchResults({ divisionId, onPredict }: { divisionId: string; onPredict: (roundId: string) => void }) {
  const [matches, setMatches] = useState<RealMatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let live = true; let fetching = false;
    const refresh = async (initial = false) => {
      if (fetching) return;
      fetching = true;
      if (initial) { setLoading(true); setError(""); }
      try { const data = await getRealMatchResults(); if (live) { setMatches(data); setNow(Date.now()); setError(""); } }
      catch { if (live) setError("No pudimos actualizar el fixture. Intentá nuevamente."); }
      finally { fetching = false; if (live) setLoading(false); }
    };
    void refresh(true);
    const onFocus = () => { void refresh(); };
    const timer = window.setInterval(() => { if (!document.hidden) { setNow(Date.now()); void refresh(); } }, 30000);
    window.addEventListener("focus", onFocus);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [reload]);
  const filtered = matches.filter(m => Number.parseInt(m.category, 10) === Number(divisionId));
  const rounds = new Map<string, { name: string; matches: RealMatchResult[] }>();
  for (const m of filtered) {
    if (!rounds.has(m.round_id)) rounds.set(m.round_id, { name: m.lupi_prode_rounds?.name || "Fecha", matches: [] });
    rounds.get(m.round_id)!.matches.push(m);
  }
  const finished = filtered.filter(m => m.home_score !== null && m.away_score !== null).length;
  return <div className="lf-real-results">
    <div className="lf-fixture-summary"><span><strong>{filtered.length}</strong> partidos <span aria-hidden="true">·</span> <strong>{finished}</strong> con resultado</span><button type="button" disabled={loading} onClick={() => setReload(n => n + 1)}>↻ Actualizar</button></div>
    {error && <p className="lf-note" role="alert">{error}</p>}
    {loading ? <p className="lf-note" role="status">Cargando fixture…</p> : !filtered.length ? <div className="lf-results-empty"><span aria-hidden="true">⚽</span><h3>{error ? "Fixture no disponible" : "El fixture está en preparación"}</h3><p>{error ? "Tocá Actualizar para volver a intentarlo." : `Los partidos de ${divisionId}.ª división aparecerán cuando se carguen sus fechas y horarios.`}</p></div> : <>
      <p className="lf-note">Horarios de Argentina · Actualización automática cada 30 segundos.</p>
      {[...rounds.entries()].map(([id, round]) => <section className="lf-fixture-round" key={id}><div className="lf-fixture-round-heading"><h3>{round.name}</h3><span>{round.matches.length} {round.matches.length === 1 ? "partido" : "partidos"}</span><button type="button" className="lf-fixture-prode" onClick={() => onPredict(id)}>🎯 {matches.filter(m => m.round_id === id).every(m => Date.parse(m.starts_at) > now && m.home_score === null) ? "Pronosticar fecha" : "Ver boleta"} →</button></div><div className="lf-real-list">{round.matches.map(m => {
        const confirmed = m.home_score !== null && m.away_score !== null;
        const started = Date.parse(m.starts_at) <= now;
        return <article className="lf-real-match" key={m.id}>
          <div className="lf-real-meta"><span>{m.category}</span><span className={"lf-real-final" + (!confirmed ? " lf-fixture-pending" : "")}>{confirmed ? "RESULTADO VALIDADO" : started ? "RESULTADO PENDIENTE" : "PROGRAMADO"}</span></div>
          <div className="lf-real-scoreline"><strong>{m.home}<small>LOCAL</small></strong><div className={"lf-real-score" + (!confirmed ? " lf-fixture-vs" : "")} aria-label={confirmed ? `${m.home_score} a ${m.away_score}` : "Marcador pendiente"}>{confirmed ? <>{m.home_score}<span>–</span>{m.away_score}</> : "VS"}</div><strong>{m.away}<small>VISITANTE</small></strong></div>
          <p className="lf-note">{new Date(m.starts_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} (ARG)</p>
        </article>;
      })}</div></section>)}
    </>}
  </div>;
}
