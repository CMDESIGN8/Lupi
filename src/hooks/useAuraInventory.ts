import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type ItemSlot = "top" | "bottom" | "boots" | "accessory";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";
export type ItemWorld = "URBAN" | "GAMER" | "SPORT";

export type InventoryItem = {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  world: ItemWorld | null;
  drop: string;
  icon: string;
  imageUrl: string | null;
  modelUrl: string | null;
  shopUrl: string | null;
  color: string;
  requiredLevel: number;
  owned: boolean;
  equipped: boolean;
  equippedImageUrl: string | null;
};

type CatalogRow = {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  world: ItemWorld | null;
  drop_code: string;
  icon: string;
  image_url: string | null;
  model_url: string | null;
  shop_url: string | null;
  color: string | null;
  required_level: number;
  equipped_image_url: string | null;
};

export const DEFAULT_ITEM_COLOR = "#00ff88";

/** Color por item (se usa si la DB no tiene `color`). */
export const COLOR_BY_ID: Record<string, string> = {
  "farm-tee": "#22e07a",   // verde
  "sport-aura": "#00e5ff", // cyan
  "grind-tee": "#ff2bd6",  // fucsia
  "aura-boots": "#ffb629", // dorado
};

/** Convención de imágenes: /public/items/<id>.png */
const defaultImage = (id: string) => `/items/${id}.png`;

/**
 * Catálogo local de respaldo (modo prototipo).
 */
const FALLBACK_CATALOG: Omit<InventoryItem, "owned" | "equipped">[] = [
  {
    id: "grind-tee",
    name: "GRIND TEE",
    slot: "top",
    rarity: "common",
    world: "URBAN",
    drop: "DROP 001",
    icon: "👕",
    imageUrl: defaultImage("grind-tee"),
    equippedImageUrl: null,
    modelUrl: null,
    shopUrl: null,
    color: COLOR_BY_ID["grind-tee"],
    requiredLevel: 1,
  },
  {
    id: "farm-tee",
    name: "FARM TEE",
    slot: "top",
    rarity: "rare",
    world: "URBAN",
    drop: "DROP 001",
    icon: "👕",
    imageUrl: defaultImage("farm-tee"),
    equippedImageUrl: null,
    modelUrl: null,
    shopUrl: null,
    color: COLOR_BY_ID["farm-tee"],
    requiredLevel: 3,
  },
  {
    id: "sport-aura",
    name: "SPORT AURA",
    slot: "top",
    rarity: "epic",
    world: "SPORT",
    drop: "DROP 001",
    icon: "🎽",
    imageUrl: defaultImage("sport-aura"),
    equippedImageUrl: null,
    modelUrl: null,
    shopUrl: null,
    color: COLOR_BY_ID["sport-aura"],
    requiredLevel: 11,
  },
  {
    id: "aura-boots",
    name: "AURA BOOTS",
    slot: "boots",
    rarity: "legendary",
    world: null,
    drop: "CUSTOM",
    icon: "👟",
    imageUrl: defaultImage("aura-boots"),
    equippedImageUrl: "/items/equipped/aura-boots.png",
    modelUrl: null,
    shopUrl: null,
    color: COLOR_BY_ID["aura-boots"],
    requiredLevel: 1,
  },
];

export function useAuraInventory(userId: string, level: number) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;

    const [catalogRes, ownedRes] = await Promise.all([
      supabase
        .from("aura_items")
        .select("*")
        .order("required_level", { ascending: true }),
      supabase
        .from("user_items")
        .select("item_id, equipped")
        .eq("user_id", userId),
    ]);

    const catalog = catalogRes.data as CatalogRow[] | null;

    if (catalogRes.error || ownedRes.error || !catalog?.length) {
      const seenSlots = new Set<ItemSlot>();

      setItems(
        FALLBACK_CATALOG.map((item) => {
          const owned = level >= item.requiredLevel;
          const equipped = owned && !seenSlots.has(item.slot);
          if (equipped) seenSlots.add(item.slot);
          return { ...item, owned, equipped };
        })
      );
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    const ownedMap = new Map<string, boolean>(
      (ownedRes.data ?? []).map((row) => [row.item_id, !!row.equipped])
    );

    setItems(
      catalog.map((row) => ({
        id: row.id,
        name: row.name,
        slot: row.slot,
        rarity: row.rarity,
        world: row.world,
        drop: row.drop_code,
        icon: row.icon,
        imageUrl: row.image_url ?? defaultImage(row.id),
        modelUrl: row.model_url,
        shopUrl: row.shop_url,
        color: row.color ?? COLOR_BY_ID[row.id] ?? DEFAULT_ITEM_COLOR,
        requiredLevel: row.required_level,
        owned: ownedMap.has(row.id) || level >= row.required_level,
        equipped: ownedMap.get(row.id) ?? false,
        // Imagen específica para avatar equipado
        equippedImageUrl: row.equipped_image_url,
      }))
    );
    setUsingFallback(false);
    setLoading(false);
  }, [userId, level]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEquip = useCallback(
    async (itemId: string) => {
      const target = items.find((i) => i.id === itemId);
      if (!target || !target.owned) return;

      const willEquip = !target.equipped;

      setItems((prev) =>
        prev.map((i) => {
          if (i.id === itemId) return { ...i, equipped: willEquip };
          if (willEquip && i.slot === target.slot) return { ...i, equipped: false };
          return i;
        })
      );

      if (usingFallback) return;

      const { error } = await supabase.rpc("equip_aura_item", {
        p_item_id: itemId,
        p_equip: willEquip,
      });

      if (error) {
        console.error("Error equipando item:", error);
        load();
        return;
      }

      window.dispatchEvent(
        new CustomEvent("lupi:inventory-updated", { detail: { userId } })
      );
    },
    [items, usingFallback, load, userId]
  );

  return { items, loading, toggleEquip, usingFallback };
}