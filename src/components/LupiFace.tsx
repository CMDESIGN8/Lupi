import sheet from '../assets/lupi-truco-expressions.png';
import './TrucoPortraits.css';
const crops = {
  thinking: [62, 0, 275, 253], approve: [435, 0, 275, 253],
  guide: [802, 0, 275, 253], laugh: [48, 650, 275, 253],
  shy: [425, 650, 275, 253], compete: [790, 650, 290, 265],
};
const labels = {thinking:'pensando',approve:'con un guiño',guide:'sonriendo',laugh:'festejando',shy:'sorprendido',compete:'concentrado'};
/** Frame existing expression artwork directly, without changing the story's full-body poses. */
export function LupiFace({pose='guide'}:{pose?:keyof typeof crops}) {
  return <svg className="tr-lupi-face" viewBox={crops[pose].join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Lupi ${labels[pose]}`} focusable="false">
    <image href={sheet} width="1199" height="1312"/>
  </svg>;
}
