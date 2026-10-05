// src/components/LobbyPlayers.tsx
import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  DEFAULT_ITEM_COLOR,
  type InventoryItem,
  type ItemSlot,
} from "../hooks/useAuraInventory";
import type { LobbyPlayer, LobbyStatus } from "../hooks/useLobbyPresence";
import "./LobbyPlayers.css";

type Props = {
  players: LobbyPlayer[];
  meId: string;
  /** Catálogo completo de items (owned o no): sirve para traducir ids a imagen/color/rareza. */
  catalog: InventoryItem[];
  status: LobbyStatus;
  /** Cuántas fichas mostrar antes de colapsar en "+N" */
  max?: number;
  /** Al tocar una ficha (abre la PlayerCard). */
  onSelectPlayer?: (userId: string) => void;
};

const SLOT_ORDER: ItemSlot[] = ["top", "bottom", "boots", "accessory"];

const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
const RARITY_COLOR: Record<string, string> = {
  common: "#9aa4a0",
  rare: "#3b9bff",
  epic: "#b061ff",
  legendary: "#ffb629",
};

function ItemVisual({ item }: { item: InventoryItem }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.imageUrl]);

  if (!item.imageUrl || failed) return <span className="lp-emoji">{item.icon}</span>;
  return (
    <img
      src={item.imageUrl}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export function LobbyPlayers({ players, meId, catalog, status, max = 14, onSelectPlayer }: Props) {
  const byId = useMemo(() => new Map(catalog.map((i) => [i.id, i])), [catalog]);

  // Yo primero; el resto en orden de llegada (el hook ya los entrega así).
  const ordered = useMemo(() => {
    const me = players.filter((p) => p.userId === meId);
    const others = players.filter((p) => p.userId !== meId);
    return [...me, ...others];
  }, [players, meId]);

  const visible = ordered.slice(0, max);
  const hidden = ordered.length - visible.length;
  const onlyMe = ordered.length <= 1;

  return (
    <section className="lp" aria-label="Jugadores conectados">
      <header className="lp-head">
        <span className={`lp-live lp-live--${status}`} aria-hidden />
        <h2 className="lp-title">En línea</h2>
        <span className="lp-count">
          {status === "offline"
            ? "Sin conexión"
            : `${ordered.length} ${ordered.length === 1 ? "jugador" : "jugadores"}`}
        </span>
      </header>

      <ul className="lp-list">
        {visible.map((p) => {
          // Cada id se valida contra el catálogo y contra el slot: lo que no existe, no se dibuja.
          const worn: InventoryItem[] = [];
          const bySlot: Partial<Record<ItemSlot, InventoryItem>> = {};
          for (const slot of SLOT_ORDER) {
            const id = p.look[slot];
            const item = id ? byId.get(id) : undefined;
            if (item && item.slot === slot) {
              bySlot[slot] = item;
              worn.push(item);
            }
          }

          const main = bySlot.top ?? worn[0];
          const color = main?.color ?? DEFAULT_ITEM_COLOR;
          const rank = worn.reduce((m, i) => Math.max(m, RARITY_RANK[i.rarity] ?? 0), 0);
          const rarityColor = RARITY_COLOR[Object.keys(RARITY_RANK)[rank]];
          const isMe = p.userId === meId;

          return (
            <li
              key={p.userId}
              className={`lp-chip ${isMe ? "is-me" : ""}`}
              style={{ "--lp-color": color, "--lp-rarity": rarityColor } as CSSProperties}
              title={`${p.username}${p.club ? ` · ${p.club}` : ""} · Nivel ${p.level}`}
              {...(onSelectPlayer
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: () => onSelectPlayer(p.userId),
                    onKeyDown: (e: ReactKeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectPlayer(p.userId);
                      }
                    },
                  }
                : {})}
            >
              <div className="lp-avatar">
                {main ? <ItemVisual item={main} /> : <span className="lp-emoji">👤</span>}
                {bySlot.boots && <span className="lp-corner lp-corner--boots">{bySlot.boots.icon}</span>}
                {bySlot.accessory && <span className="lp-corner lp-corner--extra">{bySlot.accessory.icon}</span>}
                <span className={`lp-dot lp-dot--${p.activity}`} aria-hidden />
                <span className="lp-level">{p.level}</span>
              </div>
              <strong className="lp-name">{isMe ? "Vos" : p.username}</strong>
              <small className="lp-club">{p.club ?? "\u00A0"}</small>
            </li>
          );
        })}

        {hidden > 0 && (
          <li className="lp-chip lp-chip--more" aria-label={`${hidden} jugadores más`}>
            <div className="lp-avatar lp-avatar--more">+{hidden}</div>
          </li>
        )}
      </ul>

      {onlyMe && status !== "offline" && (
        <p className="lp-empty">Por ahora sos el único en la sala. Cuando entre alguien más, lo vas a ver acá.</p>
      )}
    </section>
  );
}