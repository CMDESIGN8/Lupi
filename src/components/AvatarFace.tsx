import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DEFAULT_APPEARANCE, HAIR_COLORS, HAIRS, type AvatarAppearance } from '../lib/avatarAppearance';
import { getHairFit, HAIR_FIT_EVENT, type HairFit } from './hairFit';
import './AvatarFace.css';

/** Recorta alpha transparente y recolorea sin perder sombras ni brillos. */
function HairTexture({ hair, color }: { hair: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const source = document.createElement('canvas');
      source.width = image.naturalWidth; source.height = image.naturalHeight;
      const src = source.getContext('2d', { willReadFrequently:true });
      if (!src) return;
      src.drawImage(image,0,0);
      const pixels = src.getImageData(0,0,source.width,source.height);
      let left=source.width,top=source.height,right=-1,bottom=-1;
      const data=pixels.data;
      for(let y=0;y<source.height;y++) for(let x=0;x<source.width;x++) {
        const i=(y*source.width+x)*4;
        if(data[i+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      }
      if(right<left || bottom<top) return;
      const hex=color.replace('#','');
      const normalized=hex.length===3?hex.split('').map(c=>c+c).join(''):hex;
      const rgb=[0,2,4].map(i=>parseInt(normalized.slice(i,i+2),16));
      if(!rgb.every(Number.isFinite)) return;
      for(let i=0;i<data.length;i+=4){
        if(data[i+3]===0) continue;
        const lum=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;
        const factor=Math.max(.22,Math.min(1.75,1+(lum-.5)*1.5));
        for(let c=0;c<3;c++)data[i+c]=Math.min(255,rgb[c]*factor);
      }
      src.putImageData(pixels,0,0);
      const dest=canvasRef.current;
      const w=right-left+1,h=bottom-top+1;
      dest.width=w;dest.height=h;
      dest.getContext('2d')?.drawImage(source,left,top,w,h,0,0,w,h);
    };
    image.onerror=()=>{if(!cancelled)console.warn('Lupi: no se pudo cargar',image.src);};
    image.src=`/images/avatar/hair/v8/${hair}.png`;
    return()=>{cancelled=true;image.onload=null;image.onerror=null;};
  },[hair,color]);
  return <div className="lw-face__hair"><canvas ref={canvasRef} className="lw-face__hair-canvas" aria-hidden="true" /></div>;
}

export function AvatarFace({ appearance=DEFAULT_APPEARANCE, className='' }: { appearance?:AvatarAppearance; className?:string }) {
  const hair=HAIRS.includes(appearance.hair as typeof HAIRS[number])?appearance.hair:DEFAULT_APPEARANCE.hair;
  const color=HAIR_COLORS.includes(appearance.hairColor)?appearance.hairColor:DEFAULT_APPEARANCE.hairColor;
  const [fit,setFit]=useState<HairFit>(()=>getHairFit(hair));
  useEffect(()=>{setFit(getHairFit(hair));},[hair]);
  useEffect(()=>{
    const update=(event:Event)=>{
      const detail=(event as CustomEvent<{hair:string;fit:HairFit}>).detail;
      if(detail?.hair===hair)setFit(detail.fit);
    };
    window.addEventListener(HAIR_FIT_EVENT,update);
    return()=>window.removeEventListener(HAIR_FIT_EVENT,update);
  },[hair]);
  const style={
    '--lw-skin':appearance.skin,'--lw-hair':color,
    '--hair-top':`${fit.y}%`,'--hair-x':`${fit.x}%`,
    '--hair-width':`${fit.width}%`,'--hair-height':`${fit.height}%`,
  } as CSSProperties;
  return <div className={`lw-face lw-face--hair-${hair} lw-face--${appearance.face} lw-face--eyes-${appearance.eyes ?? "normal"} lw-face--brows-${appearance.brows ?? "natural"} lw-face--nose-${appearance.nose ?? "soft"} lw-face--mouth-${appearance.mouth ?? "normal"} ${className}`} style={style} aria-label="Rostro personalizado" role="img">
    <span className="lw-face__ear lw-face__ear--left"/><span className="lw-face__ear lw-face__ear--right"/>
    <HairTexture hair={hair} color={color}/>
    <div className="lw-face__brows"><i/><i/></div>
    <div className="lw-face__eyes"><i/><i/></div><span className="lw-face__nose"/>
    <div className={`lw-face__mouth lw-face__mouth--${appearance.expression}`}/>
  </div>;
}
