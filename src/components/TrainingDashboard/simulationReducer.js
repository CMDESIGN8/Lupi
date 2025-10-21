// simulationReducer.js - Versión corregida
import { MATCH_CONFIG } from './futsalConfig';

// Estado inicial
export const initialState = {
  simulating: false,
  matchTime: 0,
  speed: 2000,
  possession: 'user',
  tactic: MATCH_CONFIG.TACTICS.BALANCED,
  userFormation: '2-1-1',
  botFormation: '2-1-1',
  matchEvents: [],
  matchStats: null,
  character: null,
  selectedBot: null,
  matchId: null,
  matchResult: null,
};

// Función simplificada para generar eventos
const generateSimpleEvent = (state) => {
  const { possession, character, selectedBot } = state;
  
  const attacker = possession === 'user' ? character : selectedBot;
  const defender = possession === 'user' ? selectedBot : character;

  const events = [
    {
      type: MATCH_CONFIG.EVENT_TYPES.PASS,
      team: possession,
      text: `${attacker.name} realiza un pase preciso.`
    },
    {
      type: MATCH_CONFIG.EVENT_TYPES.DRIBBLE,
      team: possession,
      text: `${attacker.name} supera al defensor con un regate.`
    },
    {
      type: MATCH_CONFIG.EVENT_TYPES.SHOT,
      team: possession,
      text: `${attacker.name} dispara a portería!`
    },
    {
      type: MATCH_CONFIG.EVENT_TYPES.TACKLE,
      team: possession === 'user' ? 'bot' : 'user',
      text: `${defender.name} recupera el balón.`
    }
  ];

  // Añadir eventos de gol ocasionalmente
  if (Math.random() < 0.2) {
    events.push({
      type: MATCH_CONFIG.EVENT_TYPES.GOAL,
      team: possession,
      text: `⚽ ¡GOOOL de ${attacker.name}! ⚽`
    });
  }

  // Añadir eventos de parada ocasionalmente
  if (Math.random() < 0.15) {
    events.push({
      type: MATCH_CONFIG.EVENT_TYPES.SAVE,
      team: possession === 'user' ? 'bot' : 'user',
      text: `¡Gran parada del portero de ${defender.name}!`
    });
  }

  return events[Math.floor(Math.random() * events.length)];
};

// Reducer principal
export function simulationReducer(state, action) {
  switch (action.type) {
    case 'START_MATCH':
      return {
        ...initialState,
        simulating: true,
        character: action.payload.character,
        selectedBot: action.payload.selectedBot,
        userFormation: action.payload.formation || '2-1-1',
        matchId: action.payload.matchId,
        matchStats: {
          user: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0, passes: 0, dribbles: 0 },
          bot: { goals: 0, shots: 0, tackles: 0, saves: 0, fouls: 0, passes: 0, dribbles: 0 },
        },
      };

    case 'TICK_MINUTE': {
      if (!state.simulating || state.matchTime >= MATCH_CONFIG.DURATION) {
        return { 
          ...state, 
          simulating: false,
          matchResult: {
            userGoals: state.matchStats.user.goals,
            botGoals: state.matchStats.bot.goals,
            winner: state.matchStats.user.goals > state.matchStats.bot.goals ? 'user' : 
                   state.matchStats.user.goals < state.matchStats.bot.goals ? 'bot' : 'draw'
          }
        };
      }
      
      const event = generateSimpleEvent(state);
      const newStats = { ...state.matchStats };
      const newTime = state.matchTime + 1;
      
      // Actualizar estadísticas basado en el evento
      if (event.type === MATCH_CONFIG.EVENT_TYPES.GOAL) {
        newStats[event.team].goals++;
        newStats[event.team].shots++;
      } else if (event.type === MATCH_CONFIG.EVENT_TYPES.SAVE) {
        newStats[event.team].saves++;
      } else if (event.type === MATCH_CONFIG.EVENT_TYPES.TACKLE) {
        newStats[event.team].tackles++;
      } else if (event.type === MATCH_CONFIG.EVENT_TYPES.PASS) {
        newStats[event.team].passes++;
      } else if (event.type === MATCH_CONFIG.EVENT_TYPES.DRIBBLE) {
        newStats[event.team].dribbles++;
      } else if (event.type === MATCH_CONFIG.EVENT_TYPES.SHOT) {
        newStats[event.team].shots++;
      }
      
      // Cambiar posesión en ciertos eventos
      let newPossession = state.possession;
      if (event.type === MATCH_CONFIG.EVENT_TYPES.TACKLE || 
          event.type === MATCH_CONFIG.EVENT_TYPES.SAVE) {
        newPossession = event.team;
      }

      return {
        ...state,
        matchTime: newTime,
        possession: newPossession,
        matchEvents: [event, ...state.matchEvents.slice(0, 9)],
        matchStats: newStats
      };
    }

    case 'CHANGE_FORMATION':
      return { 
        ...state, 
        userFormation: action.payload 
      };

    case 'CHANGE_SPEED':
      return { ...state, speed: action.payload };

    case 'CHANGE_TACTIC':
      return { ...state, tactic: action.payload };

    case 'END_MATCH':
      return { 
        ...state, 
        simulating: false,
        matchResult: {
          userGoals: state.matchStats.user.goals,
          botGoals: state.matchStats.bot.goals,
          winner: state.matchStats.user.goals > state.matchStats.bot.goals ? 'user' : 
                 state.matchStats.user.goals < state.matchStats.bot.goals ? 'bot' : 'draw'
        }
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
