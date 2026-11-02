import type {BaseCard,UserCard,Position} from '../types/cards';
type Skill='pace'|'dribbling'|'passing'|'defending'|'finishing'|'physical';
export const ROLE_WEIGHTS:Record<Position,Partial<Record<Skill,number>>>={
 arquero:{defending:.55,physical:.25,pace:.15,passing:.05},
 cierre:{defending:.45,physical:.2,passing:.2,pace:.15},
 ala:{pace:.3,dribbling:.3,passing:.25,finishing:.15},
 pivot:{finishing:.5,physical:.2,dribbling:.15,passing:.15},
};
export const roleForSlot=(slot:number):Position=>slot===1?'arquero':slot===2?'cierre':slot===5?'pivot':'ala';
/** UI advice only: does not modify match odds, ratings or chemistry. */
export function roleScore(data:Partial<BaseCard>|undefined,slot:number):number{
 if(!data)return 0;
 return Math.round(Object.entries(ROLE_WEIGHTS[roleForSlot(slot)]).reduce((n,[k,w])=>n+(Number(data[k as Skill])||0)*w,0)*100)/100;
}
export function rankRoleCards(cards:UserCard[],slot:number,deck:UserCard[]=[]):UserCard[]{
 const current=deck.find(c=>c.position===slot);const busy=new Set(deck.filter(c=>c.position!==slot).map(c=>c.id));
 return cards.filter(c=>c.card&&!busy.has(c.id)).sort((a,b)=>
 Number(b.card?.position===roleForSlot(slot))-Number(a.card?.position===roleForSlot(slot))||roleScore(b.card,slot)-roleScore(a.card,slot)||Number(b.id===current?.id)-Number(a.id===current?.id)||(a.card?.name??'').localeCompare(b.card?.name??'')||a.id.localeCompare(b.id));
}
export function keySkillsForSlot(slot:number){return Object.entries(ROLE_WEIGHTS[roleForSlot(slot)]).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([key])=>key as Skill);}
