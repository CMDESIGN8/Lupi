import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './DuelAnimeEntrance.css';

export function DuelAnimeEntrance({ game, leftName, rightName, leftAvatar, rightAvatar, leftLine, rightLine, onDone }: {
  game: string; leftName: string; rightName: string; leftAvatar: ReactNode; rightAvatar: ReactNode;
  leftLine: string; rightLine: string; onDone: () => void;
}) {
  const stageRef=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const stage=stageRef.current;if(!stage)return;
    const bodies=Array.from(stage.querySelectorAll<HTMLElement>('.duel-anime-entrance__body'));
    const fit=()=>bodies.forEach(body=>{const scale=Math.min(body.clientWidth/300,body.clientHeight/520)*.94;body.style.setProperty('--entrance-rig-scale',String(Math.max(.1,scale)));});
    fit();if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);}
    const observer=new ResizeObserver(fit);bodies.forEach(body=>observer.observe(body));return()=>observer.disconnect();
  },[]);
  const onDoneRef=useRef(onDone);onDoneRef.current=onDone;
  useEffect(() => { const timer = window.setTimeout(() => onDoneRef.current(), 3400); return () => window.clearTimeout(timer); }, []);
  return createPortal(<div className="duel-anime-entrance" role="dialog" aria-modal="true" aria-label={`Presentación del duelo de ${game}`}>
    <div className="duel-anime-entrance__rays" aria-hidden="true" />
    <div className="duel-anime-entrance__kicker">LUPI WORLD · ARENA SOCIAL <span>{game}</span></div>
    <div className="duel-anime-entrance__stage" ref={stageRef}>
      <article className="duel-anime-entrance__fighter duel-anime-entrance__fighter--left"><small>EL DESAFÍO ES TUYO</small><div className="duel-anime-entrance__body">{leftAvatar}</div><strong>{leftName}</strong><div className="duel-anime-entrance__speech"><b>⚡ {leftName}</b><span>{leftLine}</span></div></article>
      <div className="duel-anime-entrance__vs"><b>VS</b><strong>¡QUE EMPIECE EL DUELO!</strong></div>
      <article className="duel-anime-entrance__fighter duel-anime-entrance__fighter--right"><small>EL RIVAL ENTRA A LA ARENA</small><div className="duel-anime-entrance__body">{rightAvatar}</div><strong>{rightName}</strong><div className="duel-anime-entrance__speech"><b>✦ {rightName}</b><span>{rightLine}</span></div></article>
    </div>
    <div className="duel-anime-entrance__caption">UN DESAFÍO · UNA ARENA · ¡QUE GANE EL MEJOR!</div>
    <button type="button" onClick={onDone}>ENTRAR AL DUELO →</button>
  </div>, document.body);
}
