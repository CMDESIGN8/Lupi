import { useEffect, useState } from 'react';
import { HAIR_FIT, HAIR_FIT_EVENT, HAIR_FIT_STORAGE, getHairFit, type HairFit } from './hairFit';

/** Panel exclusivo de desarrollo: se muestra con ?hairDebug=1 */
export function HairCalibrator() {
  const [enabled,setEnabled]=useState(false);
  const [hair,setHair]=useState('coleta');
  const [fit,setFit]=useState<HairFit>(()=>getHairFit('coleta'));
  useEffect(()=>{setEnabled(new URLSearchParams(window.location.search).get('hairDebug')==='1');},[]);
  useEffect(()=>{setFit(getHairFit(hair));},[hair]);
  if(!enabled)return null;
  const change=(key:keyof HairFit,value:number)=>{
    const next={...fit,[key]:value};setFit(next);
    try {
      const saved=JSON.parse(localStorage.getItem(HAIR_FIT_STORAGE)||'{}');
      localStorage.setItem(HAIR_FIT_STORAGE,JSON.stringify({...saved,[hair]:next}));
    }catch{ /* private browsing */ }
    window.dispatchEvent(new CustomEvent(HAIR_FIT_EVENT,{detail:{hair,fit:next}}));
  };
  const reset=()=>{
    const next=HAIR_FIT[hair];
    try {const saved=JSON.parse(localStorage.getItem(HAIR_FIT_STORAGE)||'{}');delete saved[hair];localStorage.setItem(HAIR_FIT_STORAGE,JSON.stringify(saved));}catch{}
    setFit(next);window.dispatchEvent(new CustomEvent(HAIR_FIT_EVENT,{detail:{hair,fit:next}}));
  };
  const copy=()=>{
    const values=Object.fromEntries(Object.keys(HAIR_FIT).map(k=>[k,getHairFit(k)]));
    void navigator.clipboard.writeText(`export const HAIR_FIT = ${JSON.stringify(values,null,2)};`);
  };
  return <aside style={{position:'fixed',right:12,bottom:12,zIndex:99999,width:285,maxHeight:'85vh',overflowY:'auto',background:'#071b2b',color:'#fff',border:'1px solid #2dbed7',borderRadius:12,padding:16,boxShadow:'0 8px 30px #0009',fontFamily:'system-ui'}}>
    <strong>✦ LUPI — Calibrador V12</strong>
    <p style={{fontSize:12,opacity:.75}}>Elegí el mismo peinado en el editor para ver los cambios en vivo.</p>
    <select aria-label="Peinado a calibrar" value={hair} onChange={e=>setHair(e.target.value)} style={{width:'100%',padding:8,marginBottom:8}}>
      {Object.keys(HAIR_FIT).map(id=><option key={id} value={id}>{id}</option>)}
    </select>
    {([['x','Horizontal',-40,40],['y','Vertical',-65,20],['width','Ancho',60,180],['height','Alto',20,160]] as const).map(([key,label,min,max])=><label key={key} style={{display:'block',margin:'10px 0'}}>
      <span style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span>{label}</span><b>{fit[key]}%</b></span>
      <input aria-label={label} type="range" min={min} max={max} step={1} value={fit[key]} onChange={e=>change(key,Number(e.target.value))} style={{width:'100%'}}/>
    </label>)}
    <div style={{display:'flex',gap:8}}>
      <button type="button" onClick={reset} style={{flex:1,padding:8}}>Restablecer</button>
      <button type="button" onClick={copy} style={{flex:1,padding:8}}>Copiar ajustes</button>
    </div>
    <small style={{display:'block',marginTop:8,opacity:.7}}>Se guardan en este navegador. Para publicarlos, copiá los valores a hairFit.ts.</small>
  </aside>;
}
