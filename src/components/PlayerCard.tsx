// src/components/PlayerCard.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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

export type PlayerCompetitiveStats = {
  matchesPlayed?: number | null;
  wins?: number | null;
  achievements?: { id: string; title: string; icon?: string }[];
};

type Props = {
  /** Datos competitivos verificados, opcionales hasta conectar Supabase. */
  competitiveStats?: PlayerCompetitiveStats | null;
  /** Jugador seleccionado; null = tarjeta cerrada. */
  player: LobbyPlayer | null;
  meId: string;
  catalog: InventoryItem[];
  muted: boolean;
  /** true si ya tenés un desafío enviado esperando respuesta. */
  challengePending: boolean;
  onClose: () => void;
  onChallenge: (player: LobbyPlayer) => void;
  /** Envía directamente un desafío de la modalidad elegida, sin abrir otro modal. */
  onChallengeGame?: (player: LobbyPlayer, game: ChallengeGame) => void;
  onToggleMute: (userId: string) => void;
  onReport: (userId: string, reason: ReportReason) => Promise<boolean>;
};

export function PlayerCard({
  player,
  competitiveStats,
  meId,
  catalog,
  muted,
  challengePending,
  onClose,
  onChallenge,
  onChallengeGame,
  onToggleMute,
  onReport,
}: Props) {
  const [reporting, setReporting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showChallengeGames, setShowChallengeGames] = useState(true);
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const closeRef = useRef<HTMLButtonElement>(null);

  const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const userId = player?.userId;

  useEffect(() => {
    setReporting(false);
    setShowDetails(false);
    setShowOptions(false);
    setShowChallengeGames(userId !== meId);
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

  return createPortal(
    <div className="pc-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className={`pc pc--profile pc--scouting ${showChallengeGames ? "pc--challenge-view" : ""}`} role="dialog" aria-modal="true" aria-label={`Perfil de ${player.username}`}
        style={{ "--pc-color": main?.color ?? DEFAULT_ITEM_COLOR, "--pc-rarity": RARITY_COLOR[rarityKey] } as CSSProperties}>
        <button ref={closeRef} type="button" className="pc-close" onClick={onClose} aria-label="Cerrar perfil">✕</button>
        <div className="pc-rival__topline"><span>✦ LUPI WORLD</span><span>{isMe ? "TU IDENTIDAD" : "INFORME DE RIVAL"}</span></div>
        {!showChallengeGames && <div className="pc-rival__arena">
          <div className="pc-rival__beams" aria-hidden="true" />
          <div className="pc-rival__halo" aria-hidden="true" />
          <div className="pc-rival__crest" aria-hidden="true">LW</div>
          <div className="pc-rival__character" aria-label={`Equipamiento de ${player.username}`}>
            <div className="pc-rival__head" aria-hidden="true" />
            <div className="pc-rival__torso" aria-hidden="true" />
            <div className="pc-rival__legs" aria-hidden="true" />
            {worn.filter(item => item.slot !== "accessory").map(item => (
              <img key={item.id} className={`pc-rival__wear pc-rival__wear--${item.slot}`} src={item.slot === "boots" ? "/items/equipped/aura-boots.png" : (item.imageUrl || undefined)} alt={item.name} draggable={false} style={{display:item.imageUrl ? undefined : "none"}} />
            ))}
          </div>
          <div className="pc-rival__floor" aria-hidden="true" />
          <div className="pc-rival__rarity">✦ {worn.length ? RARITY_LABEL[rarityKey].toUpperCase() : "JUGADOR"}</div>
          <div className="pc-rival__number">LVL <strong>{player.level}</strong></div>
        </div>}
        {!showChallengeGames && <div className="pc-rival__identity">
          <div className="pc-rival__eyebrow">{isMe ? "TU HISTORIA COMIENZA ACÁ" : "FICHA OFICIAL · LUPI WORLD"}</div>
          <h3 className="pc-rival__name">{player.username}</h3>
          <p className="pc-rival__club">{player.club || "Jugador de Lupi World"}</p>
          <span className={`pc-rival__status pc-tag--${player.activity}`}><i aria-hidden="true" /> {ACTIVITY_LABEL[player.activity]}</span>
        </div>}
        {!showChallengeGames && <div className="pc-scout__section-head"><span>✦ TRAYECTORIA</span><span>SCOUTING · LW</span></div>}
        {!showChallengeGames && <div className="pc-rival__record" aria-label="Trayectoria del jugador">
          <div><strong>{player.level}</strong><span>NIVEL</span></div>
          {competitiveStats?.matchesPlayed != null && <><span className="pc-rival__record-divider" aria-hidden="true" /><div><strong>{competitiveStats.matchesPlayed}</strong><span>PARTIDOS</span></div></>}
          {competitiveStats?.wins != null && <><span className="pc-rival__record-divider" aria-hidden="true" /><div><strong>{competitiveStats.wins}</strong><span>VICTORIAS</span></div></>}
          {competitiveStats?.achievements != null && <><span className="pc-rival__record-divider" aria-hidden="true" /><div><strong>{competitiveStats.achievements.length}</strong><span>LOGROS</span></div></>}
        </div>
        }
        {showChallengeGames && <div className="pc-scout__compact"><div className="pc-scout__compact-avatar">{main?.imageUrl ? <img src={main.imageUrl} alt="" /> : "⚔"}</div><div><span className="pc-scout__compact-kicker">RIVAL EN LA ARENA · NIVEL {player.level}</span><strong>{player.username}</strong><small>{player.club || "Lupi World"} · {ACTIVITY_LABEL[player.activity]}</small></div></div>}
        <div className="pc-scout__tabs" aria-label="Secciones del jugador">
          <button type="button" className={!showChallengeGames ? "pc-scout__tab pc-scout__tab--active" : "pc-scout__tab"} onClick={() => setShowChallengeGames(false)}>PERFIL · INFO</button>
          {!isMe && <button type="button" className={showChallengeGames ? "pc-scout__tab pc-scout__tab--active" : "pc-scout__tab"} onClick={() => setShowChallengeGames(true)}>⚔ DESAFÍOS</button>}
        </div>
        {!isMe && !reporting && showChallengeGames && <div className="pc-scout__challenges">
          <div className="pc-scout__section-head"><span>⚔ ELEGÍ LA MODALIDAD</span><span>{player.username}</span></div>
          <div className="pc-scout__game-grid">
            {([
              { game: "rps" as ChallengeGame, icon: "✊", title: "PIEDRA, PAPEL O TIJERA", description: "Duelo por rondas", available: true },
              { game: "futsal" as ChallengeGame, icon: "⚽", title: "FUTSAL", description: "Partido competitivo · PvP en desarrollo", available: false },
              { game: "trivia" as ChallengeGame, icon: "🧠", title: "PREGUNTADOS", description: "Próximamente", available: false },
              { game: "truco" as ChallengeGame, icon: "🃏", title: "TRUCO", description: "Próximamente", available: false },
            ]).map(option => <button key={option.game} type="button" className="pc-scout__game" disabled={!canChallenge || !option.available || !onChallengeGame} onClick={() => onChallengeGame?.(player, option.game)}>
              <span className="pc-scout__game-icon" aria-hidden="true">{option.icon}</span><span><strong>{option.title}</strong><small>{option.description}</small></span><span aria-hidden="true">{option.available ? "→" : "🔒"}</span>
            </button>)}
          </div>
          {!onChallengeGame && <p className="pc-scout__game-note">Conectá onChallengeGame en GameHub para enviar desafíos desde esta ficha.</p>}
          <p className="pc-scout__game-note">Elegí tu próximo duelo. Tu rival recibirá una invitación.</p>
        </div>}
        {isMe && <p className="pc-profile__own-note">Este es tu jugador. Personalizalo desde el vestuario.</p>}
        {!showChallengeGames && <button type="button" className="pc-rival__expand" aria-expanded={showDetails} onClick={() => setShowDetails(value => !value)}>{showDetails ? "OCULTAR EQUIPAMIENTO Y LOGROS" : "VER EQUIPAMIENTO Y LOGROS"} <span>{showDetails ? "⌃" : "⌄"}</span></button>}
        {!showChallengeGames && showDetails && <div className="pc-rival__details">
          <div className="pc-profile__section-title">✦ EQUIPAMIENTO <span>{worn.length}/4</span></div>
          <div className="pc-profile__slots">{SLOT_ORDER.map(slot => {
            const item = worn.find(entry => entry.slot === slot);
            const slotName = {top:"REMERA",bottom:"SHORT",boots:"BOTINES",accessory:"ACCESORIO"}[slot];
            return <div key={slot} className={`pc-profile__slot ${item ? "pc-profile__slot--equipped" : ""}`} title={item?.name || `${slotName} sin equipar`}><div className="pc-profile__slot-image">{item?.imageUrl ? <img src={slot === "boots" ? "/items/equipped/aura-boots.png" : item.imageUrl} alt="" draggable={false}/> : <span>{item?.icon || "＋"}</span>}</div><span>{slotName}</span></div>;
          })}</div>
          <div className="pc-profile__section-title pc-rival__ach-title">✦ LOGROS DESTACADOS</div>
          {competitiveStats?.achievements?.length ? <div className="pc-profile__achievement-list">{competitiveStats.achievements.slice(0,3).map(achievement => <span className="pc-profile__achievement" key={achievement.id}>{achievement.icon || "🏆"} {achievement.title}</span>)}</div> : <p className="pc-profile__achievements-empty">Todavía no hay logros públicos disponibles.</p>}
        </div>}
        {!isMe && !reporting && <>
          <button type="button" className="pc-rival__more" aria-expanded={showOptions} onClick={() => setShowOptions(value => !value)}>⋯ Opciones de jugador</button>
          {showOptions && <div className="pc-profile__secondary pc-rival__moderation"><button type="button" className="pc-btn pc-btn--ghost" onClick={() => onToggleMute(player.userId)}>{muted ? "Dejar de silenciar" : "Silenciar"}</button><button type="button" className="pc-btn pc-btn--ghost pc-btn--danger" onClick={() => setReporting(true)}>Reportar</button></div>}
        </>}
        {!isMe && reporting && <div className="pc-report">
          {reportState === "sent" ? <p className="pc-report__msg">Gracias. Vamos a revisar este reporte.</p> : <>
            <p className="pc-report__title">¿Qué pasó?</p>
            {REPORT_REASONS.map((reason) => <button key={reason.id} type="button" className="pc-btn" disabled={reportState === "sending"} onClick={() => sendReport(reason.id)}>{reason.label}</button>)}
            {reportState === "error" && <p className="pc-report__msg pc-report__msg--error">No se pudo enviar el reporte. Probá de nuevo en un rato.</p>}
          </>}
          <button type="button" className="pc-btn pc-btn--ghost" onClick={() => setReporting(false)}>Volver</button>
        </div>}
      </section>
    </div>,
    document.body
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
  onDismissDaily?: (id: string) => void;
};

const GAME_NAMES: Record<ChallengeGame, string> = { futsal: "Futsal", trivia: "Preguntados", rps: "Piedra, papel o tijera", truco: "Truco", physical: "Reto físico" };

const OUTCOME_TEXT: Record<ChallengeOutcome["kind"], (name: string) => string> = {
  declined: (name) => `${name} rechazó el desafío.`,
  busy: (name) => `${name} está ocupado.`,
  expired: (name) => `${name} no respondió.`,
};


/** Avisos flotantes: desafío recibido, desafío enviado y resultado. */
export function ChallengeToasts({
  incoming, outgoing, outcome, respond, cancel, dailyChallenges = [], onDismissDaily,
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
              <button type="button" className="pc-toast__daily-close" onClick={() => onDismissDaily?.(challenge.id)} aria-label={`Cerrar logro ${challenge.title}`}>×</button>
              <div className="pc-toast__daily-content"><strong>DESAFÍO COMPLETADO</strong><span>{challenge.title}</span>
                <small>{challenge.progress}/{challenge.requirement}{challenge.rewardXp ? ` · +${challenge.rewardXp} XP` : ""}{challenge.rewardCoins ? ` · +${challenge.rewardCoins} 💰` : ""}</small>
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