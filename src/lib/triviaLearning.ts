import {supabase} from './supabaseClient';
export type LearningTopic={code:string;label:string;attempts:number;correct:number;mastered:number;total:number};
export type LearningOverview={topics:LearningTopic[];reviewDue:number;daily:{id:string;status:string;score:number;answered:number}|null;localDay:string};
export type LearningSession={id:string;mode:'daily'|'review';status:'open'|'finished';score:number;answered:number;total:number;serverNow:string;deadline:string|null;question:{index:number;prompt:string;options:string[]}|null;lastResult:{index:number;prompt:string;correct:string;explanation:string;ok:boolean}|null};
async function rpc<T>(name:string,args?:Record<string,unknown>):Promise<T>{const{data,error}=await supabase.rpc(name,args);if(error)throw new Error(error.message);return data as T;}
export const learningOverview=()=>rpc<LearningOverview>('trivia_learning_overview');
export const learningStart=(mode:'daily'|'review')=>rpc<LearningSession>('trivia_learning_start',{p_mode:mode});
export const learningState=(id:string)=>rpc<LearningSession>('trivia_learning_state',{p_id:id});
export const learningAnswer=(id:string,index:number,answer:number)=>rpc<LearningSession>('trivia_learning_answer',{p_id:id,p_index:index,p_answer:answer});
