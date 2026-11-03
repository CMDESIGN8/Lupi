import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_APPEARANCE, sanitizeAppearance, type AvatarAppearance } from "../lib/avatarAppearance";
export function useAvatarAppearance(userId: string) {
 const [appearance, setAppearance] = useState<AvatarAppearance>(DEFAULT_APPEARANCE);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 useEffect(() => { let alive = true; setLoading(true); setAppearance(DEFAULT_APPEARANCE); setError(null);
  if (!userId) { setLoading(false); return () => { alive = false; }; }
  void (async () => {
   try {
    const { data, error } = await supabase.from("avatar_appearances").select("appearance").eq("user_id", userId).maybeSingle();
    if (!alive) return;
    if (error) setError("Aplicá primero la migración SQL del avatar.");
    else if (data?.appearance) setAppearance(sanitizeAppearance(data.appearance));
   } catch {
    if (alive) setError("No se pudo cargar la apariencia del avatar.");
   } finally {
    if (alive) setLoading(false);
   }
  })();
  return () => { alive = false; };
 }, [userId]);
 useEffect(() => {
  const onUpdated = (event: Event) => {
   const detail = (event as CustomEvent<{userId:string;appearance:AvatarAppearance}>).detail;
   if (detail?.userId === userId) setAppearance(sanitizeAppearance(detail.appearance));
  };
  window.addEventListener("lupi:avatar-appearance-updated", onUpdated);
  return () => window.removeEventListener("lupi:avatar-appearance-updated", onUpdated);
 }, [userId]);
 const save = useCallback(async (next: AvatarAppearance) => {
  if (!userId) return false;
  const clean = sanitizeAppearance(next); setSaving(true); setError(null);
  const {error} = await supabase.from("avatar_appearances").upsert({user_id:userId, appearance:clean}, {onConflict:"user_id"});
  setSaving(false);
  if (error) {setError(error.message); return false;}
  setAppearance(clean); window.dispatchEvent(new CustomEvent("lupi:avatar-appearance-updated", { detail: { userId, appearance: clean } })); return true;
 },[userId]);
 return {appearance, save, saving, error, loading};
}
