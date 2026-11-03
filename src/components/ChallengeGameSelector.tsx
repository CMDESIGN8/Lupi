import type { ChallengeGame } from "../hooks/useLobbyChallenges";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import "./ChallengeGameSelector.css";

type Props = {
  player: LobbyPlayer;
  onSelect: (game: ChallengeGame) => void;
  /** Preguntados por turnos: jugás ahora y tu rival responde cuando pueda (24 h). */
  onAsyncTrivia?: () => void;
  onClose: () => void;
};

const games = [
  { id: "futsal", icon: "⚽", name: "FUTSAL", description: "Ataque y defensa secretos · 5 ataques por jugador", available: true },
  { id: "trivia", icon: "🧠", name: "PREGUNTADOS", description: "Trivia de fútbol · 5 preguntas PvP", available: true },
  { id: "rps", icon: "✊", name: "PIEDRA, PAPEL O TIJERA", description: "PvP sincronizado · Mejor de 3", available: true },
  { id: "truco", icon: "🃏", name: "TRUCO", description: "PvP próximamente · practicá desde Duelo rápido", available: false },
  { id: "physical", icon: "💪", name: "RETO FÍSICO", description: "Desafíos de la vida real", available: false },
] as const;

export function ChallengeGameSelector({ player, onSelect, onAsyncTrivia, onClose }: Props) {
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
          {onAsyncTrivia && (
            <button type="button" className="cgs-game is-available" onClick={onAsyncTrivia}>
              <span className="cgs-icon">🧠</span>
              <span className="cgs-info"><strong>PREGUNTADOS POR TURNOS</strong><small>Jugás ahora · tu rival responde en 24 h</small></span>
              <span className="cgs-status">DESAFIAR →</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}