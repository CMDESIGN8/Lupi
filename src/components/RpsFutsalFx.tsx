import type { CSSProperties } from 'react';
import type { BangTone, RoundResult } from '../lib/rpsFutsal';

/**
 * Capas 100 % decorativas del duelo de piedra, papel o tijera estilo anime de futsal.
 * Ninguna intercepta toques, cambia puntajes ni retrasa una acción: todo es aria-hidden y pointer-events:none.
 */
const vars = (v: Record<string, string | number>) => v as CSSProperties;

/** Cancha de fondo: líneas en perspectiva, reflectores que barren y gradas que titilan. */
export function RpsPitch() {
  return <div className="rpsf-pitch" aria-hidden="true">
    <i className="rpsf-pitch__beam rpsf-pitch__beam--a" /><i className="rpsf-pitch__beam rpsf-pitch__beam--b" /><i className="rpsf-pitch__beam rpsf-pitch__beam--c" />
    <div className="rpsf-pitch__crowd">{Array.from({ length: 22 }, (_, i) => <i key={i} style={vars({ '--x': `${(i * 47 + 9) % 100}%`, '--y': `${(i * 13) % 100}%`, '--t': `${1.4 + (i % 5) * 0.45}s`, '--d': `${(i % 7) * 0.31}s` })} />)}</div>

  </div>;
}

type ClashFxProps = { phase: 'chant' | 'reveal'; result?: RoundResult; bang?: { text: string; caption: string; tone: BangTone }; final?: boolean };

/** Dentro de .rps-clash. Se vuelve a montar (key) en cada ronda para repetir todas las animaciones. */
export function RpsClashFx({ phase, result = 'tie', bang, final }: ClashFxProps) {
  if (phase === 'chant') return <div className="rpsf-fx rpsf-fx--chant" aria-hidden="true"><i className="rpsf-speed" /><i className="rpsf-speed rpsf-speed--b" /></div>;
  const dir = result === 'win' ? 1 : result === 'lose' ? -1 : 0;
  return <div className={`rpsf-fx rpsf-fx--reveal rpsf-fx--${result}`} style={vars({ '--dir': dir })} aria-hidden="true">
    <i className="rpsf-speed" />
    <i className="rpsf-shock" /><i className="rpsf-shock rpsf-shock--2" />
    {Array.from({ length: 14 }, (_, i) => <i className="rpsf-spark" key={`s${i}`} style={vars({ '--a': `${i * (360 / 14) + (i % 2 ? 7 : -5)}deg`, '--d': `${70 + (i % 4) * 22}px`, '--w': `${i % 3 ? 3 : 5}px` })} />)}
    {result === 'win' && Array.from({ length: 16 }, (_, i) => <i className="rpsf-confetti" key={`c${i}`} style={vars({ '--x': `${6 + ((i * 29) % 88)}%`, '--delay': `${0.18 + (i % 6) * 0.07}s`, '--spin': `${200 + i * 47}deg`, '--c': ['#ffd84d', '#39e6ee', '#ffffff', '#ff7a5c'][i % 4] })} />)}
    {bang && <div className={`rpsf-bang rpsf-bang--${bang.tone} ${final ? 'is-final' : ''}`}><b>{bang.text}</b><small>{bang.caption}</small></div>}
  </div>;
}

/** Cartel que cruza la pantalla ("¡PITAZO INICIAL!", "¡RONDA DE ORO!"). Usar con key. */
export function RpsBanner({ text, tone = 'gold' }: { text: string; tone?: 'gold' | 'cyan' | 'red' }) {
  return <div className={`rpsf-banner rpsf-banner--${tone}`} aria-hidden="true"><b>{text}</b></div>;
}

/** Fotograma de impacto: destello de pantalla completa estilo anime (solo ~0,45 s). */
export function RpsImpactFrame({ result }: { result: RoundResult }) {
  return <div className={`rpsf-impact rpsf-impact--${result}`} aria-hidden="true" />;
}
