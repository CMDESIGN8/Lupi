import type { Challenge } from "../hooks/useLobbyChallenges";
import { useRpsMatch } from "../hooks/useRpsMatch";
import "./RockPaperScissors.css";

type Props = { challenge: Challenge; meId: string; onExit: () => void };
const choices = [
  { id: "rock", icon: "✊", label: "PIEDRA" },
  { id: "paper", icon: "✋", label: "PAPEL" },
  { id: "scissors", icon: "✌️", label: "TIJERA" },
] as const;
export function RockPaperScissors({ challenge, meId, onExit }: Props) {
  const { state, error, busy, play } = useRpsMatch(challenge);
  const host = challenge.fromId === meId;
  const myName = host ? challenge.fromName : challenge.toName;
  const rivalName = host ? challenge.toName : challenge.fromName;
  const myWins = state ? (host ? state.hostWins : state.guestWins) : 0;
  const rivalWins = state ? (host ? state.guestWins : state.hostWins) : 0;
  const finished = state?.status === "finished";
  const verdict = !finished ? "" : state?.winnerId === null ? "¡EMPATE!" : state?.winnerId === meId ? "¡GANASTE!" : "¡BUEN DUELO!";
  return (
    <section className="rps-arena" aria-label="Piedra, papel o tijera">
      <header className="rps-header">
        <button type="button" onClick={onExit}>← LOBBY</button>
        <span>LUPI WORLD · ARENA PvP</span>
      </header>
      <h2>PIEDRA · PAPEL · TIJERA</h2>
      <p>MEJOR DE 3 RONDAS · ELECCIÓN SECRETA</p>
      <div className="rps-score">
        <div><small>VOS</small><strong>{myName}</strong><b>{myWins}</b></div>
        <span>VS</span>
        <div><small>RIVAL</small><strong>{rivalName}</strong><b>{rivalWins}</b></div>
      </div>
      {error && <p role="alert" className="rps-error">{error}</p>}
      {!state && !error && <p>Conectando con la arena…</p>}
      {state && (
        <>
          <h3>{finished ? verdict : `RONDA ${state.round} / 3`}</h3>
          {!finished && <p>{state.mineSubmitted ? "Elección enviada. Esperando al rival…" : "Elegí tu jugada"}</p>}
          {state.lastMoves && (
            <div className="rps-reveal">
              Ronda anterior: {host ? state.lastMoves.host : state.lastMoves.guest} / {host ? state.lastMoves.guest : state.lastMoves.host}
            </div>
          )}
          {!finished && (
            <div className="rps-choices">
              {choices.map(c => (
                <button key={c.id} type="button" disabled={busy || state.mineSubmitted}
                  onClick={() => void play(c.id)}>
                  <span>{c.icon}</span><strong>{c.label}</strong>
                </button>
              ))}
            </div>
          )}
          {finished && <button className="rps-exit" type="button" onClick={onExit}>VOLVER AL LOBBY</button>}
        </>
      )}
    </section>
  );
}
