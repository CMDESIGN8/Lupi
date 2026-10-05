import { useCallback, useEffect, useState } from "react";
import { cardApi } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import { calculateOVR, type UserCard } from "../types/cards";
import type { AppUser } from "../lib/api";

export function useUserCards(user: AppUser | null) {
  const [userCards, setUserCards] = useState<UserCard[]>([]);

  const loadUserCards = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", user.id);

    if (error || !data) {
      console.error("Error loading user cards:", error);
      setUserCards([]);
      return;
    }

    if (data.length === 0) {
      setUserCards([]);
      return;
    }

    const npcIds = data
      .filter((card) => card.card_type === "npc" && card.player_id)
      .map((card) => card.player_id);
    const socioIds = data
      .filter((card) => card.card_type === "socio" && card.socio_id)
      .map((card) => card.socio_id);

    const [npcResult, socioResult] = await Promise.all([
      npcIds.length
        ? supabase.from("players").select("*").in("id", npcIds)
        : Promise.resolve({ data: [] as any[] }),
      socioIds.length
        ? supabase
            .from("profiles")
            .select("id, username, position, category, user_card_pace, user_card_dribbling, user_card_passing, user_card_defending, user_card_finishing, user_card_physical, total_wins_lifetime, total_battles_lifetime")
            .in("id", socioIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const npcMap = new Map((npcResult.data ?? []).map((card: any) => [card.id, card]));
    const socioMap = new Map((socioResult.data ?? []).map((card: any) => [card.id, card]));

    const transformed: UserCard[] = data.map((uc: any) => {
      if (uc.card_type === "socio" && uc.socio_id) {
        const socio = socioMap.get(uc.socio_id);
        if (socio) {
          const stats = {
            pace: socio.user_card_pace || 40,
            dribbling: socio.user_card_dribbling || 40,
            passing: socio.user_card_passing || 40,
            defending: socio.user_card_defending || 40,
            finishing: socio.user_card_finishing || 40,
            physical: socio.user_card_physical || 40,
          };
          return {
            id: uc.id,
            user_id: uc.user_id,
            player_id: uc.player_id,
            socio_id: uc.socio_id,
            card_type: "socio",
            card: {
              id: socio.id,
              name: socio.username,
              position: socio.position || "ala",
              category: socio.category || "1era",
              overall_rating: calculateOVR(stats),
              ...stats,
              card_type: "socio",
              profile_id: socio.id,
              total_wins_lifetime: socio.total_wins_lifetime || 0,
              total_battles_lifetime: socio.total_battles_lifetime || 0,
              is_real: true,
            },
            level: uc.level,
            experience: uc.experience,
            is_favorite: uc.is_favorite,
            obtained_at: uc.obtained_at,
          } as UserCard;
        }
      }

      if (uc.card_type === "npc" && uc.player_id) {
        const npc = npcMap.get(uc.player_id);
        if (npc) {
          return {
            id: uc.id,
            user_id: uc.user_id,
            player_id: uc.player_id,
            socio_id: uc.socio_id,
            card_type: "npc",
            card: {
              id: npc.id,
              name: npc.name,
              position: npc.position,
              category: npc.category,
              overall_rating: npc.overall_rating,
              pace: npc.pace,
              dribbling: npc.dribbling,
              passing: npc.passing,
              defending: npc.defending,
              finishing: npc.finishing,
              physical: npc.physical,
              card_type: "npc",
              can_be_replaced: npc.can_be_replaced,
              is_replaced: npc.is_replaced,
            },
            level: uc.level,
            experience: uc.experience,
            is_favorite: uc.is_favorite,
            obtained_at: uc.obtained_at,
          } as UserCard;
        }
      }

      return uc as UserCard;
    });

    setUserCards(transformed);
  }, [user]);

  useEffect(() => {
    void loadUserCards();
  }, [loadUserCards]);

  return { userCards, loadUserCards };
}
