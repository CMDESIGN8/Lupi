import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cardLines, shareDuelWin, type ShareCardModel } from '../src/lib/duelShareImage';
import { DuelRewardCard } from '../src/components/DuelRewardCard';

const model: ShareCardModel = { game: 'Piedra, papel o tijera', myName: 'Maru', rivalName: 'El Tano' };
const blob = () => Promise.resolve(new Blob(['png'], { type: 'image/png' }));
const abort = () => Object.assign(new Error('cancelado'), { name: 'AbortError' });

describe('cardLines', () => {
  it('arma los textos y oculta lo que no aplica', () => {
    expect(cardLines({ ...model, streak: 4, playStreakDays: 5, h2h: { wins: 3, losses: 1, draws: 0 }, host: 'lupi.app' })).toMatchObject({
      versus: 'MARU  VS  EL TANO', streak: 'RACHA DE 4 VICTORIAS', history: 'HISTORIAL: 3 G · 1 P · 0 E', play: 'RACHA DE JUEGO: 5 DÍAS', footer: 'LUPIAPP · FUTSAL ENTRE AMIGOS · lupi.app' });
    const min = cardLines({ game: 'Preguntados', rivalName: 'Tano', streak: 1, playStreakDays: 1, h2h: { wins: 1, losses: 0, draws: 0 } });
    expect(min).toMatchObject({ versus: 'VS  TANO', streak: null, history: null, play: null, footer: 'LUPIAPP · FUTSAL ENTRE AMIGOS' });
  });
});

describe('shareDuelWin', () => {
  it('comparte la imagen cuando el dispositivo acepta archivos', async () => {
    const share = vi.fn().mockResolvedValue(undefined), canShare = vi.fn().mockReturnValue(true);
    expect(await shareDuelWin(model, 'texto', { render: blob, nav: { share, canShare } as any, origin: 'https://lupi.app' })).toBe('image');
    const arg = share.mock.calls[0][0]; expect(arg.files[0].name).toBe('mi-victoria-lupi.png'); expect(arg.files[0].type).toBe('image/png'); expect(arg.text).toBe('texto');
  });
  it('pone el dominio en la tarjeta', async () => {
    const render = vi.fn(blob);
    await shareDuelWin(model, 't', { render, nav: { share: vi.fn(), canShare: () => true } as any, origin: 'https://lupi.app' });
    expect(render.mock.calls[0][0].host).toBe('lupi.app');
  });
  it('si no se pueden compartir archivos, usa el texto de siempre', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareDuelWin(model, 'texto', { render: blob, nav: { share, canShare: () => false } as any, origin: 'https://lupi.app' })).toBe('text');
    expect(share).toHaveBeenCalledWith({ text: 'texto', url: 'https://lupi.app' });
  });
  it('si no existe canShare (navegadores viejos), usa el texto', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareDuelWin(model, 't', { render: blob, nav: { share } as any, origin: 'https://x' })).toBe('text');
  });
  it('si falla el dibujo de la imagen, no se pierde el compartir: cae al texto', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const out = await shareDuelWin(model, 't', { render: () => Promise.reject(new Error('sin canvas')), nav: { share, canShare: () => true } as any, origin: 'https://x' });
    expect(out).toBe('text'); expect(share).toHaveBeenCalledTimes(1);
  });
  it('si el usuario cancela, no insiste con un segundo compartir', async () => {
    const share = vi.fn().mockRejectedValue(abort());
    expect(await shareDuelWin(model, 't', { render: blob, nav: { share, canShare: () => true } as any, origin: 'https://x' })).toBe('cancelled');
    expect(share).toHaveBeenCalledTimes(1);
    const textShare = vi.fn().mockRejectedValue(abort());
    expect(await shareDuelWin(model, 't', { render: blob, nav: { share: textShare } as any, origin: 'https://x' })).toBe('cancelled');
  });
  it('sin Web Share copia al portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareDuelWin(model, 'texto', { render: blob, nav: { clipboard: { writeText } } as any, origin: 'https://x' })).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('texto https://x');
  });
  it('si nada funciona devuelve failed sin romper', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denegado'));
    expect(await shareDuelWin(model, 't', { nav: { clipboard: { writeText } } as any, origin: 'https://x' })).toBe('failed');
  });
});

describe('botón de la carta de premio', () => {
  afterEach(cleanup);
  const win = { ok: true, result: 'win' as const, xp: 100, coins: 10, streak: 3, h2h: { wins: 2, losses: 1, draws: 0 } };
  it('solo se ofrece al ganar contra una persona', () => {
    const { container, rerender } = render(<DuelRewardCard reward={{ ...win, vsBot: true }} />);
    expect(container.querySelector('.drc__share')).toBeNull();
    rerender(<DuelRewardCard reward={{ ...win, result: 'loss' }} />); expect(container.querySelector('.drc__share')).toBeNull();
    rerender(<DuelRewardCard reward={win} />); expect(container.querySelector('.drc__share')).not.toBeNull();
  });
  it('al tocarlo intenta compartir y, sin canvas en el entorno, cae al texto', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    render(<DuelRewardCard reward={win} rivalName="El Tano" myName="Maru" gameLabel="Piedra, papel o tijera" />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /COMPARTIR VICTORIA/ })); await new Promise(r => setTimeout(r, 20)); });
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].text).toContain('¡Le gané a El Tano en Piedra, papel o tijera en Lupi World! 🔥 Racha de 3.');
  });
});
