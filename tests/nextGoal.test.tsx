import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextGoalFor } from '../src/lib/nextGoal';
import { DuelRewardCard } from '../src/components/DuelRewardCard';
import { useRematchHotkey } from '../src/hooks/useRematchHotkey';

const base = { ok: true, xp: 100, coins: 20 } as const;
afterEach(cleanup);

describe('nextGoalFor: solo datos reales del servidor', () => {
  it('premios del día: cuenta y restantes, con tope en el límite', () => {
    expect(nextGoalFor({ result: 'win', dailyLimit: 6, dailyPlayed: 2 }).stamps).toEqual({ played: 2, limit: 6, left: 4 });
    expect(nextGoalFor({ result: 'win', dailyLimit: 6, dailyPlayed: 9 }).stamps).toEqual({ played: 6, limit: 6, left: 0 });
    expect(nextGoalFor({ result: 'win' }).stamps).toBeNull();
    expect(nextGoalFor({ result: 'win', dailyLimit: 6 }).stamps).toBeNull();
    expect(nextGoalFor({ result: 'win', dailyLimit: 0, dailyPlayed: 1 }).stamps).toBeNull();
  });
  it('meta de racha: faltan N para el récord, en singular y plural', () => {
    expect(nextGoalFor({ result: 'win', streak: 2, bestStreak: 5 }).record).toEqual({ kind: 'chase', text: 'Te faltan 3 victorias seguidas para igualar tu récord de 5' });
    expect(nextGoalFor({ result: 'win', streak: 4, bestStreak: 5 }).record?.text).toBe('Te falta 1 victoria más para igualar tu récord de 5');
  });
  it('sin meta cuando ya estás en el récord, no hay récord relevante o empataste', () => {
    expect(nextGoalFor({ result: 'win', streak: 5, bestStreak: 5 }).record).toBeNull();
    expect(nextGoalFor({ result: 'win', streak: 1, bestStreak: 1 }).record).toBeNull();
    expect(nextGoalFor({ result: 'draw', streak: 0, bestStreak: 8 }).record).toBeNull();
    expect(nextGoalFor({ result: 'loss', streak: 0, bestStreak: 2 }).record).toBeNull();
  });
  it('tras una derrota con récord alto, invita a empezar otra racha', () => {
    expect(nextGoalFor({ result: 'loss', streak: 0, bestStreak: 4 }).record).toEqual({ kind: 'rebuild', text: 'Tu récord son 4 victorias seguidas: ¡andá por otra racha!' });
  });
  it('contra un bot no hay meta de racha ni de cofre (no cuentan), pero sí los premios del día', () => {
    const g = nextGoalFor({ result: 'win', vsBot: true, streak: 1, bestStreak: 5, dailyLimit: 6, dailyPlayed: 2, chestDry: 5, chestPityAfter: 6 });
    expect(g.record).toBeNull(); expect(g.chest).toBeNull(); expect(g.stamps).toEqual({ played: 2, limit: 6, left: 4 });
  });
  it('cofre garantizado: solo avisa cuando faltan 1 a 3 victorias', () => {
    const at = (chestDry: number) => nextGoalFor({ result: 'win', chestDry, chestPityAfter: 6 }).chest;
    expect(at(0)).toBeNull(); expect(at(2)).toBeNull();
    expect(at(3)).toEqual({ left: 3, text: 'Cofre garantizado en 3 victorias contra personas' });
    expect(at(4)?.text).toBe('Cofre garantizado en 2 victorias contra personas');
    expect(at(5)).toEqual({ left: 1, text: '¡Tu próxima victoria contra una persona trae cofre!' });
    expect(at(6)).toBeNull();
    expect(nextGoalFor({ result: 'win' }).chest).toBeNull();                       // el servidor viejo no manda esos campos
  });
  it('datos raros (NaN, negativos, decimales) no rompen nada', () => {
    const g = nextGoalFor({ result: 'win', streak: -3, bestStreak: 4.9, dailyLimit: 6.7, dailyPlayed: 2.2 } as any);
    expect(g.stamps).toEqual({ played: 2, limit: 6, left: 4 });
    expect(g.record?.text).toContain('4 victorias');
  });
});

