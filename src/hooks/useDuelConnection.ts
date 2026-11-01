import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Challenge } from "./useLobbyChallenges";
type Connection={status:"active"|"abandoned"|"expired";rivalOnline:boolean;leftBy:string|null};
export function useDuelConnection(challenge:Challenge,enabled:boolean){
 const [connection,setConnection]=useState<Connection|null>(null),[networkError,setNetworkError]=useState(false);
 const timerRef=useRef(0);
 const session=useRef(0),lock=useRef(false),active=useRef(enabled);active.current=enabled;
 const ping=useCallback(async()=>{if(!enabled||lock.current)return;const token=session.current;lock.current=true;
  try{const {data,error}=await supabase.rpc("duel_session_ping",{p_game:challenge.gameType,p_id:challenge.id,p_leave:false});if(token!==session.current)return;if(error)throw error;setConnection(data as Connection);setNetworkError(false);if((data as Connection).status!=="active")window.clearInterval(timerRef.current);}
  catch{if(token===session.current)setNetworkError(true);}finally{if(token===session.current)lock.current=false;}
 },[enabled,challenge.id,challenge.gameType]);
 useEffect(()=>{const token=++session.current;lock.current=false;if(!enabled)return;void ping();const timer=window.setInterval(()=>void ping(),6000);timerRef.current=timer;return()=>{window.clearInterval(timer);if(token===session.current)session.current++;};},[enabled,ping]);
 const leave=useCallback(()=>{if(!active.current)return;void Promise.resolve(supabase.rpc("duel_session_ping",{p_game:challenge.gameType,p_id:challenge.id,p_leave:true})).catch(()=>{});},[challenge.id,challenge.gameType]);
 return {stopped:enabled&&!!connection&&connection.status!=="active",waiting:enabled&&!!connection&&!connection.rivalOnline,networkError:enabled&&networkError,ping,leave};
}
