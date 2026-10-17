import type { CSSProperties } from "react";
import { DEFAULT_APPEARANCE, type AvatarAppearance } from "../lib/avatarAppearance";
import "./AvatarFace.css";
export function AvatarFace({appearance = DEFAULT_APPEARANCE, className = ""}: {appearance?: AvatarAppearance; className?: string}) {
 return <div className={`lw-face lw-face--${appearance.hair} lw-face--${appearance.face} ${className}`} style={{"--lw-skin":appearance.skin,"--lw-hair":appearance.hairColor} as CSSProperties} aria-label="Rostro personalizado" role="img">
 <span className="lw-face__ear lw-face__ear--left"/><span className="lw-face__ear lw-face__ear--right"/>
 <div className="lw-face__hair"/><div className="lw-face__brows"><i/><i/></div><div className="lw-face__eyes"><i/><i/></div><span className="lw-face__nose"/><div className={`lw-face__mouth lw-face__mouth--${appearance.expression}`}/>
 </div>;
}
