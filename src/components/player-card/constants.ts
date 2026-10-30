// src/components/player-card/constants.ts
import type { ItemSlot } from "../../hooks/useAuraInventory";
import type { LobbyActivity } from "../../hooks/useLobbyPresence";
import type { ChallengeGame } from "../../hooks/useLobbyChallenges";
import type { ReportReason } from "../../hooks/useLobbyModeration";
import type { LupiAttributes, PlayerPosition } from "./types";

export const SLOT_ORDER: ItemSlot[] = ["top", "bottom", "boots", "accessory"];
export const SLOT_LABEL: Record<string, string> = {
  top: "Remera",
  bottom: "Short",
  boots: "Botines",
  accessory: "Accesorio",
};

export const RARITY_ORDER = ["common", "rare", "epic", "legendary"] as const;
export const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
export const RARITY_COLOR: Record<string, string> = {
  common: "#9aa4a0",
  rare: "#3b9bff",
  epic: "#b061ff",
  legendary: "#ffb629",
};
export const RARITY_LABEL: Record<string, string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria",
};

export const ACTIVITY_LABEL: Record<LobbyActivity, string> = {
  lobby: "En el lobby",
  "in-match": "En partido",
  idle: "Ausente",
};

export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "abuso", label: "Insultos o lenguaje ofensivo" },
  { id: "acoso", label: "Acoso" },
  { id: "otro", label: "Otro" },
];

export const POSITION_LABEL: Record<PlayerPosition, string> = {
  ARQ: "Arquero",
  CIE: "Cierre",
  ALA: "Ala",
  PIV: "Pívot",
};

/**
 * Cada pilar personal se juega como un atributo de futsal.
 * El orden es el del radar: arranca arriba y sigue en sentido horario.
 */
export const ATTRIBUTE_META: { key: keyof LupiAttributes; code: string; life: string; futsal: string }[] = [
  { key: "foco", code: "REM", life: "Foco", futsal: "Remate" },
  { key: "vinculos", code: "PAS", life: "Vínculos", futsal: "Pase" },
  { key: "energia", code: "FIS", life: "Energía", futsal: "Físico" },
  { key: "disciplina", code: "MAR", life: "Disciplina", futsal: "Marca" },
  { key: "mentalidad", code: "FRI", life: "Mentalidad", futsal: "Frialdad" },
  { key: "aprendizaje", code: "VIS", life: "Aprendizaje", futsal: "Visión" },
];

export const CHALLENGE_OPTIONS: {
  game: ChallengeGame;
  icon: string;
  title: string;
  description: string;
  available: boolean;
}[] = [
  { game: "rps", icon: "✊", title: "Piedra, papel o tijera", description: "Duelo por rondas", available: true },
  { game: "futsal", icon: "⚽", title: "Futsal", description: "Ataque y defensa · Duelo PvP amistoso", available: true },
  { game: "trivia", icon: "🧠", title: "Preguntados", description: "Trivia de fútbol · 5 preguntas PvP", available: true },
  { game: "truco", icon: "🃏", title: "Truco", description: "Próximamente", available: false },
];

/** Imagen oficial del par de botines AURA XP: se usa siempre en lugar de la del ítem. */
export const BOOTS_OFFICIAL_IMAGE = "/items/equipped/aura-boots.png";

export function wornImageSrc(item: { slot: string; imageUrl?: string | null; equippedImageUrl?: string | null }): string | undefined {
  // En el vestuario mostrar la miniatura del ítem real, sin sustituir todos
  // los botines por AURA BOOTS (Flores y futuros modelos tienen su propio arte).
  return item.imageUrl ?? item.equippedImageUrl ?? undefined;
}
