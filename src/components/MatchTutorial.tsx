import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { UserCard } from '../types/cards';
import { getCardData } from '../utils/battleEngine';
import {OwnedCardPortrait} from './OwnedCardPortrait';
import { CardFace } from './SigningWelcome';
import {LupiStoryPose} from './LupiStoryPose';
import './MatchTutorial.css';
import './MatchPractice.css';
import './MatchTutorialManga.css';

type Props = { userId?:string; cards: UserCard[]; opponent: string; onTeam?: () => void; onStart: () => void | Promise<unknown> };
export function MatchTutorial({ userId, cards, opponent, onTeam, onStart }: Props) {
  const [step, setStep] = useState(0);
  const [practice,setPractice] = useState<string | null>(null);
  const [cinema, setCinema] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [transition, setTransition] = useState<'idle' | 'out' | 'kickoff'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const choosePractice = (choice: string) => {
    if (cinema || practice || transition !== 'idle') return;
    setCinema(choice);
    timer.current = setTimeout(() => { setPractice(choice); setCinema(null); }, reducedMotion() ? 0 : 2100);
  };
  const changeStep = (next: number) => {
    if (transition !== 'idle' || cinema) return;
    setTransition('out');
    timer.current = setTimeout(() => { setStep(next); setPractice(null); setTransition('idle'); }, reducedMotion() ? 0 : 180);
  };
  const start = () => {
    if (transition !== 'idle' || cards.length < 5) return;
    setTransition('kickoff');
    timer.current = setTimeout(async()=>{try{await onStart();}finally{setTransition('idle');}}, reducedMotion() ? 0 : 850);
  };
  const titles = ['¡Te queda una!', '¡Ahora defendé!', '¡Tu equipo está listo!'];
  const detail = selected === null || !cards[selected] ? null : getCardData(cards[selected]);
  return <section className={`match-tutorial mt-cinematic mt-state--${transition}`} aria-label="Tutorial del partido" aria-busy={transition !== 'idle' || !!cinema}>
    <div className="mt-atmosphere" aria-hidden="true"><i /><i /><i /></div>
    {transition === 'kickoff' && <div className="mt-kickoff" role="status"><span>LUPI WORLD</span><strong>A LA CANCHA</strong><small>Tu historia sigue en juego</small></div>}
    <header><span>ANTES DE JUGAR</span><span>{step + 1} / 3</span></header>
    <div className="mt-dots" aria-hidden="true">{titles.map((title, i) => <i key={title} className={i === step ? 'active' : ''} />)}</div>
    <div className="mt-content" aria-live="polite">
      <div className={`mt-manga-scene mt-integrated-panel mt-manga-scene--${step}`}>
        <div className="mt-manga-traces" aria-hidden="true"/>
        {userId && <div className="mt-coach-user"><OwnedCardPortrait userId={userId}/><span>VOS · EL PRÓXIMO PROTAGONISTA</span></div>}
        <LupiStoryPose pose={step===2?'celebrate':practice?(step===0&&practice==='shoot'?'surprised':'celebrate'):step===1?'determined':'explain'} className="mt-manga-lupi"/>
        <div key={`${step}:${practice ?? "ready"}`} className="mt-manga-speech"><small>LUPI · TU ENTRENADOR</small><h1>{titles[step]}</h1><p>{step===0?'Recibís cerca del arco. El arquero sale a achicar.':step===1?'El rival viene por el medio. Tu compañero cubre el pase.':'Cinco cartas. Un equipo. Ahora empieza tu partido.'}</p></div>
        <div className="mt-panel-objective"><strong>{step < 2 ? "TU MISIÓN" : "A LA CANCHA"}</strong><span>{step < 2 ? "Completá la prueba. No necesitás ganar para avanzar." : "Revisá tu quinteto y preparate para jugar."}</span></div>
        <span className="mt-manga-sfx" aria-hidden="true">{step===0?'¡TUM!':step===1?'¡AHORA!':'¡VAMOS!'}</span>
      </div>
      {step < 2 ? <>
        <div className={`mt-practice-court ${practice?'has-choice':''}`} data-choice={practice} key={step} aria-label="Cancha de práctica">
          <div className="mt-practice-goal"/><span className="mt-practice-keeper">🧤</span><span className="mt-practice-player">{step===0?'⚡':'🛡'}</span><span className="mt-practice-ball">⚽</span><span className="mt-practice-partner">↗</span>
          <div className="mt-match-player" aria-hidden="true">{userId ? <OwnedCardPortrait userId={userId}/> : <span>⚡</span>}</div>
          <span className="mt-court-caption">{step === 0 ? 'ATAQUE · ÚLTIMA JUGADA' : 'DEFENSA · CERRÁ EL CAMINO'}</span>
          {cinema && <div key={cinema} className={`mt-play-cinema mt-play-cinema--${cinema}`} aria-label="Jugada en curso">
            <div className="mt-play-cinema__lines" aria-hidden="true"/>
            <strong className="mt-play-cinema__call">{({shoot:'¡REMATÁ!',pass:'¡PASE AL COMPAÑERO!',press:'¡SALÍ A MARCAR!',cover:'¡CUBRÍ EL ARCO!'} as Record<string,string>)[cinema]}</strong>
            <div className="mt-play-cinema__player" aria-hidden="true">{userId ? <OwnedCardPortrait userId={userId}/> : <LupiStoryPose pose="determined"/>}</div>
            <span className="mt-play-cinema__ball" aria-hidden="true">⚽</span><span className="mt-play-cinema__rival" aria-hidden="true">{cinema === 'shoot' ? '🧤' : cinema === 'pass' ? '↗' : '⚡'}</span>
            <strong className="mt-play-cinema__result">{({shoot:'¡EL ARQUERO LA SACÓ!',pass:'¡LA JUGADA SIGUE!',press:'¡RECUPERASTE LA PELOTA!',cover:'¡CERRASTE EL CAMINO!'} as Record<string,string>)[cinema]}</strong>
          </div>}
          <small>PRÁCTICA · SIN PREMIOS NI PENALIZACIÓN</small>
        </div>
        <div className="mt-practice-choices">{(step===0?[['shoot','REMATAR','Buscá el hueco'],['pass','DAR EL PASE','Jugá con tu compañero']]:[['press','SALIR A MARCAR','Achicá el espacio'],['cover','CUBRIR EL ARCO','Protegé la zona']]).map(([id,label,hint])=><button type="button" key={id} disabled={!!practice || !!cinema || transition!=='idle'} aria-pressed={practice===id} onClick={()=>choosePractice(id)}><strong>{label}</strong><small>{hint}</small></button>)}</div>
        <div className="mt-practice-feedback" role="status">{cinema ? <><strong>JUGADA EN CURSO…</strong><p>Mirá cómo se resuelve tu decisión.</p></> : practice?<><strong>{step===0?(practice==='pass'?'¡LA JUGADA SIGUE!':'¡EL ARQUERO LA SACÓ!'):(practice==='press'?'¡RECUPERASTE LA PELOTA!':'¡CERRASTE EL CAMINO!')}</strong><p>{step===0?'Elegiste cómo atacar. En el partido, la carta y la situación influyen en el resultado.':'Ya probaste ataque y defensa. Durante el partido elegís cuando aparece un momento clave.'}</p></>:<><strong>LUPI · TU DT</strong><p>Tocá una jugada y mirá qué pasa.</p></>}</div>
      </> : <>
        <p className="mt-lineup-subtitle">TU QUINTETO · VS {opponent}</p>
        <div className="mt-lineup">{cards.slice(0, 5).map((card, i) => {
          const player = getCardData(card);
          return <div className="mt-lineup-slot" key={card.id || i} style={{'--card-order': i} as CSSProperties}>
            <button className="mt-card-button" type="button" aria-expanded={selected === i} aria-label={`Ver estadísticas de ${player.name || 'Jugador'}`} onClick={() => setSelected(selected === i ? null : i)}>
              {card.card ? <CardFace item={card} index={i} variant="lineup" portrait={userId&&card.socio_id===userId?<OwnedCardPortrait userId={userId}/>:undefined} /> : <span className="mt-example"><strong>{player.name || 'Jugador'}</strong><small>Datos de carta no disponibles</small></span>}
              <span className="mt-card-hint">VER STATS ↗</span>
            </button>
            <span className="mt-role">{['ARQUERO', 'CIERRE', 'ALA IZQ.', 'ALA DER.', 'PÍVOT'][i]}</span>
          </div>;
        })}</div>
        {detail && <section className="mt-player-detail" aria-live="polite"><strong>{detail.name}</strong><div>{([['Ritmo','pace'],['Regate','dribbling'],['Pase','passing'],['Defensa','defending'],['Remate','finishing'],['Físico','physical']] as const).map(([label,key]) => <span key={key}>{label}<b>{detail[key] ?? 50}</b></span>)}</div><button type="button" onClick={() => setSelected(null)}>Cerrar estadísticas</button></section>}
        <div className="mt-dt"><span aria-hidden="true">✦</span><p><strong>LUPI · TU DT</strong>Tocá una carta para conocer sus habilidades. Cuando estés listo, ¡a la cancha!</p></div>
        {cards.length < 5 && <p role="status">Necesitás 5 cartas para jugar.</p>}
        <button className="mt-team-button" type="button" onClick={onTeam} disabled={!onTeam || transition !== 'idle'}>Revisar mi equipo →</button>
      </>}
    </div>
    <footer>{step > 0 && <button type="button" className="mt-back" disabled={transition !== 'idle' || !!cinema} onClick={() => changeStep(step - 1)}>Atrás</button>}<button type="button" className="mt-next" disabled={transition !== 'idle' || !!cinema || (step === 2 && cards.length < 5) || (step < 2 && !practice)} onClick={() => { if (step < 2) changeStep(step + 1); else start(); }}>{step === 2 ? 'Jugar partido →' : practice ? (step===0?'Ahora defendé →':'Presentá tu equipo →') : 'Elegí una jugada arriba'}</button></footer>
  </section>;
}
