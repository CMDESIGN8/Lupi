// src/components/player-card/PlayerHero.tsx
import type { PointerEvent } from "react";
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
  /** Hero reducido para las pestañas donde importa más el contenido. */
  compact: boolean;
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

/** Escenario: dorsal gigante, cancha en perspectiva y el personaje rompiendo el marco. */
export function PlayerHero({ player, worn, rarityKey, profile, compact }: Props) {
  const reduced = usePrefersReducedMotion();
  const shown = useCountUp(profile?.ovr ?? player.level);

  const setParallax = (el: HTMLElement, x: number, y: number) => {
    el.style.setProperty("--lw-px", x.toFixed(3));
    el.style.setProperty("--lw-py", y.toFixed(3));
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    setParallax(
      event.currentTarget,
      ((event.clientX - box.left) / box.width - 0.5) * 2,
      ((event.clientY - box.top) / box.height - 0.5) * 2,
    );
  };
  const onLeave = (event: PointerEvent<HTMLDivElement>) => setParallax(event.currentTarget, 0, 0);

  return (
    <div className="lw-hero" data-compact={compact} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="lw-hero__stage" aria-hidden="true">
        <div className="lw-hero__beams" />
        <div className="lw-hero__court" />
        <div className="lw-hero__dorsal">{profile ? profile.shirtNumber : "LW"}</div>
        <div className="lw-hero__halo" />
        <div className="lw-hero__floor" />
      </div>

      <PlayerAvatar player={player} worn={worn} />

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
      <div className="lw-hero__rarity">✦ {worn.length ? RARITY_LABEL[rarityKey].toUpperCase() : "JUGADOR"}</div>
    </div>
  );
}
