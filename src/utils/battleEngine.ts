// src/utils/battleEngine.ts — v4

import { UserCard } from '../types/cards';

export type SkillGroup = 'attack' | 'defense' | 'technique';

export type MomentType =
  | 'shot' | 'penalty' | 'corner'
  | 'counter' | 'dribble'
  | 'defense' | 'block';

export type CourtZone =
  | 'midfield' | 'user_attack' | 'user_left_wing'
  | 'user_right_wing' | 'user_defense' | 'rival_attack';

export const ZONE_COORDS: Record<CourtZone, { x: number; y: number }> = {
  midfield:        { x: 50, y: 52 },
  user_attack:     { x: 78, y: 52 },
  user_left_wing:  { x: 65, y: 22 },
  user_right_wing: { x: 65, y: 78 },
  user_defense:    { x: 22, y: 52 },
  rival_attack:    { x: 28, y: 52 },
};

export type DecisionOption = {
  id: string;
  label: string;
  icon: string;
  skillGroup: SkillGroup;
  primaryStat: keyof RawStats;
  secondaryStat?: keyof RawStats;
  baseChance: number;
  isSafe?: boolean;
  hint: string;
};

export type MomentContext = {
  type: MomentType;
  mainCard: UserCard;
  minute: number;
  options: DecisionOption[];
  timeLimit: number;
  zone: CourtZone;
  intro: string;
};

export type MomentResult = {
  success: boolean;
  optionChosen: DecisionOption;
  narrative: string;
  goalFor: 'user' | 'rival' | null;
  statGroupUsed: SkillGroup;
};

export type TurnEvent = {
  text: string;
  type: 'neutral' | 'good' | 'bad';
  zone: CourtZone;
};

// Un "turno" completo ahora tiene dos fases:
// 1. user_phase: el equipo usuario lleva la pelota hasta un momento de decisión o pierde posesión
// 2. rival_phase: el equipo rival hace lo mismo
export type PhaseResult = {
  events: TurnEvent[];         // eventos de narrativa de la fase
  moment?: MomentContext;      // si hay, se pausa para decisión
  autoGoal?: 'user' | 'rival'; // gol sin decisión (rival marca o usuario marca de jugada libre)
  narrative: string;
};

export type TurnResult = {
  userPhase: PhaseResult;
  rivalPhase: PhaseResult;
};

