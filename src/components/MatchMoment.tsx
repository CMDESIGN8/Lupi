import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { FutsalBall, FutsalFigure } from './FutsalFigure';
import './MatchMoment.css';

/** Resolución cinematográfica de una jugada del partido (gol, atajada, recuperación…).
 *  Se dibuja DENTRO de la cancha (no es modal) y dura ~3 s. Tocar acelera; "NO MOSTRAR MÁS" la desactiva. */
export type MomentOutcome = 'goal' | 'saved' | 'miss' | 'chance' | 'recovered' | 'blocked' | 'concede';

const META: Record<MomentOutcome, { title: string; tone: 'gold' | 'sky' | 'mint' | 'red'; defense: boolean; kick: boolean }> = {
  goal:      { title: '¡GOOOL!',               tone: 'gold', defense: false, kick: true },
  saved:     { title: '¡LA SACÓ EL ARQUERO!',  tone: 'sky',  defense: false, kick: true },
  miss:      { title: '¡QUÉ CERCA!',           tone: 'sky',  defense: false, kick: true },
  chance:    { title: '¡BUENA JUGADA!',        tone: 'mint', defense: false, kick: false },
  recovered: { title: '¡RECUPERASTE!',         tone: 'mint', defense: true,  kick: false },
  blocked:   { title: '¡CERRASTE EL CAMINO!',  tone: 'mint', defense: true,  kick: true },
  concede:   { title: '¡GOL RIVAL!',           tone: 'red',  defense: true,  kick: true },
};

export const MOMENTS_PREF_KEY = 'lupi-moments';
export function momentsEnabled(): boolean {
  try { return window.localStorage.getItem(MOMENTS_PREF_KEY) !== 'off'; } catch { return true; }
}
export function setMomentsEnabled(on: boolean) {
  try { window.localStorage.setItem(MOMENTS_PREF_KEY, on ? 'on' : 'off'); } catch { /* sin storage */ }
}
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Props = {
  outcome: MomentOutcome;
  /** Reemplaza el título por defecto (p. ej. "¡GOL DE BOT NOVATO!"). */
  title?: string;
  /** Línea chica bajo el título (la narración de la jugada). */
  caption?: string;
  playMs?: number;
  holdMs?: number;
  /** false = el resultado queda hasta que el padre lo desmonte (PvP, que va con reloj del servidor). */
  autoClose?: boolean;
  /** Si la jugada ya está avanzada (p. ej. entrás tarde a una repetición), muestra solo el resultado. */
  resultOnly?: boolean;
  onDone?: () => void;
};

export function MatchMoment({ outcome, title, caption, playMs = 1600, holdMs = 1500, autoClose = true, resultOnly = false, onDone }: Props) {
  const meta = META[outcome];
  const reduced = useRef(reducedMotion()).current;
  const off = useRef(!momentsEnabled()).current;
  const [stage, setStage] = useState<'play' | 'result'>(reduced || resultOnly ? 'result' : 'play');
  const [skipped, setSkipped] = useState(reduced || resultOnly);
  const closed = useRef(false);
  const finish = () => { if (closed.current) return; closed.current = true; onDone?.(); };

  useEffect(() => { if (off) finish(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (off) return;
    if (stage === 'play') { const t = window.setTimeout(() => setStage('result'), playMs); return () => window.clearTimeout(t); }
    if (autoClose) { const t = window.setTimeout(finish, reduced ? 1100 : holdMs); return () => window.clearTimeout(t); }
  }, [stage, off, playMs, holdMs, autoClose]); // eslint-disable-line react-hooks/exhaustive-deps
  if (off) return null;

  const shown = title ?? meta.title;
  const tap = () => { if (stage === 'play') { setSkipped(true); setStage('result'); } else if (autoClose) finish(); };
  const attackerAction = meta.kick ? 'kick' : 'ready';
  const showMate = outcome === 'chance' || outcome === 'recovered' || outcome === 'blocked';

  return (
    <div className={`mm mm--${outcome} mm--${meta.tone}${meta.defense ? ' mm--defense' : ''}`} data-stage={stage} data-skipped={skipped ? '' : undefined}
      style={{ '--t': `${playMs}ms` } as CSSProperties} onClick={tap}>
      <div className="mm__scrim" />
      <div className="mm__world" aria-hidden="true">
        <div className="mm__ground" />
        <div className="mm__goal"><i /></div>
        {outcome !== 'recovered' && <FutsalFigure kit={meta.defense ? 'ourKeeper' : 'keeper'} className="mm__fig mm__keeper" />}
        <FutsalFigure kit="rival" action={attackerAction} className="mm__fig mm__attacker" />
        {showMate && <FutsalFigure kit="mate" action={outcome === 'recovered' ? 'slide' : 'ready'} className="mm__fig mm__mate" />}
        <FutsalBall className="mm__ball mm__ball--g2" /><FutsalBall className="mm__ball mm__ball--g1" /><FutsalBall className="mm__ball" />
        <i className="mm__burst" /><i className="mm__shield" />
      </div>
      <div className="mm__rays" aria-hidden="true" />
      <div className="mm__result" aria-hidden="true"><i /><strong>{shown}</strong>{caption && <small>{caption}</small>}</div>
      <div className="mm__bars" aria-hidden="true" />
      <span className="mm__sr" role="status">{stage === 'result' ? `${shown}. ${caption ?? ''}` : ''}</span>
      {stage === 'play' && <button type="button" className="mm__skipall" onClick={e => { e.stopPropagation(); setMomentsEnabled(false); finish(); }}>NO MOSTRAR MÁS</button>}
    </div>
  );
}
