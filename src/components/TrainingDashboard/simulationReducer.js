// simulationReducer.js - VERSIÓN MEJORADA Y MÁS REALISTA
import { MATCH_CONFIG } from './futsalConfig';

// --- LÓGICA PRINCIPAL MEJORADA ---

// 1. CÁLCULO DE HABILIDADES MÁS DETALLADO
const calculatePlayerRating = (player, position, context = 'general') => {
  if (!player) return 50;
  
  const positionWeights = {
    'GK': { 
      general: { tiro: 0.1, potencia: 0.2, defensa: 0.5, velocidad: 0.2 },
      shot: { tiro: 0.05, potencia: 0.4, defensa: 0.4, velocidad: 0.15 },
      save: { tiro: 0.0, potencia: 0.3, defensa: 0.6, velocidad: 0.1 }
    },
    'DF': { 
      general: { tiro: 0.15, potencia: 0.25, defensa: 0.4, velocidad: 0.2 },
      tackle: { tiro: 0.1, potencia: 0.3, defensa: 0.5, velocidad: 0.1 },
      pass: { tiro: 0.2, potencia: 0.3, defensa: 0.3, velocidad: 0.2 }
    },
    'MF': { 
      general: { tiro: 0.3, potencia: 0.25, defensa: 0.25, velocidad: 0.2 },
      dribble: { tiro: 0.2, potencia: 0.2, defensa: 0.2, velocidad: 0.4 },
      pass: { tiro: 0.25, potencia: 0.3, defensa: 0.2, velocidad: 0.25 }
    },
    'FW': { 
      general: { tiro: 0.4, potencia: 0.3, defensa: 0.1, velocidad: 0.2 },
      shot: { tiro: 0.5, potencia: 0.4, defensa: 0.0, velocidad: 0.1 },
      dribble: { tiro: 0.3, potencia: 0.2, defensa: 0.1, velocidad: 0.4 }
    },
  };

  const weights = positionWeights[position]?.[context] || positionWeights[position]?.general || positionWeights.MF.general;
  
  return Math.min(100, Math.max(20,
    (player.tiro || 50) * weights.tiro +
    (player.potencia || 50) * weights.potencia +
    (player.defensa || 50) * weights.defensa +
    (player.velocidad || 50) * weights.velocidad
  ));
};

// 2. SISTEMA DE FATIGA Y MOMENTO
const calculateFatigueModifier = (matchTime, playerRating) => {
  const fatigueRate = 0.15; // 15% de reducción al final del partido
  const timeFactor = matchTime / MATCH_CONFIG.DURATION;
  const fatigueEffect = 1 - (fatigueRate * timeFactor);
  
  // Jugadores con mejor condición física se fatigan menos
  const staminaBonus = (playerRating - 50) / 100 * 0.1;
  
  return Math.max(0.7, Math.min(1.2, fatigueEffect + staminaBonus));
};

// 3. OBTENER JUGADOR ACTIVO MEJORADO (con contexto)
const getActivePlayer = (team, formation, playerType, matchTime) => {
  const formations = {
    '2-1-1': ['GK', 'DF', 'DF', 'MF', 'FW'],
    '3-1': ['GK', 'DF', 'DF', 'DF', 'FW'],
    '1-2-1': ['GK', 'DF', 'MF', 'MF', 'FW'],
    '2-2': ['GK', 'DF', 'DF', 'MF', 'MF'], // Nueva formación
    '1-3': ['GK', 'DF', 'MF', 'MF', 'MF']  // Nueva formación ofensiva
  };

  const positions = formations[formation] || formations['2-1-1'];
  
  // Probabilidades contextuales según tipo de acción
  const positionWeights = {
    'attacking': { 'GK': 0.02, 'DF': 0.18, 'MF': 0.4, 'FW': 0.4 },
    'defending': { 'GK': 0.1, 'DF': 0.5, 'MF': 0.3, 'FW': 0.1 },
    'general': { 'GK': 0.05, 'DF': 0.25, 'MF': 0.4, 'FW': 0.3 }
  };

  const weights = positionWeights[playerType] || positionWeights.general;
  
  // Ajustar por fatiga (los delanteros se fatigan más)
  const fatigueFactors = { 'GK': 0.9, 'DF': 0.95, 'MF': 1.0, 'FW': 1.05 };
  let adjustedWeights = { ...weights };
  
  Object.keys(adjustedWeights).forEach(pos => {
    const fatigue = calculateFatigueModifier(matchTime, calculatePlayerRating(team, pos));
    adjustedWeights[pos] *= fatigue * (fatigueFactors[pos] || 1);
  });

  // Normalizar pesos
  const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
  Object.keys(adjustedWeights).forEach(pos => {
    adjustedWeights[pos] /= totalWeight;
  });

  // Seleccionar jugador
  let random = Math.random();
  let cumulative = 0;
  let selectedPosition = 'MF';

  for (const pos of positions) {
    cumulative += adjustedWeights[pos] || 0;
    if (random <= cumulative) {
      selectedPosition = pos;
      break;
    }
  }

  const baseRating = calculatePlayerRating(team, selectedPosition);
  const fatigueModifier = calculateFatigueModifier(matchTime, baseRating);
  
  return {
    player: team,
    position: selectedPosition,
    rating: baseRating * fatigueModifier,
    fatigue: fatigueModifier
  };
};

