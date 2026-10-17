import { AvatarFace } from "./AvatarFace";
import type { AvatarAppearance } from "../lib/avatarAppearance";
import { useMemo } from "react";
import { getItemVisual, type AvatarVisualSlot } from "../lib/avatarVisualRig";
import type { InventoryItem } from "../hooks/useAuraInventory";
import "./Avatar2D.css";

type Avatar2DProps = {
  items: InventoryItem[];
  level?: number;
  compact?: boolean;
  appearance?: AvatarAppearance;
};

type AvatarLayer = {
  slot: string;
  item: InventoryItem | null;
};

const SLOT_ICONS: Record<string, string> = {
  accessory: "✦",
};

const SLOT_ORDER: AvatarVisualSlot[] = ["top", "bottom", "boots", "accessory"];

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


/** Las mangas se determinan por la prenda equipada, no por el color de piel. */
function isShortSleeveTop(item: InventoryItem | null): boolean {
  if (!item) return false;
  const label = String(item.name ?? "").toLowerCase();
  // GRIND TEE utiliza una campera/hoodie de manga larga en este inventario.
  if (/hoodie|campera|jacket|sweatshirt|buzo|long sleeve|manga larga|grind\s*tee/.test(label)) return false;
  return /farm\s*tee|remera|camiseta|t-shirt|tshirt|short sleeve|manga corta|\btee\b/.test(label);
}

export function Avatar2D({
  items,
  level = 1,
  compact = false,
  appearance,
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

  const shortSleeves = isShortSleeveTop(topItem);
  const baseImage = appearance
    ? `/images/avatar-skin-${appearance.skin.replace("#", "").toLowerCase()}.png`
    : "/images/avatar-base.png";

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

  const visual = useMemo(() => Object.fromEntries(SLOT_ORDER.map(slot => [slot, getItemVisual(slot, layers.find(layer => layer.slot === slot)?.item ?? null)])), [layers]);

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

      <div className="avatar2d__character" data-avatar-rig="v2">

        {/* =========================
            BASE CHARACTER (PNG REAL)
        ========================= */}
        <img
          src={baseImage}
          alt="Avatar Base"
          className="avatar2d__base-image"
          draggable={false}
        />

        {appearance ? (
          <div className="avatar2d__custom-head"><AvatarFace appearance={appearance} className="lw-face--game" /></div>
        ) : (
          <img src="/images/head.png" className="avatar2d__base-head" alt="Cabeza del personaje" draggable={false} />
        )}


        {/* =========================
            CLOTHING LAYERS
        ========================= */}

        {topItem?.imageUrl && (
          <div className="avatar2d__layer avatar2d__layer--top" style={visual["top"]}>
            <AvatarItemImage
              item={topItem}
              className="avatar2d__image"
            />
          </div>
        )}

        {/* Manga corta: restaurar los antebrazos originales del PNG base
            por encima de la remera. No crea rectángulos ni cambia el tono. */}
        {shortSleeves && (
          <div className="avatar2d__short-sleeve-arms" aria-hidden="true">
            <img src={baseImage} className="avatar2d__forearms-image avatar2d__forearms-image--left" alt="" draggable={false} />
            <img src={baseImage} className="avatar2d__forearms-image avatar2d__forearms-image--right" alt="" draggable={false} />
          </div>
        )}

        {bottomItem?.imageUrl && (
          <div className="avatar2d__layer avatar2d__layer--bottom" style={visual["bottom"]}>
            <AvatarItemImage
              item={bottomItem}
              className="avatar2d__image"
            />
          </div>
        )}

        {bootsItem?.imageUrl && (
  <div className="avatar2d__layer avatar2d__layer--boots" style={visual["boots"]}>
    <AvatarItemImage
      item={bootsItem}
      className="avatar2d__image"
    />
  </div>
)}

        {accessoryItem?.imageUrl && (
          <div className="avatar2d__layer avatar2d__layer--accessory" style={visual["accessory"]}>
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
    </div>
  );
}