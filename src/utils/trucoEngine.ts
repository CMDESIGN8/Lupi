// src/utils/trucoEngine.ts
// Motor del Truco argentino de 2 jugadores. Puro y sin dependencias de React ni de red:
// el mismo reductor sirve para jugar contra el bot hoy y para validar partidas PvP mañana.
// Reglas: mazo español de 40 cartas, mejor de 3 bazas, Truco/Retruco/Vale cuatro,
// Envido/Real envido/Falta envido, "envido está primero", sin flor. Se juega a TARGET puntos.

export type Suit = "espada" | "basto" | "oro" | "copa";
export type CardNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export type Card = { suit: Suit; num: CardNum };
export type Seat = 0 | 1;
export type EnvidoCall = "envido" | "real" | "falta";
export type TrucoLevel = 0 | 1 | 2 | 3; // 0 = sin truco · 1 truco · 2 retruco · 3 vale cuatro

export const TARGET = 9;
export const other = (s: Seat): Seat => (s === 0 ? 1 : 0);

const NUMS: CardNum[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const SUITS: Suit[] = ["espada", "basto", "oro", "copa"];

export const TRUCO_NAME: Record<1 | 2 | 3, string> = { 1: "TRUCO", 2: "RETRUCO", 3: "VALE CUATRO" };
export const ENVIDO_NAME: Record<EnvidoCall, string> = { envido: "ENVIDO", real: "REAL ENVIDO", falta: "FALTA ENVIDO" };

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const num of NUMS) deck.push({ suit, num });
  return deck;
}

/** Jerarquía del truco: mayor número = carta más fuerte. */
export function cardPower(c: Card): number {
  const { suit, num } = c;
  if (num === 1 && suit === "espada") return 14;
  if (num === 1 && suit === "basto") return 13;
  if (num === 7 && suit === "espada") return 12;
  if (num === 7 && suit === "oro") return 11;
  if (num === 3) return 10;
  if (num === 2) return 9;
  if (num === 1) return 8; // 1 de copa y de oro
  if (num === 12) return 7;
  if (num === 11) return 6;
  if (num === 10) return 5;
  if (num === 7) return 4; // 7 de copa y de basto
  if (num === 6) return 3;
  if (num === 5) return 2;
  return 1; // 4
}

export const envidoValue = (c: Card): number => (c.num >= 10 ? 0 : c.num);

/** Tantos de envido: 20 + dos cartas del mismo palo; si no, la carta más alta (figuras valen 0). */
export function envidoPoints(cards: Card[]): number {
  let best = 0;
  for (const c of cards) best = Math.max(best, envidoValue(c));
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].suit === cards[j].suit) best = Math.max(best, 20 + envidoValue(cards[i]) + envidoValue(cards[j]));
    }
  }
  return best;
}

export type Pending =
  | { kind: "truco"; level: 1 | 2 | 3; from: Seat }
  | { kind: "envido"; calls: EnvidoCall[]; from: Seat };

export type LogEntry = { seat: Seat | null; text: string; tone?: "shout" | "info" | "win" | "lose" };
export type Shout = { seat: Seat; text: string; n: number };

export type TrucoState = {
  scores: [number, number];
  mano: Seat;
  handNo: number;
  hands: [Card[], Card[]];
  dealt: [Card[], Card[]];
  table: [(Card | null)[], (Card | null)[]];
  trickResults: (Seat | "tie")[];
  trick: number;
  turn: Seat;
  truco: { level: TrucoLevel; owner: Seat | null };
  pending: Pending | null;
  heldTruco: Pending | null;
  envidoOpen: boolean;
  envidoResult: { points: [number, number]; winner: Seat; stake: number } | null;
  phase: "playing" | "hand-over" | "finished";
  handResult: { winner: Seat; points: number; reason: string } | null;
  winner: Seat | null;
  log: LogEntry[];
  lastShout: Shout | null;
};

export type Action =
  | { t: "play"; card: number }
  | { t: "truco" }
  | { t: "envido"; kind: EnvidoCall }
  | { t: "accept" }
  | { t: "decline" }
  | { t: "fold" }
  | { t: "next" };

