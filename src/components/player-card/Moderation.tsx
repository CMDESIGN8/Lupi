// src/components/player-card/Moderation.tsx
import { useState } from "react";
import type { ReportReason } from "../../hooks/useLobbyModeration";
import { REPORT_REASONS } from "./constants";

type BarProps = {
  muted: boolean;
  onToggleMute: () => void;
  onReport: () => void;
};

/** Opciones secundarias: silenciar y reportar. Quedan fijas al pie, fuera del scroll. */
export function ModerationBar({ muted, onToggleMute, onReport }: BarProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lw-moderation">
      <button type="button" className="lw-more" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        ⋯ Opciones de jugador
      </button>
      {open && (
        <div className="lw-moderation__options">
          <button type="button" className="pc-btn pc-btn--ghost" onClick={onToggleMute}>
            {muted ? "Dejar de silenciar" : "Silenciar"}
          </button>
          <button type="button" className="pc-btn pc-btn--ghost pc-btn--danger" onClick={onReport}>
            Reportar
          </button>
        </div>
      )}
    </div>
  );
}

type ReportProps = {
  state: "idle" | "sending" | "sent" | "error";
  onPick: (reason: ReportReason) => void;
  onBack: () => void;
};

export function ReportPanel({ state, onPick, onBack }: ReportProps) {
  return (
    <div className="lw-report">
      {state === "sent" ? (
        <p className="lw-report__msg">Gracias. Vamos a revisar este reporte.</p>
      ) : (
        <>
          <p className="lw-report__title">¿Qué pasó?</p>
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.id}
              type="button"
              className="pc-btn"
              disabled={state === "sending"}
              onClick={() => onPick(reason.id)}
            >
              {reason.label}
            </button>
          ))}
          {state === "error" && (
            <p className="lw-report__msg lw-report__msg--error" role="alert">
              No se pudo enviar el reporte. Probá de nuevo en un rato.
            </p>
          )}
        </>
      )}
      <button type="button" className="pc-btn pc-btn--ghost" onClick={onBack}>
        Volver
      </button>
    </div>
  );
}
