// src/components/AvatarEditor.tsx
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";
import { useAuraInventory, type ItemRarity, type ItemSlot } from "../hooks/useAuraInventory";
import { HAIRS, HAIR_COLORS, SKINS, EYES, BROWS, NOSES, MOUTHS, type AvatarAppearance } from "../lib/avatarAppearance";
import { AvatarFace } from "./AvatarFace";
import { CharacterStage } from "./CharacterStage";
import { CheckIcon, GridIcon, LockIcon, SlotIcon } from "./EditorIcons";
import { trapTabKey } from "./player-card/hooks";
import "./AvatarEditor.css";

type Props = {
  userId: string;
  onClose: () => void;
  /** Nivel real del jugador: define qué ítems ya están desbloqueados. */
  level?: number;
  /** XP dentro del nivel actual y XP necesaria para el siguiente. */
  xp?: number;
  xpNeeded?: number;
  /** Puntos (⭐) y monedas (💰) del HUD: el editor tapa el HUD, así que los repite arriba. */
  points?: number;
  coins?: number;
  /** Imagen de fondo del escenario: la misma que usa el estadio de GameHub. */
  sceneImage?: string;
};

const SLOTS: { key: ItemSlot; label: string; tag: string }[] = [
  { key: "top", label: "REMERAS", tag: "REMERA" },
  { key: "bottom", label: "PANTALONES", tag: "PANTALÓN" },
  { key: "boots", label: "BOTINES", tag: "BOTINES" },
  { key: "accessory", label: "ACCESORIOS", tag: "ACCESORIO" },
];

const RARITIES: ("all" | ItemRarity)[] = ["all", "common", "rare", "epic", "legendary"];
const RARITY_LABEL: Record<ItemRarity, string> = { common: "Común", rare: "Rara", epic: "Épica", legendary: "Legendaria" };

const HAIR_LABEL: Record<string, string> = {
  short: "Corto",
  fade: "Degradé",
  curly: "Rulos",
  long: "Largo",
  buzz: "Rapado",
  side: "Al costado",
  afro: "Afro",
  spiky: "Puntas",
};
const FACES = ["oval", "round", "angular", "long", "soft", "square"];
const FACE_LABEL: Record<string, string> = {
  oval: "Ovalado",
  round: "Redondo",
  angular: "Angular",
  long: "Alargado",
  soft: "Suave",
  square: "Cuadrado",
};
const EXPRESSIONS: [string, string][] = [
  ["neutral", "Normal"],
  ["smile", "Sonrisa"],
  ["focused", "Competitivo"],
];

type WardrobeTab = "wardrobe" | "inventory" | "shop";

/** Opción con miniatura en vivo: usa el mismo rostro del personaje, sin arte extra. */
function FaceOption({
  appearance,
  label,
  active,
  onPick,
}: {
  appearance: AvatarAppearance;
  label: string;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button type="button" className="lw-id__opt" aria-pressed={active} onClick={onPick}>
      <span className="lw-id__opt-face" aria-hidden="true">
        <AvatarFace appearance={appearance} />
      </span>
      <span className="lw-id__opt-label">{label}</span>
    </button>
  );
}

