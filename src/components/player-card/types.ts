// src/components/player-card/types.ts

export type PlayerPosition = "ARQ" | "CIE" | "ALA" | "PIV";
/** G = ganó, E = empató, P = perdió. */
export type MatchResult = "G" | "E" | "P";

/** Los seis pilares de desarrollo personal, 0–99. Se muestran como atributos de futsal. */
export type LupiAttributes = {
  disciplina: number;
  foco: number;
  energia: number;
  mentalidad: number;
  vinculos: number;
  aprendizaje: number;
};

/** Datos públicos del perfil. Todo opcional hasta conectar Supabase. */
export type PlayerProfile = {
  position: PlayerPosition;
  shirtNumber: number;
  ovr: number;
  xp: number;
  xpToNext: number;
  streakDays: number;
  /** Últimos 5 resultados, del más viejo al más reciente. */
  form: MatchResult[];
  attributes: LupiAttributes;
};

export type PlayerCompetitiveStats = {
  matchesPlayed?: number | null;
  wins?: number | null;
  achievements?: { id: string; title: string; icon?: string }[];
};

export type PlayerCardTab = "perfil" | "vestuario" | "vitrina" | "desafiar";

export type DailyChallengeToast = {
  id: string;
  title: string;
  progress: number;
  requirement: number;
  rewardXp?: number;
  rewardCoins?: number;
};
