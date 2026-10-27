import { useState } from "react";
import type { Division } from "../../data/futsalData";
export function StandingsTable({ division }: { division: Division }) {
  const [expanded, setExpanded] = useState(false);
  if (!division.rows.length) return <div className="lf-results-empty"><h3>Tabla de {division.name} pendiente</h3><p className="lf-note">Todavía no recibimos la tabla de posiciones de esta categoría. Sus partidos se pueden consultar en Resultados.</p></div>;
  return <div className="lf-table-area">
    <div className="lf-table-meta"><span>{division.rows.length} equipos · Datos de captura</span><button type="button" onClick={()=>setExpanded(v=>!v)} aria-pressed={expanded}>{expanded ? "Vista simple" : "Ver estadísticas completas"}</button></div>
    <div className="lf-table-scroll"><table className={`lf-table ${expanded ? "lf-table-expanded" : ""}`}>
      <thead><tr><th scope="col">#</th><th scope="col">Equipo</th><th scope="col">PJ</th><th className="lf-extra" scope="col">PG</th><th className="lf-extra" scope="col">PE</th><th className="lf-extra" scope="col">PP</th><th className="lf-extra" scope="col">GF</th><th className="lf-extra" scope="col">GC</th><th scope="col">DG</th><th scope="col">Pts</th></tr></thead>
      <tbody>{division.rows.map(row => <tr key={row.position} className={row.team === "Flores Club" ? "lf-flores" : ""}><td>{row.position}</td><td>{row.team}</td><td>{row.pj}</td><td className="lf-extra">{row.pg}</td><td className="lf-extra">{row.pe}</td><td className="lf-extra">{row.pp}</td><td className="lf-extra">{row.gf}</td><td className="lf-extra">{row.gc}</td><td>{row.dg > 0 ? `+${row.dg}` : row.dg}</td><td><strong>{row.points}</strong></td></tr>)}</tbody>
    </table></div>
    <p className="lf-note">PJ: jugados · DG: diferencia de gol · Pts: puntos. Flores Club destacado. Seleccioná «Ver estadísticas completas» para PG, PE, PP, GF y GC.</p>
  </div>;
}
