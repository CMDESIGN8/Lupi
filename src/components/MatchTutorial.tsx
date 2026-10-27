import { useState } from 'react';
import type { UserCard } from '../types/cards';
import { getCardData } from '../utils/battleEngine';
import './MatchTutorial.css';

type Props = { cards: UserCard[]; opponent: string; onTeam?: () => void; onStart: () => void };
export function MatchTutorial({ cards, opponent, onTeam, onStart }: Props) {
  const [step, setStep] = useState(0);
  const titles = ['Este es tu quinteto', 'Vos decidís la jugada', '¿Listo para debutar?'];
  return <section className="match-tutorial" aria-label="Tutorial del partido">
    <header><span>ANTES DE JUGAR</span><span>{step + 1} / 3</span></header>
    <div className="mt-dots" aria-hidden="true">{titles.map((title, i) => <i key={title} className={i === step ? 'active' : ''} />)}</div>
    <div className="mt-content" key={step}>
      <h1>{titles[step]}</h1>
      {step === 0 ? <>
        <p>Estas cartas forman tu equipo. Podés cambiarlo antes de jugar.</p>
        <div className="mt-team">{cards.slice(0, 5).map((card, i) => { const player = getCardData(card); return <article key={card.id || i}><span className="mt-shirt" aria-hidden="true">👕</span><div><strong>{player.name || 'Jugador'}</strong><small>{player.position || 'Equipo inicial'}</small></div><b>{player.overall_rating || 50}<small>OVR</small></b></article>; })}</div>
        {cards.length < 5 && <p role="status">Necesitás 5 cartas para jugar. Agregalas desde «Ver mi equipo».</p>}
        <button className="mt-team-button" type="button" onClick={onTeam} disabled={!onTeam}>Ver mi equipo →</button>
      </> : step === 1 ? <>
        <div className="mt-symbol" aria-hidden="true">⚡</div>
        <p>En los momentos clave aparecen opciones. Elegí cómo resolver cada jugada antes de que termine el tiempo.</p>
        <div className="mt-example"><span>EJEMPLO DE JUGADA</span><strong>¿Rematás o buscás un pase?</strong><small>Durante el encuentro vas a elegir tocando una opción.</small></div>
      </> : <>
        <div className="mt-symbol" aria-hidden="true">⚽</div>
        <p>Tu rival de práctica es <strong>{opponent}</strong>.</p>
        <div className="mt-example"><strong>Tu objetivo: llegar al final</strong><small>No necesitás ganar para completar la misión de tu primer partido.</small></div>
        <p>El partido empieza cuando tocás el botón de abajo.</p>
      </>}
    </div>
    <footer>{step > 0 && <button type="button" className="mt-back" onClick={() => setStep(step - 1)}>Atrás</button>}<button type="button" className="mt-next" disabled={step === 2 && cards.length < 5} onClick={() => { if (step < 2) setStep(step + 1); else onStart(); }}>{step === 2 ? 'Jugar partido →' : 'Continuar →'}</button></footer>
  </section>;
}
