import {TriviaLearningHub} from "./TriviaLearningHub";
import { SkillMatchReward } from './SkillMatchReward';
import { DuelResultEffects } from './DuelResultEffects';
import { useCallback, useEffect, useRef, useState } from "react";
import { asyncAnswer, asyncSeen, asyncState, type AsyncTriviaLast, type AsyncTriviaState } from "../lib/triviaAsync";
import { useDuelReward } from "../hooks/useDuelReward";
import { DuelRewardCard } from "./DuelRewardCard";
import { duelFx } from "../lib/duelFx";
import "./TriviaDuel.css";
import "./DuelResolution.css";
import "./TriviaAsyncDuel.css";

type Props = {
  matchId: string; meId: string; meName: string; rivalName: string; rivalId?: string;
  onExit: () => void; onRematch: (rival: { userId: string; username: string }) => void; onChanged?: () => void; onLearningOpenChange?: (open:boolean)=>void;
};

const FEEDBACK_MS = 1500;
const fmtDeadline = (iso: string) => new Date(iso).toLocaleString("es-AR", { weekday: "long", hour: "2-digit", minute: "2-digit" });

export function TriviaAsyncDuel({ matchId, meId, meName, rivalName, rivalId, onExit, onRematch, onChanged, onLearningOpenChange }: Props) {
  const [state, setState] = useState<AsyncTriviaState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AsyncTriviaLast | null>(null);
  const [remaining, setRemaining] = useState(0);
  const stateRef = useRef<AsyncTriviaState | null>(null);
  const endsAt = useRef<number | null>(null);
  const mounted = useRef(true);
  const submitting = useRef(false);
  const loading = useRef(false);
  const seenSent = useRef(false);
  const feedbackTimer = useRef(0);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; window.clearTimeout(feedbackTimer.current); }; }, []);

  const apply = useCallback((s: AsyncTriviaState) => {
    stateRef.current = s; setState(s);
    if (s.question && s.qStartedAt) {
      // El reloj lo manda el servidor: lo que ya pasó entre que arrancó y que respondió restaba tiempo.
      const elapsed = Date.parse(s.serverNow) - Date.parse(s.qStartedAt);
      endsAt.current = Date.now() + Math.max(0, s.timeLimitMs - elapsed);
      setRemaining(Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000)));
    } else endsAt.current = null;
  }, []);

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try { const s = await asyncState(matchId); if (mounted.current) { apply(s); setError(""); } }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : "No pudimos cargar el duelo."); }
    finally { loading.current = false; }
  }, [matchId, apply]);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (choice: number) => {
    const s = stateRef.current;
    if (!s?.question || submitting.current) return;
    submitting.current = true; setBusy(true); endsAt.current = null;
    try {
      const next = await asyncAnswer(matchId, s.question.index, choice);
      if (!mounted.current) return;
      const last = next.lastResult;
      if (last && last.index === s.question.index) { duelFx.answer(last.ok); setFeedback(last); }
      stateRef.current = next; setState(next); onChanged?.();
      window.clearTimeout(feedbackTimer.current);
      // La próxima pregunta se pide recién acá: su reloj no corre durante el feedback.
      if(!last?.explanation) feedbackTimer.current = window.setTimeout(() => {
        if (!mounted.current) return;
        setFeedback(null);
        if (next.status === "open" && !next.mineDone) void load();
      }, FEEDBACK_MS);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "No pudimos enviar tu respuesta.");
    } finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }, [matchId, load, onChanged]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (endsAt.current === null || submitting.current) return;
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) void submit(-1);   // se acabó el tiempo: cuenta como no respondida
    }, 250);
    return () => window.clearInterval(t);
  }, [submit]);

  const host = state?.role === "host";
  const ended = !!state && state.status !== "open";
  const finished = state?.status === "finished";
  const win = finished && state?.winnerId === meId;
  const rivalUserId = rivalId ?? (state ? (host ? state.guestId : state.hostId) : undefined);
  const { reward, error: rewardError } = useDuelReward("trivia", matchId, !!finished && !state?.forfeit && !feedback, { rivalId: rivalUserId });

  useEffect(() => {
    if (!ended || feedback || seenSent.current) return;
    seenSent.current = true;
    void asyncSeen(matchId).then(() => onChanged?.()).catch(() => undefined);
  }, [ended, feedback, matchId, onChanged]);

  const leave = () => {
    if (state?.status === "open" && state.question && !feedback && !window.confirm("Si salís ahora, el reloj de esta pregunta sigue corriendo. ¿Salir igual?")) return;
    onExit();
  };

  const myFinal = state ? (host ? state.hostScore : state.guestScore) : null;
  const rivalFinal = state ? (host ? state.guestScore : state.hostScore) : null;
  const q = feedback ?? state?.question ?? null;
  const qIndex = feedback ? feedback.index : state?.question?.index ?? 0;

  return (
    <section className={`trivia-arena${ended ? " trivia-arena--ended" : " trivia-arena--playing"}`} data-outcome={finished && !state?.forfeit ? win?"win":state?.winnerId===null?"draw":"loss" : undefined} aria-label="Preguntados por turnos">
      {finished && !state?.forfeit && <DuelResultEffects key={matchId} outcome={win?"win":state?.winnerId===null?"draw":"loss"}/> }
      <header className="trivia-header"><button type="button" onClick={leave}>← Lobby</button><span>LUPI WORLD · POR TURNOS</span><b className="trivia-brand-mark" aria-hidden="true">✦</b></header>
      <div className="trivia-title"><small>ARENA DE CONOCIMIENTO</small><h2>PREGUNTADOS</h2><p>Por turnos · 5 preguntas · 25 s cada una · tu rival responde en 24 h</p></div>

      {!state && !error && <p role="status">Preparando tus preguntas…</p>}
      {error && <div className="trivia-error" role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); void load(); }}>Reintentar</button></div>}

      {feedback?.explanation&&<aside className="trivia-learning-explanation" role="status"><small>LUPI · APRENDÉ LA JUGADA</small><p>{feedback.explanation}</p><button type="button" disabled={busy} onClick={()=>{window.clearTimeout(feedbackTimer.current);setFeedback(null);if(state?.status==='open'&&!state.mineDone)void load();}}>Continuar →</button></aside>}
      {state && !ended && <div className="tad-progress-row" aria-label="Avance del duelo">
        <span>VOS · {state.myScore} acierto{state.myScore === 1 ? "" : "s"}</span>
        <span>{rivalName.toUpperCase()} · {state.opponentDone ? "ya jugó ✓" : `${state.opponentAnswered}/${state.total} respondidas`}</span>
      </div>}

      {state && !ended && q && !error && <div className="trivia-question" key={qIndex} aria-labelledby="tad-question">
        <div className="trivia-progress">
          <span>PREGUNTA {qIndex + 1} / {state.total}</span>
          {!feedback && <b className={`trivia-clock${remaining <= 5 ? " is-urgent" : ""}`} aria-label={`${remaining} segundos restantes`}>◷ {remaining}s</b>}
        </div>
        <progress value={qIndex + (feedback ? 1 : 0)} max={state.total} aria-label="Preguntas completadas" />
        <h3 id="tad-question">{q.prompt}</h3>
        {feedback && <p className={`tad-feedback ${feedback.ok ? "is-hit" : "is-miss"}`} role="status">{feedback.ok ? "✓ ¡Acertaste! +1" : feedback.timeout ? `⌛ Se acabó el tiempo. Era: ${feedback.options[feedback.correctIndex]}` : `✕ Era: ${feedback.options[feedback.correctIndex]}`}</p>}
        <div className="trivia-options">
          {q.options.map((option, index) => {
            const cls = feedback ? (index === feedback.correctIndex ? "tad-opt--correct" : index === feedback.mine ? "tad-opt--wrong" : "tad-opt--dim") : "";
            return (
              <button key={index} type="button" className={cls} style={{ "--choice-index": index } as React.CSSProperties}
                disabled={busy || !!feedback} onClick={() => void submit(index)}>
                <b>{String.fromCharCode(65 + index)}</b><span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>}

      {state && !ended && !feedback && !state.question && state.mineDone && <div className="tad-wait" role="status">
        <span aria-hidden="true">⏳</span>
        <h3>¡Terminaste!</h3>
        <p>Acertaste {state.myScore} de {state.total}. {rivalName} tiene hasta el {fmtDeadline(state.deadline)} para jugar.</p>
        <p>Cuando juegue vas a ver el resultado en Social y se te acredita el premio.</p>
        <div className="tad-actions"><button type="button" className="trivia-primary" onClick={onExit}>VOLVER AL LOBBY</button></div>
      </div>}

      {ended && state && <>
        <div className={`trivia-result-banner ${win ? "is-win" : state.status !== "finished" ? "is-expired" : ""}`} role="status">
          <span aria-hidden="true">{state.status !== "finished" ? "⌛" : win ? "🏆" : state.winnerId === null ? "🤝" : "👏"}</span>
          <small>RESULTADO FINAL</small>
          <h3>{state.status === "declined" ? "DESAFÍO RECHAZADO" : state.status === "expired" ? "DUELO VENCIDO" : win ? "¡GANASTE!" : state.winnerId === null ? "¡EMPATE!" : "¡BUEN DUELO!"}</h3>
          <p>{state.status === "declined" ? `${rivalName} rechazó el desafío.` : state.status === "expired" ? "Nadie completó el duelo a tiempo." : state.forfeit ? (win ? `${rivalName} no jugó a tiempo.` : "No jugaste a tiempo.") : state.winnerId === null ? "Igualados en aciertos y tiempo." : `${win ? meName : rivalName} se lleva el duelo.`}</p>
        </div>
        {finished && <div className="trivia-score">
          <div className={win ? "is-winner" : ""}><small>VOS</small><strong>{meName}</strong><b>{myFinal ?? 0}</b></div><span>VS</span>
          <div className={finished && state.winnerId === rivalUserId ? "is-winner" : ""}><small>RIVAL</small><strong>{rivalName}</strong><b>{rivalFinal ?? 0}</b></div>
        </div>}
        {finished && state.forfeit && <p className="tad-note" role="status">Ganar o perder por abandono no da premio ni cambia tu racha.</p>}
        {finished && !state.forfeit && <SkillMatchReward game="trivia" matchId={state.id}/>}
        {finished && !state.forfeit && <DuelRewardCard reward={reward} error={rewardError} rivalName={rivalName} gameLabel="Preguntados" />}
        <div className="tad-actions">
          {state.status !== "declined" && rivalUserId && <button type="button" className="trivia-primary" onClick={() => onRematch({ userId: rivalUserId, username: rivalName })}>🔁 REVANCHA POR TURNOS</button>}
          <button type="button" onClick={onExit}>VOLVER AL LOBBY</button>
        </div>
        {finished && state.history && <details className="trivia-summary"><summary><span>ASÍ FUE EL DUELO<small>{state.history.length} preguntas · Ver respuestas</small></span><b aria-hidden="true">⌄</b></summary>
          <div className="trivia-summary-scroll"><table><thead><tr><th scope="col">Pregunta y respuesta correcta</th><th scope="col">Vos</th><th scope="col">Rival</th></tr></thead>
            <tbody>{state.history.map((round, i) => <tr key={i}><td><small>PREGUNTA {i + 1}</small><strong>{round.prompt}</strong><span>✓ {round.correct}</span>{round.explanation&&<p className="trivia-learning-explanation">{round.explanation}</p>}</td>
              <td aria-label={(host ? round.hostOk : round.guestOk) ? "Acertaste" : "No acertaste"}>{(host ? round.hostOk : round.guestOk) ? "✅" : "✕"}</td>
              <td aria-label={(host ? round.guestOk : round.hostOk) ? "Rival acertó" : "Rival no acertó"}>{(host ? round.guestOk : round.hostOk) ? "✅" : "✕"}</td></tr>)}</tbody></table></div>
        </details>}
      </>}
      {ended&&<TriviaLearningHub compact onOpenChange={onLearningOpenChange}/>}
      <p className="trivia-footnote">Duelo por turnos · Premios y rachas de Lupi · Sin puntos para el ranking comunitario.</p>
    </section>
  );
}
