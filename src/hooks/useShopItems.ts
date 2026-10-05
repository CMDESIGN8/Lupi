// src/hooks/useShopItems.ts
import { useCallback, useEffect, useState } from "react";
import { api, ShopItem } from "../lib/api";

export function useShopItems() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShopItems();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Error al cargar la tienda");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refetch: load };
}