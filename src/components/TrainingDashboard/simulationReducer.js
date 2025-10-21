// simulationReducer.js - VERSIÓN CORREGIDA
import { MATCH_CONFIG } from './futsalConfig';

// 🎯 FUNCIONES AUXILIARES QUE FALTABAN
const getSpecialAbility = (role) => {
  const abilities = {
    goleador: 'power_shot',
    defensor: 'defensive_wall', 
    portero: 'super_save',
    ala: 'speed_boost'
  };
  return abilities[role] || 'basic_skill';
};

const getDefaultPosition = (role) => {
  const positions = {
    portero: { x: 20, y: 50 },
    defensor: { x: 40, y: 50 },
    goleador: { x: 70, y: 50 },
    ala: { x: 50, y: 30 }
  };
  return positions[role] || positions.defensor;
};

const selectDefensiveRole = (attackerRole) => {
  const defensiveMap = {
    goleador: 'defensor',
    defensor: 'goleador', 
    portero: 'defensor',
    ala: 'defensor'
  };
  return defensiveMap[attackerRole] || 'defensor';
};

const updateMatchStats = (currentStats, event) => {
  const newStats = JSON.parse(JSON.stringify(currentStats));
  
  switch (event.type) {
    case MATCH_CONFIG.EVENT_TYPES.GOAL:
      newStats[event.team].goals++;
      newStats[event.team].shots++;
      break;
    case MATCH_CONFIG.EVENT_TYPES.SAVE:
      newStats[event.team === 'user' ? 'bot' : 'user'].saves++;
      newStats[event.team === 'user' ? 'bot' : 'user'].shots++;
      break;
    case MATCH_CONFIG.EVENT_TYPES.TACKLE:
      newStats[event.team].tackles++;
      break;
    case MATCH_CONFIG.EVENT_TYPES.FOUL:
      newStats[event.team].fouls++;
      break;
    case MATCH_CONFIG.EVENT_TYPES.PASS:
      // Los pases no incrementan estadísticas principales
      break;
  }
  
  return newStats;
};

const updatePlayerPositions = (currentPositions, event, ballZone, possession) => {
  // Por ahora, devolvemos las posiciones sin cambios
  // Puedes implementar lógica de movimiento más adelante
  return currentPositions;
};

const updateBallZone = (currentZone, event, possession) => {
  const zoneTransitions = {
    [MATCH_CONFIG.ZONES.USER_DEFENSE]: {
      user: [MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.CENTER],
      bot: [MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.CENTER]
    },
    [MATCH_CONFIG.ZONES.CENTER]: {
      user: [MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER],
      bot: [MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.CENTER]
    },
    [MATCH_CONFIG.ZONES.BOT_DEFENSE]: {
      user: [MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER],
      bot: [MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.CENTER]
    }
  };
  
  const transitions = zoneTransitions[currentZone]?.[possession] || [MATCH_CONFIG.ZONES.CENTER];
  return transitions[Math.floor(Math.random() * transitions.length)];
};

const updateGameDynamics = (currentMomentum, currentPressure, event) => {
  let momentumChange = 0;
  let pressureChange = { user: 0, bot: 0 };
  
  switch (event.type) {
    case MATCH_CONFIG.EVENT_TYPES.GOAL:
      momentumChange = event.team === 'user' ? 20 : -20;
      pressureChange.user = event.team === 'user' ? 15 : -10;
      pressureChange.bot = event.team === 'user' ? -15 : 10;
      break;
    case MATCH_CONFIG.EVENT_TYPES.SAVE:
      momentumChange = event.team === 'user' ? -10 : 10;
      break;
    case MATCH_CONFIG.EVENT_TYPES.TACKLE:
      momentumChange = event.team === 'user' ? 5 : -5;
      break;
  }
  
  return {
    newMomentum: Math.max(0, Math.min(100, currentMomentum + momentumChange)),
    newPressure: {
      user: Math.max(0, Math.min(100, currentPressure.user + pressureChange.user)),
      bot: Math.max(0, Math.min(100, currentPressure.bot + pressureChange.bot))
    }
  };
};

