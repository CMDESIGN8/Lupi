import { useState } from "react";
import { createPortal } from "react-dom";
import type { QuickGame } from "../hooks/useQuickDuel";
import { duelFx } from "../lib/duelFx";
import "./QuickDuelPanel.css";

type Props = {
  /** "inline": tarjeta con los botones (va dentro de la hoja Social). "pill": estado flotante mientras buscás. */
  variant: "inline" | "pill";
  /** Tu racha de victorias actual (solo se muestra en la tarjeta). */
  streak?: number;
  game: QuickGame | null; seconds: number; others: number; notice: string; disabled?: boolean;
  onStart: (g: QuickGame) => void; onCancel: () => void; onDismissNotice: () => void;
};

const NAME: Record<QuickGame, string> = { rps: "✊ Piedra, papel o tijera", trivia: "🧠 Preguntados" };

export function QuickDuelPanel({ variant, streak = 0, game, seconds, others, notice, disabled, onStart, onCancel, onDismissNotice }: Props) {
  const [fxOn, setFxOn] = useState(() => !duelFx.isMuted());
  if (variant === "pill") {
    if (game) {
      return createPortal(
        <div className="qd-pill" role="status" aria-live="polite">
          <span className="qd-pill__radar" aria-hidden="true" />
          <span className="qd-pill__text"><b>BUSCANDO RIVAL</b> · {game === "rps" ? "✊" : "🧠"} {seconds}s{others > 0 ? ` · ${others} más` : ""}</span>
          <button type="button" onClick={onCancel} aria-label="Cancelar búsqueda">✕</button>
        </div>,
        document.body,
      );
    }
    if (notice) {
      return createPortal(
        <div className="qd-pill qd-pill--notice" role="status">
          <span className="qd-pill__text">{notice}</span>
          <button type="button" onClick={onDismissNotice} aria-label="Cerrar aviso">✕</button>
        </div>,
        document.body,
      );
    }
    return null;
  }
  return (
    <section className="qd-card" aria-label="Duelo rápido">
      <header><b>⚡ DUELO RÁPIDO{streak >= 1 ? ` · 🔥 RACHA ${streak}` : ""}</b><small>Rival global · PPT: práctica con bot si no hay rival</small></header>
      {game ? (
        <div className="qd-card__searching" role="status" aria-live="polite">
          <span><b>Buscando rival…</b> {NAME[game]} · {seconds}s{others > 0 ? ` · ${others} más buscando` : ""}</span>
          <button type="button" onClick={onCancel}>CANCELAR</button>
        </div>
      ) : (
        <div className="qd-card__buttons">
          <button type="button" disabled={disabled} onClick={() => onStart("rps")}>{NAME.rps}</button>
          <button type="button" disabled={disabled} onClick={() => onStart("trivia")}>{NAME.trivia}</button>
        </div>
      )}
      <button type="button" className="qd-card__fx" onClick={() => { duelFx.setMuted(fxOn); setFxOn(!fxOn); }}>{fxOn ? "🔊 Sonido y vibración: SÍ" : "🔇 Sonido y vibración: NO"}</button>
    </section>
  );
}
