// src/components/player-card/ChallengeSelector.tsx
import type { ChallengeGame } from "../../hooks/useLobbyChallenges";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { CHALLENGE_OPTIONS } from "./constants";

type Props = {
  player: LobbyPlayer;
  canChallenge: boolean;
  /** Por qué no se puede desafiar ahora (esperando respuesta, en partido, ausente). */
  statusNote: string | null;
  onChallengeGame?: (player: LobbyPlayer, game: ChallengeGame) => void;
};

export function ChallengeSelector({ player, canChallenge, statusNote, onChallengeGame }: Props) {
  return (
    <>
      <h4 className="lw-heading">
        Elegí la modalidad <span>{player.username}</span>
      </h4>
      <div className="lw-games">
        {CHALLENGE_OPTIONS.map((option) => (
          <button
            key={option.game}
            type="button"
            className="lw-game"
            disabled={!canChallenge || !option.available || !onChallengeGame}
            onClick={() => onChallengeGame?.(player, option.game)}
          >
            <span className="lw-game__icon" aria-hidden="true">
              {option.icon}
            </span>
            <strong className="lw-game__title">{option.title}</strong>
            <small className="lw-game__desc">{option.description}</small>
            <span className="lw-game__state" aria-hidden="true">
              {option.available ? "→" : "🔒"}
            </span>
          </button>
        ))}
      </div>
      {statusNote && (
        <p className="lw-note lw-note--status" role="status">
          {statusNote}
        </p>
      )}
      {!onChallengeGame && <p className="lw-note">Conectá onChallengeGame en GameHub para enviar desafíos desde esta ficha.</p>}
      <p className="lw-note">Tu rival recibe una invitación y decide si acepta.</p>
    </>
  );
}
