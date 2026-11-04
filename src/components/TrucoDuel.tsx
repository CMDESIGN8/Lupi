import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useTrucoBotMatch } from "../hooks/useTrucoBotMatch";
import { DuelResultEffects } from "./DuelResultEffects";
import { duelFx } from "../lib/duelFx";
import {DuelGameHeader} from './DuelGameHeader';
import { useDuelReward } from '../hooks/useDuelReward';
import { DuelRewardCard } from './DuelRewardCard';
import {OwnedCardPortrait} from './OwnedCardPortrait';
import {LupiStoryPose} from './LupiStoryPose';
import lupiTrucoAvatar from '../assets/lupi-truco-avatar.png';
import { ENVIDO_NAME, TARGET, TRUCO_NAME, movesFor, envidoPoints, type Card, type EnvidoCall } from "../utils/trucoEngine";
import "./RockPaperScissors.css";
import "./TrucoDuel.css";

type Props = { challenge: Challenge; meId: string; onExit: () => void; onFinished?: (finished: boolean) => void; onRematch?: () => void };

const SUIT: Record<Card["suit"], { icon: string; name: string }> = {
  espada: { icon: "⚔️", name: "espada" }, basto: { icon: "🪵", name: "basto" },
  oro: { icon: "🪙", name: "oro" }, copa: { icon: "🏆", name: "copa" },
};