// 🎯 SISTEMA DE JUGADORES MEJORADO
const createPlayer = (baseStats, role) => ({
  ...baseStats,
  role,
  stamina: 100,
  position: getDefaultPosition(role),
  specialAbility: getSpecialAbility(role)
});

// 🎲 SISTEMA DE PROBABILIDADES MÁS ROBUSTO
const calculateActionProbabilities = (state, attackerRole, defenderRole) => {
  const { tactic, possession, ballZone } = state;
  
  // Probabilidades base según roles
  const baseProbs = {
    goleador: { 
      [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.4, 
      [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.5, 
      [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.1 
    },
    defensor: { 
      [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.4, 
      [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.5, 
      [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.1 
    },
    portero: { 
      [MATCH_CONFIG.EVENT_TYPES.SAVE]: 0.7, 
      [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.3 
    },
    ala: {
      [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.6,
      [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.3,
      [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.1
    }
  };

  let probs = { ...baseProbs[attackerRole] };

  // AJUSTES TÁCTICOS MEJORADOS
  const tacticModifiers = {
    [MATCH_CONFIG.TACTICS.OFFENSIVE]: {
      shot: 0.15, pass: -0.05, tackle: -0.10
    },
    [MATCH_CONFIG.TACTICS.DEFENSIVE]: {
      shot: -0.15, pass: 0.05, tackle: 0.10
    },
    [MATCH_CONFIG.TACTICS.BALANCED]: {
      shot: 0, pass: 0, tackle: 0
    }
  };

  const modifier = tacticModifiers[tactic];
  Object.keys(modifier).forEach(action => {
    if (probs[action]) {
      probs[action] += modifier[action];
    }
  });

  // Normalizar probabilidades
  const total = Object.values(probs).reduce((sum, prob) => sum + prob, 0);
  Object.keys(probs).forEach(key => {
    probs[key] /= total;
  });

  return probs;
};

// 🎯 SELECCIÓN INTELIGENTE DE ROLES
const selectRoleForAction = (ballZone, tactic, possession) => {
  const zoneWeights = {
    [MATCH_CONFIG.ZONES.USER_DEFENSE]: { defensor: 0.6, portero: 0.3, goleador: 0.1 },
    [MATCH_CONFIG.ZONES.CENTER]: { defensor: 0.4, goleador: 0.4, ala: 0.2 },
    [MATCH_CONFIG.ZONES.BOT_DEFENSE]: { goleador: 0.6, ala: 0.3, defensor: 0.1 }
  };

  const weights = zoneWeights[ballZone] || zoneWeights[MATCH_CONFIG.ZONES.CENTER];
  
  // Ajustar por táctica
  if (tactic === MATCH_CONFIG.TACTICS.OFFENSIVE) {
    weights.goleador += 0.2;
    weights.defensor -= 0.2;
  } else if (tactic === MATCH_CONFIG.TACTICS.DEFENSIVE) {
    weights.defensor += 0.2;
    weights.goleador -= 0.2;
  }

  return weightedRandomSelection(weights);
};

// 🎪 CREACIÓN DE EVENTOS MÁS DETALLADA
const createEventFromAction = (action, attacker, defender, attackerRole, matchTime, possession) => {
  const baseEvent = {
    id: Date.now() + Math.random(),
    time: `${matchTime}'`,
    team: possession,
    type: action,
    playerRole: attackerRole,
    intensity: getIntensityForAction(action)
  };

  const eventTemplates = {
    [MATCH_CONFIG.EVENT_TYPES.GOAL]: [
      `¡GOOOL de ${attacker.name}! Un remate espectacular.`,
      `¡GOLAZO! ${attacker.name} define con clase.`,
      `¡GOOL! ${attacker.name} no perdona.`
    ],
    [MATCH_CONFIG.EVENT_TYPES.SAVE]: [
      `¡PARADÓN del portero! Ataja el remate de ${attacker.name}.`,
      `Increíble salvada de ${defender.name}.`,
      `El portero detiene el potente disparo de ${attacker.name}.`
    ],
    [MATCH_CONFIG.EVENT_TYPES.TACKLE]: [
      `¡Gran entrada de ${defender.name}! Recupera el balón.`,
      `${defender.name} intercepta limpiamente.`,
      `Recuperación brillante de ${defender.name}.`
    ],
    [MATCH_CONFIG.EVENT_TYPES.PASS]: [
      `${attacker.name} realiza un pase preciso.`,
      `Buena circulación de ${attacker.name}.`,
      `${attacker.name} avanza con el balón.`
    ],
    [MATCH_CONFIG.EVENT_TYPES.FOUL]: [
      `Falta de ${defender.name} sobre ${attacker.name}.`,
      `Infracción cometida por ${defender.name}.`,
      `${defender.name} comete una falta.`
    ]
  };

  const texts = eventTemplates[action] || [`${attacker.name} realiza una jugada.`];
  const randomText = texts[Math.floor(Math.random() * texts.length)];

  return {
    ...baseEvent,
    text: randomText
  };
};

// 🏃‍♂️ SISTEMA DE POSICIONES DINÁMICAS
const calculatePlayerPositions = (formation, ballZone, possession) => {
  const formationTemplates = {
    '3-1': {
      user: {
        portero: createPlayer({}, 'portero'),
        defensor1: createPlayer({}, 'defensor'),
        defensor2: createPlayer({}, 'defensor'), 
        defensor3: createPlayer({}, 'defensor'),
        goleador: createPlayer({}, 'goleador')
      },
      bot: {
        portero: createPlayer({}, 'portero'),
        defensor1: createPlayer({}, 'defensor'),
        defensor2: createPlayer({}, 'defensor'),
        defensor3: createPlayer({}, 'defensor'),
        goleador: createPlayer({}, 'goleador')
      }
    }
  };

  return formationTemplates[formation] || formationTemplates['3-1'];
};

// 🎪 GENERADOR DE EVENTOS MEJORADO
const generateMatchEvent = (state) => {
  const { possession, character, selectedBot, tactic, matchTime, ballZone } = state;
  
  const attacker = possession === 'user' ? character : selectedBot;
  const defender = possession === 'user' ? selectedBot : character;
  
  // Selección inteligente de roles
  const attackerRole = selectRoleForAction(ballZone, tactic, possession);
  const defenderRole = selectDefensiveRole(attackerRole);
  
  const attackerRating = calculatePlayerRating(attacker, attackerRole);
  const defenderRating = calculatePlayerRating(defender, defenderRole);

  const probabilities = calculateActionProbabilities(state, attackerRole, defenderRole);
  const selectedAction = selectActionFromProbabilities(probabilities);
  
  return createEventFromAction(selectedAction, attacker, defender, attackerRole, matchTime, possession);
};

// 🎯 CÁLCULO DE HABILIDADES
const calculatePlayerRating = (player, role) => {
  if (!player) return 50;
  const weights = {
    goleador: { tiro: 0.4, potencia: 0.3, defensa: 0.1, velocidad: 0.2 },
    defensor: { tiro: 0.1, potencia: 0.2, defensa: 0.5, velocidad: 0.2 },
    portero: { tiro: 0.05, potencia: 0.1, defensa: 0.6, velocidad: 0.25 },
    ala: { tiro: 0.3, potencia: 0.2, defensa: 0.2, velocidad: 0.3 },
    balanced: { tiro: 0.25, potencia: 0.25, defensa: 0.25, velocidad: 0.25 }
  };
  const w = weights[role] || weights.balanced;
  return (
    (player.tiro || 50) * w.tiro +
    (player.potencia || 50) * w.potencia +
    (player.defensa || 50) * w.defensa +
    (player.velocidad || 50) * w.velocidad
  );
};

// 🛠️ FUNCIONES AUXILIARES
function weightedRandomSelection(weights) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * total;
  
  for (const [item, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return Object.keys(weights)[0];
}

function selectActionFromProbabilities(probabilities) {
  const total = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
  let random = Math.random() * total;
  
  for (const [action, prob] of Object.entries(probabilities)) {
    random -= prob;
    if (random <= 0) return action;
  }
  
  return MATCH_CONFIG.EVENT_TYPES.PASS;
}

function getIntensityForAction(action) {
  const intensities = {
    [MATCH_CONFIG.EVENT_TYPES.GOAL]: MATCH_CONFIG.INTENSITY.VERY_HIGH,
    [MATCH_CONFIG.EVENT_TYPES.SHOT]: MATCH_CONFIG.INTENSITY.HIGH,
    [MATCH_CONFIG.EVENT_TYPES.SAVE]: MATCH_CONFIG.INTENSITY.HIGH,
    [MATCH_CONFIG.EVENT_TYPES.TACKLE]: MATCH_CONFIG.INTENSITY.MEDIUM,
    [MATCH_CONFIG.EVENT_TYPES.FOUL]: MATCH_CONFIG.INTENSITY.MEDIUM,
    [MATCH_CONFIG.EVENT_TYPES.PASS]: MATCH_CONFIG.INTENSITY.LOW
  };
  
  return intensities[action] || MATCH_CONFIG.INTENSITY.LOW;
}

function createPlayerTeam(baseStats) {
  return {
    portero: createPlayer(baseStats, 'portero'),
    defensor1: createPlayer(baseStats, 'defensor'),
    defensor2: createPlayer(baseStats, 'defensor'),
    defensor3: createPlayer(baseStats, 'defensor'),
    goleador: createPlayer(baseStats, 'goleador')
  };
}

export const initialState = {
  simulating: false,
  matchTime: 0,
  speed: 800,
  possession: 'user',
  tactic: MATCH_CONFIG.TACTICS.BALANCED,
  formation: '3-1',
  ballZone: MATCH_CONFIG.ZONES.CENTER,
  matchEvents: [],
  matchStats: null,
  character: null,
  selectedBot: null,
  playerPositions: {},
  momentum: 50,
  pressure: { user: 50, bot: 50 }
};

export function simulationReducer(state, action) {
  switch (action.type) {
    case 'START_MATCH':
      const character = { 
        ...action.payload.character, 
        name: action.payload.character.nickname,
        players: createPlayerTeam(action.payload.character)
      };
      const selectedBot = {
        ...action.payload.selectedBot,
        players: createPlayerTeam(action.payload.selectedBot)
      };
      
      return {
        ...initialState,
        simulating: true,
        character,
        selectedBot,
        playerPositions: calculatePlayerPositions('3-1', MATCH_CONFIG.ZONES.CENTER, 'user'),
        matchStats: {
          user: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0, possession: 50 },
          bot: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0, possession: 50 },
        },
      };

    case 'TICK_MINUTE': {
      if (!state.simulating || state.matchTime >= MATCH_CONFIG.DURATION) {
        return { ...state, simulating: false };
      }
      
      const newTime = state.matchTime + 1;
      const event = generateMatchEvent(state);
      
      // Actualizar estadísticas
      const newStats = updateMatchStats(state.matchStats, event);
      
      // Actualizar posiciones
      const newPlayerPositions = updatePlayerPositions(
        state.playerPositions, 
        event, 
        state.ballZone,
        state.possession
      );
      
      // Actualizar zona del balón
      const newBallZone = updateBallZone(state.ballZone, event, state.possession);
      
      // Actualizar momentum y presión
      const { newMomentum, newPressure } = updateGameDynamics(
        state.momentum, 
        state.pressure, 
        event
      );

      return {
        ...state,
        matchTime: newTime,
        possession: event.team,
        ballZone: newBallZone,
        momentum: newMomentum,
        pressure: newPressure,
        playerPositions: newPlayerPositions,
        matchEvents: [event, ...state.matchEvents.slice(0, 24)],
        matchStats: newStats
      };
    }

    case 'CHANGE_FORMATION':
      return { 
        ...state, 
        formation: action.payload,
        playerPositions: calculatePlayerPositions(action.payload, state.ballZone, state.possession)
      };

    case 'CHANGE_TACTIC':
      return { ...state, tactic: action.payload };

    case 'CHANGE_SPEED':
      return { ...state, speed: action.payload };

    case 'END_MATCH':
      return { ...state, simulating: false };
      
    default:
      return state;
  }
}
