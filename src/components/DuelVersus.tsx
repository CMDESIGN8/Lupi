import { useEffect, useState } from "react";
import { useDuelEntrance } from "../hooks/useDuelEntrance";
import { ArenaAvatar } from "./match/ArenaAvatar";
import type { InventoryItem } from "../hooks/useAuraInventory";
import type { LobbyPlayer } from "../hooks/useLobbyPresence";
import type { Challenge } from "../hooks/useLobbyChallenges";
import "./DuelVersus.css";
import "./FutsalVersusDesktop.css";
import { OwnedCardPortrait } from "./OwnedCardPortrait";

type DuelVersusProps = {
  challenge: Challenge;
  meId: string;
  players?: LobbyPlayer[];
  catalog?: InventoryItem[];
  onStart: () => void;
  onExit: () => void;
};

export function DuelVersus({ challenge, meId, players = [], catalog = [], onStart, onExit }: DuelVersusProps) {
  const [portraits] = useState(() => players);
  const entry = useDuelEntrance(challenge, meId, onStart);
  useEffect(() => { if (challenge.quick && entry.connected && !entry.ready && !entry.cancelled) entry.confirm(); }, [challenge.quick, entry.connected, entry.ready, entry.cancelled]); // eslint-disable-line react-hooks/exhaustive-deps
  const instructions = challenge.gameType === "futsal" ? ["FUTSAL", "Confirmá tu cinco y leé al rival. 3 ataques por equipo · 15 segundos para elegir."] : challenge.gameType === "trivia" ? ["PREGUNTADOS", "5 preguntas de fútbol. Respondé a tiempo y superá al rival en aciertos."] : challenge.gameType === "truco" ? ["TRUCO", "Jugá tus cartas, cantá envido y desafiá al rival. Confirmá cuando estés listo."] : ["PIEDRA, PAPEL O TIJERA", "Elegí tu mano en secreto. Ganá más rondas que tu rival en 3 enfrentamientos."];
  const isFutsal=challenge.gameType === "futsal";
  const amHost = challenge.fromId === meId;

  const myName = amHost ? challenge.fromName : challenge.toName;
  const opponentName = amHost ? challenge.toName : challenge.fromName;

  const face = (id: string, name: string) => { const p=players.find(p=>p.userId===id) ?? portraits.find(p=>p.userId===id);return isFutsal ? <div className="duel-vs__portrait" role="img" aria-label={`Personaje de ${name}`}><OwnedCardPortrait userId={id} appearanceOverride={p?.appearance} scaleMultiplier={1.08}/></div> : p ? <ArenaAvatar player={p} catalog={catalog} isMe={id===meId} name={name}/> : <span className="duel-vs__avatar"><b>{name.slice(0,1).toUpperCase()}</b></span>; };
  return (
    <div
      className={`duel-vs duel-vs--cinema ${isFutsal?"duel-vs--futsal":""} ${entry.seconds !== null ? "is-counting" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Preparando enfrentamiento"
    >
      <div className="duel-vs__speedlines" aria-hidden="true"/><div className="duel-vs__arena">
        <span className="duel-vs__eyebrow">
          LUPI WORLD · RIVAL ENCONTRADO
        </span>

        <h2 className="duel-vs__heading">{instructions[0]}</h2>

        <div className="duel-vs__fighters">
          <div className="duel-vs__fighter">
            {face(meId,myName)}
            <span className="duel-vs__name">{myName}</span>
            <small>VOS</small>
          </div>

          <div className="duel-vs__duel-center"><span className="duel-vs__versus">VS</span>{isFutsal&&entry.seconds!==null&&<div className="duel-vs__countdown duel-vs__countdown--center" key={entry.seconds} role="timer" aria-label={entry.seconds?`El partido empieza en ${entry.seconds}`:'Empieza el partido'}>{entry.seconds||'¡VAMOS!'}</div>}{isFutsal&&<small className="duel-vs__center-caption">{entry.seconds!==null?'SILBATAZO INICIAL':'DUELO EN LA CANCHA'}</small>}</div>

          <div className="duel-vs__fighter">
            {face(amHost?challenge.toId:challenge.fromId,opponentName)}
            <span className="duel-vs__name">{opponentName}</span>
            <small>RIVAL</small>
          </div>
        </div>

        <div className="duel-vs__brief">{isFutsal?<><div className="duel-vs__match-facts"><span><b>3</b> ATAQUES POR EQUIPO</span><span><b>15s</b> POR DECISIÓN</span><span><b>1 VS 1</b> JUGADAS SECRETAS</span></div><p>Confirmá tu cinco, leé al rival y hacé la diferencia.</p></>:<p>{instructions[1]}</p>}</div>
        <div className="duel-vs__readiness"><span className={entry.ready ? "is-ready" : ""}>{entry.ready ? "✓ ESTOY LISTO" : "○ VOS · PREPARANDO"}</span><span className={entry.rivalReady ? "is-ready" : ""}>{entry.rivalReady ? "✓ RIVAL LISTO" : "○ RIVAL · PREPARANDO"}</span></div>
        {entry.seconds !== null ? !isFutsal&&<div className="duel-vs__countdown" key={entry.seconds}>{entry.seconds || "¡VAMOS!"}</div> : <p className="duel-vs__status">{entry.timedOut ? "El rival no confirmó a tiempo. Volvé al lobby y buscá otro duelo." : entry.cancelled ? "El rival volvió al club." : !entry.connected ? "Conectando con el rival…" : entry.ready ? "Esperando que el rival esté listo…" : "LA ARENA TE ESPERA"}</p>}
        {!entry.cancelled && entry.seconds === null && <button className="duel-vs__ready" type="button" disabled={!entry.connected || entry.ready} onClick={entry.confirm}>{entry.ready ? "ESTÁS LISTO ✓" : "¡VAMOS A JUGAR! →"}</button>}
        <button type="button" className="duel-vs__back" onClick={() => { entry.cancel(); onExit(); }}>VOLVER AL CLUB</button>
      </div>
    </div>
  );
}