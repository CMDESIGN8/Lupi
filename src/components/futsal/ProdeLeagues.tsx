import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { prodeService, prodeAdmin, prodeError, type League, type Rank } from "../../services/prodeService";
import { ProdeRanking } from "./ProdeRanking";
import { LeagueRecap } from "./LeagueRecap";
import { ProdeAdmin } from "./ProdeAdmin";
import { OnlineProdeTicket } from "./OnlineProdeTicket";
import "./ProdeLeagues.css";
import "./ProdePolish.css";
import "./ProdeGame.css";
import "./ProdeVisual.css";
import "./ProdeStadium.css";
import "./ProdeEffects.css";
import "./ProdeLeagueCards.css";
const invitation = () => new URLSearchParams(window.location.search).get("liga") || "";
export function ProdeLeagues() {
  const [effects,setEffects]=useState(()=>{try{return localStorage.getItem("lupi-prode-effects")!=="off";}catch{return true;}});
  const [pageHidden,setPageHidden]=useState(false);
  useEffect(()=>{const sync=()=>setPageHidden(document.hidden);sync();document.addEventListener("visibilitychange",sync);return()=>document.removeEventListener("visibilitychange",sync);},[]);
  const toggleEffects=()=>{setEffects(previous=>{const next=!previous;try{localStorage.setItem("lupi-prode-effects",next?"on":"off");}catch{/* preference still works for this visit */}return next;});};
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [revision, setRevision] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<"boleta" | "general" | "ligas" | "admin">(invitation() ? "ligas" : "boleta");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(() => !!invitation());
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [savedNickname, setSavedNickname] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [crest, setCrest] = useState("⚽");
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState(invitation);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Rank[]>([]);
  const [rankingResults,setRankingResults]=useState<{matches?:number;validated?:number}>({});
  const [rankingDate, setRankingDate] = useState("");
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState("");
  const generation = useRef(0);
  const league = leagues.find(x => x.id === selected);
  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(({ data, error }) => { if (live) { setUserId(data.session?.user.id || null); setAuthReady(true); if (error) setNotice(prodeError(error)); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (live) { setUserId(session?.user.id || null); setAuthReady(true); } });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    let live = true; generation.current++; setLeagues([]); setSelected(null); setNickname(""); setSavedNickname(""); setEditingNickname(false); setIdentityLoading(!!userId); setRows([]); setNotice(""); setBusy(false);
    if (userId) Promise.all([prodeService.leagues(), prodeService.nickname(userId)]).then(([l, n]) => { if (live) { setLeagues(l); setNickname(n); setSavedNickname(n); } }).catch(e => { if (live) setNotice(prodeError(e)); }).finally(() => { if (live) setIdentityLoading(false); });
    return () => { live = false; };
  }, [userId]);
  useEffect(() => {
    let live = true; setIsAdmin(false);
    if (userId) prodeAdmin.allowed().then(allowed => { if (live) setIsAdmin(allowed); }).catch(() => {});
    return () => { live = false; };
  }, [userId]);
  useEffect(() => {
    let live = true; setRows([]); setRankingDate(""); setRankingResults({}); setRankError("");
    if (!userId || (tab === "boleta" || tab === "admin") || (tab === "ligas" && !selected)) { setRankLoading(false); return; }
    setRankLoading(true);
    prodeService.rankingBoard(tab === "general" ? null : selected).then(data => { if (live) { setRows(data.rows); setRankingDate(data.round_name || ""); setRankingResults({matches:data.matches_count,validated:data.validated_count}); } }).catch(e => { if (live) setRankError(prodeError(e)); }).finally(() => { if (live) setRankLoading(false); });
    return () => { live = false; };
  }, [userId, tab, selected, busy, revision]);
  const login = () => { sessionStorage.setItem("lupi-prode-return", window.location.pathname + window.location.search); window.location.assign("/"); };
  const action = async (fn: () => Promise<void>) => { const current = generation.current; setBusy(true); setNotice(""); try { await fn(); } catch (e) { if (generation.current === current) setNotice(prodeError(e)); } finally { if (generation.current === current) setBusy(false); } };
  const create = () => action(async () => { const current = generation.current; const id = await prodeService.create(name.trim(), crest); const list = await prodeService.leagues(); if (current !== generation.current) return; setLeagues(list); setSelected(id); setCreating(false); setName(""); setNotice("✓ Liga creada. Compartí la invitación con tu gente."); });
  const join = () => action(async () => { const current = generation.current; const id = await prodeService.join(code.trim()); const list = await prodeService.leagues(); if (current !== generation.current) return; setLeagues(list); setSelected(id); setJoining(false); setCode(""); const url = new URL(window.location.href); url.searchParams.delete("liga"); window.history.replaceState(window.history.state, "", url); setNotice("✓ Ya formás parte de la liga."); });
  const invite = async () => { if (!league) return; const url = new URL("/futsal", window.location.origin); url.searchParams.set("liga", league.invite_code); try { await navigator.clipboard.writeText(url.toString()); setNotice("✓ Enlace copiado. Pegalo en WhatsApp para invitar."); } catch { setNotice(`Copiá el enlace: ${url.toString()}`); } };
  const ranking = <ProdeRanking key={`${tab}-${selected||"general"}`} rows={rows} showRules={tab!=="ligas"} userId={userId} dateName={rankingDate} matchesCount={rankingResults.matches} validatedCount={rankingResults.validated} loading={rankLoading} error={rankError}/>;
  return <div className="lp-leagues lp-pro" data-effects={effects?"on":"off"} data-page-hidden={pageHidden?"true":"false"} data-prode-tab={tab}><div className="lp-banner"><div><p className="lf-eyebrow">TU BOLETA. TUS AMIGOS. TU LIGA.</p><h2>PRODE <span>LUPI</span></h2><p>Un solo pronóstico. Todas tus ligas.</p></div><span className="lp-season">⚽ FLORES FUTSAL</span></div><div className="lp-nav" role="group" aria-label="Secciones del Prode">{([{ id: "boleta", text: "🎯 Mis boletas" }, { id: "general", text: "🏆 General" }, { id: "ligas", text: "👥 Mis ligas" }] as const).map(t => <button type="button" key={t.id} aria-pressed={tab === t.id} onClick={() => { setTab(t.id); setNotice(""); }}>{t.text}</button>)}</div>
    <div className="fx-utilities"><button type="button" className="fx-effects-toggle" title="Respeta la opción de reducir movimiento de tu dispositivo" aria-pressed={effects} onClick={toggleEffects}>{effects?"✦ Efectos activados":"✧ Efectos desactivados"}</button>{isAdmin && <button type="button" className="lp-admin-link" onClick={() => setTab("admin")}>⚙ Administrar fechas y partidos</button>}</div>
    {tab === "admin" && isAdmin && <ProdeAdmin key={userId || "admin"} onChanged={() => setRevision(r => r + 1)}/>}
    {!authReady ? <p className="lf-note">Comprobando sesión…</p> : <><div hidden={tab !== "boleta"}><OnlineProdeTicket key={`${userId}-${revision}`} userId={userId} login={login}/></div>
    {tab !== "boleta" && !userId && <section className="lp-empty"><h3>Tu lugar en la liga te espera</h3><p>Iniciá sesión para crear una miniliga, aceptar invitaciones y competir en el ranking.</p><button className="lp-primary" type="button" onClick={login}>Entrar a Lupi →</button></section>}
    {userId && tab !== "boleta" && tab !== "admin" && <><section className="lp-identity"><span className="lp-identity-avatar" aria-hidden="true">{(savedNickname || "?").slice(0,2).toUpperCase()}</span><div className="lp-identity-copy"><span className="lp-micro">TU IDENTIDAD EN LA CANCHA</span><strong>{identityLoading ? "Cargando…" : savedNickname || "Elegí tu apodo"}</strong><small>{leagues.length} {leagues.length === 1 ? "miniliga" : "miniligas"} · Una boleta para todas</small></div>{savedNickname && !editingNickname && <button type="button" className="lp-text-button" onClick={() => { setNickname(savedNickname); setEditingNickname(true); }}>Editar apodo</button>}</section>
    {!identityLoading && (!savedNickname || editingNickname) && <form className="lp-panel lp-create lp-nickname-form" onSubmit={e => { e.preventDefault(); const current = generation.current; void action(async () => { const clean = nickname.trim(); await prodeService.setNickname(clean); if (current !== generation.current) return; setSavedNickname(clean); setEditingNickname(false); setNotice("✓ Apodo guardado."); }); }}><label htmlFor="prode-nickname">¿Cómo te van a conocer tus rivales?</label><input id="prode-nickname" placeholder="Tu apodo" value={nickname} minLength={2} maxLength={30} required onChange={e => setNickname(e.target.value)}/><div className="lp-form-actions">{savedNickname && <button type="button" disabled={busy} onClick={() => { setNickname(savedNickname); setEditingNickname(false); }}>Cancelar</button>}<button type="submit" className="lp-primary" disabled={busy || nickname.trim().length < 2}>{busy ? "Guardando…" : "Guardar apodo"}</button></div></form>}

    {tab === "general" && <section className="lp-panel"><div className="lp-board-heading"><div><p className="lp-micro">LA COMPETENCIA DE TODOS</p><h3>Clasificación general</h3></div><span className="lp-season">{rankLoading ? "…" : rows.length} PARTICIPANTES</span></div>{ranking}</section>}
    {tab === "ligas" && <><div className="lp-toolbar"><div className="lp-leagues-heading"><span className="lp-leagues-eyebrow">TU GENTE. TU COMPETENCIA.</span><h3>Mis <span>miniligas</span></h3><p>El grupo del club, la familia o tus amigos.</p></div><div className="lp-league-actions"><button type="button" className="lp-join-button" disabled={busy} aria-expanded={joining} aria-controls="lp-join-panel" onClick={() => { setJoining(v => !v); setCreating(false); }}>👥 Unirse a una liga</button><button type="button" className="lp-primary" disabled={busy} aria-expanded={creating} onClick={() => { setCreating(v => !v); setJoining(false); }}>＋ Crear liga</button></div></div>{joining && <div id="lp-join-panel"><form className="lp-panel lp-create" onSubmit={e => { e.preventDefault(); void join(); }}><label htmlFor="prode-code">Ingresá el código de invitación</label><input id="prode-code" autoFocus autoComplete="off" placeholder="Código de la liga" value={code} maxLength={32} onChange={e => setCode(e.target.value)} required/><div className="lp-form-actions"><button type="button" disabled={busy} onClick={() => setJoining(false)}>Cancelar</button><button type="submit" className="lp-primary" disabled={busy || !code.trim()}>{busy ? "Ingresando…" : "Unirme a la liga →"}</button></div></form></div>}
    {creating && <form className="lp-panel lp-create" onSubmit={e => { e.preventDefault(); void create(); }}><h3>Tu grupo, tu torneo</h3><label htmlFor="lp-name">Nombre de la liga</label><input id="lp-name" autoFocus minLength={2} maxLength={40} required value={name} onChange={e => setName(e.target.value)} placeholder="Familias de la Octava"/><fieldset><legend>Elegí un distintivo</legend><div className="lp-crests">{["⚽", "🏆", "🦁", "🔥", "💚", "⭐"].map(icon => <button type="button" key={icon} aria-label={`Distintivo ${icon}`} aria-pressed={crest === icon} onClick={() => setCrest(icon)}>{icon}</button>)}</div></fieldset><div className="lp-form-actions"><button type="button" onClick={() => setCreating(false)}>Cancelar</button><button type="submit" className="lp-primary" disabled={busy || name.trim().length < 2}>{busy ? "Creando…" : "Crear mi liga →"}</button></div></form>}
    {!leagues.length && <p className="lf-note">Todavía no te sumaste a ninguna liga.</p>}<div className="lp-grid">{leagues.map(l => <button className={"lp-league-card" + (selected === l.id ? " selected" : "")} type="button" key={l.id} data-crest={l.crest} aria-pressed={selected === l.id} onClick={() => setSelected(l.id)}><span className="lp-crest">{l.crest}</span><strong>{l.name}</strong><small>{l.owner_id === userId ? "Administrás vos" : "Sos participante"}</small><span className="lp-league-enter">{selected === l.id ? "Viendo tu liga" : "Entrar a la liga"}<span aria-hidden="true">→</span></span></button>)}</div>
    {league && <section className="lp-panel"><header className="lr-league-header"><div className="lr-league-title"><span className="lr-league-icon" aria-hidden="true">{league.crest}</span><div><span className="lr-league-caption">TU MINILIGA</span><h3 className="lr-league-name">{league.name}</h3></div></div><button type="button" className="lr-invite-button" onClick={() => void invite()}>{notice.startsWith("✓ Enlace copiado") ? "✓ Enlace copiado" : "🔗 Invitar a mi liga"}</button></header><LeagueRecap key={`${league.id}-${userId}`} leagueId={league.id} leagueName={league.name} inviteCode={league.invite_code} userId={userId} revision={revision} ranking={ranking}/><button type="button" className="lp-primary" onClick={() => setTab("boleta")}>Ver mis boletas →</button></section>}</>}
    </>}</>}
    <p role="status" className="lf-note">{notice}</p>
  </div>;
}
