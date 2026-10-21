export type AvatarAppearance = { skin: string; hair: string; hairColor: string; expression: string; face: string; eyes: string; brows: string; nose: string; mouth: string };
export const DEFAULT_APPEARANCE: AvatarAppearance = { skin: "#c58b67", hair: "short", hairColor: "#241b1b", expression: "neutral", face: "oval", eyes: "normal", brows: "natural", nose: "soft", mouth: "normal" };
export const SKINS = ["#f4c9a6", "#dfad85", "#c58b67", "#a46a4b", "#805039", "#573526"];
export const HAIR_COLORS = ["#241b1b", "#513425", "#9a6541", "#d5b16b", "#8d3331", "#d9d9d9"];
export const HAIRS = ["short", "fade", "curly", "long", "buzz", "side", "afro", "spiky", "melena", "coleta"] as const;
export function sanitizeAppearance(raw: unknown): AvatarAppearance {
 const x = (raw && typeof raw === "object" ? raw : {}) as Record<string,unknown>;
 return { skin: SKINS.includes(String(x.skin)) ? String(x.skin) : DEFAULT_APPEARANCE.skin,
 hair: HAIRS.includes(x.hair as typeof HAIRS[number]) ? String(x.hair) : DEFAULT_APPEARANCE.hair,
 hairColor: HAIR_COLORS.includes(String(x.hairColor)) ? String(x.hairColor) : DEFAULT_APPEARANCE.hairColor,
 expression: ["neutral","smile","focused"].includes(String(x.expression)) ? String(x.expression) : "neutral",
 face: ["oval","round","angular","long","soft","square"].includes(String(x.face)) ? String(x.face) : "oval",
  eyes: EYES.includes(String(x.eyes)) ? String(x.eyes) : "normal",
  brows: BROWS.includes(String(x.brows)) ? String(x.brows) : "natural",
  nose: NOSES.includes(String(x.nose)) ? String(x.nose) : "soft",
  mouth: MOUTHS.includes(String(x.mouth)) ? String(x.mouth) : "normal" };
}

export const EYES = ["normal", "large", "almond", "bright"] as const;
export const BROWS = ["natural", "straight", "arched", "bold"] as const;
export const NOSES = ["soft", "small", "round", "defined"] as const;
export const MOUTHS = ["normal", "small", "wide", "full"] as const;