// 4. SISTEMA DE ZONAS DEL CAMPO
const getFieldZone = (attackerPosition, actionType) => {
  const zones = {
    'GK': 'defensive',
    'DF': Math.random() < 0.7 ? 'defensive' : 'midfield',
    'MF': Math.random() < 0.6 ? 'midfield' : 'attacking',
    'FW': Math.random() < 0.8 ? 'attacking' : 'midfield'
  };
  
  return zones[attackerPosition] || 'midfield';
};

// 5. SIMULAR DOBLE PENALTI MEJORADO
const simulateDoublePenalty = (attackerTeam, defenderTeam, matchTime) => {
  const attacker = getActivePlayer(attackerTeam, '2-1-1', 'attacking', matchTime);
  const defender = getActivePlayer(defenderTeam, '2-1-1', 'defending', matchTime);
  
  const shotPower = calculatePlayerRating(attackerTeam, 'FW', 'shot') * attacker.fatigue;
  const savePower = calculatePlayerRating(defenderTeam, 'GK', 'save') * defender.fatigue;
  
  // En doble penalti, el portero tiene menos ventaja
  const baseChance = (shotPower / (shotPower + savePower * 1.0));
  
  // Factor de presión (últimos minutos)
  const pressureFactor = matchTime > 35 ? 1.1 : 1.0;
  const goalChance = Math.min(0.85, baseChance * pressureFactor);
  
  const isGoal = Math.random() < goalChance;
  
  const shotDescriptions = [
    `coloca el balón en la escuadra`,
    `dispara potente al ángulo`,
    `ejecuta un tiro colocado`,
    `lanza un rocket imparable`,
    `define con precisión`
  ];
  
  const saveDescriptions = [
    `se estrella contra el poste`,
    `es despejado por el portero`,
    `sale por poco desviado`,
    `es atajado milagrosamente`
  ];
  
  const description = isGoal 
    ? shotDescriptions[Math.floor(Math.random() * shotDescriptions.length)]
    : saveDescriptions[Math.floor(Math.random() * saveDescriptions.length)];

  return {
    isGoal,
    text: isGoal 
      ? `¡GOOOL DE DOBLE PENALTI! ${attackerTeam.name} ${description}.`
      : `¡PARADA INCREÍBLE! El tiro de ${attackerTeam.name} ${description}.`,
    intensity: 'very-high'
  };
};

