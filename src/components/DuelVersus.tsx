import { AvatarFace } from "./AvatarFace";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import type { Challenge } from "../hooks/useLobbyChallenges";
import "./DuelVersus.css";

type DuelVersusProps = {
  challenge: Challenge;
  meId: string;
  players?: LobbyPlayer[];
};

export function DuelVersus({ challenge, meId, players = [] }: DuelVersusProps) {
  const amHost = challenge.fromId === meId;

  const myName = amHost ? challenge.fromName : challenge.toName;
  const opponentName = amHost ? challenge.toName : challenge.fromName;

  const face = (id: string, name: string) => { const p=players.find(p=>p.userId===id);return <span className="duel-vs__avatar">{p?.appearance ? <AvatarFace appearance={p.appearance} className="lw-face--game"/> : <b>{name.slice(0,1).toUpperCase()}</b>}</span>; };
  return (
    <div
      className="duel-vs"
      role="status"
      aria-live="polite"
      aria-label="Preparando enfrentamiento"
    >
      <div className="duel-vs__speedlines" aria-hidden="true"/><div className="duel-vs__arena">
        <span className="duel-vs__eyebrow">
          LUPI WORLD · RIVAL ENCONTRADO
        </span>

        <h2 className="duel-vs__heading">DESAFÍO ACEPTADO</h2>

        <div className="duel-vs__fighters">
          <div className="duel-vs__fighter">
            {face(meId,myName)}
            <span className="duel-vs__name">{myName}</span>
            <small>VOS</small>
          </div>

          <span className="duel-vs__versus">VS</span>

          <div className="duel-vs__fighter">
            {face(amHost?challenge.toId:challenge.fromId,opponentName)}
            <span className="duel-vs__name">{opponentName}</span>
            <small>RIVAL</small>
          </div>
        </div>

        <p className="duel-vs__status">{challenge.gameType === "trivia" ? "PREPARANDO LAS PREGUNTAS..." : challenge.gameType === "rps" ? "PREPARANDO EL DUELO..." : "PREPARANDO EL PARTIDO..."}</p>
        <div className="duel-vs__progress" />
      </div>
    </div>
  );
}