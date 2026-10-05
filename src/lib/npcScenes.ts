// src/lib/npcScenes.ts

// ============================================================
// LUPI WORLD — NPC SYSTEM
// Los NPC enseñan, comentan y dan vida al lobby.
// Las reglas del juego deben salir siempre de FACTS.
// ============================================================
import type { NpcEvent } from "./npcBus";

export type NpcId = "dt" | "juan" | "javi" | "luis" | "martin";

export type Npc = {
  id: NpcId;
  name: string;
  tag: string;
  emoji: string;
  color: string;
};

export const NPCS: Record<NpcId, Npc> = {
  dt: {
    id: "dt",
    name: "DT Lupi",
    tag: "DT",
    emoji: "🧢",
    color: "#ffc83d",
  },

  juan: {
    id: "juan",
    name: "Juan",
    tag: "ARQ",
    emoji: "🧤",
    color: "#4cc3ff",
  },

  javi: {
    id: "javi",
    name: "Javi",
    tag: "CIE",
    emoji: "🛡️",
    color: "#ff7a7a",
  },

  luis: {
    id: "luis",
    name: "Luis",
    tag: "ALA",
    emoji: "⚡",
    color: "#2bd67b",
  },

  martin: {
    id: "martin",
    name: "Martín",
    tag: "PIV",
    emoji: "🎯",
    color: "#b061ff",
  },
};

// ============================================================
// REGLAS REALES DEL JUEGO
// ============================================================

export const FACTS = {
  teamSize: 5,
  maxBonusPct: 35,
  realPlayersForBonus: 3,
  pointsPerTicket: 10,
};

// ============================================================
// CONTEXTO DEL JUGADOR
// ============================================================

export type NpcContext = {
  name: string;

  /** cartas en el mazo activo */
  deckSize: number;

  /** sobres disponibles */
  packCount: number;

  /** jueves */
  isThursday: boolean;

  /** nivel actual */
  level?: number;

  /** liga actual */
  division?: string;

  /** cantidad de jugadores reales aparte del usuario */
  realOthers?: number;

  /** tiene alguna skin equipada */
  hasSkin?: boolean;
};

// ============================================================
// ESCENAS
// ============================================================

export type Line = {
  who: NpcId;
  text: string;
};

export type Scene = {
  id: string;

  /**
   * Si no se cumple, la escena no se elige.
   */
  when?: (c: NpcContext) => boolean;

  /**
   * Mayor = antes.
   */
  priority?: number | ((c: NpcContext) => number);

  /**
   * Máximo de veces que aparece entre sesiones.
   */
  maxSeen?: number;

  lines: Line[];
};

// ============================================================
// SCENES
// ============================================================

