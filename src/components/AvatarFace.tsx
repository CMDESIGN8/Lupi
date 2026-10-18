import type { CSSProperties } from "react";
import { DEFAULT_APPEARANCE, HAIR_COLORS, HAIRS, type AvatarAppearance } from "../lib/avatarAppearance";
import "./AvatarFace.css";

export function AvatarFace({ appearance = DEFAULT_APPEARANCE, className = "" }: { appearance?: AvatarAppearance; className?: string }) {
  const hair = HAIRS.includes(appearance.hair as typeof HAIRS[number]) ? appearance.hair : DEFAULT_APPEARANCE.hair;
  const color = HAIR_COLORS.includes(appearance.hairColor) ? appearance.hairColor : DEFAULT_APPEARANCE.hairColor;
  // One grayscale transparent PNG per hairstyle; color is applied in CSS.
  const sprite = `/images/avatar/hair${hair}.png`;
  const style = { "--lw-skin": appearance.skin, "--lw-hair": color, "--lw-hair-sprite": `url("${sprite}")` } as CSSProperties;
  return (
    <div className={`lw-face lw-face--${hair} lw-face--${appearance.face} ${className}`} style={style} aria-label="Rostro personalizado" role="img">
      <span className="lw-face__ear lw-face__ear--left"/><span className="lw-face__ear lw-face__ear--right"/>
      <div className="lw-face__hair"/><div className="lw-face__brows"><i/><i/></div>
      <div className="lw-face__eyes"><i/><i/></div><span className="lw-face__nose"/>
      <div className={`lw-face__mouth lw-face__mouth--${appearance.expression}`}/>
    </div>
  );
}
