import { useMemo } from "react";
import { Avatar2D } from "../Avatar2D";
import { DEFAULT_APPEARANCE } from "../../lib/avatarAppearance";
import type { InventoryItem } from "../../hooks/useAuraInventory";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { wornImageSrc } from "./constants";

type Props = { player: LobbyPlayer; worn: InventoryItem[] };

export function PlayerAvatar({ player, worn }: Props) {
  // Avatar2D solo dibuja items con equipped=true. Acá "worn" viene del catálogo
  // de QUIEN MIRA, así que hay que forzar equipped (si no, el rival se ve sin ropa).
  const items = useMemo(
    () =>
      worn.map((item) => {
        const src = wornImageSrc(item) ?? null; // mantiene la imagen oficial de los botines
        return { ...item, equipped: true, imageUrl: src, equippedImageUrl: src };
      }),
    [worn],
  );

  return (
    <div className="lw-avatar" role="img" aria-label={`Equipamiento de ${player.username}`}>
      <div className="lw-avatar__rise">
        <div className="lw-avatar__body">
          <div className="lw-avatar__rig">
            <Avatar2D items={items} appearance={player.appearance ?? DEFAULT_APPEARANCE} />
          </div>
        </div>
      </div>
    </div>
  );
}