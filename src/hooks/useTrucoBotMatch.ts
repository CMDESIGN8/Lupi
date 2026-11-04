import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { actor, newGame, type Action, type TrucoState } from "../utils/trucoEngine";

/** El servidor conserva y resuelve el estado. El navegador solo envía decisiones. */
export function useTrucoBotMatch(botIndex: number, matchId: string) {
  const [state,setState]=useState<TrucoState>(()=>newGame());
  const [ready,setReady]=useState(false);
  const [loadedMatch,setLoadedMatch]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [retry,setRetry]=useState(0);
  const current=useRef<{state:TrucoState;version:number}|null>(null);
  const generation=useRef(0);
  const inFlight=useRef(false);
  const request=useCallback(async(op:"open"|"act"|"step",action?:Action)=>{
    if(inFlight.current)return;
    const token=generation.current;
    inFlight.current=true;setBusy(true);
    try{
      const {data,error:e}=await supabase.functions.invoke("truco-bot",{body:{id:matchId,bot:Math.min(2,Math.max(0,Math.trunc(botIndex||0))),op,version:current.current?.version,action}});
      if(token!==generation.current)return;
      if(e||!data?.state)throw e??new Error(data?.error??"Respuesta inválida");
      current.current=data;setState(data.state);setLoadedMatch(matchId);setReady(true);setError("");
    }catch(e){if(token===generation.current)setError(e instanceof Error?e.message:"No pudimos conectar con la mesa.");}
    finally{if(token===generation.current){inFlight.current=false;setBusy(false);}}
  },[matchId,botIndex]);
  useEffect(()=>{
    generation.current++;inFlight.current=false;current.current=null;setReady(false);setError("");
    void request("open");
    return()=>{generation.current++;inFlight.current=false;};
  },[request,retry]);
  const thinking=ready&&loadedMatch===matchId&&state.phase==="playing"&&actor(state)===1;
  useEffect(()=>{
    if(!thinking||busy||error)return;
    const timer=window.setTimeout(()=>void request("step"),900);
    return()=>window.clearTimeout(timer);
  },[thinking,busy,error,state,request]);
  const act=useCallback((action:Action)=>{if(ready&&!busy&&!error)void request("act",action);},[ready,busy,error,request]);
  return {state,thinking,act,ready:ready&&loadedMatch===matchId,busy,error,reconnect:()=>setRetry(n=>n+1)};
}
