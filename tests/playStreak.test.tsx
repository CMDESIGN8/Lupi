import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PLAY_STREAK, confirmedDuel, daysBetween, getPlayStreakSnapshot, parseState, registerPlay, startPlayStreakTracking, viewOf } from '../src/lib/playStreak';
import { PlayStreakLine } from '../src/components/PlayStreakLine';
import { DuelRewardCard } from '../src/components/DuelRewardCard';
import { QuickDuelPanel } from '../src/components/QuickDuelPanel';

const at = (iso: string) => vi.setSystemTime(new Date(iso));            // 15:00 UTC = 12:00 en Buenos Aires
const duel = (over: object = {}) => window.dispatchEvent(new CustomEvent('lupi:progression-updated', { detail: { actionType: 'duel', result: { ok: true, result: 'win', ...over } } }));

describe('reglas de fechas', () => {
  it('días entre fechas, incluyendo cambio de mes, año y bisiesto', () => {
    expect(daysBetween('2026-11-12', '2026-11-13')).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-11-12', '2026-11-12')).toBe(0);
  });
  it('primer duelo = 1; mismo día no suma; día siguiente suma; hueco reinicia y conserva el récord', () => {
    let s = registerPlay(EMPTY_PLAY_STREAK, '2026-11-10');
    expect(s).toMatchObject({ count: 1, best: 1, todayPlays: 1 });
    s = registerPlay(s, '2026-11-10'); expect(s).toMatchObject({ count: 1, todayPlays: 2 });
    s = registerPlay(s, '2026-11-11'); expect(s).toMatchObject({ count: 2, best: 2, todayPlays: 1 });
    s = registerPlay(s, '2026-11-12'); expect(s).toMatchObject({ count: 3, best: 3 });
    s = registerPlay(s, '2026-11-15'); expect(s).toMatchObject({ count: 1, best: 3 });
  });
  it('un reloj atrasado no rompe la racha', () => {
    const s = registerPlay(registerPlay(EMPTY_PLAY_STREAK, '2026-11-10'), '2026-11-11');
    expect(registerPlay(s, '2026-11-09')).toMatchObject({ count: 2, lastDay: '2026-11-11' });
  });
  it('estado visible: activa hoy / en riesgo (ayer) / cortada (antes de ayer)', () => {
    const s = { count: 4, best: 6, lastDay: '2026-11-10', todayPlays: 2 };
    expect(viewOf(s, '2026-11-10')).toMatchObject({ count: 4, activeToday: true, atRisk: false, playsToday: 2 });
    expect(viewOf(s, '2026-11-11')).toMatchObject({ count: 4, activeToday: false, atRisk: true, playsToday: 0 });
    expect(viewOf(s, '2026-11-12')).toMatchObject({ count: 0, atRisk: false, broken: true, best: 6 });
  });
  it('datos corruptos en localStorage no rompen nada', () => {
    for (const raw of [null, '', '{', 'null', '{"lastDay":"ayer","count":5}', '[]']) expect(parseState(raw)).toEqual(EMPTY_PLAY_STREAK);
    expect(parseState('{"lastDay":"2026-11-10","count":-3,"best":"x","todayPlays":0}')).toMatchObject({ count: 1, best: 1, todayPlays: 1 });
  });
  it('solo cuenta duelos confirmados por el servidor', () => {
    expect(confirmedDuel({ actionType: 'duel', result: { ok: true } })).toEqual({ vsBot: false });
    expect(confirmedDuel({ actionType: 'duel', result: { ok: true, vsBot: true } })).toEqual({ vsBot: true });
    for (const d of [undefined, null, {}, { actionType: 'mission', result: { ok: true } }, { actionType: 'duel', result: { ok: false } }, { actionType: 'duel', result: { ok: true, duplicate: true } }, { actionType: 'duel' }]) expect(confirmedDuel(d)).toBeNull();
  });
});

