import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/TrainingDashboard.css";

// 🎮 CONSTANTES DE CONFIGURACIÓN PARA FÚTSAL
const MATCH_CONFIG = {
  DURATION: 40, // 2 tiempos de 20 min en futsal
  EVENT_TYPES: {
    PASS: 'pass',
    TACKLE: 'tackle', 
    SHOT: 'shot',
    GOAL: 'goal',
    FOUL: 'foul',
    CORNER: 'corner',
    OFFSIDE: 'offside',
    SAVE: 'save',
    CROSS: 'cross',
    WALL_PASS: 'wall_pass',
    POWER_PLAY: 'power_play',
    DOUBLE_PENALTY: 'double_penalty'
  },
  ZONES: {
    USER_DEFENSE: 'user_defense',
    LEFT_WING: 'left_wing',
    CENTER: 'center',
    RIGHT_WING: 'right_wing',
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
    '3-2': '3-2 (Ofensiva)',
    '2-1-1': '2-1-1 (Diamante)'
  }
};

// 🎪 COMPONENTE DE CONTROLES MEJORADO PARA FÚTSAL
const SimulationControls = ({ speed, setSpeed, momentum, matchTime }) => (
  <div className="simulation-controls professional">
    <div className="speed-controls">
      <button onClick={() => setSpeed(2000)} title="Muy Lento" className={speed === 2000 ? 'active' : ''}>🐌</button>
      <button onClick={() => setSpeed(1200)} title="Lento" className={speed === 1200 ? 'active' : ''}>🐢</button>
      <button onClick={() => setSpeed(800)} title="Normal" className={speed === 800 ? 'active' : ''}>▶️</button>
      <button onClick={() => setSpeed(400)} title="Rápido" className={speed === 400 ? 'active' : ''}>⏩</button>
      <button onClick={() => setSpeed(150)} title="Muy Rápido" className={speed === 150 ? 'active' : ''}>⚡</button>
    </div>
    <div className="match-time-display">
      <div className="time">{matchTime}'</div>
      <div className="phase">
        {matchTime <= 20 ? '1º TIEMPO' : 
         matchTime < 40 ? '2º TIEMPO' : 'FINAL'}
      </div>
    </div>
    <div className="momentum-indicator">
      <div className="momentum-label">Momentum</div>
      <div className="momentum-bar">
        <div 
          className="momentum-fill" 
          style={{ width: `${momentum}%` }}
          data-value={momentum}
        ></div>
      </div>
    </div>
  </div>
);