type RawStats = {
  pace: number; dribbling: number; passing: number;
  defending: number; finishing: number; physical: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCardData(card: UserCard) {
  const src = card.card ?? (card as any).player;
  if (src) return {
    name: src.name, position: src.position,
    overall_rating: src.overall_rating,
    pace: src.pace ?? 50, dribbling: src.dribbling ?? 50,
    passing: src.passing ?? 50, defending: src.defending ?? 50,
    finishing: src.finishing ?? 50, physical: src.physical ?? 50,
    intelligence: src.intelligence, category: src.category,
  };
  return {
    name: 'Jugador', position: 'ala', overall_rating: 50,
    pace: 50, dribbling: 50, passing: 50,
    defending: 50, finishing: 50, physical: 50,
  };
}

function pickCard(cards: UserCard[], pos?: string): UserCard {
  if (pos) { const m = cards.find(c => getCardData(c).position === pos); if (m) return m; }
  return cards[Math.floor(Math.random() * cards.length)];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function calcDecisionTime(card: UserCard): number {
  const d = getCardData(card);
  const intel = (d as any).intelligence ?? d.overall_rating;
  return intel >= 80 ? 4.0 : intel >= 60 ? 3.3 : 2.5;
}

export const SKILL_GROUP_INFO: Record<SkillGroup, {
  label: string; icon: string; color: string;
  stats: (keyof RawStats)[]; desc: string;
}> = {
  attack:    { label: 'ATAQUE',   icon: '🎯', color: '#FF6B6B', stats: ['passing','finishing'],  desc: 'Pase + Remate'   },
  defense:   { label: 'DEFENSA',  icon: '🛡️', color: '#4A90D9', stats: ['defending','physical'],  desc: 'Defensa + Físico'},
  technique: { label: 'TÉCNICA',  icon: '⚡',  color: '#3DFFA0', stats: ['pace','dribbling'],      desc: 'Ritmo + Regate'  },
};

export function calcGroupValue(card: UserCard, group: SkillGroup): number {
  const d = getCardData(card);
  const stats = SKILL_GROUP_INFO[group].stats;
  return Math.round(stats.reduce((s, k) => s + ((d as any)[k] ?? 50), 0) / stats.length);
}

// ─── Opciones ─────────────────────────────────────────────────────────────────

export function buildOptions(type: MomentType, mainCard: UserCard): DecisionOption[] {
  const d = getCardData(mainCard);
  switch (type) {
    case 'shot': return [
      { id:'shoot_power', label:'Remate fuerte',  icon:'💥', skillGroup:'attack',    primaryStat:'finishing', secondaryStat:'physical',  baseChance:0.50, hint:`${d.finishing} REM · Máximo premio` },
      { id:'shoot_place', label:'Al ángulo',       icon:'🎯', skillGroup:'attack',    primaryStat:'finishing', secondaryStat:'passing',   baseChance:0.44, hint:`${d.finishing} REM · Precisión` },
      { id:'pass_assist', label:'Pase al libre',   icon:'🔑', skillGroup:'attack',    primaryStat:'passing',                             baseChance:0.70, isSafe:true, hint:`${d.passing} PAS · Seguro` },
    ];
    case 'penalty': return [
      { id:'pen_corner',  label:'Al ángulo',       icon:'📐', skillGroup:'attack',    primaryStat:'finishing',                           baseChance:0.60, hint:`${d.finishing} REM · Clásico` },
      { id:'pen_chip',    label:'Vaselina',         icon:'🪄', skillGroup:'technique', primaryStat:'dribbling', secondaryStat:'pace',     baseChance:0.36, hint:`${d.dribbling} REG · Espectacular` },
      { id:'pen_center',  label:'Al centro',        icon:'⚽', skillGroup:'attack',    primaryStat:'finishing',                           baseChance:0.52, isSafe:true, hint:`${d.finishing} REM · Si se tira` },
    ];
    case 'corner': return [
      { id:'corner_cross',  label:'Centro al área',icon:'🌐', skillGroup:'attack',    primaryStat:'passing',   secondaryStat:'finishing', baseChance:0.46, hint:`${d.passing} PAS · Clásico` },
      { id:'corner_short',  label:'Córner corto',  icon:'🔀', skillGroup:'technique', primaryStat:'dribbling', secondaryStat:'pace',      baseChance:0.55, isSafe:true, hint:`${d.dribbling} REG · Control` },
      { id:'corner_direct', label:'Tiro directo',  icon:'🚀', skillGroup:'attack',    primaryStat:'finishing',                           baseChance:0.20, hint:`${d.finishing} REM · Épico` },
    ];
    case 'counter': return [
      { id:'counter_sprint', label:'Sprint al arco',      icon:'🏃', skillGroup:'technique', primaryStat:'pace',    secondaryStat:'finishing', baseChance:0.56, hint:`${d.pace} RIT · Velocidad` },
      { id:'counter_pass',   label:'Pase en profundidad', icon:'➡️', skillGroup:'attack',    primaryStat:'passing', secondaryStat:'pace',      baseChance:0.52, hint:`${d.passing} PAS · Pasillo` },
      { id:'counter_hold',   label:'Aguantar y combinar', icon:'🛡️', skillGroup:'defense',   primaryStat:'physical',                           baseChance:0.65, isSafe:true, hint:`${d.physical} FIS · Seguro` },
    ];
    case 'dribble': return [
      { id:'drib_cut',  label:'Gambeta al medio',   icon:'✨', skillGroup:'technique', primaryStat:'dribbling', secondaryStat:'pace',     baseChance:0.54, hint:`${d.dribbling} REG · Área` },
      { id:'drib_band', label:'Desborde por fuera', icon:'⚡', skillGroup:'technique', primaryStat:'pace',      secondaryStat:'dribbling', baseChance:0.58, isSafe:true, hint:`${d.pace} RIT · Banda` },
      { id:'drib_back', label:'Pase atrás y remate',icon:'🔄', skillGroup:'attack',    primaryStat:'passing',   secondaryStat:'finishing', baseChance:0.62, hint:`${d.passing} PAS · Triang.` },
    ];
    case 'defense': return [
      { id:'def_tackle', label:'Entrada limpia', icon:'🦵', skillGroup:'defense', primaryStat:'defending', secondaryStat:'physical', baseChance:0.58, hint:`${d.defending} DEF · Recuperar` },
      { id:'def_press',  label:'Presión alta',   icon:'⚡', skillGroup:'defense', primaryStat:'defending', secondaryStat:'pace',     baseChance:0.52, hint:`${d.defending} DEF · Ahogar` },
      { id:'def_cover',  label:'Cubrir espacio', icon:'🧱', skillGroup:'defense', primaryStat:'defending',                          baseChance:0.68, isSafe:true, hint:`${d.defending} DEF · Sin riesgo` },
    ];
    case 'block': return [
      { id:'block_dive',       label:'Estirada al palo',icon:'🧤', skillGroup:'defense',   primaryStat:'defending', secondaryStat:'pace',      baseChance:0.60, hint:`${d.defending} DEF · Tapada` },
      { id:'block_body',       label:'Achicar ángulo',  icon:'💪', skillGroup:'defense',   primaryStat:'physical',  secondaryStat:'defending',  baseChance:0.55, isSafe:true, hint:`${d.physical} FIS · Ángulo` },
      { id:'block_anticipate', label:'Anticipar',       icon:'🔮', skillGroup:'technique', primaryStat:'dribbling', secondaryStat:'defending',  baseChance:0.48, hint:`Leer la jugada` },
    ];
  }
}

// ─── Resolver decisión ────────────────────────────────────────────────────────

export function resolveDecision(
  option: DecisionOption,
  card: UserCard,
  momentType: MomentType,
  _minute: number,
): MomentResult {
  const d = getCardData(card);
  const primary   = ((d as any)[option.primaryStat]   ?? 50) as number;
  const secondary = option.secondaryStat ? (((d as any)[option.secondaryStat]) ?? 50) as number : primary;
  const combined  = primary * 0.7 + secondary * 0.3;
  const finalChance = clamp01(option.baseChance + ((combined - 50) / 50) * 0.22);
  const success = Math.random() < finalChance;
  const n = d.name;

  const ok: Partial<Record<string, string[]>> = {
    shoot_power:     [`💥 ¡GOOOL! ${n} la clava con todo!`, `🔥 ${n} no perdona — ADENTRO!`],
    shoot_place:     [`🎯 Golazo de ${n}! Al palo lejano.`, `⭐ ${n} la coloca donde no llega nadie.`],
    pass_assist:     [`🔑 Pase genial de ${n}, el compañero define!`, `✨ ${n} habilita al libre — GOL!`],
    pen_corner:      [`📐 Penal convertido! ${n} al ángulo.`],
    pen_chip:        [`🪄 ¡VASELINA! ${n} la pica increíble.`],
    pen_center:      [`⚽ ${n} al centro — el arquero se tiró!`],
    corner_cross:    [`🌐 Centro de ${n}, ¡cabeza adentro!`],
    corner_short:    [`🔀 Córner corto, combinación y gol!`],
    corner_direct:   [`🚀 ¡GOLAZO DE CÓRNER! A la escuadra.`],
    counter_sprint:  [`🏃 ${n} disparado mano a mano — ¡GOL!`],
    counter_pass:    [`➡️ Pase de ${n}, el pivot define!`],
    counter_hold:    [`🛡️ ${n} aguanta, el equipo se organiza.`],
    drib_cut:        [`✨ ${n} gambetea y deja tirado al defensor!`],
    drib_band:       [`⚡ ${n} por la banda y centra — GOL!`],
    drib_back:       [`🔄 ${n} da atrás, triangulación y gol!`],
    def_tackle:      [`🦵 ¡Entrada limpia de ${n}! Recupera.`],
    def_press:       [`⚡ ${n} presiona y fuerza el error rival!`],
    def_cover:       [`🧱 ${n} cubre el espacio — el rival no pasa.`],
    block_dive:      [`🧤 ¡Tapada increíble de ${n}!`],
    block_body:      [`💪 ${n} se achica y tapa el remate!`],
    block_anticipate:[`🔮 ${n} anticipó y cortó la jugada!`],
  };
  const fail: Partial<Record<string, string>> = {
    shoot_power:    `😤 ${n} remata pero directo al arquero.`,
    shoot_place:    `😱 ${n} intenta el ángulo... ¡al palo!`,
    pass_assist:    `❌ El pase de ${n} fue interceptado.`,
    pen_corner:     `🧤 ¡El arquero para el penal de ${n}!`,
    pen_chip:       `💀 La vaselina de ${n} se va por arriba.`,
    pen_center:     `😬 ${n} al centro pero el arquero no se mueve.`,
    corner_cross:   `✋ La defensa despeja el centro.`,
    corner_short:   `🔄 El córner corto termina en pérdida.`,
    corner_direct:  `🌬️ El tiro roza el palo y sale.`,
    counter_sprint: `🏃 ${n} sale pero lo alcanzan.`,
    counter_pass:   `❌ Pase cortado — el rival contraataca!`,
    counter_hold:   `💪 ${n} pierde la pelota.`,
    drib_cut:       `❌ ${n} intenta gambetear pero se la sacan.`,
    drib_band:      `⚡ ${n} manda el centro afuera.`,
    drib_back:      `🔄 La devolución de ${n} llega fuera de tiempo.`,
    def_tackle:     `🟡 Falta de ${n} — pelota para el rival.`,
    def_press:      `⚡ ${n} presiona pero lo superan.`,
    def_cover:      `🧱 ${n} se posiciona mal y el rival se filtra!`,
    block_dive:     `😰 El remate va al otro palo — ${n} no llega!`,
    block_body:     `💥 ${n} lo intenta pero el remate lo supera.`,
    block_anticipate:`🔮 ${n} leyó mal — el rival define al otro lado!`,
  };

  const GOAL_IDS   = new Set(['shoot_power','shoot_place','pen_corner','pen_chip','pen_center','corner_cross','corner_short','corner_direct','drib_cut','drib_band','drib_back']);
  const ASSIST_IDS = new Set(['pass_assist','counter_sprint','counter_pass']);
  const DEF_FAIL   = new Set(['def_tackle','def_press','def_cover','block_dive','block_body','block_anticipate','counter_hold']);

  let goalFor: 'user' | 'rival' | null = null;
  if (success) {
    if (GOAL_IDS.has(option.id)) goalFor = 'user';
    else if (ASSIST_IDS.has(option.id) && Math.random() < 0.55) goalFor = 'user';
  } else {
    if (['counter_pass','counter_hold'].includes(option.id) && Math.random() < 0.60) goalFor = 'rival';
    else if (DEF_FAIL.has(option.id) && Math.random() < 0.42) goalFor = 'rival';
  }

  const pool = success ? (ok[option.id] ?? [`✅ ${n} ejecuta bien.`]) : undefined;
  const narrative = success
    ? pool![Math.floor(Math.random() * pool!.length)]
    : (fail[option.id] ?? `❌ ${n} no pudo concretar.`);

  return { success, optionChosen: option, narrative, goalFor, statGroupUsed: option.skillGroup };
}

// ─── Eventos de narrativa ─────────────────────────────────────────────────────

const USER_BUILD_EVENTS: TurnEvent[] = [
  { text:'El ala desborda por la izquierda con velocidad.',     type:'good',    zone:'user_left_wing'  },
  { text:'El pivot baja a pedir la pelota.',                    type:'neutral', zone:'midfield'        },
  { text:'Combinación rápida entre ala y pivot.',               type:'good',    zone:'user_attack'     },
  { text:'El cierre abre por la derecha con calidad.',          type:'neutral', zone:'user_right_wing' },
  { text:'Pase filtrado que perfora la línea rival.',           type:'good',    zone:'user_attack'     },
  { text:'El equipo mueve la pelota con paciencia.',            type:'neutral', zone:'midfield'        },
  { text:'El pivot gana el duelo físico en el área.',           type:'good',    zone:'user_attack'     },
  { text:'El ala derecho sube y mete presión alta.',            type:'good',    zone:'user_right_wing' },
  { text:'Buena transición, el equipo llega al último tercio.', type:'good',    zone:'user_attack'     },
];

const RIVAL_BUILD_EVENTS: TurnEvent[] = [
  { text:'El rival mueve la pelota por el costado.',            type:'bad',     zone:'rival_attack'    },
  { text:'El cierre rival presiona para ganar espacio.',        type:'bad',     zone:'user_defense'    },
  { text:'El rival construye desde atrás con tranquilidad.',    type:'bad',     zone:'midfield'        },
  { text:'El pivot rival baja a recibir y gira.',               type:'bad',     zone:'rival_attack'    },
  { text:'El rival combina bien y se acerca al área.',          type:'bad',     zone:'user_defense'    },
  { text:'Presión alta del rival, obliga a jugar largo.',       type:'bad',     zone:'user_defense'    },
  { text:'El rival encuentra espacios por la derecha.',         type:'bad',     zone:'rival_attack'    },
];

const INTROS: Record<MomentType, string[]> = {
  shot:    ['¡Mano a mano! El arco está solo.','¡En posición de gol!','¡Pelota que se da una vez!'],
  penalty: ['¡PENAL! El árbitro señala el punto.','¡Mano dentro del área!'],
  corner:  ['¡Córner! Momento para hacer daño.','¡Pelota parada peligrosa!'],
  counter: ['¡CONTRAATAQUE! Tres contra dos!','¡La defensa rival dormida!'],
  dribble: ['¡Mano a mano en la banda!','¡El ala con espacio para gambetear!'],
  defense: ['¡El rival avanza peligrosamente!','¡Momento clave en defensa!'],
  block:   ['¡Mano a mano con el goleador rival!','¡Última línea de defensa!'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Generar fase (user o rival) ──────────────────────────────────────────────

function generateUserPhase(
  userCards: UserCard[],
  minute: number,
  advantage: number,
): PhaseResult {
  const atk = clamp01(0.38 + advantage * 0.5 + Math.random() * 0.38);

  // 2 eventos de build-up antes del momento
  const events: TurnEvent[] = [
    pickRandom(USER_BUILD_EVENTS),
    pickRandom(USER_BUILD_EVENTS),
  ];

  if (atk > 0.58) {
    const r = Math.random();
    const type: MomentType =
      r < 0.28 ? 'shot'    :
      r < 0.44 ? 'dribble' :
      r < 0.56 ? 'counter' :
      r < 0.66 ? 'corner'  :
      r < 0.74 ? 'penalty' : 'shot';

    const zoneMap: Record<MomentType, { pos?: string; zone: CourtZone }> = {
      shot:    { pos:'pivot',   zone:'user_attack'     },
      penalty: { pos:'pivot',   zone:'user_attack'     },
      corner:  { pos:'ala',     zone:'user_left_wing'  },
      counter: { pos:'pivot',   zone:'user_right_wing' },
      dribble: { pos:'ala',     zone:'user_left_wing'  },
      defense: { pos:'cierre',  zone:'user_defense'    },
      block:   { pos:'arquero', zone:'user_defense'    },
    };
    const { pos, zone } = zoneMap[type];
    const mainCard = pickCard(userCards, pos);

    return {
      events,
      narrative: '',
      moment: {
        type, mainCard, minute,
        options: buildOptions(type, mainCard),
        timeLimit: calcDecisionTime(mainCard),
        zone,
        intro: pickRandom(INTROS[type]),
      },
    };
  }

  // No llegó al momento — perdió posesión
  return {
    events,
    narrative: pickRandom([
      'El ataque se disuelve — el rival recupera.',
      'La defensa rival despeja el peligro.',
      'La pelota sale al fondo, saque de arco rival.',
      'El intento no prospera, recupera el rival.',
    ]),
  };
}

function generateRivalPhase(
  userCards: UserCard[],
  minute: number,
  advantage: number,
  rivalName: string,
): PhaseResult {
  const atk = clamp01(0.32 - advantage * 0.4 + Math.random() * 0.42);

  const events: TurnEvent[] = [
    pickRandom(RIVAL_BUILD_EVENTS),
    pickRandom(RIVAL_BUILD_EVENTS),
  ];

  if (atk > 0.58) {
    const defCard = pickCard(userCards, 'cierre');
    const defVal  = calcGroupValue(defCard, 'defense');
    const defOk   = clamp01(0.44 + advantage * 0.28 + (defVal - 50) / 180);

    if (Math.random() < defOk) {
      const msgs = [
        `🛡️ ${getCardData(defCard).name} corta el avance del rival!`,
        `🧤 Gran tapada — el balón sale al córner.`,
        `🦵 Entrada limpia, el rival pierde la pelota.`,
        `💪 ${getCardData(defCard).name} gana el duelo y despeja.`,
      ];
      return { events, narrative: pickRandom(msgs) };
    } else {
      const fns = [
        (r: string) => `💔 ¡${r} la manda adentro de contraataque!`,
        (r: string) => `😤 Golazo del ${r}. La defensa dormida.`,
        (r: string) => `😰 ${r} aprovecha el error y convierte!`,
        (r: string) => `🔥 ${r} define con frialdad. A reponerse.`,
      ];
      return {
        events,
        narrative: '',
        autoGoal: 'rival' as const,
      };
    }
  }

  return {
    events,
    narrative: pickRandom([
      'El rival no logra penetrar — la defensa aguanta.',
      'El arquero sale y corta el avance rival.',
      'El cierre cierra el pasillo, sin daño.',
      'El rival pierde la pelota en campo propio.',
    ]),
  };
}

// ─── Generar turno completo (user phase + rival phase) ────────────────────────

export function generateTurn(
  userCards: UserCard[],
  minute: number,
  advantage: number,
  rivalName: string,
): TurnResult {
  return {
    userPhase:  generateUserPhase(userCards, minute, advantage),
    rivalPhase: generateRivalPhase(userCards, minute, advantage, rivalName),
  };
}

// ─── Potencia ─────────────────────────────────────────────────────────────────

export function calculateCardPower(card: UserCard): number {
  const d = getCardData(card);
  return Math.floor(d.overall_rating * (1 + (card.level - 1) * 0.05));
}

export function calculateTeamPower(cards: UserCard[]) {
  if (!cards?.length) return { totalPower:0, bonus:0, finalPower:0, synergyDetails:[] as string[] };
  const totalPower = cards.reduce((s, c) => s + calculateCardPower(c), 0);
  let bonus = 0;
  const synergyDetails: string[] = [];
  const positions = cards.map(c => getCardData(c).position);
  const uPos = new Set(positions);
  if (uPos.size === 4)      { bonus += 10; synergyDetails.push('Equipo balanceado: +10%'); }
  else if (uPos.size >= 3)  { bonus += 5;  synergyDetails.push('Buena formación: +5%');   }
  const pc: Record<string, number> = {};
  positions.forEach(p => { pc[p] = (pc[p] || 0) + 1; });
  for (const [pos, count] of Object.entries(pc)) {
    if (count >= 2) { const b = count === 2 ? 3 : 5; bonus += b; synergyDetails.push(`${pos.toUpperCase()} x${count}: +${b}%`); }
  }
  const avgLvl = cards.reduce((s, c) => s + c.level, 0) / cards.length;
  if (avgLvl >= 4)     { bonus += 8; synergyDetails.push('Veteranos: +8%'); }
  else if (avgLvl >= 3){ bonus += 4; synergyDetails.push('Experimentados: +4%'); }
  return { totalPower, bonus, finalPower: Math.floor(totalPower * (1 + bonus / 100)), synergyDetails };
}

export function addExperienceToCard(card: UserCard, exp: number) {
  let e = (card.experience || 0) + exp, lv = card.level, up = false;
  while (e >= lv * 100 && lv < 10) { e -= lv * 100; lv++; up = true; }
  return { card: { ...card, level: lv, experience: e }, leveledUp: up };
}

// compat
export function calculateBattle(
  userCards: UserCard[], opponentCards: UserCard[],
  userCategory = '1era', opponentCategory = '8va',
) {
  const uP = calculateTeamPower(userCards).finalPower;
  const oP = calculateTeamPower(opponentCards).finalPower;
  const cb: Record<string, number> = { '1era':20,'3ra':15,'4ta':12,'5ta':10,'6ta':8,'7ma':5,'8va':0,'femenino':5,'Promocionales':15 };
  const uW = Math.min(80, Math.max(20, (uP + (cb[userCategory] ?? 0)) / ((uP + (cb[userCategory] ?? 0)) + (oP + (cb[opponentCategory] ?? 0))) * 100));
  const wins = Math.random() * 100 < uW;
  const uS = Math.floor(Math.random() * 6);
  const oS = wins ? Math.max(0, Math.floor(Math.random() * uS)) : Math.min(5, uS + Math.floor(Math.random() * 3) + 1);
  return {
    winner: wins ? 'user' as const : 'opponent' as const,
    userScore: uS, opponentScore: oS,
    experienceGained: 20 + (wins ? 15 : 5) + Math.min(10, Math.abs(uS - oS) * 2),
    bonusMessage: null,
  };
}