describe('carta de premio', () => {
  it('muestra los puntos de hoy y la meta de racha en cualquier juego', () => {
    const { container } = render(<DuelRewardCard reward={{ ...base, result: 'win', streak: 1, bestStreak: 3, dailyLimit: 6, dailyPlayed: 3 }} rivalName="Tano" />);
    expect(container.querySelectorAll('.dng__dots i')).toHaveLength(6);
    expect(container.querySelectorAll('.dng__dots i.is-on')).toHaveLength(3);
    expect(container.querySelector('.dng__stamps')?.textContent).toContain('PREMIOS DE HOY 3/6');
    expect(container.querySelector('.dng__stamps')?.textContent).toContain('Te quedan 3');
    expect(container.querySelector('.dng__record')?.textContent).toContain('Te faltan 2 victorias seguidas para igualar tu récord de 3');
    expect(container.querySelector('.drc__pill')?.textContent).toBe('+100 XP');
  });
  it('el último premio del día avisa que el botín está completo', () => {
    const { container } = render(<DuelRewardCard reward={{ ...base, result: 'win', dailyLimit: 6, dailyPlayed: 6 }} />);
    expect(container.querySelector('.dng__stamps')?.textContent).toContain('¡Llegaste al tope de premios de hoy!');
  });
  it('muestra el aviso de cofre garantizado y no lo muestra contra un bot', () => {
    const { container, rerender } = render(<DuelRewardCard reward={{ ...base, result: 'win', chestDry: 5, chestPityAfter: 6 }} />);
    expect(container.querySelector('.dng__record--chest')?.textContent).toContain('¡Tu próxima victoria contra una persona trae cofre!');
    rerender(<DuelRewardCard reward={{ ...base, result: 'win', vsBot: true, chestDry: 5, chestPityAfter: 6 }} />);
    expect(container.querySelector('.dng__record--chest')).toBeNull();
  });
  it('si el servidor no manda esos datos, no agrega nada', () => {
    const { container } = render(<DuelRewardCard reward={{ ...base, result: 'win' }} />);
    expect(container.querySelector('.dng')).toBeNull();
  });
});

describe('atajo de revancha (Enter / R)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const press = (key: string, target: EventTarget = window, init: KeyboardEventInit = {}) => { act(() => { fireEvent.keyDown(target, { key, ...init }); }); };

  it('no dispara antes de armarse, dispara una sola vez y limpia al desmontar', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useRematchHotkey(true, cb));
    press('Enter'); expect(cb).not.toHaveBeenCalled();                    // recién apareció: un Enter de la partida no cuenta
    act(() => { vi.advanceTimersByTime(700); });
    press('Enter'); press('r'); press('Enter');
    expect(cb).toHaveBeenCalledTimes(1);
    unmount(); press('Enter'); expect(cb).toHaveBeenCalledTimes(1);
  });
  it('acepta R en mayúscula y minúscula', () => {
    const cb = vi.fn(); renderHook(() => useRematchHotkey(true, cb)); act(() => { vi.advanceTimersByTime(700); });
    press('R'); expect(cb).toHaveBeenCalledTimes(1);
  });
  it('se ignora con modificadores, otras teclas, o con foco en un botón o campo de texto', () => {
    const cb = vi.fn(); renderHook(() => useRematchHotkey(true, cb)); act(() => { vi.advanceTimersByTime(700); });
    press('Enter', window, { ctrlKey: true }); press('Enter', window, { metaKey: true }); press('a'); press('Escape');
    const btn = document.createElement('button'), input = document.createElement('input'); document.body.append(btn, input);
    press('Enter', btn); press('r', input);
    expect(cb).not.toHaveBeenCalled(); btn.remove(); input.remove();
  });
  it('desactivado no hace nada y reactivarlo vuelve a esperar el armado', () => {
    const cb = vi.fn();
    const { rerender } = renderHook(({ on }) => useRematchHotkey(on, cb), { initialProps: { on: false } });
    act(() => { vi.advanceTimersByTime(2000); }); press('Enter'); expect(cb).not.toHaveBeenCalled();
    rerender({ on: true }); press('Enter'); expect(cb).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(700); }); press('Enter'); expect(cb).toHaveBeenCalledTimes(1);
  });
});
