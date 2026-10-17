// src/components/player-card/profile-utils.ts
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import type { LupiAttributes, MatchResult, PlayerPosition, PlayerProfile } from "./types";

const KEYS: (keyof LupiAttributes)[] = ["disciplina", "foco", "energia", "mentalidad", "vinculos", "aprendizaje"];

export function computeOvr(attributes: LupiAttributes): number {
  const sum = KEYS.reduce((acc, key) => acc + attributes[key], 0);
  return Math.round(sum / KEYS.length);
}

const POSITION_BY_TOP: Record<keyof LupiAttributes, PlayerPosition> = {
  disciplina: "CIE",
  mentalidad: "ARQ",
  foco: "PIV",
  aprendizaje: "PIV",
  energia: "ALA",
  vinculos: "ALA",
};

/** La posición sale del atributo dominante. */
export function derivePosition(attributes: LupiAttributes): PlayerPosition {
  const top = KEYS.reduce((best, key) => (attributes[key] > attributes[best] ? key : best), KEYS[0]);
  return POSITION_BY_TOP[top];
}

/* ---------- Perfil de ejemplo (solo para ver el diseño antes de conectar Supabase) ---------- */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Perfil determinístico por jugador. NO son datos reales: usarlo solo en desarrollo. */
export function mockProfileFor(player: Pick<LobbyPlayer, "userId" | "level">): PlayerProfile {
  const rand = rng(hash(player.userId));
  const base = 24 + Math.min(player.level, 30) * 1.6;
  const pick = () => Math.max(12, Math.min(96, Math.round(base + rand() * 38 - 6)));
  const attributes: LupiAttributes = {
    disciplina: pick(),
    foco: pick(),
    energia: pick(),
    mentalidad: pick(),
    vinculos: pick(),
    aprendizaje: pick(),
  };
  const results: MatchResult[] = ["G", "E", "P"];
  const xpToNext = 100 + player.level * 40;
  return {
    position: derivePosition(attributes),
    shirtNumber: 1 + Math.floor(rand() * 98),
    ovr: computeOvr(attributes),
    xp: Math.floor(rand() * xpToNext * 0.9),
    xpToNext,
    streakDays: Math.floor(rand() * 21),
    form: Array.from({ length: 5 }, () => results[Math.floor(rand() * 3)]),
    attributes,
  };
}
