// src/components/VestuarioFeed.tsx
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNpcFeed } from "../hooks/useNpcFeed";
import { NPCS, type NpcContext } from "../lib/npcScenes";
import "./VestuarioFeed.css";

type Props = {
  ctx: NpcContext;
  /** jugadores reales conectados, sin contarte a vos */
  realOthers: number;
};

const MUTE_KEY = "lupi:npc-muted";

export function VestuarioFeed({ ctx, realOthers }: Props) {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const { messages, typing, retired } = useNpcFeed({ ctx, realOthers, enabled: !muted });

  const logRef = useRef<HTMLOListElement>(null);

  // Baja solo dentro del recuadro (sin mover la página).
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* sin storage */
      }
      return next;
    });
  };

  // La sala ya tiene movimiento real y no quedó nada que mostrar: el panel desaparece.
  if (retired && messages.length === 0) return null;

  const typingNpc = typing ? NPCS[typing] : null;

  return (
    <section className="vf" aria-label="Vestuario: tips de los NPC">
      <header className="vf-head">
        <h2 className="vf-title">Vestuario</h2>
        <span className="vf-badge">NPC · tips del juego</span>
        <button type="button" className="vf-mute" onClick={toggleMute} aria-pressed={muted}>
          {muted ? "Activar tips" : "Silenciar"}
        </button>
      </header>

      {muted ? (
        <p className="vf-note">Tips silenciados.</p>
      ) : (
        <ol className="vf-log" ref={logRef} role="log" aria-live="off">
          {messages.length === 0 && !typing && (
            <li className="vf-note">Los muchachos están llegando al vestuario...</li>
          )}

          {messages.map((m) => {
            const npc = NPCS[m.who];
            return (
              <li key={m.key} className="vf-msg" style={{ "--vf-color": npc.color } as CSSProperties}>
                <span className="vf-avatar" aria-hidden>{npc.emoji}</span>
                <div className="vf-body">
                  <div className="vf-meta">
                    <strong>{npc.name}</strong>
                    <span className="vf-tag">{npc.tag}</span>
                    <span className="vf-npc">NPC</span>
                  </div>
                  <p>{m.text}</p>
                </div>
              </li>
            );
          })}

          {typingNpc && (
            <li className="vf-typing" style={{ "--vf-color": typingNpc.color } as CSSProperties}>
              <span className="vf-avatar" aria-hidden>{typingNpc.emoji}</span>
              <span className="vf-dots" aria-label={`${typingNpc.name} está escribiendo`}>
                <i /><i /><i />
              </span>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}