export const SCENES: Scene[] = [

  // ----------------------------------------------------------
  // BIENVENIDA
  // ----------------------------------------------------------

  {
    id: "welcome",
    priority: 100,
    maxSeen: 1,
    lines: [
      {
        who: "dt",
        text: "Ey {name}, pasá nomás. Bienvenido al vestuario.",
      },
      {
        who: "luis",
        text: "Mientras esperás, te vamos tirando algunos tips.",
      },
      {
        who: "javi",
        text: "Y cuando haya partido, salimos a jugar.",
      },
    ],
  },

  // ----------------------------------------------------------
  // EQUIPO INCOMPLETO
  // ----------------------------------------------------------

  {
    id: "five-players",
    when: (c) => c.deckSize < FACTS.teamSize,
    priority: 90,
    lines: [
      {
        who: "luis",
        text: "{name}, ¿ya armaste tu equipo?",
      },
      {
        who: "dt",
        text: `Se juega de a ${FACTS.teamSize}: arquero, cierre, dos alas y pívot.`,
      },
      {
        who: "juan",
        text: `Sin los ${FACTS.teamSize} no te dejan jugar, ojo.`,
      },
      {
        who: "dt",
        text: "Entrá a Equipo y tocá ARMADO AUTOMÁTICO si querés salir rápido.",
      },
    ],
  },

  // ----------------------------------------------------------
  // SOBRE
  // ----------------------------------------------------------

  {
    id: "daily-pack",
    when: (c) => c.packCount > 0,
    priority: 80,
    lines: [
      {
        who: "luis",
        text: "Che {name}, ¿abriste el sobre?",
      },
      {
        who: "dt",
        text: "Hay un sobre diario gratis. Está en los accesos rápidos.",
      },
      {
        who: "martin",
        text: "Después pasá por Equipo a ver qué te salió.",
      },
    ],
  },

  // ----------------------------------------------------------
  // JUEVES
  // ----------------------------------------------------------

  {
    id: "raffle",
    when: (c) => c.isThursday,
    priority: 95,
    lines: [
      {
        who: "martin",
        text: "Hoy es jueves. Ojo con el sorteo.",
      },
      {
        who: "dt",
        text: "El sorteo es a las 20.",
      },
      {
        who: "luis",
        text: "Conviene tener las entradas cargadas antes.",
      },
    ],
  },

  // ----------------------------------------------------------
  // ENTRADAS
  // ----------------------------------------------------------

  {
    id: "tickets",
    priority: 35,
    lines: [
      {
        who: "juan",
        text: "¿Fuiste a la cancha esta semana?",
      },
      {
        who: "dt",
        text: "Podés cargar tu entrada en ENTRADAS, escaneándola o a mano.",
      },
      {
        who: "javi",
        text: `Cada una suma ${FACTS.pointsPerTicket} puntos para el ranking.`,
      },
    ],
  },

  // ----------------------------------------------------------
  // POSICIONES
  // ----------------------------------------------------------

  {
    id: "positions",
    priority: 30,
    lines: [
      {
        who: "juan",
        text: "Yo soy ARQ. El que cuida el arco.",
      },
      {
        who: "javi",
        text: "CIE: el cierre, el último hombre.",
      },
      {
        who: "luis",
        text: "ALA: por las bandas, de ida y vuelta.",
      },
      {
        who: "martin",
        text: "Y PIV: el que la sostiene arriba.",
      },
      {
        who: "dt",
        text: "En tu equipo tiene que haber uno por cada puesto.",
      },
    ],
  },

  // ----------------------------------------------------------
  // BONUS
  // ----------------------------------------------------------

  {
    id: "bonus",
    priority: 25,
    lines: [
      {
        who: "martin",
        text: "¿Sabías que tu equipo puede tener bonus de poder?",
      },
      {
        who: "javi",
        text: "Cinco en cancha, una posición por número, parejas de la misma categoría...",
      },
      {
        who: "dt",
        text: `Todo suma, hasta un máximo de ${FACTS.maxBonusPct}%.`,
      },
    ],
  },

  // ----------------------------------------------------------
  // SOCIOS REALES
  // ----------------------------------------------------------

  {
    id: "real-players",
    when: (c) => (c.realOthers ?? 0) >= FACTS.realPlayersForBonus,
    priority: 85,
    lines: [
      {
        who: "juan",
        text: "Uh, ya somos varios por acá.",
      },
      {
        who: "dt",
        text: `Con ${FACTS.realPlayersForBonus} o más socios reales en tu cancha tenés bonus.`,
      },
      {
        who: "luis",
        text: "Ahora sí se está llenando esto.",
      },
    ],
  },

  // ==========================================================
  // PERSONALIDAD / VESTUARIO
  // ==========================================================

  {
    id: "locker-room-1",
    priority: 10,
    lines: [
      {
        who: "luis",
        text: "¿Quién juega una?",
      },
      {
        who: "martin",
        text: "Yo.",
      },
      {
        who: "javi",
        text: "Vos siempre decís eso.",
      },
      {
        who: "martin",
        text: "Porque siempre estoy listo.",
      },
    ],
  },

  {
    id: "locker-room-2",
    priority: 9,
    lines: [
      {
        who: "juan",
        text: "Yo solo pido una cosa.",
      },
      {
        who: "javi",
        text: "¿Qué?",
      },
      {
        who: "juan",
        text: "Que defiendan.",
      },
      {
        who: "luis",
        text: "No prometo nada.",
      },
    ],
  },

  {
    id: "locker-room-3",
    priority: 8,
    lines: [
      {
        who: "martin",
        text: "Hoy estoy intratable.",
      },
      {
        who: "luis",
        text: "Eso dijiste ayer.",
      },
      {
        who: "martin",
        text: "Y sigo pensando lo mismo.",
      },
      {
        who: "dt",
        text: "Muchachos, menos charla y más cancha.",
      },
    ],
  },

  {
    id: "locker-room-4",
    priority: 7,
    lines: [
      {
        who: "javi",
        text: "¿Alguien vio mis botines?",
      },
      {
        who: "luis",
        text: "Los tenés puestos.",
      },
      {
        who: "javi",
        text: "...bien.",
      },
    ],
  },

  // ==========================================================
  // GAMEPLAY
  // ==========================================================

  {
    id: "quick-vs-story",
    priority: 20,
    lines: [
      {
        who: "javi",
        text: "Partido rápido o modo historia, ¿cuál elegís?",
      },
      {
        who: "dt",
        text: "Rápido para entrar en ritmo. Historia para avanzar por las ligas.",
      },
      {
        who: "juan",
        text: "Yo iría directo a jugar.",
      },
    ],
  },

  {
    id: "rivals",
    priority: 18,
    lines: [
      {
        who: "luis",
        text: "Para elegir rival tenés Novato, Experto o Leyenda.",
      },
      {
        who: "dt",
        text: "Cuanto más fuerte el rival, más XP si ganás.",
      },
      {
        who: "martin",
        text: "Yo siempre voy por el difícil.",
      },
    ],
  },

  {
    id: "leagues",
    priority: 16,
    lines: [
      {
        who: "dt",
        text: "Las ligas van de Rookie a Bronce, Plata, Oro, Platino y Leyenda.",
      },
      {
        who: "martin",
        text: "Y arriba de todo está Campeón.",
      },
      {
        who: "luis",
        text: "Nos vemos ahí arriba.",
      },
    ],
  },

  // ==========================================================
  // REACCIÓN AL NIVEL
  // ==========================================================

  {
  id: "level-up",
  when: (c) => (c.level ?? 1) >= 5,
  priority: (c) => 30 + Math.min(c.level ?? 1, 20),
  maxSeen: 2,
  lines: [
    {
      who: "dt",
      text: "{name}, ya estás tomando ritmo.",
    },
    {
      who: "luis",
      text: "Se nota que ya tenés unas cuantas partidas encima.",
    },
    {
      who: "dt",
      text: "Seguí jugando y llevá ese nivel cada vez más arriba.",
    },
  ],
},

  {
    id: "level-1",
    when: (c) => (c.level ?? 1) <= 2,
    priority: 60,
    maxSeen: 1,
    lines: [
      {
        who: "dt",
        text: "Recién arrancás, {name}. Tranquilo.",
      },
      {
        who: "juan",
        text: "Primero armá el equipo y después a la cancha.",
      },
      {
        who: "luis",
        text: "Acá todos arrancamos alguna vez.",
      },
    ],
  },

  // ==========================================================
  // SKINS
  // ==========================================================

  {
    id: "skins",
    when: (c) => c.hasSkin === true,
    priority: 45,
    lines: [
      {
        who: "luis",
        text: "Ey {name}, esa skin está buena.",
      },
      {
        who: "martin",
        text: "Ahora sí entrás con estilo.",
      },
      {
        who: "javi",
        text: "La cancha es tuya.",
      },
    ],
  },

  {
    id: "no-skin",
    when: (c) => c.hasSkin === false,
    priority: 28,
    maxSeen: 1,
    lines: [
      {
        who: "luis",
        text: "{name}, te falta meterle un poco de estilo.",
      },
      {
        who: "martin",
        text: "Pasá por el probador cuando tengas un rato.",
      },
    ],
  },

  // ==========================================================
  // MUCHA GENTE
  // ==========================================================

  {
    id: "busy-lobby",
    when: (c) => (c.realOthers ?? 0) >= 2,
    priority: 75,
    lines: [
      {
        who: "juan",
        text: "Che, se está llenando esto.",
      },
      {
        who: "luis",
        text: "Ahora sí parece un lobby.",
      },
      {
        who: "dt",
        text: "Perfecto. Menos charla y más partidos.",
      },
    ],
  },

  // ==========================================================
  // LOBBY TRANQUILO
  // ==========================================================

  {
    id: "quiet-lobby",
    when: (c) => (c.realOthers ?? 0) === 0,
    priority: 22,
    lines: [
      {
        who: "martin",
        text: "Está tranquilo hoy.",
      },
      {
        who: "javi",
        text: "Mejor. Se escucha al DT.",
      },
      {
        who: "dt",
        text: "Aprovechen para preparar el equipo.",
      },
    ],
  },

  // ==========================================================
  // CIERRE / MOTIVACIÓN
  // ==========================================================

  {
    id: "ready",
    when: (c) => c.deckSize >= FACTS.teamSize,
    priority: 24,
    lines: [
      {
        who: "dt",
        text: "{name}, tenés equipo completo.",
      },
      {
        who: "juan",
        text: "Entonces no hay excusas.",
      },
      {
        who: "luis",
        text: "Nos vemos en la cancha.",
      },
    ],
  },
];

