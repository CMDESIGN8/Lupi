import { todayKey } from "./streak";

/**
 * Racha de juego: días seguidos (calendario de Argentina) en los que jugaste al menos 1 duelo.
 * Es independiente de la racha de entradas del club (users.streak / last_ticket_date, que escribe el backend
 * en add_ticket) y vive en este dispositivo. Se alimenta del evento "lupi:progression-updated" que dispara
 * claimDuelReward SOLO cuando el servidor confirmó el premio (ok:true y no duplicado).
 */
export type PlayStreakState = { count: number; best: number; lastDay: string | null; todayPlays: number };
export type PlayStreakView = { count: number; best: number; activeToday: boolean; atRisk: boolean; broken: boolean; playsToday: number };

export const EMPTY_PLAY_STREAK: PlayStreakState = { count: 0, best: 0, lastDay: null, todayPlays: 0 };
const KEY = (userId: string) => `lupi_play_streak_v1:${userId}`;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const dayNumber = (key: string) => { const [y, m, d] = key.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86_400_000); };
export const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from);

/** Suma un duelo jugado "hoy". Mismo día: no cambia la racha. Día siguiente: +1. Hueco: vuelve a 1. */
export function registerPlay(state: PlayStreakState, today: string = todayKey()): PlayStreakState {
  const gap = state.lastDay ? daysBetween(state.lastDay, today) : null;
  if (gap !== null && gap <= 0) return { ...state, todayPlays: state.todayPlays + 1 }; // gap < 0: reloj del dispositivo atrasado, no castigamos
  const count = gap === 1 ? state.count + 1 : 1;
  return { count, best: Math.max(state.best, count), lastDay: today, todayPlays: 1 };
}

export function viewOf(state: PlayStreakState, today: string = todayKey()): PlayStreakView {
  const gap = state.lastDay ? daysBetween(state.lastDay, today) : null;
  const activeToday = gap !== null && gap <= 0;
  const alive = gap !== null && gap <= 1;
  return {
    count: alive ? state.count : 0, best: state.best, activeToday,
    atRisk: gap === 1 && state.count > 0, broken: gap !== null && gap > 1 && state.count > 0,
    playsToday: activeToday ? state.todayPlays : 0,
  };
}

const num = (v: unknown) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) ? Math.min(9999, Math.max(0, n)) : 0; };
export function parseState(raw: string | null): PlayStreakState {
  if (!raw) return EMPTY_PLAY_STREAK;
  try {
    const o = JSON.parse(raw) as Partial<PlayStreakState>;
    const lastDay = typeof o.lastDay === "string" && DAY_RE.test(o.lastDay) ? o.lastDay : null;
    if (!lastDay) return EMPTY_PLAY_STREAK;
    const count = Math.max(1, num(o.count));
    return { count, best: Math.max(count, num(o.best)), lastDay, todayPlays: Math.max(1, num(o.todayPlays)) };
  } catch { return EMPTY_PLAY_STREAK; }
}

/** Detalle del evento de progresión → duelo confirmado por el servidor (ok, no duplicado), o null.
 *  Si el servidor ya registró la racha real (migración B1) viene en `activity`. */
export function confirmedDuel(detail: unknown): { vsBot: boolean; activity: { count: number; best: number; changed: boolean } | null } | null {
  const d = detail as { actionType?: string; result?: { ok?: boolean; duplicate?: boolean; vsBot?: boolean; activityStreak?: number | null; activityBest?: number | null; activityStreakChanged?: boolean } } | undefined;
  if (d?.actionType !== "duel" || d.result?.ok !== true || d.result.duplicate) return null;
  const r = d.result, count = Number(r.activityStreak);
  const activity = Number.isFinite(count) && count >= 1 ? { count: Math.trunc(count), best: Math.max(Math.trunc(Number(r.activityBest) || 0), Math.trunc(count)), changed: !!r.activityStreakChanged } : null;
  return { vsBot: !!r.vsBot, activity };
}

// ───────── Store mínimo (sin prop drilling: lo leen la carta de premio y el selector de duelo rápido) ─────────
let currentUser: string | null = null;
let state: PlayStreakState = EMPTY_PLAY_STREAK;
let snapshot: PlayStreakView = viewOf(state);
const listeners = new Set<() => void>();

const sameView = (a: PlayStreakView, b: PlayStreakView) => a.count === b.count && a.best === b.best && a.activeToday === b.activeToday && a.atRisk === b.atRisk && a.broken === b.broken && a.playsToday === b.playsToday;
function refresh() { const next = viewOf(state); if (sameView(next, snapshot)) return; snapshot = next; listeners.forEach((l) => l()); }
function load() {
  try { state = currentUser ? parseState(localStorage.getItem(KEY(currentUser))) : EMPTY_PLAY_STREAK; } catch { state = EMPTY_PLAY_STREAK; }
  refresh();
}
function save() { try { if (currentUser) localStorage.setItem(KEY(currentUser), JSON.stringify(state)); } catch { /* sin storage: la racha vive solo esta sesión */ } }

export const subscribePlayStreak = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
export const getPlayStreakSnapshot = () => snapshot;

/** La racha real del servidor manda: se usa cuando llega con un duelo o al cargar el perfil (profiles.streak / last_activity_date). */
export function applyServerStreak(s: { count: number; best?: number; lastDay: string | null }): boolean {
  if (!currentUser || !s.lastDay || !DAY_RE.test(s.lastDay) || s.count < 1) return false;
  load();
  if (state.lastDay && state.lastDay > s.lastDay) return false;                      // lo local es más nuevo
  const sameDay = state.lastDay === s.lastDay;
  state = { count: Math.min(9999, Math.trunc(s.count)), best: Math.max(Math.trunc(s.best ?? 0), Math.trunc(s.count), state.best),
            lastDay: s.lastDay, todayPlays: sameDay ? state.todayPlays : 1 };
  save(); refresh(); return true;
}

/** Registra un duelo jugado por el usuario actual. Devuelve false si no hay usuario activo. */
export function recordDuelPlay(): boolean {
  if (!currentUser) return false;
  load();                       // por si otra pestaña ya sumó hoy
  state = registerPlay(state); save(); refresh();
  return true;
}

/** Arranca el seguimiento para un usuario. Devuelve la función de limpieza. */
export function startPlayStreakTracking(userId: string): () => void {
  currentUser = userId; load();
  const onDuel = (e: Event) => {
    const duel = confirmedDuel((e as CustomEvent).detail);
    if (!duel) return;
    if (duel.activity) {                                           // racha real del servidor
      const before = state.lastDay === todayKey() ? state.todayPlays : 0;
      applyServerStreak({ count: duel.activity.count, best: duel.activity.best, lastDay: todayKey() });
      state = { ...state, todayPlays: Math.max(1, before + 1) }; save(); refresh();
    } else recordDuelPlay();
  };
  const onStorage = (e: StorageEvent) => { if (e.key === KEY(userId)) load(); };
  const onWake = () => { if (document.visibilityState !== "hidden") refresh(); }; // cruce de medianoche con la app abierta
  window.addEventListener("lupi:progression-updated", onDuel);
  window.addEventListener("storage", onStorage);
  document.addEventListener("visibilitychange", onWake);
  const timer = window.setInterval(refresh, 60_000);
  return () => {
    window.removeEventListener("lupi:progression-updated", onDuel);
    window.removeEventListener("storage", onStorage);
    document.removeEventListener("visibilitychange", onWake);
    window.clearInterval(timer);
    if (currentUser === userId) { currentUser = null; state = EMPTY_PLAY_STREAK; refresh(); }
  };
}
