import { AvatarFace } from './AvatarFace';
import { useAvatarAppearance } from '../hooks/useAvatarAppearance';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FutsalBall, FutsalFigure, type FigureKit, type FigureLook } from './FutsalFigure';
import './PlayCinematic.css';

export type PlayChoice = 'shoot' | 'pass' | 'press' | 'cover';

type Script = {
  call: string; heroMove: string; foe: FigureKit; foeLook: FigureLook; foeTag: string; foeLine: string;
  caps: [string, string, string]; result: string; note: string; tone: 'gold' | 'mint';
};

const SCRIPTS: Record<PlayChoice, Script> = {
  shoot: { call: '¡REMATÁ!', heroMove: 'TIRO RASANTE', foe: 'keeper', foeLook: 'shock', foeTag: 'ARQUERO', foeLine: '¡SALE A ACHICAR!',
    caps: ['Recibís cerca del arco…', 'Vos contra el arquero. ¡Un segundo para decidir!', 'Pateás fuerte y abajo…'],
    result: '¡EL ARQUERO LA SACÓ!', note: 'No entró, pero probaste el remate. En el partido, tu carta y la situación inclinan el resultado.', tone: 'gold' },
  pass: { call: '¡DALE EL PASE!', heroMove: 'PASE FILTRADO', foe: 'mate', foeLook: 'focus', foeTag: 'COMPAÑERO', foeLine: '¡LA PIDE LIBRE!',
    caps: ['Levantás la cabeza…', 'Tu compañero queda solo frente al arco.', 'Pase al pie, al primer toque…'],
    result: '¡LA JUGADA SIGUE!', note: 'Jugar en equipo también es ganar. La jugada sigue viva y el arquero quedó a contrapierna.', tone: 'mint' },
  press: { call: '¡SALÍ A MARCAR!', heroMove: 'ENTRADA LIMPIA', foe: 'rival', foeLook: 'focus', foeTag: 'RIVAL', foeLine: '¡BUSCA EL PASE!',
    caps: ['El rival busca a su compañero…', 'Leés el pase. Es tu oportunidad.', 'Te barrés y cortás la trayectoria…'],
    result: '¡RECUPERASTE LA PELOTA!', note: 'Salir a tiempo cierra el espacio. Tu compañero cubre el pase por si falla.', tone: 'mint' },
  cover: { call: '¡CUBRÍ EL ARCO!', heroMove: 'CIERRE DE ÁNGULO', foe: 'rival', foeLook: 'shock', foeTag: 'RIVAL', foeLine: '¡VA A PATEAR!',
    caps: ['Te quedás bajo los tres palos…', 'Leés su pierna. Se viene el remate.', 'Te plantás en la línea de tiro…'],
    result: '¡CERRASTE EL CAMINO!', note: 'Cubrir la zona también es defender. El remate no pasó.', tone: 'mint' },
};

/** Duración de cada plano antes de la resolución: llamada, primer plano, jugada. */
const BEAT_MS = [900, 1500, 2600];

function usePrefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useTypewriter(text: string, instant: boolean) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => { i += 1; setN(i); if (i >= text.length) window.clearInterval(id); }, 18);
    return () => window.clearInterval(id);
  }, [text, instant]);
  return text.slice(0, n);
}

function CinematicFace({userId,celebrating}:{userId:string;celebrating:boolean}) {
  const {appearance,loading}=useAvatarAppearance(userId);
  return <div className="pc__avatar-face" aria-hidden="true">{!loading && <AvatarFace mood={celebrating?"celebrate":"focus"} appearance={appearance}/>}</div>;
}

type Props = { choice: PlayChoice; hero: ReactNode; userId?: string; onDone: () => void };

/** Cinemática breve estilo 16 bits: llamada → primer plano → jugada → resolución.
 *  La resolución se queda en pantalla hasta que la persona toca "Continuar". */
export function PlayCinematic({ choice, hero, userId, onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const s = SCRIPTS[choice];
  const [beat, setBeat] = useState(reduced ? 3 : 0);
  const [skipped, setSkipped] = useState(reduced);
  const nextRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const defense = choice === 'press' || choice === 'cover';

  useEffect(() => {
    if (beat >= 3) return;
    const t = window.setTimeout(() => setBeat(beat + 1), BEAT_MS[beat]);
    return () => window.clearTimeout(t);
  }, [beat]);

  useEffect(() => { if(beat === 3) nextRef.current?.focus({ preventScroll: true }); }, [beat]);

  const skip = () => { setSkipped(true); setBeat(3); };
  const caption = useTypewriter(beat < 3 ? s.caps[beat] : s.note, reduced);
  const full = beat < 3 ? s.caps[beat] : s.note;

  return (
    <div className={`pc pc--${choice} pc--${s.tone}${defense ? ' pc--defense' : ''}`} data-beat={beat} data-skipped={skipped ? '' : undefined}
      role="group" aria-label="Resolución de la jugada">
      <div className="pc__frame">
        <div className="pc__stage">
          <div className="pc__bg" />
          <i key={beat} className="pc__flash" />

          <div className="pc__layer pc__call"><div className="pc__rays" /><strong>{s.call}</strong></div>

          <div className="pc__layer pc__close">
            <div className="pc__half pc__half--hero"><div className="pc__rays pc__rays--a" /><div className={`pc__hero ${userId ? 'pc__hero--portrait' : ''}`}><div className="pc__hero-body">{hero}</div>{userId && <CinematicFace userId={userId} celebrating={beat===3 && choice!=="shoot"}/>}</div><span className="pc__tag"><b>VOS</b>{s.heroMove}</span></div>
            <div className="pc__half pc__half--foe"><div className="pc__rays pc__rays--b" /><div className="pc__foe"><FutsalFigure kit={s.foe} look={s.foeLook} crop="bust" /></div><span className="pc__tag pc__tag--foe"><b>{s.foeTag}</b>{s.foeLine}</span></div>
            <i className="pc__slash" />
          </div>

          <div className="pc__layer pc__play">
            <div className="pc__world">
              <div className="pc__goal" />
              <FutsalFigure kit={defense ? 'ourKeeper' : 'keeper'} look={beat === 3 && choice === 'shoot' ? 'neutral' : 'shock'} className="pc__fig pc__keeper" />
              <FutsalFigure kit="mate" action={choice === 'press' ? 'slide' : 'ready'} className="pc__fig pc__mate" look="focus" />
              <FutsalFigure kit="rival" action="kick" className="pc__fig pc__rival" look="focus" />
              <FutsalBall className="pc__ball" />
              <i className="pc__burst" /><i className="pc__shield" /><i className="pc__swoosh" />
            </div>
          </div>

          <div className="pc__layer pc__result" aria-hidden="true"><i /><strong>{s.result}</strong></div>
          <div className="pc__bars" aria-hidden="true" />
          <div className="pc__scan" aria-hidden="true" />
        </div>

        <div className="pc__side">
          <div className="pc__dialog">
            <span className="pc__name">LUPI · TU DT</span>
            <p className="pc__text" aria-hidden="true">{caption}<span className="pc__cursor" /></p>
            <p className="pc__sr" role="status">{beat === 3 ? `${s.result} ${full}` : full}</p>
          </div>
          <div className="pc__actions">
            {beat < 3
              ? <button ref={skipRef} type="button" className="pc__btn pc__btn--ghost" onClick={skip}>SALTAR ▸▸</button>
              : <button ref={nextRef} type="button" className="pc__btn" onClick={onDone}>VER RESULTADO →</button>}
          </div>
        </div>
      </div>
    </div>);
}
