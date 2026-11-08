/**
 * Piedra, papel o tijera con alma de futsal anime.
 * Todo lo de este archivo es puro (sin React ni red): la lógica de duelo, los puntos
 * y las recompensas siguen viviendo en el servidor; acá solo se decide cómo se VE y se SIENTE.
 */
export type Move = 'rock' | 'paper' | 'scissors';
export type RoundResult = 'win' | 'lose' | 'tie';
export type Outcome = 'win' | 'loss' | 'draw';
export type Side = 'me' | 'rival';
export type FaceStage = 'idle' | 'chant' | 'impact' | 'result' | 'final';
export type BangTone = 'win' | 'lose' | 'tie';

export const MOVE_ORDER: readonly Move[] = ['rock', 'paper', 'scissors'];
export const CHANT_WORDS = ['¡PIEDRA!', '¡PAPEL!', '¡TIJERA!'] as const;

export const FUTSAL_MOVES: Record<Move, { label: string; play: string; beats: Move; blurb: string; call: string }> = {
  rock: { label: 'PIEDRA', play: 'PIEDRA', beats: 'scissors', blurb: 'Vence a tijera', call: '¡PIEDRA!' },
  paper: { label: 'PAPEL', play: 'PAPEL', beats: 'rock', blurb: 'Vence a piedra', call: '¡PAPEL!' },
  scissors: { label: 'TIJERA', play: 'TIJERA', beats: 'paper', blurb: 'Vence a papel', call: '¡TIJERA!' },
};

export const isMove = (value?: string | null): value is Move => value === 'rock' || value === 'paper' || value === 'scissors';

export function roundResult(mine: Move, theirs: Move): RoundResult {
  if (mine === theirs) return 'tie';
  return FUTSAL_MOVES[mine].beats === theirs ? 'win' : 'lose';
}

/** Grito de manga que aparece en el choque: lo canta la jugada ganadora. */
export function bangFor(mine: Move, theirs: Move): { text: string; caption: string; tone: BangTone } {
  const result = roundResult(mine, theirs);
  if (result === 'tie') return { text: '¡MISMA MANO!', caption: 'MISMA JUGADA', tone: 'tie' };
  const winner = result === 'win' ? mine : theirs;
  return { text: FUTSAL_MOVES[winner].call, caption: result === 'win' ? '¡PUNTO PARA VOS!' : 'PUNTO DEL RIVAL', tone: result };
}

export const toOutcome = (result: RoundResult): Outcome => (result === 'tie' ? 'draw' : result === 'win' ? 'win' : 'loss');
export const flipOutcome = (outcome: Outcome): Outcome => (outcome === 'win' ? 'loss' : outcome === 'loss' ? 'win' : 'draw');

type Presets = { focus?: string; celebrate?: string } | undefined;

/**
 * Expresión del avatar en cada momento del duelo. Cuando termina la cuenta, los dos hacen la
 * misma "doble toma" de sorpresa (impact) y recién después cada uno reacciona a su resultado.
 * Los ids son los de AvatarFace: neutral, smile, focused, surprised, determined, happy, wink,
 * laugh, worried, angry, sad.
 */
export function faceExpression(o: { stage: FaceStage; side: Side; beat?: number; result?: Outcome | null; presets?: Presets; ready?: boolean }): string {
  const { stage, side, result, presets, ready } = o;
  const beat = Math.min(2, Math.max(0, o.beat ?? 0));
  switch (stage) {
    case 'chant': return (['focused', 'determined', 'angry'] as const)[beat];
    case 'impact': return 'surprised';
    case 'result':
      if (result === 'win') return presets?.celebrate ?? 'happy';
      if (result === 'loss') return 'worried';
      return 'wink';
    case 'final':
      if (result === 'win') return 'laugh';
      if (result === 'loss') return 'sad';
      return 'surprised';
    default:
      if (side === 'me') return ready ? 'wink' : presets?.focus ?? 'determined';
      return ready ? 'smile' : 'focused';
  }
}
