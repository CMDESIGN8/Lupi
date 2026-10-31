import floresCrest from '../../assets/flores-club.png';
import lupiCrest from '../../assets/lupifc-crest.png';

/** Club identity comes from the player's club, independently of equipped clothing. */
export function isFloresClub(club?:string|null):boolean {
 const name=(club??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 return ['flores','flores club','flores futsal','flores fut sal','flores club futsal','flores club fut sal','club flores','club flores futsal','club flores fut sal'].includes(name);
}
export function ClubCrest({club}:{club?:string|null}) {
 const flores=isFloresClub(club);
 return <div className="lw-crest" title={flores?'Flores Club Futsal':'LupiFC · Escudo provisional del jugador'}><img src={flores?floresCrest:lupiCrest} alt={flores?'Escudo de Flores Club Futsal':'Escudo de LupiFC, provisional'}/><small>{flores?'Flores Futsal':'LupiFC'}</small></div>;
}
