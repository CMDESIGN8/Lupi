import { useState } from "react";
import "./MatchResults.css";

type Prediction = { home: string; away: string };
type Ticket = Record<string, Prediction | undefined>;
const matches = [
  { id: "flores-temperley", rival: "TEMPERLEY" },
  { id: "flores-lavallol", rival: "LAVALLOL" },
  { id: "flores-corvalan", rival: "CORVALÁN" },
];
const storageKey = "lupi-futsal-prode-scores-v1";
const validScore = (value: unknown): value is string => typeof value === "string" && /^\d{1,2}$/.test(value);
function readTicket(): Ticket {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return Object.fromEntries(matches.flatMap(({ id }) => validScore(saved?.[id]?.home) && validScore(saved?.[id]?.away) ? [[id, saved[id]]] : []));
  } catch { return {}; }
}
export function MatchResults() {
  const [ticket, setTicket] = useState<Ticket>(readTicket);
  const [saved, setSaved] = useState<Ticket>(readTicket);
  const [notice, setNotice] = useState("");
  const complete = matches.filter(({ id }) => validScore(ticket[id]?.home) && validScore(ticket[id]?.away)).length;
  const dirty = JSON.stringify(ticket) !== JSON.stringify(saved);
  const update = (id: string, side: keyof Prediction, value: string) => {
    if (value !== "" && !validScore(value)) return;
    setTicket(prev => {
      const current = prev[id] ?? { home: "", away: "" };
      return { ...prev, [id]: { ...current, [side]: value } };
    });
    setNotice("");
  };
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(ticket)); setSaved(ticket); setNotice("✓ ¡Prode guardado! Podés editarlo mientras los partidos sigan abiertos."); }
    catch { setNotice("No pudimos guardar tu prode en este navegador. Tus elecciones siguen visibles en esta pantalla."); }
  };
  return <div className="lf-prode">
    <header className="lf-prode-heading"><div><p className="lf-eyebrow">EL PARTIDO TAMBIÉN SE JUEGA ACÁ</p><h3>PRODE <span>FLORES</span></h3><p>Jugátela con el resultado. ¿Cómo salen los próximos tres?</p></div><span className="lf-prode-badge">🎯 {complete}/3 completos</span></header>
    <div className="lf-prode-info"><span>3 PARTIDOS · MARCADOR EXACTO</span><span>Fecha, horario y categoría por confirmar</span></div>
    <div className="lf-prode-ticket">
      <div className="lf-prode-ticket-head"><strong>TU BOLETA</strong><span>LOCAL / EMPATE / VISITANTE</span></div>
      {matches.map((match, index) => {
        const prediction = ticket[match.id] || { home: "", away: "" };
        const filled = validScore(prediction.home) && validScore(prediction.away);
        const outcome = filled ? Number(prediction.home) > Number(prediction.away) ? "L" : Number(prediction.home) === Number(prediction.away) ? "E" : "V" : null;
        const isSaved = filled && saved[match.id]?.home === prediction.home && saved[match.id]?.away === prediction.away;
        return <article className={"lf-prode-match" + (filled ? " is-complete" : "")} key={match.id}>
          <div className="lf-prode-match-meta"><span>PARTIDO 0{index + 1}</span><span>{isSaved ? "✓ GUARDADO" : filled ? "SIN GUARDAR" : "POR COMPLETAR"}</span></div>
          <div className="lf-prode-scoreline"><strong className="lf-prode-team">FLORES CLUB<small>LOCAL</small></strong><div className="lf-prode-score-inputs">
            <input type="text" inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} value={prediction.home} placeholder="–" aria-label={`Goles de Flores Club contra ${match.rival}`} onChange={e => update(match.id, "home", e.target.value)} />
            <span aria-hidden="true">:</span>
            <input type="text" inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} value={prediction.away} placeholder="–" aria-label={`Goles de ${match.rival} contra Flores Club`} onChange={e => update(match.id, "away", e.target.value)} />
          </div><strong className="lf-prode-team lf-prode-team-away">{match.rival}<small>VISITANTE</small></strong></div>
          <div className="lf-prode-outcomes" aria-label="Resultado del marcador ingresado">{[{ code: "L", text: "Gana Flores" }, { code: "E", text: "Empate" }, { code: "V", text: `Gana ${match.rival}` }].map(item => <span className={outcome === item.code ? "selected" : ""} key={item.code}><b>{item.code}</b>{item.text}</span>)}</div>
        </article>;
      })}
      <div className="lf-prode-ticket-footer"><span>✦ MI PÁLPITO · MI CLUB</span><span>{complete} DE 3</span></div>
    </div>
    <div className="lf-prode-submit"><p>Completá los goles de ambos equipos en los tres partidos.</p><button type="button" disabled={complete !== 3 || !dirty} onClick={save}>{complete === 3 && !dirty ? "✓ PRODE GUARDADO" : "GUARDAR MI PRODE →"}</button><p className="lf-prode-notice" role="status">{notice || (dirty ? "Tenés cambios sin guardar." : "")}</p></div>
    <p className="lf-note">Tus pronósticos se guardan solo en este navegador. Todavía no hay puntajes ni ranking.</p>
    <div className="lf-results-pending"><h3>Resultados confirmados</h3><p className="lf-note">Todavía no recibimos los marcadores de la última fecha. Los publicaremos cuando estén confirmados.</p></div>
  </div>;
}
