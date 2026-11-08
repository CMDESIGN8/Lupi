import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../src/lib/supabaseClient', () => ({ supabase: { rpc: h.rpc, from: vi.fn() } }));
vi.mock('../src/components/AvatarFace', async () => { const R = await import('react'); return { AvatarFace: (p: any) => R.createElement('span', { 'data-face': '', 'data-expression': p.appearance?.expression }) }; });
vi.mock('../src/components/OwnedCardPortrait', async () => { const R = await import('react'); return { OwnedCardPortrait: (p: any) => R.createElement('span', { 'data-portrait': '', 'data-expression': p.appearanceOverride?.expression ?? 'none', 'data-mood': p.mood ?? '' }) }; });
vi.mock('../src/components/match/ArenaAvatar', () => ({ ArenaAvatar: () => null }));
vi.mock('../src/components/LupiStoryPose', async () => { const R = await import('react'); return { LupiStoryPose: (p: any) => R.createElement('span', { 'data-lupi': '', 'data-pose': p.pose }) }; });
vi.mock('../src/components/SkillMatchReward', async () => { const R = await import('react'); return { SkillMatchReward: () => R.createElement('span', { 'data-testid': 'skill-reward' }) }; });
vi.mock('../src/components/DuelAnimeEntrance', () => ({ DuelAnimeEntrance: () => null }));
vi.mock('../src/components/DuelConnectionNotice', () => ({ DuelConnectionNotice: () => null }));

import { RockPaperScissors } from '../src/components/RpsAnimeDuel';
import { useDuelReward } from '../src/hooks/useDuelReward';

