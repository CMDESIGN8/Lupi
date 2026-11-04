import sheet from '../assets/lupi-truco-expressions.png';
const positions={thinking:'0% 0%',approve:'50% 0%',guide:'100% 0%',laugh:'0% 100%',shy:'50% 100%',compete:'100% 100%'};
export function LupiTrucoPose({pose='guide'}:{pose?:keyof typeof positions}){
 return <span className="tr-lupi-portrait" role="img" aria-label="Lupi"><span style={{backgroundImage:`url(${sheet})`,backgroundPosition:positions[pose]}}/></span>;
}
