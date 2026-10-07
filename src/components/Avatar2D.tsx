import { useMemo } from "react";
import type { InventoryItem } from "../hooks/useAuraInventory";
import "./Avatar2D.css";

type Avatar2DProps = {
  items: InventoryItem[];
  level?: number;
  compact?: boolean;
};

type AvatarLayer = {
  slot: string;
  item: InventoryItem | null;
};

const SLOT_ICONS: Record<string, string> = {
  accessory: "✦",
};

const SLOT_ORDER = [
  "top",
  "bottom",
  "boots",
  "accessory",
];

function AvatarItemImage({
  item,
  className,
}: {
  item: InventoryItem | null;
  className: string;
}) {
  if (!item) return null;

  const imageUrl =
    item.equippedImageUrl ?? item.imageUrl;

  if (!imageUrl) return null;

  return (
    <img
      className={className}
      src={imageUrl}
      alt=""
      draggable={false}
    />
  );
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");

  if (clean.length !== 6) {
    return `rgba(0,255,135,${alpha})`;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

export function Avatar2D({
  items,
  level = 1,
  compact = false,
}: Avatar2DProps) {
  const equippedItems = useMemo(
    () => items.filter((item) => item.equipped),
    [items]
  );

  const layers = useMemo<AvatarLayer[]>(
    () =>
      SLOT_ORDER.map((slot) => ({
        slot,
        item:
          equippedItems.find(
            (item) => item.slot === slot
          ) ?? null,
      })),
    [equippedItems]
  );

  const topItem =
    layers.find((x) => x.slot === "top")?.item ?? null;

  const bottomItem =
    layers.find((x) => x.slot === "bottom")?.item ?? null;

  const bootsItem =
    layers.find((x) => x.slot === "boots")?.item ?? null;

  const accessoryItem =
    layers.find((x) => x.slot === "accessory")?.item ?? null;

  const avatarColor =
    topItem?.color ??
    bottomItem?.color ??
    bootsItem?.color ??
    "#00ff87";

  const avatarAura = hexToRgba(
    avatarColor,
    0.22
  );

  const avatarAuraSoft = hexToRgba(
    avatarColor,
    0.08
  );

  return (
    <div
      className={[
        "avatar2d",
        compact ? "avatar2d--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--avatar-color": avatarColor,
          "--avatar-aura": avatarAura,
          "--avatar-aura-soft": avatarAuraSoft,
        } as React.CSSProperties
      }
    >
      <div className="avatar2d__aura" />
      <div className="avatar2d__shadow" />

      <div className="avatar2d__character">

        {/* =========================
            BASE CHARACTER (PNG REAL)
        ========================= */}
        <img
          src="/images/avatar-base.png"
          alt="Avatar Base"
          className="avatar2d__base-image"
          draggable={false}
        />

        <img
          src="/images/head.png"
          className="avatar2d__base-head" alt="Base Head"
          draggable={false}
        />


        {/* =========================
            CLOTHING LAYERS
        ========================= */}

        {topItem?.imageUrl && (
          <div className="avatar2d__layer avatar2d__layer--top">
            <AvatarItemImage
              item={topItem}
              className="avatar2d__image"
            />
          </div>
        )}

        {bottomItem?.imageUrl && (
          <div className="avatar2d__layer avatar2d__layer--bottom">
            <AvatarItemImage
              item={bottomItem}
              className="avatar2d__image"
            />
          </div>
        )}

        {bootsItem?.imageUrl && (
          <>
            {bootsItem?.imageUrl && (
  <div className="avatar2d__layer avatar2d__layer--boots">
    <AvatarItemImage
      item={bootsItem}
      className="avatar2d__image"
    />
  </div>
)}
          </>
        )}

        {accessoryItem?.imageUrl && (
          <div className="avatar2d__layer avatar2d__layer--accessory">
            <AvatarItemImage
              item={accessoryItem}
              className="avatar2d__image"
            />
          </div>
        )}

        {!accessoryItem?.imageUrl && accessoryItem && (
          <div className="avatar2d__accessory-fallback">
            {SLOT_ICONS.accessory}
          </div>
        )}

      </div>

      <div className="avatar2d__level">
        LVL {Math.max(1, level)}
      </div>
    </div>
  );
}