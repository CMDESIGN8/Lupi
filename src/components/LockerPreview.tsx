import { useEffect, useMemo, useState } from "react";
import {
  useAuraInventory,
  DEFAULT_ITEM_COLOR,
  type InventoryItem,
  type ItemSlot,
} from "../hooks/useAuraInventory";
import "./LockerPreview.css";
import { Avatar2D } from "./Avatar2D";

type LockerPreviewProps = {
  userId: string;
  level: number;
  onOpenInventory?: () => void;
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
}: LockerPreviewProps) {
  const {
    items,
    loading,
    toggleEquip,
  } = useAuraInventory(userId, level);

  const [selectedSlot, setSelectedSlot] =
    useState<ItemSlot | null>(null);

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

    await toggleEquip(itemId);
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
      className="locker-preview"
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
                item
                  ? "equipped"
                  : "empty",
                isSelected
                  ? "selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={colorVar(
                item?.color ??
                  DEFAULT_ITEM_COLOR
              )}
              onClick={() =>
                handleSlotClick(slot)
              }
            >
              <div className="locker-slot-icon">
  {item ? (
    <LockerItemVisual item={item} />
  ) : (
    <span className="locker-slot-emoji">
      {meta.icon}
    </span>
  )}
</div>

              <div className="locker-slot-info">
                <span>{meta.label}</span>

                <strong>
                  {item?.name ?? "VACÍO"}
                </strong>
              </div>

              <span className="locker-slot-arrow">
                {isSelected ? "−" : "+"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ITEM SELECTOR */}

      {selectedSlot && (
        <div className="locker-selector">
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
                NO HAY ITEMS
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
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={colorVar(
                      item.color
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
                          item.color,
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
                            : "EQUIPAR"}
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