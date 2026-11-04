import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useTrucoPvp } from "../hooks/useTrucoPvp";
import { DuelResultEffects } from "./DuelResultEffects";
import { duelFx } from "../lib/duelFx";
import { ENVIDO_NAME, TARGET, TRUCO_NAME, actor, movesFor, type EnvidoCall } from "../utils/trucoEngine";
import { OwnedCardPortrait } from "./OwnedCardPortrait";
import { TrucoCard } from "./TrucoDuel";
import "./RockPaperScissors.css";
import "./TrucoDuel.css";

type Props = { challenge: Challenge; meId: string; onExit: () => void; onFinished?: (f: boolean) => void };

export function TrucoPvpDuel({ challenge, meId, onExit, onFinished }: Props) {
  const { pvpState, gameState, error, busy, act, leave } = useTrucoPvp(challenge);


  const myName    = challenge.fromId === meId ? challenge.fromName : challenge.toName;
  const rivalId   = challenge.fromId === meId ? challenge.toId   : challenge.fromId;
  const rivalName = challenge.fromId === meId ? challenge.toName  : challenge.fromName;

  const mySeat    = pvpState?.seat === "host" ? 0 : 1;
  const rivalSeat = mySeat === 0 ? 1 : 0;

  const state    = gameState;
  const finished = pvpState?.status === "finished" || pvpState?.status === "abandoned";
  const waiting  = pvpState?.status === "waiting";
  const myTurnNow = state ? actor(state) === mySeat : false;
  const moves    = state ? movesFor(state, mySeat) : { play: [], truco: null, envido: [], accept: false, decline: false, fold: false };
  const pend     = state?.pending ?? null;
  const answering = !!pend && moves.accept;

  const lastShout = useRef(0);
  const [bubble, setBubble] = useState<{ seat: 0 | 1; text: string; n: number } | null>(null);

  useEffect(() => { onFinished?.(finished); }, [finished, onFinished]);
  useEffect(() => {
    const sh = state?.lastShout;
    if (!sh || sh.n === lastShout.current) return;
    lastShout.current = sh.n; setBubble(sh);
    if (sh.seat !== mySeat) duelFx.tap();
    const t = window.setTimeout(() => setBubble(b => b?.n === sh.n ? null : b), 1800);
    return () => window.clearTimeout(t);
  }, [state?.lastShout, mySeat]);
  useEffect(() => {
    if (finished && pvpState?.winnerId) duelFx.result(pvpState.winnerId === meId ? "win" : "loss");
  }, [finished, pvpState?.winnerId, meId]);

  const myScore    = pvpState ? (mySeat === 0 ? pvpState.hostScore : pvpState.guestScore) : 0;
  const rivalScore = pvpState ? (mySeat === 0 ? pvpState.guestScore : pvpState.hostScore) : 0;
  const iWon       = finished && pvpState?.winnerId === meId;
  const outcome    = iWon ? "win" : "loss";
  const dots = (n: number) => Array.from({ length: TARGET }, (_, i) => <i key={i} className={i < n ? "on" : ""} />);
  const trickBadge = (i: number) => {
    const r = state?.trickResults[i];
    return r === undefined ? "" : r === "tie" ? "=" : r === mySeat ? "✓" : "✗";
  };

  const doAct = (a: Parameters<typeof act>[0]) => { duelFx.tap(); void act(a); };
  const call  = (kind: EnvidoCall) => doAct({ t: "envido", kind });

  let status = "Conectando…";
  if (waiting) status = "Esperando al rival…";
  else if (finished) status = iWon ? "¡GANASTE EL DUELO!" : "ESTA VEZ NO FUE";
  else if (!state) status = "Cargando partida…";
  else if (answering) status = pend!.kind === "truco" ? `Rival cantó ${TRUCO_NAME[pend!.level]}. ¿Qué respondés?` : `Rival cantó ${pend!.calls.map(c => ENVIDO_NAME[c]).join(" + ")}. ¿Qué respondés?`;
  else if (pvpState?.mineReady && !pvpState?.rivalReady) status = "Esperando al rival…";
  else if (myTurnNow) status = state.trick === 0 ? "Sos mano · tirá una carta" : "Tu turno";
  else if (busy) status = "Enviando…";
  else status = `${rivalName} está pensando…`;


  return (
    <section className={`rps-arena tr-arena ${finished ? "is-complete" : ""}`} data-outcome={finished ? outcome : undefined} aria-label="Truco PvP">
      {finished && <DuelResultEffects key={challenge.id} outcome={outcome} />}
      <header className="rps-header">
        <button type="button" onClick={() => { void leave(); onExit(); }}>← CLUB</button>
        <span>LUPI WORLD · TRUCO</span>
        <span>PvP · EN VIVO</span>
      </header>

      {error && <p className="tr-error" role="alert">{error}</p>}
      {waiting && <p className="tr-waiting">Esperando que {rivalName} se conecte…</p>}

      {state && (
        <div className="tr-table">
      <div className="tr-score" aria-live="polite">
        <div className="tr-score-player">
          <div className="tr-score-main">
            <div className="tr-score-identity">
              <div className="tr-avatar"><OwnedCardPortrait userId={meId} /></div>
              <strong className="tr-score-name">{myName}</strong>
            </div>
            <b>{myScore}</b>
          </div>
          <span className="tr-dots">{dots(myScore)}</span>
        </div>
        <div className="tr-target">A {TARGET}<small>MANO {state?.handNo ?? 1}</small></div>
        <div className="tr-score-player">
          <div className="tr-score-main">
            <div className="tr-score-identity">
              <div className="tr-avatar"><OwnedCardPortrait userId={rivalId} /></div>
              <strong className="tr-score-name">{rivalName}</strong>
            </div>
            <b>{rivalScore}</b>
          </div>
          <span className="tr-dots tr-dots--rival">{dots(rivalScore)}</span>
        </div>
      </div>


          <div className="tr-row tr-row--rival">
            <div className="tr-hand">{(state.hands[rivalSeat] ?? []).map((_, i) => <TrucoCard key={i} back />)}</div>
            <div className="tr-played">{[0,1,2].map(i => (
              <div key={i} className="tr-slot">
                <TrucoCard card={state.table[rivalSeat][i] ?? null} played />
                {trickBadge(i) && <em className={`tr-badge tr-badge--${state.trickResults[i] === mySeat ? "w" : state.trickResults[i] === rivalSeat ? "l" : "t"}`}>{trickBadge(i)}</em>}
              </div>
            ))}</div>
            {bubble?.seat === rivalSeat && <div key={bubble.n} className="tr-bubble tr-bubble--rival"><span>{bubble.text}</span></div>}
          </div>

          <div className="tr-felt" role="status">
            <span>{state.truco.level ? `${TRUCO_NAME[state.truco.level]} · vale ${state.truco.level + 1}` : "MANO · vale 1"}</span>
            <h3>{status}</h3>
          </div>

          <div className="tr-row tr-row--me">
            <div className="tr-played">{[0,1,2].map(i => (
              <div key={i} className="tr-slot"><TrucoCard card={state.table[mySeat][i] ?? null} played /></div>
            ))}</div>
            {bubble?.seat === mySeat && <div key={bubble.n} className="tr-bubble tr-bubble--me"><span>{bubble.text}</span></div>}
          </div>
        </div>
      )}

      {state && !finished && state.phase !== "hand-over" && (
        <div className="tr-mine">
          <div className="tr-hand tr-hand--mine">
            {state.hands[mySeat].map((c, i) => (
              <TrucoCard key={`${c.suit}${c.num}`} card={c} onClick={() => doAct({ t: "play", card: i })} disabled={!moves.play.includes(i) || busy} />
            ))}
          </div>
          <div className="tr-actions">
            {answering && <>
              <button type="button" className="is-yes" onClick={() => doAct({ t: "accept" })}>QUIERO</button>
              <button type="button" className="is-no"  onClick={() => doAct({ t: "decline" })}>NO QUIERO</button>
              {moves.truco && <button type="button" onClick={() => doAct({ t: "truco" })}>QUIERO {TRUCO_NAME[moves.truco]}</button>}
              {moves.envido.map(k => <button type="button" key={k} onClick={() => call(k)}>{pend!.kind === "truco" ? "ENVIDO ESTÁ PRIMERO: " : ""}{ENVIDO_NAME[k]}</button>)}
            </>}
            {!pend && myTurnNow && <>
              {moves.truco && <button type="button" className="is-truco" onClick={() => doAct({ t: "truco" })}>{TRUCO_NAME[moves.truco]}</button>}
              {moves.envido.map(k => <button type="button" key={k} onClick={() => call(k)}>{ENVIDO_NAME[k]}</button>)}
              <button type="button" className="is-fold" onClick={() => doAct({ t: "fold" })}>IR AL MAZO</button>
            </>}
          </div>
        </div>
      )}

      {state?.phase === "hand-over" && !finished && <div className="tr-summary"><h3>{state.handResult?.winner === mySeat ? "¡MANO TUYA!" : "MANO DEL RIVAL"}</h3><button type="button" disabled={busy} onClick={()=>doAct({t:"next"})}>SIGUIENTE MANO →</button></div>}
      {finished && (
        <div className="rps-finish">
          <p className="rps-winner-name">{pvpState?.winnerId === meId ? myName : rivalName} SE LLEVA EL DUELO · {myScore} a {rivalScore}</p>
          <button className="rps-exit" type="button" onClick={onExit}>VOLVER AL CLUB →</button>
        </div>
      )}

      <footer className="rps-rule">TRUCO · ENVIDO · SIN FLOR <span>A {TARGET} PUNTOS · 3 BAZAS POR MANO</span></footer>
    </section>
  );
}
