import { AvatarFace } from './AvatarFace';
import { DEFAULT_EXPRESSIONS, EXPRESSION_IDS, type AvatarAppearance, type AvatarMood, type AvatarExpressionSet } from '../lib/avatarAppearance';
const labels: Record<string, string> = {neutral:'Normal',smile:'Sonrisa',focused:'Competitivo',surprised:'Sorprendido',determined:'Decidido',happy:'Feliz',wink:'Guiño',laugh:'Risa',worried:'Preocupado',angry:'Enojado',sad:'Triste'};
const moods: [AvatarMood, string][] = [['presentation','Presentación'],['focus','Concentración'],['celebrate','Festejo']];
export function AvatarExpressionPresets({ appearance, onChange }: { appearance: AvatarAppearance; onChange: (next: AvatarExpressionSet) => void }) {
  const presets = { ...DEFAULT_EXPRESSIONS, ...appearance.expressionPresets };
  return <section className="lw-id__expression-presets" aria-label="Expresiones para jugar">
    <h3 className="lw-id__label">TUS 3 EXPRESIONES PARA JUGAR</h3>
    <p>Elegí cómo aparecés en las previas, jugadas y festejos. Se guardan con tu personaje.</p>
    <div>{moods.map(([mood, title]) => <label key={mood}>
      <span className="lw-id__preset-face"><AvatarFace appearance={{...appearance,expression:presets[mood]}}/></span>
      <strong>{title}</strong>
      <select aria-label={`Expresión de ${title.toLowerCase()}`} value={presets[mood]} onChange={e=>onChange({...presets,[mood]:e.target.value})}>
        {EXPRESSION_IDS.map(id=><option key={id} value={id}>{labels[id]}</option>)}
      </select>
    </label>)}</div>
  </section>;
}
