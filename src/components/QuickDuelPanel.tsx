import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { QuickGame } from "../hooks/useQuickDuel";
import { duelFx } from "../lib/duelFx";
import "./QuickDuelPanel.css";

type Props = {
  /** "inline": tarjeta con los botones (va dentro de la hoja Social). "pill": estado flotante mientras buscás. */
  variant: "inline" | "pill" | "launcher" | "status";
  /** Tu racha de victorias actual (solo se muestra en la tarjeta). */
  streak?: number;
  game: QuickGame | null; seconds: number; others: number; notice: string; disabled?: boolean;
  onStart: (g: QuickGame) => void; onCancel: () => void; onDismissNotice: () => void;
};

const NAME: Record<QuickGame, string> = { rps: "✊ Piedra, papel o tijera", trivia: "🧠 Preguntados" };

export function QuickDuelPanel({ variant, streak = 0, game, seconds, others, notice, disabled, onStart, onCancel, onDismissNotice }: Props) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{if(disabled||game)setOpen(false);},[disabled,game]);
  const trigger=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const original=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
   const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
   document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);if(original?.isConnected)original.focus();};},[open]);
  const [fxOn, setFxOn] = useState(() => !duelFx.isMuted());
  if(variant==='status')return game?<section className="qd-search-status" aria-label="Búsqueda de duelo en curso"><div className="qd-search-status__head"><span className="qd-search-status__radar" aria-hidden="true"/><div><strong role="status">BUSCANDO RIVAL…</strong><small>{NAME[game]}</small></div><b role="timer" aria-live="off">{seconds}s</b></div><div className="qd-search-status__signal" aria-hidden="true"><i/></div><p>{game==='rps'?(seconds<8?'Si no aparece un rival, empezás una práctica con bot.':'Seguimos esperando la confirmación. Si no llega, abrimos una práctica.'):(others>0?'Hay jugadores buscando. Estamos intentando emparejarte.':'Buscamos a alguien que esté en esta modalidad.')}</p><button type="button" aria-label="Cancelar búsqueda" onClick={onCancel}>CANCELAR</button></section>:null;
  if(variant==='launcher')return <div className={`qd-launcher${game?' is-searching':''}`}>

<button ref={trigger} type="button" className="qd-launcher__trigger" aria-expanded={open} disabled={disabled||!!game} onClick={()=>setOpen(true)}><span aria-hidden="true">⚡</span><strong>{game?`BUSCANDO · ${seconds}s`:'DUELO RÁPIDO'}</strong></button>{open&&createPortal(<div className="qd-chooser-backdrop" onClick={()=>setOpen(false)}><div ref={dialog} className="qd-chooser" role="dialog" aria-modal="true" aria-label="Elegí tu duelo rápido" onClick={e=>e.stopPropagation()}><button className="qd-chooser__close" type="button" aria-label="Cerrar modalidades" onClick={()=>setOpen(false)}>×</button><small>ARENA GLOBAL · LUPI WORLD{streak>0?` · RACHA ${streak}`:""}</small><h2>ELEGÍ TU DUELO</h2><p>Un toque. Buscamos rival por vos.</p><button type="button" className="qd-mode qd-mode--rps" onClick={()=>{setOpen(false);onStart('rps');}}><strong>PIEDRA, PAPEL O TIJERA →</strong><small>3 rondas · Si no hay rival, práctica con bot</small></button><button type="button" className="qd-mode qd-mode--trivia" onClick={()=>{setOpen(false);onStart('trivia');}}><strong>PREGUNTADOS →</strong><small>5 preguntas · Rival real</small></button><button type="button" className="qd-card__fx" onClick={()=>{duelFx.setMuted(fxOn);setFxOn(!fxOn);}}>{fxOn?'🔊 Sonido y vibración: SÍ':'🔇 Sonido y vibración: NO'}</button></div></div>,document.body)}</div>;
  if (variant === "pill") {
    if (game) return null; // The active search stays beside its lobby action.
    if (notice) {
      return createPortal(
        <div className="qd-pill qd-pill--notice" role="status">
          <span className="qd-pill__text">{notice}</span>
          <button type="button" onClick={onDismissNotice} aria-label="Cerrar aviso">✕</button>
        </div>,
        document.body,
      );
    }
    return null;
  }
  return (
    <section className="qd-card" aria-label="Duelo rápido">
      <header><b>⚡ DUELO RÁPIDO{streak >= 1 ? ` · 🔥 RACHA ${streak}` : ""}</b><small>Rival global · PPT: práctica con bot si no hay rival</small></header>
      {game ? (
        <div className="qd-card__searching" role="status" aria-live="polite">
          <span><b>Buscando rival…</b> {NAME[game]} · {seconds}s{others > 0 ? ` · ${others} más buscando` : ""}</span>
          <button type="button" onClick={onCancel}>CANCELAR</button>
        </div>
      ) : (
        <div className="qd-card__buttons">
          <button type="button" disabled={disabled} onClick={() => onStart("rps")}>{NAME.rps}</button>
          <button type="button" disabled={disabled} onClick={() => onStart("trivia")}>{NAME.trivia}</button>
        </div>
      )}
      <button type="button" className="qd-card__fx" onClick={() => { duelFx.setMuted(fxOn); setFxOn(!fxOn); }}>{fxOn ? "🔊 Sonido y vibración: SÍ" : "🔇 Sonido y vibración: NO"}</button>
    </section>
  );
}
