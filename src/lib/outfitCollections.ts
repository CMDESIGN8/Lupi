import type { InventoryItem } from "../hooks/useAuraInventory";

export type OutfitCollection = {
  id: string;
  title: string;
  season: string;
  description: string;
  itemIds: readonly string[];
};

// Los IDs son los registrados en aura_items. No modifica tablas ni inventarios.
export const OUTFIT_COLLECTIONS: readonly OutfitCollection[] = [
  {
    id: "flores-club-2026",
    title: "FLORES CLUB",
    season: "TEMPORADA 2026",
    description: "Uniforme rojo titular",
    itemIds: ["flores-club-camiseta-roja", "flores-club-short-rojo"],
  },
];

export function collectionProgress(collection: OutfitCollection, items: InventoryItem[]) {
  const found = collection.itemIds.map(id => items.find(item => item.id === id));
  return {
    found: found.filter((item): item is InventoryItem => !!item),
    owned: found.filter(item => item?.owned).length,
    equipped: found.length > 0 && found.every(item => item?.equipped),
    total: collection.itemIds.length,
  };
}
