// src/hooks/useHeroData.ts
import { useEffect, useRef, useState } from "react";
import { useUserHeroData } from "./useUserHeroData";

type HeroData = {
  level?: number;
  exp?: number;
  expNeeded?: number;

  points?: number;
  coins?: number;

  streak?: number;
  bestStreak?: number;

  rarity?: string;

  stats?: {
    pace: number;
    dribbling: number;
    passing: number;
    defending: number;
    finishing: number;
    physical: number;
  };

  division?: string;
  nextRewardIcon?: string;
  nextRewardCoins?: number;
  nextRewardDescription?: string;
} | null;

export function useHeroDataCached(userId: string | undefined) {
  const {
    data,
    loading,
    refetch: refetchHero,
  } = useUserHeroData(userId);

  const cacheRef = useRef<{ data: HeroData; ts: number } | null>(null);
  const [cached, setCached] = useState<HeroData>(() => cacheRef.current?.data ?? null);
  const [cachedLoading, setCachedLoading] = useState(!cacheRef.current);

  useEffect(() => {
    if (!data) return;
    cacheRef.current = { data, ts: Date.now() };
    setCached(data);
    setCachedLoading(false);
  }, [data]);

  useEffect(() => {
    if (loading) setCachedLoading(true);
  }, [loading]);

  // Limpiar cache al cambiar de usuario
  useEffect(() => {
    cacheRef.current = null;
    setCached(null);
    setCachedLoading(true);
  }, [userId]);

  return {
    data: cached,
    loading: cachedLoading,
    refetch: refetchHero,
  };
}