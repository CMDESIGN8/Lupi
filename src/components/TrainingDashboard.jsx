import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/TrainingDashboard.css";

// 🎮 CONSTANTES DE CONFIGURACIÓN PROFESIONAL
const MATCH_CONFIG = {
  DURATION: 90,
  EVENT_TYPES: {
    PASS: 'pass',
    TACKLE: 'tackle', 
    SHOT: 'shot',
    GOAL: 'goal',
    FOUL: 'foul',
    CORNER: 'corner',
    OFFSIDE: 'offside',
    SAVE: 'save',
    CROSS: 'cross'
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
  }
};

// 🎪 COMPONENTE DE CONTROLES MEJORADO
const SimulationControls = ({ speed, setSpeed, momentum }) => (
  <div className="simulation-controls professional">
    <div className="speed-controls">
      <button onClick={() => setSpeed(2000)} title="Muy Lento" className={speed === 2000 ? 'active' : ''}>🐌</button>
      <button onClick={() => setSpeed(1200)} title="Lento" className={speed === 1200 ? 'active' : ''}>🐢</button>
      <button onClick={() => setSpeed(800)} title="Normal" className={speed === 800 ? 'active' : ''}>▶️</button>
      <button onClick={() => setSpeed(400)} title="Rápido" className={speed === 400 ? 'active' : ''}>⏩</button>
      <button onClick={() => setSpeed(150)} title="Muy Rápido" className={speed === 150 ? 'active' : ''}>⚡</button>
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

// 🏆 COMPONENTE PRINCIPAL SUPER PRO
const TrainingDashboard = ({ character, bots = [], matchHistory, loading, simulating, selectedBot, onStartMatch, onMatchFinish, matchResult, onCloseResult, finalStats }) => {
  const [activePanel, setActivePanel] = useState("bots");

  // 🎮 ESTADO DE SIMULACIÓN AVANZADO
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
      user: '4-3-3',
      bot: '4-4-2'
    }
  });

  const [matchStats, setMatchStats] = useState(null);
  const [matchEvents, setMatchEvents] = useState([]);
  const [playerPositions, setPlayerPositions] = useState({});
  const simulationIntervalRef = useRef(null);

  // 🎯 SISTEMA DE HABILIDADES AVANZADO
  const calculatePlayerRating = useCallback((player, role = 'balanced') => {
    if (!player) return 50;
    const weights = {
      balanced: { tiro: 0.25, potencia: 0.20, defensa: 0.25, velocidad: 0.30 },
      attacker: { tiro: 0.35, potencia: 0.25, defensa: 0.15, velocidad: 0.25 },
      defender: { tiro: 0.15, potencia: 0.20, defensa: 0.40, velocidad: 0.25 },
      midfielder: { tiro: 0.25, potencia: 0.25, defensa: 0.25, velocidad: 0.25 }
    };
    
    const weight = weights[role];
    return (
      ((player.tiro || 50) * weight.tiro) +
      ((player.potencia || 50) * weight.potencia) + 
      ((player.defensa || 50) * weight.defensa) +
      ((player.velocidad || 50) * weight.velocidad)
    );
  }, []);

  // 🏃 SISTEMA DE POSICIONAMIENTO DINÁMICO (se mantiene igual)
  const calculatePlayerPositions = useCallback((ballZone, possession, matchTime) => {
    const basePositions = {
      user: { x: 25, y: 30 },
      bot: { x: 75, y: 60 }
    };

    const timeVariation = (Math.sin(matchTime * 0.1) * 5) + (Math.random() * 10 - 5);

    switch(ballZone) {
      case MATCH_CONFIG.ZONES.USER_DEFENSE:
        return {
          user: { 
            x: 15 + Math.random() * 15 + timeVariation, 
            y: 25 + Math.random() * 40 
          },
          bot: { 
            x: 70 + Math.random() * 10 + timeVariation, 
            y: 55 + Math.random() * 20 
          }
        };
      case MATCH_CONFIG.ZONES.BOT_DEFENSE:
        return {
          user: { 
            x: 65 + Math.random() * 15 + timeVariation, 
            y: 25 + Math.random() * 40 
          },
          bot: { 
            x: 20 + Math.random() * 10 + timeVariation, 
            y: 55 + Math.random() * 20 
          }
        };
      default: // CENTER
        return {
          user: { 
            x: 30 + Math.random() * 20 + timeVariation, 
            y: 20 + Math.random() * 60 
          },
          bot: { 
            x: 60 + Math.random() * 20 + timeVariation, 
            y: 20 + Math.random() * 60 
          }
        };
    }
  }, []);

  // 🎲 SISTEMA DE PROBABILIDADES AVANZADO (se mantiene igual)
  const calculateActionProbabilities = useCallback((attacker, defender, ballZone, momentum, matchTime) => {
    const baseProbabilities = {
      [MATCH_CONFIG.EVENT_TYPES.PASS]: 0.55,
      [MATCH_CONFIG.EVENT_TYPES.TACKLE]: 0.18,
      [MATCH_CONFIG.EVENT_TYPES.SHOT]: 0.12,
      [MATCH_CONFIG.EVENT_TYPES.FOUL]: 0.04,
      [MATCH_CONFIG.EVENT_TYPES.CORNER]: 0.03,
      [MATCH_CONFIG.EVENT_TYPES.CROSS]: 0.05,
      [MATCH_CONFIG.EVENT_TYPES.OFFSIDE]: 0.02,
      [MATCH_CONFIG.EVENT_TYPES.SAVE]: 0.01
    };

    if (ballZone === MATCH_CONFIG.ZONES.BOT_DEFENSE) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.SHOT] += 0.08;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.CROSS] += 0.03;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= 0.10;
    } else if (ballZone === MATCH_CONFIG.ZONES.USER_DEFENSE) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.TACKLE] += 0.08;
    }

    const momentumFactor = (momentum - 50) / 100;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.SHOT] += momentumFactor * 0.06;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= momentumFactor * 0.03;

    const fatigueFactor = matchTime / MATCH_CONFIG.DURATION;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.FOUL] += fatigueFactor * 0.03;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= fatigueFactor * 0.02;

    return baseProbabilities;
  }, []);

  // ⚽ GENERADOR DE EVENTOS PROFESIONAL
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
      currentTime
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

  // 🎪 GENERADOR ESPECÍFICO POR TIPO DE EVENTO (se mantiene igual)
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
          `¡¡¡GOOOOL DE ${attackerName}!!! Un disparo espectacular.`,
          `¡¡¡GOLAZO DE ${attackerName}!!! Remate imparable.`,
          `¡GOOL! ${attackerName} define con clase.`,
        ];
        return {
          ...baseEvent,
          text: getRandomText(goalTexts),
          intensity: MATCH_CONFIG.INTENSITY.VERY_HIGH,
          zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
          stat_type: 'goals'
        };

      case MATCH_CONFIG.EVENT_TYPES.SHOT:
        const shotQuality = calculatePlayerRating(attacker, 'attacker');
        const saveQuality = calculatePlayerRating(defender, 'defender');
        const goalProbability = (shotQuality / (shotQuality + saveQuality * 1.3)) * (1 + (simulationState.momentum - 50) / 100);
        
        if (Math.random() < goalProbability * 0.8) {
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
        } else if (Math.random() < 0.3) {
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

      case MATCH_CONFIG.EVENT_TYPES.PASS:
        const passTexts = [
          `${attackerName} realiza un pase preciso al compañero.`,
          `${attackerName} cambia el juego de banda con visión.`,
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

      default:
        return {
          ...baseEvent,
          text: `${attackerName} controla el balón en el mediocampo.`,
          intensity: MATCH_CONFIG.INTENSITY.LOW,
          zone: MATCH_CONFIG.ZONES.CENTER,
          stat_type: 'passes'
        };
    }
  };

  // 🗺️ SISTEMA DE TRANSICIÓN DE ZONAS MEJORADO (se mantiene igual)
  const getNextZone = (currentZone, possession) => {
    const zoneProgression = {
      [MATCH_CONFIG.ZONES.USER_DEFENSE]: {
        user: [MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.CENTER],
        bot: [MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.CENTER]
      },
      [MATCH_CONFIG.ZONES.CENTER]: {
        user: [MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER],
        bot: [MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.USER_DEFENSE, MATCH_CONFIG.ZONES.CENTER]
      },
      [MATCH_CONFIG.ZONES.BOT_DEFENSE]: {
        user: [MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER, MATCH_CONFIG.ZONES.BOT_DEFENSE],
        bot: [MATCH_CONFIG.ZONES.BOT_DEFENSE, MATCH_CONFIG.ZONES.CENTER]
      }
    };

    const possibleZones = zoneProgression[currentZone][possession];
    return possibleZones[Math.floor(Math.random() * possibleZones.length)];
  };

  // 🔄 MOTOR PRINCIPAL DE SIMULACIÓN MEJORADO (se mantiene igual)
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

    setPlayerPositions(calculatePlayerPositions(event.zone, event.team, currentTime));
    setMatchEvents(prev => [event, ...prev.slice(0, 24)]);
    setMatchStats(prev => updateMatchStats(prev, event, currentTime));
  }, [character, selectedBot, simulationState, generateMatchEvent, calculatePlayerPositions, calculatePlayerRating]);

  // 📊 ACTUALIZADOR DE MOMENTUM MEJORADO (se mantiene igual)
  const updateMomentum = (currentMomentum, event, possession) => {
    let change = 0;
    
    switch(event.intensity) {
      case MATCH_CONFIG.INTENSITY.VERY_HIGH:
        if (event.action === MATCH_CONFIG.EVENT_TYPES.GOAL) {
          change = possession === 'user' ? 20 : -20;
        }
        break;
      case MATCH_CONFIG.INTENSITY.HIGH:
        change = possession === 'user' ? 8 : -8;
        break;
      case MATCH_CONFIG.INTENSITY.MEDIUM:
        change = possession === 'user' ? 3 : -3;
        break;
      default:
        change = possession === 'user' ? 1 : -1;
    }

    if (event.action === MATCH_CONFIG.EVENT_TYPES.TACKLE) {
      change = possession === 'user' ? -5 : 5;
    } else if (event.sub_type === 'saved') {
      change = possession === 'user' ? -8 : 5;
    }

    change += (Math.random() - 0.5) * 4;
    
    return Math.max(0, Math.min(100, currentMomentum + change));
  };

  // 🎯 ACTUALIZADOR DE PRESIÓN MEJORADO (se mantiene igual)
  const updatePressure = (currentPressure, event, possession) => {
    const pressureChange = event.intensity === MATCH_CONFIG.INTENSITY.VERY_HIGH ? 15 :
                          event.intensity === MATCH_CONFIG.INTENSITY.HIGH ? 10 :
                          event.intensity === MATCH_CONFIG.INTENSITY.MEDIUM ? 5 : 2;
    
    return {
      user: Math.max(0, Math.min(100, 
        currentPressure.user + (possession === 'user' ? pressureChange : -pressureChange/2)
      )),
      bot: Math.max(0, Math.min(100,
        currentPressure.bot + (possession === 'bot' ? pressureChange : -pressureChange/2)
      ))
    };
  };

  // 📈 ACTUALIZADOR DE ESTADÍSTICAS AVANZADO (se mantiene igual)
  const updateMatchStats = (prevStats, event, currentTime) => {
    if (!prevStats) return prevStats;

    const newStats = JSON.parse(JSON.stringify(prevStats));
    
    if (event.stat_type) {
      newStats[event.team][event.stat_type]++;
    }

    if (event.sub_type === 'saved') {
      newStats[event.team === 'user' ? 'bot' : 'user'].saves = 
        (newStats[event.team === 'user' ? 'bot' : 'user'].saves || 0) + 1;
    }

    const totalMinutes = currentTime;
    const userPossessionMinutes = (prevStats.user.possession / 100) * (totalMinutes - 1) + 
      (event.team === 'user' ? 1 : 0);
    
    newStats.user.possession = Math.round((userPossessionMinutes / totalMinutes) * 100);
    newStats.bot.possession = 100 - newStats.user.possession;

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

    return newStats;
  };

  // 🛑 DETENER SIMULACIÓN MEJORADO (se mantiene igual)
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
              }
            }
          });
        }, 500);
      }
    }
  }, [matchStats, simulationState, onMatchFinish]);

  // 🎮 SISTEMA DE VISUALIZACIÓN MEJORADO (se mantiene igual)
  const getBallPosition = useCallback(() => {
    const { ballZone, isActive, matchTime } = simulationState;
    if (!isActive) return { x: 50, y: 50 };

    const timeVariation = Math.sin(matchTime * 0.2) * 3;
    const randomVariation = Math.random() * 8 - 4;

    const zonePositions = {
      [MATCH_CONFIG.ZONES.USER_DEFENSE]: { 
        x: 15 + Math.random() * 10 + timeVariation, 
        y: 35 + Math.random() * 30 + randomVariation 
      },
      [MATCH_CONFIG.ZONES.CENTER]: { 
        x: 45 + Math.random() * 10 + timeVariation, 
        y: 40 + Math.random() * 20 + randomVariation 
      },
      [MATCH_CONFIG.ZONES.BOT_DEFENSE]: { 
        x: 75 + Math.random() * 10 + timeVariation, 
        y: 35 + Math.random() * 30 + randomVariation 
      }
    };

    return zonePositions[ballZone] || { x: 50, y: 50 };
  }, [simulationState]);

  // ⚡ EFECTO DE SIMULACIÓN SUPER PRO (se mantiene igual)
  useEffect(() => {
    if (simulating && selectedBot && character && !simulationState.isActive) {
      console.log("🚀 INICIANDO SIMULACIÓN PROFESIONAL");
      
      setMatchEvents([]);
      setMatchStats({
        user: { 
          shots: 0, goals: 0, passes: 0, tackles: 0, fouls: 0, 
          possession: 50, shotAccuracy: 0, passAccuracy: 100, 
          completed_passes: 0, saves: 0, name: character.nickname,
          crosses: 0, corners: 0
        },
        bot: { 
          shots: 0, goals: 0, passes: 0, tackles: 0, fouls: 0, 
          possession: 50, shotAccuracy: 0, passAccuracy: 100, 
          completed_passes: 0, saves: 0, name: selectedBot.name,
          crosses: 0, corners: 0
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
        lastAction: null
      }));

      simulationIntervalRef.current = setInterval(() => {
        setSimulationState(prev => {
          const newTime = prev.matchTime + 1;
          
          if (newTime >= MATCH_CONFIG.DURATION) {
            console.log("🏁 FINALIZANDO PARTIDO PROFESIONAL");
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
  }, [simulating, selectedBot, character, simulationState.speed]);

  // ⚡ EFECTO PARA CAMBIOS DE VELOCIDAD (se mantiene igual)
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

  // 🎨 FUNCIONES DE UI MEJORADAS
  const getActionIcon = (action) => {
    const icons = {
      [MATCH_CONFIG.EVENT_TYPES.GOAL]: '🥅',
      [MATCH_CONFIG.EVENT_TYPES.SHOT]: '⚽',
      [MATCH_CONFIG.EVENT_TYPES.PASS]: '↷',
      [MATCH_CONFIG.EVENT_TYPES.TACKLE]: '🛑',
      [MATCH_CONFIG.EVENT_TYPES.FOUL]: '⚠️',
      [MATCH_CONFIG.EVENT_TYPES.CORNER]: '↶',
      [MATCH_CONFIG.EVENT_TYPES.OFFSIDE]: '🚩',
      [MATCH_CONFIG.EVENT_TYPES.CROSS]: '⤴️',
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
    if (level <= 2) return "🥅"; 
    if (level <= 4) return "⚽"; 
    if (level <= 6) return "👟"; 
    if (level <= 8) return "🔥"; 
    if (level <= 10) return "🏆";
    return "👑"; 
  }, []);

  const getResultType = useCallback((match, characterId) => { 
    if (!match) return 'draw';
    if (match.winner_id === characterId) return 'win'; 
    if (match.player1_score === match.player2_score) return 'draw'; 
    return 'lose'; 
  }, []);

  const ballPosition = getBallPosition();
  const currentPlayerPositions = playerPositions.user ? playerPositions : {
    user: { x: 25, y: 30 },
    bot: { x: 75, y: 60 }
  };

  // ✅ CORRECCIÓN: Verificación segura para el array de bots
  const safeBots = Array.isArray(bots) ? bots : [];

  useEffect(() => {
  const interval = setInterval(() => {
    const header = document.querySelector(".app-header.professional");
    const target = document.querySelector(".section-header");

    if (header && target && !target.contains(header)) {
      target.appendChild(header);
      clearInterval(interval); // Detiene el intervalo cuando ya lo movió
    }
  }, 300);

  return () => clearInterval(interval);
}, []);

  return (
    <div className="training-dashboard super-pro">
      {/* HEADER SUPERIOR PROFESIONAL */}
      <div className="app-header professional">
        <div className="header-content">
          <div className="header-section">
            <h2>⚽ Comenzar Partido</h2>
            <div className="match-info-header">
              {simulating && selectedBot ? (
                <span className="opponent-info">vs {selectedBot.name}</span>
              ) : (
                <span className="opponent-info">Selecciona un oponente</span>
              )}
            </div>
          </div>
          
          <div className="header-section">
            <div className="match-status">
              <div className="score-display-header">
                {matchStats ? `${matchStats.user.goals || 0} - ${matchStats.bot.goals || 0}` : '0 - 0'}
              </div>
              <div className="time-display">
                <span className="match-time-header">{simulationState.matchTime}'</span>
                <span className="phase-header">
                  {simulationState.matchTime <= 45 ? '1º TIEMPO' : 
                   simulationState.matchTime < 90 ? '2º TIEMPO' : 'FINAL'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-section">
            <div className="controls-header">
              <SimulationControls 
                speed={simulationState.speed} 
                setSpeed={(s) => setSimulationState(prev => ({ ...prev, speed: s }))}
                momentum={simulationState.momentum}
              />
            </div>
          </div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL MEJORADO */}
      <div className="main-layout improved">
        {/* PANEL IZQUIERDO - ESTADÍSTICAS COMPLETAS */}
        <div className="left-panel stats-panel">
          <div className="panel-header">
            <h3>📊 ESTADÍSTICAS EN VIVO</h3>
          </div>
          <div className="panel-content stats-content">
            {matchStats ? (
              <div className="advanced-stats improved">
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
                    <span>Centros:</span>
                    <span>{matchStats.user.crosses || 0} - {matchStats.bot.crosses || 0}</span>
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
                    <span>Esquinas:</span>
                    <span>{matchStats.user.corners || 0} - {matchStats.bot.corners || 0}</span>
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
                    <span>Pases:</span>
                    <span>{matchStats.user.passes || 0} - {matchStats.bot.passes || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>Precisión pases:</span>
                    <span>{matchStats.user.passAccuracy || 0}% - {matchStats.bot.passAccuracy || 0}%</span>
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
              </div>
            )}
          </div>
        </div>

        {/* PANEL CENTRAL - CANCHA */}
        <div className="center-panel">
          <div className="soccer-field improved">
            <div className="field-grass">
              <div className="center-circle"></div>
              <div className="center-spot"></div>
              <div className="penalty-area left"></div>
              <div className="penalty-area right"></div>
              <div className="small-area left"></div>
              <div className="small-area right"></div>
              <div className="goal left"></div>
              <div className="goal right"></div>
              <div className="penalty-spot left"></div>
              <div className="penalty-spot right"></div>
              
              {simulating && selectedBot && simulationState.isActive && (
                <>
                  <div 
                    className="player player-user improved" 
                    style={{ 
                      left: `${currentPlayerPositions.user.x}%`, 
                      top: `${currentPlayerPositions.user.y}%`
                    }}
                  >
                    <div className="player-icon">👤</div>
                    <div className="player-name">{character?.nickname || "JUGADOR"}</div>
                  </div>
                  
                  <div 
                    className="player player-bot improved" 
                    style={{ 
                      left: `${currentPlayerPositions.bot.x}%`, 
                      top: `${currentPlayerPositions.bot.y}%`
                    }}
                  >
                    <div className="player-icon">{getBotAvatar(selectedBot.level)}</div>
                    <div className="player-name">{selectedBot?.name || "RIVAL"}</div>
                  </div>
                  
                  <div 
                    className="soccer-ball improved" 
                    style={{ 
                      left: `${ballPosition.x}%`, 
                      top: `${ballPosition.y}%`
                    }}
                  >
                    ⚽
                  </div>

                  <div className="possession-indicator-field">
                    <div className={`possession-arrow ${simulationState.possession}`}></div>
                    <span className="possession-text">
                      {simulationState.possession === 'user' ? '▶️' : '◀️'} 
                      {simulationState.possession === 'user' ? character?.nickname : selectedBot?.name}
                    </span>
                  </div>
                </>
              )}
              
              {!simulating && (
                <div className="field-message improved">
                  <h3>⚽ Comenzar Partido</h3>
                  <p>Selecciona un oponente para iniciar la simulación</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO - EVENTOS COMPLETOS */}
        <div className="right-panel events-panel">
          <div className="panel-header">
            <h3>📝 EVENTOS DEL PARTIDO</h3>
          </div>
          <div className="panel-content events-content">
            {matchEvents.length === 0 ? (
              <div className="no-events">
                <p>Esperando el inicio del partido...</p>
                <div className="match-info-side">
                  <div className="info-item">
                    <strong>Formación:</strong> {simulationState.formaciones.user}
                  </div>
                  <div className="info-item">
                    <strong>Condiciones:</strong> Óptimas
                  </div>
                  <div className="info-item">
                    <strong>Árbitro:</strong> Sistema VAR
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

      {/* PANEL INFERIOR - SOLO BOTS */}
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
      safeBots.map(bot => {
        const userOverall = calculatePlayerRating(character, 'balanced');
        const botOverall = calculatePlayerRating(bot, 'balanced');
        const winProbability = Math.max(15, Math.min(85, 
          (userOverall / (userOverall + botOverall)) * 100
        ));
        
        const baseExp = 50 + (bot.level * 10);
        const baseCoins = 30 + (bot.level * 5);
        const difficultyMultiplier = {
          easy: 1,
          medium: 1.3,
          hard: 1.7,
          expert: 2.2,
          legendary: 3
        }[bot.difficulty] || 1;
        
        const rewards = {
          exp: Math.round(baseExp * difficultyMultiplier),
          coins: Math.round(baseCoins * difficultyMultiplier)
        };

        const getSpecialAbility = () => {
          if (bot.tiro >= 80) return { name: "Tiro de Larga Distancia", icon: "🎯", color: "#f59e0b" };
          if (bot.velocidad >= 80) return { name: "Regate Explosivo", icon: "⚡", color: "#10b981" };
          if (bot.defensa >= 80) return { name: "Marcaje Férreo", icon: "🛡️", color: "#3b82f6" };
          if (bot.potencia >= 80) return { name: "Fuerza Física", icon: "💪", color: "#ef4444" };
          if (bot.tiro >= 70 && bot.velocidad >= 70) return { name: "Juego Combinado", icon: "🔗", color: "#8b5cf6" };
          return { name: "Juego Equilibrado", icon: "⚖️", color: "#6b7280" };
        };

        const specialAbility = getSpecialAbility();

        return (
          <div key={bot.id} className="bot-card professional gamer-style">
            {/* HEADER CON NOMBRE Y OVERALL */}
            <div className="bot-card-header">
              <div className="bot-name-section">
                <h3 className="bot-name">{bot.name || 'Pro Bot'}</h3>
                <div className="bot-overall-badge">
                  <span className="overall-number">{Math.round(botOverall)}</span>
                  <span className="overall-text">OVR</span>
                </div>
              </div>
              
              <div className="bot-meta-info">
                <div className="level-difficulty">
                  <span className="level-badge">NIVEL {bot.level || 1}</span>
                  <span 
                    className="difficulty-badge"
                    style={{ 
                      background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`,
                      boxShadow: `0 0 10px ${getDifficultyColor(bot.difficulty)}50`
                    }}
                  >
                    {getDifficultyText(bot.difficulty)}
                  </span>
                </div>
              </div>
            </div>

            {/* HABILIDAD ESPECIAL */}
            <div 
              className="special-ability-card"
              style={{ borderLeft: `4px solid ${specialAbility.color}` }}
            >
              <div className="ability-icon" style={{ color: specialAbility.color }}>
                {specialAbility.icon}
              </div>
              <div className="ability-info">
                <span className="ability-label">HABILIDAD ESPECIAL</span>
                <span className="ability-name">{specialAbility.name}</span>
              </div>
            </div>

            {/* GRÁFICO RADAR ESTILO FIFA */}
<div className="skills-radar-section">
  <h4 className="section-title">ESTADÍSTICAS</h4>
  <div className="radar-container">
    <div className="radar-chart">
      <div className="radar-grid">
        {/* Líneas del grid del radar */}
        <div className="radar-ring ring-1"></div>
        <div className="radar-ring ring-2"></div>
        <div className="radar-ring ring-3"></div>
        <div className="radar-ring ring-4"></div>
        <div className="radar-ring ring-5"></div>
        
        {/* Ejes del radar */}
        <div className="radar-axis axis-1"></div>
        <div className="radar-axis axis-2"></div>
        <div className="radar-axis axis-3"></div>
        <div className="radar-axis axis-4"></div>
        
        {/* Puntos de datos */}
        <div 
          className="radar-point shooting-point" 
          style={{ 
            '--shooting-value': `${(bot.tiro || 50) / 100}`,
            '--point-index': '0'
          }}
        >
          <div className="point-value">{bot.tiro || 50}</div>
          <div className="point-label">TIRO</div>
        </div>
        
        <div 
          className="radar-point pace-point" 
          style={{ 
            '--pace-value': `${(bot.velocidad || 50) / 100}`,
            '--point-index': '1'
          }}
        >
          <div className="point-value">{bot.velocidad || 50}</div>
          <div className="point-label">VELOCIDAD</div>
        </div>
        
        <div 
          className="radar-point defending-point" 
          style={{ 
            '--defending-value': `${(bot.defensa || 50) / 100}`,
            '--point-index': '2'
          }}
        >
          <div className="point-value">{bot.defensa || 50}</div>
          <div className="point-label">DEFENSA</div>
        </div>
        
        <div 
          className="radar-point physical-point" 
          style={{ 
            '--physical-value': `${(bot.potencia || 50) / 100}`,
            '--point-index': '3'
          }}
        >
          <div className="point-value">{bot.potencia || 50}</div>
          <div className="point-label">POTENCIA</div>
        </div>
        
        {/* Área del polígono */}
        <div className="radar-polygon"></div>
      </div>
    </div>
    
    {/* Leyenda de estadísticas */}
    <div className="radar-legend">
      <div className="legend-item">
        <div className="legend-color shooting-color"></div>
        <span className="legend-text">Tiro</span>
        <span className="legend-value">{bot.tiro || 50}</span>
      </div>
      <div className="legend-item">
        <div className="legend-color pace-color"></div>
        <span className="legend-text">Velocidad</span>
        <span className="legend-value">{bot.velocidad || 50}</span>
      </div>
      <div className="legend-item">
        <div className="legend-color defending-color"></div>
        <span className="legend-text">Defensa</span>
        <span className="legend-value">{bot.defensa || 50}</span>
      </div>
      <div className="legend-item">
        <div className="legend-color physical-color"></div>
        <span className="legend-text">Potencia</span>
        <span className="legend-value">{bot.potencia || 50}</span>
      </div>
    </div>
  </div>
</div>

            {/* PREDICCIÓN DE PARTIDO */}
            <div className="match-prediction-section">
              <h4 className="section-title">PREDICCIÓN DEL PARTIDO</h4>
              <div className="prediction-grid">
                <div className="prediction-item win">
                  <div className="prediction-label">VICTORIA</div>
                  <div className="prediction-percentage">{Math.round(winProbability)}%</div>
                  <div className="prediction-bar">
                    <div 
                      className="prediction-fill" 
                      style={{ width: `${winProbability}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="prediction-item draw">
                  <div className="prediction-label">EMPATE</div>
                  <div className="prediction-percentage">{Math.round((100 - winProbability) * 0.3)}%</div>
                  <div className="prediction-bar">
                    <div 
                      className="prediction-fill" 
                      style={{ width: `${(100 - winProbability) * 0.3}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="prediction-item lose">
                  <div className="prediction-label">DERROTA</div>
                  <div className="prediction-percentage">{Math.round((100 - winProbability) * 0.7)}%</div>
                  <div className="prediction-bar">
                    <div 
                      className="prediction-fill" 
                      style={{ width: `${(100 - winProbability) * 0.7}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMPENSAS */}
            <div className="rewards-section">
              <h4 className="section-title">RECOMPENSAS</h4>
              <div className="rewards-grid">
                <div className="reward-card exp">
                  <div className="reward-icon">⭐</div>
                  <div className="reward-info">
                    <div className="reward-amount">+{rewards.exp} EXP</div>
                    <div className="reward-label">Experiencia</div>
                  </div>
                </div>
                
                <div className="reward-card coins">
                  <div className="reward-icon">🪙</div>
                  <div className="reward-info">
                    <div className="reward-amount">+{rewards.coins}</div>
                    <div className="reward-label">Monedas</div>
                  </div>
                </div>
                
                <div className="reward-card bonus">
                  <div className="reward-icon">🎯</div>
                  <div className="reward-info">
                    <div className="reward-amount">+{Math.round(difficultyMultiplier * 100 - 100)}%</div>
                    <div className="reward-label">Bonus</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN DE JUGAR */}
            <button 
              className={`play-btn gamer-style ${bot.difficulty}`} 
              onClick={() => onStartMatch(bot)} 
              disabled={loading || simulating}
              style={{ 
                background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`,
                boxShadow: `0 4px 20px ${getDifficultyColor(bot.difficulty)}60`
              }}
            >
              {loading && selectedBot?.id === bot.id ? (
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <span>PREPARANDO PARTIDO...</span>
                </div>
              ) : (
                <div className="play-content">
                  <span className="play-text">⚔️ JUGAR PARTIDO</span>
                  <span className="play-details">90' • {Math.round(botOverall)} OVR</span>
                </div>
              )}
            </button>
          </div>
        );
      })
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
