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
  reward?: {xp:number;coins:number;credited:boolean} | null;
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
  const started=performance.now();
  let serverTiming:string|null=null;let region:string|null=null;
  try {
  const configuredRegion=import.meta.env.VITE_MATCH_FUNCTION_REGION?.trim();
  const { data, error, response } = await supabase.functions.invoke<MatchResponse>(
    'verified-match', { body: payload, ...(configuredRegion?{headers:{'x-region':configuredRegion}}:{}) },
  );
  serverTiming=response?.headers.get('Server-Timing')??null;region=response?.headers.get('X-Lupi-Region')??null;
  if (error) {
    // Supabase keeps the JSON rejection body on the HTTP error response.
    const context = (error as {context?: Response}).context;
    const rejection = response ?? (context instanceof Response ? context : undefined);
    let reason: string | undefined;
    if (rejection) {
      try {
        const body: unknown = await rejection.clone().json();
        if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string')
          reason = body.error;
      } catch { /* A gateway may return HTML or an empty body. */ }
    }
    const status = rejection?.status;
    const detail = reason || error.message || 'No se pudo conectar con el partido';
    throw new Error(`${String(payload.action)}${status ? ` · HTTP ${status}` : ''}: ${detail}`);
  }
  if (!data || data.error) throw new Error(data?.error || 'Respuesta inválida del partido');
  return data;
  } finally {
    const elapsed=performance.now()-started;
    performance.measure(`lupi:match:${String(payload.action)}`,{start:started,end:performance.now()});
    if(import.meta.env.DEV){
      const breakdown=Object.fromEntries((serverTiming??'').split(',').flatMap(part=>{const match=part.trim().match(/^(auth|read|write|total);dur=([0-9.]+)$/);return match?[[match[1],Number(match[2])]]:[];}));
      const metrics={action:String(payload.action),clientMs:Math.round(elapsed),region:region??'sin diagnóstico de servidor',...Object.fromEntries(Object.entries(breakdown).map(([key,value])=>[`${key}Ms`,Math.round(value as number)]))};
      console.info('[Lupi match timing]',metrics);
      if(elapsed>1500)console.warn(`[Lupi match] ${String(payload.action)}: ${Math.round(elapsed)} ms`,serverTiming??'Actualizar verified-match para separar autenticación y consultas');
    }
  }
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