describe('seguimiento con eventos del servidor', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); at('2026-11-10T15:00:00Z'); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('suma 1 por día, ignora duplicados/errores, persiste y se aísla por usuario', () => {
    const stop = startPlayStreakTracking('u1');
    expect(getPlayStreakSnapshot()).toMatchObject({ count: 0 });
    duel(); expect(getPlayStreakSnapshot()).toMatchObject({ count: 1, playsToday: 1, activeToday: true });
    duel({ duplicate: true }); duel({ ok: false }); window.dispatchEvent(new CustomEvent('lupi:progression-updated', { detail: { actionType: 'mission', result: { ok: true } } }));
    expect(getPlayStreakSnapshot()).toMatchObject({ count: 1, playsToday: 1 });
    duel({ vsBot: true }); expect(getPlayStreakSnapshot()).toMatchObject({ count: 1, playsToday: 2 });   // la práctica con bot también cuenta
    at('2026-11-11T15:00:00Z'); duel(); expect(getPlayStreakSnapshot()).toMatchObject({ count: 2, best: 2, playsToday: 1 });
    expect(JSON.parse(localStorage.getItem('lupi_play_streak_v1:u1')!)).toMatchObject({ count: 2, lastDay: '2026-11-11' });
    stop(); expect(getPlayStreakSnapshot()).toMatchObject({ count: 0 });
    const stop2 = startPlayStreakTracking('u2'); expect(getPlayStreakSnapshot()).toMatchObject({ count: 0 }); stop2();
    const again = startPlayStreakTracking('u1'); expect(getPlayStreakSnapshot()).toMatchObject({ count: 2, activeToday: true }); again();
  });
  it('sin sesión activa los eventos no hacen nada', () => { duel(); expect(getPlayStreakSnapshot()).toMatchObject({ count: 0 }); });
  it('al pasar la medianoche (hora argentina) pasa de "asegurada" a "en riesgo" sin recargar', () => {
    const stop = startPlayStreakTracking('u1'); duel();
    expect(getPlayStreakSnapshot()).toMatchObject({ activeToday: true, atRisk: false });
    at('2026-11-11T04:00:00Z'); act(() => { vi.advanceTimersByTime(60_000); });   // 01:00 en Buenos Aires
    expect(getPlayStreakSnapshot()).toMatchObject({ activeToday: false, atRisk: true, count: 1 });
    at('2026-11-12T15:00:00Z'); act(() => { vi.advanceTimersByTime(60_000); });
    expect(getPlayStreakSnapshot()).toMatchObject({ count: 0, broken: true });
    stop();
  });
  it('otra pestaña que suma el mismo día se sincroniza', () => {
    const stop = startPlayStreakTracking('u1');
    localStorage.setItem('lupi_play_streak_v1:u1', JSON.stringify({ count: 5, best: 5, lastDay: '2026-11-10', todayPlays: 1 }));
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: 'lupi_play_streak_v1:u1' })); });
    expect(getPlayStreakSnapshot()).toMatchObject({ count: 5 }); stop();
  });

  it('carta de premio: el primer duelo del día celebra el +1 y los siguientes confirman que está asegurada', () => {
    const stop = startPlayStreakTracking('u1');
    const reward = { ok: true, result: 'win' as const, xp: 120, coins: 35, vsBot: false };
    const { container, rerender } = render(<DuelRewardCard reward={null} />);
    act(() => { duel(); });
    rerender(<DuelRewardCard reward={reward} rivalName="Tano" />);
    expect(container.querySelector('.psl--reward')?.textContent).toContain('RACHA DE JUEGO · 1 DÍA');
    expect(container.querySelector('.psl--reward')?.textContent).toContain('¡Hoy sumaste un día!');
    act(() => { duel(); });
    expect(container.querySelector('.psl--reward')?.textContent).toContain('Hoy ya la tenés asegurada');
    expect(container.querySelector('.drc__pill')?.textContent).toBe('+120 XP');
    stop();
  });
  it('recordatorios: nunca jugó / en riesgo / cortada / asegurada', () => {
    const stop = startPlayStreakTracking('u1');
    const { container } = render(<PlayStreakLine variant="nudge" />);
    expect(container.textContent).toContain('Jugá 1 duelo por día y armá tu racha');
    act(() => { duel(); }); expect(container.textContent).toContain('asegurada por hoy');
    act(() => { at('2026-11-11T15:00:00Z'); vi.advanceTimersByTime(60_000); }); expect(container.textContent).toContain('Jugá 1 duelo hoy y mantené tu racha de 1 día');
    act(() => { at('2026-11-14T15:00:00Z'); vi.advanceTimersByTime(60_000); }); expect(container.textContent).toContain('Empezá hoy una racha nueva');
    stop();
  });
  it('selector de duelo rápido muestra el recordatorio', () => {
    const stop = startPlayStreakTracking('u1'); duel();
    at('2026-11-11T15:00:00Z');
    render(<QuickDuelPanel variant="launcher" game={null} seconds={0} others={0} notice="" onStart={() => {}} onCancel={() => {}} onDismissNotice={() => {}} />);
    act(() => { vi.advanceTimersByTime(60_000); });
    fireEvent.click(screen.getByRole('button', { name: /DUELO RÁPIDO/ }));
    expect(document.querySelector('.qd-chooser .psl--nudge')?.textContent).toContain('mantené tu racha de 1 día');
    stop();
  });
});
