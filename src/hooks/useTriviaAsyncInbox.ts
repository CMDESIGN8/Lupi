import { useCallback, useEffect, useRef, useState } from "react";
import { asyncList, type AsyncTriviaListItem } from "../lib/triviaAsync";

/** Duelos por turnos pendientes. Se refresca al abrir, cada 45 s con la pestaña visible y al volver a ella. */
export function useTriviaAsyncInbox(enabled: boolean) {
  const [items, setItems] = useState<AsyncTriviaListItem[]>([]);
  const mounted = useRef(true);
  const running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const list = await asyncList();
      if (mounted.current) setItems(Array.isArray(list) ? list : []);
    } catch { /* si el SQL todavía no está instalado, la bandeja queda vacía */ }
    finally { running.current = false; }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const tick = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 45_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); };
  }, [enabled, refresh]);

  const badge = items.filter(i => i.needsAction || i.unseen).length;
  return { items, badge, refresh };
}
