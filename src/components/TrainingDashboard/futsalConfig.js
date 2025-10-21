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
  FORMATIONS: {
    '3-1': '3-1 (Clásica)',
    '2-2': '2-2 (Cuadrado)',
    '4-0': '4-0 (Rombo)',
  },
  TACTICS: {
    DEFENSIVE: 'defensive',
    BALANCED: 'balanced',
    OFFENSIVE: 'offensive'
  }
};