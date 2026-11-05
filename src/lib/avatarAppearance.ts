export type AvatarMood = "presentation" | "focus" | "celebrate";
export type AvatarExpressionSet = Record<AvatarMood, string>;
export const DEFAULT_EXPRESSIONS: AvatarExpressionSet = { presentation: "smile", focus: "determined", celebrate: "happy" };
export const EXPRESSION_IDS = ["neutral", "smile", "focused", "surprised", "determined", "happy", "wink", "laugh", "worried", "angry", "sad"] as const;
export type AvatarAppearance = {
  expressionPresets?: AvatarExpressionSet;
  skin: string; hair: string; hairColor: string; expression: string; face: string;
  eyes: string; eyeColor: string; brows: string; nose: string; mouth: string;
};

export const SKINS = ["#f4c9a6", "#dfad85", "#c58b67", "#a46a4b", "#805039", "#573526"];
export const HAIR_PALETTE = [
  { color: "#241b1b", name: "Negro" }, { color: "#513425", name: "Castaño oscuro" },
  { color: "#9a6541", name: "Castaño miel" }, { color: "#d5b16b", name: "Rubio dorado" },
  { color: "#8d3331", name: "Caoba" }, { color: "#d9d9d9", name: "Plateado" },
  { color: "#171e34", name: "Negro azulado" }, { color: "#706157", name: "Castaño ceniza" },
  { color: "#bc673c", name: "Cobrizo" }, { color: "#e8ce9a", name: "Rubio claro" },
  { color: "#b9adb0", name: "Rubio ceniza" }, { color: "#f0ece5", name: "Blanco perla" },
  { color: "#ac2639", name: "Rojo intenso" }, { color: "#61283e", name: "Bordó" },
  { color: "#e482a3", name: "Rosa" }, { color: "#bc4d9a", name: "Fucsia" },
  { color: "#583e91", name: "Violeta" }, { color: "#ae99d1", name: "Lavanda" },
  { color: "#304f9e", name: "Azul" }, { color: "#23376a", name: "Azul noche" },
  { color: "#57b4c6", name: "Celeste" }, { color: "#2e8982", name: "Turquesa" },
  { color: "#356455", name: "Verde bosque" }, { color: "#87b69a", name: "Verde menta" },
];
export const HAIR_COLORS = HAIR_PALETTE.map(({ color }) => color);
export const HAIRS = ["short", "fade", "curly", "long", "buzz", "side", "afro", "spiky", "melena", "coleta"] as const;
export const EYES = ["normal", "large", "almond", "bright", "sharp", "relaxed"] as const;
/** Legacy names remain readable; the editor offers only distinct drawings. */
export function resolveEyeStyle(value: string): typeof EYES[number] {
  const aliases: Record<string, typeof EYES[number]> = {
    "anime-classic": "normal", soft: "large", "anime-gentle": "large",
    "anime-competitive": "sharp", "anime-calm": "relaxed",
  };
  return aliases[value] ?? (EYES.includes(value as typeof EYES[number]) ? value as typeof EYES[number] : "normal");
}
export const EYE_COLORS = ["#38c6b3", "#4b8cff", "#a66ae0", "#6bbf59", "#d49b36", "#75452f", "#263548", "#e45d72"] as const;
export const BROWS = ["natural", "straight", "arched", "bold"] as const;
export const NOSES = ["soft", "small", "round", "defined"] as const;
export const MOUTHS = ["normal", "small", "wide", "full"] as const;

export const DEFAULT_APPEARANCE: AvatarAppearance = {
  skin: "#c58b67", hair: "short", hairColor: "#241b1b", expression: "neutral",
  face: "oval", eyes: "normal", eyeColor: "#38c6b3", brows: "natural", nose: "soft", mouth: "normal",
};

/** Devuelve `value` si está en `allowed`, o `fallback` si no. */
function pick(allowed: readonly string[], value: unknown, fallback: string): string {
  const s = String(value);
  return allowed.includes(s) ? s : fallback;
}

export function sanitizeAppearance(raw: unknown): AvatarAppearance {
  const x = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_APPEARANCE;
  const presets = x.expressionPresets && typeof x.expressionPresets === "object" ? x.expressionPresets as Record<string, unknown> : {};
  return {
    expressionPresets: { presentation: pick(EXPRESSION_IDS, presets.presentation, DEFAULT_EXPRESSIONS.presentation), focus: pick(EXPRESSION_IDS, presets.focus, DEFAULT_EXPRESSIONS.focus), celebrate: pick(EXPRESSION_IDS, presets.celebrate, DEFAULT_EXPRESSIONS.celebrate) },
    skin: pick(SKINS, x.skin, d.skin),
    hair: pick(HAIRS, x.hair, d.hair),
    hairColor: pick(HAIR_COLORS, x.hairColor, d.hairColor),
    expression: pick(["neutral", "smile", "focused", "surprised", "determined", "happy", "wink", "laugh", "worried", "angry", "sad"], x.expression, d.expression),
    face: pick(["oval", "round", "angular", "long", "soft", "square"], x.face, d.face),
    eyes: resolveEyeStyle(String(x.eyes ?? d.eyes)),
    eyeColor: pick(EYE_COLORS, x.eyeColor, d.eyeColor),
    brows: pick(BROWS, x.brows, d.brows),
    nose: pick(NOSES, x.nose, d.nose),
    mouth: pick(MOUTHS, x.mouth, d.mouth),
  };
}
