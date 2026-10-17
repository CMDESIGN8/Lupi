// src/components/player-card/PlayerCard.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_ITEM_COLOR, type InventoryItem } from "../../hooks/useAuraInventory";
import type { ChallengeGame } from "../../hooks/useLobbyChallenges";
import type { ReportReason } from "../../hooks/useLobbyModeration";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { ChallengeSelector } from "./ChallengeSelector";
import { ACTIVITY_LABEL, RARITY_COLOR, RARITY_ORDER, RARITY_RANK, SLOT_ORDER } from "./constants";
import { trapTabKey } from "./hooks";
import { LockerPanel } from "./LockerPanel";
import { ModerationBar, ReportPanel } from "./Moderation";
import { PlayerHero } from "./PlayerHero";
import { ProfilePanel } from "./ProfilePanel";
import { mockProfileFor } from "./profile-utils";
import { TrophyCase } from "./TrophyCase";
import type { PlayerCardTab, PlayerCompetitiveStats, PlayerProfile } from "./types";
import { XpBar } from "./XpBar";
import "./challenge-toasts.css";
import "./player-card.css";

export type PlayerCardProps = {
  /** Jugador seleccionado; null = tarjeta cerrada. */
  player: LobbyPlayer | null;
  meId: string;
  catalog: InventoryItem[];
  muted: boolean;
  /** true si ya tenés un desafío enviado esperando respuesta. */
  challengePending: boolean;
  /** Datos competitivos verificados, opcionales hasta conectar Supabase. */
  competitiveStats?: PlayerCompetitiveStats | null;
  /** Perfil público: OVR, posición, dorsal, XP, racha, forma y atributos. */
  profile?: PlayerProfile | null;
  /** Rellena un perfil de ejemplo si no llega `profile`. Solo para desarrollo. */
  previewMock?: boolean;
  /** Pestaña inicial. Por defecto: "perfil" para vos y "desafiar" para otros jugadores. */
  defaultTab?: PlayerCardTab;
  onClose: () => void;
  /** @deprecated Ya no se usa: los desafíos salen por `onChallengeGame`. Se mantiene para no romper llamadas existentes. */
  onChallenge?: (player: LobbyPlayer) => void;
  /** Envía directamente un desafío de la modalidad elegida, sin abrir otro modal. */
  onChallengeGame?: (player: LobbyPlayer, game: ChallengeGame) => void;
  /** Abre el vestuario. Se muestra solo en tu propio perfil. */
  onOpenLocker?: () => void;
  onToggleMute: (userId: string) => void;
  onReport: (userId: string, reason: ReportReason) => Promise<boolean>;
};

export function PlayerCard(props: PlayerCardProps) {
  const { player } = props;
  if (!player) return null;
  // key: al cambiar de jugador se reinicia todo el estado y se repite la entrada.
  return <PlayerCardView key={player.userId} {...props} player={player} />;
}

type ViewProps = Omit<PlayerCardProps, "player"> & { player: LobbyPlayer };
type TabDef = { id: PlayerCardTab; label: string };

