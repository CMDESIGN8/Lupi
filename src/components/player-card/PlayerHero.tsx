// src/components/player-card/PlayerHero.tsx
import { useLayoutEffect, useRef, type PointerEvent, type ReactNode } from "react";
import type { InventoryItem } from "../../hooks/useAuraInventory";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { POSITION_LABEL, RARITY_LABEL } from "./constants";
import { useCountUp, usePrefersReducedMotion } from "./hooks";
import { PlayerAvatar } from "./PlayerAvatar";
import type { PlayerProfile } from "./types";

type Props = {
  player: LobbyPlayer;
  worn: InventoryItem[];
  rarityKey: string;
  profile: PlayerProfile | null;
  /** Fila superior del escenario (botón volver + etiqueta). */
  top: ReactNode;
  /** Placa de nombre, abajo a la izquierda. */
  plate: ReactNode;
};

function crestText(club?: string | null): string {
  const letters = (club ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return letters || "LW";
}

const AVATAR_HEIGHT = 190;
const AVATAR_WIDTH = 135;

/**
 * Escenario a pantalla completa: dorsal gigante, cancha en perspectiva y el personaje
 * escalado según el alto disponible (así siempre es el protagonista).
 */
export function PlayerHero({ player, worn, rarityKey, profile, top, plate }: Props) {
  const stageRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const shown = useCountUp(profile?.ovr ?? player.level);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const apply = () => {
      const height = el.clientHeight;
      const width = el.clientWidth;
      const share = width < 600 ? 0.58 : 0.66;
      const scale = Math.max(0.5, Math.min(2.7, (height * share) / AVATAR_HEIGHT, (width * 0.5) / AVATAR_WIDTH));
      el.style.setProperty("--lw-h", `${height}px`);
      el.style.setProperty("--lw-avatar-s", scale.toFixed(3));
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const setParallax = (el: HTMLElement, x: number, y: number) => {
    el.style.setProperty("--lw-px", x.toFixed(3));
    el.style.setProperty("--lw-py", y.toFixed(3));
  };
  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    setParallax(
      event.currentTarget,
      ((event.clientX - box.left) / box.width - 0.5) * 2,
      ((event.clientY - box.top) / box.height - 0.5) * 2,
    );
  };
  const onLeave = (event: PointerEvent<HTMLElement>) => setParallax(event.currentTarget, 0, 0);

  return (
    <section ref={stageRef} className="lw-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="lw-stage__court" aria-hidden="true" />
      <div className="lw-stage__dorsal" aria-hidden="true">
        {profile ? profile.shirtNumber : "LW"}
      </div>
      <div className="lw-stage__ring" aria-hidden="true" />
      <PlayerAvatar player={player} worn={worn} />

      {top}

      <div className="lw-ovr" aria-label={profile ? `Valoración ${profile.ovr}` : `Nivel ${player.level}`}>
        <strong>{shown}</strong>
        <span>{profile ? "OVR" : "NIV"}</span>
      </div>
      {profile && (
        <span className="lw-pos" title={POSITION_LABEL[profile.position]}>
          {profile.position}
        </span>
      )}
      <div className="lw-crest" aria-hidden="true">
        {crestText(player.club)}
      </div>
      <div className="lw-stage__rarity">✦ {worn.length ? RARITY_LABEL[rarityKey].toUpperCase() : "JUGADOR"}</div>

      <div className="lw-plate">{plate}</div>
    </section>
  );
}