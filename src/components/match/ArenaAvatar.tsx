import { memo, useMemo } from 'react';
import { Avatar2D } from '../Avatar2D';
import type { InventoryItem } from '../../hooks/useAuraInventory';
import type { LobbyPlayer } from '../../hooks/useLobbyPresence';
export const ArenaAvatar = memo(function ArenaAvatar({player,catalog,isMe=false,name}:{player?:LobbyPlayer;catalog:InventoryItem[];isMe?:boolean;name:string}) {
 const items=useMemo(()=>catalog.filter(item=>player?.look ? player.look[item.slot]===item.id : isMe && item.equipped).map(item=>({...item,equipped:true})),[catalog,player?.look,isMe]);
 return <div className="arena-avatar" role="img" aria-label={`Avatar de ${name}`}><div className="arena-avatar__rig"><Avatar2D items={items} appearance={player?.appearance} level={player?.level}/></div></div>;
});
