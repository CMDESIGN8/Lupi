import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { UserCard } from '../types/cards';
import { getCardData } from '../utils/battleEngine';
import {OwnedCardPortrait} from './OwnedCardPortrait';
import { CardFace } from './SigningWelcome';
import {LupiStoryPose} from './LupiStoryPose';
import { FutsalBall, FutsalFigure } from './FutsalFigure';
import { PlayCinematic, type PlayChoice } from './PlayCinematic';
import './MatchTutorial.css';
import './MatchPractice.css';
import './MatchTutorialManga.css';
import './MatchTutorialScene.css';

type Props = { userId?:string; cards: UserCard[]; opponent: string; onTeam?: () => void; onStart: () => void | Promise<unknown> };
export function MatchTutorial({ userId, cards, opponent, onTeam, onStart }: Props) {
  const [step, setStep] = useState(0);
  const [practice,setPractice] = useState<PlayChoice | null>(null);
  const [cinema, setCinema] = useState<PlayChoice | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const startLock = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [transition, setTransition] = useState<'idle' | 'out' | 'kickoff'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const choosePractice = (choice: PlayChoice) => {
    if (cinema || transition !== 'idle') return;
    setCinema(choice);
  };
  // La cinemática se queda en la resolución hasta que la persona toca "Continuar".
  const finishCinema = () => { if (cinema) setPractice(cinema); setCinema(null); requestAnimationFrame(() => nextButton.current?.focus({preventScroll:true})); };
  const changeStep = (next: number) => {
    if (transition !== 'idle' || cinema) return;
    setTransition('out');
    timer.current = setTimeout(() => { setStep(next); setPractice(null); setSelected(null); setStartError(null); setTransition('idle'); }, reducedMotion() ? 0 : 180);
  };
  const start = (skipTutorial = false) => {
    if (startLock.current || transition !== 'idle' || cards.length < 5) return;
    startLock.current = true;
    setStartError(null);
    setTransition(skipTutorial ? 'idle' : 'kickoff');
    timer.current = setTimeout(async()=>{try{await onStart();}catch{setStartError('No pudimos iniciar el partido. Probá de nuevo.');}finally{startLock.current=false;setTransition('idle');}}, skipTutorial || reducedMotion() ? 0 : 850);
  };
  const titles = ['¡Te queda una!', '¡Ahora defendé!', '¡Tu equipo está listo!'];
  const detail = selected === null || !cards[selected] ? null : getCardData(cards[selected]);
  return <section className={`match-tutorial mt-cinematic mt-state--${transition}`} aria-label="Tutorial del partido" aria-busy={transition !== 'idle'}>
    <div className="mt-atmosphere" aria-hidden="true"><i /><i /><i /></div>
    {transition === 'kickoff' && <div className="mt-kickoff" role="status"><span>LUPI WORLD</span><strong>A LA CANCHA</strong><small>Tu historia sigue en juego</small></div>}
    <header><span>ANTES DE JUGAR</span><span>{step + 1} / 3</span></header>
    <div className="mt-dots" aria-hidden="true">{titles.map((title, i) => <i key={title} className={i === step ? 'active' : ''} />)}</div>
    <div className="mt-content" aria-live="polite">
      <div className={`mt-manga-scene mt-integrated-panel mt-manga-scene--${step}`}>
        <div className="mt-manga-traces" aria-hidden="true"/>
        <LupiStoryPose pose={step===2?'celebrate':practice?(step===0&&practice==='shoot'?'surprised':'celebrate'):step===1?'determined':'explain'} className="mt-manga-lupi"/>
        <div key={`${step}:${practice ?? "ready"}`} className="mt-manga-speech"><small>LUPI · TU ENTRENADOR</small><h1>{titles[step]}</h1><p>{step===0?'Recibís cerca del arco. El arquero sale a achicar.':step===1?'El rival viene por el medio. Tu compañero cubre el pase.':'Cinco cartas. Un equipo. Ahora empieza tu partido.'}</p></div>
        <div className="mt-panel-objective"><strong>{step < 2 ? "TU MISIÓN" : "A LA CANCHA"}</strong><span>{step < 2 ? "Elegí una jugada. Es una práctica, sin premios ni penalización." : "Revisá tu quinteto y preparate para jugar."}</span></div>
        <span className="mt-manga-sfx" aria-hidden="true">{step===0?'¡TUM!':step===1?'¡AHORA!':'¡VAMOS!'}</span>
      </div>
      {step < 2 ? <>
        <div className={`mt-practice-court ${cinema ? "is-playing" : ""} ${practice?'has-choice':''}`} data-choice={practice} key={step} aria-label="Cancha de práctica">
          <div className="mt-practice-goal"/>
          <FutsalFigure kit={step===0?'keeper':'rival'} look={step===0?'shock':'focus'} className={`mt-fig ${step===0?'mt-fig--keeper':'mt-fig--rival'}`}/>
          <div className="mt-match-player" aria-hidden="true">{userId ? <OwnedCardPortrait userId={userId}/> : <span>⚡</span>}</div>
          <FutsalBall className={`mt-ball ${step===0?'mt-ball--attack':'mt-ball--defense'}`}/>
          <span className="mt-court-caption">{step === 0 ? 'ATAQUE · ÚLTIMA JUGADA' : 'DEFENSA · CERRÁ EL CAMINO'}</span>
{cinema && <PlayCinematic key={`${step}:${cinema}`} choice={cinema as PlayChoice} userId={userId} hero={userId ? <OwnedCardPortrait userId={userId}/> : <LupiStoryPose pose="determined"/>} onDone={finishCinema}/>}
          <small>PRÁCTICA · SIN PREMIOS NI PENALIZACIÓN</small>
        </div>

        <div className="mt-practice-choices">{(step===0?[['shoot','REMATAR','Buscá el hueco'],['pass','DAR EL PASE','Jugá con tu compañero']]:[['press','SALIR A MARCAR','Achicá el espacio'],['cover','CUBRIR EL ARCO','Protegé la zona']]).map(([id,label,hint])=><button type="button" key={id} disabled={!!cinema || transition!=='idle'} aria-pressed={practice===id} onClick={()=>choosePractice(id as PlayChoice)}><strong>{label}</strong><small>{hint}</small></button>)}</div>
        <div className={`mt-practice-feedback${!practice&&!cinema?' is-idle':''}`} role="status">{cinema ? <><strong>JUGADA EN CURSO…</strong><p>Mirá cómo se resuelve tu decisión.</p></> : practice?<><strong>{step===0?(practice==='pass'?'¡LA JUGADA SIGUE!':'¡EL ARQUERO LA SACÓ!'):(practice==='press'?'¡RECUPERASTE LA PELOTA!':'¡CERRASTE EL CAMINO!')}</strong><p>{step===0?'Elegiste cómo atacar. En el partido, la carta y la situación influyen en el resultado. Podés probar la otra jugada.':'Ya probaste ataque y defensa. Durante el partido elegís cuando aparece un momento clave. Podés probar la otra jugada.'}</p></>:<><strong>LUPI · TU DT</strong><p>{step===0?'Elegí rematar o dar el pase para probar.':'Elegí cómo defender para probar.'}</p></>}</div>
      </> : <div className="mt-quintet-panel">
        <p className="mt-lineup-subtitle">TU QUINTETO · VS {opponent}</p>
        <div className="mt-lineup">{cards.slice(0, 5).map((card, i) => {
          const player = getCardData(card);
          return <div className="mt-lineup-slot" key={card.id || i} style={{'--card-order': i} as CSSProperties}>
            <button className="mt-card-button" type="button" aria-expanded={selected === i} aria-label={`Ver estadísticas de ${player.name || 'Jugador'}`} onClick={() => setSelected(selected === i ? null : i)}>
              {card.card ? <CardFace item={card} index={i} variant="lineup" portrait={userId&&card.socio_id===userId?<OwnedCardPortrait userId={userId}/>:undefined} /> : <span className="mt-example"><strong>{player.name || 'Jugador'}</strong><small>Datos de carta no disponibles</small></span>}
              <span className="mt-card-hint">VER HABILIDADES ↗</span>
            </button>
            <span className="mt-role">{['ARQUERO', 'CIERRE', 'ALA IZQ.', 'ALA DER.', 'PÍVOT'][i]}</span>
          </div>;
        })}</div>
        {detail && <section className="mt-player-detail" aria-live="polite"><strong>{detail.name}</strong><div>{([['Ritmo','pace'],['Regate','dribbling'],['Pase','passing'],['Defensa','defending'],['Remate','finishing'],['Físico','physical']] as const).map(([label,key]) => <span key={key}>{label}<b>{detail[key] ?? 50}</b></span>)}</div><button type="button" onClick={() => setSelected(null)}>Cerrar habilidades</button></section>}
        <div className="mt-dt"><span aria-hidden="true">✦</span><p><strong>LUPI · TU DT</strong>Tocá una carta para conocer sus habilidades. Cuando estés listo, ¡a la cancha!</p></div>
        {cards.length < 5 && <p role="status">Necesitás 5 cartas para jugar.</p>}
        {onTeam && <button className="mt-team-button" type="button" onClick={onTeam} disabled={transition !== 'idle'}>Revisar mi equipo →</button>}
      </div>}
    </div>
    {startError && <p role="alert" className="mt-start-error">{startError}</p>}
    <footer>{step > 0 && <button type="button" className="mt-back" disabled={transition !== 'idle' || !!cinema} onClick={() => changeStep(step - 1)}>Atrás</button>}{cards.length >= 5 && <button type="button" className="mt-skip" disabled={transition !== 'idle' || !!cinema} onClick={() => start(true)}>SALTAR TUTORIAL</button>}<button type="button" ref={nextButton} className="mt-next" disabled={transition !== 'idle' || !!cinema || (step === 2 && cards.length < 5) || (step < 2 && !practice)} onClick={() => { if (step < 2) changeStep(step + 1); else start(); }}>{step === 2 ? 'Jugar partido →' : practice ? (step===0?'Ahora defendé →':'Presentá tu equipo →') : 'Elegí una jugada arriba'}</button></footer>
  </section>;
}