// 6. GENERADOR DE EVENTOS MÁS REALISTA
const generateMatchEvent = (state) => {
  const { possession, character, selectedBot, tactic, userFormation, botFormation, fouls, matchTime } = state;
  
  const attackerTeam = possession === 'user' ? character : selectedBot;
  const defenderTeam = possession === 'user' ? selectedBot : character;
  const attackerFormation = possession === 'user' ? userFormation : botFormation;
  const defenderFormation = possession === 'user' ? botFormation : userFormation;

  // Verificar doble penalti por acumulación de faltas
  const currentTeamFouls = fouls[possession] || 0;
  if (currentTeamFouls >= MATCH_CONFIG.FOULS.DOUBLE_PENALTY_FOUL) {
    const penaltyResult = simulateDoublePenalty(attackerTeam, defenderTeam, matchTime);
    
    return {
      id: Date.now() + Math.random(),
      time: `${state.matchTime}'`,
      type: MATCH_CONFIG.EVENT_TYPES.DOUBLE_PENALTY,
      team: possession,
      text: penaltyResult.text,
      intensity: penaltyResult.intensity,
      isGoal: penaltyResult.isGoal,
      isDoublePenalty: true
    };
  }

  // Obtener jugadores con contexto
  const attacker = getActivePlayer(attackerTeam, attackerFormation, 'attacking', matchTime);
  const defender = getActivePlayer(defenderTeam, defenderFormation, 'defending', matchTime);
  
  const fieldZone = getFieldZone(attacker.position, 'general');

  // --- Probabilidades base por ZONA DEL CAMPO ---
  let probs = {
    [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.45,
    [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.2,
    [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.15,
    [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.08,
    [MATCH_CONFIG.EVENT_TYPES.DRIBBLE]: 0.12,
  };

  // Ajustes por ZONA
  if (fieldZone === 'defensive') {
    probs.shot -= 0.15;
    probs.pass += 0.1;
    probs.tackle += 0.05;
  } else if (fieldZone === 'attacking') {
    probs.shot += 0.15;
    probs.pass -= 0.1;
    probs.dribble += 0.05;
  }

  // Ajustes por POSICIÓN del atacante
  if (attacker.position === 'FW') {
    probs.shot += 0.1;
    probs.dribble += 0.05;
    probs.pass -= 0.15;
  } else if (attacker.position === 'DF') {
    probs.shot -= 0.1;
    probs.pass += 0.1;
    probs.tackle += 0.05;
  } else if (attacker.position === 'GK') {
    probs.shot = 0.01; // Casi nunca tira un portero
    probs.pass = 0.8;  // Muchos pases
  }

  // --- Ajuste por TÁCTICAS MEJORADO ---
  if (possession === 'user') {
    if (tactic === MATCH_CONFIG.TACTICS.OFFENSIVE) {
      probs.shot += 0.1;
      probs.dribble += 0.07;
      probs.pass -= 0.17;
    } else if (tactic === MATCH_CONFIG.TACTICS.DEFENSIVE) {
      probs.shot -= 0.08;
      probs.pass += 0.1;
      probs.tackle += 0.05;
    } else if (tactic === MATCH_CONFIG.TACTICS.COUNTER_ATTACK) {
      probs.dribble += 0.08;
      probs.pass += 0.05;
      probs.shot -= 0.03;
    }
  }

  // IA del bot más inteligente
  if (possession === 'bot') {
    const botTactic = state.botTactic || MATCH_CONFIG.TACTICS.BALANCED;
    const scoreDiff = (state.matchStats?.bot?.goals || 0) - (state.matchStats?.user?.goals || 0);
    
    if (botTactic === MATCH_CONFIG.TACTICS.OFFENSIVE) {
      probs.shot += 0.08;
      probs.dribble += 0.06;
      probs.pass -= 0.14;
    } else if (botTactic === MATCH_CONFIG.TACTICS.DEFENSIVE && scoreDiff > 0) {
      // Si va ganando, se defiende más
      probs.shot -= 0.1;
      probs.pass += 0.12;
      probs.tackle += 0.05;
    } else if (botTactic === MATCH_CONFIG.TACTICS.COUNTER_ATTACK && scoreDiff < 0) {
      // Si va perdiendo, contraataca
      probs.dribble += 0.1;
      probs.shot += 0.05;
    }
  }

  // --- AJUSTES POR FATIGA (minutos finales) ---
  if (matchTime > 35) {
    const fatigueFactor = 1 - ((matchTime - 35) / 5) * 0.3; // Reducción progresiva
    probs.dribble *= fatigueFactor;
    probs.shot *= fatigueFactor;
    probs.pass /= fatigueFactor; // Más pases por cansancio
  }

  // Normalizar probabilidades
  const total = Object.values(probs).reduce((sum, prob) => sum + prob, 0);
  Object.keys(probs).forEach(key => probs[key] /= total);

  // --- Selección de acción ---
  const random = Math.random();
  let cumulative = 0;
  let action = MATCH_CONFIG.EVENT_TYPES.PASS;
  
  for (const [type, prob] of Object.entries(probs)) {
    cumulative += prob;
    if (random <= cumulative) {
      action = type;
      break;
    }
  }

  // --- CALCULO DE ÉXITO MÁS REALISTA ---
  const contextRatings = {
    [MATCH_CONFIG.EVENT_TYPES.SHOT]: {
      attacker: calculatePlayerRating(attackerTeam, 'FW', 'shot') * attacker.fatigue,
      defender: calculatePlayerRating(defenderTeam, 'GK', 'save') * defender.fatigue
    },
    [MATCH_CONFIG.EVENT_TYPES.DRIBBLE]: {
      attacker: calculatePlayerRating(attackerTeam, attacker.position, 'dribble') * attacker.fatigue,
      defender: calculatePlayerRating(defenderTeam, defender.position, 'tackle') * defender.fatigue
    },
    [MATCH_CONFIG.EVENT_TYPES.PASS]: {
      attacker: calculatePlayerRating(attackerTeam, attacker.position, 'pass') * attacker.fatigue,
      defender: calculatePlayerRating(defenderTeam, defender.position, 'tackle') * defender.fatigue
    },
    [MATCH_CONFIG.EVENT_TYPES.TACKLE]: {
      attacker: calculatePlayerRating(attackerTeam, attacker.position, 'tackle') * attacker.fatigue,
      defender: calculatePlayerRating(defenderTeam, defender.position, 'dribble') * defender.fatigue
    }
  };

  const ratings = contextRatings[action] || contextRatings.pass;
  const successChance = (ratings.attacker / (ratings.attacker + ratings.defender)) * (1 + (Math.random() - 0.5) * 0.2);
  const success = Math.random() < successChance;

  const event = {
    id: Date.now() + Math.random(),
    time: `${state.matchTime}'`,
    attackerPosition: attacker.position,
    defenderPosition: defender.position,
    fieldZone: fieldZone
  };

  // --- RESULTADOS DETALLADOS POR ACCIÓN ---

  // TIRO A PUERTA
  if (action === MATCH_CONFIG.EVENT_TYPES.SHOT) {
    const shotQuality = ratings.attacker / 100;
    const saveQuality = ratings.defender / 100;
    
    const goalChance = (shotQuality / (shotQuality + saveQuality * 1.2));
    
    if (Math.random() < goalChance) {
      const goalTexts = [
        `¡GOOOL de ${attackerTeam.name}! ${attacker.position} define con clase.`,
        `¡GOOOLAZO de ${attackerTeam.name}! ${attacker.position} no perdona.`,
        `¡GOOOL de ${attackerTeam.name}! ${attacker.position} anota con precisión.`,
        `¡GOOOL de ${attackerTeam.name}! ${attacker.position} fusila al ángulo.`
      ];
      
      return { 
        ...event, 
        type: MATCH_CONFIG.EVENT_TYPES.GOAL, 
        team: possession, 
        text: goalTexts[Math.floor(Math.random() * goalTexts.length)], 
        intensity: 'very-high' 
      };
    }
    
    const saveTexts = [
      `¡PARADÓN! El portero de ${defenderTeam.name} detiene a ${attackerTeam.name}.`,
      `¡INCREÍBLE ATAJADA! ${defenderTeam.name} salva su portería.`,
      `¡SE VA POR POCO! El tiro de ${attackerTeam.name} rozó el poste.`,
      `¡DESPEJADO! ${defenderTeam.name} evita el gol.`
    ];
    
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.SAVE, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: saveTexts[Math.floor(Math.random() * saveTexts.length)], 
      intensity: 'high' 
    };
  }
  
  // REGATE
  if (action === MATCH_CONFIG.EVENT_TYPES.DRIBBLE) {
    if (success) {
      const dribbleTexts = [
        `¡REGATE IMPRESIONANTE! ${attackerTeam.name} supera la marca.`,
        `¡HABILIDAD PURA! ${attackerTeam.name} deja atrás al defensor.`,
        `¡ELASTICO PERFECTO! ${attackerTeam.name} avanza con clase.`
      ];
      
      return { 
        ...event, 
        type: MATCH_CONFIG.EVENT_TYPES.DRIBBLE, 
        team: possession, 
        text: dribbleTexts[Math.floor(Math.random() * dribbleTexts.length)], 
        intensity: 'medium' 
      };
    }
    
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.TACKLE, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: `¡INTERCEPTADO! ${defenderTeam.name} corta el regate.`, 
      intensity: 'medium' 
    };
  }

  // FALTA
  if (action === MATCH_CONFIG.EVENT_TYPES.FOUL) {
    const foulTexts = [
      `Falta dura de ${defenderTeam.name}.`,
      `Tarjeta amarilla para ${defenderTeam.name}.`,
      `Falta táctica de ${defenderTeam.name}.`
    ];
    
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.FOUL, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: foulTexts[Math.floor(Math.random() * foulTexts.length)], 
      intensity: 'medium',
      isFoul: true
    };
  }

  // TACKLE O INTERCEPCIÓN
  if (action === MATCH_CONFIG.EVENT_TYPES.TACKLE || (action === MATCH_CONFIG.EVENT_TYPES.PASS && !success)) {
    const tackleTexts = [
      `¡ROBO PERFECTO! ${defenderTeam.name} recupera el balón.`,
      `¡INTERCEPCIÓN CLAVE! ${defenderTeam.name} corta el ataque.`,
      `¡RECUPERACIÓN! ${defenderTeam.name} gana la posesión.`
    ];
    
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.TACKLE, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: tackleTexts[Math.floor(Math.random() * tackleTexts.length)], 
      intensity: 'medium' 
    };
  }

  // PASE EXITOSO
  const passTexts = [
    `${attackerTeam.name} combina con inteligencia.`,
    `Pase milimétrico de ${attackerTeam.name}.`,
    `${attackerTeam.name} avanza con el balón controlado.`,
    `Buena circulación de ${attackerTeam.name}.`
  ];
  
  return { 
    ...event, 
    type: MATCH_CONFIG.EVENT_TYPES.PASS, 
    team: possession, 
    text: passTexts[Math.floor(Math.random() * passTexts.length)], 
    intensity: 'low' 
  };
};

