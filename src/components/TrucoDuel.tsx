import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useTrucoBotMatch } from "../hooks/useTrucoBotMatch";
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
import {TrucoMatchResult} from "./TrucoMatchResult";
import { AvatarFace } from "./AvatarFace";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";

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

const TRUCO_PIP_LAYOUTS: Record<2 | 3 | 4 | 5 | 6 | 7, [number, number][]> = {
  2: [[1, 2], [3, 2]],
  3: [[1, 2], [2, 2], [3, 2]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
  7: [[1, 1], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 3]],
};

function TrucoPipIcon({ suit }: { suit: Card["suit"] }) {
  if (suit === "espada") return <svg viewBox="0 0 48 64" aria-hidden="true"><path d="M24 3 35 29 28 27 28 43 20 43 20 27 13 29Z" fill="#eafaff" stroke="#5ca8c0" strokeWidth="2"/><path d="m24 8 4 19-4-2-4 2Z" fill="#54eaff"/><path d="M11 42Q24 35 37 42L32 49 27 46 27 56 32 60 16 60 21 56 21 46 16 49Z" fill="#f6c943" stroke="#905f17" strokeWidth="2"/><path d="M20 43h8v4h-8z" fill="#fff0a1"/></svg>;
  if (suit === "basto") return <svg viewBox="0 0 48 64" aria-hidden="true"><path d="M22 61 23 15Q24 8 29 8L28 20Q34 13 42 15 40 23 29 27L28 38Q34 31 41 33 39 42 28 46L28 61Z" fill="#a96431" stroke="#57351e" strokeWidth="2.5" strokeLinejoin="round"/><path d="M10 26Q9 20 14 20L22 25 21 32 14 30 12 44Q10 48 7 44Z" fill="#c48647" stroke="#694323" strokeWidth="2"/><path d="M17 55h15v6H17z" fill="#e3bb4f" stroke="#80541b" strokeWidth="2"/><path d="M25 12 24 56" stroke="#edc267" strokeWidth="1.5" opacity=".8"/></svg>;
  if (suit === "oro") return <svg viewBox="0 0 48 64" aria-hidden="true"><circle cx="24" cy="31" r="20" fill="#e2a327" stroke="#70420f" strokeWidth="3"/><circle cx="24" cy="31" r="15.5" fill="#ffd95d" stroke="#fff0a0" strokeWidth="2"/><circle cx="24" cy="31" r="9" fill="#cf841b" stroke="#9a5c13"/><path d="m24 23 2.3 5 5.5.7-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.5-.7Z" fill="#fff0a0"/><circle cx="24" cy="31" r="2" fill="#fff9d4"/></svg>;
  return <svg viewBox="0 0 48 64" aria-hidden="true"><path d="M12 12Q8 10 7 15L9 21 17 29 19 42 13 51Q11 56 18 57H30Q37 56 35 51L29 42 31 29 39 21 41 15Q40 10 36 12L29 18H19Z" fill="#f2c74e" stroke="#8a5a16" strokeWidth="2.5" strokeLinejoin="round"/><path d="M17 23h14l-2 16H19Z" fill="#31c9d1" stroke="#167879" strokeWidth="2"/><path d="M20 57h8v4h-8z" fill="#e4b943" stroke="#80541c" strokeWidth="2"/><path d="M17 22 12 16m19 6 5-6" stroke="#fff0a1" strokeWidth="2" strokeLinecap="round"/><circle cx="24" cy="30" r="3" fill="#fff7cf"/></svg>;
}

function TrucoPipFace({ card }: { card: Card & { num: 2 | 3 | 4 | 5 | 6 | 7 } }) {
  const marks = TRUCO_PIP_LAYOUTS[card.num];
  return <span className={`tr-pip-face tr-pip-face--${card.suit}`} aria-hidden="true">
    <span className="tr-pip-face__frame" />
    <span className="tr-pip-face__corner tr-pip-face__corner--top"><b>{card.num}</b><TrucoPipIcon suit={card.suit}/></span>
    <span className="tr-pip-face__marks">{marks.map(([row, column], i) => <span key={i} style={{ gridRow: row, gridColumn: column }}><TrucoPipIcon suit={card.suit}/></span>)}</span>
    <span className="tr-pip-face__corner tr-pip-face__corner--bottom"><b>{card.num}</b><TrucoPipIcon suit={card.suit}/></span>
  </span>;
}

