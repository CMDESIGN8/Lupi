import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";
import { useAuraInventory, type ItemRarity, type ItemSlot } from "../hooks/useAuraInventory";
import { HAIRS, HAIR_COLORS, SKINS, type AvatarAppearance } from "../lib/avatarAppearance";
import { AvatarFace } from "./AvatarFace";
import { Avatar2D } from "./Avatar2D";
import "./AvatarEditor.css";

const SLOTS: {key: ItemSlot; label:string; icon:string}[] = [
  {key:"top",label:"REMERAS",icon:"👕"},
  {key:"bottom",label:"PANTALONES",icon:"🩳"},
  {key:"boots",label:"BOTINES",icon:"👟"},
  {key:"accessory",label:"ACCESORIOS",icon:"✦"},
];
const RARITIES: ("all"|ItemRarity)[] = ["all","common","rare","epic","legendary"];
const FACES = ["oval","round","angular","long","soft","square"];
const EXPRESSIONS: [string,string][] = [["neutral","Normal"],["smile","Sonrisa"],["focused","Competitivo"]];
type WardrobeTab = "wardrobe"|"inventory"|"shop";

export function AvatarEditor({userId,onClose}:{userId:string;onClose:()=>void}) {
  const {appearance,save,saving,error} = useAvatarAppearance(userId);
  const {items,loading,toggleEquip,usingFallback} = useAuraInventory(userId,1);
  const [draft,setDraft] = useState(appearance);
  const [done,setDone] = useState(false);
  const [previewMode,setPreviewMode] = useState<"full"|"face">("full");
  const [wardrobeTab,setWardrobeTab] = useState<WardrobeTab>("wardrobe");
  const [slot,setSlot] = useState<ItemSlot | "all">("all");
  const [rarity,setRarity] = useState<"all"|ItemRarity>("all");
  const [busyId,setBusyId] = useState<string|null>(null);
  useEffect(()=>setDraft(appearance),[appearance]);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[onClose]);
  const change=(key:keyof AvatarAppearance,value:string)=>{setDraft(a=>({...a,[key]:value}));setDone(false);};
  const equipped = useMemo(()=>items.filter(i=>i.equipped),[items]);
  const shown = items.filter(i=>(wardrobeTab==="inventory"?i.owned:true)&&(slot==="all"||i.slot===slot)&&(rarity==="all"||i.rarity===rarity));
  const equip = async(id:string)=>{setBusyId(id);try{await toggleEquip(id);}finally{setBusyId(null);}};
  return createPortal(
    <div className="lw-editor-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <section className="lw-editor lw-editor--aaa" role="dialog" aria-modal="true" aria-label="Personalizar personaje">
        <header className="lw-editor__header">
          <div><small>✦ LUPI WORLD</small><h2>MI IDENTIDAD</h2><p>CREÁ TU ESTILO. JUGÁ TU HISTORIA.</p></div>
          <button type="button" onClick={onClose} aria-label="Cerrar editor">✕</button>
        </header>
        <div className="lw-editor__layout">
          <aside className="lw-editor__panel lw-editor__identity">
            <div className="lw-editor__section-heading">PERSONALIZACIÓN</div>
            <div className="lw-editor__mode">
              <button type="button" className={previewMode==="full"?"active":""} onClick={()=>setPreviewMode("full")}>CUERPO</button>
              <button type="button" className={previewMode==="face"?"active":""} onClick={()=>setPreviewMode("face")}>ROSTRO</button>
            </div>
            <label>TONO DE PIEL</label>
            <div className="lw-editor__swatches">{SKINS.map(v=><button type="button" key={v} className={draft.skin===v?"active":""} style={{background:v}} onClick={()=>change("skin",v)} aria-label={`Tono de piel ${v}`}/>)}</div>
            <label>PEINADO</label>
            <div className="lw-editor__choices">{HAIRS.map(v=><button type="button" key={v} className={draft.hair===v?"active":""} onClick={()=>change("hair",v)}>{v}</button>)}</div>
            <label>COLOR DE CABELLO</label>
            <div className="lw-editor__swatches">{HAIR_COLORS.map(v=><button type="button" key={v} className={draft.hairColor===v?"active":""} style={{background:v}} onClick={()=>change("hairColor",v)} aria-label={`Color de cabello ${v}`}/>)}</div>
            <label>FORMA DEL ROSTRO</label>
            <div className="lw-editor__choices">{FACES.map(v=><button type="button" key={v} className={draft.face===v?"active":""} onClick={()=>change("face",v)}>{v}</button>)}</div>
            <label>EXPRESIÓN</label>
            <div className="lw-editor__choices">{EXPRESSIONS.map(([v,l])=><button type="button" key={v} className={draft.expression===v?"active":""} onClick={()=>change("expression",v)}>{l}</button>)}</div>
          </aside>
          <main className="lw-editor__center">
            <div className="lw-editor__arena-head"><span>✦ VISTA PREVIA EN VIVO</span><span>PERSONAJE</span></div>
            <div className="lw-editor__arena">
              <div className="lw-editor__light lw-editor__light--left"/><div className="lw-editor__light lw-editor__light--right"/>
              {previewMode==="full"?(
                <div className="lw-editor__avatar-scaled"><Avatar2D items={items} appearance={draft}/></div>
              ):(
                <div className="lw-editor__face-zoom"><AvatarFace appearance={draft}/></div>
              )}
              <div className="lw-editor__floor"/>
              <div className="lw-editor__slot-rail">{SLOTS.map(s=>{
                const item=equipped.find(i=>i.slot===s.key);
                return <button type="button" key={s.key} className={slot===s.key?"active":""} onClick={()=>{setSlot(s.key);setWardrobeTab("wardrobe");}} title={s.label}>
                  <span>{item?.imageUrl?<img src={item.imageUrl} alt=""/>:s.icon}</span><small>{s.label}</small>
                </button>;
              })}</div>
            </div>
            <div className="lw-editor__arena-foot">Vista previa de tu identidad y equipamiento · Seleccioná una categoría para cambiar prendas</div>
            {error&&<p role="alert" className="lw-editor__error">{error}</p>}
            {done&&<p role="status" className="lw-editor__saved">Identidad guardada ✓</p>}
            <button type="button" className="lw-editor__save" disabled={saving} onClick={async()=>setDone(await save(draft))}>{saving?"GUARDANDO...":"✓ GUARDAR MI PERSONAJE"}</button>
          </main>
          <aside className="lw-editor__panel lw-editor__wardrobe">
            <div className="lw-editor__tabs">
              <button type="button" className={wardrobeTab==="wardrobe"?"active":""} onClick={()=>setWardrobeTab("wardrobe")}>MI ARMARIO</button>
              <button type="button" className={wardrobeTab==="inventory"?"active":""} onClick={()=>setWardrobeTab("inventory")}>INVENTARIO</button>
              <button type="button" className={wardrobeTab==="shop"?"active":""} onClick={()=>setWardrobeTab("shop")}>TIENDA</button>
            </div>
            {wardrobeTab==="shop"?(
              <div className="lw-editor__empty"><strong>TIENDA PRÓXIMAMENTE</strong><p>El catálogo de compras todavía no está conectado. Tus ítems actuales están en Mi armario.</p><button type="button" onClick={()=>setWardrobeTab("wardrobe")}>VER MI ARMARIO</button></div>
            ):(
              <>
                <div className="lw-editor__categories"><button type="button" className={slot==="all"?"active":""} onClick={()=>setSlot("all")}><span>▦</span>TODOS</button>{SLOTS.map(s=><button type="button" key={s.key} className={slot===s.key?"active":""} onClick={()=>setSlot(s.key)}><span>{s.icon}</span>{s.label}</button>)}</div>
                <div className="lw-editor__rarities">{RARITIES.map(r=><button type="button" key={r} data-rarity={r} className={rarity===r?"active":""} onClick={()=>setRarity(r)}>{r==="all"?"TODOS":r.toUpperCase()}</button>)}</div>
                {usingFallback&&<p className="lw-editor__hint">Catálogo de demostración: equipamiento local.</p>}
                <div className="lw-editor__items">
                  {loading?<p className="lw-editor__hint">Cargando ítems…</p>:shown.length===0?<div className="lw-editor__empty-state"><strong>NO HAY ÍTEMS EN ESTE FILTRO</strong><p>Probá con TODOS para ver el catálogo completo.</p><button type="button" onClick={()=>{setSlot("all");setRarity("all");}}>VER TODOS LOS ÍTEMS</button></div>:shown.map(item=>(
                    <button type="button" key={item.id} className={`lw-editor__item lw-editor__item--${item.rarity} ${item.equipped?"is-equipped":""}`} disabled={!item.owned||busyId===item.id} onClick={()=>void equip(item.id)}>
                      <div className="lw-editor__item-image">{item.imageUrl?<img src={item.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display="none";}}/>:<span>{item.icon}</span>}</div>
                      <strong>{item.name}</strong><small>{item.rarity.toUpperCase()}</small>
                      <em>{item.equipped?"✓ EQUIPADO":item.owned?"EQUIPAR":`🔒 NIV. ${item.requiredLevel}`}</em>
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </div>,document.body
  );
}
