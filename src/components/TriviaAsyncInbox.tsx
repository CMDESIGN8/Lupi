import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { AsyncTriviaListItem } from "../lib/triviaAsync";
import "./TriviaAsyncDuel.css";

const timeLeft = (iso: string) => {
  const ms = Date.parse(iso) - Date.now();
  if (ms <= 0) return "vencido";
  const h = Math.floor(ms / 3_600_000), m = Math.floor(ms / 60_000) % 60;
  return h > 0 ? `${h} h ${m} min` : `${Math.max(1, m)} min`;
};

type Props = { items: AsyncTriviaListItem[]; meId: string; onOpen: (item: AsyncTriviaListItem) => void; onDecline: (item: AsyncTriviaListItem) => void };

export function TriviaAsyncInbox({ items, meId, onOpen, onDecline }: Props) {
  if (!items.length) return null;
  return (
    <section className="tai" aria-label="Preguntados por turnos">
      <header><b>🧠 PREGUNTADOS POR TURNOS</b><small>Jugás cuando quieras · 24 h para responder</small></header>
      <ul>
        {items.map(item => {
          const fresh = item.role === "guest" && item.myIndex === 0;
          let text: string, action = "", tone = "";
          if (item.status === "finished") {
            const win = item.winnerId === meId, draw = item.winnerId === null;
            text = item.forfeit ? (win ? `${item.rivalName} no jugó a tiempo: ganaste por abandono` : `No jugaste a tiempo contra ${item.rivalName}`)
              : draw ? `Empataste con ${item.rivalName}` : win ? `¡Le ganaste a ${item.rivalName}!` : `${item.rivalName} te ganó esta vez`;
            action = "VER RESULTADO"; tone = win ? "is-win" : "";
          } else if (item.needsAction) {
            text = fresh ? `${item.rivalName} te desafió · vence en ${timeLeft(item.deadline)}` : `Seguí tu duelo contra ${item.rivalName} · vence en ${timeLeft(item.deadline)}`;
            action = fresh ? "JUGAR" : "CONTINUAR"; tone = "is-action";
          } else {
            text = item.rivalDone ? `Ya terminaste: ${item.rivalName} también. Calculando…` : `Esperando a ${item.rivalName} · le quedan ${timeLeft(item.deadline)}`;
            action = "VER";
          }
          return (
            <li key={item.id} className={tone}>
              <span>{text}</span>
              <div>
                <button type="button" onClick={() => onOpen(item)}>{action}</button>
                {fresh && item.status === "open" && <button type="button" className="tai-decline" onClick={() => onDecline(item)} aria-label={`Rechazar desafío de ${item.rivalName}`}>✕</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AsyncToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDone, 4500);
    return () => window.clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return createPortal(<div className="tai-toast" role="alert">{message}</div>, document.body);
}
