import { useId } from 'react';

type Props={shape:string;color:string;expression:string};
const designs={
 classic:{outline:'M5 35 Q20 10 48 16 Q64 19 75 33 Q57 53 35 53 Q16 52 5 35Z',upper:'M4 35 Q20 10 48 16 Q64 19 76 33',lower:'M10 40 Q34 61 66 42',lash:'M8 32 L1 24 L14 27 M17 22 L11 13 L25 18',crease:'M15 14 Q39 2 64 17',cx:40,cy:33,rx:17,ry:24},
 competitive:{outline:'M5 23 Q34 19 75 34 Q56 49 34 46 Q16 43 5 23Z',upper:'M4 22 Q34 19 77 34',lower:'M14 37 Q39 53 66 39',lash:'M7 23 L0 15 L18 22',crease:'M14 13 Q40 13 66 25',cx:41,cy:32,rx:15,ry:22},
 gentle:{outline:'M5 36 Q12 11 40 11 Q65 10 75 33 Q65 58 39 58 Q15 56 5 36Z',upper:'M4 36 Q12 10 40 10 Q65 9 76 33',lower:'M13 46 Q39 68 67 44',lash:'M8 28 L0 19 L13 23 M18 17 L13 7 L27 13 M30 12 L29 3 L38 10',crease:'M14 8 Q40 -3 65 13',cx:40,cy:34,rx:19,ry:27},
 calm:{outline:'M5 27 Q36 19 75 30 Q60 51 37 51 Q16 49 5 27Z',upper:'M4 27 Q36 19 77 30',lower:'M12 38 Q39 58 67 39',lash:'M7 27 L1 19 L16 24',crease:'M16 15 Q41 10 65 20',cx:40,cy:31,rx:16,ry:24},
};
export function AnimeEyes({shape,color,expression}:Props){
 const id=useId().replace(/:/g,'');
 const kind=shape==='anime-competitive'||shape==='sharp'||shape==='focused'||shape==='almond'?'competitive':shape==='anime-gentle'||shape==='large'||shape==='soft'?'gentle':shape==='anime-calm'||shape==='relaxed'?'calm':'classic';
 const d=designs[kind];
 const closed=expression==='happy'||expression==='laugh';
 const fierce=expression==='angry'||expression==='focused'||expression==='determined';
 const surprise=expression==='surprised';
 const rays=Array.from({length:18},(_,i)=>{const angle=i*Math.PI/9;return <path key={i} d={`M${d.cx+Math.cos(angle)*8} ${d.cy+Math.sin(angle)*12} L${d.cx+Math.cos(angle)*(d.rx-2)} ${d.cy+Math.sin(angle)*(d.ry-2)}`} stroke="#fff" strokeOpacity={i%2?.15:.3} strokeWidth=".7"/>});
 return <svg className="lw-face__anime-eyes" viewBox="0 0 200 76" preserveAspectRatio="none" aria-hidden="true" focusable="false">
 <defs><linearGradient id={`${id}iris`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#101c35"/><stop offset=".42" stopColor={color}/><stop offset=".77" stopColor={color}/><stop offset="1" stopColor="#d7f4de"/></linearGradient><linearGradient id={`${id}shadow`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#192335" stopOpacity=".5"/><stop offset=".6" stopColor="#192335" stopOpacity="0"/></linearGradient><clipPath id={`${id}clip`}><path d={d.outline}/></clipPath></defs>
 {[0,1].map(side=><g key={side} transform={side?'translate(192 5) scale(-1 1)':'translate(8 5)'}>
 {(closed||(expression==='wink'&&side===1))?<><path d="M8 38 Q38 14 73 36" fill="none" stroke="#29212d" strokeWidth="4" strokeLinecap="round"/><path d="M8 36 L2 30 M15 29 L10 22" stroke="#29212d" strokeWidth="2.5" strokeLinecap="round"/></>:<g transform={fierce?kind==='competitive'?'translate(0 6) scale(1 .88)':'translate(0 2) scale(1 .96)':surprise?'translate(0 -2) scale(1 1.08)':undefined}>
 <path d={d.crease} fill="none" stroke="#6f4140" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round"/>
 <path d={d.outline} fill="#fff9f2" stroke="#63444a" strokeWidth="1.2"/>
 <g clipPath={`url(#${id}clip)`}>
 <ellipse cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={`url(#${id}iris)`} stroke="#1e2a3d" strokeWidth="1.6"/>
 {rays}
 <ellipse cx={d.cx} cy={d.cy-1} rx="6" ry="12" fill="#101724"/>
 <path d={`M${d.cx-11} ${d.cy+12} Q${d.cx} ${d.cy+24} ${d.cx+11} ${d.cy+12}`} fill="none" stroke="#fff7c7" strokeOpacity=".6" strokeWidth="2"/>
 <path d={d.outline} fill={`url(#${id}shadow)`}/>
 <ellipse cx={d.cx-6} cy={d.cy-12} rx="5.4" ry="7" fill="#fff" transform={`rotate(24 ${d.cx-6} ${d.cy-12})`}/>
 <circle cx={d.cx+8} cy={d.cy+9} r="3" fill="#fff" fillOpacity=".9"/>
 <circle cx={d.cx-3} cy={d.cy+15} r="1.4" fill="#fff" fillOpacity=".8"/>
 </g>
 <path d={d.lower} fill="none" stroke="#6c4449" strokeWidth="1.1" strokeLinecap="round"/>
 <path d={d.upper} fill="none" stroke="#27212d" strokeWidth={kind==='gentle'?3.7:3.2} strokeLinecap="round"/>
 <path d={d.lash} fill="#27212d" stroke="#27212d" strokeWidth=".8" strokeLinejoin="round"/>
 </g>}
 </g>)}
 </svg>;
}