export const DEFAULT_MAX_SEEN = 2;

export type SeenMap = Record<string, number>;

// ============================================================
// SCENE PICKER
// ============================================================

export function pickScene(
  ctx: NpcContext,
  seen: SeenMap,
  lastId: string | null,
  rng: () => number = Math.random
): Scene | null {
  const eligible = SCENES.filter(
    (scene) =>
      scene.id !== lastId &&
      (seen[scene.id] ?? 0) < (scene.maxSeen ?? DEFAULT_MAX_SEEN) &&
      (scene.when ? scene.when(ctx) : true)
  );
 
  if (eligible.length === 0) return null;
 
  const priority = (scene: Scene) =>
    typeof scene.priority === "function"
      ? scene.priority(ctx)
      : scene.priority ?? 0;
 
  const top = Math.max(...eligible.map(priority));
 
  if (top >= 100) {
    const pool = eligible.filter((scene) => priority(scene) === top);
    return pool[Math.floor(rng() * pool.length)];
  }
 
  const weight = (scene: Scene) => Math.max(1, priority(scene));
  const total = eligible.reduce((sum, scene) => sum + weight(scene), 0);
 
  let roll = rng() * total;
  for (const scene of eligible) {
    roll -= weight(scene);
    if (roll < 0) return scene;
  }
  return eligible[eligible.length - 1];
}

