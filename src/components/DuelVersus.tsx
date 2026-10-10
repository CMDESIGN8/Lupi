import type { Challenge } from "../hooks/useLobbyChallenges";
import "./DuelVersus.css";

type DuelVersusProps = {
  challenge: Challenge;
  meId: string;
};

export function DuelVersus({ challenge, meId }: DuelVersusProps) {
  const amHost = challenge.fromId === meId;

  const myName = amHost ? challenge.fromName : challenge.toName;
  const opponentName = amHost ? challenge.toName : challenge.fromName;

  return (
    <div
      className="duel-vs"
      role="status"
      aria-live="polite"
      aria-label="Preparando enfrentamiento"
    >
      <div className="duel-vs__arena">
        <span className="duel-vs__eyebrow">
          LUPI WORLD · MATCH FOUND
        </span>

        <h2 className="duel-vs__heading">DESAFÍO ACEPTADO</h2>

        <div className="duel-vs__fighters">
          <div className="duel-vs__fighter">
            <span className="duel-vs__avatar">⚽</span>
            <span className="duel-vs__name">{myName}</span>
            <small>VOS</small>
          </div>

          <span className="duel-vs__versus">VS</span>

          <div className="duel-vs__fighter">
            <span className="duel-vs__avatar">⚔</span>
            <span className="duel-vs__name">{opponentName}</span>
            <small>RIVAL</small>
          </div>
        </div>

        <p className="duel-vs__status">PREPARANDO EL PARTIDO...</p>
        <div className="duel-vs__progress" />
      </div>
    </div>
  );
}