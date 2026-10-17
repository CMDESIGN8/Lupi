import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_APPEARANCE, sanitizeAppearance, type AvatarAppearance } from "../lib/avatarAppearance";
export function useAvatarAppearance(userId: string) {
 const [appearance, setAppearance] = useState<AvatarAppearance>(DEFAULT_APPEARANCE);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 useEffect(() => { let alive = true; setAppearance(DEFAULT_APPEARANCE);
  if (!userId) return;
  supabase.from("avatar_appearances").select("appearance").eq("user_id", userId).maybeSingle().then(({data,error}) => {
   if (!alive) return;
   if (error) { setError("Aplicá primero la migración SQL del avatar."); return; }
   if (data?.appearance) setAppearance(sanitizeAppearance(data.appearance));
  }); return () => { alive = false; };
 }, [userId]);
 const save = useCallback(async (next: AvatarAppearance) => {
  if (!userId) return false;
  const clean = sanitizeAppearance(next); setSaving(true); setError(null);
  const {error} = await supabase.from("avatar_appearances").upsert({user_id:userId, appearance:clean}, {onConflict:"user_id"});
  setSaving(false);
  if (error) {setError(error.message); return false;}
  setAppearance(clean); return true;
 },[userId]);
 return {appearance, save, saving, error};
}
