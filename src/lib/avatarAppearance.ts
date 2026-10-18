export type AvatarAppearance = { skin: string; hair: string; hairColor: string; expression: string; face: string };
export const DEFAULT_APPEARANCE: AvatarAppearance = { skin: "#c58b67", hair: "short", hairColor: "#241b1b", expression: "neutral", face: "oval" };
export const SKINS = ["#f4c9a6", "#dfad85", "#c58b67", "#a46a4b", "#805039", "#573526"];
export const HAIR_COLORS = ["#241b1b", "#513425", "#9a6541", "#d5b16b", "#8d3331", "#d9d9d9"];
export const HAIRS = ["short", "fade", "curly", "long", "buzz", "side", "afro", "spiky", "melena", "coleta"] as const;
export function sanitizeAppearance(raw: unknown): AvatarAppearance {
 const x = (raw && typeof raw === "object" ? raw : {}) as Record<string,unknown>;
 return { skin: SKINS.includes(String(x.skin)) ? String(x.skin) : DEFAULT_APPEARANCE.skin,
 hair: HAIRS.includes(x.hair as typeof HAIRS[number]) ? String(x.hair) : DEFAULT_APPEARANCE.hair,
 hairColor: HAIR_COLORS.includes(String(x.hairColor)) ? String(x.hairColor) : DEFAULT_APPEARANCE.hairColor,
 expression: ["neutral","smile","focused"].includes(String(x.expression)) ? String(x.expression) : "neutral",
 face: ["oval","round","angular","long","soft","square"].includes(String(x.face)) ? String(x.face) : "oval" };
}