// ============================================================
// UTILIDADES
// ============================================================

export const fillName = (
  text: string,
  name: string
) => text.replace(/\{name\}/g, name);

export function reactionFor(
  event: NpcEvent,
  _ctx: NpcContext,
  rng: () => number = Math.random
): Line[] | null {
  const pick = <T,>(items: T[]): T => items[Math.floor(rng() * items.length)];
 
  switch (event.type) {
    case "player-joined":
      return [{ who: "dt", text: `Llegó ${event.name}. Bienvenido al vestuario.` }];
 
    case "level-up":
      return [{ who: "luis", text: `¡Nivel ${event.level}, {name}! Se viene fuerte.` }];
 
    case "battle-finished":
      if (event.draw) return [{ who: "javi", text: "Empate. Hubo equilibrio, che." }];
      return event.won
        ? [{ who: "martin", text: "Buena, {name}. Así se juega." }]
        : [{ who: "juan", text: "Pasa, {name}. La próxima sale." }];
 
    case "pack-opened":
      return [
        {
          who: "luis",
          text: event.card
            ? `¡Salió ${event.card}! A ver cómo la usás.`
            : "A ver qué te salió, {name}.",
        },
      ];
 
    case "deck-complete":
      return [{ who: "dt", text: "Equipo completo, {name}. Ya podés salir a la cancha." }];
 
    case "skin-changed":
      return [{ who: "martin", text: `${event.item}, eh. Ahora sí entrás con estilo.` }];
 
    case "chat": {
      if (!event.mine) return null;
      const t = event.text.toLowerCase();
 
      if (/\b(hola|buenas|holis|ey|che)\b/.test(t)) {
        return [{ who: pick(["luis", "martin", "juan"] as const), text: "¡Buenas, {name}!" }];
      }
      if (/\b(partido|jugar|jugamos|juguemos|revancha)\b/.test(t)) {
        return [{ who: "dt", text: "Eso, {name}: a la cancha. Rápido o historia, vos elegís." }];
      }
      if (/\b(ayuda|como|cómo|no entiendo)\b/.test(t)) {
        return [{ who: "dt", text: "Cualquier duda, {name}, preguntá. Entre todos te damos una mano." }];
      }
      return null;
    }
 
    default:
      return null;
  }
}