const TRUCO_CARD_ART = import.meta.glob("../assets/truco-cards/cards/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function TrucoCard({ card, back, onClick, disabled, played }: { card?: Card | null; back?: boolean; onClick?: () => void; disabled?: boolean; played?: boolean }) {
  if (!card || back) return <span className={`tr-card tr-card--back${card === null ? " is-empty" : ""}`} aria-hidden="true" />;
  const s = SUIT[card.suit];
  const art = TRUCO_CARD_ART[`../assets/truco-cards/cards/${String(card.num).padStart(2, "0")}-${card.suit}.webp`];
  const body = <>{art && <img className="tr-card__art" src={art} alt="" draggable={false} />}<b>{card.num}</b><i aria-hidden="true">{s.icon}</i><small>{s.name}</small></>;
  const label = `${card.num} de ${s.name}`;
  return onClick
    ? <button type="button" className={`tr-card tr-card--${card.suit}${art ? " tr-card--illustrated" : ""}`} onClick={onClick} disabled={disabled} aria-label={`Jugar ${label}`}>{body}</button>
    : <span className={`tr-card tr-card--${card.suit}${art ? " tr-card--illustrated" : ""}${played ? " is-played" : ""}`} role="img" aria-label={label}>{body}</span>;
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
  const { state, thinking, act } = useTrucoBotMatch(challenge.botIndex);
  const moves = movesFor(state, 0);
  const finished = state.phase === "finished";
  const handOver = state.phase === "hand-over";
  const myName = challenge.fromId === meId ? challenge.fromName : challenge.toName;
  const rivalName = challenge.fromId === meId ? challenge.toName : challenge.fromName;
  const [bubble, setBubble] = useState<{ seat: 0 | 1; text: string; n: number } | null>(null);
  const botResult = finished ? (state.winner === 0 ? 'win' : 'loss') as 'win'|'loss' : undefined;
  const { reward, error: rewardError } = useDuelReward('truco', challenge.id, finished, { vsBot: true, botResult });
  const [showRules,setShowRules]=useState(false);
  const lastN = useRef(0);
  useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[]);

  useEffect(() => { onFinished?.(finished); }, [finished, onFinished]);
  useEffect(() => {
    const sh = state.lastShout;
    if (!sh || sh.n === lastN.current) return;
    lastN.current = sh.n; setBubble(sh);
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

  const trickBadge = (i: number) => { const r = state.trickResults[i]; return r === undefined ? "" : r === "tie" ? "=" : r === 0 ? "✓" : "✗"; };
  const dots = (n: number) => Array.from({ length: TARGET }, (_, i) => <i key={i} className={i < n ? "on" : ""} />);

  return (
    <section className={`rps-arena tr-arena ${finished ? "is-complete" : ""}`} data-outcome={finished ? outcome : undefined} aria-label="Truco">
      {finished && <DuelResultEffects key={challenge.id} outcome={outcome} />}
      <DuelGameHeader game="truco" onBack={onExit} title={<>TRUCO <em>ARGENTINO</em></>} subtitle="CARTAS, CANTOS Y ESTRATEGIA" mode="VS BOT · PRÁCTICA"/>
      <div className="tr-help"><span>A 15 · Sin flor · Sin premios</span><button type="button" aria-expanded={showRules} onClick={()=>setShowRules(value=>!value)}>¿Cómo se juega?</button></div>
      {showRules&&<TrucoGuide onClose={()=>setShowRules(false)}/>} 

      <div className="tr-score" aria-live="polite">
        <div className="tr-score-player"><div className="tr-score-main"><div className="tr-score-identity"><div className="tr-avatar"><OwnedCardPortrait userId={meId}/></div><strong className="tr-score-name">{myName}</strong></div><b>{state.scores[0]}</b></div><span className="tr-dots">{dots(state.scores[0])}</span></div>
        <div className="tr-target">A {TARGET}<small>MANO {state.handNo}</small></div>
        <div className="tr-score-player"><div className="tr-score-main"><div className="tr-score-identity"><LupiStoryPose pose={finished&&state.winner===1?'celebrate':thinking?'determined':'explain'} className="tr-avatar"/><strong className="tr-score-name">{rivalName}</strong></div><b>{state.scores[1]}</b></div><span className="tr-dots tr-dots--rival">{dots(state.scores[1])}</span></div>
      </div>

      <div className="tr-table">
        <div className="tr-row tr-row--rival">
          <div className="tr-hand" role="group" aria-label="Cartas ocultas del rival">{state.hands[1].map((_, i) => <TrucoCard key={i} back />)}</div>
          <div className="tr-played">{[0, 1, 2].map((i) => <div key={i} className="tr-slot"><TrucoCard card={state.table[1][i] ?? null} played />{trickBadge(i) && <em className={`tr-badge tr-badge--${state.trickResults[i] === 1 ? "w" : state.trickResults[i] === 0 ? "l" : "t"}`}>{trickBadge(i)}</em>}</div>)}</div>
          {bubble?.seat === 1 && <div key={bubble.n} className="tr-bubble tr-bubble--rival"><span className="tr-bubble__avatar tr-bubble__avatar--lupi"><img src={lupiTrucoAvatar} alt="Lupi"/></span><span>{bubble.text}</span></div>}
        </div>
        <div className="tr-felt" role="status"><span>{state.truco.level ? `${TRUCO_NAME[state.truco.level]} · vale ${state.truco.level + 1}` : "MANO · vale 1"}</span><h3>{status}</h3>{state.envidoResult && !finished && <div className={`tr-envido-live tr-envido-live--${state.envidoResult.winner === 0 ? "me" : "rival"}`}><b>ENVIDO</b><strong>{state.envidoResult.winner === 0 ? `Gana ${myName}` : `Gana ${rivalName}`}</strong><span>{state.envidoResult.points[0]} vos · {state.envidoResult.points[1]} rival · +{state.envidoResult.stake}</span></div>}</div>
        <div className="tr-row tr-row--me">
          <div className="tr-played">{[0, 1, 2].map((i) => <div key={i} className="tr-slot"><TrucoCard card={state.table[0][i] ?? null} played /></div>)}</div>
          {bubble?.seat === 0 && <div key={bubble.n} className="tr-bubble tr-bubble--me"><OwnedCardPortrait userId={meId}/><span>{bubble.text}</span></div>}
        </div>
      </div>

      {!finished && !handOver && (
        <div className="tr-mine">
          <span className="tr-envido-hint">TUS CARTAS · {envidoPoints(state.dealt[0])} DE ENVIDO</span>
          <div className="tr-hand tr-hand--mine">{state.hands[0].map((c, i) => <TrucoCard key={`${c.suit}${c.num}`} card={c} onClick={() => play(i)} disabled={!moves.play.includes(i)} />)}</div>
          <div className="tr-actions">
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
          <div className="tr-hand-result-points">+{state.handResult.points} {state.handResult.points === 1 ? "PUNTO" : "PUNTOS"}</div>
          {state.envidoResult && <div className="tr-hand-result-envido"><b>ENVIDO</b><span>{state.envidoResult.winner === 0 ? myName : rivalName} ganó con {state.envidoResult.points[state.envidoResult.winner]} tantos</span><small>{state.envidoResult.points[0]} vos · {state.envidoResult.points[1]} rival · +{state.envidoResult.stake}</small></div>}
          <button type="button" className="duel-rematch" onClick={() => act({ t: "next" })}>SIGUIENTE MANO →</button>
        </div>
      </div>}

      {finished && (
        <div className="rps-finish">
          <p className="rps-winner-name">{state.winner === 0 ? myName : rivalName} SE LLEVA EL DUELO · {state.scores[0]} a {state.scores[1]}</p>
          <DuelRewardCard reward={reward} error={rewardError} rivalName={rivalName} gameLabel="Truco"/>
          {onRematch && <button className="duel-rematch" type="button" onClick={onRematch}>OTRA PARTIDA · REVANCHA ↻</button>}
          <button className="rps-exit" type="button" onClick={onExit}>VOLVER AL CLUB →</button>
        </div>
      )}

      <ul className="tr-log" aria-label="Historial">{state.log.slice(-3).map((l, i) => <li key={i} data-tone={l.tone}>{l.text}</li>)}</ul>
      <footer className="rps-rule">TRUCO · ENVIDO · SIN FLOR <span>A {TARGET} PUNTOS · 3 BAZAS POR MANO</span></footer>
    </section>
  );
}
