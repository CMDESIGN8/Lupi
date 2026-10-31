import { useEffect, useMemo, useRef, useState } from "react";
import { ArenaSymbol } from "./match/ArenaSymbol";
import { ArenaAvatar } from "./match/ArenaAvatar";
import type { InventoryItem } from "../hooks/useAuraInventory";
import { ClubArrival } from "./match/ClubArrival";
import { DeckPlayerCard } from "./DeckPlayerCard";
import { AvatarFace } from "./AvatarFace";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import { tacticalOptions, eventChoiceLabel, routeName, actorIndex, scenarioName } from "./match/futsalTactics";
import { TacticalIcon } from "./match/TacticalIcon";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useFutsalPvp, type FutsalChoice } from "../hooks/useFutsalPvp";
import type { Deck } from "../types/cards";
import "./TriviaDuel.css";
import "./FutsalPvp.css";
import "./FutsalArenaPresentation.css";
import "./FutsalResultCinema.css";
import "./FutsalClub.css";
import "./FutsalFinale.css";
import { PvpSimulatorCourt } from "./match/PvpSimulatorCourt";
type Props = { challenge: Challenge; meId: string; deck: Deck; players?: LobbyPlayer[]; catalog?: InventoryItem[]; onExit: () => void };
export function FutsalPvp({ challenge, meId, deck, players = [], catalog = [], onExit }: Props) {
  const { state, receivedAt, error, busy, join, play, leave, reconnect } = useFutsalPvp(challenge);
  const [portraits] = useState(() => players.filter(p => p.userId === challenge.fromId || p.userId === challenge.toId));
  const portrait = (id: string, name: string) => { const player = players.find(p => p.userId === id) ?? portraits.find(p => p.userId === id); return <span className="fp-avatar trivia-portrait" aria-hidden="true">{player?.appearance ? <AvatarFace appearance={player.appearance} className="lw-face--game" /> : <span>{name.slice(0,1).toUpperCase()}</span>}</span>; };
  const fullAvatar = (id:string,name:string) => <ArenaAvatar player={players.find(p=>p.userId===id) ?? portraits.find(p=>p.userId===id)} catalog={catalog} isMe={id===meId} name={name}/>;
  const [now, setNow] = useState(Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
  const sendingChoice = useRef(false);
  const lastTouch = useRef(0);
  const [selected, setSelected] = useState<{ version: number; choice: FutsalChoice } | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if(state && !['waiting','playing'].includes(state.status)){
      const delay=Math.max(0,Date.parse(state.nextAt)-Date.parse(state.serverNow)-(Date.now()-receivedAt));
      if(!delay)return;
      const id=window.setTimeout(()=>setNow(Date.now()),delay+20);return()=>window.clearTimeout(id);
    }
    const id=window.setInterval(()=>setNow(Date.now()),state?.status==='playing'?250:1000);
    return()=>window.clearInterval(id);
  },[state?.status,state?.nextAt,receivedAt]);
  const ownedCards = useMemo(()=>[...deck.cards].sort((a,b) => (a.position ?? 0)-(b.position ?? 0)),[deck.cards]);
  const renderCard = (userCard: Deck["cards"][number]) => <DeckPlayerCard card={userCard} slot={userCard.position}/>;
  const host = meId === challenge.fromId;
  const mine = host ? challenge.fromName : challenge.toName;
  const rival = host ? challenge.toName : challenge.fromName;
  const ready = !!state && (host ? state.hostReady : state.guestReady);
  const attacking = state?.attackerId === meId;
  const elapsed = Math.max(0, now - receivedAt);
  const until = (date: string | undefined) => state && date ? Math.max(0, Math.ceil((Date.parse(date) - Date.parse(state.serverNow) - elapsed) / 1000)) : 0;
  const countdown = until(state?.nextAt);
  const remaining = until(state?.deadline);
  const ended = !!state && !["waiting", "playing"].includes(state.status) && (state.status !== "finished" || countdown === 0);
  const quick = state?.rulesVersion === 3;
  const totalAttacks = state?.totalAttacks ?? 5;
  const decisionSeconds = state?.decisionSeconds ?? 30;
  const team = state ? (host ? state.hostTeam : state.guestTeam) : null;
  const won = state?.winnerId === meId;
  const verdict = state?.status === "finished" ? state.winnerId === null ? "¡EMPATE!" : won ? "¡GANASTE!" : "¡BUEN PARTIDO!"
    : state?.status === "abandoned" ? won ? "EL RIVAL ABANDONÓ" : "PARTIDO ABANDONADO" : "PARTIDO CANCELADO";
  const finishExit = async () => { if (ended || !state) { onExit(); return; } if (await leave()) onExit(); };
  const attackResults = (id: string) => state?.history.filter(event => event.attackerId === id && !event.keepAttack) ?? [];
  const scoreSide = (id: string, name: string, score: number, own: boolean) => <div className={`fp-score-side ${own ? "fp-score-side--mine" : "fp-score-side--rival"}`}>{portrait(id,name)}<div className="fp-team-identity"><small>{own ? "TU EQUIPO" : "RIVAL"}</small><strong>{name}</strong><div className="fp-attempts" aria-label={`${attackResults(id).length} de ${totalAttacks} ataques completados`}>{Array.from({length:totalAttacks},(_,i) => {const event=attackResults(id)[i];return <i key={i} className={event ? event.goal ? "is-goal" : "is-stopped" : ""} title={event ? event.goal ? "Gol" : "Sin gol" : "Ataque pendiente"} />;})}</div></div><b key={score}>{score}</b></div>;
  const live = !!state && !ended && state.status !== "waiting";
  const simulationAge = state ? Date.parse(state.serverNow) + elapsed - Date.parse(state.nextAt) : 0;
  const showDecision = state?.status === "playing" && countdown === 0 && simulationAge >= (quick ? 0 : 1600);
  const options = state ? tacticalOptions(state,!!attacking) : [];
  const isBuild = (state?.rulesVersion ?? 1) >= 2 && state?.stage === "build";
  const isFinish = (state?.rulesVersion ?? 1) >= 2 && state?.stage === "finish";
  const actorSlot = state ? actorIndex(state,!!attacking) : 4;
  const actorCard = ownedCards.find(c => c.id === team?.[actorSlot]?.id) ?? ownedCards.find(c => c.position === (actorSlot + 1));
  const protagonist = team?.[actorSlot]?.name ?? (attacking ? "Tu atacante" : "Tu arquero");
  const ownScore = state ? host ? state.hostScore : state.guestScore : 0;
  const otherScore = state ? host ? state.guestScore : state.hostScore : 0;
  const tension = !state || countdown>0 ? "" : attacking ? attackResults(meId).length===totalAttacks-1 ? ownScore===otherScore ? "ÚLTIMO ATAQUE · UN GOL TE PONE ARRIBA" : ownScore+1===otherScore ? "ÚLTIMO ATAQUE · PODÉS EMPATARLO" : "TU ÚLTIMO ATAQUE · HACÉLO CONTAR" : ownScore===otherScore ? "UN GOL TE PONE ARRIBA" : ownScore<otherScore ? "BUSCÁ EL DESCUENTO" : "PODÉS AMPLIAR LA VENTAJA" : attackResults(host?challenge.toId:challenge.fromId).length===totalAttacks-1 ? "ÚLTIMO ATAQUE RIVAL · DEFENDÉ TU ARCO" : "LEÉ AL RIVAL · PROTEGÉ TU ARCO";
  const phaseNarrative = countdown > 0 ? state?.history.length ? "Se resuelve la jugada y los equipos se reordenan." : "Equipos listos. Empieza el partido." : simulationAge < 400 ? "La pelota vuelve a circular." : simulationAge < 850 ? "El cierre encuentra un pase hacia adelante." : simulationAge < 1600 ? "El ala avanza y el equipo llega al último tercio." : attacking ? isBuild ? "Tu equipo prepara el avance. Elegí cómo llegar al arco." : "Tu equipo está en posición de definir. Elegí tu jugada." : isBuild ? "El rival prepara el avance. Elegí cómo frenarlo." : "El rival llega al área. Elegí cómo defender.";
  const choose = async (choice: FutsalChoice) => {
    if (!state || busy || state.mineSubmitted || remaining===0 || sendingChoice.current) return;
    const version=state.version;
    sendingChoice.current=true;
    setSelected({version,choice});
    try { if(!await play(choice))setSelected(value=>value?.version===version?null:value); }
    finally {sendingChoice.current=false;}
  };
  const decisionPanel = state && showDecision ? <div className="pvp-decision-overlay"><div className="fp-anime-cutin" key={`cutin-${state.version}`} aria-hidden="true"><div className="fp-cutin-side">{portrait(meId,mine)}<strong>{attacking ? "¡VOY POR EL GOL!" : "¡POR ACÁ NO PASÁS!"}</strong><small>{mine}</small></div><span>VS</span><div className="fp-cutin-side fp-cutin-side--rival">{portrait(host?challenge.toId:challenge.fromId,rival)}<strong>{rival}</strong></div></div><section className={`fp-decisions fp-moment-panel ${attacking ? "fp-decisions--attack" : "fp-decisions--defense"}`} key={state.version} aria-label={attacking ? "Decisión de ataque" : "Decisión de defensa"}>
    {quick && <div className="fp-scenario-label">{scenarioName(state.scenario)}<span>ATAQUE {Math.ceil(state.turn/2)} / 3</span></div>}<div className="fp-moment-label" aria-hidden="true">{quick && state.scenario!=="elaborated" ? scenarioName(state.scenario) : isBuild ? "CONSTRUÍ LA JUGADA" : isFinish ? routeName(state.route) : state.support ? "SEGUNDA OPORTUNIDAD" : attacking ? "CREÁ TU GOL" : "PROTEGÉ TU ARCO"}<span>DECISIÓN TÁCTICA</span></div><div className="fp-moment-intro">{attacking ? quick && state.scenario==="counter" ? "¡Salís con ventaja! Resolvé el contraataque." : quick && state.scenario==="setpiece" ? "¡Pelota detenida! Sorprendé a la defensa." : isBuild ? "¡Buscá el camino al arco!" : isFinish ? `¡${routeName(state.route)}! Llegó el momento de definir.` : state.support ? "¡El pase llegó! Tenés otra definición." : "¡Tu equipo encuentra el espacio!" : isBuild ? "¡Leé cómo quiere avanzar tu rival!" : "¡El rival se prepara para definir!"}</div>
    {(state.rulesVersion ?? 1) >= 2 && (!quick || state.scenario==="elaborated") && <div className="fp-stage-track"><span className={isBuild ? "is-active" : "is-done"}>01 · CONSTRUCCIÓN</span><i/><span className={isFinish ? "is-active" : ""}>02 · DEFINICIÓN</span></div>}<div className="fp-moment-top"><div className="fp-actor-face">{portrait(meId,mine)}</div><div><small>⚡ MOMENTO CLAVE · {attacking ? "ATACÁS" : "DEFENDÉS"}</small><h3>{protagonist}</h3></div><div className={`fp-moment-clock${remaining <= (quick ? 4 : 10) ? " is-urgent" : ""}`} role="timer" aria-label={`${remaining} segundos para decidir`}><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle cx="22" cy="22" r="18" style={{strokeDasharray:113,strokeDashoffset:113*(1-Math.min(decisionSeconds,remaining)/decisionSeconds)}}/></svg><b>{remaining}</b></div></div>
    {quick && tension && <div className="fp-tension" role="status">{tension}</div>}<div className="fp-tactical-layout">{actorCard?.card && <div className="fp-featured-card">{renderCard(actorCard)}<small>TU PROTAGONISTA</small></div>}<div className="fp-tactical-hand"><p role="status">{busy && selected?.version===state.version ? "Enviando tu jugada…" : state.mineSubmitted ? "✓ Elección guardada. Esperando al rival…" : state.opponentSubmitted ? "Tu rival ya eligió. Su decisión sigue oculta." : isBuild ? attacking ? "Elegí cómo llegar al arco." : "Elegí qué avance vas a cortar." : attacking ? "Elegí cómo definir esta jugada." : "Elegí qué definición vas a cubrir."}</p>
    <div className="fp-choices">{options.map((c,index) => <button type="button" key={c.id} style={{"--fp-choice-index":index} as React.CSSProperties} data-selected={selected?.version === state.version && selected.choice === c.id} aria-pressed={selected?.version === state.version && selected.choice === c.id} disabled={busy || state.mineSubmitted || remaining === 0} onPointerUp={event => {if(event.pointerType==="touch"){event.preventDefault();lastTouch.current=Date.now();void choose(c.id);}}} onClick={() => {if(Date.now()-lastTouch.current>700)void choose(c.id);}}><span className="fp-option-icon" aria-hidden="true"><TacticalIcon choice={c.id} defending={!attacking} stage={(state.rulesVersion??1)>=2?state.stage:undefined}/></span><strong>{c.title}</strong><small>{(state.rulesVersion ?? 1) < 2 && attacking && c.id === "back" && state.support ? "Repetir el pase termina tu ataque sin gol." : c.hint}</small><span className="fp-choice-number" aria-hidden="true">0{index+1}</span><span className="fp-option-confirm" aria-hidden="true">{selected?.version === state.version && selected.choice === c.id ? "✓" : "›"}</span></button>)}</div>
    </div></div><div className="fp-secret-note">◇ Sin elegir a tiempo: jugada automática.</div>
  </section></div> : undefined;
  return <section data-outcome={ended ? won ? "win" : state?.winnerId ? "loss" : "draw" : undefined} className={`trivia-arena fp-arena ${quick ? "fp-arena--quick" : ""} ${ended ? "trivia-arena--ended fp-arena--result" : state?.status === "playing" || state?.status === "finished" ? "fp-arena--live fp-arena--broadcast" : "fp-arena--waiting"}`} aria-label="Partido Futsal PvP">
    <header className="trivia-header"><button type="button" onClick={() => ended || !state ? onExit() : setConfirmExit(true)}>← Lobby</button><span>LUPI WORLD · FUTSAL PvP</span><b className="trivia-brand-mark">⚽</b></header>
    <div className="trivia-title"><small>LEÉ AL RIVAL · ELEGÍ TU JUGADA</small><h2>{quick ? "DUELO RELÁMPAGO" : "DUELO EN LA CANCHA"}</h2><p>{totalAttacks} ataques por jugador · {quick ? `Tres situaciones · ${decisionSeconds} segundos para decidir` : "Construcción y definición"}</p></div>
    {!live && !ended && (<div className="trivia-score fp-score">{scoreSide(meId,mine,state ? host ? state.hostScore : state.guestScore : 0,true)}<span className="fp-score-mid"><small>AMISTOSO</small>VS<small>{totalAttacks} ATAQUES</small></span>{scoreSide(host?challenge.toId:challenge.fromId,rival,state ? host ? state.guestScore : state.hostScore : 0,false)}</div>)}
    {error && <div className="trivia-error" role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={reconnect}>Reconectar</button></div>}
    {!state && <p role="status">Conectando con la cancha…</p>}
    {state?.status === "waiting" && <div className="fp-briefing"><div className="fp-prebattle-label"><span>ARENA SOCIAL</span><b>FUTSAL · 1 VS 1</b></div><ClubArrival mine={mine} rival={rival} ownFace={fullAvatar(meId,mine)} rivalFace={fullAvatar(host?challenge.toId:challenge.fromId,rival)} ownReady={ready} rivalReady={host?state.guestReady:state.hostReady} club={players.find(p=>p.userId===meId)?.club || 'CLUB LUPI'}/><span className="fp-kicker">ANTES DEL SILBATAZO</span><h3>EL EQUIPO ESTÁ LLEGANDO</h3><div className="fp-match-rules"><span><b>{totalAttacks}</b> ATAQUES</span><span><b>{decisionSeconds}s</b> POR ELECCIÓN</span><span>DECISIONES <b>SECRETAS</b></span></div>{!quick && <p>Cuando atacás, elegís cómo definir. Cuando defendés, elegís qué jugada cubrir. Las respuestas se revelan al mismo tiempo.</p>}
      {quick ? <><div className="fp-scenario-schedule">{state.scenarioOrder?.map((scenario,i)=><span key={scenario} data-scenario={scenario}><ArenaSymbol kind={scenario==="counter"?"counter":scenario==="setpiece"?"setpiece":"elaborated"}/><b>0{i+1}</b><strong>{scenarioName(scenario)}</strong><small>{scenario==="elaborated"?"Construcción + definición":"Una decisión"}</small></span>)}</div><p className="fp-quick-instruction">Leé al rival. Elegí tu jugada. Hacé la diferencia.</p></> : (state.rulesVersion ?? 1) >= 2 ? <><div className="fp-briefing-steps"><span><b>01</b><strong>CONSTRUÍ</strong><small>Desborde, pared o pase al pívot.</small></span><span><b>02</b><strong>DEFINÍ</strong><small>Tres opciones según cómo llegaste.</small></span></div><p>Ambos eligen en secreto. Si la defensa acierta en construcción, recupera; si la superás, llegás a definir. En la definición, acertar frena el tiro y otra cobertura concede el gol.</p><p>5 ataques por jugador · Hasta 2 decisiones por ataque · {decisionSeconds} segundos para elegir. Si no respondés, se elige automáticamente.</p></> : <p>Partida con reglas anteriores: tiro al ángulo, remate fuerte o pase atrás.</p>}
      <details className="fp-briefing-help"><summary>CÓMO SE JUEGA <b>⌄</b></summary><p>Ambos eligen en secreto. Acertar la cobertura frena la jugada; otra cobertura permite avanzar o marcar. Tenés {decisionSeconds} segundos por elección y, si no respondés, se elige automáticamente. Confirmá cinco cartas propias y distintas. El mazo se fija al confirmar; las estadísticas todavía no cambian los cruces. Las opciones indican qué defensa las frena.</p></details>
      <div className="fp-lineup-heading"><span>TUS TITULARES</span><small>Tu mazo activo · Cinco cartas, un equipo</small></div><div className="fp-real-roster">{ownedCards.map(c => <div className="fp-lineup-card" key={c.id} style={{"--slot":c.position ?? 1} as React.CSSProperties}><div className="fp-card-display">{renderCard(c)}</div><strong className="fp-lineup-name">{c.card?.name ?? "Jugador"}</strong><span>{c.position === 1 ? "ARQUERO" : c.position === 2 ? "CIERRE" : c.position === 5 ? "PÍVOT" : "ALA"}</span></div>)}</div>
      <div className="trivia-actions"><button type="button" className="fp-primary" disabled={busy || ready || !state} onClick={() => void join()}>{ready ? "✓ EQUIPO CONFIRMADO" : busy ? "VALIDANDO EQUIPO…" : "CONFIRMAR Y ENTRAR A LA CANCHA"}</button></div>
      <p role="status">{ready ? "Esperando que el rival confirme su equipo…" : "Confirmá tu equipo para empezar."} · {remaining}s</p>
    </div>}
    {state && live && <div className={`fp-broadcast ${showDecision ? "is-deciding" : ""}`}><div className="fp-mobile-score" aria-label="Marcador en vivo"><span className="fp-mobile-team">{portrait(meId,mine)}<strong>{mine}</strong></span><b key={`m-${state.hostScore}-${state.guestScore}`}>{host ? state.hostScore : state.guestScore}<i>:</i>{host ? state.guestScore : state.hostScore}</b><span className="fp-mobile-team fp-mobile-team--rival">{portrait(host?challenge.toId:challenge.fromId,rival)}<strong>{rival}</strong></span><small>{attacking ? "ATACÁS" : "DEFENDÉS"} · {isBuild ? "CONSTRUCCIÓN" : isFinish ? "DEFINICIÓN" : "ATAQUE"} {Math.min(totalAttacks,Math.ceil(state.turn/2))}/{totalAttacks}</small></div>
      <PvpSimulatorCourt state={state} meId={meId} mine={mine} rival={rival} now={now} receivedAt={receivedAt} isHost={host} overlay={decisionPanel}/>
      <aside className="fp-match-center" aria-label="Centro del partido">
        <div className="fp-live-heading"><span><i/> EN VIVO</span><b>ATAQUE {Math.ceil(state.turn/2)} / {totalAttacks} · FUTSAL</b></div>
        <div className="trivia-score fp-score">{scoreSide(meId,mine,state ? host ? state.hostScore : state.guestScore : 0,true)}<span className="fp-score-mid"><small>AMISTOSO</small>VS<small>{totalAttacks} ATAQUES</small></span>{scoreSide(host?challenge.toId:challenge.fromId,rival,state ? host ? state.guestScore : state.hostScore : 0,false)}</div>
        <div className="fp-match-phase"><span className={attacking ? "fp-attack" : "fp-defense"}>{attacking ? "⚡ TE TOCA ATACAR" : "🛡 TE TOCA DEFENDER"}</span><small>{quick && state.scenario!=="elaborated" ? scenarioName(state.scenario) : isBuild ? "CONSTRUCCIÓN" : isFinish ? routeName(state.route) : state.support ? "SEGUNDA DEFINICIÓN" : countdown > 0 ? state.history.length ? "JUGADA RESUELTA" : "SALIDA INICIAL" : showDecision ? "MOMENTO CLAVE" : "JUGADA EN CURSO"}</small></div>
        <div className="fp-live-status" role="status">{state.mineSubmitted ? "✓ Tu decisión está guardada. El rival todavía puede elegir." : phaseNarrative}</div>
        <div className="fp-feed-heading"><span><i/> RELATO EN DIRECTO</span><small>{state.history.length} RESOLUCIONES</small></div>
        <div className="fp-live-feed" aria-label="Relato del partido"><div className="fp-feed-event fp-feed-current" key={`phase-${state.version}-${showDecision}`}><small>AHORA · {attacking ? mine : rival}</small><p>{phaseNarrative}</p></div>{[...state.history].reverse().map(event => <div className={`fp-feed-event ${event.goal ? "is-goal" : ""} ${event.attackerId === meId ? "is-mine" : "is-rival"}`} key={event.version}><small>ATAQUE {Math.ceil(event.turn/2)} · {event.attackerId === meId ? mine : rival}{(event.rulesVersion??1)>=2 ? ` · ${event.stage=== "build" ? "CONSTRUCCIÓN" : "DEFINICIÓN"}` : ""}</small><p>{event.narrative}</p><span>{eventChoiceLabel(event,true)} / {eventChoiceLabel(event,false)}{event.hostAuto || event.guestAuto ? " · Elección automática" : ""}</span></div>)}</div>
        <div className="fp-center-foot">⚡ CADA JUGADA CUENTA</div>
      </aside>
    </div>}
    {state && ended && <><div className="fp-finale" role="status">
      <div className="fp-finale__speed" aria-hidden="true"/><div className="fp-finale__sparks" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{"--spark":i} as React.CSSProperties}/>)}</div>
      <div className="fp-finale__headline"><small>SILBATAZO FINAL · CLUB LUPI</small><ArenaSymbol kind={won?"trophy":"shield"}/><h3>{verdict}</h3><span>{state.status==="finished" ? "SE DEJÓ TODO EN LA CANCHA" : "EL ENCUENTRO TERMINÓ"}</span></div>
      <div className="fp-finale__stage"><div className={`fp-finale__player${won?' is-winner':''}`}>{fullAvatar(meId,mine)}<strong>{mine}</strong><small>TU EQUIPO</small></div><div className="fp-finale__score" aria-label={`Resultado final: ${mine} ${ownScore}, ${rival} ${otherScore}`}><small>FINAL</small><div><b>{ownScore}</b><em>:</em><b>{otherScore}</b></div><span>FUTSAL · 1 VS 1</span></div><div className={`fp-finale__player fp-finale__player--away${!won&&state.winnerId!==null?' is-winner':''}`}>{fullAvatar(host?challenge.toId:challenge.fromId,rival)}<strong>{rival}</strong><small>RIVAL</small></div></div>
      <div className="fp-finale__bottom"><span>{state.winnerId===null?"Un duelo a la altura del club.":won?"Esta cancha ya conoce tu nombre.":"La revancha empieza en el próximo partido."}</span><button type="button" className="fp-primary" onClick={onExit}>VOLVER AL CLUB <span aria-hidden="true"> →</span></button></div>
      <details className="fp-finale__stats"><summary>RESUMEN DEL DUELO</summary><div><span><b>{ownScore}</b>GOLES TUYOS</span><span><b>{attackResults(meId).length}/{totalAttacks}</b>ATAQUES JUGADOS</span><span><b>{state.history.filter(e=>e.attackerId!==meId&&e.defended).length}</b>CIERRES ACERTADOS</span></div></details>
      </div>
      <div className="fp-result-layout"><details className="trivia-summary fp-final-court"><summary><span>VER LA CANCHA<small>Equipos que disputaron el partido</small></span><b>⌄</b></summary><PvpSimulatorCourt state={state} meId={meId} mine={mine} rival={rival} now={now} receivedAt={receivedAt} isHost={host}/></details></div>
      {state.history.length > 0 && <details className="trivia-summary"><summary><span>RELATO DEL PARTIDO<small>{state.history.length} decisiones resueltas · Ver jugadas</small></span><b>⌄</b></summary><ol className="fp-history">{state.history.map(event=><li key={event.version}><b>{Math.ceil(event.turn/2)}. {event.attackerId===meId?"Tu ataque":"Ataque rival"}{(event.rulesVersion??1)>=2 ? ` · ${event.stage==="build" ? "Construcción" : "Definición"}` : ""}</b><p>{event.narrative}</p><small>{eventChoiceLabel(event,true)} / {eventChoiceLabel(event,false)}{event.hostAuto || event.guestAuto ? " · Elección automática" : ""}</small></li>)}</ol></details>}
    </>}
    <p className="trivia-footnote">Amistoso · Sin XP, monedas ni puntos de ranking{!ended && <> · {decisionSeconds}s por elección · Jugada automática al vencer el tiempo</>}</p>
    {confirmExit && <div className="trivia-confirm"><div role="dialog" aria-modal="true" aria-labelledby="fp-exit"><h3 id="fp-exit">¿Salir del partido?</h3><p>{state?.status === "playing" ? "Salir cuenta como abandono y el rival gana el duelo amistoso." : "Se cancelará la preparación de ambos equipos."}</p><button type="button" autoFocus onClick={() => setConfirmExit(false)}>SEGUIR JUGANDO</button><button type="button" disabled={busy} onClick={() => void finishExit()}>SALIR DEL PARTIDO</button></div></div>}
  </section>;
}
