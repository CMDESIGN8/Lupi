import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { UserCard } from '../types/cards';
import { getCardData } from '../utils/battleEngine';
import { CardFace } from './SigningWelcome';
import './MatchTutorial.css';

type Props = { cards: UserCard[]; opponent: string; onTeam?: () => void; onStart: () => void };
export function MatchTutorial({ cards, opponent, onTeam, onStart }: Props) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [transition, setTransition] = useState<'idle' | 'out' | 'kickoff'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const changeStep = (next: number) => {
    if (transition !== 'idle') return;
    setTransition('out');
    timer.current = setTimeout(() => { setStep(next); setTransition('idle'); }, reducedMotion() ? 0 : 180);
  };
  const start = () => {
    if (transition !== 'idle' || cards.length < 5) return;
    setTransition('kickoff');
    timer.current = setTimeout(onStart, reducedMotion() ? 0 : 850);
  };
  const titles = ['Vos decidís la jugada', 'No necesitás ganar', '¡Tu equipo está listo!'];
  const detail = selected === null || !cards[selected] ? null : getCardData(cards[selected]);
  return <section className={`match-tutorial mt-cinematic mt-state--${transition}`} aria-label="Tutorial del partido" aria-busy={transition !== 'idle'}>
    <div className="mt-atmosphere" aria-hidden="true"><i /><i /><i /></div>
    {transition === 'kickoff' && <div className="mt-kickoff" role="status"><span>LUPI WORLD</span><strong>A LA CANCHA</strong><small>Tu historia sigue en juego</small></div>}
    <header><span>ANTES DE JUGAR</span><span>{step + 1} / 3</span></header>
    <div className="mt-dots" aria-hidden="true">{titles.map((title, i) => <i key={title} className={i === step ? 'active' : ''} />)}</div>
    <div className="mt-content" key={step} aria-live="polite">
      <h1>{titles[step]}</h1>
      {step === 0 ? <>
        <div className="mt-symbol" aria-hidden="true">⚡</div>
        <p>En los momentos clave aparecen opciones. Elegí cómo resolver cada jugada antes de que termine el tiempo.</p>
        <div className="mt-example"><span>EJEMPLO DE JUGADA</span><strong>¿Rematás o buscás un pase?</strong><small>Durante el encuentro vas a elegir tocando una opción.</small></div>
      </> : step === 1 ? <>
        <div className="mt-symbol" aria-hidden="true">⚽</div>
        <p>Para completar tu primera misión, llegá al final del encuentro. El resultado no importa.</p>
        <div className="mt-example"><strong>Cada decisión es una oportunidad</strong><small>Probá, aprendé y después reclamá la recompensa de tu misión.</small></div>
      </> : <>
        <p className="mt-lineup-subtitle">TU QUINTETO · VS {opponent}</p>
        <div className="mt-lineup">{cards.slice(0, 5).map((card, i) => {
          const player = getCardData(card);
          return <div className="mt-lineup-slot" key={card.id || i} style={{'--card-order': i} as CSSProperties}>
            <button className="mt-card-button" type="button" aria-expanded={selected === i} aria-label={`Ver estadísticas de ${player.name || 'Jugador'}`} onClick={() => setSelected(selected === i ? null : i)}>
              <CardFace item={card.card ? card : { ...card, card: player } as UserCard} index={i} variant="lineup" />
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
    <footer>{step > 0 && <button type="button" className="mt-back" disabled={transition !== 'idle'} onClick={() => changeStep(step - 1)}>Atrás</button>}<button type="button" className="mt-next" disabled={transition !== 'idle' || (step === 2 && cards.length < 5)} onClick={() => { if (step < 2) changeStep(step + 1); else start(); }}>{step === 2 ? 'Jugar partido →' : 'Continuar →'}</button></footer>
  </section>;
}
