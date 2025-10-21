// simulationReducer.js
import { MATCH_CONFIG } from './futsalConfig';

// --- LÓGICA PRINCIPAL DE LA SIMULACIÓN ---

// 1. CÁLCULO DE HABILIDADES POR POSICIÓN
const calculatePlayerRating = (player, position) => {
  if (!player) return 50;
  
  const positionWeights = {
    'GK': { tiro: 0.1, potencia: 0.2, defensa: 0.5, velocidad: 0.2 }, // Portero
    'DF': { tiro: 0.15, potencia: 0.25, defensa: 0.4, velocidad: 0.2 }, // Defensa
    'MF': { tiro: 0.3, potencia: 0.25, defensa: 0.25, velocidad: 0.2 }, // Medio
    'FW': { tiro: 0.4, potencia: 0.3, defensa: 0.1, velocidad: 0.2 }, // Delantero
  };

  const weights = positionWeights[position] || positionWeights.MF;
  return (
    (player.tiro || 50) * weights.tiro +
    (player.potencia || 50) * weights.potencia +
    (player.defensa || 50) * weights.defensa +
    (player.velocidad || 50) * weights.velocidad
  );
};

// 2. OBTENER JUGADOR ACTIVO SEGÚN FORMACIÓN
const getActivePlayer = (team, formation, playerType) => {
  const formations = {
    '2-1-1': ['GK', 'DF', 'DF', 'MF', 'FW'],
    '3-1': ['GK', 'DF', 'DF', 'DF', 'FW'],
    '1-2-1': ['GK', 'DF', 'MF', 'MF', 'FW']
  };

  const positions = formations[formation] || formations['2-1-1'];
  
  // Probabilidades según posición (los delanteros tienen más probabilidad de acción ofensiva)
  const positionWeights = {
    'GK': 0.05,  // Portero raramente inicia jugadas
    'DF': 0.2,   // Defensas menos probabilidad
    'MF': 0.35,  // Medios probabilidad media
    'FW': 0.4    // Delanteros más probabilidad
  };

  // Seleccionar jugador basado en pesos
  let random = Math.random();
  let cumulative = 0;
  let selectedPosition = 'MF'; // Por defecto

  for (const pos of positions) {
    cumulative += positionWeights[pos];
    if (random <= cumulative) {
      selectedPosition = pos;
      break;
    }
  }

  return {
    player: team,
    position: selectedPosition,
    rating: calculatePlayerRating(team, selectedPosition)
  };
};

