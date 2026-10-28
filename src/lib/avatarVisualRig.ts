/** Avatar V3: rig visual independiente del catálogo y de la persistencia.
 * Agregar presets por id permite corregir un ítem sin tocar Avatar2D.
 * No modifica la base de datos ni las rarezas existentes. */
import type { CSSProperties } from "react";
import type { InventoryItem } from "../hooks/useAuraInventory";
export type AvatarVisualSlot = "top" | "bottom" | "boots" | "accessory";
export type ItemVisual = { x: string; y: string; width: string; height: string; scale: number; rotation: number; z: number };
const DEFAULTS: Record<AvatarVisualSlot, ItemVisual> = {
  top:       { x:"51%", y:"215px", width:"210px", height:"195px", scale:1, rotation:0, z:22 },
  bottom:    { x:"50%", y:"315px", width:"500px", height:"141px", scale:1, rotation:0, z:21 },
  boots:     { x:"50%", y:"455px", width:"130px", height:"75px",  scale:1, rotation:0, z:23 },
  accessory: { x:"50%", y:"60px",  width:"110px", height:"110px", scale:1, rotation:0, z:35 },
};
/** Futuro catálogo: registrar aquí excepciones calibradas para cada ítem. */
export const ITEM_VISUAL_OVERRIDES: Record<string, Partial<ItemVisual>> = {
  "flores-club-8va-camiseta-verde": {
    x: "49%",
    y: "205px",
    width: "210px",
    height: "195px",
    scale: 0.80,
    rotation: 0,
    z: 22,
  },
  "flores-club-8va-short-negro": {
  x: "50%",
  y: "290px",
  width: "700px",
  height: "205px",
  scale: 0.90,
  rotation: 0,
  z: 21,
},
};
export function getItemVisual(slot: AvatarVisualSlot, item: InventoryItem | null): CSSProperties {
  const v = { ...DEFAULTS[slot], ...(item ? ITEM_VISUAL_OVERRIDES[item.id] : {}) };
  return {
    "--item-x":v.x, "--item-y":v.y, "--item-w":v.width, "--item-h":v.height,
    "--item-scale":v.scale, "--item-rotation":`${v.rotation}deg`, "--item-z":v.z,
  } as CSSProperties;
}
