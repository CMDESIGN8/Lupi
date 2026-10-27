import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import {
  useAuraInventory,
  DEFAULT_ITEM_COLOR,
  type InventoryItem,
  type ItemSlot,
} from "../hooks/useAuraInventory";
import "./LockerPreview.css";
import { AURA_RARITY_COLORS } from "../lib/auraRarity";
import { Avatar2D } from "./Avatar2D";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";

type LockerPreviewProps = {
  userId: string;
  level: number;
  onOpenInventory?: () => void;
  onboardingEquipRequest?: number;
  onboardingActive?: boolean;
};

const SLOT_META: Record<
  ItemSlot,
  { label: string; icon: string }
> = {
  top: {
    label: "TOP",
    icon: "👕",
  },
  bottom: {
    label: "BOTTOM",
    icon: "🩳",
  },
  boots: {
    label: "BOTINES",
    icon: "👟",
  },
  accessory: {
    label: "EXTRA",
    icon: "🧢",
  },
};

const SLOT_ORDER: ItemSlot[] = [
  "top",
  "bottom",
  "boots",
  "accessory",
];

const colorVar = (color: string) =>
  ({
    "--locker-color": color,
  } as React.CSSProperties);



function LockerItemVisual({
  item,
}: {
  item: InventoryItem;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item.imageUrl]);

  if (!item.imageUrl || failed) {
    return (
      <span className="locker-slot-emoji">
        {item.icon}
      </span>
    );
  }

  return (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="locker-slot-img"
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export function LockerPreview({
  userId,
  level,
  onOpenInventory,
  onboardingEquipRequest = 0,
  onboardingActive = false,
}: LockerPreviewProps) {
  const { appearance } = useAvatarAppearance(userId);
  const {
    items,
    loading,
    toggleEquip,
  } = useAuraInventory(userId, level);

  const [guideComplete, setGuideComplete] = useState(false);
  const [selectedSlot, setSelectedSlot] =
    useState<ItemSlot | null>(null);

  // El CTA del tutorial abre realmente el selector de prendas.
  useEffect(() => {
    if (!onboardingEquipRequest || loading) return;
    const preferred: ItemSlot[] = ["top", "bottom", "boots", "accessory"];
    const slot = preferred.find(candidate => items.some(item => item.slot === candidate && item.owned && !item.equipped))
      ?? preferred.find(candidate => items.some(item => item.slot === candidate && item.owned))
      ?? "top";
    setGuideComplete(false);
    setSelectedSlot(slot);
  }, [onboardingEquipRequest, loading]);

  const equippedItems = useMemo(
    () => items.filter((item) => item.equipped),
    [items]
  );

  const equippedCount = equippedItems.length;

  const mainItem =
    equippedItems[0] ?? null;

  const displayColor =
    mainItem?.color ?? DEFAULT_ITEM_COLOR;

  const rarity =
    mainItem?.rarity?.toUpperCase() ?? "COMMON";
  

  const selectedItems = useMemo(() => {
    if (!selectedSlot) return [];

    return items
      .filter(
        (item) => item.slot === selectedSlot
      )
      .sort((a, b) => {
        if (a.owned !== b.owned) {
          return a.owned ? -1 : 1;
        }

        if (a.equipped !== b.equipped) {
          return a.equipped ? -1 : 1;
        }

        return (
          a.requiredLevel -
          b.requiredLevel
        );
      });
  }, [items, selectedSlot]);

  const handleSlotClick = (
    slot: ItemSlot
  ) => {
    console.log(
      "[LOCKER] slot:",
      slot
    );

    setSelectedSlot((current) =>
      current === slot ? null : slot
    );
  };

  const handleItemClick = async (
    itemId: string
  ) => {
    console.log(
      "[LOCKER] equip:",
      itemId
    );

    const target = items.find(item => item.id === itemId);
    if (!target?.owned || target.equipped) return;
    try {
      await toggleEquip(itemId);
      if (onboardingActive) {
        setGuideComplete(true);
        setSelectedSlot(null);
      }
    } catch (error) {
      console.error("No se pudo equipar la prenda", error);
    }
  };

  if (loading) {
    return (
      <div className="locker-preview locker-preview-loading">
        <span className="locker-loading-dot" />
        CARGANDO LOCKER...
      </div>
    );
  }

  return (
    <section
      className={`locker-preview ${onboardingActive ? "locker-preview--guided" : ""}`}
      style={colorVar(displayColor)}
    >
      {/* HEADER */}

      <header className="locker-header">
        <div>
          <span className="locker-kicker">
            MI VESTUARIO
          </span>

          <h2 className="locker-title">
            LOCKER
          </h2>
        </div>

        <div className="locker-level">
          <span>LV</span>
          <strong>{level}</strong>
        </div>
      </header>

      {/* CHARACTER */}

      <div className="locker-character">
        <div
          className="locker-character-glow"
          aria-hidden="true"
        />

        <div
          className="locker-character-grid"
          aria-hidden="true"
        />

        <div className="locker-platform">
          <span />
        </div>

        <div className="locker-avatar">
          <Avatar2D
            items={items}
            level={level}
            appearance={appearance}
          />
        </div>

        <div className="locker-rarity">
          <span
            className="locker-rarity-dot"
            style={colorVar(displayColor)}
          />

          <span>{rarity}</span>
        </div>
      </div>

      {/* EQUIPMENT */}

      <div className="locker-equipment">
        {SLOT_ORDER.map((slot) => {
          const item =
            equippedItems.find(
              (candidate) =>
                candidate.slot === slot
            );

          const meta = SLOT_META[slot];

          const isSelected =
            selectedSlot === slot;

          return (
            <button
              key={slot}
              type="button"
              className={[
                "locker-slot",
                item ? "equipped" : "empty locker-slot--pending",
                isSelected
                  ? "selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
  {
    "--slot-rarity": item
      ? AURA_RARITY_COLORS[item.rarity]
      : "#A7B6AF",

    borderColor: item
      ? AURA_RARITY_COLORS[item.rarity]
      : "rgba(220, 235, 226, 0.19)",

    boxShadow: item
      ? `0 0 12px ${AURA_RARITY_COLORS[item.rarity]}35`
      : "none",
  } as React.CSSProperties
}
              aria-label={`${meta.label}: ${item ? item.name : "elegir prenda"}`}
              onClick={() =>
                handleSlotClick(slot)
              }
            >
              <div className="locker-slot-icon">
  {item ? (
    <LockerItemVisual item={item} />
  ) : (
    <span className="locker-slot-pending-icon" aria-hidden="true">
      +
    </span>
  )}
</div>

              <span className="locker-slot-guided-label">{meta.icon} {meta.label}</span>
              <div className="locker-slot-info">
                <span>{meta.label}</span>

                <strong>
                  {item?.name ?? "EQUIPAR +"}
                </strong>
              </div>

              <span className="locker-slot-arrow">
                {isSelected ? "−" : "+"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedSlot && createPortal(
        <div className="locker-selector-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSlot(null); }}>
        <div className={`locker-selector locker-selector--portal ${onboardingActive ? "locker-selector--tutorial" : ""}`} role="dialog" aria-modal="true" aria-label={`Elegir ${SLOT_META[selectedSlot].label}`} >

          <div className="locker-selector-header">
            <div>
              <span>
                SELECCIONAR
              </span>

              <strong>
                {SLOT_META[selectedSlot].icon}{" "}
                {SLOT_META[selectedSlot].label}
              </strong>
            </div>

            <button
              type="button"
              className="locker-selector-close"
              onClick={() =>
                setSelectedSlot(null)
              }
            >
              ×
            </button>
          </div>

          <div className="locker-items">
            {selectedItems.length === 0 ? (
              <div className="locker-items-empty">
                Todavía no tenés prendas en esta categoría. Cerrá este panel y probá otra, o conseguí una prenda en la tienda.
              </div>
            ) : (
              selectedItems.map((item) => {
                const locked =
                  !item.owned;

                const equipped =
                  item.equipped;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={locked}
                    className={[
                      "locker-item",
                      equipped
                        ? "equipped"
                        : "",
                      locked
                        ? "locked"
                        : "",
                      onboardingActive && !locked && !equipped ? "locker-item--guided" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={colorVar(
                        AURA_RARITY_COLORS[item.rarity]
                      )}
                    onClick={() =>
                      handleItemClick(
                        item.id
                      )
                    }
                  >
                    <div
                      className="locker-item-icon"
                      style={{
                        background:
                            AURA_RARITY_COLORS[item.rarity],
                      }}
                    >
                      {item.icon}
                    </div>

                    <div className="locker-item-info">
                      <span>
                        {item.rarity.toUpperCase()}
                      </span>

                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {locked
                          ? `LV ${item.requiredLevel}`
                          : equipped
                            ? "EQUIPADO"
                            : onboardingActive ? "TOCÁ PARA EQUIPAR →" : "EQUIPAR"}
                      </small>
                    </div>

                    {equipped && (
                      <div className="locker-item-check">
                        ✓
                      </div>
                    )}

                    {locked && (
                      <div className="locker-item-lock">
                        🔒
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
        </div>,
        document.body
      )}

      {/* FOOTER */}

      <footer className="locker-footer">
        <div className="locker-equipped">
          <span>EQUIPAMIENTO</span>

          <strong>
            {equippedCount}/4
          </strong>
        </div>

        <button
          type="button"
          className="locker-inventory-button"
          onClick={onOpenInventory}
        >
          ABRIR INVENTARIO
          <span>→</span>
        </button>
      </footer>
    </section>
  );
}