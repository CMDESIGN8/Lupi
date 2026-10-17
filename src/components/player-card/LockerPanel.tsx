// src/components/player-card/LockerPanel.tsx
import type { CSSProperties } from "react";
import type { InventoryItem } from "../../hooks/useAuraInventory";
import { RARITY_COLOR, SLOT_LABEL, SLOT_ORDER, wornImageSrc } from "./constants";

type Props = {
  worn: InventoryItem[];
  isMe: boolean;
  onOpenLocker?: () => void;
};

export function LockerPanel({ worn, isMe, onOpenLocker }: Props) {
  return (
    <>
      <h4 className="lw-heading">
        Equipamiento <span>{worn.length}/4</span>
      </h4>
      <div className="lw-slots">
        {SLOT_ORDER.map((slot) => {
          const item = worn.find((entry) => entry.slot === slot);
          const src = item ? wornImageSrc(item) : undefined;
          return (
            <div
              key={slot}
              className="lw-slot"
              data-filled={Boolean(item)}
              title={item?.name || `${SLOT_LABEL[slot]} sin equipar`}
              style={{ "--slot-rarity": RARITY_COLOR[item?.rarity ?? "common"] } as CSSProperties}
            >
              <div className="lw-slot__frame">
                {src ? <img src={src} alt="" draggable={false} /> : <span aria-hidden="true">{item?.icon || "＋"}</span>}
              </div>
              <span className="lw-slot__label">{SLOT_LABEL[slot]}</span>
              <span className="lw-slot__name">{item?.name ?? "Vacío"}</span>
            </div>
          );
        })}
      </div>
      {isMe && (
        <>
          <p className="lw-note">Este es tu jugador. Personalizalo desde el vestuario.</p>
          {onOpenLocker && (
            <button type="button" className="pc-btn pc-btn--primary" onClick={onOpenLocker}>
              Ir al vestuario
            </button>
          )}
        </>
      )}
    </>
  );
}
