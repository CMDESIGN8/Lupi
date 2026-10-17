import type { ChallengeGame } from "../hooks/useLobbyChallenges";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import "./ChallengeGameSelector.css";

type Props = {
  player: LobbyPlayer;
  onSelect: (game: ChallengeGame) => void;
  onClose: () => void;
};

const games = [
  { id: "futsal", icon: "⚽", name: "FUTSAL", description: "Duelo 1 vs 1", available: true },
  { id: "trivia", icon: "🧠", name: "PREGUNTADOS", description: "Demostrá cuánto sabés", available: false },
  { id: "rps", icon: "✊", name: "PIEDRA, PAPEL O TIJERA", description: "Mejor de 3", available: true },
  { id: "truco", icon: "🃏", name: "TRUCO", description: "Cartas y estrategia", available: false },
  { id: "physical", icon: "💪", name: "RETO FÍSICO", description: "Desafíos de la vida real", available: false },
] as const;

export function ChallengeGameSelector({ player, onSelect, onClose }: Props) {
  return (
    <div
      className="cgs-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="cgs-modal" role="dialog" aria-modal="true" aria-label="Elegir desafío">
        <button type="button" className="cgs-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <span className="cgs-eyebrow">LUPI WORLD · ARENA SOCIAL</span>
        <h2>ELEGÍ TU DESAFÍO</h2>
        <p>¿A qué querés desafiar a <strong>{player.username}</strong>?</p>

        <div className="cgs-games">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              disabled={!game.available}
              className={`cgs-game ${game.available ? "is-available" : "is-locked"}`}
              onClick={() => {
                if (game.available) onSelect(game.id);
              }}
            >
              <span className="cgs-icon">{game.icon}</span>
              <span className="cgs-info">
                <strong>{game.name}</strong>
                <small>{game.description}</small>
              </span>
              <span className="cgs-status">
                {game.available ? "DESAFIAR →" : "PRÓXIMAMENTE"}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}