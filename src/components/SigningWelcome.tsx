import { memo, useEffect, useMemo, useState } from "react";
import { api, type AppUser } from "./lib/api";
import type { UserCard } from "./types/cards";
import "./SigningWelcome.css";

type Props = { user: AppUser; onContinue: () => void };
type Stage = "welcome" | "reveal";
type Rarity = "bronze" | "silver" | "gold" | "special";
type Variant = "lineup" | "full";

const statLabels = [["RIT", "pace"], ["REG", "dribbling"], ["PAS", "passing"], ["DEF", "defending"], ["REM", "finishing"], ["FIS", "physical"]] as const;
const RARITY_LABEL: Record<Rarity, string> = { bronze: "BRONCE", silver: "PLATA", gold: "ORO", special: "ESPECIAL" };

function rarityFor(rating: number): Rarity {
  return rating >= 85 ? "special" : rating >= 75 ? "gold" : rating >= 65 ? "silver" : "bronze";
}

const overallOf = (item?: UserCard) => Number(item?.card?.overall_rating) || 0;

/**
 * LUPI DT: arma el mejor quinteto completo (no elige puesto por puesto).
 * El índice del puesto es el índice del slot en cancha y en el array `cards`,
 * así que la etiqueta bajo cada carta SIEMPRE sale de FUTSAL_ROLES.
 */
const FUTSAL_ROLES = ["ARQUERO", "CIERRE", "ALA IZQ.", "ALA DER.", "PÍVOT"] as const;
type FutsalRole = typeof FUTSAL_ROLES[number];
const WINGS: readonly FutsalRole[] = ["ALA IZQ.", "ALA DER."];

const normalize = (value: unknown) =>
  String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

function naturalRoles(position: string): FutsalRole[] {
  const p = normalize(position);
  if (/GK|POR|ARQ|GOAL/.test(p)) return ["ARQUERO"];
  if (/CIERRE|FIXO|DEF|CB|BACK/.test(p)) return ["CIERRE"];
  if (/PIV|\bST\b|FW|DEL|STRIKER|FORWARD/.test(p)) return ["PÍVOT"];
  if (/ALA|WING|\bLW\b|\bRW\b|LEFT|RIGHT|IZQ|DER|MID|MED/.test(p)) return [...WINGS];
  return [];
}

function wingSide(position: string): FutsalRole | null {
  const p = normalize(position);
  return /IZQ|LEFT|\bLW\b/.test(p) ? "ALA IZQ." : /DER|RIGHT|\bRW\b/.test(p) ? "ALA DER." : null;
}

function isOutOfPosition(item: UserCard, role: FutsalRole): boolean {
  const natural = naturalRoles(String(item.card?.position ?? ""));
  return natural.length > 0 && !natural.includes(role);
}

function fitScore(item: UserCard, role: FutsalRole): number {
  const c = item.card!;
  const n = (key: keyof typeof c) => Math.max(0, Math.min(100, Number(c[key]) || 0));
  const overall = n("overall_rating");
  const pace = n("pace"), dribble = n("dribbling"), pass = n("passing");
  const defend = n("defending"), finish = n("finishing"), physical = n("physical");
  const skill = role === "ARQUERO" ? .55 * defend + .30 * physical + .15 * pass
    : role === "CIERRE" ? .47 * defend + .25 * physical + .20 * pass + .08 * pace
    : role === "PÍVOT" ? .43 * finish + .24 * physical + .18 * dribble + .15 * pass
    : .30 * pace + .28 * dribble + .23 * pass + .12 * physical + .07 * finish;
  const position = String(c.position ?? "");
  const natural = naturalRoles(position);
  const penalty = natural.length === 0 ? 8 : natural.includes(role) ? 0
    : (natural.includes("ARQUERO") || role === "ARQUERO") ? 32 : 17;
  const side = wingSide(position);
  const sidePenalty = side && WINGS.includes(role) && side !== role ? 3 : 0;
  return .38 * overall + .62 * skill - penalty - sidePenalty;
}

