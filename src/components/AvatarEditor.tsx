import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";
import { HAIRS, HAIR_COLORS, SKINS, type AvatarAppearance } from "../lib/avatarAppearance";
import { AvatarFace } from "./AvatarFace";
import { Avatar2D } from "./Avatar2D";
import { useAuraInventory } from "../hooks/useAuraInventory";
import "./AvatarEditor.css";
export function AvatarEditor({userId, onClose}: {userId:string;onClose:()=>void}) {
 const {appearance,save,saving,error} = useAvatarAppearance(userId);
 const {items} = useAuraInventory(userId, 1);
 const [previewMode,setPreviewMode] = useState<"full"|"face">("full");
 const [draft,setDraft] = useState(appearance); const [done,setDone] = useState(false);
 useEffect(()=>setDraft(appearance),[appearance]);
 const change=(key:keyof AvatarAppearance,value:string)=>{setDraft(a=>({...a,[key]:value}));setDone(false)};
 return createPortal(<div className="lw-editor-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="lw-editor" role="dialog" aria-modal="true" aria-label="Personalizar personaje">
 <header><div><small>✦ LUPI WORLD</small><h2>MI IDENTIDAD</h2></div><button onClick={onClose} aria-label="Cerrar">✕</button></header>
 <div className="lw-editor__preview lw-editor__preview--identity">
   <div className="lw-editor__preview-bar"><span>✦ VISTA PREVIA EN VIVO</span><div className="lw-editor__preview-toggle"><button type="button" className={previewMode==="full"?"active":""} onClick={()=>setPreviewMode("full")}>CUERPO</button><button type="button" className={previewMode==="face"?"active":""} onClick={()=>setPreviewMode("face")}>ROSTRO</button></div></div>
   {previewMode==="full" ? <div className="lw-editor__avatar-stage"><div className="lw-editor__avatar-scaled"><Avatar2D items={items} appearance={draft}/></div></div> : <div className="lw-editor__face-stage"><AvatarFace appearance={draft}/></div>}
   <p>Los cambios se ven antes de guardar · Ropa equipada</p>
 </div>
 <label>TONO DE PIEL</label><div className="lw-editor__swatches">{SKINS.map(v=><button key={v} className={draft.skin===v?"active":""} style={{background:v}} onClick={()=>change("skin",v)} aria-label={`Tono ${v}`}/>)}</div>
 <label>PEINADO</label><div className="lw-editor__choices">{HAIRS.map(v=><button key={v} className={draft.hair===v?"active":""} onClick={()=>change("hair",v)}>{v}</button>)}</div>
 <label>COLOR DE CABELLO</label><div className="lw-editor__swatches">{HAIR_COLORS.map(v=><button key={v} className={draft.hairColor===v?"active":""} style={{background:v}} onClick={()=>change("hairColor",v)} aria-label={`Color ${v}`}/>)}</div>
 <label>ROSTRO</label><div className="lw-editor__choices">{["oval","round","angular","long","soft","square"].map(v=><button key={v} className={draft.face===v?"active":""} onClick={()=>change("face",v)}>{v}</button>)}</div>
 <label>EXPRESIÓN</label><div className="lw-editor__choices">{[["neutral","Normal"],["smile","Sonrisa"],["focused","Competitivo"]].map(([v,l])=><button key={v} className={draft.expression===v?"active":""} onClick={()=>change("expression",v)}>{l}</button>)}</div>
 {error&&<p role="alert" className="lw-editor__error">{error}</p>}{done&&<p className="lw-editor__saved">Identidad guardada ✓</p>}
 <button className="lw-editor__save" disabled={saving} onClick={async()=>setDone(await save(draft))}>{saving?"GUARDANDO...":"GUARDAR MI PERSONAJE"}</button>
 </section></div>, document.body);
}