// 7. REDUCER ACTUALIZADO (se mantiene igual que tu versión)
export const initialState = {
  simulating: false,
  matchTime: 0,
  speed: 800,
  possession: 'user',
  tactic: MATCH_CONFIG.TACTICS.BALANCED,
  userFormation: '2-1-1',
  botFormation: '2-1-1',
  botTactic: MATCH_CONFIG.TACTICS.BALANCED,
  matchEvents: [],
  matchStats: null,
  character: null,
  selectedBot: null,
  matchId: null,
  matchResult: null,
  fouls: { user: 0, bot: 0 },
  pendingDoublePenalty: null
};

export function simulationReducer(state, action) {
  switch (action.type) {
    case 'START_MATCH':
      const character = { ...action.payload.character, name: action.payload.character.nickname };
      return {
        ...initialState,
        simulating: true,
        character: { ...action.payload.character, name: action.payload.character.nickname },
        selectedBot: action.payload.selectedBot,
        userFormation: action.payload.formation || '2-1-1',
        botFormation: action.payload.botFormation || '2-1-1',
        matchId: action.payload.matchId,
        matchStats: {
          user: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0, passes: 0, dribbles: 0 },
          bot: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0, passes: 0, dribbles: 0 },
        },
      };

    case 'TICK_MINUTE': {
      if (!state.simulating || state.matchTime >= MATCH_CONFIG.DURATION) {
        return { ...state, simulating: false };
      }
      
      const newTime = state.matchTime + 0.5;
      const event = generateMatchEvent(state);
      
      const newStats = JSON.parse(JSON.stringify(state.matchStats));
      const newFouls = { ...state.fouls };
      
      // Actualizar estadísticas
      if (event.type === 'goal') {
        newStats[event.team].goals++;
        newStats[event.team].shots++;
      } else if (event.type === 'save') {
        newStats[event.team].saves++;
        newStats[event.team === 'user' ? 'bot' : 'user'].shots++;
      } else if (event.type === 'tackle') {
        newStats[event.team].tackles++;
      } else if (event.type === 'foul') {
        newStats[event.team].fouls++;
        newFouls[event.team] = (newFouls[event.team] || 0) + 1;
      } else if (event.type === 'pass') {
        newStats[event.team].passes++;
      } else if (event.type === 'dribble') {
        newStats[event.team].dribbles++;
      } else if (event.type === 'double_penalty') {
        if (event.isGoal) {
          newStats[event.team].goals++;
          newStats[event.team].shots++;
        } else {
          newStats[event.team === 'user' ? 'bot' : 'user'].saves++;
          newStats[event.team].shots++;
        }
        newFouls[event.team] = 0;
      }
      
      return {
        ...state,
        matchTime: newTime,
        possession: event.isDoublePenalty ? state.possession : event.team,
        matchEvents: [event, ...state.matchEvents.slice(0, 24)],
        matchStats: newStats,
        fouls: newFouls
      };
    }

    // ... resto del reducer se mantiene igual
    case 'CHANGE_FORMATION':
      return { ...state, userFormation: action.payload };
      
    case 'CHANGE_BOT_FORMATION':
      return { ...state, botFormation: action.payload };
      
    case 'CHANGE_BOT_TACTIC':
      return { ...state, botTactic: action.payload };
      
    case 'CHANGE_SPEED':
      return { ...state, speed: action.payload };
      
    case 'CHANGE_TACTIC':
      return { ...state, tactic: action.payload };
      
    case 'END_MATCH':
      return { ...state, simulating: false };
      
    case 'SHOW_RESULTS':
      return { ...state, simulating: false, matchResult: action.payload };
      
    case 'CLOSE_RESULTS':
      return {
        ...state,
        matchResult: null,
        matchTime: 0,
        matchEvents: [],
        matchStats: null,
        fouls: { user: 0, bot: 0 },
        pendingDoublePenalty: null
      };
      
    default:
      return state;
  }
}