function bestQuintet(items: UserCard[]): UserCard[] {
  const valid = items.filter((item) => item.card);
  if (valid.length < FUTSAL_ROLES.length) return [];
  const FULL = (1 << FUTSAL_ROLES.length) - 1;
  let dp = new Map<number, { score: number; picks: UserCard[] }>([[0, { score: 0, picks: [] }]]);
  for (const item of valid) {
    const next = new Map(dp);
    for (const [mask, state] of dp) {
      for (let role = 0; role < FUTSAL_ROLES.length; role++) {
        if (mask & (1 << role)) continue;
        const newMask = mask | (1 << role);
        const score = state.score + fitScore(item, FUTSAL_ROLES[role]);
        if (score > (next.get(newMask)?.score ?? -Infinity)) {
          const picks = state.picks.slice();
          picks[role] = item;
          next.set(newMask, { score, picks });
        }
      }
    }
    dp = next;
  }
  return dp.get(FULL)?.picks ?? [];
}

function dtExplanation(item: UserCard, role: FutsalRole): string {
  const card = item.card;
  if (!card) return "Sin datos suficientes para analizar esta carta.";
  const natural = naturalRoles(String(card.position ?? ""));
  const weights: Record<FutsalRole, { key: "pace" | "dribbling" | "passing" | "defending" | "finishing" | "physical"; label: string; weight: number }[]> = {
    "ARQUERO": [{ key: "defending", label: "defensa", weight: .55 }, { key: "physical", label: "físico", weight: .30 }, { key: "passing", label: "pase", weight: .15 }],
    "CIERRE": [{ key: "defending", label: "defensa", weight: .47 }, { key: "physical", label: "físico", weight: .25 }, { key: "passing", label: "pase", weight: .20 }, { key: "pace", label: "ritmo", weight: .08 }],
    "ALA IZQ.": [{ key: "pace", label: "ritmo", weight: .30 }, { key: "dribbling", label: "regate", weight: .28 }, { key: "passing", label: "pase", weight: .23 }, { key: "physical", label: "físico", weight: .12 }, { key: "finishing", label: "remate", weight: .07 }],
    "ALA DER.": [{ key: "pace", label: "ritmo", weight: .30 }, { key: "dribbling", label: "regate", weight: .28 }, { key: "passing", label: "pase", weight: .23 }, { key: "physical", label: "físico", weight: .12 }, { key: "finishing", label: "remate", weight: .07 }],
    "PÍVOT": [{ key: "finishing", label: "remate", weight: .43 }, { key: "physical", label: "físico", weight: .24 }, { key: "dribbling", label: "regate", weight: .18 }, { key: "passing", label: "pase", weight: .15 }],
  };
  const best = [...weights[role]].sort((a, b) =>
    b.weight * (Number(card[b.key]) || 0) - a.weight * (Number(card[a.key]) || 0)
  ).slice(0, 2);
  const traits = best.map((stat) => `${stat.label} (${Number(card[stat.key]) || 0})`).join(" y ");
  const intro = natural.includes(role)
    ? `Es su posición natural. LUPI DT lo eligió como ${role.toLowerCase()}`
    : natural.length === 0
      ? `No tenemos una posición natural reconocida. LUPI DT lo asignó como ${role.toLowerCase()}`
      : `Juega fuera de su posición natural (${String(card.position).toUpperCase()}). LUPI DT lo adaptó como ${role.toLowerCase()}`;
  const warning = role === "ARQUERO" ? " La evaluación del arco es orientativa: todavía no hay atributos específicos de arquero." : "";
  return `${intro} considerando su ${traits} y el equilibrio del quinteto.${warning}`;
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
      <path d="M65 142 60 174 77 176 87 147 M104 146 110 176 128 174 117 142" fill="#e7efff" stroke="#13263d" strokeWidth="3"/>
      <path d="M58 171 78 172 84 184 49 184Q46 177 58 171ZM110 173 129 171Q141 178 143 184H106Z" fill="#13f2c1" stroke="#07182a" strokeWidth="3"/>
      <path d="M64 171h13M111 172h16" stroke="#0b3440" strokeWidth="2"/>
      <path d="M65 116 119 116 126 148 99 150 91 135 84 150 58 148Z" fill={`url(#${uid}-short)`} stroke="#07182a" strokeWidth="3"/>
      <path d="M91 120v16" stroke="#6789b4" strokeWidth="2" opacity=".7"/>
      <path d="M63 62Q48 63 41 79L30 116Q28 124 36 127Q43 129 47 119L63 91M119 62Q136 61 141 79L152 113Q155 125 146 127Q139 128 135 118L117 91" fill={`url(#${uid}-kit)`} stroke="#07182a" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M30 115Q26 122 30 131L37 138Q45 137 44 129L42 117M140 117Q137 128 141 136L148 139Q155 135 154 126L152 114" fill={`url(#${uid}-skin)`} stroke="#704b3b" strokeWidth="2"/>
      <path d="M70 59Q91 53 112 59L124 82 118 123Q92 132 64 123L59 82Z" fill={`url(#${uid}-kit)`} stroke="#061b30" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M70 61 90 77 111 61M89 78 91 120" fill="none" stroke="#f5ffff" strokeOpacity=".4" strokeWidth="3"/>
      <path d="M64 113Q90 124 118 113" fill="none" stroke="#031525" strokeOpacity=".5" strokeWidth="4"/>
      <path d="M102 81h12v11h-12z" fill="#001e32" opacity=".55"/><path d="m108 82 3 3-3 5-3-5z" fill="#29ffd0"/>
      <path d="M84 89h15" stroke="#f8ffff" strokeWidth="2" opacity=".65"/>
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

const PLAYER_ART_BY_ID: Record<string, string> = {
  "3edf556a-db0d-4336-ba29-e3195831a2c8": "/player-art/juan-perez.webp",
  "474a5657-2391-48b7-b317-4320985f8106": "/player-art/sergio-gonzalez.webp",
  "4756cbcd-d68d-45ad-a10c-2b9687e80add": "/player-art/martin-fernandez.webp",
  "910449e0-eaf6-4907-b513-714cee1df2dd": "/player-art/luis-rodriguez.webp",
  "c6ca243b-c0f6-4cc0-8113-5f993c02bbe6": "/player-art/javier-lopez.webp",
};

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

function preloadArt(items: UserCard[]) {
  for (const item of items) {
    const url = item.card ? playerArtUrl(item.card) : null;
    if (url) new Image().src = url;
  }
}

const CardFace = memo(function CardFace({ item, index, variant = "full" }: { item: UserCard; index: number; variant?: Variant }) {
  const card = item.card;
  if (!card) return null;
  const rarity = rarityFor(Number(card.overall_rating) || 0);
  const full = variant === "full";
  return (
    <article className={`starter-card starter-card--${rarity} starter-card--${variant}`} aria-label={`Carta ${index + 1}: ${card.name}`}>
      <div className="starter-card__grain" aria-hidden="true" />
      {full && <div className="starter-card__foil" aria-hidden="true" />}
      <div className="starter-card__top">
        <div><strong>{card.overall_rating}</strong><span className="starter-card__position">{String(card.position).toUpperCase()}</span></div>
        <span className="starter-card__crest" aria-hidden="true">♛</span>
      </div>
      <div className="starter-card__portrait">
        <span className="starter-card__sun" aria-hidden="true" />
        <PlayerArtwork key={playerIdentity(card)} card={card} />
      </div>
      <div className="starter-card__bottom">
        <h3>{card.name}</h3>
        <div className="starter-card__rarity">✦ {RARITY_LABEL[rarity]} ✦</div>
        {full && <div className="starter-card__stats">{statLabels.map(([label, key]) => <span key={key}>{label}<b>{card[key]}</b></span>)}</div>}
      </div>
    </article>
  );
});

/** Diálogos breves: cada línea acompaña los 2,5 segundos de su carta. */
const LUPI_REVEAL_LINES = [
  "¡Mirá! ¡Cada carta es un jugador! Con ellas vas a armar tu equipo.",
  "¿Ves ese número? Es su nivel general. ¡Cuanto más alto, mejor!",
  "Cada jugador tiene un puesto. ¡Ubicalo bien para rendir mejor!",
  "Ritmo, regate, pase, defensa, remate y físico: ¡cada uno tiene sus talentos!",
  "¡Equipo completo! Tocá una carta para ver sus habilidades. ¡A jugar!",
] as const;

function LupiTypeDialogue({ message, instant }: { message: string; instant: boolean }) {
  const [visible, setVisible] = useState(instant ? message.length : 0);
  useEffect(() => {
    setVisible(instant ? message.length : 0);
    if (instant) return;
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor = Math.min(message.length, cursor + 2);
      setVisible(cursor);
      if (cursor >= message.length) window.clearInterval(timer);
    }, 48);
    return () => window.clearInterval(timer);
  }, [message, instant]);
  return <p className="lupi-reveal-dialogue__text">{message.slice(0, visible)}<span className="lupi-reveal-dialogue__cursor" aria-hidden="true">▍</span></p>;
}

