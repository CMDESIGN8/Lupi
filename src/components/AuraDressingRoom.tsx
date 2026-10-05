import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useGLTF } from "@react-three/drei";
import { Player3D, DEFAULT_MODEL_URL } from "./Player3D";
import {
  useAuraInventory,
  DEFAULT_ITEM_COLOR,
  type InventoryItem,
  type ItemSlot,
} from "../hooks/useAuraInventory";
import "./AuraDressingRoom.css";

type AuraDressingRoomProps = {
  userId: string;
  level: number;
  onGetReal?: (item: InventoryItem) => void;
};

const SLOT_META: Record<ItemSlot, { label: string; icon: string; side: "left" | "right"; row: "top" | "mid" | "bottom" }> = {
  top:       { label: "TOP",     icon: "👕", side: "left",  row: "top"    },
  bottom:    { label: "BOTTOM",  icon: "🩳", side: "left",  row: "mid"    },
  boots:     { label: "BOTINES", icon: "👟", side: "right", row: "bottom" },
  accessory: { label: "EXTRA",   icon: "🧢", side: "right", row: "top"    },
};

const MODEL_PRIORITY: ItemSlot[] = ["top", "bottom", "boots", "accessory"];

const colorVar = (color: string) =>
  ({ "--item-color": color } as CSSProperties);

