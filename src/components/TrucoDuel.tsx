import { TrucoCard } from "./TrucoCard";
export { TrucoCard } from "./TrucoCard";
import { SkillMatchReward } from "./SkillMatchReward";
import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useTrucoBotMatch } from "../hooks/useTrucoBotMatch";
import { duelFx } from "../lib/duelFx";
import {DuelGameHeader} from './DuelGameHeader';
import { useDuelReward } from '../hooks/useDuelReward';
import { DuelRewardCard } from './DuelRewardCard';
import lupiTrucoAvatar from '../assets/lupi-truco-avatar.png';
import { ENVIDO_NAME, TARGET, TRUCO_NAME, movesFor, envidoPoints, type Card, type EnvidoCall } from "../utils/trucoEngine";
import "./RockPaperScissors.css";
import "./TrucoDuel.css";
import {LupiFace} from "./LupiFace";
import {TrucoMatchResult} from "./TrucoMatchResult";
import { AvatarFace } from "./AvatarFace";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";

type Props = { challenge: Challenge; meId: string; onExit: () => void; onFinished?: (finished: boolean) => void; onRematch?: () => void };

export function TrucoTableSlot({ card, result, seat, mySeat, handNo }: {
  card: Card | null; result: number | "tie" | undefined;
  seat: number; mySeat: number; handNo: number;
}) {
  const resolved = result !== undefined;
  const outcome = result === "tie" ? "tie" : result === mySeat ? "win" : "loss";
  const winner = resolved && result === seat;
  return <div className={`tr-slot tr-table-slot ${resolved ? `tr-table-slot--${outcome}` : ""} ${winner ? "tr-table-slot--winner" : ""}`}
    aria-label={resolved ? result === "tie" ? "Baza empatada" : winner ? "Carta ganadora de la baza" : "Carta superada" : undefined}>
    <TrucoCard key={`${handNo}:${card ? `${card.suit}:${card.num}` : "empty"}`} card={card} played />
    {winner && <em className={`tr-badge tr-badge--${outcome === "win" ? "w" : "l"}`} aria-hidden="true">{outcome === "win" ? "✓" : "✕"}</em>}
    {resolved && result === "tie" && <em className="tr-badge tr-badge--t" aria-hidden="true">=</em>}
  </div>;
}

function TrucoGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const scenes = [
    { kicker: "ESCENA 01 · LA MANO", title: "Repartís tres cartas", body: "Cada mano tiene tres bazas. Elegí una carta para superar la del rival; quien gana dos bazas se lleva la mano.", action: "VER LAS CARTAS", className: "deal", cards: ["6", "1", "10"] },
    { kicker: "ESCENA 02 · EL ENVIDO", title: "Los tantos se cantan antes", body: "Estas dos cartas son del mismo palo: 7 + 5 + 20 = 32 tantos. Las figuras valen cero. El jugador con más tantos gana el envido.", action: "CANTAR ENVIDO", className: "envido", cards: ["7", "5", "10"] },
    { kicker: "ESCENA 03 · LA BAZA", title: "Dos bazas y la mano es tuya", body: "El truco sube el valor de la mano: 2, 3 o 4 puntos. Aprendé también qué cartas son más fuertes.", action: "ENTENDÍ · JUGAR", className: "winner", cards: ["7", "3", "1"] },
  ] as const;
  const scene = scenes[step];
  return <div className="tr-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="tr-guide-title">
    <section className={`tr-guide tr-guide--${scene.className}`}>
      <button type="button" className="tr-guide-close" onClick={onClose} aria-label="Cerrar guía">×</button>
      <div className="tr-guide-progress" aria-label={`Escena ${step + 1} de 3`}>{scenes.map((_, i) => <i key={i} className={i <= step ? "is-on" : ""}/>)}</div>
      <span className="tr-guide-kicker">{scene.kicker}</span>
      <h2 id="tr-guide-title">{scene.title}</h2>
      <p>{scene.body}</p>
      <div className="tr-guide-stage" aria-hidden="true">
        <div className="tr-guide-light"/>
        <div className="tr-guide-cards">{scene.cards.map((card, i) => <span key={i} className={`tr-guide-card tr-guide-card--${i}`}><b>{card}</b><small>{step === 1 ? "ORO" : i === 1 ? "BASTO" : i === 0 ? "COPA" : "ESPADA"}</small></span>)}</div>
        <strong className="tr-guide-callout">{step === 0 ? "ELEGÍ TU CARTA" : step === 1 ? "20 + TANTOS" : "¡GANASTE LA MANO!"}</strong>
      </div>
      {step === 2 && <div className="tr-guide-ranking"><b>FUERZA DE CARTAS</b><span>1 de espada</span><i>›</i><span>1 de basto</span><i>›</i><span>7 de espada</span><i>›</i><span>7 de oro</span><small>Después siguen 3 · 2 · 1 de copa/oro · 12 · 11 · 10 · 7 de copa/basto · 6 · 5 · 4</small></div>}
      <button type="button" className="tr-guide-next" onClick={() => step < scenes.length - 1 ? setStep(step + 1) : onClose()}>{scene.action} <span>→</span></button>
      <small className="tr-guide-hint">Podés volver a abrir esta guía cuando quieras.</small>
    </section>
  </div>;
}

