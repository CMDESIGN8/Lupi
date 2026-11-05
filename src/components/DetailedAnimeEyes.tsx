import { useId } from 'react';
import './DetailedAnimeEyes.css';

type Props = { color: string; expression: string };
const outline = 'M5 37C11 17 25 10 42 12C60 13 70 23 76 36C69 53 56 61 39 60C22 59 12 51 5 37Z';
/** Layered classic eye. Shared coordinates keep highlights, iris and lids aligned. */
export function DetailedAnimeEyes({ color, expression }: Props) {
  const id = `eye-${useId().replace(/:/g, '')}`;
  const closed = expression === 'happy' || expression === 'laugh';
  const fierce = ['focused', 'determined', 'angry'].includes(expression);
  const worried = expression === 'worried' || expression === 'sad';
  return <svg className="lw-face__anime-eyes lw-face__anime-eyes--detailed" viewBox="0 0 200 76" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={`${id}-eye`}><path d={outline}/></clipPath>
      <clipPath id={`${id}-iris`}><ellipse cx="41" cy="35" rx="21" ry="28"/></clipPath>
      <linearGradient id={`${id}-white`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9ca9bc"/><stop offset=".35" stopColor="#f6f7fc"/><stop offset=".75" stopColor="#fffdf5"/><stop offset="1" stopColor="#c9d5df"/></linearGradient>
      <linearGradient id={`${id}-iris-color`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#091427"/><stop offset=".3" stopColor={color}/><stop offset=".75" stopColor={color}/><stop offset="1" stopColor="#e7fbf1"/></linearGradient>
      <radialGradient id={`${id}-depth`} cx="50%" cy="28%" r="70%"><stop stopColor="#040c1b" stopOpacity=".55"/><stop offset=".55" stopColor="#081329" stopOpacity=".16"/><stop offset="1" stopColor="#081329" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="85%" r="60%"><stop stopColor="#e4fff8" stopOpacity=".85"/><stop offset=".5" stopColor="#d7fffb" stopOpacity=".2"/><stop offset="1" stopColor="#e4fff8" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-lid-shadow`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#101529" stopOpacity=".48"/><stop offset=".32" stopColor="#25324b" stopOpacity=".12"/><stop offset=".57" stopColor="#27324c" stopOpacity="0"/></linearGradient>
    </defs>
    {[0, 1].map(side => <g key={side} transform={side ? 'translate(192 4) scale(-1 1)' : 'translate(8 4)'}>
      {closed || (expression === 'wink' && side === 1) ? <>
        <path d="M6 39Q37 13 75 37" fill="none" stroke="#211d2b" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="m8 36-6-8m14 1-6-8" fill="none" stroke="#211d2b" strokeWidth="2" strokeLinecap="round"/>
      </> : <g transform={fierce ? 'translate(0 13) scale(1 .78)' : expression === 'surprised' ? 'translate(0 -2) scale(1 1.04)' : undefined}>
        <path d="M11 15Q37 -1 65 17" fill="none" stroke="#794a46" strokeOpacity=".4" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M8 22Q29 2 57 13" fill="none" stroke="#fff0dd" strokeOpacity=".28" strokeWidth="2"/>
        <path d={outline} fill={`url(#${id}-white)`} stroke="#5c4651" strokeWidth="1"/>
        <g clipPath={`url(#${id}-eye)`}>
          <ellipse cx="41" cy="35" rx="21" ry="28" fill={`url(#${id}-iris-color)`} stroke="#142131" strokeWidth="2.4"/>
          <g clipPath={`url(#${id}-iris)`}>
            <ellipse cx="41" cy="35" rx="19" ry="26" fill={`url(#${id}-glow)`}/>
            {Array.from({ length: 36 }, (_, i) => {
              const a = i * Math.PI / 18;
              const inner = i % 3 === 0 ? .46 : .64;
              return <path key={i} d={`M${41 + Math.cos(a) * 20 * inner} ${35 + Math.sin(a) * 27 * inner}L${41 + Math.cos(a) * 19} ${35 + Math.sin(a) * 26}`} stroke={i % 2 ? '#092333' : '#effff6'} strokeOpacity={i % 2 ? .23 : .28} strokeWidth={i % 3 ? .65 : 1}/>;
            })}
            <ellipse cx="41" cy="33" rx="19" ry="26" fill={`url(#${id}-depth)`}/>
            <ellipse cx="41" cy="32" rx="8" ry="14" fill="#050c18"/>
            <ellipse cx="41" cy="32" rx="9.5" ry="15.5" fill="none" stroke="#06152a" strokeOpacity=".5" strokeWidth="1.4"/>
            <path d="M27 46Q39 65 55 46" fill="none" stroke="#d4fff3" strokeOpacity=".65" strokeWidth="2.7" strokeLinecap="round"/>
          </g>
          <path d={outline} fill={`url(#${id}-lid-shadow)`}/>
          {/* Reflections share a world light direction, rather than mirroring it. */}
          <g transform={side ? 'translate(82 0) scale(-1 1)' : undefined}>
            <ellipse cx="32" cy="21" rx="6" ry="8" fill="#fbffff" transform="rotate(25 32 21)"/>
            <ellipse cx="33" cy="22" rx="3" ry="5" fill="#fff"/>
            <path d="M47 28q12-7 20-6" fill="none" stroke="#fff" strokeOpacity=".94" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="50" cy="49" rx="3" ry="2.5" fill="#f4fffd" fillOpacity=".9"/>
          </g>
        </g>
        <path d="M9 44Q23 64 44 62Q59 62 70 48" fill="none" stroke="#70444b" strokeOpacity=".75" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M16 53Q33 65 54 58" fill="none" stroke="#ffe7d4" strokeOpacity=".48" strokeWidth="1.3"/>
        <path d="M4 38C9 21 21 9 40 10C57 10 70 21 78 37L73 35C65 21 55 15 40 15C24 14 13 23 7 39Z" fill="#201d29"/>
        <path d="m8 31-6-6 11 3-3-8 8 6" fill="#201d29"/>
        <path d="m6 38-4 3 10 2" fill="#70454c" fillOpacity=".55"/>
        {worried && <path d="M14 49Q39 68 66 51" fill="none" stroke="#9edeea" strokeOpacity=".7" strokeWidth="1.8"/>}
      </g>}
    </g>)}
  </svg>;
}
