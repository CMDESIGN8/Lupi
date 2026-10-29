import { supabase } from './supabaseClient';
import type { TurnResult, MomentResult } from '../utils/battleEngine';

/** Server-driven match API. Never send scores, seed, deck stats or outcome. */
type MatchResponse = {
  session_id?: string;
  state_version?: number;
  turn_index?: number;
  user_score?: number;
  opponent_score?: number;
  turn?: TurnResult;
  result?: MomentResult;
  match_id?: string;
  error?: string;
  active_session?: { id: string; opponent_key: string } | null;
  session?: {
    id: string;
    opponent_key: string;
    turn_index: number;
    state_version: number;
    user_score: number;
    opponent_score: number;
    simulation_state: Record<string, unknown>;
    pending_decision: Record<string, unknown> | null;
    state: 'started' | 'completed' | 'expired';
    expires_at: string;
  };
};

async function invokeMatch(payload: Record<string, unknown>): Promise<MatchResponse> {
  const { data, error } = await supabase.functions.invoke<MatchResponse>(
    'verified-match', { body: payload },
  );
  if (error) throw new Error(error.message || 'No se pudo conectar con el partido');
  if (!data || data.error) throw new Error(data?.error || 'Respuesta inválida del partido');
  return data;
}

export const verifiedMatchApi = {
  async start(opponent: string): Promise<{ id: string; version: number }> {
    const data = await invokeMatch({ action: 'start', opponent });
    if (!data.session_id || data.state_version !== 0)
      throw new Error('La sesión no pudo iniciarse');
    return { id: data.session_id, version: data.state_version };
  },
  async active(): Promise<{ id: string; opponent_key: string } | null> {
    const data = await invokeMatch({ action: 'active' });
    if (data.active_session === undefined)
      throw new Error('No se pudo consultar el partido pendiente');
    return data.active_session;
  },
  async resume(sessionId: string) {
    const data = await invokeMatch({ action: 'resume', session_id: sessionId });
    if (!data.session || data.session.id !== sessionId ||
        !Number.isSafeInteger(data.session.state_version) ||
        !Number.isSafeInteger(data.session.turn_index))
      throw new Error('El servidor no devolvió una sesión válida');
    return data.session;
  },
  async turn(sessionId: string, version: number) {
    const data = await invokeMatch({
      action: 'turn', session_id: sessionId, expected_version: version,
    });
    if (!data.turn || typeof data.state_version !== 'number')
      throw new Error('El servidor no devolvió un turno válido');
    return { turn: data.turn, version: data.state_version,
      userScore: data.user_score ?? 0, opponentScore: data.opponent_score ?? 0 };
  },
  async decision(sessionId: string, version: number, optionId: string) {
    const data = await invokeMatch({
      action: 'decision', session_id: sessionId,
      expected_version: version, option_id: optionId,
    });
    if (!data.result || typeof data.state_version !== 'number')
      throw new Error('El servidor no resolvió la decisión');
    return { result: data.result, version: data.state_version,
      userScore: data.user_score ?? 0, opponentScore: data.opponent_score ?? 0 };
  },
  async finish(sessionId: string) {
    const data = await invokeMatch({ action: 'finish', session_id: sessionId });
    if (!data.match_id) throw new Error('El partido no fue validado');
    return data;
  },
};
