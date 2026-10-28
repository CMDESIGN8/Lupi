import type { InventoryItem } from "../hooks/useAuraInventory";

export type OutfitCollection = {
  id: string;
  title: string;
  season: string;
  description: string;
  itemIds: readonly string[];
  status?: "upcoming";
  theme?: "red" | "green" | "muted";
};

// Los IDs son los registrados en aura_items. No modifica tablas ni inventarios.
export const OUTFIT_COLLECTIONS: readonly OutfitCollection[] = [
  {
    id: "flores-club-2026",
    title: "FLORES CLUB · ARQUEROS",
    season: "TEMPORADA 2026",
    description: "Arqueros · Temporada 2026",
    theme: "red",
    itemIds: ["flores-club-camiseta-roja", "flores-club-short-rojo"],
  },
  {
    id: "flores-club-8va-2026",
    title: "FLORES CLUB · 8.ª DIVISIÓN",
    season: "TEMPORADA 2026",
    description: "Camiseta verde · Short negro · Sponsor LupiApp",
    itemIds: ["flores-club-8va-camiseta-verde", "flores-club-8va-short-negro"],
    theme: "green",
  },
  ...[7, 6, 5].map(division => ({
    id: `flores-club-${division}division-2026`,
    title: `FLORES CLUB · ${division}.ª DIVISIÓN`,
    season: "TEMPORADA 2026",
    description: "Próximamente",
    itemIds: [] as string[],
    status: "upcoming" as const,
    theme: "muted" as const,
  })),
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
