import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
import type { RpsState } from "./useRpsMatch";
export const BOT_NAMES=["Pibe Cebollita","El Tano","La Bruja"] as const;
export const BOT_BLURBS=["Tira lo que se le ocurre","Repite lo que le funciona","Te lee la última mano"] as const;
/** Same presentation contract, but all moves and rewards are verified by the server. */
export function useRpsBotMatch(challenge:Challenge,enabled:boolean){
 const [state,setState]=useState<RpsState|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const current=useRef<RpsState|null>(null),locked=useRef(false),generation=useRef(0);
 const refresh=useCallback(async()=>{
  if(!enabled||locked.current)return;const token=generation.current;
  try{const {data,error:e}=await supabase.rpc("duel_bot_open",{p_id:challenge.id,p_bot:challenge.botIndex});if(token!==generation.current)return;if(e)throw e;current.current=data as RpsState;setState(current.current);setError("");}
  catch(e){if(token===generation.current)setError(String((e as {message?:string})?.message||"No pudimos abrir la práctica. Reconectá."));}
 },[enabled,challenge.id,challenge.botIndex]);
 useEffect(()=>{const token=++generation.current;locked.current=false;current.current=null;setState(null);setError("");setBusy(false);if(enabled)void refresh();return()=>{if(token===generation.current)generation.current++;};},[enabled,refresh]);
 const play=useCallback(async(choice:"rock"|"paper"|"scissors")=>{
  const s=current.current;if(!enabled||locked.current||!s||s.status!=="playing")return false;
  const token=generation.current;locked.current=true;setBusy(true);
  try{const {data,error:e}=await supabase.rpc("duel_bot_play",{p_id:challenge.id,p_round:s.round,p_choice:choice});if(token!==generation.current)return false;if(e)throw e;current.current=data as RpsState;setState(current.current);setError("");return true;}
  catch(e){if(token===generation.current)setError(String((e as {message?:string})?.message||"No se pudo enviar. Reintentá."));return false;}
  finally{if(token===generation.current){locked.current=false;setBusy(false);}}
 },[enabled,challenge.id]);
 return {state,error,busy,play,refresh};
}
