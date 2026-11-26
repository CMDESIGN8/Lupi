import { useEffect, useRef } from "react";

const TYPING = /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/;
/**
 * Enter o R = revancha, solo en la pantalla de resultado. Se "arma" 700 ms después de aparecer para que un
 * Enter tecleado durante la partida no dispare otra sin querer, y se ignora si el foco está en un botón/campo.
 */
export function useRematchHotkey(enabled: boolean, onRematch?: () => void, armMs = 700) {
  const cb = useRef(onRematch); cb.current = onRematch;
  useEffect(() => {
    if (!enabled) return;
    let armed = false, fired = false;
    const arm = window.setTimeout(() => { armed = true; }, armMs);
    const onKey = (e: KeyboardEvent) => {
      if (!armed || fired || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || TYPING.test(t.tagName))) return;
      if (e.key !== "Enter" && e.key.toLowerCase() !== "r") return;
      fired = true; e.preventDefault(); cb.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(arm); window.removeEventListener("keydown", onKey); };
  }, [enabled, armMs]);
}
