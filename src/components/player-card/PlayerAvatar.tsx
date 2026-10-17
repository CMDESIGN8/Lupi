// src/components/player-card/PlayerAvatar.tsx
import type { InventoryItem } from "../../hooks/useAuraInventory";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { wornImageSrc } from "./constants";

type Props = {
  player: LobbyPlayer;
  worn: InventoryItem[];
  /**
   * Cuerpo base en PNG/SVG (135×190). Si se pasa, reemplaza al maniquí dibujado con CSS.
   * Es el punto de enchufe para un avatar de arte real, sin tocar nada más.
   */
  bodySrc?: string;
};

/** Personaje con prendas en capas. El tamaño y la posición los decide el hero. */
export function PlayerAvatar({ player, worn, bodySrc }: Props) {
  return (
    <div className="lw-avatar" role="img" aria-label={`Equipamiento de ${player.username}`}>
      <div className="lw-avatar__rise">
        <div className="lw-avatar__body">
          {bodySrc ? (
            <img className="lw-avatar__base" src={bodySrc} alt="" draggable={false} />
          ) : (
            <>
              <div className="lw-avatar__head" />
              <div className="lw-avatar__torso" />
              <div className="lw-avatar__legs" />
            </>
          )}
          {worn
            .filter((item) => item.slot !== "accessory")
            .map((item) => {
              const src = wornImageSrc(item);
              return src ? (
                <img
                  key={item.id}
                  className={`lw-avatar__wear lw-avatar__wear--${item.slot}`}
                  src={src}
                  alt=""
                  draggable={false}
                />
              ) : null;
            })}
        </div>
      </div>
    </div>
  );
}
