import { useState } from "react";
import { api, type AppUser } from "./lib/api";
import type { UserCard } from "./types/cards";
import "./SigningWelcome.css";

type Props = { user: AppUser; onContinue: () => void };
type Stage = "welcome" | "reveal";
type Rarity = "bronze" | "silver" | "gold" | "special";
const statLabels = [["RIT", "pace"], ["REG", "dribbling"], ["PAS", "passing"], ["DEF", "defending"], ["REM", "finishing"], ["FIS", "physical"]] as const;

function rarityFor(rating: number): Rarity {
  return rating >= 85 ? "special" : rating >= 75 ? "gold" : rating >= 65 ? "silver" : "bronze";
}

/** Ilustración vectorial original, sin depender de fotos externas ni nuevas librerías. */
function PlayerPortrait({ position, variant }: { position: string; variant: number }) {
  const goalkeeper = /^(GK|POR|ARQ|PORTERO|ARQUERO)$/i.test(position.trim());
  const shirts = goalkeeper
    ? ["#ffb62e", "#e65e3c", "#b9e83c"]
    : ["#156de2", "#05bfae", "#ad46e9", "#ec455c", "#f2c541"];
  const shirt = shirts[variant % shirts.length];
  const uid = `lupi-portrait-${variant}-${goalkeeper ? "gk" : "field"}`;
  return (
    <svg className="starter-card__player" viewBox="0 0 180 190" role="img" aria-label={goalkeeper ? "Ilustración de arquero" : "Ilustración de futbolista"} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe1ba"/><stop offset=".52" stopColor="#c78a68"/><stop offset="1" stopColor="#89543e"/></linearGradient>
        <linearGradient id={`${uid}-kit`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".36"/><stop offset=".4" stopColor={shirt}/><stop offset="1" stopColor="#07182c"/></linearGradient>
        <linearGradient id={`${uid}-short`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#253c63"/><stop offset="1" stopColor="#071224"/></linearGradient>
      </defs>
      <ellipse cx="91" cy="184" rx="51" ry="5" fill="#000" opacity=".35"/>
      {/* Botines y medias */}
      <path d="M65 142 60 174 77 176 87 147 M104 146 110 176 128 174 117 142" fill="#e7efff" stroke="#13263d" strokeWidth="3"/>
      <path d="M58 171 78 172 84 184 49 184Q46 177 58 171ZM110 173 129 171Q141 178 143 184H106Z" fill="#13f2c1" stroke="#07182a" strokeWidth="3"/>
      <path d="M64 171h13M111 172h16" stroke="#0b3440" strokeWidth="2"/>
      {/* Pantalón */}
      <path d="M65 116 119 116 126 148 99 150 91 135 84 150 58 148Z" fill={`url(#${uid}-short)`} stroke="#07182a" strokeWidth="3"/>
      <path d="M91 120v16" stroke="#6789b4" strokeWidth="2" opacity=".7"/>
      {/* Brazos en pose de presentación */}
      <path d="M63 62Q48 63 41 79L30 116Q28 124 36 127Q43 129 47 119L63 91M119 62Q136 61 141 79L152 113Q155 125 146 127Q139 128 135 118L117 91" fill={`url(#${uid}-kit)`} stroke="#07182a" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M30 115Q26 122 30 131L37 138Q45 137 44 129L42 117M140 117Q137 128 141 136L148 139Q155 135 154 126L152 114" fill={`url(#${uid}-skin)`} stroke="#704b3b" strokeWidth="2"/>
      {/* Camiseta y detalles */}
      <path d="M70 59Q91 53 112 59L124 82 118 123Q92 132 64 123L59 82Z" fill={`url(#${uid}-kit)`} stroke="#061b30" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M70 61 90 77 111 61M89 78 91 120" fill="none" stroke="#f5ffff" strokeOpacity=".4" strokeWidth="3"/>
      <path d="M64 113Q90 124 118 113" fill="none" stroke="#031525" strokeOpacity=".5" strokeWidth="4"/>
      <path d="M102 81h12v11h-12z" fill="#001e32" opacity=".55"/><path d="m108 82 3 3-3 5-3-5z" fill="#29ffd0"/>
      <path d="M84 89h15" stroke="#f8ffff" strokeWidth="2" opacity=".65"/>
      {/* Cuello, cabeza y pelo */}
      <path d="M82 50v13q9 11 18 0V50" fill={`url(#${uid}-skin)`} stroke="#704b3b" strokeWidth="2"/>
      <ellipse cx="91" cy="33" rx="24" ry="28" fill={`url(#${uid}-skin)`} stroke="#754937" strokeWidth="2"/>
      <path d="M67 34Q60 8 78 7 87-4 101 5 117 0 119 17 125 27 115 35L111 21 98 17 86 24 73 21Z" fill={variant % 2 ? "#e4e8f7" : "#172743"} stroke="#0a1a2e" strokeWidth="2"/>
      <path d="M75 38h9m15 0h9" stroke="#2c2731" strokeWidth="3" strokeLinecap="round"/>
      <path d="M90 41 88 49 94 49" fill="none" stroke="#9e614b" strokeWidth="2"/>
      <path d="M83 54q8 5 16 0" fill="none" stroke="#743c38" strokeWidth="2" strokeLinecap="round"/>
      <path d="M74 25 82 16 93 20 102 12 115 22" fill="none" stroke="#ffffff" strokeOpacity=".3" strokeWidth="3"/>
      {goalkeeper && <><path d="M29 115 43 119 44 127 31 126ZM140 119 153 114 154 125 141 128Z" fill="#b9ffdb" stroke="#063b4d" strokeWidth="2"/></>}
    </svg>
  );
}


/**
 * Identidad visual por carta (NO por orden de aparición ni por módulo de cinco).
 * Prioridad: URL real en la carta > manifest por ID > manifest por nombre > vector.
 * Para incorporar arte nuevo, añadir el ID real de Supabase a PLAYER_ART_BY_ID.
 */
const PLAYER_ART_BY_ID: Record<string, string> = {
  "3edf556a-db0d-4336-ba29-e3195831a2c8": "/player-art/juan-perez.webp",
  "474a5657-2391-48b7-b317-4320985f8106": "/player-art/sergio-gonzalez.webp",
  "4756cbcd-d68d-45ad-a10c-2b9687e80add": "/player-art/martin-fernandez.webp",
  "910449e0-eaf6-4907-b513-714cee1df2dd": "/player-art/luis-rodriguez.webp",
  "c6ca243b-c0f6-4cc0-8113-5f993c02bbe6": "/player-art/javier-lopez.webp",
};

// Cada jugador usa su propia ilustración. Guardá los archivos en public/player-art/.
// Estos nombres funcionan aunque las cartas se entreguen en otro orden.
const PLAYER_ART_BY_NAME: Record<string, string> = {
  "juan-perez": "/player-art/juan-perez.webp",
  "sergio-gonzalez": "/player-art/sergio-gonzalez.webp",
  "martin-fernandez": "/player-art/martin-fernandez.webp",
  "luis-rodriguez": "/player-art/luis-rodriguez.webp",
  "javier-lopez": "/player-art/javier-lopez.webp",
};

function playerSlug(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stableVariant(identity: string): number {
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i++) {
    hash ^= identity.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function playerIdentity(card: NonNullable<UserCard["card"]>): string {
  const withId = card as typeof card & { id?: string | number };
  return String(withId.id ?? playerSlug(String(card.name ?? "")));
}

function playerArtUrl(card: NonNullable<UserCard["card"]>): string | null {
  const fields = card as typeof card & {
    photo_url?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    portrait_url?: string | null;
    portraitUrl?: string | null;
  };
  const fromData = fields.photo_url ?? fields.image_url ?? fields.imageUrl ?? fields.portrait_url ?? fields.portraitUrl;
  if (typeof fromData === "string" && fromData.trim()) return fromData.trim();
  const id = playerIdentity(card);
  return PLAYER_ART_BY_ID[id] ?? PLAYER_ART_BY_NAME[playerSlug(String(card.name ?? ""))] ?? null;
}

function PlayerArtwork({ card }: { card: NonNullable<UserCard["card"]> }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = playerArtUrl(card);
  const variant = stableVariant(playerIdentity(card));
  if (!url || url === failedUrl) {
    return <PlayerPortrait position={String(card.position)} variant={variant} />;
  }
  return (
    <img
      className="starter-card__player starter-card__player--image"
      src={url}
      alt={`Ilustración de ${card.name}`}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setFailedUrl(url)}
    />
  );
}

function CardFace({ item, index, compact = false }: { item: UserCard; index: number; compact?: boolean }) {
  const card = item.card;
  if (!card) return null;
  const rarity = rarityFor(Number(card.overall_rating) || 0);
  return (
    <article className={`starter-card starter-card--${rarity}${compact ? " starter-card--compact" : ""}`} aria-label={`Carta ${index + 1}: ${card.name}`}>
      <div className="starter-card__grain" aria-hidden="true" /><div className="starter-card__foil" aria-hidden="true" />
      <div className="starter-card__top"><div><strong>{card.overall_rating}</strong><span className="starter-card__position">{String(card.position).toUpperCase()}</span></div><span className="starter-card__crest" aria-hidden="true">♛</span></div>
      <div className="starter-card__portrait"><span className="starter-card__sun" aria-hidden="true"/><PlayerArtwork key={playerIdentity(card)} card={card} /></div>
      <div className="starter-card__bottom">
        <h3>{card.name}</h3>
        <div className="starter-card__rarity">✦ {rarity === "special" ? "ESPECIAL" : rarity === "gold" ? "ORO" : rarity === "silver" ? "PLATA" : "BRONCE"} ✦</div>
        <div className="starter-card__stats">{statLabels.map(([label, key]) => <span key={key}>{label}<b>{card[key]}</b></span>)}</div>
      </div>
    </article>
  );
}

/** Solo consulta cartas existentes: no modifica inventario, puntos ni referidos. */
export function SigningWelcome({ user, onContinue }: Props) {
  const [stage, setStage] = useState<Stage>("welcome");
  const [cards, setCards] = useState<UserCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPack() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const collection = await api.getUserCards(user.id);
      const available = collection.filter((item) => Boolean(item.card));
       const position = (item: UserCard) => String(item.card?.position ?? "").toUpperCase();
       const findPosition = (pattern: RegExp) => available.findIndex((item) => pattern.test(position(item)));
       const selected: UserCard[] = [];
       for (const pattern of [/GK|POR|ARQ/, /CIERRE|FIXO|DEF|CB/, /ALA|WING|LW|LEFT/, /ALA|WING|RW|RIGHT/, /PIV|PÍV|ST|FW|DEL/]) {
         const match = findPosition(pattern);
         if (match >= 0) selected.push(...available.splice(match, 1));
         if (selected.length >= 5) break;
       }
       const visible = [...selected, ...available].slice(0, 5);
      if (!visible.length) {
        setError("Todavía no encontramos tus cartas. Probá nuevamente en unos segundos.");
        return;
      }
      setCards(visible);
      setIndex(0);
      setStage("reveal");
    } catch (cause) {
      console.error("Error al cargar Starter Pack", cause);
      setError("No pudimos cargar tus cartas. Probá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signing-welcome" role="dialog" aria-modal="true" aria-labelledby="signing-title">
      <div className="signing-welcome__light signing-welcome__light--left" aria-hidden="true" />
      <div className="signing-welcome__light signing-welcome__light--right" aria-hidden="true" />
      <div className={`signing-welcome__card signing-welcome__card--pack signing-welcome__card--${stage}`}>
        <span className="signing-welcome__eyebrow">✦ LUPI WORLD · NUEVO FICHAJE ✦</span>
        {stage === "welcome" && <>
          <div className="signing-welcome__emblem" aria-hidden="true">♛</div>
          <h1 id="signing-title">¡FICHAJE <em>CONFIRMADO!</em></h1>
          <p className="signing-welcome__intro">Bienvenido a la cancha</p>
          <strong className="signing-welcome__name">{user.username || "JUGADOR"}</strong>
          <span className="signing-welcome__club">{user.club || "LUPI WORLD"}</span>
          <p className="signing-welcome__message">STARTER PACK DESBLOQUEADO · 5 CARTAS</p>
          {error && <p role="alert" className="starter-pack__error">{error}</p>}
          <button type="button" className="signing-welcome__button" onClick={openPack} disabled={loading}>{loading ? "CARGANDO CARTAS..." : "ABRIR MI PRIMER SOBRE →"}</button>
        </>}
        {stage === "reveal" && <>
          <h1 id="signing-title" className="starter-pack__title">{index + 1 >= cards.length ? <>¡EQUIPO <em>LISTO!</em></> : <>ARMANDO <em>TU QUINTETO</em></>}</h1>
          <p className="starter-pack__progress">{Math.min(index + 1, cards.length)} / {cards.length} JUGADORES REVELADOS</p>
          <div className="futsal-lineup" aria-label="Formación de futsal">
            {cards.map((item, i) => <div key={item.id ?? i} className={`futsal-lineup__slot futsal-lineup__slot--${i} ${i <= index ? "is-revealed" : "is-locked"}`}>
              {i <= index ? <CardFace item={item} index={i} compact /> : <div className="futsal-lineup__placeholder">?<small>{["ARQUERO", "CIERRE", "ALA IZQ.", "ALA DER.", "PÍVOT"][i]}</small></div>}
            </div>)}
          </div>
          <button type="button" className="signing-welcome__button" onClick={() => index + 1 < cards.length ? setIndex((current) => current + 1) : onContinue()}>
            {index + 1 < cards.length ? "REVELAR SIGUIENTE JUGADOR →" : "ENTRAR AL MUNDO →"}
          </button>
          {index + 1 < cards.length && <button type="button" className="starter-pack__skip" onClick={() => setIndex(cards.length - 1)}>REVELAR EQUIPO COMPLETO</button>}
        </>}

      </div>
    </div>
  );
}
