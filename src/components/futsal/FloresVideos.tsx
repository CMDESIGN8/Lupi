import { useState } from "react";

type Video = { id: string; title: string; channel: string; url: string; short?: boolean; vertical?: boolean };
const videos: Video[] = [
  { id: "UckMTqiLg6g", title: "Video de La 8va", channel: "La 8va", url: "https://youtu.be/UckMTqiLg6g", vertical: true },
  { id: "mD7gZzyEE_8", title: "Short de LupiApp", channel: "LupiApp", url: "https://www.youtube.com/shorts/mD7gZzyEE_8", short: true, vertical: true },
];

export function FloresVideos({ divisionId }: { divisionId: string }) {
  const isEighth = divisionId === "8";
  const [active, setActive] = useState<"flores" | "lupi">(isEighth ? "flores" : "lupi");
  const [playing, setPlaying] = useState<string | null>(null);
  const video = videos[active === "flores" ? 0 : 1];
  const choose = (next: "flores" | "lupi") => { setActive(next); setPlaying(null); };
  return <div className="lf-videos">
    <p className="lf-videos-intro">{isEighth ? "Partidos y mejores jugadas de Flores Futsal." : "Highlights de la comunidad Lupi. Todavía no hay videos específicos de esta categoría."}</p>
    <div className="lf-video-tabs" role="group" aria-label="Canal de videos">
      {isEighth && <button type="button" className={active === "flores" ? "active" : ""} onClick={() => choose("flores")}>⚽ Lupi TV · La 8va</button>}
      <button type="button" className={active === "lupi" ? "active" : ""} onClick={() => choose("lupi")}>▶ Lupi Highlights</button>
    </div>
    <article className={"lf-video-card" + (video.vertical ? " lf-video-card-vertical" : "")}>
      <div className={"lf-video-player" + (video.vertical ? " lf-video-vertical" : "")}>
        {playing === video.id ? <iframe key={video.id} src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen loading="lazy" /> : <button type="button" className="lf-video-preview" onClick={() => setPlaying(video.id)} aria-label={`Reproducir ${video.title}`}>
          <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="Vista previa del video de YouTube" loading="lazy" />
          <span className="lf-video-play">▶</span>
        </button>}
      </div>
      <div className="lf-video-details"><p className="lf-eyebrow">{video.channel}{video.short ? " · SHORT" : " · VIDEO"}</p><h3>{video.title}</h3><p>Contenido compartido desde YouTube. La reproducción puede depender de la configuración del video.</p><a className="lf-link" href={video.url} target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a></div>
    </article>
    <div className="lf-video-bottom">{isEighth && <a className="lf-link" href="https://www.youtube.com/@la_8va" target="_blank" rel="noopener noreferrer">Canal La 8va ↗</a>}<a className="lf-link" href="https://www.youtube.com/@LupiApp" target="_blank" rel="noopener noreferrer">Canal LupiApp ↗</a><a className="lf-link" href={`/futsal?division=${divisionId}`}>Consultar tabla de {divisionId}.ª ↗</a></div>
  </div>;
}