// 🏆 COMPONENTE PRINCIPAL FÚTSAL PRO
const TrainingDashboard = ({ character, bots = [], matchHistory, loading, simulating, selectedBot, onStartMatch, onMatchFinish, matchResult, onCloseResult, finalStats }) => {
  const [activePanel, setActivePanel] = useState("bots");
  const [selectedFormation, setSelectedFormation] = useState('3-1');

  // 🎮 ESTADO DE SIMULACIÓN PARA FÚTSAL
  const [simulationState, setSimulationState] = useState({
    isActive: false,
    matchTime: 0,
    speed: 800,
    possession: 'neutral',
    ballZone: MATCH_CONFIG.ZONES.CENTER,
    momentum: 50,
    pressure: { user: 50, bot: 50 },
    lastAction: null,
    formaciones: {
      user: '3-1',
      bot: '2-2'
    },
    powerPlay: false,
    accumulatedFouls: { user: 0, bot: 0 }
  });

  const [matchStats, setMatchStats] = useState(null);
  const [matchEvents, setMatchEvents] = useState([]);
  const [playerPositions, setPlayerPositions] = useState({});
  const simulationIntervalRef = useRef(null);

  // 🎯 SISTEMA DE HABILIDADES PARA FÚTSAL
  const calculatePlayerRating = useCallback((player, role = 'balanced') => {
    if (!player) return 50;
    const weights = {
      balanced: { tiro: 0.30, potencia: 0.25, defensa: 0.25, velocidad: 0.20 },
      pivot: { tiro: 0.35, potencia: 0.25, defensa: 0.15, velocidad: 0.25 },
      defender: { tiro: 0.15, potencia: 0.20, defensa: 0.40, velocidad: 0.25 },
      winger: { tiro: 0.25, potencia: 0.25, defensa: 0.20, velocidad: 0.30 },
      goalkeeper: { tiro: 0.10, potencia: 0.15, defensa: 0.50, velocidad: 0.25 }
    };
    
    const weight = weights[role] || weights.balanced;
    return (
      ((player.tiro || 50) * weight.tiro) +
      ((player.potencia || 50) * weight.potencia) + 
      ((player.defensa || 50) * weight.defensa) +
      ((player.velocidad || 50) * weight.velocidad)
    );
  }, []);

  // 📊 CALCULAR PORCENTAJES DE VICTORIA/DERROTA
  const calculateWinProbability = useCallback(() => {
    if (!matchStats || !character || !selectedBot) return { user: 50, bot: 50 };

    const userRating = calculatePlayerRating(character, 'balanced');
    const botRating = calculatePlayerRating(selectedBot, 'balanced');
    
    // Factores que influyen en la probabilidad
    const baseProbability = (userRating / (userRating + botRating)) * 100;
    
    // Ajustes según estadísticas en tiempo real
    let userAdjustment = 0;
    let botAdjustment = 0;

    // Momentum actual
    const momentumFactor = (simulationState.momentum - 50) / 2;
    userAdjustment += momentumFactor;
    botAdjustment -= momentumFactor;

    // Eficiencia de disparos
    const userShotEfficiency = matchStats.user.shotAccuracy || 0;
    const botShotEfficiency = matchStats.bot.shotAccuracy || 0;
    userAdjustment += (userShotEfficiency - 50) / 20;
    botAdjustment += (botShotEfficiency - 50) / 20;

    // Posesión del balón
    const possessionFactor = (matchStats.user.possession - 50) / 10;
    userAdjustment += possessionFactor;
    botAdjustment -= possessionFactor;

    // Presión defensiva
    const pressureFactor = (simulationState.pressure.user - simulationState.pressure.bot) / 15;
    userAdjustment += pressureFactor;
    botAdjustment -= pressureFactor;

    // Aplicar ajustes
    const userProbability = Math.max(5, Math.min(95, baseProbability + userAdjustment));
    const botProbability = Math.max(5, Math.min(95, 100 - userProbability));

    return {
      user: Math.round(userProbability),
      bot: Math.round(botProbability)
    };
  }, [matchStats, character, selectedBot, simulationState, calculatePlayerRating]);

  // 🏃 SISTEMA DE POSICIONAMIENTO PARA FÚTSAL
  const calculatePlayerPositions = useCallback((ballZone, possession, matchTime, formation = '3-1') => {
    const baseFormations = {
      '3-1': {
        user: [
          { x: 20, y: 50 }, // Portero
          { x: 40, y: 25 }, // Defensa izquierdo
          { x: 40, y: 50 }, // Defensa central
          { x: 40, y: 75 }, // Defensa derecho
          { x: 70, y: 50 }  // Delantero
        ],
        bot: [
          { x: 80, y: 50 }, // Portero
          { x: 60, y: 25 }, // Defensa izquierdo
          { x: 60, y: 50 }, // Defensa central
          { x: 60, y: 75 }, // Defensa derecho
          { x: 30, y: 50 }  // Delantero
        ]
      },
      '2-2': {
        user: [
          { x: 20, y: 50 }, // Portero
          { x: 45, y: 30 }, // Ala izquierdo
          { x: 45, y: 70 }, // Ala derecho
          { x: 65, y: 30 }, // Delantero izquierdo
          { x: 65, y: 70 }  // Delantero derecho
        ],
        bot: [
          { x: 80, y: 50 }, // Portero
          { x: 55, y: 30 }, // Ala izquierdo
          { x: 55, y: 70 }, // Ala derecho
          { x: 35, y: 30 }, // Delantero izquierdo
          { x: 35, y: 70 }  // Delantero derecho
        ]
      }
    };

    const formationPositions = baseFormations[formation] || baseFormations['3-1'];
    const timeVariation = (Math.sin(matchTime * 0.1) * 3) + (Math.random() * 6 - 3);

    // Ajustar posiciones según la zona del balón
    const adjustedPositions = JSON.parse(JSON.stringify(formationPositions));
    
    if (ballZone === MATCH_CONFIG.ZONES.USER_DEFENSE) {
      adjustedPositions.user.forEach(pos => {
        pos.x += Math.random() * 10 - 5;
        pos.y += Math.random() * 15 - 7.5;
      });
      adjustedPositions.bot.forEach(pos => {
        pos.x -= Math.random() * 8;
        pos.y += Math.random() * 10 - 5;
      });
    } else if (ballZone === MATCH_CONFIG.ZONES.BOT_DEFENSE) {
      adjustedPositions.user.forEach(pos => {
        pos.x += Math.random() * 8;
        pos.y += Math.random() * 10 - 5;
      });
      adjustedPositions.bot.forEach(pos => {
        pos.x -= Math.random() * 10 - 5;
        pos.y += Math.random() * 15 - 7.5;
      });
    } else {
      // Zona central - posiciones más equilibradas
      adjustedPositions.user.forEach(pos => {
        pos.x += Math.random() * 8 - 4;
        pos.y += Math.random() * 12 - 6;
      });
      adjustedPositions.bot.forEach(pos => {
        pos.x += Math.random() * 8 - 4;
        pos.y += Math.random() * 12 - 6;
      });
    }

    return {
      user: adjustedPositions.user,
      bot: adjustedPositions.bot
    };
  }, []);

  // 🎲 SISTEMA DE PROBABILIDADES PARA FÚTSAL
  const calculateActionProbabilities = useCallback((attacker, defender, ballZone, momentum, matchTime, accumulatedFouls) => {
    const baseProbabilities = {
      [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.45,
      [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.15,
      [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.15,
      [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.06,
      [MATCH_CONFIG.EVENT_TYPES.CORNER]: 0.04,
      [MATCH_CONFIG.EVENT_TYPES.CROSS]: 0.03,
      [MATCH_CONFIG.EVENT_TYPES.WALL_PASS]: 0.04,
      [MATCH_CONFIG.EVENT_TYPES.SAVE]: 0.02,
      [MATCH_CONFIG.EVENT_TYPES.POWER_PLAY]: 0.01
    };

    // Ajustes por zona
    if (ballZone === MATCH_CONFIG.ZONES.BOT_DEFENSE) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.SHOT] += 0.10;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= 0.08;
    } else if (ballZone === MATCH_CONFIG.ZONES.USER_DEFENSE) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.TACKLE] += 0.08;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.FOUL] += 0.02;
    }

    // Momentum afecta acciones ofensivas
    const momentumFactor = (momentum - 50) / 100;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.SHOT] += momentumFactor * 0.08;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= momentumFactor * 0.03;

    // Faltas acumuladas aumentan probabilidad de doble penalti
    const totalFouls = accumulatedFouls.user + accumulatedFouls.bot;
    if (totalFouls >= 5 && Math.random() < 0.3) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.DOUBLE_PENALTY] = 0.15;
    }

    return baseProbabilities;
  }, []);

  // ⚽ GENERADOR DE EVENTOS PARA FÚTSAL
  const generateMatchEvent = useCallback((currentPossession, currentTime) => {
    if (!character || !selectedBot) return null;

    const attacker = currentPossession === 'user' ? character : selectedBot;
    const defender = currentPossession === 'user' ? selectedBot : character;
    
    const attackerName = currentPossession === 'user' ? character.nickname : selectedBot.name;
    const defenderName = currentPossession === 'user' ? selectedBot.name : character.nickname;

    const probabilities = calculateActionProbabilities(
      attacker, 
      defender, 
      simulationState.ballZone, 
      simulationState.momentum,
      currentTime,
      simulationState.accumulatedFouls
    );
    
    const random = Math.random();
    let cumulative = 0;
    let selectedAction = MATCH_CONFIG.EVENT_TYPES.PASS;

    for (const [action, prob] of Object.entries(probabilities)) {
      cumulative += prob;
      if (random <= cumulative) {
        selectedAction = action;
        break;
      }
    }

    return generateEventByType(
      selectedAction, 
      attacker, 
      defender, 
      attackerName, 
      defenderName, 
      currentTime, 
      currentPossession
    );
  }, [character, selectedBot, simulationState, calculateActionProbabilities]);

  // 🎪 GENERADOR ESPECÍFICO POR TIPO DE EVENTO FÚTSAL
  const generateEventByType = (actionType, attacker, defender, attackerName, defenderName, time, possession) => {
    const baseEvent = {
      id: Date.now() + time + Math.random(),
      time: `${time}'`,
      team: possession,
      action: actionType
    };

    const getRandomText = (texts) => texts[Math.floor(Math.random() * texts.length)];

    switch(actionType) {
      case MATCH_CONFIG.EVENT_TYPES.GOAL:
        const goalTexts = [
          `¡¡¡GOOOOL DE ${attackerName}!!! Remate espectacular.`,
          `¡GOLAZO! ${attackerName} define con clase.`,
          `¡GOOL! ${attackerName} aprovecha la oportunidad.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(goalTexts),
          intensity: MATCH_CONFIG.INTENSITY.VERY_HIGH,
          zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
          stat_type: 'goals'
        };

      case MATCH_CONFIG.EVENT_TYPES.SHOT:
        const shotQuality = calculatePlayerRating(attacker, 'balanced');
        const saveQuality = calculatePlayerRating(defender, 'goalkeeper');
        const goalProbability = (shotQuality / (shotQuality + saveQuality * 1.5)) * (1 + (simulationState.momentum - 50) / 100);
        
        if (Math.random() < goalProbability * 0.7) {
          return {
            ...baseEvent,
            action: MATCH_CONFIG.EVENT_TYPES.GOAL,
            text: getRandomText([
              `¡¡¡GOOOOL DE ${attackerName}!!! Remate imparable.`,
              `¡GOL! ${attackerName} encuentra el ángulo perfecto.`,
            ]),
            intensity: MATCH_CONFIG.INTENSITY.VERY_HIGH,
            zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
            stat_type: 'goals'
          };
        } else if (Math.random() < 0.4) {
          const saveTexts = [
            `¡Qué parada del portero! Ataja el remate de ${attackerName}.`,
            `El guardameta detiene el potente disparo de ${attackerName}.`,
          ];
          return {
            ...baseEvent,
            text: getRandomText(saveTexts),
            intensity: MATCH_CONFIG.INTENSITY.HIGH,
            zone: simulationState.ballZone,
            stat_type: 'shots',
            sub_type: 'saved'
          };
        } else {
          const missTexts = [
            `¡Casi! ${attackerName} dispara pero se va por poco.`,
            `¡Qué oportunidad! ${attackerName} falla el remate.`,
          ];
          return {
            ...baseEvent,
            text: getRandomText(missTexts),
            intensity: MATCH_CONFIG.INTENSITY.HIGH,
            zone: simulationState.ballZone,
            stat_type: 'shots',
            sub_type: 'missed'
          };
        }

      case MATCH_CONFIG.EVENT_TYPES.WALL_PASS:
        const wallPassTexts = [
          `¡Bonita pared entre ${attackerName} y su compañero!`,
          `${attackerName} realiza una pared perfecta para desequilibrar.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(wallPassTexts),
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: getNextZone(simulationState.ballZone, possession),
          stat_type: 'wall_passes'
        };

      case MATCH_CONFIG.EVENT_TYPES.POWER_PLAY:
        const powerPlayTexts = [
          `¡Estrategia arriesgada! ${attackerName} juega sin portero.`,
          `El equipo de ${attackerName} saca al portero jugador.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(powerPlayTexts),
          intensity: MATCH_CONFIG.INTENSITY.HIGH,
          zone: simulationState.ballZone,
          stat_type: 'power_plays'
        };

      case MATCH_CONFIG.EVENT_TYPES.DOUBLE_PENALTY:
        const penaltyTexts = [
          `¡DOBLE PENALTI! Falta acumulada, gran oportunidad para ${attackerName}.`,
          `Penalti doble concedido, ${attackerName} se prepara para lanzar.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(penaltyTexts),
          intensity: MATCH_CONFIG.INTENSITY.VERY_HIGH,
          zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
          stat_type: 'penalties'
        };

      case MATCH_CONFIG.EVENT_TYPES.PASS:
        const passTexts = [
          `${attackerName} realiza un pase preciso al compañero.`,
          `${attackerName} cambia el juego con visión.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(passTexts),
          intensity: MATCH_CONFIG.INTENSITY.LOW,
          zone: getNextZone(simulationState.ballZone, possession),
          stat_type: 'passes'
        };

      case MATCH_CONFIG.EVENT_TYPES.TACKLE:
        const tackleTexts = [
          `¡Gran entrada de ${defenderName}! Recupera el balón limpiamente.`,
          `${defenderName} intercepta el pase con anticipación.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(tackleTexts),
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: simulationState.ballZone,
          stat_type: 'tackles',
          team: possession === 'user' ? 'bot' : 'user'
        };

      case MATCH_CONFIG.EVENT_TYPES.FOUL:
        const foulTexts = [
          `Falta cometida por ${defenderName} sobre ${attackerName}.`,
          `${defenderName} comete una infracción, falta señalada.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(foulTexts),
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: simulationState.ballZone,
          stat_type: 'fouls',
          team: possession === 'user' ? 'bot' : 'user'
        };

      default:
        return {
          ...baseEvent,
          text: `${attackerName} controla el balón.`,
          intensity: MATCH_CONFIG.INTENSITY.LOW,
          zone: MATCH_CONFIG.ZONES.CENTER,
          stat_type: 'passes'
        };
    }
  };

  // 🗺️ SISTEMA DE TRANSICIÓN DE ZONAS FÚTSAL
  const getNextZone = (currentZone, possession) => {
    const zoneProgression = {
      [MATCH_CONFIG.ZONES.USER_DEFENSE]: {
        user: [MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.LEFT_WING, MATCH_CONFIG.ZONES.RIGHT_WING, MATCH_CONFIG.ZONES.CENTER],
        bot: [MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.CENTER]
      },
      [MATCH_CONFIG.ZONES.LEFT_WING]: {
        user: [MATCH_CONFIG.ZONES.LEFT_WING, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.BOT_DEFENSE],
        bot: [MATCH_CONFIG.ZONES.LEFT_WING, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.USER_DEFENSE]
      },
      [MATCH_CONFIG.ZONES.RIGHT_WING]: {
        user: [MATCH_CONFIG.ZONES.RIGHT_WING, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.BOT_DEFENSE],
        bot: [MATCH_CONFIG.ZONES.RIGHT_WING, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.USER_DEFENSE]
      },
      [MATCH_CONFIG.ZONES.CENTER]: {
        user: [MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.LEFT_WING, MATCH_CONFIG.ZONES.RIGHT_WING],
        bot: [MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.LEFT_WING, MATCH_CONFIG.ZONES.RIGHT_WING]
      },
      [MATCH_CONFIG.ZONES.BOT_DEFENSE]: {
        user: [MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.BOT_DEFENSE],
        bot: [MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER]
      }
    };

    const possibleZones = zoneProgression[currentZone][possession];
    return possibleZones[Math.floor(Math.random() * possibleZones.length)];
  };

  // 🔄 MOTOR PRINCIPAL DE SIMULACIÓN FÚTSAL
  const simulateMinute = useCallback((currentTime) => {
    if (!character || !selectedBot || !simulationState.isActive) return;

    const userRating = calculatePlayerRating(character, 'balanced');
    const botRating = calculatePlayerRating(selectedBot, 'balanced');
    const momentumFactor = (simulationState.momentum - 50) / 50;
    const pressureFactor = (simulationState.pressure.user - simulationState.pressure.bot) / 100;
    
    let initiativeChance = (userRating / (userRating + botRating)) + 
                          momentumFactor * 0.15 + 
                          pressureFactor * 0.1;
    
    initiativeChance += (Math.random() - 0.5) * 0.2;
    
    const hasUserInitiative = Math.random() < Math.max(0.15, Math.min(0.85, initiativeChance));
    const currentPossession = hasUserInitiative ? 'user' : 'bot';

    const event = generateMatchEvent(currentPossession, currentTime);
    if (!event) return;

    // Actualizar faltas acumuladas
    if (event.action === MATCH_CONFIG.EVENT_TYPES.FOUL) {
      setSimulationState(prev => ({
        ...prev,
        accumulatedFouls: {
          ...prev.accumulatedFouls,
          [event.team]: prev.accumulatedFouls[event.team] + 1
        }
      }));
    }

    const newMomentum = updateMomentum(simulationState.momentum, event, currentPossession);
    const newPressure = updatePressure(simulationState.pressure, event, currentPossession);

    setSimulationState(prev => ({
      ...prev,
      possession: event.team,
      ballZone: event.zone,
      momentum: newMomentum,
      pressure: newPressure,
      lastAction: event.action
    }));

    setPlayerPositions(calculatePlayerPositions(event.zone, event.team, currentTime, selectedFormation));
    setMatchEvents(prev => [event, ...prev.slice(0, 24)]);
    setMatchStats(prev => updateMatchStats(prev, event, currentTime));
  }, [character, selectedBot, simulationState, generateMatchEvent, calculatePlayerPositions, calculatePlayerRating, selectedFormation]);

  // 📊 ACTUALIZADOR DE MOMENTUM FÚTSAL
  const updateMomentum = (currentMomentum, event, possession) => {
    let change = 0;
    
    switch(event.intensity) {
      case MATCH_CONFIG.INTENSITY.VERY_HIGH:
        if (event.action === MATCH_CONFIG.EVENT_TYPES.GOAL) {
          change = possession === 'user' ? 25 : -25;
        } else if (event.action === MATCH_CONFIG.EVENT_TYPES.DOUBLE_PENALTY) {
          change = possession === 'user' ? 15 : -15;
        }
        break;
      case MATCH_CONFIG.INTENSITY.HIGH:
        change = possession === 'user' ? 10 : -10;
        break;
      case MATCH_CONFIG.INTENSITY.MEDIUM:
        change = possession === 'user' ? 4 : -4;
        break;
      default:
        change = possession === 'user' ? 1 : -1;
    }

    if (event.action === MATCH_CONFIG.EVENT_TYPES.TACKLE) {
      change = possession === 'user' ? -6 : 6;
    } else if (event.sub_type === 'saved') {
      change = possession === 'user' ? -10 : 6;
    }

    change += (Math.random() - 0.5) * 4;
    
    return Math.max(0, Math.min(100, currentMomentum + change));
  };

  // 🎯 ACTUALIZADOR DE PRESIÓN FÚTSAL
  const updatePressure = (currentPressure, event, possession) => {
    const pressureChange = event.intensity === MATCH_CONFIG.INTENSITY.VERY_HIGH ? 20 :
                          event.intensity === MATCH_CONFIG.INTENSITY.HIGH ? 12 :
                          event.intensity === MATCH_CONFIG.INTENSITY.MEDIUM ? 6 : 2;
    
    return {
      user: Math.max(0, Math.min(100, 
        currentPressure.user + (possession === 'user' ? pressureChange : -pressureChange/2)
      )),
      bot: Math.max(0, Math.min(100,
        currentPressure.bot + (possession === 'bot' ? pressureChange : -pressureChange/2)
      ))
    };
  };

  // 📈 ACTUALIZADOR DE ESTADÍSTICAS FÚTSAL
  const updateMatchStats = (prevStats, event, currentTime) => {
    if (!prevStats) return prevStats;

    const newStats = JSON.parse(JSON.stringify(prevStats));
    
    if (event.stat_type) {
      newStats[event.team][event.stat_type] = (newStats[event.team][event.stat_type] || 0) + 1;
    }

    if (event.sub_type === 'saved') {
      newStats[event.team === 'user' ? 'bot' : 'user'].saves = 
        (newStats[event.team === 'user' ? 'bot' : 'user'].saves || 0) + 1;
    }

    // Posesión (más dinámica en futsal)
    const totalMinutes = currentTime;
    const userPossessionMinutes = (prevStats.user.possession / 100) * (totalMinutes - 1) + 
      (event.team === 'user' ? 1 : 0);
    
    newStats.user.possession = Math.round((userPossessionMinutes / totalMinutes) * 100);
    newStats.bot.possession = 100 - newStats.user.possession;

    // Estadísticas específicas de futsal
    if (event.stat_type === 'shots') {
      const totalShots = newStats[event.team].shots;
      const goals = newStats[event.team].goals || 0;
      newStats[event.team].shotAccuracy = totalShots > 0 ? Math.round((goals / totalShots) * 100) : 0;
    }

    if (event.stat_type === 'passes') {
      newStats[event.team].completed_passes = (newStats[event.team].completed_passes || 0) + 1;
      const totalPasses = newStats[event.team].passes;
      const completed = newStats[event.team].completed_passes;
      newStats[event.team].passAccuracy = totalPasses > 0 ? Math.round((completed / totalPasses) * 100) : 100;
    }

    // Faltas acumuladas
    newStats.user.accumulatedFouls = simulationState.accumulatedFouls.user;
    newStats.bot.accumulatedFouls = simulationState.accumulatedFouls.bot;

    return newStats;
  };

  // 🛑 DETENER SIMULACIÓN
  const stopSimulation = useCallback((finalize = false) => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    if (finalize) {
      setSimulationState(prev => ({ ...prev, isActive: false }));
      
      if (onMatchFinish && matchStats) {
        setTimeout(() => {
          onMatchFinish({
            ...matchStats,
            simulation: {
              duration: simulationState.matchTime,
              momentum: simulationState.momentum,
              finalScore: {
                user: matchStats.user.goals || 0,
                bot: matchStats.bot.goals || 0
              },
              formation: selectedFormation
            }
          });
        }, 500);
      }
    }
  }, [matchStats, simulationState, onMatchFinish, selectedFormation]);

  // 🎮 SISTEMA DE VISUALIZACIÓN FÚTSAL
  const getBallPosition = useCallback(() => {
    const { ballZone, isActive, matchTime } = simulationState;
    if (!isActive) return { x: 50, y: 50 };

    const timeVariation = Math.sin(matchTime * 0.2) * 3;
    const randomVariation = Math.random() * 8 - 4;

    const zonePositions = {
      [MATCH_CONFIG.ZONES.USER_DEFENSE]: { 
        x: 20 + Math.random() * 10 + timeVariation, 
        y: 35 + Math.random() * 30 + randomVariation 
      },
      [MATCH_CONFIG.ZONES.LEFT_WING]: { 
        x: 35 + Math.random() * 10 + timeVariation, 
        y: 20 + Math.random() * 20 + randomVariation 
      },
      [MATCH_CONFIG.ZONES.CENTER]: { 
        x: 50 + Math.random() * 10 + timeVariation, 
        y: 40 + Math.random() * 20 + randomVariation 
      },
      [MATCH_CONFIG.ZONES.RIGHT_WING]: { 
        x: 65 + Math.random() * 10 + timeVariation, 
        y: 20 + Math.random() * 20 + randomVariation 
      },
      [MATCH_CONFIG.ZONES.BOT_DEFENSE]: { 
        x: 80 + Math.random() * 10 + timeVariation, 
        y: 35 + Math.random() * 30 + randomVariation 
      }
    };

    return zonePositions[ballZone] || { x: 50, y: 50 };
  }, [simulationState]);

  // ⚡ EFECTO DE INICIO DE SIMULACIÓN
  useEffect(() => {
    if (simulating && selectedBot && character && !simulationState.isActive) {
      console.log("🚀 INICIANDO SIMULACIÓN FÚTSAL");
      
      setMatchEvents([]);
      setMatchStats({
        user: { 
          shots: 0, goals: 0, passes: 0, tackles: 0, fouls: 0, 
          possession: 50, shotAccuracy: 0, passAccuracy: 100, 
          completed_passes: 0, saves: 0, name: character.nickname,
          wall_passes: 0, power_plays: 0, penalties: 0,
          accumulatedFouls: 0
        },
        bot: { 
          shots: 0, goals: 0, passes: 0, tackles: 0, fouls: 0, 
          possession: 50, shotAccuracy: 0, passAccuracy: 100, 
          completed_passes: 0, saves: 0, name: selectedBot.name,
          wall_passes: 0, power_plays: 0, penalties: 0,
          accumulatedFouls: 0
        }
      });
      
      setSimulationState(prev => ({ 
        ...prev, 
        isActive: true, 
        matchTime: 0, 
        possession: 'neutral', 
        ballZone: MATCH_CONFIG.ZONES.CENTER,
        momentum: 50,
        pressure: { user: 50, bot: 50 },
        lastAction: null,
        accumulatedFouls: { user: 0, bot: 0 },
        formaciones: {
          user: selectedFormation,
          bot: '2-2'
        }
      }));

      simulationIntervalRef.current = setInterval(() => {
        setSimulationState(prev => {
          const newTime = prev.matchTime + 1;
          
          if (newTime >= MATCH_CONFIG.DURATION) {
            console.log("🏁 FINALIZANDO PARTIDO FÚTSAL");
            stopSimulation(true);
            return { ...prev, isActive: false };
          }
          
          simulateMinute(newTime);
          return { ...prev, matchTime: newTime };
        });
      }, simulationState.speed);

    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [simulating, selectedBot, character, simulationState.speed, selectedFormation]);

  // ⚡ EFECTO PARA CAMBIOS DE VELOCIDAD
  useEffect(() => {
    if (simulationState.isActive && simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      
      simulationIntervalRef.current = setInterval(() => {
        setSimulationState(prev => {
          const newTime = prev.matchTime + 1;
          
          if (newTime >= MATCH_CONFIG.DURATION) {
            stopSimulation(true);
            return { ...prev, isActive: false };
          }
          
          simulateMinute(newTime);
          return { ...prev, matchTime: newTime };
        });
      }, simulationState.speed);
    }
  }, [simulationState.speed]);

  // 🎨 FUNCIONES DE UI PARA FÚTSAL
  const getActionIcon = (action) => {
    const icons = {
      [MATCH_CONFIG.EVENT_TYPES.GOAL]: '🥅',
      [MATCH_CONFIG.EVENT_TYPES.SHOT]: '⚽',
      [MATCH_CONFIG.EVENT_TYPES.PASS]: '↷',
      [MATCH_CONFIG.EVENT_TYPES.TACKLE]: '🛑',
      [MATCH_CONFIG.EVENT_TYPES.FOUL]: '⚠️',
      [MATCH_CONFIG.EVENT_TYPES.CORNER]: '↶',
      [MATCH_CONFIG.EVENT_TYPES.WALL_PASS]: '🧱',
      [MATCH_CONFIG.EVENT_TYPES.POWER_PLAY]: '🎯',
      [MATCH_CONFIG.EVENT_TYPES.DOUBLE_PENALTY]: '🎯',
      [MATCH_CONFIG.EVENT_TYPES.SAVE]: '✋'
    };
    return icons[action] || '●';
  };

  const getDifficultyColor = useCallback((difficulty) => { 
    const colors = {
      easy: '#4cc9f0', 
      medium: '#4361ee', 
      hard: '#7209b7',
      expert: '#f72585',
      legendary: '#ff9e00'
    };
    return colors[difficulty] || '#00bbf9';
  }, []);

  const getDifficultyText = useCallback((difficulty) => {
    const texts = {
      easy: 'FÁCIL', 
      medium: 'MEDIO', 
      hard: 'DIFÍCIL',
      expert: 'ÉLITE',
      legendary: 'LEYENDA'
    };
    return texts[difficulty] || difficulty?.toUpperCase() || 'NORMAL';
  }, []);

  const getBotAvatar = useCallback((botLevel) => { 
    const level = botLevel || 1;
    if (level <= 2) return "👽"; 
    if (level <= 4) return "👻"; 
    if (level <= 6) return "🤖"; 
    if (level <= 8) return "🧑🏼"; 
    if (level <= 10) return "🏆";
    return "👑"; 
  }, []);

  // 🎁 SISTEMA DE RECOMPENSAS MEJORADO
  const getRewardsForBot = useCallback((bot) => {
    const baseRewards = {
      easy: {
        coins: 50,
        xp: 25,
        items: ["Balón básico", "Camiseta básica"],
        unlock: null
      },
      medium: {
        coins: 100,
        xp: 50,
        items: ["Balón profesional", "Botines mejorados"],
        unlock: "Formación 2-2"
      },
      hard: {
        coins: 200,
        xp: 100,
        items: ["Guantes de portero", "Equipación especial"],
        unlock: "Formación 4-0"
      },
      expert: {
        coins: 400,
        xp: 200,
        items: ["Balón de competición", "Equipación élite"],
        unlock: "Formación 3-2"
      },
      legendary: {
        coins: 800,
        xp: 400,
        items: ["Trofeo legendario", "Equipación única"],
        unlock: "Todos los botones desbloqueados"
      }
    };
    
    return baseRewards[bot.difficulty] || baseRewards.easy;
  }, []);

  // 🎨 RENDERIZADO DE RECOMPENSAS
  const renderRewards = useCallback((bot) => {
    const rewards = getRewardsForBot(bot);
    
    return (
      <div className="rewards-section">
        <div className="rewards-header">
          <span className="rewards-title">🎁 Recompensas</span>
        </div>
        <div className="rewards-grid">
          <div className="reward-item coins">
            <span className="reward-icon">🪙</span>
            <span className="reward-value">{rewards.coins} monedas</span>
          </div>
          <div className="reward-item xp">
            <span className="reward-icon">⭐</span>
            <span className="reward-value">{rewards.xp} XP</span>
          </div>
          {rewards.items.map((item, index) => (
            <div key={index} className="reward-item item">
              <span className="reward-icon">🎁</span>
              <span className="reward-value">{item}</span>
            </div>
          ))}
          {rewards.unlock && (
            <div className="reward-item unlock">
              <span className="reward-icon">🔓</span>
              <span className="reward-value">{rewards.unlock}</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [getRewardsForBot]);

  const ballPosition = getBallPosition();
  const currentPlayerPositions = playerPositions.user ? playerPositions : calculatePlayerPositions(
    MATCH_CONFIG.ZONES.CENTER, 
    'neutral', 
    0, 
    selectedFormation
  );

  // Calcular probabilidades de victoria
  const winProbabilities = calculateWinProbability();

  // ✅ CORRECCIÓN: Verificación segura para el array de bots
  const safeBots = Array.isArray(bots) ? bots : [];

  return (
    <div className="training-dashboard super-pro futsal-version">
      {/* HEADER SUPERIOR FÚTSAL */}
      <div className="app-header professional">
        <div className="header-content">
          <div className="header-section">
            <h2>🥅 SIMULADOR FÚTSAL PRO</h2>
            <div className="match-info-header">
              {simulating && selectedBot ? (
                <span className="opponent-info">vs {selectedBot.name} | {MATCH_CONFIG.FORMATIONS[selectedFormation]}</span>
              ) : (
                <span className="opponent-info">Selecciona formación y oponente</span>
              )}
            </div>
          </div>
          
          <div className="header-section">
            <div className="match-status">
              <div className="score-display-header">
                {matchStats ? `${matchStats.user.goals || 0} - ${matchStats.bot.goals || 0}` : '0 - 0'}
              </div>
              <div className="formation-selector">
                <label>Formación:</label>
                <select 
                  value={selectedFormation} 
                  onChange={(e) => setSelectedFormation(e.target.value)}
                  disabled={simulationState.isActive}
                >
                  {Object.entries(MATCH_CONFIG.FORMATIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="header-section">
            <div className="controls-header">
              <SimulationControls 
                speed={simulationState.speed} 
                setSpeed={(s) => setSimulationState(prev => ({ ...prev, speed: s }))}
                momentum={simulationState.momentum}
                matchTime={simulationState.matchTime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL FÚTSAL */}
      <div className="main-layout improved">
        {/* PANEL IZQUIERDO - ESTADÍSTICAS FÚTSAL */}
        <div className="left-panel stats-panel">
          <div className="panel-header">
            <h3>📊 ESTADÍSTICAS FÚTSAL</h3>
          </div>
          <div className="panel-content stats-content">
            {matchStats ? (
              <div className="advanced-stats improved">
                {/* SECCIÓN DE PROBABILIDADES */}
                <div className="stats-category">
                  <h4>🎯 PROBABILIDADES</h4>
                  <div className="probability-display">
                    <div className="probability-item user">
                      <span className="probability-label">{character?.nickname}:</span>
                      <div className="probability-bar">
                        <div 
                          className="probability-fill user" 
                          style={{ width: `${winProbabilities.user}%` }}
                        >
                          <span className="probability-value">{winProbabilities.user}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="probability-item bot">
                      <span className="probability-label">{selectedBot?.name}:</span>
                      <div className="probability-bar">
                        <div 
                          className="probability-fill bot" 
                          style={{ width: `${winProbabilities.bot}%` }}
                        >
                          <span className="probability-value">{winProbabilities.bot}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="stats-category">
                  <h4>⚽ ATAQUE</h4>
                  <div className="stat-row">
                    <span>Disparos:</span>
                    <span>{matchStats.user.shots || 0} - {matchStats.bot.shots || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Goles:</span>
                    <span>{matchStats.user.goals || 0} - {matchStats.bot.goals || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Precisión:</span>
                    <span>{matchStats.user.shotAccuracy || 0}% - {matchStats.bot.shotAccuracy || 0}%</span>
                  </div>
                  <div className="stat-row">
                    <span>Pases:</span>
                    <span>{matchStats.user.passes || 0} - {matchStats.bot.passes || 0}</span>
                  </div>
                </div>
                
                <div className="stats-category">
                  <h4>🛡️ DEFENSA</h4>
                  <div className="stat-row">
                    <span>Entradas:</span>
                    <span>{matchStats.user.tackles || 0} - {matchStats.bot.tackles || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Faltas:</span>
                    <span>{matchStats.user.fouls || 0} - {matchStats.bot.fouls || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Paradas:</span>
                    <span>{matchStats.user.saves || 0} - {matchStats.bot.saves || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Faltas Acum:</span>
                    <span>{matchStats.user.accumulatedFouls || 0} - {matchStats.bot.accumulatedFouls || 0}</span>
                  </div>
                </div>
                
                <div className="stats-category">
                  <h4>🎯 POSESIÓN</h4>
                  <div className="stat-row possession-row">
                    <span>Posesión:</span>
                    <div className="possession-bar-mini">
                      <div 
                        className="possession-fill user" 
                        style={{ width: `${matchStats.user.possession || 50}%` }}
                      >
                        {matchStats.user.possession || 50}%
                      </div>
                      <div 
                        className="possession-fill bot" 
                        style={{ width: `${matchStats.bot.possession || 50}%` }}
                      >
                        {matchStats.bot.possession || 50}%
                      </div>
                    </div>
                  </div>
                  <div className="stat-row">
                    <span>Precisión pases:</span>
                    <span>{matchStats.user.passAccuracy || 0}% - {matchStats.bot.passAccuracy || 0}%</span>
                  </div>
                  <div className="stat-row">
                    <span>Paredes:</span>
                    <span>{matchStats.user.wall_passes || 0} - {matchStats.bot.wall_passes || 0}</span>
                  </div>
                </div>

                <div className="stats-category">
                  <h4>📈 MOMENTUM</h4>
                  <div className="momentum-display">
                    <div className="momentum-bar-large">
                      <div 
                        className="momentum-fill-large" 
                        style={{ width: `${simulationState.momentum}%` }}
                      >
                        <span className="momentum-value">{simulationState.momentum}%</span>
                      </div>
                    </div>
                    <div className="pressure-stats">
                      <div className="pressure-item">
                        <span>{character?.nickname}:</span>
                        <span className="pressure-value">{simulationState.pressure.user}%</span>
                      </div>
                      <div className="pressure-item">
                        <span>{selectedBot?.name || 'RIVAL'}:</span>
                        <span className="pressure-value">{simulationState.pressure.bot}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-stats">
                <p>Las estadísticas aparecerán aquí cuando inicies un partido</p>
                <div className="formation-info">
                  <h4>Formación Seleccionada: {MATCH_CONFIG.FORMATIONS[selectedFormation]}</h4>
                  <p>Sistema táctico optimizado para fútbol sala</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL CENTRAL - CANCHA FÚTSAL */}
        <div className="center-panel">
          <div className="soccer-field improved futsal-field">
            <div className="field-grass">
              {/* Líneas de futsal */}
              <div className="center-circle"></div>
              <div className="center-spot"></div>
              <div className="penalty-area left futsal-penalty"></div>
              <div className="penalty-area right futsal-penalty"></div>
              <div className="goal left futsal-goal"></div>
              <div className="goal right futsal-goal"></div>
              <div className="penalty-spot left"></div>
              <div className="penalty-spot right"></div>
              
              {/* Segundo punto de penalti */}
              <div className="second-penalty left"></div>
              <div className="second-penalty right"></div>
              
              {simulating && selectedBot && simulationState.isActive && (
                <>
                  {/* Jugadores usuario */}
                  {currentPlayerPositions.user.map((pos, index) => (
                    <div 
                      key={`user-${index}`}
                      className={`player player-user improved ${index === 0 ? 'goalkeeper' : 'field-player'}`}
                      style={{ 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`
                      }}
                    >
                      <div className="player-icon">
                        {index === 0 ? '🧤' : '👤'}
                      </div>
                      <div className="player-name">
                        {index === 0 ? 'POR' : character?.nickname?.substring(0, 3) || 'JUG'}
                      </div>
                    </div>
                  ))}
                  
                  {/* Jugadores bot */}
                  {currentPlayerPositions.bot.map((pos, index) => (
                    <div 
                      key={`bot-${index}`}
                      className={`player player-bot improved ${index === 0 ? 'goalkeeper' : 'field-player'}`}
                      style={{ 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`
                      }}
                    >
                      <div className="player-icon">
                        {index === 0 ? '🧤' : getBotAvatar(selectedBot.level)}
                      </div>
                      <div className="player-name">
                        {index === 0 ? 'POR' : selectedBot?.name?.substring(0, 3) || 'RIV'}
                      </div>
                    </div>
                  ))}
                  
                  {/* Balón */}
                  <div 
                    className="soccer-ball improved" 
                    style={{ 
                      left: `${ballPosition.x}%`, 
                      top: `${ballPosition.y}%`
                    }}
                  >
                    ⚽
                  </div>

                  {/* Indicador de posesión */}
                  <div className="possession-indicator-field">
                    <div className={`possession-arrow ${simulationState.possession}`}></div>
                    <span className="possession-text">
                      {simulationState.possession === 'user' ? '▶️' : '◀️'} 
                      {simulationState.possession === 'user' ? character?.nickname : selectedBot?.name}
                    </span>
                  </div>

                  {/* Indicador de faltas acumuladas */}
                  <div className="fouls-indicator">
                    <div className="fouls-user">
                      {simulationState.accumulatedFouls.user} faltas
                    </div>
                    <div className="fouls-bot">
                      {simulationState.accumulatedFouls.bot} faltas
                    </div>
                  </div>
                </>
              )}
              
              {!simulating && (
                <div className="field-message improved">
                  <h3>🥅 SIMULADOR FÚTSAL PRO</h3>
                  <p>Selecciona formación y oponente para iniciar</p>
                  <div className="formation-preview">
                    <strong>Formación: {MATCH_CONFIG.FORMATIONS[selectedFormation]}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO - EVENTOS FÚTSAL */}
        <div className="right-panel events-panel">
          <div className="panel-header">
            <h3>📝 EVENTOS FÚTSAL</h3>
          </div>
          <div className="panel-content events-content">
            {matchEvents.length === 0 ? (
              <div className="no-events">
                <p>Esperando el inicio del partido...</p>
                <div className="match-info-side">
                  <div className="info-item">
                    <strong>Formación:</strong> {MATCH_CONFIG.FORMATIONS[selectedFormation]}
                  </div>
                  <div className="info-item">
                    <strong>Duración:</strong> 2×20 min
                  </div>
                  <div className="info-item">
                    <strong>Reglas:</strong> Futsal FIFA
                  </div>
                  <div className="info-item">
                    <strong>Doble Penalti:</strong> A partir de 5 faltas
                  </div>
                </div>
              </div>
            ) : (
              <div className="events-feed">
                {matchEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`event-item ${event.intensity} ${event.team}`}
                  >
                    <div className="event-header">
                      <span className="event-time">{event.time}</span>
                      <span className="event-action-icon">{getActionIcon(event.action)}</span>
                      <span className="event-team">
                        {event.team === 'user' ? character?.nickname : selectedBot?.name}
                      </span>
                    </div>
                    <div className="event-text">{event.text}</div>
                    {event.sub_type && (
                      <div className="event-subtype">{event.sub_type}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PANEL INFERIOR - BOTS Y OPCIONES */}
      <div className="bottom-panel professional">
        <div className="panel-tabs professional">
          <button className={`tab-button professional ${activePanel === "bots" ? "active" : ""}`} onClick={() => setActivePanel("bots")}>
            🤖 ELEGIR OPONENTE
          </button>
        </div>
        
        <div className="panel-content professional">
          {activePanel === "bots" ? (
            <div className="bots-grid professional">
              {safeBots.length > 0 ? (
                safeBots.map(bot => (
                  <div key={bot.id} className="bot-card professional improved">
                    <div className="bot-header professional">
                      <div 
                        className="bot-avatar professional" 
                        style={{ 
                          background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`,
                          boxShadow: `0 0 20px ${getDifficultyColor(bot.difficulty)}50`
                        }}
                      >
                        {getBotAvatar(bot.level)}
                        <div className="bot-level">Lvl {bot.level || 1}</div>
                      </div>
                      <div className="bot-info professional">
                        <h4>{bot.name || 'Bot Futsal'}</h4>
                        <div className="bot-stats">
                          <div className="stat-bar">
                            <span>Tiro: {bot.tiro || 0}</span>
                            <div className="bar">
                              <div 
                                className="fill" 
                                style={{ width: `${bot.tiro || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="stat-bar">
                            <span>Velocidad: {bot.velocidad || 0}</span>
                            <div className="bar">
                              <div 
                                className="fill" 
                                style={{ width: `${bot.velocidad || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="stat-bar">
                            <span>Defensa: {bot.defensa || 0}</span>
                            <div className="bar">
                              <div 
                                className="fill" 
                                style={{ width: `${bot.defensa || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="bot-meta professional">
                          <span className="level-badge professional">Nivel {bot.level || 1}</span>
                          <span 
                            className="difficulty-badge professional" 
                            style={{ 
                              color: getDifficultyColor(bot.difficulty),
                              borderColor: getDifficultyColor(bot.difficulty)
                            }}
                          >
                            {getDifficultyText(bot.difficulty)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* SECCIÓN DE RECOMPENSAS */}
                    {renderRewards(bot)}
                    
                    <button 
                      className={`play-btn professional ${bot.difficulty}`} 
                      onClick={() => onStartMatch(bot)} 
                      disabled={loading || simulating}
                      style={{ 
                        background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`,
                        boxShadow: `0 4px 15px ${getDifficultyColor(bot.difficulty)}40`
                      }}
                    >
                      {loading && selectedBot?.id === bot.id ? (
                        <span className="loading-spinner">🔄</span>
                      ) : (
                        "⚔️ JUGAR"
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-bots-message">
                  <div className="empty-state">
                    <div className="empty-icon">🤖</div>
                    <h4>No hay oponentes disponibles</h4>
                    <p>Intenta recargar la página</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboard;
