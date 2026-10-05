// src/lib/scroll.ts
export const scrollTop = () => {
  if (typeof window === "undefined") return;
  // 'instant' no está en el tipo TS estándar, pero es válido en runtime.
  // Fallback a 'auto' si el browser no lo soporta.
  try {
    (window as any).scrollTo({ top: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, 0);
  }
};