// src/components/CharacterStage.tsx
// Único punto donde se dibuja el personaje del editor.
// Hoy usa Avatar2D (capas planas). Cuando exista el modelo 3D se cambia SOLO este archivo:
// la pantalla del editor no se entera.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { InventoryItem } from "../hooks/useAuraInventory";
import type { AvatarAppearance } from "../lib/avatarAppearance";
import { Avatar2D } from "./Avatar2D";
import { AvatarFace } from "./AvatarFace";

type Props = {
  items: InventoryItem[];
  appearance: AvatarAppearance;
  mode: "full" | "face";
  level: number;
  /** XP dentro del nivel actual y XP necesaria; opcionales. */
  xp?: number;
  xpNeeded?: number;
};

// Caja de diseño de Avatar2D (390×520). El sprite deja ~100px transparentes arriba y los botines
// sobresalen ~20px abajo: se escala sobre la parte visible para que el personaje llene el escenario.
const AVATAR_W = 390;
const AVATAR_TOP_TRIM = 80; // margen de arriba que se descarta (deja aire para pelo y accesorios)
const AVATAR_VISIBLE_H = 460; // 520 - 80 + 20 de botines

export function CharacterStage({ items, appearance, mode, level, xp, xpNeeded }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      const byWidth = Math.max(0.3, (width - 12) / AVATAR_W);
      // En móvil, aprovechar más la altura del escenario sin recortar cabeza ni botines.
      const mobile = window.matchMedia("(max-width: 860px)").matches;
      const byHeight = Math.max(0.3, (height - (mobile ? 14 : 42)) / AVATAR_VISIBLE_H);
      setScale(Math.min(2.1, byWidth, byHeight));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const progress = xp != null && xpNeeded ? Math.max(0, Math.min(1, xp / xpNeeded)) : null;

  return (
    <div ref={boxRef} className="lw-id__character">
      <div className="lw-id__spot" aria-hidden="true" />
      {mode === "full" ? (
        <div
          className="lw-id__avatar"
          style={{ top: `calc(50% - ${AVATAR_VISIBLE_H * scale / 2 + AVATAR_TOP_TRIM * scale}px)`, transform: `translateX(-50%) scale(${scale})` } as CSSProperties}
        >
          <Avatar2D items={items} appearance={appearance} />
        </div>
      ) : (
        <div className="lw-id__face-zoom">
          <AvatarFace appearance={appearance} />
        </div>
      )}
      <div className="lw-id__ring" aria-hidden="true" />

      <div className="lw-id__level" aria-label={`Nivel ${level}`}>
        <small>NIVEL</small>
        <strong>{level}</strong>
        {xp != null && xpNeeded != null && (
          <span>
            {xp} / {xpNeeded} XP
          </span>
        )}
        {progress != null && (
          <i className="lw-id__level-bar" style={{ "--p": progress } as CSSProperties} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
