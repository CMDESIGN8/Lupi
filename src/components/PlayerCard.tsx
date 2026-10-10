// src/components/PlayerCard.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  DEFAULT_ITEM_COLOR,
  type InventoryItem,
  type ItemSlot,
} from "../hooks/useAuraInventory";
import type { LobbyActivity, LobbyPlayer } from "../hooks/useLobbyPresence";
import type { Challenge, ChallengeOutcome, ChallengeGame } from "../hooks/useLobbyChallenges";
import type { ReportReason } from "../hooks/useLobbyModeration";
import "./PlayerCard.css";

const SLOT_ORDER: ItemSlot[] = ["top", "bottom", "boots", "accessory"];
const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
const RARITY_COLOR: Record<string, string> = {
  common: "#9aa4a0",
  rare: "#3b9bff",
  epic: "#b061ff",
  legendary: "#ffb629",
};
const RARITY_LABEL: Record<string, string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria",
};
const ACTIVITY_LABEL: Record<LobbyActivity, string> = {
  lobby: "En el lobby",
  "in-match": "En partido",
  idle: "Ausente",
};
const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "abuso", label: "Insultos o lenguaje ofensivo" },
  { id: "acoso", label: "Acoso" },
  { id: "otro", label: "Otro" },
];

type Props = {
  /** Jugador seleccionado; null = tarjeta cerrada. */
  player: LobbyPlayer | null;
  meId: string;
  catalog: InventoryItem[];
  muted: boolean;
  /** true si ya tenés un desafío enviado esperando respuesta. */
  challengePending: boolean;
  onClose: () => void;
  onChallenge: (player: LobbyPlayer) => void;
  onToggleMute: (userId: string) => void;
  onReport: (userId: string, reason: ReportReason) => Promise<boolean>;
};

