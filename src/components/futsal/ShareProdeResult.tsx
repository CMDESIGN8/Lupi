import { useState, type CSSProperties } from "react";
import stadiumBackground from "../../assets/prode-share-stadium.png";
import "./ShareProdeResult.css";
export type ShareResult = { nickname: string; league: string; round: string; points: number; position: number; exacts: number; inviteCode: string };
export function resultMessage(r: ShareResult, origin: string) {
 const url = new URL("/futsal", origin); url.searchParams.set("liga", r.inviteCode);
 return `🏆 PRODE LUPI · ${r.round}\nSoy ${r.nickname}: sumé ${r.points} puntos y terminé ${r.position}.º en ${r.league}.\n🎯 ${r.exacts} ${r.exacts === 1 ? "marcador exacto" : "marcadores exactos"}.\n¿Me ganás la próxima? Sumate a mi miniliga 👇\n${url.toString()}`;
}
let backgroundPromise: Promise<HTMLImageElement> | undefined;
function loadBackground(): Promise<HTMLImageElement> {
 if(backgroundPromise)return backgroundPromise;
 backgroundPromise=new Promise<HTMLImageElement>((resolve,reject)=>{
  const img=new Image();
  const timer=setTimeout(()=>{img.onload=null;img.onerror=null;reject(new Error("No pudimos cargar el fondo. Revisá tu conexión y probá descargar otra vez."));},8000);
  img.onload=()=>{clearTimeout(timer);resolve(img);};
  img.onerror=()=>{clearTimeout(timer);reject(new Error("No pudimos cargar el fondo. Recargá la página y probá otra vez."));};
  img.src=stadiumBackground;
 }).catch(error=>{backgroundPromise=undefined;throw error;});
 return backgroundPromise;
}
export async function resultImage(r: ShareResult): Promise<Blob> {
 const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;
 const c=canvas.getContext("2d");if(!c)throw new Error("No pudimos crear la imagen.");
 const background=await loadBackground();
 const scale=Math.max(1080/background.naturalWidth,1350/background.naturalHeight);
 const width=background.naturalWidth*scale,height=background.naturalHeight*scale;
 c.drawImage(background,(1080-width)/2,(1350-height)/2,width,height);
 const shade=c.createLinearGradient(0,0,0,1350);shade.addColorStop(0,"#00000038");shade.addColorStop(.55,"#00000026");shade.addColorStop(1,"#00000088");c.fillStyle=shade;c.fillRect(0,0,1080,1350);
 const vignette=c.createRadialGradient(540,620,230,540,675,840);vignette.addColorStop(0,"#00000000");vignette.addColorStop(1,"#00000088");c.fillStyle=vignette;c.fillRect(0,0,1080,1350);
 const halo=c.createRadialGradient(540,565,15,540,565,190);halo.addColorStop(0,"#eac45d26");halo.addColorStop(1,"#eac45d00");c.fillStyle=halo;c.fillRect(300,340,480,460);
 c.strokeStyle="#e6c56b";c.lineWidth=3;c.strokeRect(42,42,996,1266);
 c.textAlign="center";
 const line=(text:string,y:number,size:number,color="#ffffff",weight=800)=>{c.font=`${weight} ${size}px Arial, sans-serif`;while(c.measureText(text).width>870&&size>18){size--;c.font=`${weight} ${size}px Arial, sans-serif`;}c.fillStyle=color;c.shadowColor="#000000";c.shadowBlur=18;c.shadowOffsetY=4;c.fillText(text,540,y);c.shadowBlur=0;c.shadowOffsetY=0;};
 line("PRODE LUPI",140,63,"#f1d17b",900);line("MI FECHA · MI TRIBUNA",192,23,"#a6d5d2");line(r.round,275,32);line(r.nickname,365,48);line(String(r.points),650,240,"#f7d575",900);line("PUNTOS",710,38,"#f7d575");
 line(`${r.position}.º EN ${r.league}`,825,49);line(`${r.exacts} ${r.exacts===1?"MARCADOR EXACTO":"MARCADORES EXACTOS"}`,895,28,"#a6d5d2");line("¿ME GANÁS LA PRÓXIMA?",1080,43,"#f7d575");line("Sumate a mi miniliga",1140,31);line("LUPIAPP · FUTSAL ENTRE AMIGOS",1250,24,"#a6d5d2");
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("No pudimos crear la imagen.")),"image/png"));
}
export function ShareProdeResult({ result }: { result: ShareResult }) {
 const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
 const text=()=>resultMessage(result,window.location.origin);
 const download=async()=>{setBusy(true);setNotice("");try{const blob=await resultImage(result);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="mi-fecha-prode-lupi.png";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice("Imagen descargada. Podés subirla a tu estado o compartirla con tu grupo.");}catch(e){setNotice(e instanceof Error?e.message:"No pudimos crear la imagen.");}finally{setBusy(false);}};
 const share=async()=>{setBusy(true);setNotice("");try{const blob=await resultImage(result);const file=new File([blob],"mi-fecha-prode-lupi.png",{type:"image/png"});if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],text:text(),title:"Mi fecha en Prode Lupi"});}else{setNotice("Usá WhatsApp para compartir el texto y enlace, o descargá la imagen para adjuntarla.");}}catch(e){if(!(e instanceof Error&&e.name==="AbortError"))setNotice("No pudimos abrir el menú. Podés usar WhatsApp o descargar la imagen.");}finally{setBusy(false);}};
 return <section className="ps-share" aria-label="Compartir tu resultado"><div className="ps-poster ps-cinematic" style={{"--ps-background":`url("${stadiumBackground}")`,"--ps-name-size":`${Math.min(4.44,140/Math.max(1,result.nickname.length))}cqw`,"--ps-league-size":`${Math.min(4.54,140/`${result.position}.º EN ${result.league}`.length)}cqw`,"--ps-round-size":`${Math.min(2.96,140/Math.max(1,result.round.length))}cqw`} as CSSProperties}><span className="ps-brand">PRODE <b>LUPI</b></span><span className="ps-tagline">MI FECHA · MI TRIBUNA</span><span className="ps-round">{result.round}</span><strong className="ps-player">{result.nickname}</strong><div className="ps-score">{result.points}<small>PUNTOS</small></div><strong className="ps-position">{result.position}.º en {result.league}</strong><span className="ps-exacts">🎯 {result.exacts} {result.exacts===1?"marcador exacto":"marcadores exactos"}</span><span className="ps-challenge">¿ME GANÁS LA PRÓXIMA?</span><span className="ps-invitation">Sumate a mi miniliga</span><span className="ps-footer">LUPIAPP · FUTSAL ENTRE AMIGOS</span></div><div className="ps-actions"><p className="lp-micro">LLEVÁ LA COMPETENCIA A TU GRUPO</p><h4>Que tu tribuna se entere.</h4><p>Compartí tus puntos e invitá a tus amigos a jugar la próxima fecha.</p><a className="ps-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(text())}`} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp ↗</a><button type="button" disabled={busy} onClick={()=>void share()}>Compartir tarjeta →</button><button type="button" disabled={busy} onClick={()=>void download()}>{busy?"Preparando tarjeta…":"↓ Descargar imagen"}</button><p role="status">{notice}</p></div></section>;
}