const ME = 'me';
const base = { id: 'match-1', round: 1, hostWins: 0, guestWins: 0, status: 'playing', winnerId: null, mineSubmitted: false, opponentSubmitted: false, lastMoves: null };
const botChallenge: any = { id: 'match-1', gameType: 'rps', fromId: ME, toId: 'bot', fromName: 'Yo', toName: 'Lupi', vsBot: true, botIndex: 0 };
const pvpChallenge: any = { id: 'match-2', gameType: 'rps', fromId: ME, toId: 'rival1', fromName: 'Yo', toName: 'Rival', vsBot: false };
const REWARD = { ok: true, result: 'win', xp: 120, coins: 35, chest: null, vsBot: true, dailyLimit: 6, dailyPlayed: 1 };
const tick = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const meFace = (c: HTMLElement) => c.querySelectorAll('[data-face]')[0]?.getAttribute('data-expression');
const claims = () => h.rpc.mock.calls.filter(([n]) => n === 'duel_claim_reward');
const deferred = <T,>() => { let resolve!: (v: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };

/** Servidor simulado de un partido contra el bot: gano dos rondas seguidas. */
function botServer(claim: (n: number) => Promise<any> | any) {
  let plays = 0, claimCalls = 0;
  h.rpc.mockImplementation(async (name: string, args: any) => {
    if (name === 'duel_bot_open') return { data: { ...base }, error: null };
    if (name === 'duel_bot_play') {
      plays++;
      return { data: plays === 1
        ? { ...base, round: 2, hostWins: 1, lastMoves: { host: 'rock', guest: 'scissors' } }
        : { ...base, round: 2, hostWins: 2, status: 'finished', winnerId: ME, lastMoves: { host: 'paper', guest: 'rock' } }, error: null };
    }
    if (name === 'duel_claim_reward') return claim(++claimCalls);
    return { data: null, error: null };
  });
}

beforeEach(() => { vi.useFakeTimers(); h.rpc.mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Partido contra el bot: batalla completa', () => {
  it('cuenta, impacto, reacción de avatares y festejo final con la secuencia de expresiones prevista', async () => {
    botServer(async () => ({ data: REWARD, error: null }));
    const { container } = render(<RockPaperScissors challenge={botChallenge} meId={ME} onExit={() => {}} />);
    await tick(0);
    await tick(3600);
    expect(container.querySelector('.rpsf-banner b')?.textContent).toBe('¡PITAZO INICIAL!');
    expect(meFace(container)).toBe('determined'); // reposo, antes de jugar

    fireEvent.click(screen.getByRole('button', { name: /PIEDRA/ }));
    await tick(0);
    expect(container.querySelectorAll('.rps-choices button:disabled')).toHaveLength(3);
    await tick(50);
    expect(meFace(container)).toBe('focused');           // ¡PIEDRA!
    expect(container.querySelector('.rpsf-fx--chant')).not.toBeNull();
    await tick(380); expect(meFace(container)).toBe('determined'); // ¡PAPEL!
    await tick(380); expect(meFace(container)).toBe('angry');      // ¡TIJERA!
    await tick(380); // 1140 ms: choque
    expect(meFace(container)).toBe('surprised');
    expect(container.querySelector('[data-lupi]')?.getAttribute('data-pose')).toBe('surprised');
    expect(container.querySelector('.rpsf-impact')).not.toBeNull();
    expect(container.querySelector('.rpsf-bang b')?.textContent).toBe('¡PIEDRA GANA!');
    expect(container.querySelector('.rpsf-bang small')?.textContent).toBe('¡PUNTO PARA VOS!');
    expect(container.querySelector('.rps-clash__side:first-child')?.className).toContain('rpsf-winner');
    expect(container.querySelector('.rps-clash__side--rival')?.className).toContain('rpsf-loser');
    expect(container.querySelector('.rpsf-ball')).not.toBeNull();
    expect(container.querySelectorAll('.rpsf-confetti').length).toBeGreaterThan(0);
    await tick(500);
    expect(meFace(container)).toBe('happy');                         // reacciono a la ronda ganada
    expect(container.querySelector('[data-lupi]')?.getAttribute('data-pose')).toBe('sad');
    expect(container.querySelector('.rpsf-emote--me')).not.toBeNull();
    expect(container.querySelector('.rpsf-impact')).toBeNull();
    expect([...container.querySelectorAll('.rpsf-num')].map(n => n.textContent)).toEqual(['1', '0']);
    await tick(2000); // termina la revelación
    expect(container.querySelector('.rpsf-bang')).toBeNull();

    // Ronda 2 con la tecla 2 = PAPEL
    fireEvent.keyDown(window, { key: '2' });
    await tick(0);
    expect(h.rpc.mock.calls.filter(([n]) => n === 'duel_bot_play').map(([, a]) => a.p_choice)).toEqual(['rock', 'paper']);
    await tick(1140 + 420 + 50);
    expect(container.querySelector('.rpsf-bang b')?.textContent).toBe('¡PAPEL GANA!');
    expect(container.querySelector('.rpsf-bang')?.className).toContain('is-final');
    await tick(500);
    expect(meFace(container)).toBe('laugh');                            // festejo final
    expect(container.querySelector('[data-lupi]')?.getAttribute('data-pose')).toBe('sad');
    expect(container.querySelector('.rps-live h3')?.textContent).toBe('¡GANASTE!');
    expect(container.querySelectorAll('.rps-choices')).toHaveLength(0);
  });

  it('la última ronda (3/3) se anuncia como ronda de oro y activa el modo tensión', async () => {
    h.rpc.mockImplementation(async (name: string) => name === 'duel_bot_open' ? { data: { ...base, round: 3, hostWins: 1, guestWins: 1 }, error: null } : { data: null, error: null });
    const { container } = render(<RockPaperScissors challenge={botChallenge} meId={ME} onExit={() => {}} />);
    await tick(0); await tick(3600);
    expect(container.querySelector('.rpsf-banner b')?.textContent).toBe('¡RONDA DE ORO!');
    expect(container.querySelector('.rpsf-golden')).not.toBeNull();
    await tick(2100);
    expect(container.querySelector('.rpsf-banner')).toBeNull();
  });

  it('no deja jugar dos veces la misma ronda ni durante la cuenta', async () => {
    botServer(async () => ({ data: REWARD, error: null }));
    const { container } = render(<RockPaperScissors challenge={botChallenge} meId={ME} onExit={() => {}} />);
    await tick(3600);
    fireEvent.keyDown(window, { key: '1' }); fireEvent.keyDown(window, { key: '1' }); fireEvent.keyDown(window, { key: '3' });
    await tick(0);
    expect(h.rpc.mock.calls.filter(([n]) => n === 'duel_bot_play')).toHaveLength(1);
    await tick(100);
    fireEvent.keyDown(window, { key: '2' }); // en plena cuenta
    await tick(0);
    expect(h.rpc.mock.calls.filter(([n]) => n === 'duel_bot_play')).toHaveLength(1);
    expect(container.querySelector('.rps-arena')).not.toBeNull();
  });
});

describe('Recompensas', () => {
  async function playToTheEnd(challenge = botChallenge) {
    const view = render(<RockPaperScissors challenge={challenge} meId={ME} onExit={() => {}} />);
    await tick(3600);
    fireEvent.click(screen.getByRole('button', { name: /PIEDRA/ })); await tick(0);
    await tick(1140 + 2300 + 100);
    fireEvent.click(screen.getByRole('button', { name: /PAPEL/ })); await tick(0);
    return view;
  }

  it('se cobra UNA sola vez, con los parámetros correctos, y la carta de premio aparece recién al terminar la cuenta', async () => {
    const gate = deferred<any>();
    botServer(() => gate.promise);
    const { container } = await playToTheEnd();
    expect(claims()).toHaveLength(1);
    expect(claims()[0][1]).toEqual({ p_game: 'rps', p_match_id: 'match-1', p_vs_bot: true, p_bot_result: null, p_rival_id: null });
    // todavía en la cuenta: no hay carta ni progreso de habilidades
    expect(container.querySelector('.drc')).toBeNull();
    await tick(1140 + 420 + 100);
    // terminó la cuenta pero el servidor aún no confirmó: "Contando tu botín…" y SIN consultar habilidades todavía
    expect(container.querySelector('.drc')?.textContent).toContain('Contando tu botín');
    expect(screen.queryByTestId('skill-reward')).toBeNull();
    const progression = vi.fn(); window.addEventListener('lupi:progression-updated', progression);
    await act(async () => { gate.resolve({ data: REWARD, error: null }); await Promise.resolve(); });
    await tick(0);
    expect(container.querySelector('.drc')?.textContent).toContain('+120 XP');
    expect(container.querySelector('.drc')?.textContent).toContain('+35');
    expect(screen.getByTestId('skill-reward')).toBeTruthy();
    expect(progression).toHaveBeenCalledTimes(1);
    await tick(5000); // re-renderizados: no vuelve a cobrar
    expect(claims()).toHaveLength(1);
  });

  it('si el cobro falla se puede reintentar desde la carta (antes el botón no existía en este juego)', async () => {
    botServer(n => n === 1 ? { data: null, error: { message: 'boom', code: '500' } } : { data: REWARD, error: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = await playToTheEnd();
    await tick(1140 + 420 + 100);
    expect(container.querySelector('.drc')?.textContent).toContain('No pudimos confirmar la acreditación');
    fireEvent.click(screen.getByRole('button', { name: /Reintentar acreditación/ }));
    await tick(0);
    expect(claims()).toHaveLength(2);
    expect(container.querySelector('.drc')?.textContent).toContain('+120 XP');
    expect(container.querySelector('.drc')?.textContent).not.toContain('No pudimos');
  });

  it('un premio duplicado (recarga) no suena ni suma de nuevo y lo avisa', async () => {
    botServer(async () => ({ data: { ok: true, duplicate: true }, error: null }));
    const { container } = await playToTheEnd();
    await tick(1140 + 420 + 200);
    expect(container.querySelector('.drc')?.textContent).toContain('ya acreditado');
    expect(claims()).toHaveLength(1);
  });

  it('PvP: cobra con el rival y sin bot; los avatares terminan riendo (ganador) y llorando (perdedor)', async () => {
    h.rpc.mockImplementation(async (name: string) => {
      if (name === 'rps_start') return { data: null, error: null };
      if (name === 'duel_session_ping') return { data: { status: 'active', rivalOnline: true, leftBy: null }, error: null };
      if (name === 'rps_state') return { data: { ...base, id: 'match-2', hostWins: 0, guestWins: 2, round: 2, status: 'finished', winnerId: 'rival1', lastMoves: { host: 'rock', guest: 'paper' } }, error: null };
      if (name === 'duel_claim_reward') return { data: { ...REWARD, result: 'loss', xp: 20, coins: 5, vsBot: false }, error: null };
      return { data: null, error: null };
    });
    const { container } = render(<RockPaperScissors challenge={pvpChallenge} meId={ME} onExit={() => {}} />);
    await tick(0); await tick(3600);
    await tick(1140 + 420 + 600);
    const faces = [...container.querySelectorAll('[data-face]')].map(f => f.getAttribute('data-expression'));
    expect(faces).toEqual(['sad', 'laugh']);
    expect(container.querySelector('.rpsf-bang b')?.textContent).toBe('¡PAPEL GANA!');
    expect(container.querySelector('.rpsf-bang')?.className).toContain('rpsf-bang--lose');
    expect(claims()).toHaveLength(1);
    expect(claims()[0][1]).toMatchObject({ p_game: 'rps', p_match_id: 'match-2', p_vs_bot: false, p_rival_id: 'rival1' });
    expect(container.querySelector('.drc')?.textContent).toContain('+20 XP');
  });
});

describe('useDuelReward', () => {
  const ok = { data: REWARD, error: null };
  it('cobra una vez por partida, espera el resultado del bot y vuelve a cobrar en la revancha', async () => {
    h.rpc.mockResolvedValue(ok);
    const { result, rerender } = renderHook((p: any) => useDuelReward('rps', p.id, p.finished, p.opts), { initialProps: { id: 'a', finished: false, opts: { vsBot: true } as any } });
    await tick(0); expect(claims()).toHaveLength(0);                                   // no terminó
    rerender({ id: 'a', finished: true, opts: { vsBot: true } }); await tick(0);
    expect(claims()).toHaveLength(0);                                                  // bot sin resultado todavía
    rerender({ id: 'a', finished: true, opts: { vsBot: true, botResult: 'win' } }); await tick(0);
    expect(claims()).toHaveLength(1); expect(result.current.reward?.xp).toBe(120);
    for (let i = 0; i < 4; i++) { rerender({ id: 'a', finished: true, opts: { vsBot: true, botResult: 'win' } }); await tick(0); }
    expect(claims()).toHaveLength(1);
    rerender({ id: 'b', finished: false, opts: { vsBot: true } }); await tick(0);
    expect(result.current.reward).toBeNull();
    rerender({ id: 'b', finished: true, opts: { vsBot: true, botResult: 'loss' } }); await tick(0);
    expect(claims()).toHaveLength(2); expect(claims()[1][1].p_match_id).toBe('b');
  });
  it('rechaza respuestas sin ok:true del servidor (no muestra premios inventados)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    h.rpc.mockResolvedValue({ data: { ok: false }, error: null });
    const { result } = renderHook(() => useDuelReward('rps', 'x', true, {}));
    await tick(0);
    expect(result.current.error).toBe(true); expect(result.current.reward).toBeNull();
  });
});
