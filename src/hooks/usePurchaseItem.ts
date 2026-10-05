// src/hooks/usePurchaseItem.ts
import { useState } from "react";
import { api } from "../lib/api";

export function usePurchaseItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = async (itemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.purchaseItem(itemId);
      return result;
    } catch (e: any) {
      const msg = e.message || "Error al comprar";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { purchase, loading, error };
}