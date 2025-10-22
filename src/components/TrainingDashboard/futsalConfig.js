// futsalConfig.js
export const MATCH_CONFIG = {
  DURATION: 40, // 2 tiempos de 20 min
  EVENT_TYPES: {
    PASS: 'pass',
    TACKLE: 'tackle', 
    SHOT: 'shot',
    GOAL: 'goal',
    FOUL: 'foul',
    SAVE: 'save',
    PIVOT: 'pivot',
    WALL_PASS: 'wall_pass',
    POWER_PLAY: 'power_play',
    DOUBLE_PENALTY: 'double_penalty'
  },
  ZONES: {
    USER_DEFENSE: 'user_defense',
    CENTER: 'center',
    BOT_DEFENSE: 'bot_defense'
  },
  INTENSITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    VERY_HIGH: 'very-high'
  },
  TACTICS: {
    OFFENSIVE: 'offensive',
    DEFENSIVE: 'defensive',
    BALANCED: 'balanced'
  },
  FORMATIONS: {
    '2-1-1': '2-1-1 (Clásica)',
    '3-1': '3-1 (Defensiva)',
    '1-2-1': '1-2-1 (Ofensiva)'
  },
  FOULS: {
    MAX_FOULS: 5, // Hasta 5 faltas acumulativas
    DOUBLE_PENALTY_FOUL: 6 // A la 6ta falta, doble penalti
  }
};