export function PlayerCard({
  player,
  meId,
  catalog,
  muted,
  challengePending,
  onClose,
  onChallenge,
  onToggleMute,
  onReport,
}: Props) {
  const [reporting, setReporting] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const closeRef = useRef<HTMLButtonElement>(null);

  const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const userId = player?.userId;

  useEffect(() => {
    setReporting(false);
    setReportState("idle");
    if (userId) closeRef.current?.focus();
  }, [userId]);

  useEffect(() => {
    if (!player) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, onClose]);

  if (!player) return null;

  const worn = SLOT_ORDER.flatMap((slot) => {
    const id = player.look[slot];
    const item = id ? byId.get(id) : undefined;
    return item && item.slot === slot ? [item] : [];
  });
  const main = worn.find((item) => item.slot === "top") ?? worn[0];
  const rank = worn.reduce((max, item) => Math.max(max, RARITY_RANK[item.rarity] ?? 0), 0);
  const rarityKey = Object.keys(RARITY_RANK)[rank];

  const isMe = player.userId === meId;
  const canChallenge = !isMe && player.activity === "lobby" && !challengePending;
  const challengeLabel = challengePending
    ? "Esperando respuesta…"
    : player.activity === "in-match"
      ? "En partido"
      : player.activity === "idle"
        ? "Ausente"
        : "⚔ Desafiar";

  const sendReport = async (reason: ReportReason) => {
    setReportState("sending");
    const ok = await onReport(player.userId, reason);
    setReportState(ok ? "sent" : "error");
  };

  return (
    <div className="pc-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className="pc"
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${player.username}`}
        style={
          {
            "--pc-color": main?.color ?? DEFAULT_ITEM_COLOR,
            "--pc-rarity": RARITY_COLOR[rarityKey],
          } as CSSProperties
        }
      >
        <button ref={closeRef} type="button" className="pc-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="pc-avatar">
          {main?.imageUrl ? (
            <img src={main.imageUrl} alt="" draggable={false} />
          ) : (
            <span aria-hidden>{main?.icon || "👤"}</span>
          )}
          <span className="pc-level">{player.level}</span>
        </div>

        <h3 className="pc-name">{isMe ? `${player.username} (vos)` : player.username}</h3>
        {player.club && <p className="pc-club">{player.club}</p>}

        <div className="pc-tags">
          <span className={`pc-tag pc-tag--${player.activity}`}>
            <i aria-hidden /> {ACTIVITY_LABEL[player.activity]}
          </span>
          <span className="pc-tag">Nivel {player.level}</span>
          {worn.length > 0 && <span className="pc-tag pc-tag--rarity">{RARITY_LABEL[rarityKey]}</span>}
        </div>

        {!isMe && !reporting && (
          <div className="pc-actions">
            <button
              type="button"
              className="pc-btn pc-btn--primary"
              disabled={!canChallenge}
              onClick={() => onChallenge(player)}
            >
              {challengeLabel}
            </button>
            <button type="button" className="pc-btn" onClick={() => onToggleMute(player.userId)}>
              {muted ? "Dejar de silenciar" : "Silenciar"}
            </button>
            <button type="button" className="pc-btn pc-btn--danger" onClick={() => setReporting(true)}>
              Reportar
            </button>
          </div>
        )}

        {!isMe && reporting && (
          <div className="pc-report">
            {reportState === "sent" ? (
              <p className="pc-report__msg">Gracias. Vamos a revisar este reporte.</p>
            ) : (
              <>
                <p className="pc-report__title">¿Qué pasó?</p>
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    className="pc-btn"
                    disabled={reportState === "sending"}
                    onClick={() => sendReport(reason.id)}
                  >
                    {reason.label}
                  </button>
                ))}
                {reportState === "error" && (
                  <p className="pc-report__msg pc-report__msg--error">
                    No se pudo enviar el reporte. Probá de nuevo en un rato.
                  </p>
                )}
              </>
            )}
            <button type="button" className="pc-btn pc-btn--ghost" onClick={() => setReporting(false)}>
              Volver
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export type DailyChallengeToast = {
  id: string;
  title: string;
  progress: number;
  requirement: number;
  rewardXp?: number;
  rewardCoins?: number;
};

type ToastsProps = {
  incoming: Challenge | null;
  outgoing: Challenge | null;
  outcome: ChallengeOutcome | null;
  respond: (accept: boolean) => void;
  cancel: () => void;
  dailyChallenges?: DailyChallengeToast[];
};

const GAME_NAMES: Record<ChallengeGame, string> = { futsal: "Futsal", trivia: "Preguntados", rps: "Piedra, papel o tijera", truco: "Truco", physical: "Reto físico" };

const OUTCOME_TEXT: Record<ChallengeOutcome["kind"], (name: string) => string> = {
  declined: (name) => `${name} rechazó el desafío.`,
  busy: (name) => `${name} está ocupado.`,
  expired: (name) => `${name} no respondió.`,
};


/** Avisos flotantes: desafío recibido, desafío enviado y resultado. */
export function ChallengeToasts({
  incoming, outgoing, outcome, respond, cancel, dailyChallenges = [],
}: ToastsProps) {
  const gameName = (type?: string) => type === "rps" ? "PIEDRA, PAPEL O TIJERA" : "FUTSAL";
  if (!incoming && !outgoing && !outcome && dailyChallenges.length === 0) return null;
  return (
    <>
      {(incoming || outgoing) && (
        <div className="pc-challenge-overlay">
          <section className="pc-challenge-modal" role="dialog" aria-modal="true" aria-label="Desafío de Lupi World">
            <div className="pc-challenge-modal__icon" aria-hidden="true">⚔</div>
            <span className="pc-challenge-modal__eyebrow">LUPI WORLD · {gameName((incoming ?? outgoing)?.gameType)}</span>
            <h2 className="pc-challenge-modal__title">{incoming ? "¡TE DESAFÍAN!" : "DESAFÍO ENVIADO"}</h2>
            <p className="pc-challenge-modal__description">
              {incoming ? <><strong>{incoming.fromName}</strong> te desafía a {gameName(incoming.gameType)}.</> : <>Esperando la respuesta de <strong>{outgoing?.toName}</strong>...</>}
            </p>
            {outgoing && !incoming && (
              <div className="pc-challenge-modal__waiting" aria-label="Esperando respuesta"><span/><span/><span/></div>
            )}
            <div className="pc-challenge-modal__actions">
              {incoming ? (
                <>
                  <button type="button" className="pc-btn pc-btn--primary" onClick={() => respond(true)}>⚔ ACEPTAR</button>
                  <button type="button" className="pc-btn" onClick={() => respond(false)}>RECHAZAR</button>
                </>
              ) : (
                <button type="button" className="pc-btn" onClick={cancel}>CANCELAR DESAFÍO</button>
              )}
            </div>
          </section>
        </div>
      )}
      {outcome && <div className="pc-notifications" role="status" aria-live="polite"><div className="pc-toast pc-toast--info">{OUTCOME_TEXT[outcome.kind](outcome.name)}</div></div>}
      {dailyChallenges.length > 0 && (
        <div className="pc-daily-notifications" aria-live="polite">
          {dailyChallenges.map((challenge) => (
            <div key={challenge.id} className="pc-toast pc-toast--daily" role="status">
              <div className="pc-toast__daily-icon">🏆</div>
              <div className="pc-toast__daily-content"><strong>DESAFÍO COMPLETADO</strong><span>{challenge.title}</span>
                <small>{challenge.progress}/{challenge.requirement}{challenge.rewardXp ? ` · +${challenge.rewardXp} XP` : ""}{challenge.rewardCoins ? ` · +${challenge.rewardCoins} 🪙` : ""}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

type DuelSummaryProps = {
  opponentName: string;
  mine: { userScore: number; rivalScore: number };
  /** undefined = el rival todavía no terminó. */
  theirs?: { userScore: number; rivalScore: number };
  onClose: () => void;
};

/** Resultado del duelo: gana la mejor diferencia de gol; si empatan, el que más goles hizo. */
export function DuelSummary({ opponentName, mine, theirs, onClose }: DuelSummaryProps) {
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
        <span>Vos: {mine.userScore} – {mine.rivalScore}</span>
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