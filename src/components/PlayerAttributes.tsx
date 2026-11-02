import type { BaseCard } from '../types/cards';
export const PLAYER_SKILLS = [
 ['pace','Velocidad','Llegar antes y acompañar las jugadas.'],
 ['dribbling','Regate','Superar marcas y conservar la pelota.'],
 ['passing','Pase','Conectar al equipo y crear oportunidades.'],
 ['defending','Defensa','Cerrar espacios y frenar ataques.'],
 ['finishing','Remate','Definir las oportunidades de gol.'],
 ['physical','Físico','Disputar la pelota y sostener el esfuerzo.'],
] as const;
export function skillTarget(value:number){return value<20?50:value<60?100:value<80?150:250;}
export function PlayerAttributes({data}:{data:Partial<BaseCard>}){
 return <dl className="lp-attributes">{PLAYER_SKILLS.map(([key,label,description])=><div key={key} title={description}><dt>{label}</dt><dd>{data[key] ?? '—'}</dd></div>)}</dl>;
}
