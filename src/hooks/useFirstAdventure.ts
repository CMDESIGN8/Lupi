import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
export const STEPS = ['create_avatar','enter_world','equip_avatar','social','open_pack','build_team','first_match','explore'] as const;
export type AdventureStep = typeof STEPS[number];
type Progress = { completed: AdventureStep[]; skippedSocial: boolean };
const empty = (): Progress => ({completed:[], skippedSocial:false});
const key = (id:string) => `lupi_adventure_v1_${id}`;
function local(id:string):Progress { try {const v=JSON.parse(localStorage.getItem(key(id))||'null'); return Array.isArray(v?.completed)?v:empty();}catch{return empty();} }
export function useFirstAdventure(userId:string) {
 const [progress,setProgress]=useState<Progress>(()=>local(userId));
 const [ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;setReady(false);setProgress(local(userId));
  if(!userId)return;
  void (async()=>{const {data,error}=await supabase.from('lupi_first_adventure').select('completed,skipped_social').eq('user_id',userId).maybeSingle();
   if(!alive)return;
   const previous=local(userId);
   const remote:Progress={completed:(data?.completed||[]) as AdventureStep[],skippedSocial:Boolean(data?.skipped_social)};
   const next:Progress={completed:STEPS.filter(s=>previous.completed.includes(s)||remote.completed.includes(s)),skippedSocial:previous.skippedSocial||remote.skippedSocial};
   setProgress(next);localStorage.setItem(key(userId),JSON.stringify(next));setReady(true);
   if(error)console.warn('FirstAdventure sync:',error.message);
   else if(next.completed.length!==remote.completed.length||next.skippedSocial!==remote.skippedSocial)void supabase.from('lupi_first_adventure').upsert({user_id:userId,completed:next.completed,skipped_social:next.skippedSocial},{onConflict:'user_id'});
  })();return()=>{alive=false};
 },[userId]);
 const update=useCallback((step?:AdventureStep,skip=false)=>{if(!ready||!userId)return;
  setProgress(old=>{if((!step||old.completed.includes(step))&&(!skip||old.skippedSocial))return old;
   const next={completed:step?[...old.completed,step]:old.completed,skippedSocial:old.skippedSocial||skip};
   localStorage.setItem(key(userId),JSON.stringify(next));
   void supabase.from('lupi_first_adventure').upsert({user_id:userId,completed:next.completed,skipped_social:next.skippedSocial},{onConflict:'user_id'}).then(({error})=>{if(error)console.warn('FirstAdventure save:',error.message)});
   return next;
  });
 },[userId,ready]);
 const complete=useCallback((step:AdventureStep)=>update(step),[update]);
 const skipSocial=useCallback(()=>update(undefined,true),[update]);
 const next=useMemo(()=>STEPS.find(s=>!progress.completed.includes(s)&&!(s==='social'&&progress.skippedSocial))??null,[progress]);
 return {progress,ready,next,complete,skipSocial,finished:next===null};
}
