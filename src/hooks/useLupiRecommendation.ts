import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type LupiActivity = "play" | "deck" | "album" | "pack" | "achievements" | "explore" | "social";
export type LupiAction = LupiActivity | "claim";
type History = {
  counts: Partial<Record<LupiActivity, number>>;
  last?: LupiActivity;
  updatedAt?: number;
  dismissed?: Partial<Record<LupiAction, number>>;
  completedMatches?: number;
  lastMatchAt?: number;
};
type Recommendation = { title: string; description: string; button: string; action: LupiAction; reason: string };
const keyFor = (id: string) => `lupi_world_recommendations_v1_${id}`;
const empty = (): History => ({ counts: {}, dismissed: {} });
function read(id: string): History {
  if (!id) return empty();
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(id)) || "null");
    return parsed && typeof parsed.counts === "object" && parsed.counts ? parsed : empty();
  } catch { return empty(); }
}
function save(id: string, data: History) {
  if (!id) return;
  try { localStorage.setItem(keyFor(id), JSON.stringify(data)); } catch { /* unavailable */ }
}
function newest(a: History, b: History): History {
  return (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
}
export function useLupiRecommendation(userId: string, options: {
  rewardPending: boolean;
  packsAvailable: number;
  hasDeck: boolean;
  hasEquipped?: boolean;
}) {
  const [history, setHistory] = useState<History>(() => read(userId));
  const [loadedId, setLoadedId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setHistory(read(userId));
    setLoadedId(null);
    if (!userId) return;
    void (async () => {
      const { data, error } = await supabase.from("lupi_recommendation_state")
        .select("history").eq("user_id", userId).maybeSingle();
      if (!alive) return;
      if (error) { console.warn("Lupi recommendation sync:", error.message); return; }
      const local = read(userId);
      const remote = data?.history && typeof data.history === "object" ? data.history as History : empty();
      const chosen = newest(local, remote);
      save(userId, chosen);
      setHistory(chosen);
      setLoadedId(userId);
      if ((local.updatedAt || 0) > (remote.updatedAt || 0)) {
        void supabase.from("lupi_recommendation_state")
          .upsert({ user_id: userId, history: chosen }, { onConflict: "user_id" });
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const persist = useCallback((next: History) => {
    save(userId, next);
    setHistory(next);
    if (userId && loadedId === userId) {
      void supabase.from("lupi_recommendation_state")
        .upsert({ user_id: userId, history: next }, { onConflict: "user_id" })
        .then(({ error }) => { if (error) console.warn("Lupi persist:", error.message); });
    }
  }, [userId, loadedId]);

  const track = useCallback((activity: LupiActivity) => {
    if (!userId) return;
    const prev = read(userId);
    persist({ ...prev, counts: { ...prev.counts, [activity]: Math.min(9999, (prev.counts[activity] || 0) + 1) }, last: activity, updatedAt: Date.now() });
  }, [userId, persist]);

  const recordMatchCompleted = useCallback(() => {
    if (!userId) return;
    const prev = read(userId);
    persist({ ...prev, completedMatches: (prev.completedMatches || 0) + 1, lastMatchAt: Date.now(), last: "play", updatedAt: Date.now() });
  }, [userId, persist]);

  const dismiss = useCallback((action: LupiAction) => {
    if (!userId) return;
    const prev = read(userId);
    persist({ ...prev, dismissed: { ...prev.dismissed, [action]: Date.now() }, updatedAt: Date.now() });
  }, [userId, persist]);

  const recommendation = useMemo((): Recommendation => {
    const candidates: Recommendation[] = [];
    if (options.rewardPending) candidates.push({ title: "¡Tu recompensa está lista!", description: "Completaste un desafío. Reclamá tu premio.", button: "RECLAMAR", action: "claim", reason: "Recompensa pendiente" });
    if (!options.hasDeck) candidates.push({ title: "Prepará tu primer equipo", description: "Elegí tus cartas para empezar a jugar.", button: "VER EQUIPO", action: "deck", reason: "Primeros pasos" });
    if (options.hasEquipped === false) candidates.push({ title: "Dale estilo a tu personaje", description: "Entrá al equipo y descubrí cómo personalizarte.", button: "PERSONALIZAR", action: "deck", reason: "Tu personaje" });
    if (options.packsAvailable > 0) candidates.push({ title: "Tenés un pack disponible", description: "Descubrí nuevas cartas para tu equipo.", button: "ABRIR PACK", action: "pack", reason: "Pack disponible" });
    if (history.lastMatchAt && Date.now() - history.lastMatchAt < 7 * 86400000) candidates.push({ title: "¿Vamos por otra partida?", description: "Ya terminaste un partido. Seguí sumando experiencia.", button: "JUGAR", action: "play", reason: "Por tu última partida" });
    if (["deck", "album", "pack"].includes(history.last || "")) candidates.push({ title: "¿Probamos tu equipo?", description: "Jugá una partida rápida con tus cartas.", button: "JUGAR", action: "play", reason: "Continuá tu aventura" });
    if (!history.last) candidates.push({ title: "Tu primera aventura", description: "Probá una partida rápida o descubrí el mundo.", button: "JUGAR", action: "play", reason: "Para empezar" });
    candidates.push({ title: "Descubrí algo diferente", description: "Explorá las experiencias disponibles en Lupi World.", button: "EXPLORAR", action: "explore", reason: "A tu ritmo" });
    const cooldown = 24 * 60 * 60 * 1000;
    return candidates.find(c => !history.dismissed?.[c.action] || Date.now() - (history.dismissed[c.action] || 0) > cooldown) || candidates[candidates.length - 1];
  }, [history, options.rewardPending, options.packsAvailable, options.hasDeck, options.hasEquipped]);
  return { recommendation, track, dismiss, recordMatchCompleted, isSynced: loadedId === userId };
}