function ItemVisual({ item }: { item: InventoryItem }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item.imageUrl]);

  if (!item.imageUrl || failed) {
    return <span className="dr-emoji">{item.icon}</span>;
  }

  return (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="dr-img"
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export function AuraDressingRoom({
  userId,
  level,
  onGetReal,
}: AuraDressingRoomProps) {
  const { items, loading, toggleEquip } = useAuraInventory(userId, level);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ItemSlot | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  const previewItem = items.find((i) => i.id === previewId) ?? null;

  // Precargar solo lo razonable: el modelo actual y los equipados.
  // Evitamos disparar 20 descargas al montar.
  useEffect(() => {
    const candidates = new Set<string>();
    items.forEach((i) => {
      if (i.modelUrl && (i.equipped || i.id === previewId)) {
        candidates.add(i.modelUrl);
      }
    });
    candidates.forEach((url) => useGLTF.preload(url));
  }, [items, previewId]);

  // Modelo visible: preview → equipado por prioridad → default
  // El 3D solo cambia cuando hay un item EQUIPADO (no preview).
// En preview, el slot muestra la imagen pero el 3D queda en el base.
const modelUrl = useMemo(() => {
  for (const slot of MODEL_PRIORITY) {
    const eq = items.find((i) => i.equipped && i.slot === slot && i.modelUrl);
    if (eq?.modelUrl) return eq.modelUrl;
  }
  return DEFAULT_MODEL_URL;
}, [items]);

  const glowItem =
    previewItem ??
    MODEL_PRIORITY.map((s) => items.find((i) => i.equipped && i.slot === s)).find(Boolean) ??
    null;

  const glowColor = glowItem?.color ?? DEFAULT_ITEM_COLOR;

  const equippedCount = items.filter((i) => i.equipped).length;
  const ownedCount = items.filter((i) => i.owned).length;
  const visibleItems = filter ? items.filter((i) => i.slot === filter) : items;
  const [justEquipped, setJustEquipped] = useState<ItemSlot | null>(null);

  const handleToggle = async (item: InventoryItem) => {
  await toggleEquip(item.id);
  setFlashKey((k) => k + 1);
  setPreviewId(null);
  setJustEquipped(item.slot);
  window.setTimeout(() => setJustEquipped(null), 500);
};

  const handleGetReal = (item: InventoryItem) => {
    if (onGetReal) return onGetReal(item);
    if (item.shopUrl) {
      window.open(item.shopUrl, "_blank", "noopener,noreferrer");
      return;
    }
    console.log("Ver producto real:", item.id);
  };

  const getStatus = (item: InventoryItem) => {
    if (item.equipped) return "EQUIPADO";
    if (item.owned) return "TUYO";
    if (level < item.requiredLevel) return `LVL ${item.requiredLevel}`;
    return "PROBAR";
  };

  if (loading) {
    return <div className="dressing-room dr-loading">Cargando probador...</div>;
  }

  const renderSlot = (slot: ItemSlot) => {
  const equipped = items.find((i) => i.slot === slot && i.equipped);
  const isActive = filter === slot;
  const isPreviewSlot = previewItem?.slot === slot;
  const displayItem = isPreviewSlot ? previewItem : equipped;
  const meta = SLOT_META[slot];

  return (
    <button
      key={slot}
      type="button"
      style={colorVar(displayItem?.color ?? DEFAULT_ITEM_COLOR)}
      onClick={() => setFilter((f) => (f === slot ? null : slot))}
      className={[
        "dr-slot",
        `dr-slot-${meta.side}`,
        `dr-slot-row-${meta.row}`,
        displayItem ? "filled" : "empty",
        isPreviewSlot ? "previewing" : "",
        isActive ? "active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={isActive}
      aria-label={`Slot ${meta.label}${displayItem ? `, ${displayItem.name}` : ", vacío"}`}
    >
      <span className="dr-slot-connector" aria-hidden="true" />
      <span className="dr-slot-frame">
        <span className="dr-slot-visual">
          {displayItem ? (
            <ItemVisual item={displayItem} />
          ) : (
            <span className="dr-slot-empty">{meta.icon}</span>
          )}
        </span>
        <span className="dr-slot-tag">{meta.label}</span>
      </span>
      <span className="dr-slot-name">
        {displayItem ? displayItem.name : "VACÍO"}
      </span>
    </button>
  );
};
  return (
    <div className="dressing-room" style={colorVar(glowColor)}>
      {/* ===== ESCENARIO ===== */}
      <div className={`dr-stage ${previewItem ? "previewing" : ""}`}>
        <div className="dr-stage-photo" aria-hidden="true" />
        <div className="dr-stage-photo-overlay" aria-hidden="true" />

        <div className="dr-stage-bg" aria-hidden="true" />
        <div className="dr-stage-grid" aria-hidden="true" />
        <div className="dr-stage-floor" aria-hidden="true" />
        <div className="dr-stage-vignette" aria-hidden="true" />
        <div className="dr-platform-ring" aria-hidden="true" />

        {/* Slots izquierda */}
        <div className="dr-rail dr-rail-left">
          {renderSlot("top")}
          {renderSlot("bottom")}
        </div>

        {/* Personaje */}
        <div className="dr-character">
          <div className="dr-glow" />
          <div className="dr-platform" aria-hidden="true" />

          <Player3D modelUrl={modelUrl} />

          {flashKey > 0 && (
  <div key={flashKey} className="dr-burst" aria-hidden="true">
    {Array.from({ length: 12 }).map((_, i) => (
      <span
        key={i}
        className="dr-burst-particle"
        style={{ "--angle": `${i * 30}deg` } as CSSProperties}
      />
    ))}
  </div>
)}

          <div className={`dr-badge ${previewItem ? "previewing" : ""}`}>
             <span className="dr-badge-icon">
    {previewItem ? "👁" : equippedCount > 0 ? "✓" :  "○"}
  </span>
  <span className="dr-badge-text">
    {previewItem
      ? "PROBANDO"
      : equippedCount > 0
      ? "EQUIPADO"
      : "SIN EQUIPAR"}
  </span>
</div>
        </div>

        {/* Slots derecha */}
        <div className="dr-rail dr-rail-right">
          {renderSlot("accessory")}
          {renderSlot("boots")}
        </div>
        
      </div>

      {/* ===== BANNER DE PRUEBA ===== */}
      {previewItem && (
        <div className="dr-banner" style={colorVar(previewItem.color)}>
          <div className="dr-banner-thumb">
            <ItemVisual item={previewItem} />
          </div>

          <div className="dr-banner-info">
            <small>
              {previewItem.equipped
                ? "EQUIPADO"
                : previewItem.owned
                ? "PROBANDO"
                : "PROBANDO · AÚN NO LO TENÉS"}
            </small>
            <strong>{previewItem.name}</strong>
            <span>
              {previewItem.drop}
              {!previewItem.owned && level < previewItem.requiredLevel
                ? ` · LVL ${previewItem.requiredLevel}`
                : ""}
            </span>
          </div>

          <div className="dr-banner-actions">
            {previewItem.owned ? (
              <button
                type="button"
                className="dr-btn dr-btn-primary"
                onClick={() => handleToggle(previewItem)}
              >
                {previewItem.equipped ? "DESEQUIPAR" : "EQUIPAR"}
              </button>
            ) : (
              <button
                type="button"
                className="dr-btn dr-btn-primary"
                onClick={() => handleGetReal(previewItem)}
              >
                CONSEGUIR
              </button>
            )}

            <button
              type="button"
              className="dr-btn dr-btn-ghost"
              onClick={() => setPreviewId(null)}
              aria-label="Cerrar prueba"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ===== CARRUSEL ===== */}
      <div className="dr-header">
        <span className="dr-title">
          {filter ? SLOT_META[filter].label : "INVENTARIO"}
        </span>
        <span className="dr-count">
          {ownedCount} / {items.length}
        </span>
      </div>

      <div className="dr-carousel">
        {visibleItems.length === 0 && (
          <div className="dr-empty">No hay items en este slot todavía.</div>
        )}

        {visibleItems.map((item) => (
          <button
            key={item.id}
            type="button"
            style={colorVar(item.color)}
            onClick={() => setPreviewId(item.id === previewId ? null : item.id)}
            className={[
              "dr-tile",
              item.owned ? "owned" : "locked",
              item.equipped ? "equipped" : "",
              item.id === previewId ? "previewing" : "",
            ].join(" ")}
          >
            <div className="dr-tile-visual">
              <ItemVisual item={item} />
              {!item.owned && <span className="dr-lock">🔒</span>}
            </div>
            <strong>{item.name}</strong>
            <span className="dr-tile-status">{getStatus(item)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}