import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
export type RpsState = { id: string; round: number; hostWins: number; guestWins: number; status: "playing" | "finished"; winnerId: string | null; mineSubmitted: boolean; opponentSubmitted: boolean; lastMoves: { host: string; guest: string } | null };
export function useRpsMatch(challenge: Challenge) {
  const [state,setState]=useState<RpsState|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const current=useRef<RpsState|null>(null),action=useRef(false),revision=useRef(0),generation=useRef(0),reading=useRef(false);
  const refresh=useCallback(async()=>{
    if(reading.current)return;
    const token=generation.current,rev=revision.current;reading.current=true;
    try{const {data,error:e}=await supabase.rpc("rps_state",{p_id:challenge.id});
      if(token!==generation.current||rev!==revision.current)return;
      if(e)throw e;current.current=data as RpsState;setState(current.current);setError("");
    }catch(e){if(token===generation.current&&rev===revision.current)setError(String((e as {message?:string})?.message||"Conexión interrumpida. Reintentando…"));}
    finally{if(token===generation.current)reading.current=false;}
  },[challenge.id]);
  useEffect(()=>{
    const token=++generation.current;current.current=null;action.current=false;reading.current=false;revision.current++;setState(null);setBusy(false);setError("");
    const start=async()=>{try{const {error:e}=await supabase.rpc("rps_start",{p_id:challenge.id,p_host:challenge.fromId,p_guest:challenge.toId});if(token!==generation.current)return;if(e)throw e;void refresh();}catch(e){if(token===generation.current)setError(String((e as {message?:string})?.message||"No se pudo abrir el duelo."));}};
    void start();const timer=window.setInterval(()=>{if(current.current?.status!=="finished")void refresh();},1200);
    return()=>{window.clearInterval(timer);if(token===generation.current)generation.current++;};
  },[challenge.id,challenge.fromId,challenge.toId,refresh]);
  const play=useCallback(async(choice:"rock"|"paper"|"scissors")=>{
    if(action.current||current.current?.mineSubmitted||current.current?.status!=="playing")return false;
    const token=generation.current;action.current=true;revision.current++;setBusy(true);
    try{const {data,error:e}=await supabase.rpc("rps_play",{p_id:challenge.id,p_choice:choice});if(token!==generation.current)return false;if(e)throw e;current.current=data as RpsState;setState(current.current);setError("");return true;}
    catch(e){if(token===generation.current)setError(String((e as {message?:string})?.message||"No se pudo enviar la mano. Reintentá."));return false;}
    finally{if(token===generation.current){revision.current++;action.current=false;setBusy(false);}}
  },[challenge.id]);
  return {state,error,busy,play,refresh};
}
