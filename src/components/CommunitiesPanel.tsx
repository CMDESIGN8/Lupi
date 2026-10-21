import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import "./CommunitiesPanel.css";
import floresCrest from "../assets/flores-club.png";
import iconMiembros from "../assets/icon_miembros.png";
import iconRanking from "../assets/icon_ranking.png";
import iconEscudoBoton from "../assets/icon_escudo_boton.png";
import type { ChallengeGame } from "../hooks/useLobbyChallenges";

type Community = { id: string; slug: string; name: string; description: string | null; avatar_url: string | null };
type Club = { id: string; name: string; city: string | null; discipline: string; community_id: string | null };
type Member = { user_id: string; joined_at: string };
type MemberProfile = { id: string; username: string | null; level: number | null; points: number | null };
type Request = { club_id: string; user_id: string };
type WeeklyChallenge = { goal: number; completed: number; total_completed: number; starts_at: string; ends_at: string; finished: boolean; reward_status: string };
type WeeklyRank = { user_id: string; username: string | null; level: number | null; weekly_points: number; missions_count: number };
type View = "mine" | "explore" | "clubs" | "community" | "inside";

export function CommunitiesPanel({ userId, onClose, onMembershipChange, onlineMemberIds = [], challengePendingToId, onChallengeMember }: {
  userId: string;
  onClose: () => void;
  onMembershipChange?: () => void;
  onlineMemberIds?: string[];
  challengePendingToId?: string | null;
  onChallengeMember?: (member: { userId: string; username: string }, game: ChallengeGame, communityId: string) => boolean;
}) {
  const [view, setView] = useState<View>("mine");
  const [clubEntering, setClubEntering] = useState(false);
  const entryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (entryTimer.current) clearTimeout(entryTimer.current); }, []);
  const enterClub = (flores: boolean) => {
    if (entryTimer.current) clearTimeout(entryTimer.current);
    if (!flores || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      setInsideTab("inicio"); setView("inside"); return;
    }
    setClubEntering(true);
    entryTimer.current = setTimeout(() => {
      setInsideTab("inicio"); setView("inside"); setClubEntering(false);
      entryTimer.current = null;
    }, 720);
  };

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState<Community | null>(null);
  const [myMemberships, setMyMemberships] = useState<string[]>([]);
  const [insideTab, setInsideTab] = useState<"inicio" | "miembros" | "ranking" | "desafios">("inicio");
  const [members, setMembers] = useState<Member[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [memberError, setMemberError] = useState("");
  const [challengeTarget, setChallengeTarget] = useState<{ userId: string; username: string } | null>(null);
  const [weekly, setWeekly] = useState<WeeklyChallenge | null>(null);
  const [weeklyRanking, setWeeklyRanking] = useState<WeeklyRank[]>([]);
  const [weeklyError, setWeeklyError] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [pvpRanking, setPvpRanking] = useState<{ user_id: string; username: string; wins: number; losses: number; draws: number; played: number; competitive_points: number }[]>([]);
  const [pvpHistory, setPvpHistory] = useState<{ match_id: string; host_name: string; guest_name: string; host_wins: number; guest_wins: number; finished_at: string }[]>([]);
  const [pvpError, setPvpError] = useState("");
  const [pvpLoading, setPvpLoading] = useState(false);
  const [rankingMode, setRankingMode] = useState<"pvp" | "missions">("pvp");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    const [c, clubsResult, req, my] = await Promise.all([
      supabase.from("communities").select("id,slug,name,description,avatar_url").order("name"),
      supabase.from("sports_clubs").select("id,name,city,discipline,community_id").order("name"),
      supabase.from("community_requests").select("club_id,user_id"),
      supabase.from("community_members").select("community_id").eq("user_id", userId)
    ]);
    if (!my.error) setMyMemberships((my.data ?? []).map(m => m.community_id));
    if (c.error) setError("No se pudieron cargar las comunidades. Revisá la migración SQL.");
    else setCommunities((c.data ?? []) as Community[]);
    // Las tablas de catálogo se agregan con la migración de fase 2.
    if (clubsResult.error || req.error) setError(prev => prev || "El catálogo de clubes todavía no está habilitado. Ejecutá la migración de fase 2.");
    else { setClubs((clubsResult.data ?? []) as Club[]); setRequests((req.data ?? []) as Request[]); }
    setLoading(false);
  }, [userId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const loadMemberProfiles = async (list: Member[]) => {
    setMemberError("");
    if (!list.length) { setMemberProfiles([]); return; }
    const { data, error: profileError } = await supabase.from("profiles")
      .select("id,username,level,points").in("id", list.map(m => m.user_id));
    if (profileError) { setMemberError("No se pudieron cargar los perfiles. Revisá permisos de lectura de profiles."); setMemberProfiles([]); }
    else setMemberProfiles((data ?? []) as MemberProfile[]);
  };
  const openCommunity = async (community: Community) => {
    setSelected(community); setView("community"); setError(""); setNotice("");
    const result = await supabase.from("community_members").select("user_id,joined_at").eq("community_id", community.id);
    if (result.error) setError("No se pudieron consultar los miembros.");
    else { const list = (result.data ?? []) as Member[]; setMembers(list); await loadMemberProfiles(list); }
  };
  const loadWeekly = useCallback(async (communityId: string) => {
    setWeeklyLoading(true); setWeeklyError("");
    const [challenge, ranking] = await Promise.all([
      supabase.rpc("get_community_weekly_challenge", { p_community_id: communityId }),
      supabase.rpc("get_community_weekly_ranking", { p_community_id: communityId })
    ]);
    if (challenge.error || ranking.error) {
      setWeeklyError("Falta ejecutar sql/003_community_weekly.sql o no se pudieron consultar las misiones.");
      setWeekly(null); setWeeklyRanking([]);
    } else {
      setWeekly(challenge.data as WeeklyChallenge);
      setWeeklyRanking((ranking.data ?? []) as WeeklyRank[]);
    }
    setWeeklyLoading(false);
  }, []);
  useEffect(() => {
    if (view === "inside" && selected && (insideTab === "desafios" || insideTab === "ranking")) {
      void loadWeekly(selected.id);
    }
  }, [view, selected?.id, insideTab, loadWeekly]);
  const loadPvp = useCallback(async (communityId: string) => {
    setPvpLoading(true); setPvpError("");
    const [ranking, history] = await Promise.all([
      supabase.rpc("get_community_pvp_ranking", { p_community_id: communityId }),
      supabase.rpc("get_community_pvp_history", { p_community_id: communityId }),
    ]);
    if (ranking.error || history.error) {
      setPvpError("No se pudo cargar el ranking PvP. Ejecutá la migración 007 en Supabase.");
    } else {
      setPvpRanking(ranking.data ?? []);
      setPvpHistory(history.data ?? []);
    }
    setPvpLoading(false);
  }, []);
  useEffect(() => {
    if (view === "inside" && selected && insideTab === "ranking" && rankingMode === "pvp") {
      void loadPvp(selected.id);
    }
  }, [view, selected?.id, insideTab, rankingMode, loadPvp]);
  const joined = !!selected && myMemberships.includes(selected.id);
  const join = async () => {
    if (!selected || busy || joined) return;
    setBusy(selected.id); setError("");
    const result = await supabase.from("community_members").insert({ community_id: selected.id, user_id: userId });
    if (result.error && result.error.code !== "23505") setError("No pudimos registrar tu ingreso: " + result.error.message);
    else { setMembers(prev => prev.some(m => m.user_id === userId) ? prev : [...prev, { user_id: userId, joined_at: new Date().toISOString() }]); setMyMemberships(prev => prev.includes(selected.id) ? prev : [...prev, selected.id]); onMembershipChange?.(); setNotice("¡Ya sos parte de la comunidad!"); void loadMemberProfiles([...members, { user_id: userId, joined_at: new Date().toISOString() }]); }
    setBusy(null);
  };
  const requestClub = async (club: Club) => {
    if (busy || club.community_id || requests.some(r => r.club_id === club.id && r.user_id === userId)) return;
    setBusy(club.id); setError(""); setNotice("");
    const result = await supabase.from("community_requests").insert({ club_id: club.id, user_id: userId });
    if (result.error && result.error.code !== "23505") setError("No pudimos registrar tu solicitud: " + result.error.message);
    else { setRequests(prev => prev.some(r => r.club_id === club.id && r.user_id === userId) ? prev : [...prev, { club_id: club.id, user_id: userId }]); setNotice("Solicitud registrada. ¡Gracias por impulsar tu comunidad!"); }
    setBusy(null);
  };
  const crestFor = (community: Community) => community.avatar_url || (community.slug === "flores-futsal" ? floresCrest : null);
  const profileFor = (id: string) => memberProfiles.find(p => p.id === id);
  const onlineMembers = new Set(onlineMemberIds);
  const openDuelPicker = (opponentId: string, username: string) => {
    if (!selected || !onChallengeMember || challengePendingToId || !onlineMembers.has(opponentId)) {
      setMemberError("El rival debe estar conectado al lobby y no debe haber otra invitación pendiente.");
      return;
    }
    setMemberError("");
    setChallengeTarget({ userId: opponentId, username });
    setInsideTab("miembros");
  };
  const myPvpPosition = pvpRanking.findIndex(player => player.user_id === userId);
  const myPvpEntry = myPvpPosition >= 0 ? pvpRanking[myPvpPosition] : null;
  const filteredClubs = clubs.filter(c => `${c.name} ${c.city ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const isFlores = Boolean(selected && /flores/i.test(`${selected.slug} ${selected.name}`));
  return createPortal(<div className={`lupi-community-overlay ${isFlores ? "lupi-community--flores" : ""}`} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    {clubEntering && <div className="lupi-club-entry-transition" role="status" aria-live="polite"><div className="lupi-club-entry-transition__light"/><span>✦ ENTRANDO A FLORES FUTSAL ✦</span></div>}
    <section className={`lupi-community-panel ${isFlores && (view === "community" || (view === "inside" && insideTab === "inicio")) ? "lupi-community-panel--club" : ""}`} role="dialog" aria-modal="true" aria-label="Comunidades">
      <header><div><small>✦ LUPI WORLD</small><h2>{view === "inside" ? (isFlores ? "FLORES FUTSAL" : "MI COMUNIDAD") : view === "community" ? selected?.name : "COMUNIDADES"}</h2></div><button type="button" onClick={onClose} aria-label="Cerrar comunidades">✕</button></header>
      {view === "inside" && selected ? <>
        <button className="lupi-community-back" type="button" onClick={() => setView("mine")}>← Volver a comunidades</button>
        <div className="lupi-community-inside-head"><span className="lupi-community-inside-crest">{crestFor(selected) ? <img src={crestFor(selected)!} alt={`Escudo de ${selected.name}`} /> : "🏟️"}</span><div><strong>{selected.name}</strong><small>Tu espacio en Lupi World · Comunidad independiente</small></div></div>
        <nav className="lupi-community-tabs lupi-community-inner-tabs" aria-label="Dentro de la comunidad">
          {(["inicio", "miembros", "ranking", "desafios"] as const).map(tab => <button type="button" key={tab} className={insideTab === tab ? "active" : ""} onClick={() => { setChallengeTarget(null); setInsideTab(tab); }}>{tab === "desafios" ? "Desafíos" : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}
        </nav>
        <div className="lupi-community-inside-body" key={`${selected.id}-${insideTab}`}>
          {insideTab === "inicio" && <><div className="lupi-club-welcome">{isFlores && <div className="lupi-club-kicker">✦ TU CLUB · TU COMUNIDAD ✦</div>}{isFlores && <img src={crestFor(selected) || floresCrest} alt="" />}<h3>{isFlores ? "BIENVENIDO AL CLUB" : `Bienvenido a ${selected.name}`}</h3><p>{isFlores ? "La cancha está lista. Conectate con otros miembros, competí en el ranking y aceptá nuevos desafíos." : "Ya formás parte de esta comunidad. Acá vas a encontrar novedades, desafíos y la actividad de sus miembros."}</p><div className="lupi-community-info-tile">👥 {members.length} {members.length === 1 ? "miembro" : "miembros"} en la comunidad</div>{isFlores && <div className="lupi-club-actions"><button type="button" onClick={() => setInsideTab("ranking")}>🏆 VER CLASIFICACIÓN</button><button type="button" onClick={() => setInsideTab("desafios")}>⚔ IR A DESAFÍOS</button></div>}</div></>}
          {insideTab === "miembros" && !challengeTarget && <><h3>Miembros</h3><p>{members.length} {members.length === 1 ? "jugador forma" : "jugadores forman"} parte de la comunidad.</p>{memberError && <p role="alert" className="lupi-community-error">{memberError}</p>}{members.map(m => { const profile = profileFor(m.user_id); return <div className="lupi-community-member" key={m.user_id}><div className="lupi-community-member-avatar">{(profile?.username || "J").slice(0, 1).toUpperCase()}</div><div><strong>{profile?.username || "Jugador"}{m.user_id === userId ? " · Vos" : ""}</strong><small>Nivel {profile?.level ?? "—"} · {profile?.points ?? "—"} XP/puntos</small><small>{m.user_id === userId ? "Tu perfil" : onlineMembers.has(m.user_id) ? "● Conectado" : "○ Desconectado"}</small></div>{m.user_id !== userId && <button type="button" className="lupi-community-member-challenge" disabled={!onlineMembers.has(m.user_id) || !onChallengeMember || !!challengePendingToId} title={!onlineMembers.has(m.user_id) ? "El jugador debe estar conectado al lobby" : "Elegir modalidad de desafío"} onClick={() => {
            if (!profile?.username || !onChallengeMember) { setMemberError("No se pudo identificar al jugador."); return; }
            openDuelPicker(m.user_id, profile.username);
          }}>{challengePendingToId === m.user_id ? "Pendiente" : onlineMembers.has(m.user_id) ? "⚔ Desafiar" : "Sin conexión"}</button>}</div>; })}</>}
          {insideTab === "miembros" && challengeTarget && (
            <div className="lupi-community-duel-picker" role="group" aria-label="Elegir modalidad de desafío">
              <div className="lupi-community-duel-picker-head">
                <strong>⚔ ELEGÍ TU DESAFÍO <small>Contra {challengeTarget.username}</small></strong>
                <button type="button" onClick={() => setChallengeTarget(null)} aria-label="Cancelar desafío">✕</button>
              </div>
              <p>Elegí una modalidad para competir en una misma partida con tu rival.</p>
              {memberError && <p role="alert" className="lupi-community-error">{memberError}</p>}
              <button type="button" className="lupi-community-duel-option" disabled={!!challengePendingToId} onClick={() => {
                const sent = onChallengeMember?.(challengeTarget, "rps", selected.id);
                if (sent) { setChallengeTarget(null); onClose(); }
                else setMemberError("No se pudo enviar el desafío. Verificá que ambos estén en el lobby.");
              }}>✊ Piedra, papel o tijera <small>Duelo PvP sincronizado · Mejor de 3 →</small></button>
              <div className="lupi-community-duel-locked">⚽ Futsal PvP <small>En desarrollo: el partido actual es contra la máquina.</small></div>
              <div className="lupi-community-duel-locked">🧠 Preguntados <small>Próximamente</small></div>
              <div className="lupi-community-duel-locked">🃏 Truco <small>Próximamente</small></div>
            </div>
          )}
          {insideTab === "ranking" && <>
            <div className="lupi-arena-heading"><span className="lupi-arena-eyebrow">LUPI WORLD / ARENA COMPETITIVA</span><h3>Ranking de {selected.name}</h3><span className="lupi-arena-season">TEMPORADA SEMANAL</span></div>
            <div className="lupi-community-ranking-switch">
              <button type="button" className={rankingMode === "pvp" ? "active" : ""} onClick={() => setRankingMode("pvp")}>⚔ Competitivo</button>
              <button type="button" className={rankingMode === "missions" ? "active" : ""} onClick={() => setRankingMode("missions")}>★ Misiones</button>
            </div>
            {rankingMode === "pvp" ? <>
              <p>Clasificación semanal · Victoria 3 pts · Empate 1 pt · Derrota 0 pts.</p>
              {!pvpLoading && !pvpError && myPvpEntry && <div className="lupi-community-my-rank"><span>TU POSICIÓN <strong>#{myPvpPosition + 1}</strong></span><span>{myPvpEntry.competitive_points} pts · {myPvpEntry.played} PJ</span></div>}
              {!pvpLoading && !pvpError && pvpRanking.length === 0 && <p className="lupi-community-muted">Todavía no hay partidas competitivas registradas esta semana.</p>}
              {pvpLoading && <p>Cargando enfrentamientos…</p>}
              {pvpError && <p role="alert" className="lupi-community-error">{pvpError}</p>}
              {!pvpError && !pvpLoading && pvpRanking.length > 0 && <div className="lupi-community-podium" aria-label="Podio competitivo">
                {[1, 0, 2].filter(index => index < pvpRanking.length).map(index => { const player = pvpRanking[index]; return <div className={`lupi-community-podium-card place-${index + 1}${player.user_id === userId ? " is-me" : ""}`} key={player.user_id}>
                  <span className="lupi-community-podium-place">#{index + 1}</span><span className="lupi-community-podium-medal" aria-hidden="true">{["🥇", "🥈", "🥉"][index]}</span>
                  <strong>{player.username || "Jugador"}{player.user_id === userId ? " · Vos" : ""}</strong>
                  <b>{player.competitive_points} pts</b>
                  <small>{player.wins} G · {player.losses} P · {player.played} PJ</small>
                </div>})}
              </div>}
              {!pvpError && !pvpLoading && <div className="lupi-community-ranking-list">
                {pvpRanking.map((player, index) => <div className={`lupi-community-member lupi-community-ranking-row${player.user_id === userId ? " is-me" : ""}`} key={player.user_id}>
                  <b className="lupi-community-rank">#{index + 1}</b><div><strong>{player.username || "Jugador"}{player.user_id === userId ? " · Vos" : ""}</strong>
                  <small>{player.wins} G · {player.losses} P · {player.draws} E · {player.played} partidos</small></div>
                  <b>{player.competitive_points} pts</b>
                </div>)}
              </div>}
              {!pvpError && !pvpLoading && <section className="lupi-community-rivals" aria-label="Rivales disponibles">
                <h3>⚔ Rivales disponibles</h3>
                <p className="lupi-community-muted">Revancha rápida contra miembros conectados.</p>
                {members.filter(m => m.user_id !== userId && onlineMembers.has(m.user_id)).length === 0 ?
                  <p className="lupi-community-muted">No hay otros miembros conectados ahora.</p> :
                  members.filter(m => m.user_id !== userId && onlineMembers.has(m.user_id)).map(m => {
                    const profile = profileFor(m.user_id);
                    return <div className="lupi-community-rival-row" key={m.user_id}>
                      <span>● {profile?.username || "Jugador conectado"}</span>
                      <button type="button" disabled={!profile?.username || !onChallengeMember || !!challengePendingToId} onClick={() => openDuelPicker(m.user_id, profile!.username!)}>⚔ Desafiar</button>
                    </div>;
                  })}
              </section>}
              <div className="lupi-community-pvp-history"><h3>Últimos enfrentamientos</h3>
                {!pvpLoading && !pvpError && pvpHistory.length === 0 && <p className="lupi-community-muted">Todavía no hay duelos confirmados por ambos jugadores.</p>}
                {pvpHistory.map(m => <div className="lupi-community-pvp-history-row" key={m.match_id}>
                  <span>{m.host_name} <b>{m.host_wins} - {m.guest_wins}</b> {m.guest_name}</span>
                  <small>{new Date(m.finished_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</small>
                </div>)}
              </div>
              <button type="button" className="lupi-community-refresh" onClick={() => void loadPvp(selected.id)}>↻ Actualizar ranking PvP</button>
            </> : <>
              <p>Puntos por misiones completadas esta semana (hora Argentina).</p>
              {!weeklyLoading && !weeklyError && weeklyRanking.length === 0 && <p className="lupi-community-muted">Todavía no hay misiones registradas esta semana.</p>}
              {weeklyLoading && <p>Cargando clasificación…</p>}
              {weeklyError && <p role="alert" className="lupi-community-error">{weeklyError}</p>}
              {!weeklyError && weeklyRanking.map((player, index) => <div className="lupi-community-member" key={player.user_id}>
                <b className="lupi-community-rank">#{index + 1}</b><div><strong>{player.username || "Jugador"}{player.user_id === userId ? " · Vos" : ""}</strong>
                <small>Nivel {player.level ?? "—"} · {player.weekly_points} puntos · {player.missions_count} misiones</small></div>
              </div>)}
            </>}
          </>}
          {insideTab === "desafios" && <><h3>Desafío de 7 días</h3><p>Completá 3 misiones de LupiApp durante esta semana para superar el desafío de tu comunidad.</p>{weeklyLoading && <p>Cargando progreso…</p>}{weeklyError && <p role="alert" className="lupi-community-error">{weeklyError}</p>}{weekly && !weeklyError && <div className="lupi-community-challenge"><strong>{weekly.finished ? "✓ Desafío completado" : "El primer desafío de Flores"}</strong><div className="lupi-community-progress-track" role="progressbar" aria-valuenow={weekly.completed} aria-valuemin={0} aria-valuemax={weekly.goal}><div style={{ width: `${Math.min(100, weekly.completed / weekly.goal * 100)}%` }} /></div><p>{weekly.completed} / {weekly.goal} misiones completadas</p><small>Termina el {new Date(weekly.ends_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short" })}. El progreso se verifica con tus misiones registradas.</small><p className="lupi-community-muted">Las recompensas adicionales todavía no están habilitadas para evitar duplicar puntos.</p><button type="button" className="lupi-community-refresh" onClick={() => void loadWeekly(selected.id)}>↻ Actualizar progreso</button></div>}</>}
        </div>
      </> : view === "community" ? <>
        <button className="lupi-community-back" type="button" onClick={() => { setView("mine"); setNotice(""); setError(""); }}>← Volver a comunidades</button>
        {selected && <div className="lupi-community-content">
          <div className="lupi-community-crest">{crestFor(selected) ? <img src={crestFor(selected)!} alt={`Escudo de ${selected.name}`} /> : "🏟️"}</div>
          <h3>{selected.name}</h3><p>{selected.description}</p>
          <div className="lupi-community-stats"><span>{isFlores ? <><img className="flores-stat-icon flores-stat-image" src={iconMiembros} alt="" aria-hidden="true" /><span className="flores-stat-copy"><strong>{members.length} MIEMBROS</strong><small>EN LA COMUNIDAD</small></span></> : <>👥 {members.length} miembros</>}</span><span>{isFlores ? <><img className="flores-stat-icon flores-stat-image flores-stat-trophy" src={iconRanking} alt="" aria-hidden="true" /><span className="flores-stat-copy"><strong>TEMPORADA SEMANAL</strong><small>RANKING ACTIVO</small></span></> : <>🏆 Ranking comunitario</>}</span></div>
          {!joined ? <button className="lupi-community-join" type="button" disabled={!!busy} onClick={() => void join()}>{busy ? "UNIÉNDOTE…" : "UNIRME A LA COMUNIDAD"}</button> : <button className="lupi-community-join" type="button" onClick={() => enterClub(isFlores)} disabled={clubEntering}>{isFlores && <img className="flores-join-shield flores-join-shield-image" src={iconEscudoBoton} alt="" aria-hidden="true" />}<span>ENTRAR A {selected.name.toLocaleUpperCase("es-AR")}</span><span aria-hidden="true">→</span></button>}
          
        </div>}
      </> : <>
        <nav className="lupi-community-tabs" aria-label="Secciones de comunidades"><button type="button" className={view === "mine" ? "active" : ""} onClick={() => setView("mine")}>Mis comunidades ({myMemberships.length})</button><button type="button" className={view === "explore" ? "active" : ""} onClick={() => { setView("explore"); setNotice(""); }}>Explorar</button><button type="button" className={view === "clubs" ? "active" : ""} onClick={() => { setView("clubs"); setNotice(""); }}>Buscar mi club</button></nav>
        {loading ? <p>Cargando…</p> : view === "mine" ? <div className="lupi-community-list">
          <h3>Mis comunidades</h3>
          {myMemberships.length === 0 && <p>Todavía no te uniste a ninguna comunidad. Explorá y elegí una para comenzar.</p>}
          {communities.filter(c => myMemberships.includes(c.id)).map(c => <button type="button" className="lupi-community-card" key={c.id} onClick={() => void openCommunity(c)}><span>{crestFor(c) ? <img className="lupi-community-list-crest" src={crestFor(c)!} alt="" /> : "🏟️"}</span><span><strong>{c.name}</strong><small>✓ Sos miembro · Entrar a tu comunidad</small></span><b>→</b></button>)}
        </div> : view === "explore" ? <div className="lupi-community-list">
          {communities.length === 0 && <p>Todavía no hay comunidades disponibles.</p>}
          {communities.map(c => <button type="button" className="lupi-community-card" key={c.id} onClick={() => void openCommunity(c)}><span>{crestFor(c) ? <img className="lupi-community-list-crest" src={crestFor(c)!} alt="" /> : "⚽"}</span><span><strong>{c.name}</strong><small>{c.description ?? "Conocé la comunidad"}</small></span><b>→</b></button>)}
        </div> : <div className="lupi-community-list">
          <label className="lupi-community-search-label" htmlFor="lupi-club-search">Buscá tu club de futsal</label><input id="lupi-club-search" className="lupi-community-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre o localidad" />
          {clubs.length === 0 && <p>Aún no se cargaron clubes al catálogo. Se incorporarán clubes reales verificados.</p>}
          {filteredClubs.map(club => { const count = requests.filter(r => r.club_id === club.id).length; const mine = requests.some(r => r.club_id === club.id && r.user_id === userId); const linked = communities.find(c => c.id === club.community_id); return <div className="lupi-community-club" key={club.id}><div><strong>{club.name}</strong><small>{club.city ?? "Futsal"} · {count} {count === 1 ? "solicitud" : "solicitudes"}</small></div>{linked ? <button type="button" onClick={() => void openCommunity(linked)}>Entrar</button> : <button type="button" disabled={mine || !!busy} onClick={() => void requestClub(club)}>{mine ? "✓ Solicitada" : busy === club.id ? "Enviando…" : "Solicitar"}</button>}</div>; })}
          {clubs.length > 0 && filteredClubs.length === 0 && <p>No encontramos ese club en el catálogo todavía.</p>}
          <p className="lupi-community-disclaimer">Los clubes del directorio son referencias informativas. Las comunidades no son oficiales salvo indicación expresa y autorización.</p>
        </div>}
      </>}
      {notice && <p className="lupi-community-success" role="status">{notice}</p>}
      {error && <p className="lupi-community-error" role="alert">{error}</p>}
    </section>
  </div>, document.body);
}