export function TrucoCard({ card, back, onClick, disabled, played }: { card?: Card | null; back?: boolean; onClick?: () => void; disabled?: boolean; played?: boolean }) {
  if (!card || back) return <span className={`tr-card tr-card--back${card === null ? " is-empty" : ""}`} aria-hidden="true" />;
  const s = SUIT[card.suit];
  const art = TRUCO_CARD_ART[`../assets/truco-cards/cards/${String(card.num).padStart(2, "0")}-${card.suit}.webp`];
  const pipCard = card.num >= 2 && card.num <= 7;
  const body = <>{pipCard ? <TrucoPipFace card={card as Card & { num: 2 | 3 | 4 | 5 | 6 | 7 }}/> : art && <img className="tr-card__art" src={art} alt="" draggable={false} />}<b>{card.num}</b><i aria-hidden="true">{s.icon}</i><small>{s.name}</small></>;
  const label = `${card.num} de ${s.name}`;
  return onClick
    ? <button type="button" className={`tr-card tr-card--${card.suit}${art || pipCard ? " tr-card--illustrated" : ""}${pipCard ? " tr-card--pips" : ""}`} onClick={onClick} disabled={disabled} aria-label={`Jugar ${label}`}>{body}</button>
    : <span className={`tr-card tr-card--${card.suit}${art || pipCard ? " tr-card--illustrated" : ""}${pipCard ? " tr-card--pips" : ""}${played ? " is-played" : ""}`} role="img" aria-label={label}>{body}</span>;
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
  const [tableGlow, setTableGlow] = useState(0);
  const [intro, setIntro] = useState(true);
  const seenCards = useRef(new Set<string>());
  const seenTricks = useRef(new Set<string>());
  const seenHands = useRef(new Set<number>());
  useEffect(() => {
    setIntro(true);
    seenCards.current.clear(); seenTricks.current.clear(); seenHands.current.clear();
    const t = window.setTimeout(() => setIntro(false), 1500);
    return () => window.clearTimeout(t);
  }, [challenge.id]);
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
    if (!sh || sh.n === lastN.current) return;
    lastN.current = sh.n; setBubble(sh);
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

  const trickBadge = (i: number) => { const r = state.trickResults[i]; return r === undefined ? "" : r === "tie" ? "=" : r === 0 ? "✓" : "✗"; };
  const dots = (n: number) => Array.from({ length: TARGET }, (_, i) => <i key={i} className={i < n ? "on" : ""} />);

  return (
    <section className={`rps-arena tr-arena ${finished ? "is-complete" : ""}`} data-outcome={finished ? outcome : undefined} aria-label="Truco">
      {intro && <div className="tr-versus" role="status" aria-label="Comienza el duelo de truco">
        <div className="tr-versus__player"><AvatarFace appearance={appearance} className="tr-speaking-face"/><strong>{myName}</strong></div>
        <b className="tr-versus__title">¡TRUCO!</b>
        <div className="tr-versus__rival"><img src={lupiTrucoAvatar} alt="Lupi"/><strong>{rivalName}</strong></div>
      </div>}
      <DuelGameHeader game="truco" onBack={onExit} title={<>TRUCO <em>ARGENTINO</em></>} subtitle="CARTAS, CANTOS Y ESTRATEGIA" mode="VS BOT · PRÁCTICA"/>
      <div className="tr-help"><button type="button" aria-label="Ayuda: cómo jugar al truco" title="Cómo jugar" aria-expanded={showRules} onClick={()=>setShowRules(value=>!value)}>?</button></div>
      {showRules&&<TrucoGuide onClose={()=>setShowRules(false)}/>} 

      <div className="tr-table">
        {tableGlow > 0 && <span key={tableGlow} className="tr-table-glow" aria-hidden="true"/>}
      <div className="tr-score" aria-live="polite">
        <div className="tr-score-player"><div className="tr-score-main"><div className="tr-score-identity"><div className="tr-avatar"><OwnedCardPortrait userId={meId}/></div><strong className="tr-score-name">{myName}</strong></div><b>{state.scores[0]}</b></div><span className="tr-dots">{dots(state.scores[0])}</span></div>
        <div className="tr-target">A {TARGET}<small>MANO {state.handNo}</small></div>
        <div className="tr-score-player"><div className="tr-score-main"><div className="tr-score-identity"><LupiStoryPose pose={finished&&state.winner===1?'celebrate':thinking?'determined':'explain'} className="tr-avatar"/><strong className="tr-score-name">{rivalName}</strong></div><b>{state.scores[1]}</b></div><span className="tr-dots tr-dots--rival">{dots(state.scores[1])}</span></div>
      </div>


        <div className="tr-row tr-row--rival">
          <div className="tr-hand" role="group" aria-label="Cartas ocultas del rival">{state.hands[1].map((_, i) => <TrucoCard key={i} back />)}</div>
          <div className="tr-played">{[0, 1, 2].map((i) => <div key={i} className="tr-slot"><TrucoCard card={state.table[1][i] ?? null} played />{trickBadge(i) && <em className={`tr-badge tr-badge--${state.trickResults[i] === 0 ? "w" : state.trickResults[i] === 1 ? "l" : "t"}`}>{trickBadge(i)}</em>}</div>)}</div>
          {bubble?.seat === 1 && <div key={bubble.n} className="tr-bubble tr-bubble--rival"><span className="tr-bubble__avatar tr-bubble__avatar--lupi"><img src={lupiTrucoAvatar} alt="Lupi"/></span><span>{bubble.text}</span></div>}
        </div>
        <div className={`tr-felt tr-felt--${answering ? 'answer' : myTurn ? 'turn' : handOver ? 'result' : 'wait'}`} role="status"><div className="tr-director"><span className="tr-director__eyebrow">{answering ? '¡EL RIVAL SUBE LA APUESTA!' : handOver ? 'BAZA FINALIZADA' : myTurn ? 'VOS DECIDÍS LA JUGADA' : 'DUELO EN CURSO'}</span><img className="tr-director__lupi" src={lupiTrucoAvatar} alt=""/><span>{state.truco.level ? `${TRUCO_NAME[state.truco.level]} · vale ${state.truco.level + 1}` : "MANO · vale 1"}</span><h3>{status}</h3><p className="tr-director__instruction">{answering ? 'Elegí QUIERO para aceptar o NO QUIERO para rechazar en la botonera.' : myTurn ? 'Elegí una de tus cartas de abajo para jugarla. También podés cantar antes de tirar.' : handOver ? 'Revisá el resultado y continuá con la siguiente mano.' : waitingRival ? 'El rival está evaluando tu canto. Esperá su respuesta.' : 'Mirá la carta del rival y prepará tu próxima jugada.'}</p></div>{state.envidoResult && !finished && <div className={`tr-envido-live tr-envido-live--${state.envidoResult.winner === 0 ? "me" : "rival"}`}><b>ENVIDO</b><strong>{state.envidoResult.winner === 0 ? `Gana ${myName}` : `Gana ${rivalName}`}</strong><span>{state.envidoResult.points[0]} vos · {state.envidoResult.points[1]} rival · +{state.envidoResult.stake}</span></div>}</div>
        <div className="tr-row tr-row--me">
          <div className="tr-played">{[0, 1, 2].map((i) => <div key={i} className="tr-slot"><TrucoCard card={state.table[0][i] ?? null} played /></div>)}</div>
          {bubble?.seat === 0 && <div key={bubble.n} className="tr-bubble tr-bubble--me"><AvatarFace appearance={appearance} className="tr-speaking-face"/><span>{bubble.text}</span></div>}
        </div>
      </div>

      {!finished && !handOver && (
        <div className="tr-mine">
          <span className="tr-envido-hint">TUS CARTAS · {envidoPoints(state.dealt[0])} DE ENVIDO</span>
          <div className="tr-hand tr-hand--mine">{state.hands[0].map((c, i) => <TrucoCard key={`${c.suit}${c.num}`} card={c} onClick={() => play(i)} disabled={intro || !moves.play.includes(i)} />)}</div>
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

      {finished && <TrucoMatchResult meId={meId} myName={myName} rivalName={rivalName} myScore={state.scores[0]} rivalScore={state.scores[1]} won={state.winner===0} onExit={onExit} onRematch={onRematch}><DuelRewardCard reward={reward} error={rewardError} rivalName={rivalName} gameLabel="Truco"/></TrucoMatchResult>}

      <ul className="tr-log" aria-label="Historial">{state.log.slice(-3).map((l, i) => <li key={i} data-tone={l.tone}>{l.text}</li>)}</ul>
      <footer className="rps-rule">TRUCO · ENVIDO · SIN FLOR <span>A {TARGET} PUNTOS · 3 BAZAS POR MANO</span></footer>
    </section>
  );
}
