import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../src/lib/supabaseClient', () => ({ supabase: { rpc: h.rpc, from: vi.fn() } }));
import { standingFrom, type PvpRow } from '../src/lib/communityStanding';
import { CommunityStandingLine } from '../src/components/CommunityStandingLine';

const row = (user_id: string, competitive_points: number, played = 3): PvpRow => ({ user_id, username: user_id, wins: 0, losses: 0, draws: 0, played, competitive_points });
const ranking = [row('a', 12), row('b', 9), row('me', 7, 4), row('d', 7), row('e', 1)];

describe('standingFrom', () => {
  it('posición, puntos y partidos', () => expect(standingFrom(ranking, 'me')).toMatchObject({ position: 3, total: 5, points: 7, played: 4 }));
  it('a menos de una victoria (3 pts) del de arriba: con 1 victoria lo pasás', () => expect(standingFrom([row('a', 9), row('me', 7)], 'me')?.hint).toBe('A 2 pts del #1: ¡con 1 victoria lo pasás!'));
  it('a justo una victoria: te iguala', () => expect(standingFrom([row('a', 10), row('me', 7)], 'me')?.hint).toBe('A 3 pts del #1: una victoria te iguala'));
  it('más lejos: solo informa la diferencia (singular y plural)', () => {
    expect(standingFrom(ranking, 'e')?.hint).toBe('A 6 pts del #4');
    expect(standingFrom([row('a', 5), row('me', 4)].map(r => r), 'me')?.hint).toBe('A 1 pt del #1: ¡con 1 victoria lo pasás!');
  });
  it('empatado en puntos con el de arriba', () => expect(standingFrom([row('a', 7), row('me', 7)], 'me')?.hint).toBe('Empatado en puntos con el #1: una victoria te adelanta'));
  it('primero con ventaja, primero empatado y primero solo', () => {
    expect(standingFrom([row('me', 12), row('b', 9)], 'me')?.hint).toBe('¡Vas primero! Sacás 3 pts al #2');
    expect(standingFrom([row('me', 9), row('b', 9)], 'me')?.hint).toBe('¡Vas primero! Empatado con el #2: una victoria te despega');
    expect(standingFrom([row('me', 3)], 'me')).toMatchObject({ position: 1, total: 1, hint: null });
  });
  it('no inventa nada si no estás en el ranking o los datos son inválidos', () => {
    expect(standingFrom(ranking, 'nadie')).toBeNull();
    expect(standingFrom([], 'me')).toBeNull();
    expect(standingFrom(null, 'me')).toBeNull();
    expect(standingFrom({} as any, 'me')).toBeNull();
  });
  it('tolera puntos como texto o nulos', () => {
    expect(standingFrom([{ ...row('a', 0), competitive_points: '9' as any }, { ...row('me', 0), competitive_points: null as any }], 'me')).toMatchObject({ position: 2, points: 0, hint: 'A 9 pts del #1' });
  });
});

describe('CommunityStandingLine', () => {
  beforeEach(() => h.rpc.mockReset());
  afterEach(cleanup);
  const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
  const COMM = '11111111-1111-4111-8111-111111111111';

  it('consulta el ranking de la comunidad cuando se registra el resultado y muestra tu lugar', async () => {
    h.rpc.mockResolvedValue({ data: ranking, error: null });
    const { container, rerender } = render(<CommunityStandingLine communityId={COMM} userId="me" refreshKey="" />);
    await flush(); expect(h.rpc).not.toHaveBeenCalled();                  // el duelo todavía no se registró
    rerender(<CommunityStandingLine communityId={COMM} userId="me" refreshKey="✓ Resultado confirmado" />); await flush();
    expect(h.rpc).toHaveBeenCalledWith('get_community_pvp_ranking', { p_community_id: COMM });
    expect(container.querySelector('.csl')?.textContent).toContain('TU POSICIÓN ESTA SEMANA #3');
    expect(container.querySelector('.csl small')?.textContent).toBe('7 pts · 4 PJ · A 2 pts del #2: ¡con 1 victoria lo pasás!');
  });
  it('sin comunidad (duelo común) no consulta ni muestra nada', async () => {
    const { container } = render(<CommunityStandingLine userId="me" refreshKey="listo" />); await flush();
    expect(h.rpc).not.toHaveBeenCalled(); expect(container.querySelector('.csl')).toBeNull();
  });
  it('si la consulta falla, no muestra nada (no rompe la pantalla de resultado)', async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: 'no existe la migración 007' } });
    const { container } = render(<CommunityStandingLine communityId={COMM} userId="me" refreshKey="listo" />); await flush();
    expect(container.querySelector('.csl')).toBeNull();
  });
  it('si todavía no aparecés en el ranking (esperando confirmación del rival), no muestra nada', async () => {
    h.rpc.mockResolvedValue({ data: [row('a', 3)], error: null });
    const { container } = render(<CommunityStandingLine communityId={COMM} userId="me" refreshKey="El ranking espera la confirmación del rival." />); await flush();
    expect(container.querySelector('.csl')).toBeNull();
  });
  it('una respuesta tardía de una pantalla anterior no pisa a la actual', async () => {
    let late!: (v: unknown) => void;
    h.rpc.mockImplementationOnce(() => new Promise(r => { late = r; })).mockResolvedValueOnce({ data: [row('me', 20)], error: null });
    const { container, rerender, unmount } = render(<CommunityStandingLine communityId={COMM} userId="me" refreshKey="uno" />);
    rerender(<CommunityStandingLine communityId={COMM} userId="me" refreshKey="dos" />); await flush();
    await act(async () => { late({ data: [row('a', 99), row('me', 1)], error: null }); await Promise.resolve(); });
    expect(container.querySelector('.csl b')?.textContent).toBe('#1');
    unmount();
  });
});
