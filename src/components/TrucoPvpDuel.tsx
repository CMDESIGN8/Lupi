import './TrucoPvpDesktop.css';
import './TrucoPortraits.css';
import { useDuelReward } from "../hooks/useDuelReward";
import { DuelRewardCard } from "./DuelRewardCard";
import { SkillMatchReward } from "./SkillMatchReward";
import { useEffect, useRef, useState } from "react";
import type { Challenge } from "../hooks/useLobbyChallenges";
import { useTrucoPvp } from "../hooks/useTrucoPvp";
import { DuelResultEffects } from "./DuelResultEffects";
import { duelFx } from "../lib/duelFx";
import { ENVIDO_NAME, TARGET, TRUCO_NAME, actor, movesFor, envidoPoints, type EnvidoCall } from "../utils/trucoEngine";
import { AvatarFace } from "./AvatarFace";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";
import { TrucoCard, TrucoTableSlot } from "./TrucoDuel";
import "./RockPaperScissors.css";
import "./TrucoDuel.css";
import {TrucoMatchResult} from "./TrucoMatchResult";

type Props = { challenge: Challenge; meId: string; onExit: () => void; onFinished?: (f: boolean) => void };

export function TrucoPvpDuel({ challenge, meId, onExit, onFinished }: Props) {
  const { pvpState, gameState, error, busy, act, leave } = useTrucoPvp(challenge);


  const myName    = challenge.fromId === meId ? challenge.fromName : challenge.toName;
  const rivalId   = challenge.fromId === meId ? challenge.toId   : challenge.fromId;
  const rivalName = challenge.fromId === meId ? challenge.toName  : challenge.fromName;

  const {appearance: myAppearance} = useAvatarAppearance(meId);
  const {appearance: rivalAppearance} = useAvatarAppearance(rivalId);
  const mySeat    = pvpState?.seat === "host" ? 0 : 1;
  const rivalSeat = mySeat === 0 ? 1 : 0;

  const state    = gameState;
  const finished = pvpState?.status === "finished" || pvpState?.status === "abandoned";
  const {reward, error: rewardError, retry: retryReward} = useDuelReward("truco", challenge.id, finished, {rivalId});
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
  }, [state?.lastShout?.n, mySeat]);
  useEffect(() => {
    if (finished && pvpState?.winnerId) duelFx.result(pvpState.winnerId === meId ? "win" : "loss");
  }, [finished, pvpState?.winnerId, meId]);

  const myScore    = pvpState ? (mySeat === 0 ? pvpState.hostScore : pvpState.guestScore) : 0;
  const rivalScore = pvpState ? (mySeat === 0 ? pvpState.guestScore : pvpState.hostScore) : 0;
  const iWon       = finished && pvpState?.winnerId === meId;
  const outcome    = iWon ? "win" : "loss";
  const dots = (n: number) => Array.from({ length: TARGET }, (_, i) => <i key={i} className={i < n ? "on" : ""} />);


  const doAct = (a: Parameters<typeof act>[0]) => { duelFx.tap(); void act(a); };
  const call  = (kind: EnvidoCall) => doAct({ t: "envido", kind });

  let status = "Conectando…";
  if (waiting) status = "Esperando al rival…";
  else if (finished) status = iWon ? "¡GANASTE EL DUELO!" : "ESTA VEZ NO FUE";
  else if (!state) status = "Cargando partida…";
  else if (state.phase === "hand-over") status = state.handResult?.winner === mySeat ? "¡GANASTE LA MANO!" : "MANO DEL RIVAL";
  else if (answering) status = pend!.kind === "truco" ? `Rival cantó ${TRUCO_NAME[pend!.level]}. ¿Qué respondés?` : `Rival cantó ${pend!.calls.map(c => ENVIDO_NAME[c]).join(" + ")}. ¿Qué respondés?`;
  else if (pvpState?.mineReady && !pvpState?.rivalReady) status = "Esperando al rival…";
  else if (myTurnNow) status = state.trick === 0 ? "Sos mano · tirá una carta" : "Tu turno";
  else if (busy) status = "Enviando…";
  else status = `${rivalName} está pensando…`;


  return (
    <section className={`rps-arena tr-arena tr-arena--pvp ${finished ? "is-complete" : ""}`} data-outcome={finished ? outcome : undefined} aria-label="Truco PvP">
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
              <div className="tr-avatar"><AvatarFace mood={finished ? (iWon ? "celebrate" : "presentation") : "focus"} appearance={myAppearance} className="tr-pvp-face"/></div>
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
              <div className="tr-avatar"><AvatarFace mood={finished ? (!iWon ? "celebrate" : "presentation") : "focus"} appearance={rivalAppearance} className="tr-pvp-face"/></div>
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
              <TrucoTableSlot key={`${state.handNo}:${i}`} card={state.table[rivalSeat][i] ?? null} result={state.trickResults[i]} seat={rivalSeat} mySeat={mySeat} handNo={state.handNo} />
            ))}</div>
            {bubble?.seat === rivalSeat && <div key={bubble.n} className="tr-bubble tr-bubble--rival"><span className="tr-shout-face"><AvatarFace mood="focus" appearance={rivalAppearance}/></span><span>{bubble.text}</span></div>}
          </div>

          <div className="tr-felt" role="status">
            <span>{state.truco.level ? `${TRUCO_NAME[state.truco.level]} · vale ${state.truco.level + 1}` : "MANO · vale 1"}</span>
            <h3>{status}</h3>
          </div>

          <div className="tr-row tr-row--me">
            <div className="tr-played">{[0,1,2].map(i => (
              <TrucoTableSlot key={`${state.handNo}:${i}`} card={state.table[mySeat][i] ?? null} result={state.trickResults[i]} seat={mySeat} mySeat={mySeat} handNo={state.handNo} />
            ))}</div>
            {bubble?.seat === mySeat && <div key={bubble.n} className="tr-bubble tr-bubble--me"><span className="tr-shout-face"><AvatarFace mood="focus" appearance={myAppearance}/></span><span>{bubble.text}</span></div>}
          </div>
        </div>
      )}

      {state && !finished && state.phase !== "hand-over" && (
        <div className="tr-mine">
          <span className="tr-envido-hint">TUS CARTAS · {envidoPoints(state.dealt[mySeat])} DE ENVIDO</span>
          <div className="tr-hand tr-hand--mine">
            {state.hands[mySeat].map((c, i) => (
              <TrucoCard key={`${c.suit}${c.num}`} card={c} onClick={() => doAct({ t: "play", card: i })} disabled={!moves.play.includes(i) || busy || !!pvpState?.mineReady} />
            ))}
          </div>
          <div className="tr-actions" aria-busy={busy || !!pvpState?.mineReady}>
            {(busy || pvpState?.mineReady || (!answering && !myTurnNow)) && <p className="tr-pvp-wait" role="status">{busy || pvpState?.mineReady ? "Confirmando tu jugada…" : "Turno del rival. Tus opciones aparecerán cuando te toque."}</p>}
            {answering && !busy && !pvpState?.mineReady && <>
              <button type="button" className="is-yes" onClick={() => doAct({ t: "accept" })}>QUIERO</button>
              <button type="button" className="is-no"  onClick={() => doAct({ t: "decline" })}>NO QUIERO</button>
              {moves.truco && <button type="button" onClick={() => doAct({ t: "truco" })}>QUIERO {TRUCO_NAME[moves.truco]}</button>}
              {moves.envido.map(k => <button type="button" key={k} onClick={() => call(k)}>{pend!.kind === "truco" ? "ENVIDO ESTÁ PRIMERO: " : ""}{ENVIDO_NAME[k]}</button>)}
            </>}
            {!pend && myTurnNow && !busy && !pvpState?.mineReady && <>
              {moves.truco && <button type="button" className="is-truco" onClick={() => doAct({ t: "truco" })}>{TRUCO_NAME[moves.truco]}</button>}
              {moves.envido.map(k => <button type="button" key={k} onClick={() => call(k)}>{ENVIDO_NAME[k]}</button>)}
              <button type="button" className="is-fold" onClick={() => doAct({ t: "fold" })}>IR AL MAZO</button>
            </>}
          </div>
        </div>
      )}

      {state?.phase === "hand-over" && state.handResult && !finished && <div className="tr-hand-result-overlay" role="dialog" aria-modal="true" aria-labelledby="tr-pvp-hand-title"><div className={`tr-hand-result-modal tr-hand-result-modal--${state.handResult.winner === mySeat ? "me" : "rival"}`}>
        <span className="tr-hand-result-kicker">CIERRE DE LA MANO {state.handNo}</span>
        <h2 id="tr-pvp-hand-title">{state.handResult.winner === mySeat ? "¡MANO TUYA!" : "MANO DEL RIVAL"}</h2><p className="tr-hand-result-reason">{state.handResult.reason}</p>
        <div className="tr-hand-result-points">{state.handResult.winner === mySeat ? "Vos sumás" : `${rivalName} suma`} {state.handResult.points} {state.handResult.points === 1 ? "punto" : "puntos"}</div>
        <div className="tr-hand-score" aria-label="Marcador actualizado"><div><span>VOS</span><b>{myScore}</b></div><span>A {TARGET}</span><div><span>{rivalName}</span><b>{rivalScore}</b></div></div>
        <button type="button" className="duel-rematch" disabled={busy} onClick={()=>doAct({t:"next"})}>{busy ? "CONFIRMANDO…" : "SIGUIENTE MANO →"}</button>
      </div></div>}
      {finished && <TrucoMatchResult meId={meId} rivalId={rivalId} myName={myName} rivalName={rivalName} myScore={myScore} rivalScore={rivalScore} won={iWon} onExit={onExit}><DuelRewardCard reward={reward} error={rewardError} onRetry={retryReward} rivalName={rivalName} gameLabel="Truco"/>{reward?.ok && <SkillMatchReward game="truco" matchId={challenge.id} userId={meId}/>}</TrucoMatchResult>}

      <footer className="rps-rule">TRUCO · ENVIDO · SIN FLOR <span>A {TARGET} PUNTOS · 3 BAZAS POR MANO</span></footer>
    </section>
  );
}
