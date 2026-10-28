import flores8vaTop from "../assets/flores-8va-camiseta-equipable.png";
import flores8vaTopPreview from "../assets/flores-8va-camiseta-preview.webp";
import flores8vaBottom from "../assets/flores-8va-short-equipable.png";
import flores8vaBottomPreview from "../assets/flores-8va-short-preview.webp";
import { supabase } from "../lib/supabaseClient";
import { useCallback, useEffect, useRef, useState } from "react";

export type ItemSlot = "top" | "bottom" | "socks" | "boots" | "accessory";
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
  durability?: number | null;
  maxDurability?: number | null;
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
const FLORES_8VA_PREVIEWS: Record<string,string> = {"flores-club-8va-camiseta-verde":flores8vaTopPreview,"flores-club-8va-short-negro":flores8vaBottomPreview};
const FLORES_8VA_SPRITES: Record<string,string> = {"flores-club-8va-camiseta-verde":flores8vaTop,"flores-club-8va-short-negro":flores8vaBottom};

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

/** Misma lógica de "un solo ítem equipado por slot", reutilizable. */
function applyEquip(prev: InventoryItem[], itemId: string, equip: boolean) {
  const target = prev.find((i) => i.id === itemId);
  if (!target) return prev;
  return prev.map((i) => {
    if (i.id === itemId) return { ...i, equipped: equip };
    if (equip && i.slot === target.slot) return { ...i, equipped: false };
    return i;
  });
}

export function useAuraInventory(userId: string, level: number) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const instanceId = useRef(Math.random().toString(36).slice(2));

  const load = useCallback(async () => {
    if (!userId) return;

    const [catalogRes, ownedRes, durabilityRes] = await Promise.all([
      supabase
        .from("aura_items")
        .select("*")
        .order("required_level", { ascending: true }),
      supabase
        .from("user_items")
        .select("item_id, equipped")
        .eq("user_id", userId),
      supabase.from("equipment_durability").select("item_id,remaining,max_uses").eq("user_id",userId),
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

    const durabilityMap = new Map((durabilityRes.data ?? []).map(row => [row.item_id, row]));
    setItems(
      catalog.map((row) => ({
        id: row.id,
        name: row.name,
        slot: row.slot,
        rarity: row.rarity,
        world: row.world,
        drop: row.drop_code,
        icon: row.icon,
        imageUrl: FLORES_8VA_PREVIEWS[row.id] ?? row.image_url ?? defaultImage(row.id),
        modelUrl: row.model_url,
        shopUrl: row.shop_url,
        color: row.color ?? COLOR_BY_ID[row.id] ?? DEFAULT_ITEM_COLOR,
        requiredLevel: row.required_level,
        owned: ownedMap.has(row.id) || (!row.id.startsWith("flores-club-") && level >= row.required_level),
        equipped: ownedMap.get(row.id) ?? false,
        equippedImageUrl: FLORES_8VA_SPRITES[row.id] ?? row.equipped_image_url,
        durability: row.slot === "socks" || row.slot === "boots" ? (durabilityMap.get(row.id)?.remaining ?? 10) : null,
        maxDurability: row.slot === "socks" || row.slot === "boots" ? 10 : null,
      }))
    );
    setUsingFallback(false);
    setLoading(false);
  }, [userId, level]);

  // Carga inicial
  useEffect(() => {
    load();
  }, [load]);

  // Cuando OTRA instancia del hook cambia el equipamiento, sincronizar esta.
  useEffect(() => {
    const onUpdated = (event: Event) => {
      const d = (event as CustomEvent<{
        userId?: string; itemId?: string; equipped?: boolean; source?: string;
      }>).detail;
      if (!d || d.userId !== userId || d.source === instanceId.current) return;
      if (usingFallback && d.itemId) {
        // sin base de datos no hay nada que recargar: aplicar el cambio en memoria
        setItems((prev) => applyEquip(prev, d.itemId!, !!d.equipped));
      } else {
        load();
      }
    };
    window.addEventListener("lupi:inventory-updated", onUpdated);
    return () => window.removeEventListener("lupi:inventory-updated", onUpdated);
  }, [userId, usingFallback, load]);

  const toggleEquip = useCallback(
    async (itemId: string) => {
      const target = items.find((i) => i.id === itemId);
      if (!target || !target.owned || (target.durability != null && target.durability <= 0 && !target.equipped)) return;

      const willEquip = !target.equipped;

      setItems((prev) => applyEquip(prev, itemId, willEquip));

      const notify = () =>
        window.dispatchEvent(
          new CustomEvent("lupi:inventory-updated", {
            detail: { userId, itemId, equipped: willEquip, source: instanceId.current },
          })
        );

      if (usingFallback) {
        notify();
        return;
      }

      const { error } = await supabase.rpc("equip_aura_item", {
        p_item_id: itemId,
        p_equip: willEquip,
      });

      if (error) {
        console.error("Error equipando item:", error);
        load();
        return;
      }

      notify();
    },
    [items, usingFallback, load, userId]
  );

  return { items, loading, toggleEquip, usingFallback, refresh: load };
}