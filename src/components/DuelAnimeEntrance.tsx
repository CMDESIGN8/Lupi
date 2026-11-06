import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './DuelAnimeEntrance.css';

export function DuelAnimeEntrance({ game, leftName, rightName, leftAvatar, rightAvatar, leftLine, rightLine, onDone }: {
  game: string; leftName: string; rightName: string; leftAvatar: ReactNode; rightAvatar: ReactNode;
  leftLine: string; rightLine: string; onDone: () => void;
}) {
  const onDoneRef=useRef(onDone);onDoneRef.current=onDone;
  useEffect(() => { const timer = window.setTimeout(() => onDoneRef.current(), 3400); return () => window.clearTimeout(timer); }, []);
  return createPortal(<div className="duel-anime-entrance" role="dialog" aria-modal="true" aria-label={`Presentación del duelo de ${game}`}>
    <div className="duel-anime-entrance__rays" aria-hidden="true" />
    <div className="duel-anime-entrance__kicker">LUPI WORLD · ARENA SOCIAL <span>{game}</span></div>
    <div className="duel-anime-entrance__stage">
      <article className="duel-anime-entrance__fighter duel-anime-entrance__fighter--left"><small>EL DESAFÍO ES TUYO</small><div className="duel-anime-entrance__body">{leftAvatar}</div><strong>{leftName}</strong><div className="duel-anime-entrance__speech"><b>⚡ {leftName}</b><span>{leftLine}</span></div></article>
      <div className="duel-anime-entrance__vs"><b>VS</b><strong>¡QUE EMPIECE EL DUELO!</strong></div>
      <article className="duel-anime-entrance__fighter duel-anime-entrance__fighter--right"><small>EL RIVAL ENTRA A LA ARENA</small><div className="duel-anime-entrance__body">{rightAvatar}</div><strong>{rightName}</strong><div className="duel-anime-entrance__speech"><b>✦ {rightName}</b><span>{rightLine}</span></div></article>
    </div>
    <div className="duel-anime-entrance__caption">UN DESAFÍO · UNA ARENA · ¡QUE GANE EL MEJOR!</div>
    <button type="button" onClick={onDone}>ENTRAR AL DUELO →</button>
  </div>, document.body);
}
