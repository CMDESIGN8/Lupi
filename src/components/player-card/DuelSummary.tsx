// src/components/player-card/DuelSummary.tsx
import "./challenge-toasts.css";

type Score = { userScore: number; rivalScore: number };

type Props = {
  opponentName: string;
  mine: Score;
  /** undefined = el rival todavía no terminó. */
  theirs?: Score;
  onClose: () => void;
};

/** Resultado del duelo: gana la mejor diferencia de gol; si empatan, el que más goles hizo. */
export function DuelSummary({ opponentName, mine, theirs, onClose }: Props) {
  let verdict: string | null = null;
  if (theirs) {
    const a = mine.userScore - mine.rivalScore;
    const b = theirs.userScore - theirs.rivalScore;
    const cmp = a !== b ? a - b : mine.userScore - theirs.userScore;
    verdict = cmp > 0 ? "¡GANASTE EL DUELO!" : cmp < 0 ? "PERDISTE EL DUELO" : "EMPATE";
  }

  return (
    <div className="pc-toasts pc-toasts--top" aria-live="polite">
      <div className="pc-toast pc-toast--incoming" role="status">
        <strong>⚔ Duelo vs {opponentName}</strong>
        <span>
          Vos: {mine.userScore} – {mine.rivalScore}
        </span>
        <span>
          {opponentName}: {theirs ? `${theirs.userScore} – ${theirs.rivalScore}` : "esperando que termine…"}
        </span>
        {verdict && <strong>{verdict}</strong>}
        <small style={{ opacity: 0.6 }}>Cada jugador informa su resultado. El duelo es amistoso: no da premios.</small>
        <div className="pc-toast__row">
          <button type="button" className="pc-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
