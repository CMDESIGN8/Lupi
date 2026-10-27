import { supabase } from "../lib/supabaseClient";
export type LeagueRecapData = { id: string; name: string; rows: { user_id: string; nickname: string; points: number; exacts: number; picks: number; round_position: number; before_position: number; after_position: number }[] };
export type League = { id: string; name: string; crest: string; owner_id: string; invite_code: string };
export type Rank = { user_id: string; nickname: string; position: number; round_points: number; total_points: number };
export type Match = { id: string; home: string; away: string; category: string; starts_at: string; home_score: number | null; away_score: number | null };
export type ProdeRound = { id: string; name: string; published: boolean; matches: Match[] };
export type Ticket = Record<string, { home: string; away: string }>;
export const prodeService = {
  async rankingBoard(league: string | null): Promise<{ round_name: string | null; matches_count?: number; validated_count?: number; rows: Rank[] }> { const { data, error } = await supabase.rpc("lupi_prode_ranking_board", { p_league: league }); if (error) throw error; return data; },
  async recap(league: string): Promise<LeagueRecapData[]> { const { data, error } = await supabase.rpc("lupi_prode_league_recap", { p_league: league }); if (error) throw error; return data || []; },
  async leagues(): Promise<League[]> { const { data, error } = await supabase.from("lupi_prode_leagues").select("*").order("created_at"); if (error) throw error; return data || []; },
  async nickname(user: string): Promise<string> { const { data, error } = await supabase.from("lupi_prode_players").select("nickname").eq("user_id", user).maybeSingle(); if (error) throw error; return data?.nickname || ""; },
  async setNickname(name: string) { const { error } = await supabase.rpc("lupi_prode_set_nickname", { p_name: name }); if (error) throw error; },
  async create(name: string, crest: string): Promise<string> { const { data, error } = await supabase.rpc("lupi_prode_create_league", { p_name: name, p_crest: crest }); if (error) throw error; return data; },
  async join(code: string): Promise<string> { const { data, error } = await supabase.rpc("lupi_prode_join_league", { p_code: code }); if (error) throw error; return data; },
  async ranking(league: string | null): Promise<Rank[]> { const { data, error } = await supabase.rpc("lupi_prode_ranking", { p_league: league }); if (error) throw error; return data || []; },
  async rounds(): Promise<ProdeRound[]> { const { data, error } = await supabase.rpc("lupi_prode_rounds_available"); if (error) throw error; return data || []; },
  async picks(user: string): Promise<Ticket> { const { data, error } = await supabase.from("lupi_prode_picks").select("match_id,home_score,away_score").eq("user_id", user); if (error) throw error; return Object.fromEntries((data || []).map(p => [p.match_id, { home: String(p.home_score), away: String(p.away_score) }])); },
  async save(round: string, ticket: Ticket, matches: Match[]) { const { error } = await supabase.rpc("lupi_prode_save_ticket", { p_round: round, p_picks: matches.map(m => ({ match_id: m.id, ...ticket[m.id] })) }); if (error) throw error; },
};
export function prodeError(error: unknown): string { const e = error as { code?: string; message?: string }; if (["42P01", "PGRST202", "PGRST205"].includes(e?.code || "")) return "Falta activar Prode en la base de datos. Ejecutá la migración incluida."; return e?.message || "No pudimos completar la acción. Intentá nuevamente."; }

export type AdminRound = { id: string; name: string; active: boolean; created_at: string };
export const prodeAdmin = {
  async jornada(name: string, rival: string, floresLocal: boolean, schedules: { division: number; starts_at: string }[]): Promise<string> {
    const { data, error } = await supabase.rpc("lupi_prode_admin_jornada", { p_name: name, p_rival: rival, p_flores_local: floresLocal, p_schedules: schedules });
    if (error) throw error;
    return data;
  },
  async allowed(): Promise<boolean> { const { data, error } = await supabase.rpc("lupi_prode_is_admin"); if (error) throw error; return data === true; },
  async rounds(): Promise<AdminRound[]> { const { data, error } = await supabase.from("lupi_prode_rounds").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; },
  async matches(round: string): Promise<Match[]> { const { data, error } = await supabase.from("lupi_prode_matches").select("*").eq("round_id", round).order("starts_at").order("id"); if (error) throw error; return data || []; },
  async round(id: string | null, name: string): Promise<string> { const { data, error } = await supabase.rpc("lupi_prode_admin_round", { p_id: id, p_name: name }); if (error) throw error; return data; },
  async match(id: string | null, round: string, home: string, away: string, category: string, starts: string) { const { error } = await supabase.rpc("lupi_prode_admin_match", { p_id: id, p_round: round, p_home: home, p_away: away, p_category: category, p_starts: starts }); if (error) throw error; },
  async publish(round: string) { const { error } = await supabase.rpc("lupi_prode_admin_publish", { p_round: round }); if (error) throw error; },
  async result(match: string, home: number, away: number) { const { error } = await supabase.rpc("lupi_prode_admin_result", { p_match: match, p_home: home, p_away: away }); if (error) throw error; },
};

export type RealMatchResult = Match & { round_id: string; lupi_prode_rounds: { name: string } | null };
export async function getRealMatchResults(): Promise<RealMatchResult[]> {
  const { data, error } = await supabase.rpc("lupi_prode_fixture");
  if (error) throw error;
  return (data || []).map((row: Match & { round_id: string; round_name: string }) => ({
    ...row, lupi_prode_rounds: { name: row.round_name },
  }));
}