// 3. GENERADOR DE EVENTOS MEJORADO
const generateMatchEvent = (state) => {
  const { possession, character, selectedBot, tactic, userFormation, botFormation } = state;
  
  const attackerTeam = possession === 'user' ? character : selectedBot;
  const defenderTeam = possession === 'user' ? selectedBot : character;
  const attackerFormation = possession === 'user' ? userFormation : botFormation;
  const defenderFormation = possession === 'user' ? botFormation : userFormation;

  // Obtener jugadores activos para esta acción
  const attacker = getActivePlayer(attackerTeam, attackerFormation, 'attacker');
  const defender = getActivePlayer(defenderTeam, defenderFormation, 'defender');

  // --- Probabilidades base ajustadas por posición ---
  let probs = {
    [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.5,
    [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.25,
    [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.15,
    [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.05,
    [MATCH_CONFIG.EVENT_TYPES.DRIBBLE]: 0.05,
  };

  // Ajustes por posición del atacante
  if (attacker.position === 'FW') {
    probs.shot += 0.1;
    probs.pass -= 0.1;
  } else if (attacker.position === 'DF') {
    probs.shot -= 0.1;
    probs.pass += 0.1;
  }

  // --- Ajuste por TÁCTICAS ---
  if (possession === 'user') {
    if (tactic === MATCH_CONFIG.TACTICS.OFFENSIVE) {
      probs.shot += 0.08;
      probs.dribble += 0.05;
      probs.pass -= 0.13;
    } else if (tactic === MATCH_CONFIG.TACTICS.DEFENSIVE) {
      probs.shot -= 0.08;
      probs.pass += 0.08;
    }
  }

  // Ajuste similar para el bot (IA básica)
  if (possession === 'bot') {
    const botTactic = state.botTactic || MATCH_CONFIG.TACTICS.BALANCED;
    if (botTactic === MATCH_CONFIG.TACTICS.OFFENSIVE) {
      probs.shot += 0.06;
      probs.dribble += 0.04;
      probs.pass -= 0.1;
    }
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

  // --- Resultado de la acción ---
  const successChance = (attacker.rating / (attacker.rating + defender.rating)) * (1 + (Math.random() - 0.5) * 0.3);
  const success = Math.random() < successChance;
  
  const event = {
    id: Date.now() + Math.random(),
    time: `${state.matchTime}'`,
    attackerPosition: attacker.position,
    defenderPosition: defender.position
  };

  // TIRO
  if (action === MATCH_CONFIG.EVENT_TYPES.SHOT) {
    const shotPower = calculatePlayerRating(attackerTeam, 'FW'); // Los tiros siempre los evalúa un delantero
    const savePower = calculatePlayerRating(defenderTeam, 'GK'); // Las paradas siempre las evalúa el portero
    
    const goalChance = (shotPower / (shotPower + savePower * 1.2));
    
    if (Math.random() < goalChance) {
      return { 
        ...event, 
        type: MATCH_CONFIG.EVENT_TYPES.GOAL, 
        team: possession, 
        text: `¡GOOOL de ${attackerTeam.name} (${attacker.position})! Disparo imparable.`, 
        intensity: 'very-high' 
      };
    }
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.SAVE, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: `¡PARADÓN de ${defenderTeam.name} (${defender.position})! Detiene el tiro de ${attackerTeam.name}.`, 
      intensity: 'high' 
    };
  }
  
  // REGATE
  if (action === MATCH_CONFIG.EVENT_TYPES.DRIBBLE) {
    if (success) {
      return { 
        ...event, 
        type: MATCH_CONFIG.EVENT_TYPES.DRIBBLE, 
        team: possession, 
        text: `¡${attackerTeam.name} (${attacker.position}) supera con un regate!`, 
        intensity: 'medium' 
      };
    }
    // Si falla el regate, se convierte en tackle
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.TACKLE, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: `¡${defenderTeam.name} (${defender.position}) intercepta el regate!`, 
      intensity: 'medium' 
    };
  }

  // TACKLE O FALTA
  if (action === MATCH_CONFIG.EVENT_TYPES.TACKLE || (action === MATCH_CONFIG.EVENT_TYPES.PASS && !success)) {
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.TACKLE, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: `¡${defenderTeam.name} (${defender.position}) roba el balón!`, 
      intensity: 'medium' 
    };
  }
  
  if (action === MATCH_CONFIG.EVENT_TYPES.FOUL) {
    return { 
      ...event, 
      type: MATCH_CONFIG.EVENT_TYPES.FOUL, 
      team: possession === 'user' ? 'bot' : 'user', 
      text: `Falta de ${defenderTeam.name} (${defender.position}).`, 
      intensity: 'medium' 
    };
  }

  // PASE EXITOSO
  return { 
    ...event, 
    type: MATCH_CONFIG.EVENT_TYPES.PASS, 
    team: possession, 
    text: `${attackerTeam.name} (${attacker.position}) avanza con el balón.`, 
    intensity: 'low' 
  };
};

// 4. REDUCER ACTUALIZADO
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
      
      // Actualizar estadísticas según evento
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
      } else if (event.type === 'pass') {
        newStats[event.team].passes++;
      } else if (event.type === 'dribble') {
        newStats[event.team].dribbles++;
      }
      
      return {
        ...state,
        matchTime: newTime,
        possession: event.team,
        matchEvents: [event, ...state.matchEvents.slice(0, 24)],
        matchStats: newStats
      };
    }

    case 'CHANGE_FORMATION':
      return { 
        ...state, 
        userFormation: action.payload 
      };

    case 'CHANGE_BOT_FORMATION':
      return { 
        ...state, 
        botFormation: action.payload 
      };

    case 'CHANGE_BOT_TACTIC':
      return { 
        ...state, 
        botTactic: action.payload 
      };
      
    case 'CHANGE_SPEED':
      return { ...state, speed: action.payload };

    case 'CHANGE_TACTIC':
      return { ...state, tactic: action.payload };

    case 'END_MATCH':
      return { ...state, simulating: false };
      
    case 'SHOW_RESULTS':
      return {
        ...state,
        simulating: false,
        matchResult: action.payload,
      };
      
    case 'CLOSE_RESULTS':
      return {
        ...state,
        matchResult: null,
        matchTime: 0,
        matchEvents: [],
        matchStats: null,
      };
      
    default:
      return state;
  }
}