export function TrucoDuel({ challenge, meId, onExit, onFinished, onRematch }: Props) {
  const { appearance } = useAvatarAppearance(meId);
  const { state, thinking, act, ready, busy, error: connectionError, reconnect } = useTrucoBotMatch(challenge.botIndex, challenge.id);
  const moves = movesFor(state, 0);
  const finished = ready && state.phase === "finished";
  const handOver = ready && state.phase === "hand-over";
  const myName = challenge.fromId === meId ? challenge.fromName : challenge.toName;
  const rivalName = challenge.fromId === meId ? challenge.toName : challenge.fromName;
  const [bubble, setBubble] = useState<{ seat: 0 | 1; text: string; n: number } | null>(null);
  const [showEnvido, setShowEnvido] = useState(false);
  const [reaction, setReaction] = useState<"approve" | "shy" | null>(null);
  // Depend on the result identity, not the full state, so play cannot restart the timer.
  const envidoNoticeKey = state.envidoResult
    ? `${challenge.id}:${state.handNo}:${state.envidoResult.winner}:${state.envidoResult.stake}` : "";
  useEffect(() => {
    setShowEnvido(!!envidoNoticeKey);
    if (!envidoNoticeKey) return;
    const timer = window.setTimeout(() => setShowEnvido(false), 2800);
    return () => window.clearTimeout(timer);
  }, [envidoNoticeKey]);
  const lastTrick = state.trickResults[state.trickResults.length - 1];
  const reactionWinner = state.handResult?.winner ?? lastTrick;
  useEffect(() => {
    if (reactionWinner === undefined || reactionWinner === "tie") { setReaction(null); return; }
    setReaction(reactionWinner === 1 ? "approve" : "shy");
    const timer = window.setTimeout(() => setReaction(null), 2200);
    return () => window.clearTimeout(timer);
  }, [challenge.id, state.handNo, state.trickResults.length, reactionWinner]);
  const rivalPose = bubble?.seat === 1
    ? /no quiero|mazo/i.test(bubble.text) ? "shy" : "compete"
    : reaction ?? (thinking ? "thinking" : "guide");
  const botResult = finished ? (state.winner === 0 ? 'win' : 'loss') as 'win'|'loss' : undefined;
  const { reward, error: rewardError, retry: retryReward } = useDuelReward('truco', challenge.id, finished, { vsBot: true, botResult });
  const [showRules,setShowRules]=useState(false);
  const [tableGlow, setTableGlow] = useState(0);
  const [intro, setIntro] = useState(true);
  const seenCards = useRef(new Set<string>());
  const seenTricks = useRef(new Set<string>());
  const seenHands = useRef(new Set<number>());
  useEffect(() => {
    setIntro(true);
    seenCards.current.clear(); seenTricks.current.clear(); seenHands.current.clear();
    if (!ready) return;
    const t = window.setTimeout(() => setIntro(false), 3200);
    return () => window.clearTimeout(t);
  }, [challenge.id, ready]);
  useEffect(() => {
    if (intro) return;
    state.table.forEach((row, seat) => row.forEach((card, index) => {
      if (!card) return;
      const key = `${state.handNo}:${seat}:${index}`;
      if (seenCards.current.has(key)) return;
      seenCards.current.add(key);
      if (card.suit === 'espada' && (card.num === 1 || card.num === 7)) setTableGlow(value => value + 1);
    }));
    state.trickResults.forEach((result, index) => {
      const key = `${state.handNo}:${index}`;
      if (result === undefined || seenTricks.current.has(key)) return;
      seenTricks.current.add(key);
      duelFx.reveal(result === 'tie' ? 'tie' : result === 0 ? 'win' : 'lose');
      if (result === 0) setTableGlow(value => value + 1);
    });
    if (handOver && state.handResult && !seenHands.current.has(state.handNo)) {
      seenHands.current.add(state.handNo);
      if (state.handResult.winner === 0) setTableGlow(value => value + 1);
    }
  }, [intro, state.table, state.trickResults, state.handNo, handOver, state.handResult]);
  useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[]);

  useEffect(() => { onFinished?.(finished); }, [finished, onFinished]);
  useEffect(() => {
    const sh = state.lastShout;
    if (!sh) return;
    setBubble(sh);
    duelFx.shout();
    if (sh.seat === 1) duelFx.tap();
    const t = window.setTimeout(() => setBubble((b) => (b?.n === sh.n ? null : b)), 1800);
    return () => window.clearTimeout(t);
  }, [state.lastShout?.n]);
  useEffect(() => {
    if (finished && state.winner !== null) duelFx.result(state.winner === 0 ? "win" : "loss");
  }, [finished, state.winner]);

  const pend = state.pending;
  const answering = !!pend && moves.accept;
  const waitingRival = !!pend && !answering;
  const myTurn = !pend && state.turn === 0 && state.phase === "playing";
  const outcome = state.winner === 0 ? "win" : "loss";
  const play = (i: number) => { duelFx.tap(); act({ t: "play", card: i }); };
  const call = (kind: EnvidoCall) => act({ t: "envido", kind });

  let status = "Pensando…";
  if (finished) status = state.winner === 0 ? "¡GANASTE EL DUELO!" : "ESTA VEZ NO FUE";
  else if (handOver) status = state.handResult?.winner === 0 ? "¡MANO TUYA!" : "MANO DEL RIVAL";
  else if (answering) status = pend!.kind === "truco" ? `El rival cantó ${TRUCO_NAME[pend!.level]}. ¿Qué respondés?` : `El rival cantó ${pend!.calls.map((c) => ENVIDO_NAME[c]).join(" + ")}. ¿Qué respondés?`;
  else if (waitingRival) status = "Esperando respuesta del rival…";
  else if (myTurn) status = state.trick === 0 && state.mano===0 && !state.table[0][0] ? "Sos mano · tirá una carta" : "Tu turno · elegí una carta";
  else if (thinking) status = `${rivalName} está pensando…`;


  const dots = (n: number) => Array.from({ length: TARGET }, (_, i) => <i key={i} className={i < n ? "on" : ""} />);

  if (!ready) return <div className="tr-bot-connection tr-loading" role="status" aria-live="polite"><div className="tr-loading__duel" aria-label={`${myName} contra ${rivalName}`}><div className="tr-loading__fighter tr-loading__fighter--me"><span className="tr-loading__label">VOS</span><div className="tr-loading__portrait"><AvatarFace mood={ready ? "focus" : "presentation"} appearance={appearance}/></div><strong>{myName}</strong></div><b className="tr-loading__versus" aria-hidden="true">VS</b><div className="tr-loading__fighter tr-loading__fighter--rival"><span className="tr-loading__label">RIVAL</span><div className="tr-loading__portrait"><LupiFace pose={connectionError ? "shy" : "compete"}/></div><strong>{rivalName}</strong></div></div><div className="tr-loading__copy"><small>LUPITRUCO · LA MESA TE ESPERA</small><h2>{connectionError ? "Pausa en la previa" : "¡Se viene el duelo!"}</h2><p>{connectionError ? "No pudimos conectar con la mesa. Volvé a intentarlo." : "Lupi está preparando las cartas. Enseguida jugás."}</p>{!connectionError && <div className="tr-loading__signal" aria-label="Conectando"><i/><i/><i/><span>CONECTANDO CON LA MESA</span></div>}</div><div className="tr-loading__actions">{connectionError && <button type="button" onClick={reconnect}>REINTENTAR</button>}<button type="button" onClick={onExit}>VOLVER AL CLUB</button></div></div>;

  return (
    <section className={`rps-arena tr-arena ${finished ? "is-complete" : ""}`} data-outcome={finished ? outcome : undefined} aria-label="Truco">
      {intro && <div className="tr-rivalry" role="dialog" aria-modal="true" aria-label="Previa del duelo de Truco">
        <div className="tr-rivalry__rays" aria-hidden="true"/>
        <div className="tr-rivalry__closeups" aria-hidden="true"><div><AvatarFace mood={ready ? "focus" : "presentation"} appearance={appearance}/></div><div><LupiFace pose="compete"/></div></div>
        <div className="tr-rivalry__duel"><div className="tr-rivalry__panel tr-rivalry__panel--me"><span>EL DESAFÍO ES TUYO</span><div className="tr-rivalry__body"><AvatarFace mood="presentation" appearance={appearance}/></div><strong>{myName}</strong></div><div className="tr-rivalry__panel tr-rivalry__panel--rival"><span>LA MESA TIENE RIVAL</span><div className="tr-rivalry__body"><LupiFace pose="compete"/></div><strong>{rivalName}</strong></div></div>
        <div className="tr-rivalry__impact"><b>VS</b><strong>¡QUE HABLEN LAS CARTAS!</strong></div>
        <button type="button" className="tr-rivalry__skip" onClick={()=>setIntro(false)}>SALTAR PREVIA →</button>
      </div>}
      <DuelGameHeader game="truco" onBack={onExit} title={<>TRUCO <em>ARGENTINO</em></>} subtitle="CARTAS, CANTOS Y ESTRATEGIA" mode="VS BOT · PRÁCTICA"/>
      <div className="tr-help"><button type="button" aria-label="Ayuda: cómo jugar al truco" title="Cómo jugar" aria-expanded={showRules} onClick={()=>setShowRules(value=>!value)}>?</button></div>
      {showRules&&<TrucoGuide onClose={()=>setShowRules(false)}/>} 

      <div className="tr-table">
        {tableGlow > 0 && <span key={tableGlow} className="tr-table-glow" aria-hidden="true"/>}
      <div className="tr-score" aria-live="polite">
        <div className="tr-score-player"><div className="tr-score-main"><div className="tr-score-identity"><div className="tr-avatar"><AvatarFace mood={handOver && state.handResult?.winner===0 ? "celebrate" : "focus"} appearance={appearance}/></div><strong className="tr-score-name">{myName}</strong></div><b>{state.scores[0]}</b></div><span className="tr-dots">{dots(state.scores[0])}</span></div>
        <div className="tr-target">A {TARGET}<small>MANO {state.handNo}</small></div>
        <div className="tr-score-player"><div className="tr-score-main"><div className="tr-score-identity"><span className="tr-bot-expression"><LupiFace pose={rivalPose}/></span><strong className="tr-score-name">{rivalName}</strong></div><b>{state.scores[1]}</b></div><span className="tr-dots tr-dots--rival">{dots(state.scores[1])}</span></div>
      </div>


        <div className="tr-row tr-row--rival">
          <div className="tr-hand" role="group" aria-label="Cartas ocultas del rival">{state.hands[1].map((_, i) => <TrucoCard key={i} back />)}</div>
          <div className="tr-played">{[0, 1, 2].map((i) => <TrucoTableSlot key={`${state.handNo}:${i}`} card={state.table[1][i] ?? null} result={state.trickResults[i]} seat={1} mySeat={0} handNo={state.handNo} />)}</div>
          {bubble?.seat === 1 && <div key={bubble.n} className="tr-bubble tr-bubble--rival"><span className="tr-shout-face"><LupiFace pose={rivalPose}/></span><span>{bubble.text}</span></div>}
        </div>
        <div className={`tr-felt tr-felt--${answering ? 'answer' : myTurn ? 'turn' : handOver ? 'result' : 'wait'}`} role="status"><div className="tr-director"><span className="tr-director__eyebrow">{answering ? '¡EL RIVAL SUBE LA APUESTA!' : handOver ? 'BAZA FINALIZADA' : myTurn ? 'VOS DECIDÍS LA JUGADA' : 'DUELO EN CURSO'}</span><img className="tr-director__lupi" src={lupiTrucoAvatar} alt=""/><span>{state.truco.level ? `${TRUCO_NAME[state.truco.level]} · vale ${state.truco.level + 1}` : "MANO · vale 1"}</span><h3>{status}</h3><p className="tr-director__instruction">{answering ? 'Elegí QUIERO para aceptar o NO QUIERO para rechazar en la botonera.' : myTurn ? 'Elegí una de tus cartas de abajo para jugarla. También podés cantar antes de tirar.' : handOver ? 'Revisá el resultado y continuá con la siguiente mano.' : waitingRival ? 'El rival está evaluando tu canto. Esperá su respuesta.' : 'Mirá la carta del rival y prepará tu próxima jugada.'}</p></div>{showEnvido && state.envidoResult && !finished && !handOver && <div className={`tr-envido-live tr-envido-live--${state.envidoResult.winner === 0 ? "me" : "rival"}`}><b>ENVIDO</b><strong>{state.envidoResult.winner === 0 ? `Gana ${myName}` : `Gana ${rivalName}`}</strong><span>{state.envidoResult.points[0]} vos · {state.envidoResult.points[1]} rival · +{state.envidoResult.stake}</span></div>}</div>
        <div className="tr-row tr-row--me">
          <div className="tr-played">{[0, 1, 2].map((i) => <TrucoTableSlot key={`${state.handNo}:${i}`} card={state.table[0][i] ?? null} result={state.trickResults[i]} seat={0} mySeat={0} handNo={state.handNo} />)}</div>
          {bubble?.seat === 0 && <div key={bubble.n} className="tr-bubble tr-bubble--me"><span className="tr-shout-face"><AvatarFace mood="focus" appearance={appearance}/></span><span>{bubble.text}</span></div>}
        </div>
      </div>

      {!finished && !handOver && (
        <div className="tr-mine">
          <span className="tr-envido-hint">TUS CARTAS · {envidoPoints(state.dealt[0])} DE ENVIDO</span>
          <div className="tr-hand tr-hand--mine">{state.hands[0].map((c, i) => <TrucoCard key={`${c.suit}${c.num}`} card={c} onClick={() => play(i)} disabled={busy || !!connectionError || intro || !moves.play.includes(i)} />)}</div>
          <div className="tr-actions">{connectionError && <div role="alert">No pudimos confirmar la jugada. <button type="button" onClick={reconnect}>RECONECTAR</button></div>}
            {answering && <>
              <button type="button" className="is-yes" onClick={() => act({ t: "accept" })}>QUIERO</button>
              <button type="button" className="is-no" onClick={() => act({ t: "decline" })}>NO QUIERO</button>
              {moves.truco && <button type="button" onClick={() => act({ t: "truco" })}>QUIERO {TRUCO_NAME[moves.truco]}</button>}
              {moves.envido.map((k) => <button type="button" key={k} onClick={() => call(k)}>{pend!.kind === "truco" ? "ENVIDO ESTÁ PRIMERO: " : ""}{ENVIDO_NAME[k]}</button>)}
            </>}
            {!pend && myTurn && <>
              {moves.truco && <button type="button" className="is-truco" onClick={() => act({ t: "truco" })}>{TRUCO_NAME[moves.truco]}</button>}
              {moves.envido.map((k) => <button type="button" key={k} onClick={() => call(k)}>{ENVIDO_NAME[k]}</button>)}
              <button type="button" className="is-fold" onClick={() => act({ t: "fold" })}>IR AL MAZO</button>
            </>}
          </div>
        </div>
      )}

      {handOver && state.handResult && (
        <div className="tr-summary" role="status">
          <h3 data-win={state.handResult.winner === 0}>{state.handResult.winner === 0 ? "¡Mano tuya!" : "Mano del rival"} · +{state.handResult.points}</h3>
          <p>{state.handResult.reason}</p>
          {state.envidoResult && <p>Envido: vos {state.envidoResult.points[0]} · rival {state.envidoResult.points[1]}</p>}
          <p className="tr-rivalcards">Cartas del rival: {state.dealt[1].map((c) => `${c.num} de ${c.suit}`).join(" · ")}</p>
          <button type="button" className="duel-rematch" onClick={() => act({ t: "next" })}>SIGUIENTE MANO →</button>
        </div>
      )}

      {handOver && state.handResult && <div className="tr-hand-result-overlay" role="dialog" aria-modal="true" aria-labelledby="tr-hand-result-title">
        <div className={`tr-hand-result-modal tr-hand-result-modal--${state.handResult.winner === 0 ? "me" : "rival"}`}>
          <span className="tr-hand-result-kicker">CIERRE DE LA MANO {state.handNo}</span>
          <h2 id="tr-hand-result-title">{state.handResult.winner === 0 ? "¡MANO TUYA!" : "MANO DEL RIVAL"}</h2>
          <p className="tr-hand-result-reason">{state.handResult.reason}</p>
          <div className="tr-hand-result-cards"><div><small>RIVAL</small>{state.table[1].filter(Boolean).map((c,i)=><TrucoCard key={i} card={c} played />)}</div><span>VS</span><div><small>VOS</small>{state.table[0].filter(Boolean).map((c,i)=><TrucoCard key={i} card={c} played />)}</div></div>
          <div className="tr-hand-result-points">{state.handResult.winner === 0 ? "Vos sumás" : `${rivalName} suma`} {state.handResult.points} {state.handResult.points === 1 ? "punto" : "puntos"}</div>
          <div className="tr-hand-score" aria-label="Marcador actualizado"><div><span>VOS · {myName}</span><b>{state.scores[0]}</b></div><span>A {TARGET}</span><div><span>{rivalName}</span><b>{state.scores[1]}</b></div></div>
          {state.envidoResult && <div className="tr-hand-result-envido"><b>ENVIDO</b><span>{state.envidoResult.winner === 0 ? myName : rivalName} ganó con {state.envidoResult.points[state.envidoResult.winner]} tantos</span><small>{state.envidoResult.points[0]} vos · {state.envidoResult.points[1]} rival · +{state.envidoResult.stake}</small></div>}
          <button type="button" className="duel-rematch" onClick={() => act({ t: "next" })}>SIGUIENTE MANO →</button>
        </div>
      </div>}

      {finished && <TrucoMatchResult meId={meId} myName={myName} rivalName={rivalName} myScore={state.scores[0]} rivalScore={state.scores[1]} won={state.winner===0} onExit={onExit} onRematch={onRematch}><DuelRewardCard reward={reward} error={rewardError} onRetry={retryReward} rivalName={rivalName} gameLabel="Truco"/>{reward?.ok && <SkillMatchReward game="truco" matchId={challenge.id} userId={meId}/>}</TrucoMatchResult>}

      <ul className="tr-log" aria-label="Historial">{state.log.slice(-3).map((l, i) => <li key={i} data-tone={l.tone}>{l.text}</li>)}</ul>
      <footer className="rps-rule">TRUCO · ENVIDO · SIN FLOR <span>A {TARGET} PUNTOS · 3 BAZAS POR MANO</span></footer>
    </section>
  );
}
