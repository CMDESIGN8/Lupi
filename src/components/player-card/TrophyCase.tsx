import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
// src/components/player-card/TrophyCase.tsx
import { ArenaSymbol } from "../match/ArenaSymbol";
import type { PlayerCompetitiveStats } from "./types";



type Trophy = {id:string;title:string;icon?:string;description?:string;unlockedAt?:string};
export function TrophyCase({ achievements, userId }: { achievements?: PlayerCompetitiveStats["achievements"]; userId:string }) {
  const [loaded,setLoaded]=useState<{userId:string;items:Trophy[];error:boolean}|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(achievements!==undefined)return;
    let active=true;
    setLoaded(null);
    void (async()=>{
      try {
        const result=await supabase.rpc("lupi_public_player_achievements",{p_user_id:userId});
        if(result.error)throw result.error;
        const items:Trophy[]=(result.data??[]).map((item:{id:string;title:string;icon?:string;description?:string;unlocked_at?:string})=>({id:item.id,title:item.title,icon:item.icon,description:item.description,unlockedAt:item.unlocked_at}));
        if(active)setLoaded({userId,items,error:false});
      }catch{if(active)setLoaded({userId,items:[],error:true});}
    })();
    return()=>{active=false;};
  },[userId,achievements,retry]);
  const current=loaded?.userId===userId?loaded:null;
  if(achievements===undefined&&!current)return <div className="lw-trophy-empty" role="status"><div className="lw-trophy-empty__podium"><ArenaSymbol kind="trophy"/></div><h4>ABRIENDO LA VITRINA…</h4><p>Buscando los logros del jugador.</p></div>;
  if(achievements===undefined&&current?.error)return <div className="lw-trophy-empty" role="alert"><h4>NO SE PUDO ABRIR LA VITRINA</h4><p>No pudimos consultar los logros de este jugador.</p><button type="button" className="pc-btn" onClick={()=>setRetry(value=>value+1)}>REINTENTAR</button></div>;
  const trophies:Trophy[]=achievements??current?.items??[];
  if (!trophies.length) {
    return <section className="lw-trophy-empty" aria-label="Vitrina sin logros públicos"><span className="lw-player-passport__kicker">HISTORIAS QUE DEJAN HUELLA</span><div className="lw-trophy-empty__podium"><ArenaSymbol kind="trophy"/></div><h4>LA VITRINA DEL JUGADOR</h4><p>Todavía no hay logros públicos para mostrar.</p><small>Cuando estén disponibles, sus reconocimientos aparecerán acá.</small></section>;
  }
  const shown = trophies;
  return (
    <>
      <h4 className="lw-heading">
        Vitrina <span>{trophies.length} desbloqueados</span>
      </h4>
      <ul className="lw-trophies">
        {shown.map((achievement) => (
          <li key={achievement.id} className="lw-trophy">
            <span className="lw-trophy__icon" aria-hidden="true">
              {achievement.icon || "🏆"}
            </span>
            <span className="lw-trophy__title">{achievement.title}</span>
            {achievement.description && <small className="lw-trophy__description">{achievement.description}</small>}
            {achievement.unlockedAt && <time className="lw-trophy__date" dateTime={achievement.unlockedAt}>{new Date(achievement.unlockedAt).toLocaleDateString("es-AR")}</time>}
          </li>
        ))}

      </ul>
    </>
  );
}
