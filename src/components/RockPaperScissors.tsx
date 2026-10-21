import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
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
  const reported = useRef(false);
  const [communityReport, setCommunityReport] = useState("");
  useEffect(() => {
    if (!challenge.communityId || state?.status !== "finished" || reported.current) return;
    reported.current = true;
    void supabase.rpc("record_community_rps_result", {
      p_community_id: challenge.communityId,
      p_match_id: challenge.id,
      p_host_id: challenge.fromId,
      p_guest_id: challenge.toId,
    }).then(({ data, error: reportError }) => {
      if (reportError) { setCommunityReport("No se pudo registrar en la comunidad: " + reportError.message); return; }
      setCommunityReport(data?.confirmed ? "✓ Resultado confirmado para el ranking comunitario" : "Duelo finalizado. El resultado del ranking comunitario espera la confirmación del rival.");
    });
  }, [challenge, state?.status]);
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
      {communityReport && <p role="status" className="rps-community-report">{communityReport}</p>}
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