/** Solo consulta cartas existentes: no modifica inventario, puntos ni referidos. */
export function SigningWelcome({ user, onContinue }: Props) {
  const [stage, setStage] = useState<Stage>("welcome");
  const [cards, setCards] = useState<UserCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [celebrated, setCelebrated] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState<number | null>(null);
  const [incomplete, setIncomplete] = useState(false);
  const [showDtAnalysis, setShowDtAnalysis] = useState(false);
  const [enteringWorld, setEnteringWorld] = useState(false);

  const last = cards.length - 1;
  const done = stage === "reveal" && cards.length > 0 && index === last;
  const clubName = user.club || "LUPI WORLD";

  const revealRank = useMemo(() => {
    const order = cards.map((_, i) => i).sort((a, b) => overallOf(cards[a]) - overallOf(cards[b]) || a - b);
    const rank = new Array<number>(cards.length);
    order.forEach((slot, r) => { rank[slot] = r; });
    return rank;
  }, [cards]);

  // Índice del slot que está "en cámara" (el que se acaba de revelar)
  const activeSlot = useMemo(() => {
    if (stage !== "reveal" || cards.length === 0) return -1;
    for (let i = 0; i < cards.length; i++) if (revealRank[i] === index) return i;
    return -1;
  }, [stage, cards.length, index, revealRank]);

  useEffect(() => {
    if (stage !== "reveal" || cards.length === 0 || index >= last || detailsIndex !== null || showDtAnalysis) return;
    const timer = window.setTimeout(() => setIndex((current) => Math.min(current + 1, last)), 2500);
    return () => window.clearTimeout(timer);
  }, [stage, cards.length, index, last, detailsIndex, showDtAnalysis]);

  useEffect(() => {
    if (!done) { setCelebrated(false); return; }
    const timer = window.setTimeout(() => setCelebrated(true), 1050);
    return () => window.clearTimeout(timer);
  }, [done]);

  useEffect(() => {
    if (detailsIndex === null && !showDtAnalysis) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setDetailsIndex(null); setShowDtAnalysis(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailsIndex, showDtAnalysis]);

  function enterWorld() {
    if (enteringWorld) return;
    setEnteringWorld(true);
  }

  useEffect(() => {
    if (!enteringWorld) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onContinue, reducedMotion ? 80 : 1450);
    return () => window.clearTimeout(timer);
  }, [enteringWorld, onContinue]);

  async function openPack() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      setIncomplete(false);
      const collection = await api.getUserCards(user.id);
      const available = collection.filter((item) => Boolean(item.card));
      const visible = bestQuintet(available);
      if (visible.length < FUTSAL_ROLES.length) {
        setIncomplete(true);
        setError(available.length
          ? "Necesitás cinco cartas para armar el quinteto. Revisá tu colección e intentá nuevamente."
          : "Todavía no encontramos tus cartas. Probá nuevamente en unos segundos.");
        return;
      }
      preloadArt(visible);
      setCards(visible);
      setIndex(0);
      setDetailsIndex(null);
      setShowDtAnalysis(false);
      setStage("reveal");
    } catch (cause) {
      console.error("Error al cargar Starter Pack", cause);
      setError("No pudimos cargar tus cartas. Probá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const detail = detailsIndex !== null ? cards[detailsIndex] : undefined;

  return (
    <div className={`signing-welcome signing-welcome--${stage}${enteringWorld ? " signing-welcome--entering" : ""}`} role="dialog" aria-modal="true" aria-labelledby="signing-title">

      {/* Capas de ambiente */}
      <div className="signing-welcome__atmosphere" aria-hidden="true" />
      <div className="signing-welcome__spotlight"  aria-hidden="true" />
      <div className="signing-welcome__sparks"     aria-hidden="true" />
      <div className="signing-welcome__flash"      aria-hidden="true" />

      {/* Capas de cine */}
      <div className="signing-welcome__grain-film" aria-hidden="true" />
      <div className="signing-welcome__scanlines"  aria-hidden="true" />
      <div className="signing-welcome__vignette"   aria-hidden="true" />
      <div className="signing-welcome__chromatic"  aria-hidden="true" />
      <div className="signing-welcome__flicker"    aria-hidden="true" />

      {/* Reflectores laterales */}
      <div className="signing-welcome__light signing-welcome__light--left"  aria-hidden="true" />
      <div className="signing-welcome__light signing-welcome__light--right" aria-hidden="true" />

      <div className={`signing-welcome__card signing-welcome__card--${stage}`}>
        <span className="signing-welcome__eyebrow">✦ LUPI WORLD · NUEVO FICHAJE ✦</span>

        {stage === "welcome" && <>
          <div className="signing-welcome__emblem" aria-hidden="true">♛</div>
          <span className="signing-welcome__announcement">✦ NUEVA ESTRELLA EN LA CANCHA ✦</span>
          <h1 id="signing-title">¡FICHAJE <em>CONFIRMADO!</em></h1>
          <p className="signing-welcome__intro">Bienvenido a la cancha</p>
          <strong className="signing-welcome__name">{user.username || "JUGADOR"}</strong>
          <span className="signing-welcome__club">{clubName}</span>
          <p className="signing-welcome__message">STARTER PACK DESBLOQUEADO · 5 CARTAS</p>
          {error && <p role="alert" className="starter-pack__error">{error}</p>}
          <button type="button" className="signing-welcome__button" onClick={openPack} disabled={loading}>
            {loading ? "CARGANDO CARTAS..." : "ABRIR MI PRIMER SOBRE →"}
          </button>
          {incomplete && <button type="button" className="starter-pack__skip" onClick={onContinue}>CONTINUAR SIN QUINTETO</button>}
        </>}

        {stage === "reveal" && <>
          <header className="futsal-lineup__header">
            <h1 id="signing-title" className="starter-pack__title">
              {done ? <>¡TU EQUIPO <em>ESTÁ LISTO!</em></> : <>ARMANDO <em>TU QUINTETO</em></>}
            </h1>
            <div className="futsal-lineup__club">{clubName} <span aria-hidden="true">✦</span> TU PRIMER QUINTETO</div>
            <p className="starter-pack__progress">{Math.min(index + 1, cards.length)} / {cards.length} JUGADORES REVELADOS</p>
          </header>

          <div
            className={`futsal-lineup${celebrated ? " is-complete" : ""}${index < last ? " is-playing" : " is-final"}`}
            aria-label="Formación de futsal"
          >
            {celebrated && <div className="futsal-lineup__celebration" aria-hidden="true" />}
            {cards.map((item, i) => {
              const role = FUTSAL_ROLES[i];
              const revealed = revealRank[i] <= index;
              const camActive = revealed && i === activeSlot;
              return (
                <div
                  key={item.id ?? i}
                  className={`futsal-lineup__slot futsal-lineup__slot--${i} ${revealed ? "is-revealed" : "is-locked"}`}
                  data-cam={camActive ? "active" : undefined}
                >
                  {revealed ? <>
                    <div className="futsal-lineup__ground" aria-hidden="true" />
                    <button
                      type="button"
                      className="futsal-lineup__card-trigger"
                      onClick={() => setDetailsIndex(i)}
                      aria-label={`Ver estadísticas de ${item.card?.name ?? "jugador"}`}
                    >
                      <CardFace item={item} index={i} variant="lineup" />
                      <span className="futsal-lineup__view-stats" aria-hidden="true">VER STATS ↗</span>
                    </button>
                    <span className="futsal-lineup__role">
                      {role}
                      {isOutOfPosition(item, role) && <small className="futsal-lineup__off-position">FUERA DE POSICIÓN</small>}
                    </span>
                  </> : (
                    <div className="futsal-lineup__placeholder">?<small>{role}</small></div>
                  )}
                </div>
              );
            })}
          </div>

          <aside className={`lupi-reveal-dialogue${done ? " is-finale" : ""}`} aria-label="Lupi te explica tus cartas">
            <img src="/images/lupi-welcome.png" alt="Lupi" />
            <div className="lupi-reveal-dialogue__panel">
              <div className="lupi-reveal-dialogue__heading"><strong>LUPI <span>✦ TU DT</span></strong><small>{Math.min(index + 1, 5)} / 5</small></div>
              <LupiTypeDialogue key={index} message={LUPI_REVEAL_LINES[Math.min(index, 4)]} instant={false} />
            </div>
          </aside>
          <footer className="futsal-lineup__footer">
            {done
              ? <button
                  type="button"
                  className={`signing-welcome__button futsal-lineup__cta${celebrated ? " is-ready" : ""}`}
                  onClick={enterWorld}
                  disabled={!celebrated || enteringWorld}
                >
                  ENTRAR A LUPI WORLD →
                </button>
              : <div className="futsal-lineup__autoplay" role="status">REVELANDO JUGADORES AUTOMÁTICAMENTE…</div>}
            {done && <button type="button" className="futsal-lineup__dt-button" onClick={() => setShowDtAnalysis(true)}>♟ VER ANÁLISIS DE LUPI DT ↗</button>}
            {done && <span className="futsal-lineup__tagline">TOCÁ UN JUGADOR PARA DESCUBRIR SUS HABILIDADES</span>}
            {!done && <button type="button" className="starter-pack__skip" onClick={() => setIndex(last)}>REVELAR EQUIPO COMPLETO</button>}
          </footer>
        </>}
      </div>

      {enteringWorld && (
        <div className="signing-world-transition" role="status" aria-live="polite">
          <div className="signing-world-transition__beams" aria-hidden="true" />
          <div className="signing-world-transition__logo">♛</div>
          <strong>LUPI <span>WORLD</span></strong>
          <p>LA CANCHA TE ESPERA</p>
          <div className="signing-world-transition__line" />
        </div>
      )}

      {showDtAnalysis && (
        <div className="lupi-stats-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDtAnalysis(false); }}>
          <section className="lupi-stats-panel lupi-dt-panel" role="dialog" aria-modal="true" aria-label="Análisis del director técnico">
            <button type="button" className="lupi-stats-close" onClick={() => setShowDtAnalysis(false)} aria-label="Cerrar análisis">×</button>
            <div className="lupi-stats-panel__eyebrow">✦ LUPI DT ✦</div>
            <h2>ASÍ ARMÉ TU QUINTETO</h2>
            <p className="lupi-dt-panel__intro">Busqué el mejor rendimiento conjunto, respetando las posiciones naturales cuando fue posible.</p>
            <div className="lupi-dt-panel__list">
              {cards.map((item, i) => (
                <div className="lupi-dt-panel__entry" key={item.id ?? i}>
                  <strong>{FUTSAL_ROLES[i]} · {item.card?.name}</strong>
                  <p>{dtExplanation(item, FUTSAL_ROLES[i])}</p>
                </div>
              ))}
            </div>
            <button type="button" className="lupi-stats-back" onClick={() => setShowDtAnalysis(false)}>← VOLVER A MI QUINTETO</button>
          </section>
        </div>
      )}

      {detail?.card && detailsIndex !== null && (
        <div className="lupi-stats-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsIndex(null); }}>
          <section className="lupi-stats-panel" role="dialog" aria-modal="true" aria-label={`Estadísticas de ${detail.card.name}`}>
            <button type="button" className="lupi-stats-close" onClick={() => setDetailsIndex(null)} aria-label="Cerrar estadísticas">×</button>
            <div className="lupi-stats-panel__eyebrow">✦ FICHA DE JUGADOR ✦</div>
            <p className="lupi-stats-panel__help"><strong>OVR {detail.card.overall_rating}</strong> es su valoración general. Sus atributos ayudan a definir cómo rinde en la cancha.</p>
            <div className="lupi-stats-panel__flip" key={detailsIndex}>
              <CardFace item={detail} index={detailsIndex} />
            </div>
            <div className="lupi-stats-panel__dt">
              <strong>♟ LUPI DT · {FUTSAL_ROLES[detailsIndex]}</strong>
              <p>{dtExplanation(detail, FUTSAL_ROLES[detailsIndex])}</p>
            </div>
            <button type="button" className="lupi-stats-back" onClick={() => setDetailsIndex(null)} autoFocus>← VOLVER A MI QUINTETO</button>
          </section>
        </div>
      )}
    </div>
  );
}