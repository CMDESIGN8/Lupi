// hooks/useUserHeroData.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { LEAGUES } from "../data/campaignData";

interface UserHeroData {
  level: number;
  exp: number;
  expNeeded: number;

  points: number;
  coins: number;

  streak: number;
  bestStreak: number;

  rarity: string;

  stats: {
    pace: number;
    dribbling: number;
    passing: number;
    defending: number;
    finishing: number;
    physical: number;
  };

  division: string;

  nextRewardCoins: number;
  nextRewardIcon: string;
  nextRewardDescription: string;
}

export function useUserHeroData(userId: string | undefined) {
  const [data, setData] = useState<UserHeroData>({
  level: 1,
  exp: 0,
  expNeeded: 100,

  points: 0,
  coins: 0,

  streak: 0,
  bestStreak: 0,

  rarity: "bronze",

  stats: {
    pace: 0,
    dribbling: 0,
    passing: 0,
    defending: 0,
    finishing: 0,
    physical: 0,
  },

  division: "BRONCE",

  nextRewardCoins: 30,
  nextRewardIcon: "⚽",
  nextRewardDescription: "Ganar un partido",
});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchHeroData = async () => {
      setLoading(true);
      try {
        // ⬇️ LAS COLUMNAS REALES DE profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(`
  points,
  coins,
  streak,
  best_streak,
  user_card_level,
  user_card_exp,
  user_card_rarity,
  user_card_pace,
  user_card_dribbling,
  user_card_passing,
  user_card_defending,
  user_card_finishing,
  user_card_physical
`)
          .eq("id", userId)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError);
        }

        const points = profile?.points || 0;
        const level = profile?.user_card_level || 1;      // ⬅️ CAMBIADO
        const currentExp = profile?.user_card_exp || 0;   // ⬅️ CAMBIADO
        const expNeeded = level * 100;
        const coins = profile?.coins || 0;

const streak = profile?.streak || 0;
const bestStreak = profile?.best_streak || 0;

const rarity = profile?.user_card_rarity || "bronze";

const stats = {
  pace: profile?.user_card_pace || 0,
  dribbling: profile?.user_card_dribbling || 0,
  passing: profile?.user_card_passing || 0,
  defending: profile?.user_card_defending || 0,
  finishing: profile?.user_card_finishing || 0,
  physical: profile?.user_card_physical || 0,
};

        let division = "BRONCE";
        if (points >= 2000) division = "ORO";
        else if (points >= 1000) division = "PLATA";

        let nextRewardCoins = 30;
        let nextRewardIcon = "⚽";
        let nextRewardDescription = "Ganar un partido";

        const { data: campaignProgress, error: campaignError } = await supabase
          .from("campaign_progress")
          .select("current_league_id, completed_league_ids")
          .eq("user_id", userId)
          .maybeSingle();

        if (!campaignError && campaignProgress) {
          const currentLeagueId = campaignProgress.current_league_id || "rookie";
          const currentLeagueIndex = LEAGUES.findIndex((l) => l.id === currentLeagueId);
          const nextLeague = LEAGUES[currentLeagueIndex + 1];

          if (nextLeague) {
            nextRewardCoins = nextLeague.rewardPoints;
            nextRewardIcon = nextLeague.icon || "🏆";
            nextRewardDescription = `Completar ${nextLeague.name}`;
          }
        }

        if (isMounted) {
          setData({
            level,
            exp: currentExp,
            expNeeded,

            points,
            coins,

            streak,
            bestStreak,

            rarity,

            stats,

            division,

            nextRewardCoins,
            nextRewardIcon,
            nextRewardDescription,
          });
        }
      } catch (err) {
        console.error("Error in useUserHeroData:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHeroData();

    return () => {
      isMounted = false;
    };
  }, [userId, refreshKey]);

  return { data, loading, refetch };
}