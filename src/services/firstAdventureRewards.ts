import { supabase } from "../lib/supabaseClient";
export type RewardKey = "welcome" | "equip_avatar" | "social" | "open_pack";
export const FIRST_REWARDS: Record<RewardKey, {coins:number;xp:number;title:string}> = {
 welcome:{coins:100,xp:50,title:"¡Bienvenido a Lupi World!"},
 equip_avatar:{coins:20,xp:50,title:"¡Tu primer estilo!"},
 social:{coins:20,xp:50,title:"¡Primera conexión!"},
 open_pack:{coins:20,xp:50,title:"¡Tus primeras cartas!"},
};
export async function getClaimedFirstRewards(userId:string):Promise<RewardKey[]> {
 const {data,error}=await supabase.from("lupi_first_adventure_rewards").select("reward_key").eq("user_id",userId);
 if(error)throw error;
 return (data||[]).map(r=>r.reward_key as RewardKey);
}
export async function claimFirstReward(key:RewardKey):Promise<boolean> {
 const {data,error}=await supabase.rpc("claim_first_adventure_reward",{p_reward_key:key});
 if(error)throw error;
 if(data?.awarded)window.dispatchEvent(new CustomEvent("lupi:progression-updated",{detail:{actionType:"first_adventure",result:data}}));
 return Boolean(data?.awarded);
}
