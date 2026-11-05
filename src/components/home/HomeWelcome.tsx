import { LupiStoryPose } from '../LupiStoryPose';
import './HomeWelcome.css';

type Props={onDismiss:()=>void;onPlay:()=>void};
export function HomeWelcome({onDismiss,onPlay}:Props){
 return <section className="home-welcome home-welcome--manga" aria-labelledby="home-welcome-title">
   <div className="hw-intro"><span>PRÓLOGO · TU HISTORIA EMPIEZA ACÁ</span><button type="button" onClick={onDismiss} aria-label="Cerrar bienvenida">×</button></div>
   <div className="hw-scene" aria-hidden="true"><div className="hw-speedlines"/><LupiStoryPose pose="welcome" label=""/><span className="hw-coach-label">LUPI · TU COMPAÑERO</span><span className="hw-sfx">¡VAMOS!</span></div>
   <div className="hw-story"><span className="hw-eyebrow">BIENVENIDO A LUPI WORLD</span><h2 id="home-welcome-title">Vos sos el<br/><em>protagonista.</em></h2><p>Creá tu personaje, encontrá tu equipo y viví cada jugada con tu club.</p><div className="hw-journey" aria-label="Tu aventura"><span><b>01</b> Tu personaje</span><span><b>02</b> Tu equipo</span><span><b>03</b> Tu historia</span></div></div>
   <div className="hw-actions"><button type="button" className="hw-primary" onClick={onPlay}>COMENZAR MI HISTORIA <span aria-hidden="true">→</span></button><button type="button" className="hw-later" onClick={onDismiss}>Primero miro el club</button></div>
 </section>;
}
