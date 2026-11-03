import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Avatar2D} from './Avatar2D';
import {useAvatarAppearance} from '../hooks/useAvatarAppearance';
import {useAuraInventory} from '../hooks/useAuraInventory';
import type {AvatarAppearance} from '../lib/avatarAppearance';
import './OwnedCardPortrait.css';
/** Own card uses the same equipped layers and appearance as the lobby. */
export function OwnedCardPortrait({userId,appearanceOverride}:{userId:string;appearanceOverride?:AvatarAppearance}){
 const ref=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(.24);
 useEffect(()=>{const element=ref.current;if(!element)return;const fit=()=>setScale(Math.min(element.clientWidth/190,element.clientHeight/470)*.98);fit();if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(fit);observer.observe(element);return()=>observer.disconnect();},[]);
 const {appearance,loading:appearanceLoading}=useAvatarAppearance(userId);const {items}=useAuraInventory(userId,1);
 if(!appearanceOverride&&appearanceLoading)return <div ref={ref} className="lp-owned-portrait" aria-busy="true"/>;
 return <div ref={ref} className="lp-owned-portrait" style={{"--own-card-scale":scale} as CSSProperties} aria-label="Tu personaje con su equipamiento"><div className="lp-owned-portrait__rig"><Avatar2D appearance={appearanceOverride??appearance} items={items}/></div></div>;
}