function PlayerCardView({
  player,
  competitiveStats,
  profile: profileProp,
  previewMock = false,
  defaultTab,
  meId,
  catalog,
  muted,
  challengePending,
  onClose,
  onChallengeGame,
  onOpenLocker,
  onToggleMute,
  onReport,
}: ViewProps) {
  const isMe = player.userId === meId;
  const [tab, setTab] = useState<PlayerCardTab>(() => {
    if (defaultTab && !(defaultTab === "desafiar" && isMe)) return defaultTab;
    return isMe ? "perfil" : "desafiar";
  });
  const [reporting, setReporting] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const worn = useMemo(
    () =>
      SLOT_ORDER.flatMap((slot) => {
        const id = player.look[slot];
        const item = id ? byId.get(id) : undefined;
        return item && item.slot === slot ? [item] : [];
      }),
    [byId, player.look],
  );
  const main = worn.find((item) => item.slot === "top") ?? worn[0];
  const rank = worn.reduce((max, item) => Math.max(max, RARITY_RANK[item.rarity] ?? 0), 0);
  const rarityKey: string = RARITY_ORDER[rank];

  const profile = profileProp ?? (previewMock ? mockProfileFor(player) : null);

  const canChallenge = !isMe && player.activity === "lobby" && !challengePending;
  const challengeNote = challengePending
    ? "Esperando respuesta…"
    : player.activity === "in-match"
      ? "En partido: podés desafiarlo cuando vuelva al lobby."
      : player.activity === "idle"
        ? "Ausente: no puede recibir desafíos ahora."
        : null;

  const tabs: TabDef[] = [
    { id: "perfil", label: "PERFIL" },
    { id: "vestuario", label: "VESTUARIO" },
    { id: "vitrina", label: "VITRINA" },
    ...(isMe ? [] : [{ id: "desafiar" as const, label: "⚔ DESAFIAR" }]),
  ];

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const current = tabs.findIndex((entry) => entry.id === tab);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(current + step + tabs.length) % tabs.length];
    setTab(next.id);
    document.getElementById(`lw-tab-${next.id}`)?.focus();
    event.preventDefault();
  };

  const sendReport = async (reason: ReportReason) => {
    setReportState("sending");
    const ok = await onReport(player.userId, reason);
    setReportState(ok ? "sent" : "error");
  };

  const compact = tab === "desafiar" || reporting;

  return createPortal(
    <div className="lw-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        className="lw-card"
        data-rarity={rarityKey}
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${player.username}`}
        onKeyDown={trapTabKey}
        style={
          {
            "--pc-color": main?.color ?? DEFAULT_ITEM_COLOR,
            "--lw-rarity": RARITY_COLOR[rarityKey],
          } as CSSProperties
        }
      >
        <header className="lw-top">
          <span>✦ LUPI WORLD</span>
          <span className="lw-top__tag">{isMe ? "TU IDENTIDAD" : "INFORME DE RIVAL"}</span>
          <button ref={closeRef} type="button" className="lw-close" onClick={onClose} aria-label="Cerrar perfil">
            ✕
          </button>
        </header>

        <PlayerHero player={player} worn={worn} rarityKey={rarityKey} profile={profile} compact={compact} />

        <div className="lw-identity">
          <h3 className="lw-identity__name">{player.username}</h3>
          <p className="lw-identity__club">{player.club || "Jugador de Lupi World"}</p>
          <div className="lw-chips">
            <span className="lw-chip" data-activity={player.activity}>
              <i aria-hidden="true" /> {ACTIVITY_LABEL[player.activity]}
            </span>
            {profile && profile.streakDays > 0 && (
              <span className="lw-chip lw-chip--streak" title="Racha de días seguidos">
                🔥 {profile.streakDays} {profile.streakDays === 1 ? "día" : "días"}
              </span>
            )}
            {profile && profile.form.length > 0 && (
              <span
                className="lw-form"
                role="img"
                aria-label={`Últimos ${profile.form.length}: ${profile.form
                  .map((r) => (r === "G" ? "ganó" : r === "E" ? "empató" : "perdió"))
                  .join(", ")}`}
              >
                <span className="lw-form__label" aria-hidden="true">
                  Forma
                </span>
                {profile.form.map((result, i) => (
                  <b key={i} data-r={result} aria-hidden="true">
                    {result}
                  </b>
                ))}
              </span>
            )}
          </div>
        </div>

        {profile && <XpBar level={player.level} xp={profile.xp} xpToNext={profile.xpToNext} showNumbers={isMe} />}

        <div className="lw-tabs" role="tablist" aria-label="Secciones del jugador" onKeyDown={onTabKey}>
          {tabs.map((entry) => (
            <button
              key={entry.id}
              id={`lw-tab-${entry.id}`}
              type="button"
              role="tab"
              className="lw-tab"
              aria-selected={tab === entry.id}
              aria-controls="lw-panel"
              tabIndex={tab === entry.id ? 0 : -1}
              onClick={() => {
                setTab(entry.id);
                setReporting(false);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div
          key={reporting ? "report" : tab}
          id="lw-panel"
          className="lw-panel"
          role="tabpanel"
          aria-labelledby={`lw-tab-${tab}`}
        >
          {reporting ? (
            <ReportPanel state={reportState} onPick={sendReport} onBack={() => setReporting(false)} />
          ) : tab === "perfil" ? (
            <ProfilePanel player={player} profile={profile} stats={competitiveStats} />
          ) : tab === "vestuario" ? (
            <LockerPanel worn={worn} isMe={isMe} onOpenLocker={onOpenLocker} />
          ) : tab === "vitrina" ? (
            <TrophyCase achievements={competitiveStats?.achievements} />
          ) : (
            <ChallengeSelector
              player={player}
              canChallenge={canChallenge}
              statusNote={challengeNote}
              onChallengeGame={onChallengeGame}
            />
          )}
        </div>

        {!isMe && !reporting && (
          <ModerationBar
            muted={muted}
            onToggleMute={() => onToggleMute(player.userId)}
            onReport={() => {
              setReportState("idle");
              setReporting(true);
            }}
          />
        )}
      </section>
    </div>,
    document.body,
  );
}
