export type AvatarAppearance = {
  skin: string; hair: string; hairColor: string; expression: string; face: string;
  eyes: string; eyeColor: string; brows: string; nose: string; mouth: string;
};

export const SKINS = ["#f4c9a6", "#dfad85", "#c58b67", "#a46a4b", "#805039", "#573526"];
export const HAIR_COLORS = ["#241b1b", "#513425", "#9a6541", "#d5b16b", "#8d3331", "#d9d9d9"];
export const HAIRS = ["short", "fade", "curly", "long", "buzz", "side", "afro", "spiky", "melena", "coleta"] as const;
export const EYES = ["normal", "large", "almond", "bright"] as const;
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
  return {
    skin: pick(SKINS, x.skin, d.skin),
    hair: pick(HAIRS, x.hair, d.hair),
    hairColor: pick(HAIR_COLORS, x.hairColor, d.hairColor),
    expression: pick(["neutral", "smile", "focused", "surprised", "determined", "happy"], x.expression, d.expression),
    face: pick(["oval", "round", "angular", "long", "soft", "square"], x.face, d.face),
    eyes: pick(EYES, x.eyes, d.eyes),
    eyeColor: pick(EYE_COLORS, x.eyeColor, d.eyeColor),
    brows: pick(BROWS, x.brows, d.brows),
    nose: pick(NOSES, x.nose, d.nose),
    mouth: pick(MOUTHS, x.mouth, d.mouth),
  };
}
