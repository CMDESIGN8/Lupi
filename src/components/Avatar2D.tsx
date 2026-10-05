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

const SLOT_LABELS: Record<string, string> = {
  top: "TOP",
  bottom: "BOTTOM",
  boots: "BOOTS",
  accessory: "ACCESSORY",
};

const SLOT_ICONS: Record<string, string> = {
  top: "👕",
  bottom: "🩳",
  boots: "👟",
  accessory: "✦",
};

const SLOT_ORDER = [
  "top",
  "bottom",
  "boots",
  "accessory",
];

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

  const topItem = layers.find(
    (layer) => layer.slot === "top"
  )?.item;

  const bottomItem = layers.find(
    (layer) => layer.slot === "bottom"
  )?.item;

  const bootsItem = layers.find(
    (layer) => layer.slot === "boots"
  )?.item;

  const accessoryItem = layers.find(
    (layer) => layer.slot === "accessory"
  )?.item;

  return (
    <div
      className={[
        "avatar2d",
        compact ? "avatar2d--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* AURA */}
      <div className="avatar2d__aura" />

      {/* SHADOW */}
      <div className="avatar2d__shadow" />

      {/* CHARACTER */}
      <div className="avatar2d__character">
        {/* HEAD */}
        <div className="avatar2d__head">
          <div className="avatar2d__hair" />

          <div className="avatar2d__face">
            <span className="avatar2d__eye avatar2d__eye--left" />
            <span className="avatar2d__eye avatar2d__eye--right" />
          </div>

          {accessoryItem && (
            <div
              className="avatar2d__accessory"
              title={accessoryItem.name}
            >
              {SLOT_ICONS.accessory}
            </div>
          )}
        </div>

        {/* BODY */}
        <div
          className="avatar2d__top"
          style={{
            background:
              topItem?.color ??
              "linear-gradient(135deg, #20252c, #101318)",
          }}
        >
          <div className="avatar2d__top-detail">
            {topItem?.name?.slice(0, 3).toUpperCase() ??
              "LUP"}
          </div>

          <div className="avatar2d__number">
            {Math.max(1, level)}
          </div>
        </div>

        {/* ARMS */}
        <div className="avatar2d__arm avatar2d__arm--left" />
        <div className="avatar2d__arm avatar2d__arm--right" />

        {/* BOTTOM */}
        <div
          className="avatar2d__bottom"
          style={{
            background:
              bottomItem?.color ??
              "linear-gradient(135deg, #151820, #080a0d)",
          }}
        />

        {/* LEGS */}
        <div className="avatar2d__leg avatar2d__leg--left" />
        <div className="avatar2d__leg avatar2d__leg--right" />

        {/* BOOTS */}
        <div
          className="avatar2d__boot avatar2d__boot--left"
          style={{
            background:
              bootsItem?.color ?? "#101318",
          }}
        />

        <div
          className="avatar2d__boot avatar2d__boot--right"
          style={{
            background:
              bootsItem?.color ?? "#101318",
          }}
        />
      </div>
    </div>
  );
}