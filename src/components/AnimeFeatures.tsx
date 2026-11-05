import { useId } from 'react';
import './AnimeFeatures.css';

type FeatureProps = { shape: string; expression?: string };
const browPaths: Record<string, string> = {
  natural: 'M3 20 Q17 7 40 13 L43 17 Q22 13 3 20Z',
  straight: 'M3 14 42 12 43 17 12 18Z',
  arched: 'M3 22 Q18 1 39 11 L43 17 Q20 7 3 22Z',
  bold: 'M2 16 13 9 Q28 6 43 13 L41 21 Q23 13 2 22 L8 17Z',
};
export function AnimeBrows({ shape, expression = 'neutral' }: FeatureProps) {
  const id = useId().replace(/:/g, '');
  const path = browPaths[shape] ?? browPaths.natural;
  const brow = <><path d={path} fill={`url(#${id}brow)`}/><path className="af-brows__grain" d="m13 13 3-2m5 1 3-1m5 1 3 1"/><path className="af-brows__edge" d="M12 20q13-5 25-2"/></>;
  return <svg preserveAspectRatio="none" className={`af-brows af-brows--${expression}`} viewBox="0 0 100 30" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`${id}brow`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--lw-hair)"/><stop offset="1" stopColor="#29202c"/></linearGradient></defs><g className="af-brows__left">{brow}</g>
    <g transform="translate(100 0) scale(-1 1)"><g className="af-brows__right">{brow}</g></g>
  </svg>;
}
export function AnimeNose({ shape }: FeatureProps) {
  const id = useId().replace(/:/g, '');
  const small = shape === 'small';
  const round = shape === 'round';
  const defined = shape === 'defined';
  return <svg preserveAspectRatio="none" className={`af-nose af-nose--${shape}`} viewBox="0 0 40 50" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={`${id}volume`} cx="65%" cy="58%" r="60%"><stop stopColor="#76452e" stopOpacity={defined ? '.32' : '.22'}/><stop offset=".65" stopColor="#76452e" stopOpacity=".09"/><stop offset="1" stopColor="#76452e" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}light`}><stop stopColor="#ffe8cb" stopOpacity=".46"/><stop offset="1" stopColor="#ffe8cb" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse className="af-nose__volume" cx="22" cy={defined ? 25 : 30} rx={small ? 8 : round ? 15 : 11} ry={defined ? 20 : small ? 10 : 15} fill={`url(#${id}volume)`}/>
    <ellipse className="af-nose__volume" cx="17" cy="27" rx={small ? 4 : 7} ry={defined ? 15 : 9} fill={`url(#${id}light)`}/>
    {defined && <path className="af-nose__bridge" d="M23 14q-4 10-4 15"/>}
    <path className="af-nose__tip" d={small ? 'M19 34q3 2 6 0' : round ? 'M14 34q7 7 14 0' : 'M17 35q5 4 10-1'}/>
    <path className="af-nose__nostril" d={small ? 'm25 34 1-1' : round ? 'm12 35 2-1m14 0 2 1' : 'm27 34 2-1'}/>
  </svg>;
}
export function AnimeMouth({ shape, expression = 'neutral' }: FeatureProps) {
  const id = `mouth-${useId().replace(/:/g, '')}`;
  const width = shape === 'small' ? .7 : shape === 'wide' ? 1.17 : 1;
  const sad = expression === 'sad' || expression === 'worried';
  const open = ['happy', 'wink', 'laugh', 'angry', 'surprised'].includes(expression);
  const mouth = expression === 'surprised' ? 'M40 8C31 14 34 37 50 38C66 37 69 14 60 8Q50 1 40 8Z'
    : expression === 'angry' ? 'M17 22Q50 6 83 22L80 32Q50 27 20 32Z'
    : expression === 'laugh' ? 'M13 8Q50 14 87 8C82 49 18 49 13 8Z'
    : expression === 'wink' ? 'M20 16Q52 20 83 9Q79 38 53 36Q31 35 20 16Z'
    : 'M17 12Q50 19 83 12Q77 37 50 37T17 12Z';
  const seam = sad ? 'M23 26Q49 14 77 26'
    : expression === 'smile' ? 'M19 17Q49 33 81 16'
    : expression === 'determined' ? 'M22 23Q45 25 60 20L79 17'
    : expression === 'focused' ? 'M22 22Q50 21 78 22'
    : shape === 'full' ? 'M20 22Q35 20 45 22Q50 24 56 22Q68 20 80 22'
    : 'M23 22Q50 24 77 22';
  return <svg preserveAspectRatio="none" className={`af-mouth af-mouth--${expression}`} viewBox="0 0 100 42" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-inside`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#321c30"/><stop offset="1" stopColor="#903c55"/></linearGradient>
      <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#94545b" stopOpacity=".26"/><stop offset="1" stopColor="#d98b87" stopOpacity=".12"/></linearGradient>
      <clipPath id={`${id}-clip`}><path d={mouth}/></clipPath>
    </defs>
    <g transform={`translate(50 0) scale(${width} 1) translate(-50 0)`}>
      {open ? <>
        <path d={mouth} fill={`url(#${id}-inside)`} stroke="#53283a" strokeWidth="1.8"/>
        <g clipPath={`url(#${id}-clip)`}>
          {expression !== 'surprised' && <><path className="af-mouth__teeth" d={expression === 'angry' ? 'M13 22Q50 0 87 22L84 29Q50 21 16 29Z' : 'M10 5H90L82 22Q50 26 18 19Z'}/><path d="M22 20Q51 27 78 20" fill="none" stroke="#ab7885" strokeWidth=".8" strokeOpacity=".55"/></>}
          {expression !== 'angry' && <><ellipse className="af-mouth__tongue" cx="52" cy="39" rx="22" ry="12"/><path d="M36 33Q51 28 67 33" fill="none" stroke="#ffb3bd" strokeWidth="1.4" strokeOpacity=".7"/></>}
        </g>
      </> : <>
        {shape === 'full' && <path d="M20 22Q34 15 44 19Q50 23 56 19Q68 15 80 22Q68 33 50 32Q32 33 20 22Z" fill={`url(#${id}-lip)`} stroke="none"/>}
        <path d={seam} fill="none" stroke="#663943" strokeWidth={shape === 'small' ? 2 : 1.8} strokeLinecap="round"/>
        {expression === 'smile' && <path d="M29 25Q50 34 70 25" fill="none" stroke="#fff0d3" strokeOpacity=".3" strokeWidth="1.2"/>}
        {shape === 'full' && <path d="M37 29Q50 32 63 29" fill="none" stroke="#f2b6a4" strokeOpacity=".4" strokeWidth="1.4"/>}
      </>}
      <path d={open ? 'M40 41Q50 43 60 41' : 'M42 34Q50 36 58 34'} fill="none" stroke="#704539" strokeOpacity=".16" strokeWidth="1.1" strokeLinecap="round"/>
    </g>
  </svg>;
}
