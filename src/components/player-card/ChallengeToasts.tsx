// src/components/player-card/ChallengeToasts.tsx
import type { Challenge, ChallengeGame, ChallengeOutcome } from "../../hooks/useLobbyChallenges";
import type { DailyChallengeToast } from "./types";
import "./challenge-toasts.css";

type Props = {
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
  outcome,
  respond,
  cancel,
  dailyChallenges = [],
  onDismissDaily,
}: Props) {
  if (!incoming && !outgoing && !outcome && dailyChallenges.length === 0) return null;
  return (
    <>
      {(incoming || outgoing) && (
        <div className="pc-challenge-overlay">
          <section className="pc-challenge-modal" role="dialog" aria-modal="true" aria-label="Desafío de Lupi World">
            <div className="pc-challenge-modal__icon" aria-hidden="true">
              ⚔
            </div>
            <span className="pc-challenge-modal__eyebrow">LUPI WORLD · {gameName((incoming ?? outgoing)?.gameType)}</span>
            <h2 className="pc-challenge-modal__title">{incoming ? "¡TE DESAFÍAN!" : "DESAFÍO ENVIADO"}</h2>
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
            <div className="pc-challenge-modal__actions">
              {incoming ? (
                <>
                  <button type="button" className="pc-btn pc-btn--primary" onClick={() => respond(true)}>
                    ⚔ ACEPTAR
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
