import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useTriviaMatch } from "../hooks/useTriviaMatch";
import { AvatarFace } from "./AvatarFace";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import "./TriviaDuel.css";

type Props = { challenge: Challenge; meId: string; players?: LobbyPlayer[]; onExit: () => void; onRematch: (challenge: Challenge) => void };
export function TriviaDuel({ challenge, meId, players = [], onExit, onRematch }: Props) {
  const { state, error, busy, answer, rematch, reconnect } = useTriviaMatch(challenge);
  const [remaining, setRemaining] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<{ round: number; index: number } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const forwarded = useRef(false);
  const [portraits] = useState(() => players.filter(p => p.userId === challenge.fromId || p.userId === challenge.toId));
  const host = meId === challenge.fromId;
  const finished = state?.status === "finished";
  const expired = state?.status === "expired";
  const ended = finished || expired;
  useEffect(() => {
    if (!state) return;
    const end = Date.now() + Math.max(0, Date.parse(state.deadline) - Date.parse(state.serverNow));
    const tick = () => setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [state?.deadline, state?.serverNow]);
  useEffect(() => {
    if (state?.rematch?.status !== "accepted" || !state.rematch.id || forwarded.current) return;
    forwarded.current = true;
    onRematch({ ...challenge, id: state.rematch.id, at: Date.now() });
  }, [state?.rematch?.status, state?.rematch?.id, challenge, onRematch]);
  const result = state?.lastResult;
  const summary = state?.history?.length ? state.history : result ? [result] : [];
  const verdict = expired ? "DUELO VENCIDO" : state?.winnerId === meId ? "¡GANASTE!" : state?.winnerId === null ? "¡EMPATE!" : "¡BUEN DUELO!";
  const pending = state?.rematch?.status === "pending";
  const mine = state?.rematch?.requestedBy === meId;
  const portrait = (id: string, name: string) => {
    const player = players.find(p => p.userId === id) ?? portraits.find(p => p.userId === id);
    return <div className="trivia-portrait" aria-hidden="true">{player?.appearance ? <AvatarFace appearance={player.appearance} className="lw-face--game" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}</div>;
  };
  return (
    <section className={`trivia-arena${ended ? " trivia-arena--ended" : " trivia-arena--playing"}`} aria-label="Preguntados: duelo de fútbol">
      <header className="trivia-header"><button type="button" onClick={() => ended ? onExit() : setConfirmExit(true)}>← Lobby</button><span>LUPI WORLD · ARENA SOCIAL</span><b className="trivia-brand-mark" aria-hidden="true">✦</b></header>
      <div className="trivia-title"><small>ARENA DE CONOCIMIENTO</small><h2>PREGUNTADOS</h2><p>Fútbol · 5 preguntas · 1 punto por acierto</p></div>
      {ended && <div className={`trivia-result-banner ${expired ? "is-expired" : state.winnerId === meId ? "is-win" : ""}`} role="status"><span aria-hidden="true">{expired ? "⌛" : state.winnerId === meId ? "🏆" : state.winnerId === null ? "🤝" : "👏"}</span><small>RESULTADO FINAL</small><h3>{verdict}</h3><p>{expired ? "Faltó una respuesta. Sin ganador." : "Cada acierto sumó un punto. ¿Sale otra?"}</p><div className="trivia-confetti" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{"--particle":i} as React.CSSProperties} />)}</div></div>}
      <div className="trivia-score"><div>{ended && portrait(meId, host ? challenge.fromName : challenge.toName)}<small>VOS</small><strong>{host ? challenge.fromName : challenge.toName}</strong><b key={`mine-${state?.hostScore}-${state?.guestScore}`}>{state ? host ? state.hostScore : state.guestScore : 0}</b></div><span>VS</span><div>{ended && portrait(host ? challenge.toId : challenge.fromId, host ? challenge.toName : challenge.fromName)}<small>RIVAL</small><strong>{host ? challenge.toName : challenge.fromName}</strong><b key={`rival-${state?.hostScore}-${state?.guestScore}`}>{state ? host ? state.guestScore : state.hostScore : 0}</b></div></div>
      {!state && !error && <p role="status">Preparando las mismas preguntas para ambos…</p>}
      {error && <div className="trivia-error" role="alert"><p>{error}</p><button type="button" onClick={reconnect}>Reconectar</button></div>}
      {state && !ended && state.question && <div className="trivia-question" key={state.round} aria-labelledby="trivia-current-question">
        <div className="trivia-progress"><span>PREGUNTA {state.round} / {state.total}</span><b className={`trivia-clock${remaining <= 10 ? " is-urgent" : ""}`} aria-label={`${remaining} segundos restantes`}>◷ {remaining}s</b></div>
        <progress value={state.round - 1} max={state.total} aria-label="Preguntas completadas" />
        <h3 id="trivia-current-question">{state.question.prompt}</h3>
        <p className="trivia-wait" role="status">{state.mineSubmitted ? "✓ Respuesta enviada. Esperando al rival…" : state.opponentSubmitted ? "Tu rival ya respondió. ¡Es tu turno!" : "Elegí tu respuesta. La revelamos cuando contesten ambos."}</p>
        <div className="trivia-options">{state.question.options.map((option, index) => <button key={index} type="button" data-selected={selectedAnswer?.round === state.round && selectedAnswer.index === index} aria-pressed={selectedAnswer?.round === state.round && selectedAnswer.index === index} style={{ "--choice-index": index } as React.CSSProperties} disabled={busy || state.mineSubmitted || remaining === 0} onClick={async () => { const round = state.round; if (await answer(index)) setSelectedAnswer({ round, index }); }}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}</div>
      </div>}
      {!ended && result && <details key={result.round} className="trivia-reveal">
        <summary><span className={(host ? result.hostCorrect : result.guestCorrect) ? "trivia-round-hit" : "trivia-round-miss"}>{(host ? result.hostCorrect : result.guestCorrect) ? "✓" : "✕"}</span><span>RONDA {result.round} · {(host ? result.hostCorrect : result.guestCorrect) ? "ACERTASTE" : "NO ACERTASTE"}<small>Ver respuesta anterior</small></span><b aria-hidden="true">⌄</b></summary>
        <div className="trivia-reveal-body"><p>{result.prompt}</p><strong>✓ {result.correct}</strong><p>{(host ? result.guestCorrect : result.hostCorrect) ? "Tu rival acertó." : "Tu rival no acertó."}</p></div>
      </details>}
      {ended && <>
        <div className="trivia-rematch">
          {pending ? mine ? <><p role="status">Revancha enviada. Esperando al rival…</p><button type="button" disabled={busy} onClick={() => void rematch("cancel")}>CANCELAR SOLICITUD</button></> : <><p role="status">Tu rival pide revancha. ¿Jugamos otra?</p><div className="trivia-actions"><button type="button" className="trivia-primary" disabled={busy} onClick={() => void rematch("accept")}>ACEPTAR REVANCHA</button><button type="button" disabled={busy} onClick={() => void rematch("decline")}>AHORA NO</button></div></> : <>
            <div className="trivia-actions"><button type="button" className="trivia-primary" disabled={busy || state.rematch?.status === "accepted"} onClick={() => void rematch("request")}>🔁 PEDIR REVANCHA</button><button type="button" onClick={onExit}>VOLVER AL LOBBY</button></div>
            {state.rematch?.status === "declined" && <p role="status">Tu rival prefirió no jugar otra.</p>}
            {state.rematch?.status === "expired" && <p role="status">La invitación venció. Podés volver a intentarlo.</p>}
            {state.rematch?.status === "cancelled" && <p role="status">Solicitud cancelada.</p>}
          </>}
          {pending && <p className="trivia-footnote">La invitación vence a los 25 segundos. El rival debe seguir en esta pantalla.</p>}
        </div>
        <details className="trivia-summary"><summary><span>ASÍ FUE EL DUELO<small>{summary.length} de {state.total} preguntas · Ver respuestas</small></span><b aria-hidden="true">⌄</b></summary>
          <div className="trivia-summary-scroll"><table><thead><tr><th scope="col">Pregunta y respuesta correcta</th><th scope="col">Vos</th><th scope="col">Rival</th></tr></thead><tbody>{summary.map(round => <tr key={round.round}><td><small>PREGUNTA {round.round}</small><strong>{round.prompt}</strong><span>✓ {round.correct}</span></td><td aria-label={(host ? round.hostCorrect : round.guestCorrect) ? "Acertaste" : "No acertaste"}>{(host ? round.hostCorrect : round.guestCorrect) ? "✅" : "✕"}</td><td aria-label={(host ? round.guestCorrect : round.hostCorrect) ? "Rival acertó" : "Rival no acertó"}>{(host ? round.guestCorrect : round.hostCorrect) ? "✅" : "✕"}</td></tr>)}</tbody></table></div>
          {summary.length === 0 && <p>No llegaron a completar ninguna pregunta.</p>}
        </details>
      </>}
      <p className="trivia-footnote">Duelo amistoso · Sin puntos para el ranking comunitario.</p>
      {confirmExit && <div className="trivia-confirm"><div role="dialog" aria-modal="true" aria-labelledby="trivia-exit-title"><h3 id="trivia-exit-title">¿Salir del duelo?</h3><p>El rival quedará esperando. Si falta una respuesta, la partida vencerá sin ganador al terminar el tiempo.</p><button autoFocus type="button" onClick={() => setConfirmExit(false)}>SEGUIR JUGANDO</button><button type="button" onClick={onExit}>SALIR AL LOBBY</button></div></div>}
    </section>
  );
}
