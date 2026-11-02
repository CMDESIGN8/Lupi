import './DuelResultEffects.css';
export type ResultMood = 'win' | 'draw' | 'loss';
/** Decorative only: never delays actions, changes scores, or intercepts a tap. */
export function DuelResultEffects({outcome}:{outcome:ResultMood}) {
 return <div className={`duel-result-fx duel-result-fx--${outcome}`} aria-hidden="true">
  <div className="duel-result-fx__aura"/><div className="duel-result-fx__ring"/><div className="duel-result-fx__ring duel-result-fx__ring--second"/>
  <div className="duel-result-fx__streaks"/>
  {Array.from({length:24},(_,i)=><i className="duel-result-fx__particle" key={i} style={{left:`${(i*37+11)%100}%`,top:`${(i*23+5)%55}%`,animationDelay:`${.12+(i%8)*.09}s`,'--drift':`${(i%2?1:-1)*(20+i*3)}px`,'--turn':`${120+i*31}deg`} as React.CSSProperties}/>)}
 </div>;
}
