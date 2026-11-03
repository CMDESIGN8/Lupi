import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '../lib/supabaseClient';
export type StoryChoice='confident'|'team'|'nervous';
export type StoryProgress={intro_step:number;status:'intro'|'ready'|'match'|'ending'|'completed';choice:StoryChoice|null;session_id:string|null;result:'win'|'draw'|'loss'|null;user_score:number|null;opponent_score:number|null};
export function useFutsalStory(userId:string){
 const [progress,setProgress]=useState<StoryProgress|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const owner=useRef(userId);owner.current=userId;const serial=useRef(0);const lock=useRef(false);
 const run=useCallback(async(action:'get'|'begin'|'next'|'choose'|'bind'|'complete'|'finish',choice?:StoryChoice,sessionId?:string)=>{
  if(lock.current)throw new Error('Esperá a que termine la acción anterior');
  lock.current=true;setBusy(true);setError('');const request=++serial.current;
  try{
   const {data,error:failure}=await supabase.rpc('lupi_story_chapter1_action',{p_action:action,p_choice:choice??null,p_session_id:sessionId??null});
   if(failure)throw new Error(failure.message);
   if(data && (!['intro','ready','match','ending','completed'].includes(data.status)||!Number.isInteger(data.intro_step)))throw new Error('No se pudo leer el avance del capítulo');
   if(owner.current===userId&&request===serial.current)setProgress(data as StoryProgress|null);
   return data as StoryProgress|null;
  }catch(e){const message=e instanceof Error?e.message:'No pudimos guardar tu historia';if(owner.current===userId)setError(message);throw e;}
  finally{lock.current=false;if(owner.current===userId){setBusy(false);setLoading(false);}}
 },[userId]);
 useEffect(()=>{
  let alive=true;const request=++serial.current;setProgress(null);setLoading(true);setBusy(false);setError('');
  void Promise.resolve(supabase.rpc('lupi_story_chapter1_action',{p_action:'get',p_choice:null,p_session_id:null})).then(({data,error:failure})=>{
   if(!alive||owner.current!==userId||request!==serial.current)return;
   if(failure)setError(failure.message);else setProgress(data as StoryProgress|null);
   setLoading(false);
  }).catch(()=>{if(alive&&owner.current===userId&&request===serial.current){setError('No pudimos conectar con tu historia');setLoading(false);}});
  return()=>{alive=false;};
 },[userId]);
 return {progress,loading,busy,error,run};
}
export type FutsalStoryState=ReturnType<typeof useFutsalStory>;
