// src/components/player-card/ChallengeToasts.tsx
import { AvatarFace } from "../AvatarFace";
import { ArenaSymbol } from "../match/ArenaSymbol";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import type { Challenge, ChallengeGame, ChallengeOutcome } from "../../hooks/useLobbyChallenges";
import type { DailyChallengeToast } from "./types";
import "./challenge-toasts.css";
import "./ChallengeCinema.css";

type Props = {
  players?: LobbyPlayer[];
  incoming: Challenge | null;
  outgoing: Challenge | null;
  outcome: ChallengeOutcome | null;
  respond: (accept: boolean) => void;
  cancel: () => void;
  dailyChallenges?: DailyChallengeToast[];
  onDismissDaily?: (id: string) => void;
};

const GAME_NAMES: Record<ChallengeGame, string> = {
  futsal: "Futsal",
  trivia: "Preguntados",
  rps: "Piedra, papel o tijera",
  truco: "Truco",
  physical: "Reto físico",
};

const OUTCOME_TEXT: Record<ChallengeOutcome["kind"], (name: string) => string> = {
  declined: (name) => `${name} rechazó el desafío.`,
  busy: (name) => `${name} está ocupado.`,
  expired: (name) => `${name} no respondió.`,
};

const gameName = (type?: string) => (GAME_NAMES[type as ChallengeGame] ?? GAME_NAMES.futsal).toUpperCase();

/** Avisos flotantes: desafío recibido, desafío enviado y resultado. */
export function ChallengeToasts({
  incoming,
  outgoing,
  players = [],
  outcome,
  respond,
  cancel,
  dailyChallenges = [],
  onDismissDaily,
}: Props) {
  if (!incoming && !outgoing && !outcome && dailyChallenges.length === 0) return null;
  const active = incoming ?? outgoing;
  const contender = (id:string,name:string,away:boolean) => {
    const player=players.find(p=>p.userId===id);
    return <div className={`pc-duel-contender${away?' pc-duel-contender--away':''}`}><div className="pc-duel-face">{player?.appearance ? <AvatarFace appearance={player.appearance}/> : <span>{name.slice(0,1).toUpperCase()}</span>}</div><strong>{name}</strong><small>{away?'RIVAL':'VOS'}</small></div>;
  };
  return (
    <>
      {(incoming || outgoing) && (
        <div className="pc-challenge-overlay">
          <section key={active?.id} className={`pc-challenge-modal pc-challenge-cinema ${incoming?"is-incoming":"is-outgoing"}`} role="dialog" aria-modal="true" aria-labelledby="pc-duel-title">
            <div className="pc-duel-flare" aria-hidden="true"/>
            <div className="pc-duel-chapter"><span>ARENA SOCIAL</span><b>01 / EL DESAFÍO</b></div>
            <div className="pc-challenge-modal__icon" aria-hidden="true">
              <ArenaSymbol kind="elaborated"/>
            </div>
            <span className="pc-challenge-modal__eyebrow">LUPI WORLD · {gameName((incoming ?? outgoing)?.gameType)}</span>
            <h2 id="pc-duel-title" className="pc-challenge-modal__title">{incoming ? "¡TE DESAFÍAN!" : "DESAFÍO ENVIADO"}</h2>
            {active && <div className="pc-duel-versus">{contender(incoming?active.toId:active.fromId,incoming?active.toName:active.fromName,false)}<b className="pc-duel-vs" aria-hidden="true">VS</b>{contender(incoming?active.fromId:active.toId,incoming?active.fromName:active.toName,true)}</div>}
            <p className="pc-challenge-modal__description">
              {incoming ? (
                <>
                  <strong>{incoming.fromName}</strong> te desafía a {gameName(incoming.gameType)}.
                </>
              ) : (
                <>
                  Esperando la respuesta de <strong>{outgoing?.toName}</strong>...
                </>
              )}
            </p>
            {outgoing && !incoming && (
              <div className="pc-challenge-modal__waiting" aria-label="Esperando respuesta">
                <span />
                <span />
                <span />
              </div>
            )}
            <div className="pc-duel-signal" aria-hidden="true"><i/><i/><i/><i/><i/></div>
            <div className="pc-challenge-modal__actions">
              {incoming ? (
                <>
                  <button type="button" className="pc-btn pc-btn--primary" onClick={() => respond(true)}>
                    ACEPTAR DESAFÍO →
                  </button>
                  <button type="button" className="pc-btn" onClick={() => respond(false)}>
                    RECHAZAR
                  </button>
                </>
              ) : (
                <button type="button" className="pc-btn" onClick={cancel}>
                  CANCELAR DESAFÍO
                </button>
              )}
            </div>
            <small className="pc-duel-footer">LEÉ AL RIVAL · ELEGÍ TU JUGADA</small>
          </section>
        </div>
      )}
      {outcome && (
        <div className="pc-notifications" role="status" aria-live="polite">
          <div className="pc-toast pc-toast--info">{OUTCOME_TEXT[outcome.kind](outcome.name)}</div>
        </div>
      )}
      {dailyChallenges.length > 0 && (
        <div className="pc-daily-notifications" aria-live="polite">
          {dailyChallenges.map((challenge) => (
            <div key={challenge.id} className="pc-toast pc-toast--daily" role="status">
              <div className="pc-toast__daily-icon">🏆</div>
              <button
                type="button"
                className="pc-toast__daily-close"
                onClick={() => onDismissDaily?.(challenge.id)}
                aria-label={`Cerrar logro ${challenge.title}`}
              >
                ×
              </button>
              <div className="pc-toast__daily-content">
                <strong>DESAFÍO COMPLETADO</strong>
                <span>{challenge.title}</span>
                <small>
                  {challenge.progress}/{challenge.requirement}
                  {challenge.rewardXp ? ` · +${challenge.rewardXp} XP` : ""}
                  {challenge.rewardCoins ? ` · +${challenge.rewardCoins} 💰` : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