export function AvatarEditor({ userId, onClose, level = 1, xp, xpNeeded, points, coins, sceneImage }: Props) {
  const { appearance, save, saving, error } = useAvatarAppearance(userId);
  const { items, loading, toggleEquip, usingFallback } = useAuraInventory(userId, level);
  const [draft, setDraft] = useState(appearance);
  const [done, setDone] = useState(false);
  const [previewMode, setPreviewMode] = useState<"full" | "face">("full");
  const [mobileTab, setMobileTab] = useState<"character" | "wardrobe">("character");
  const [wardrobeTab, setWardrobeTab] = useState<WardrobeTab>("wardrobe");
  const [slot, setSlot] = useState<ItemSlot | "all">("all");
  const [rarity, setRarity] = useState<"all" | ItemRarity>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setDraft(appearance), [appearance]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const change = (key: keyof AvatarAppearance, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDone(false);
  };

  const equipped = useMemo(() => items.filter((item) => item.equipped), [items]);
  const shown = items.filter(
    (item) =>
      (wardrobeTab === "inventory" ? item.owned : true) &&
      (slot === "all" || item.slot === slot) &&
      (rarity === "all" || item.rarity === rarity),
  );

  const equip = async (id: string) => {
    setBusyId(id);
    try {
      await toggleEquip(id);
    } finally {
      setBusyId(null);
    }
  };

  const pickSlot = (next: ItemSlot | "all") => {
    setSlot(next);
    setWardrobeTab((tab) => (tab === "shop" ? "wardrobe" : tab));
    setMobileTab("wardrobe");
  };

  const style = sceneImage ? ({ "--lw-scene-image": `url(${JSON.stringify(sceneImage)})` } as CSSProperties) : undefined;

  return createPortal(
    // La clase lw-editor se mantiene: AvatarFace.css la usa para el estilo "game" del rostro.
    <div
      className="lw-id lw-editor"
      role="dialog"
      aria-modal="true"
      aria-label="Personalizar personaje"
      onKeyDown={trapTabKey}
      style={style}
    >
      <div className="lw-id__bg" aria-hidden="true" />
      <div className="lw-id__beams" aria-hidden="true" />

      <header className="lw-id__header">
        <div className="lw-id__title">
          <small>✦ LUPI WORLD</small>
          <h2>MI IDENTIDAD</h2>
          <p>CREÁ TU ESTILO. JUGÁ TU HISTORIA.</p>
        </div>
        <div className="lw-id__header-right">
          {points != null && (
            <span className="lw-id__chip" title="Puntos">
              <i aria-hidden="true">⭐</i>
              {points}
            </span>
          )}
          {coins != null && (
            <span className="lw-id__chip" title="Monedas">
              <i aria-hidden="true">💰</i>
              {coins}
            </span>
          )}
          <button ref={closeRef} type="button" className="lw-id__close" onClick={onClose} aria-label="Cerrar editor">
            ✕
          </button>
        </div>
      </header>

      <div className="lw-id__layout" data-mobile-tab={mobileTab}>
        {/* ===== Personalización ===== */}
        <aside className="lw-id__panel lw-id__panel--identity" aria-label="Personalización">
          <div className="lw-id__seg" role="group" aria-label="Vista previa">
            <button type="button" aria-pressed={previewMode === "full"} onClick={() => setPreviewMode("full")}>
              CUERPO
            </button>
            <button type="button" aria-pressed={previewMode === "face"} onClick={() => setPreviewMode("face")}>
              ROSTRO
            </button>
          </div>

          <div className="lw-id__scroll">
            <h3 className="lw-id__label">TONO DE PIEL</h3>
            <div className="lw-id__swatches">
              {SKINS.map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={draft.skin === value}
                  style={{ background: value }}
                  onClick={() => change("skin", value)}
                  aria-label={`Tono de piel ${value}`}
                />
              ))}
            </div>

            <h3 className="lw-id__label">CABELLO</h3>
            <div className="lw-id__opts">
              {HAIRS.map((value) => (
                <FaceOption
                  key={value}
                  appearance={{ ...draft, hair: value }}
                  label={HAIR_LABEL[value] ?? value}
                  active={draft.hair === value}
                  onPick={() => change("hair", value)}
                />
              ))}
            </div>

            <h3 className="lw-id__label">COLOR DE CABELLO</h3>
            <div className="lw-id__swatches">
              {HAIR_COLORS.map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={draft.hairColor === value}
                  style={{ background: value }}
                  onClick={() => change("hairColor", value)}
                  aria-label={`Color de cabello ${value}`}
                />
              ))}
            </div>

            <h3 className="lw-id__label">FORMA DEL ROSTRO</h3>
            <div className="lw-id__opts">
              {FACES.map((value) => (
                <FaceOption
                  key={value}
                  appearance={{ ...draft, face: value }}
                  label={FACE_LABEL[value] ?? value}
                  active={draft.face === value}
                  onPick={() => change("face", value)}
                />
              ))}
            </div>

            {([
              ["eyes", "OJOS", EYES, { normal:"Normales",large:"Grandes",almond:"Almendrados",bright:"Brillantes" }],
              ["brows", "CEJAS", BROWS, { natural:"Naturales",straight:"Rectas",arched:"Arqueadas",bold:"Marcadas" }],
              ["nose", "NARIZ", NOSES, { soft:"Suave",small:"Pequeña",round:"Redonda",defined:"Definida" }],
              ["mouth", "BOCA", MOUTHS, { normal:"Normal",small:"Pequeña",wide:"Ancha",full:"Carnosa" }],
            ] as const).map(([key, title, values, labels]) => (
              <div key={key}>
                <h3 className="lw-id__label">{title}</h3>
                <div className="lw-id__opts">
                  {values.map(value => (
                    <FaceOption key={value} appearance={{...draft,[key]:value}}
                      label={(labels as Record<string,string>)[value]}
                      active={draft[key] === value} onPick={() => change(key,value)} />
                  ))}
                </div>
              </div>
            ))}

            <h3 className="lw-id__label">EXPRESIÓN</h3>
            <div className="lw-id__opts lw-id__opts--3">
              {EXPRESSIONS.map(([value, label]) => (
                <FaceOption
                  key={value}
                  appearance={{ ...draft, expression: value }}
                  label={label}
                  active={draft.expression === value}
                  onPick={() => change("expression", value)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ===== Escenario ===== */}
        <main className="lw-id__stage">
          <div className="lw-id__slots" role="group" aria-label="Equipamiento puesto">
            {SLOTS.map((entry) => {
              const item = equipped.find((candidate) => candidate.slot === entry.key);
              return (
                <button
                  type="button"
                  key={entry.key}
                  className="lw-id__slot"
                  data-rarity={item?.rarity ?? "none"}
                  aria-pressed={slot === entry.key}
                  aria-label={`${entry.tag}: ${item ? item.name : "vacío"}`}
                  onClick={() => pickSlot(entry.key)}
                >
                  <small>{entry.tag}</small>
                  <span className="lw-id__slot-art">
                    {item?.imageUrl ? <img src={item.imageUrl} alt="" draggable={false} /> : <SlotIcon slot={entry.key} size={28} />}
                  </span>
                </button>
              );
            })}
          </div>
          <CharacterStage items={items} appearance={draft} mode={previewMode} level={level} xp={xp} xpNeeded={xpNeeded} />
        </main>

        {/* ===== Pestañas de celular ===== */}
        <nav className="lw-id__nav" aria-label="Secciones del editor">
          <button type="button" aria-pressed={mobileTab === "character"} onClick={() => setMobileTab("character")}>
            PERSONAJE
          </button>
          <button
            type="button"
            aria-pressed={mobileTab === "wardrobe" && wardrobeTab !== "inventory"}
            onClick={() => {
              setMobileTab("wardrobe");
              setWardrobeTab("wardrobe");
            }}
          >
            ARMARIO
          </button>
          <button
            type="button"
            aria-pressed={mobileTab === "wardrobe" && wardrobeTab === "inventory"}
            onClick={() => {
              setMobileTab("wardrobe");
              setWardrobeTab("inventory");
            }}
          >
            INVENTARIO
          </button>
        </nav>

        {/* ===== Armario ===== */}
        <aside className="lw-id__panel lw-id__panel--wardrobe" aria-label="Armario">
          <div className="lw-id__seg lw-id__seg--3" role="tablist" aria-label="Armario">
            {(
              [
                ["wardrobe", "MI ARMARIO"],
                ["shop", "TIENDA"],
                ["inventory", "INVENTARIO"],
              ] as [WardrobeTab, string][]
            ).map(([id, label]) => (
              <button
                type="button"
                key={id}
                role="tab"
                aria-selected={wardrobeTab === id}
                aria-pressed={wardrobeTab === id}
                onClick={() => setWardrobeTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {wardrobeTab === "shop" ? (
            <div className="lw-id__empty">
              <strong>TIENDA PRÓXIMAMENTE</strong>
              <p>El catálogo de compras todavía no está conectado. Tus ítems actuales están en Mi armario.</p>
              <button type="button" onClick={() => setWardrobeTab("wardrobe")}>
                VER MI ARMARIO
              </button>
            </div>
          ) : (
            <>
              <div className="lw-id__cats">
                <button type="button" aria-pressed={slot === "all"} onClick={() => setSlot("all")}>
                  <GridIcon size={26} />
                  <span>TODOS</span>
                </button>
                {SLOTS.map((entry) => (
                  <button type="button" key={entry.key} aria-pressed={slot === entry.key} onClick={() => setSlot(entry.key)}>
                    <SlotIcon slot={entry.key} size={26} />
                    <span>{entry.label}</span>
                  </button>
                ))}
              </div>

              <div className="lw-id__rarities" role="group" aria-label="Rareza">
                {RARITIES.map((value) => (
                  <button
                    type="button"
                    key={value}
                    data-rarity={value}
                    aria-pressed={rarity === value}
                    onClick={() => setRarity(value)}
                  >
                    {value === "all" ? "TODOS" : RARITY_LABEL[value].toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="lw-id__scroll">
                {usingFallback && <p className="lw-id__hint">Catálogo de demostración: equipamiento local.</p>}
                {loading ? (
                  <p className="lw-id__hint">Cargando ítems…</p>
                ) : shown.length === 0 ? (
                  <div className="lw-id__empty">
                    <strong>NO HAY ÍTEMS EN ESTE FILTRO</strong>
                    <p>Probá con TODOS para ver el catálogo completo.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSlot("all");
                        setRarity("all");
                      }}
                    >
                      VER TODOS LOS ÍTEMS
                    </button>
                  </div>
                ) : (
                  <div className="lw-id__items">
                    {shown.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="lw-id__item"
                        data-rarity={item.rarity}
                        data-equipped={item.equipped}
                        data-locked={!item.owned}
                        aria-pressed={item.equipped}
                        disabled={!item.owned || busyId === item.id}
                        onClick={() => void equip(item.id)}
                      >
                        <span className="lw-id__item-art">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              loading="lazy"
                              draggable={false}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span aria-hidden="true">{item.icon}</span>
                          )}
                        </span>
                        {item.equipped && (
                          <span className="lw-id__item-check" aria-label="Equipado">
                            <CheckIcon />
                          </span>
                        )}
                        <strong>{item.name}</strong>
                        <small>{RARITY_LABEL[item.rarity]}</small>
                        {!item.owned && (
                          <em>
                            <LockIcon /> NIV. {item.requiredLevel}
                          </em>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* ===== Guardar ===== */}
        <div className="lw-id__savebar">
          {error && (
            <p role="alert" className="lw-id__error">
              {error}
            </p>
          )}
          {done && (
            <p role="status" className="lw-id__saved">
              Identidad guardada ✓
            </p>
          )}
          <button
            type="button"
            className="lw-id__save"
            disabled={saving}
            onClick={async () => setDone(await save(draft))}
          >
            {saving ? (
              "GUARDANDO…"
            ) : (
              <>
                <CheckIcon size={16} /> GUARDAR CAMBIOS
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}