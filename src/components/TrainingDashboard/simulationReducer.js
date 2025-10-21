// simulationReducer.js
import { MATCH_CONFIG } from './futsalConfig';

// --- LÓGICA PRINCIPAL DE LA SIMULACIÓN ---

// 1. CÁLCULO DE HABILIDADES
const calculatePlayerRating = (player, role) => {
  if (!player) return 50;
  const weights = {
    goleador: { tiro: 0.4, potencia: 0.3, defensa: 0.1, velocidad: 0.2 },
    defensor: { tiro: 0.1, potencia: 0.2, defensa: 0.5, velocidad: 0.2 },
    goalkeeper: { tiro: 0.05, potencia: 0.1, defensa: 0.6, velocidad: 0.25 },
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

// 2. GENERADOR DE EVENTOS
const generateMatchEvent = (state) => {
  const { possession, character, selectedBot, tactic, matchTime } = state;
  
  const attacker = possession === 'user' ? character : selectedBot;
  const defender = possession === 'user' ? selectedBot : character;
  
  // ¡NUEVO! Seleccionamos un tipo de jugador para la acción
  const attackerRole = Math.random() > 0.3 ? 'goleador' : 'defensor';
  const defenderRole = Math.random() > 0.3 ? 'defensor' : 'goleador';

  const attackerRating = calculatePlayerRating(attacker, attackerRole);
  const defenderRating = calculatePlayerRating(defender, defenderRole);

  // --- Probabilidades base ---
  const probs = {
    [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.55,
    [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.25,
    [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.15,
    [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.05,
  };

  // --- Ajuste por TÁCTICAS ---
  if (possession === 'user') {
    if (tactic === MATCH_CONFIG.TACTICS.OFFENSIVE) {
      probs.shot += 0.10;
      probs.pass -= 0.10;
    } else if (tactic === MATCH_CONFIG.TACTICS.DEFENSIVE) {
      probs.shot -= 0.10;
      probs.tackle += 0.05; // Más propenso a ser interceptado
    }
  }
  // (Podrías añadir una IA de tácticas para el bot aquí)

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
  const successChance = (attackerRating / (attackerRating + defenderRating)) * (1 + (Math.random() - 0.5) * 0.3);
  const success = Math.random() < successChance;
  
  const event = {
    id: Date.now() + Math.random(),
    time: `${matchTime}'`,
  };

  if (action === MATCH_CONFIG.EVENT_TYPES.SHOT) {
    const shotPower = calculatePlayerRating(attacker, 'goleador');
    const savePower = calculatePlayerRating(defender, 'goalkeeper');
    const goalChance = (shotPower / (shotPower + savePower * 1.2));
    
    if (Math.random() < goalChance) {
      return { ...event, type: MATCH_CONFIG.EVENT_TYPES.GOAL, team: possession, text: `¡GOOOL de ${attacker.name}! Disparo imparable.`, intensity: 'very-high' };
    }
    return { ...event, type: MATCH_CONFIG.EVENT_TYPES.SAVE, team: possession === 'user' ? 'bot' : 'user', text: `¡PARADÓN de ${defender.name}! Detiene el tiro de ${attacker.name}.`, intensity: 'high' };
  }
  
  if (action === MATCH_CONFIG.EVENT_TYPES.TACKLE || (action === MATCH_CONFIG.EVENT_TYPES.PASS && !success)) {
    return { ...event, type: MATCH_CONFIG.EVENT_TYPES.TACKLE, team: possession === 'user' ? 'bot' : 'user', text: `¡${defender.name} roba el balón!`, intensity: 'medium' };
  }
  
  if (action === MATCH_CONFIG.EVENT_TYPES.FOUL) {
    return { ...event, type: MATCH_CONFIG.EVENT_TYPES.FOUL, team: possession === 'user' ? 'bot' : 'user', text: `Falta de ${defender.name}.`, intensity: 'medium' };
  }

  // Si es un pase exitoso
  return { ...event, type: MATCH_CONFIG.EVENT_TYPES.PASS, team: possession, text: `${attacker.name} avanza con el balón.`, intensity: 'low' };
};

// 3. REDUCER
export const initialState = {
  simulating: false,
  matchTime: 0,
  speed: 800,
  possession: 'user',
  tactic: MATCH_CONFIG.TACTICS.BALANCED,
  matchEvents: [],
  matchStats: null,
  character: null,
  selectedBot: null,
  matchId: null, // Guardará el ID de la partida de la DB
  matchResult: null, // Para mostrar el modal de resultados
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
        matchId: action.payload.matchId, // Guardamos el ID
        matchStats: {
          user: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0 },
          bot: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0 },
        },
      };

    case 'TICK_MINUTE': {
      if (!state.simulating || state.matchTime >= MATCH_CONFIG.DURATION) {
        return { ...state, simulating: false };
      }
      
      const newTime = state.matchTime + 1;
      const event = generateMatchEvent(state);
      
      const newStats = JSON.parse(JSON.stringify(state.matchStats));
      if (event.type === 'goal') {
        newStats[event.team].goals++;
        newStats[event.team].shots++;
      }
      if (event.type === 'save') {
        newStats[event.team].saves++;
        newStats[event.team === 'user' ? 'bot' : 'user'].shots++;
      }
      if (event.type === 'tackle') newStats[event.team].tackles++;
      if (event.type === 'foul') newStats[event.team].fouls++;
      
      return {
        ...state,
        matchTime: newTime,
        possession: event.team,
        matchEvents: [event, ...state.matchEvents.slice(0, 24)],
        matchStats: newStats
      };
    }

    case 'CHANGE_SPEED':
      return { ...state, speed: action.payload };

    case 'CHANGE_TACTIC':
      return { ...state, tactic: action.payload };

    case 'END_MATCH':
      return { ...state, simulating: false };
      
    // ¡NUEVOS CASOS PARA EL MODAL DE RESULTADOS!
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
        // Opcional: resetear el estado del partido por completo
        matchTime: 0,
        matchEvents: [],
        matchStats: null,
      };
      
    default:
      return state;
  }
}


