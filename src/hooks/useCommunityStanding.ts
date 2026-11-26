import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { standingFrom, type PvpRow, type Standing } from "../lib/communityStanding";

/** Lee el ranking semanal de la comunidad cuando termina un duelo (refreshKey cambia al registrarse el resultado). */
export function useCommunityStanding(communityId: string | undefined, userId: string, refreshKey: string) {
  const [standing, setStanding] = useState<Standing | null>(null);
  useEffect(() => {
    if (!communityId || !refreshKey) { setStanding(null); return; }
    let live = true;
    void supabase.rpc("get_community_pvp_ranking", { p_community_id: communityId }).then(({ data, error }) => {
      if (live) setStanding(error ? null : standingFrom(data as PvpRow[] | null, userId));
    });
    return () => { live = false; };
  }, [communityId, userId, refreshKey]);
  return standing;
}
