import type { FutsalChoice, FutsalEvent, FutsalState } from '../../hooks/useFutsalPvp';
export type TacticalOption = {id:FutsalChoice;title:string;hint:string};
type Route = 'wing'|'wall'|'pivot';
const ids:FutsalChoice[]=['angle','power','back'];
const pack=(titles:string[],hints:string[]):TacticalOption[]=>ids.map((id,i)=>({id,title:titles[i],hint:hints[i]}));
export const routeName=(route?:string|null)=>route==='wing'?'DESBORDE':route==='wall'?'PARED':route==='pivot'?'JUEGO CON PÍVOT':'CONSTRUCCIÓN';
export const actorIndex=(state:FutsalState,attacking:boolean)=>state.rulesVersion===2 ? state.stage==='build' ? attacking?2:1 : attacking ? state.route==='wing'?3:state.route==='wall'?2:4 : 0 : attacking?4:0;
const builds={attack:pack(['Desbordar por la banda','Hacer una pared','Buscar al pívot'],['Superá la marca por afuera. Lo frena cerrar la banda.','Tocá y buscá la devolución. Lo frena cortar la pared.','Encontrá al pívot entre líneas. Lo frena anticipar.']),defense:pack(['Cerrar la banda','Cortar la pared','Anticipar al pívot'],['Recuperás si intenta desbordar.','Recuperás si busca la devolución.','Recuperás si busca al pívot.'])};
const finishes:Record<Route,{attack:TacticalOption[];defense:TacticalOption[]}>= {
 wing:{attack:pack(['Remate cruzado','Segundo palo','Enganchar y definir'],['Lo frena cubrir el remate cruzado.','Buscá al compañero libre. Lo frena cerrar segundo palo.','Cambiá de dirección. Lo frena esperar el enganche.']),defense:pack(['Cubrir tiro cruzado','Cerrar segundo palo','Esperar el enganche'],['Atajás si remata cruzado.','Cortás si busca al compañero.','Recuperás si intenta enganchar.'])},
 wall:{attack:pack(['Definir de primera','Picarla al arquero','Amagar y definir'],['Rematá sin controlar. Lo frena reaccionar al tiro.','Buscá pasar por arriba. Lo frena quedarse de pie.','Esperá que se juegue. Lo frena aguantar el amague.']),defense:pack(['Reaccionar al tiro','Quedarse de pie','Aguantar el amague'],['Atajás si define de primera.','Atajás si intenta picarla.','Atajás si intenta amagar.'])},
 pivot:{attack:pack(['Girar y rematar','Descargar y definir','Proteger y definir'],['Buscá el giro. Lo frena bloquear la media vuelta.','Asistí al compañero. Lo frena cortar la descarga.','Aguantá la marca. Lo frena presionar al pívot.']),defense:pack(['Bloquear el giro','Cortar la descarga','Presionar al pívot'],['Frenás si gira y remata.','Recuperás si descarga al compañero.','Recuperás si protege la pelota.'])}
};
export function tacticalOptions(state:Pick<FutsalState,'rulesVersion'|'stage'|'route'>,attacking:boolean):TacticalOption[] {
 if(state.rulesVersion!==2)return attacking?pack(['Tiro al ángulo','Remate fuerte','Aguanto y paso atrás'],['Lo frena cubrir el ángulo.','Lo frena salir a achicar.','Si no lo cortan, tenés una segunda definición.']):pack(['Cubro el ángulo','Salgo a achicar','Corto el pase'],['Atajás el tiro al ángulo.','Tapás el remate fuerte.','Recuperás si pasa atrás.']);
 const options=state.stage==='finish'?finishes[(state.route??'pivot') as Route]??finishes.pivot:builds;
 return options[attacking?'attack':'defense'];
}
export const eventChoiceLabel=(event:FutsalEvent,attacking:boolean)=>tacticalOptions(event,attacking).find(c=>c.id===(attacking?event.attack:event.defense))?.title??'Jugada';
