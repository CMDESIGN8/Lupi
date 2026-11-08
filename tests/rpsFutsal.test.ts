import { describe, expect, it } from 'vitest';
import { EXPRESSION_IDS } from '../src/lib/avatarAppearance';
import { FUTSAL_MOVES, MOVE_ORDER, bangFor, emoteFor, faceExpression, flipOutcome, roundResult, toOutcome, type FaceStage, type Move } from '../src/lib/rpsFutsal';

describe('roundResult: las reglas de siempre', () => {
  const cases: [Move, Move, string][] = [
    ['rock', 'rock', 'tie'], ['paper', 'paper', 'tie'], ['scissors', 'scissors', 'tie'],
    ['rock', 'scissors', 'win'], ['paper', 'rock', 'win'], ['scissors', 'paper', 'win'],
    ['scissors', 'rock', 'lose'], ['rock', 'paper', 'lose'], ['paper', 'scissors', 'lose'],
  ];
  it.each(cases)('%s vs %s → %s', (a, b, expected) => expect(roundResult(a, b)).toBe(expected));
  it('es antisimétrica: si yo gano, el rival pierde', () => {
    for (const a of MOVE_ORDER) for (const b of MOVE_ORDER) {
      const r = roundResult(a, b), inv = roundResult(b, a);
      expect(inv).toBe(r === 'win' ? 'lose' : r === 'lose' ? 'win' : 'tie');
    }
  });
  it('cada jugada vence a exactamente una y pierde con exactamente una', () => {
    for (const a of MOVE_ORDER) {
      expect(MOVE_ORDER.filter(b => roundResult(a, b) === 'win')).toHaveLength(1);
      expect(MOVE_ORDER.filter(b => roundResult(a, b) === 'lose')).toHaveLength(1);
    }
  });
});

describe('nombres originales del juego', () => {
  it('el texto "vence a" coincide con la regla real', () => {
    expect(FUTSAL_MOVES.rock.blurb).toBe('Vence a tijera');
    expect(FUTSAL_MOVES.paper.blurb).toBe('Vence a piedra');
    expect(FUTSAL_MOVES.scissors.blurb).toBe('Vence a papel');
  });
  it('se conservan PIEDRA, PAPEL y TIJERA', () => {
    expect(MOVE_ORDER.map(m => FUTSAL_MOVES[m].label)).toEqual(['PIEDRA', 'PAPEL', 'TIJERA']);
    expect(MOVE_ORDER.map(m => FUTSAL_MOVES[m].play)).toEqual(['PIEDRA', 'PAPEL', 'TIJERA']);
  });
  it('el grito lo canta la jugada ganadora', () => {
    expect(bangFor('rock', 'scissors')).toMatchObject({ text: '¡PIEDRA GANA!', tone: 'win', caption: '¡PUNTO PARA VOS!' });
    expect(bangFor('rock', 'paper')).toMatchObject({ text: '¡PAPEL GANA!', tone: 'lose', caption: 'PUNTO DEL RIVAL' });
    expect(bangFor('paper', 'paper')).toMatchObject({ tone: 'tie' });
  });
});

describe('expresiones de los avatares', () => {
  const stages: FaceStage[] = ['idle', 'chant', 'impact', 'result', 'final'];
  it('solo usa ids que AvatarFace entiende', () => {
    const results = ['win', 'loss', 'draw', null] as const;
    for (const stage of stages) for (const side of ['me', 'rival'] as const) for (const result of results) for (const beat of [0, 1, 2, 9, -3]) for (const ready of [true, false]) {
      expect(EXPRESSION_IDS).toContain(faceExpression({ stage, side, beat, result, ready }));
    }
  });
  it('la cuenta sube la tensión: focused → determined → angry', () => {
    expect([0, 1, 2].map(beat => faceExpression({ stage: 'chant', side: 'me', beat }))).toEqual(['focused', 'determined', 'angry']);
  });
  it('doble toma: ambos se sorprenden y después cada uno reacciona distinto', () => {
    expect(faceExpression({ stage: 'impact', side: 'me', result: 'win' })).toBe('surprised');
    expect(faceExpression({ stage: 'impact', side: 'rival', result: 'loss' })).toBe('surprised');
    expect(faceExpression({ stage: 'result', side: 'me', result: 'win' })).toBe('happy');
    expect(faceExpression({ stage: 'result', side: 'rival', result: 'loss' })).toBe('worried');
    expect(faceExpression({ stage: 'final', side: 'me', result: 'win' })).toBe('laugh');
    expect(faceExpression({ stage: 'final', side: 'rival', result: 'loss' })).toBe('sad');
  });
  it('respeta los presets del jugador (festejo y concentración)', () => {
    expect(faceExpression({ stage: 'result', side: 'me', result: 'win', presets: { celebrate: 'wink' } })).toBe('wink');
    expect(faceExpression({ stage: 'idle', side: 'me', presets: { focus: 'angry' } })).toBe('angry');
  });
  it('esperando: me guiño al sellar mi mano, el rival sonríe cuando ya jugó', () => {
    expect(faceExpression({ stage: 'idle', side: 'me', ready: true })).toBe('wink');
    expect(faceExpression({ stage: 'idle', side: 'rival', ready: true })).toBe('smile');
  });
  it('flipOutcome invierte ganar/perder y deja el empate', () => {
    expect([flipOutcome('win'), flipOutcome('loss'), flipOutcome('draw')]).toEqual(['loss', 'win', 'draw']);
    expect(toOutcome('tie')).toBe('draw');
  });
});

describe('emojis flotantes', () => {
  it('es determinista (mismo seed, mismo emoji) y nunca devuelve undefined', () => {
    for (const stage of ['chant', 'impact', 'result', 'final'] as FaceStage[]) for (const result of ['win', 'loss', 'draw'] as const) for (let seed = 0; seed < 12; seed++) {
      const a = emoteFor({ stage, side: 'me', beat: 1, result, seed });
      expect(a).toBeTruthy();
      expect(emoteFor({ stage, side: 'me', beat: 1, result, seed })).toBe(a);
    }
  });
  it('en reposo solo aparece el 😏 cuando ya sellé mi mano', () => {
    expect(emoteFor({ stage: 'idle', side: 'me', ready: true })).toBe('😏');
    expect(emoteFor({ stage: 'idle', side: 'me', ready: false })).toBeNull();
    expect(emoteFor({ stage: 'idle', side: 'rival', ready: true })).toBeNull();
  });
});