export type Rng = () => number;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clone = <T,>(v: T): T => (typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

function deal(state: TrucoState, rng: Rng): void {
  const deck = shuffle(fullDeck(), rng);
  const mine = deck.slice(0, 3);
  const theirs = deck.slice(3, 6);
  state.dealt = [mine, theirs];
  state.hands = [mine.slice(), theirs.slice()];
  state.table = [[null, null, null], [null, null, null]];
  state.trickResults = [];
  state.trick = 0;
  state.turn = state.mano;
  state.truco = { level: 0, owner: null };
  state.pending = null;
  state.heldTruco = null;
  state.envidoOpen = true;
  state.envidoResult = null;
  state.phase = "playing";
  state.handResult = null;
  state.handNo += 1;
}

export function newGame(rng: Rng = Math.random, mano: Seat = 0): TrucoState {
  const s: TrucoState = {
    scores: [0, 0], mano, handNo: 0,
    hands: [[], []], dealt: [[], []], table: [[null, null, null], [null, null, null]],
    trickResults: [], trick: 0, turn: mano,
    truco: { level: 0, owner: null }, pending: null, heldTruco: null,
    envidoOpen: true, envidoResult: null,
    phase: "playing", handResult: null, winner: null, log: [], lastShout: null,
  };
  deal(s, rng);
  return s;
}

/** Quién tiene que actuar ahora (responder un canto o jugar), o null si no hay nadie. */
export function actor(s: TrucoState): Seat | null {
  if (s.phase !== "playing") return null;
  return s.pending ? other(s.pending.from) : s.turn;
}

export type Moves = {
  play: number[];
  truco: 1 | 2 | 3 | null;
  envido: EnvidoCall[];
  accept: boolean;
  decline: boolean;
  fold: boolean;
};

const NONE: Moves = { play: [], truco: null, envido: [], accept: false, decline: false, fold: false };

function envidoRaises(calls: EnvidoCall[]): EnvidoCall[] {
  const out: EnvidoCall[] = [];
  const last = calls[calls.length - 1];
  if (last === "falta") return out;
  const onlyEnvidos = calls.every((c) => c === "envido");
  if (onlyEnvidos && calls.length < 2) out.push("envido");
  if (!calls.includes("real")) out.push("real");
  out.push("falta");
  return out;
}

/** Todo lo que `seat` puede hacer ahora mismo. La UI y el bot se apoyan solo en esto. */
export function movesFor(s: TrucoState, seat: Seat): Moves {
  if (actor(s) !== seat) return NONE;
  const m: Moves = { play: [], truco: null, envido: [], accept: false, decline: false, fold: false };

  if (s.pending) {
    m.accept = true;
    m.decline = true;
    if (s.pending.kind === "truco") {
      if (s.pending.level < 3) m.truco = (s.pending.level + 1) as 2 | 3;
      // "El envido está primero": respondiendo al primer truco, en la primera baza.
      if (s.pending.level === 1 && s.envidoOpen && s.trick === 0 && !s.table[seat][0]) m.envido = ["envido", "real", "falta"];
    } else {
      m.envido = envidoRaises(s.pending.calls);
    }
    return m;
  }

  m.play = s.hands[seat].map((_, i) => i);
  m.fold = true;
  const { level, owner } = s.truco;
  if (level < 3 && (owner === null || owner === seat)) m.truco = (level + 1) as 1 | 2 | 3;
  if (s.envidoOpen && s.trick === 0 && level === 0 && !s.table[seat][0]) m.envido = ["envido", "real", "falta"];
  return m;
}

function say(s: TrucoState, seat: Seat | null, text: string, tone: LogEntry["tone"] = "info", shout = false): void {
  s.log.push({ seat, text, tone });
  if (s.log.length > 40) s.log.splice(0, s.log.length - 40);
  if (shout && seat !== null) s.lastShout = { seat, text, n: (s.lastShout?.n ?? 0) + 1 };
}

function faltaPoints(s: TrucoState): number {
  return Math.max(1, TARGET - Math.max(s.scores[0], s.scores[1]));
}

function envidoStake(s: TrucoState, calls: EnvidoCall[]): number {
  if (calls.includes("falta")) return faltaPoints(s);
  return calls.reduce((sum, c) => sum + (c === "envido" ? 2 : 3), 0);
}

function envidoDeclinedStake(calls: EnvidoCall[]): number {
  if (calls.length <= 1) return 1;
  return calls.slice(0, -1).reduce((sum, c) => sum + (c === "envido" ? 2 : 3), 0);
}

function award(s: TrucoState, seat: Seat, points: number): void {
  s.scores[seat] += points;
  if (s.scores[seat] >= TARGET) {
    s.scores[seat] = TARGET;
    s.phase = "finished";
    s.winner = seat;
    s.pending = null;
    s.heldTruco = null;
  }
}

function endHand(s: TrucoState, winner: Seat, points: number, reason: string): void {
  s.pending = null;
  s.heldTruco = null;
  s.handResult = { winner, points, reason };
  say(s, winner, `${reason} · +${points}`, winner === 0 ? "win" : "lose");
  award(s, winner, points);
  if (s.phase !== "finished") s.phase = "hand-over";
}

function resolveEnvido(s: TrucoState, calls: EnvidoCall[]): void {
  const p0 = envidoPoints(s.dealt[0]);
  const p1 = envidoPoints(s.dealt[1]);
  const winner: Seat = p0 === p1 ? s.mano : p0 > p1 ? 0 : 1;
  const stake = envidoStake(s, calls);
  s.envidoResult = { points: [p0, p1], winner, stake };
  s.envidoOpen = false;
  say(s, null, `Envido · ${p0} vs ${p1}`, "info");
  say(s, winner, `¡GANA EL ENVIDO! · +${stake}`, winner === 0 ? "win" : "lose", true);
  award(s, winner, stake);
  if (s.phase === "finished") return;
  // Si había un truco esperando respuesta, vuelve a quedar pendiente.
  s.pending = s.heldTruco;
  s.heldTruco = null;
}

/** Quién gana la mano según las bazas jugadas, o null si todavía no se define. */
export function handWinner(results: (Seat | "tie")[], mano: Seat): Seat | null {
  const [a, b, c] = results;
  if (results.length < 2) return null;
  if (results.length === 2) {
    if (a !== "tie" && b === a) return a;
    if (a === "tie" && b !== "tie") return b;
    if (a !== "tie" && b === "tie") return a;
    return null;
  }
  if (a === "tie" && b === "tie") return c === "tie" ? mano : (c as Seat);
  if (a !== "tie" && b !== "tie" && a !== b) return c === "tie" ? a : (c as Seat);
  return a !== "tie" ? a : (b as Seat);
}

function resolveTrick(s: TrucoState, leader: Seat): void {
  const i = s.trick;
  const c0 = s.table[0][i]!;
  const c1 = s.table[1][i]!;
  const p0 = cardPower(c0);
  const p1 = cardPower(c1);
  const result: Seat | "tie" = p0 === p1 ? "tie" : p0 > p1 ? 0 : 1;
  s.trickResults.push(result);
  const decided = handWinner(s.trickResults, s.mano);
  if (decided !== null) {
    endHand(s, decided, s.truco.level + 1, decided === 0 ? "Ganaste la mano" : "El rival ganó la mano");
    return;
  }
  s.trick += 1;
  s.turn = result === "tie" ? leader : result;
  s.envidoOpen = false;
}

/** Aplica una acción de `seat`. Si es ilegal devuelve el mismo estado sin tocar. */
export function apply(prev: TrucoState, seat: Seat, a: Action, rng: Rng = Math.random): TrucoState {
  if (a.t === "next") {
    if (prev.phase !== "hand-over") return prev;
    const s = clone(prev);
    s.mano = other(s.mano);
    deal(s, rng);
    return s;
  }
  if (actor(prev) !== seat) return prev;
  const m = movesFor(prev, seat);
  const s = clone(prev);
  const who = seat === 0 ? "Vos" : "Rival";

  switch (a.t) {
    case "play": {
      if (!m.play.includes(a.card)) return prev;
      const [card] = s.hands[seat].splice(a.card, 1);
      s.table[seat][s.trick] = card;
      say(s,seat,`${who} juega ${card.num} de ${card.suit}`);
      if (s.table[other(seat)][s.trick]) resolveTrick(s, other(seat));
      else s.turn = other(seat);
      return s;
    }
    case "truco": {
      if (!m.truco) return prev;
      const level = m.truco;
      // Contracantar acepta el nivel anterior, aunque el nuevo canto sea rechazado.
      if (prev.pending?.kind === 'truco') s.truco = {level:prev.pending.level,owner:seat};
      s.pending = { kind: "truco", level, from: seat };
      say(s, seat, `¡${TRUCO_NAME[level]}!`, "shout", true);
      return s;
    }
    case "envido": {
      if (!m.envido.includes(a.kind)) return prev;
      if (prev.pending?.kind === "truco") {
        s.heldTruco = prev.pending;
        s.pending = { kind: "envido", calls: [a.kind], from: seat };
      } else if (prev.pending?.kind === "envido") {
        s.pending = { kind: "envido", calls: [...prev.pending.calls, a.kind], from: seat };
      } else {
        s.pending = { kind: "envido", calls: [a.kind], from: seat };
      }
      say(s, seat, `¡${ENVIDO_NAME[a.kind]}!`, "shout", true);
      return s;
    }
    case "accept": {
      if (!m.accept || !prev.pending) return prev;
      say(s, seat, "¡QUIERO!", "shout", true);
      if (prev.pending.kind === "truco") {
        s.truco = { level: prev.pending.level, owner: seat };
        s.pending = null;
        s.envidoOpen = false;
      } else {
        resolveEnvido(s, prev.pending.calls);
      }
      return s;
    }
    case "decline": {
      if (!m.decline || !prev.pending) return prev;
      say(s, seat, "NO QUIERO", "shout", true);
      const p = prev.pending;
      if (p.kind === "truco") {
        endHand(s, p.from, p.level === 1 ? 1 : p.level, p.from === 0 ? `${who} no quiso: ganás la mano` : "No quisiste: el rival se lleva la mano");
      } else {
        const stake = envidoDeclinedStake(p.calls);
        s.envidoOpen = false;
        say(s, p.from, `¡ENVIDO NO QUERIDO! · +${stake}`, p.from === 0 ? "win" : "lose", true);
        award(s, p.from, stake);
        if (s.phase !== "finished") {
          s.pending = s.heldTruco;
          s.heldTruco = null;
        }
      }
      return s;
    }
    case "fold": {
      if (!m.fold) return prev;
      say(s, seat, "Se va al mazo", "shout", true);
      endHand(s, other(seat), s.truco.level + 1, seat === 0 ? "Te fuiste al mazo" : "El rival se fue al mazo");
      return s;
    }
  }
  return prev;
}

// ───────────────────────── Bot ─────────────────────────
// El bot solo lee: sus cartas, la mesa y el marcador. Nunca las cartas del rival.

export type BotLevel = 0 | 1 | 2;

/** Fuerza de lo que le queda en mano (aprox. 1..14, con bonus/malus por las bazas ya jugadas). */
function strength(s: TrucoState, seat: Seat): number {
  const powers = s.hands[seat].map(cardPower).sort((a, b) => b - a);
  if (!powers.length) return 0;
  let q = powers.length === 1 ? powers[0] : powers[0] * 0.6 + powers[1] * 0.4;
  const mine = s.trickResults.filter((r) => r === seat).length;
  const theirs = s.trickResults.filter((r) => r === other(seat)).length;
  q += (mine - theirs) * 2.5;
  return q;
}

const chance = (rng: Rng, p: number) => rng() < p;

export function botDecide(s: TrucoState, seat: Seat, level: BotLevel, rng: Rng = Math.random): Action {
  const m = movesFor(s, seat);
  const q = strength(s, seat);
  const env = envidoPoints(s.dealt[seat]);
  const noise = (rng() - 0.5) * (level === 0 ? 5 : level === 1 ? 2.5 : 1.2);
  const bluff = level === 0 ? 0.04 : level === 1 ? 0.07 : 0.1;
  const behind = s.scores[other(seat)] - s.scores[seat];

  // ── Responder un canto ──
  if (s.pending?.kind === "envido") {
    const e = env + noise * 2;
    const need = level === 0 ? 25 : level === 1 ? 23.5 : 22.5;
    const raisable = m.envido;
    if (raisable.includes("falta") && e >= 32 && chance(rng, 0.5)) return { t: "envido", kind: "falta" };
    if (raisable.includes("real") && e >= 30 && chance(rng, 0.6)) return { t: "envido", kind: "real" };
    if (raisable.includes("envido") && e >= 28 && chance(rng, 0.45)) return { t: "envido", kind: "envido" };
    if (e >= need || (chance(rng, bluff) && s.pending.calls.length === 1)) return { t: "accept" };
    return { t: "decline" };
  }
  if (s.pending?.kind === "truco") {
    const lvl = s.pending.level;
    const need = (lvl === 1 ? 6.2 : lvl === 2 ? 8.2 : 10) - (behind >= 5 ? 0.8 : 0) + noise;
    if (m.envido.length && s.envidoOpen && env >= 29 && chance(rng, 0.7)) return { t: "envido", kind: env >= 31 ? "real" : "envido" };
    if (m.truco && q + noise >= need + 3 && chance(rng, 0.55 + level * 0.1)) return { t: "truco" };
    if (q + noise >= need || chance(rng, bluff * 0.6)) return { t: "accept" };
    return { t: "decline" };
  }

  // ── Jugar mi turno ──
  if (m.envido.length) {
    const e = env + noise * 2;
    if (e >= 31 && chance(rng, 0.65)) return { t: "envido", kind: e >= 32 && chance(rng, 0.3) ? "falta" : "real" };
    if (e >= 27 && chance(rng, level === 0 ? 0.4 : 0.7)) return { t: "envido", kind: "envido" };
    if (level > 0 && e < 22 && chance(rng, bluff)) return { t: "envido", kind: "envido" };
  }
  if (m.truco) {
    const lvl = m.truco;
    const need = lvl === 1 ? 11 : lvl === 2 ? 12.2 : 13;
    if (q + noise >= need && chance(rng, level === 0 ? 0.35 : 0.6)) return { t: "truco" };
    if (lvl === 1 && s.trick >= 1 && chance(rng, bluff * 0.7) && level > 0) return { t: "truco" };
  }

  const hand = s.hands[seat];
  const order = hand.map((c, i) => ({ i, p: cardPower(c) })).sort((a, b) => a.p - b.p); // menor → mayor
  const oppCard = s.table[other(seat)][s.trick];
  if (oppCard) {
    const op = cardPower(oppCard);
    const beat = order.find((o) => o.p > op);
    if (beat) return { t: "play", card: beat.i };
    const tie = order.find((o) => o.p === op);
    if (tie && s.trick > 0) return { t: "play", card: tie.i };
    return { t: "play", card: order[0].i };
  }
  if (s.trick === 0) {
    if (level === 0) return { t: "play", card: order[Math.floor(rng() * order.length)].i };
    // Mano: esconder la mejor, salir con la del medio si se puede.
    const mid = order[Math.max(0, order.length - 2)];
    return { t: "play", card: (q >= 10 && level === 2 ? order[order.length - 1] : mid).i };
  }
  return { t: "play", card: order[order.length - 1].i };
}

/** Salvaguarda: una acción legal por si el bot propone algo inválido. */
export function safeBotAction(s: TrucoState, seat: Seat, level: BotLevel, rng: Rng = Math.random): Action {
  const a = botDecide(s, seat, level, rng);
  if (apply(s, seat, a, rng) !== s) return a;
  const m = movesFor(s, seat);
  if (m.accept) return { t: "decline" };
  if (m.play.length) return { t: "play", card: m.play[0] };
  return { t: "fold" };
}
