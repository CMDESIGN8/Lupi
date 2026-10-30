import { useMemo } from "react";
import { Avatar2D } from "../Avatar2D";
import { DEFAULT_APPEARANCE } from "../../lib/avatarAppearance";
import type { InventoryItem } from "../../hooks/useAuraInventory";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";

type Props = { player: LobbyPlayer; worn: InventoryItem[] };

export function PlayerAvatar({ player, worn }: Props) {
  // La presencia identifica lo equipado por el rival. Conservar sus sprites de
  // equipamiento: imageUrl es una miniatura y puede tener otra escala o vista.
  const items = useMemo(
    () => worn.map(item => ({ ...item, equipped: true })),
    [worn],
  );

  return (
    <div className="lw-avatar" role="img" aria-label={`Equipamiento de ${player.username}`}>
      <div className="lw-avatar__rise">
        <div className="lw-avatar__body">
          <div className="lw-avatar__rig">
            <Avatar2D items={items} level={player.level} appearance={player.appearance ?? DEFAULT_APPEARANCE} />
          </div>
        </div>
      </div>
    </div>
  );
}