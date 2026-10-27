import { useEffect, useState } from "react";
import { getFutsalSnapshot } from "../services/futsalService";
import { StandingsTable } from "../components/futsal/StandingsTable";
import { RealMatchResults } from "../components/futsal/RealMatchResults";
import { ProdeLeagues } from "../components/futsal/ProdeLeagues";
import { FloresVideos } from "../components/futsal/FloresVideos";
import floresCrest from "../assets/flores-club.png";
import "./FutsalHub.css";

type Section = "tablas" | "resultados" | "videos" | "prode";
function readSection(): Section {
  const params = new URLSearchParams(window.location.search);
  if (params.get("liga")) return "prode";
  const section = params.get("section");
  return section === "resultados" || section === "videos" || section === "prode" ? section : "tablas";
}
export function FutsalHub() {
  const { divisions, snapshotLabel } = getFutsalSnapshot();
  const [divisionId, setDivisionId] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("division");
    return divisions.some(d => d.id === id) ? id! : "8";
  });
  const [section, setSection] = useState<Section>(readSection);
  useEffect(() => {
    const sync = () => {
      setSection(readSection());
      const id = new URLSearchParams(window.location.search).get("division");
      setDivisionId(divisions.some(d => d.id === id) ? id! : "8");
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [divisions]);
  const chooseSection = (next: Section, roundId?: string) => {
    setSection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("section", next);
    if (roundId) url.searchParams.set("boleta", roundId);
    else url.searchParams.delete("boleta");
    if (next !== "prode") url.searchParams.delete("liga");
    window.history.pushState(window.history.state, "", url);
  };
  const division = divisions.find(d => d.id === divisionId) ?? divisions[0];
  const chooseDivision = (id: string) => {
    setDivisionId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("division", id);
    window.history.replaceState(window.history.state, "", url.toString());
  };
  const categorySelector = <>
<label className="lf-select-label" htmlFor="lf-division">Seleccionar categoría</label>
      <select id="lf-division" className="lf-division-select" value={divisionId} onChange={e=>chooseDivision(e.target.value)}>{divisions.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <div className="lf-divisions" role="group" aria-label="Categoría">{divisions.map(d => <button type="button" key={d.id} className={division.id===d.id?"active":""} onClick={()=>chooseDivision(d.id)}>{d.name}</button>)}</div>
  </>;
  const share = async () => {
    const url = `${window.location.origin}/futsal?division=${divisionId}`;
    const message = `Lupi Futsal · ${division.name}: mirá la tabla de Argenliga B ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Lupi Futsal", text: message, url }); } catch { /* Usuario canceló */ }
    } else window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  return <main className="lf-page"><div className="lf-shell">
    <header className="lf-header"><a href="/" className="lf-brand">LUPI <span>FUTSAL</span></a><a href="/" className="lf-home">← Inicio Lupi</a></header>
    {section !== "prode" && <section className="lf-hero"><div className="lf-hero-copy"><p className="lf-eyebrow">ARGENLIGA B · FUTSAL REAL</p><h1>La liga, en tus manos.</h1><p>Primera y divisiones de 3.ª a 8.ª · Tablas, fixture, videos y Prode.</p></div><img src={floresCrest} alt="Escudo de Flores Club, comunidad con videos disponibles" /></section>}
    <nav className="lf-tabs" aria-label="Secciones">{(["tablas","resultados","videos","prode"] as const).map(s => <button type="button" key={s} className={section===s?"active":""} aria-current={section===s?"page":undefined} onClick={()=>chooseSection(s)}>{s==="tablas"?"🏆 Tablas":s==="resultados"?"⚽ Resultados":s==="videos"?"▶ Videos":"🎯 Prode"}</button>)}</nav>
    {section === "tablas" && <section className="lf-card"><div className="lf-toolbar"><div><p className="lf-eyebrow">TABLA DE POSICIONES</p><h2>{division.name}</h2></div><button type="button" className="lf-share" onClick={()=>void share()}>↗ Compartir</button></div>
      {categorySelector}
      <StandingsTable division={division}/><p className="lf-source">Fuente: {division.sourceLabel || snapshotLabel}. Datos sujetos a rectificaciones.</p>
    </section>}
    {section === "resultados" && <section className="lf-card"><p className="lf-eyebrow">PARTIDOS REALES · FIXTURE Y RESULTADOS</p><h2>Fixture y resultados · {division.name}</h2>{categorySelector}<RealMatchResults divisionId={divisionId} onPredict={id => chooseSection("prode", id)}/></section>}
    {section === "prode" && <section className="lf-card lf-game-container"><ProdeLeagues/></section>}
    {section === "videos" && <section className="lf-card"><h2>{divisionId === "8" ? "Videos de Flores Futsal · 8.ª" : "Videos de la comunidad Lupi"}</h2>{categorySelector}<FloresVideos key={divisionId} divisionId={divisionId}/></section>}
    <footer className="lf-footer">Lupi Futsal · Proyecto comunitario independiente, no oficial. Tablas de captura · consultá la fuente y la fecha de actualización de cada categoría.</footer>
  </div></main>;
}
