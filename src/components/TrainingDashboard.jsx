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
const SimulationControls = ({ speed, setSpeed, onPause, onResume, isActive, momentum }) => (
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
const TrainingDashboard = ({ character, bots, matchHistory, loading, simulating, selectedBot, onStartMatch, onMatchFinish, matchResult, onCloseResult }) => {
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
  const [matchHistoryState, setMatchHistoryState] = useState([]);
  const simulationIntervalRef = useRef(null);

  // 🎯 SISTEMA DE HABILIDADES AVANZADO
  const calculatePlayerRating = useCallback((player, role = 'balanced') => {
    const weights = {
      balanced: { tiro: 0.25, potencia: 0.20, defensa: 0.25, velocidad: 0.30 },
      attacker: { tiro: 0.35, potencia: 0.25, defensa: 0.15, velocidad: 0.25 },
      defender: { tiro: 0.15, potencia: 0.20, defensa: 0.40, velocidad: 0.25 },
      midfielder: { tiro: 0.25, potencia: 0.25, defensa: 0.25, velocidad: 0.25 }
    };
    
    const weight = weights[role];
    return (
      (player.tiro * weight.tiro) +
      (player.potencia * weight.potencia) + 
      (player.defensa * weight.defensa) +
      (player.velocidad * weight.velocidad)
    );
  }, []);

  // 🏃 SISTEMA DE POSICIONAMIENTO DINÁMICO
  const calculatePlayerPositions = useCallback((ballZone, possession, matchTime) => {
    const basePositions = {
      user: { x: 25, y: 30 },
      bot: { x: 75, y: 60 }
    };

    // Variación basada en el tiempo para movimiento natural
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

  // 🎲 SISTEMA DE PROBABILIDADES AVANZADO
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

    // Modificar probabilidades según zona
    if (ballZone === MATCH_CONFIG.ZONES.BOT_DEFENSE) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.SHOT] += 0.08;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.CROSS] += 0.03;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= 0.10;
    } else if (ballZone === MATCH_CONFIG.ZONES.USER_DEFENSE) {
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.TACKLE] += 0.08;
      baseProbabilities[MATCH_CONFIG.EVENT_TYPES.CLEARANCE] += 0.05;
    }

    // Modificar por momentum (parte emocional)
    const momentumFactor = (momentum - 50) / 100;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.SHOT] += momentumFactor * 0.06;
    baseProbabilities[MATCH_CONFIG.EVENT_TYPES.PASS] -= momentumFactor * 0.03;

    // Modificar según tiempo de partido (fatiga)
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

    // Calcular probabilidades avanzadas
    const probabilities = calculateActionProbabilities(
      attacker, 
      defender, 
      simulationState.ballZone, 
      simulationState.momentum,
      currentTime
    );
    
    // Seleccionar acción basada en probabilidades
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

    // Generar evento específico
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

  // 🎪 GENERADOR ESPECÍFICO POR TIPO DE EVENTO
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
          `¡INCREÍBLE! ${attackerName} anota un gol magistral.`,
          `¡SEÑORES GOL DE ${attackerName}! Celebra con emoción.`
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
        
        if (Math.random() < goalProbability * 0.8) { // Reducir probabilidad de gol
          return {
            ...baseEvent,
            action: MATCH_CONFIG.EVENT_TYPES.GOAL,
            text: getRandomText([
              `¡¡¡GOOOOL DE ${attackerName}!!! Remate imparable.`,
              `¡GOL! ${attackerName} encuentra el ángulo perfecto.`,
              `¡SE ABRE EL MARCADOR! ${attackerName} anota.`
            ]),
            intensity: MATCH_CONFIG.INTENSITY.VERY_HIGH,
            zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
            stat_type: 'goals'
          };
        } else if (Math.random() < 0.3) {
          // Portería salvada
          const saveTexts = [
            `¡Qué parada del portero! Ataja el remate de ${attackerName}.`,
            `El guardameta detiene el potente disparo de ${attackerName}.`,
            `¡Increíble salvada! ${attackerName} no puede creerlo.`
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
          // Disparo fallado
          const missTexts = [
            `¡Casi! ${attackerName} dispara pero se va por poco.`,
            `¡Qué oportunidad! ${attackerName} falla el remate.`,
            `${attackerName} dispara pero da en el palo. ¡Qué mala suerte!`,
            `El balón se va por encima del travesaño. ${attackerName} se lleva las manos a la cabeza.`
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
          `Buena combinación entre los jugadores del equipo.`,
          `${attackerName} avanza con el balón controlado.`,
          `Pase filtrado de ${attackerName} que abre el juego.`
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
          `Buena presión defensiva del equipo. Recuperan la posesión.`,
          `¡Qué robo de balón de ${defenderName}! Inicia el contragolpe.`
        ];
        return {
          ...baseEvent,
          text: getRandomText(tackleTexts),
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: simulationState.ballZone,
          stat_type: 'tackles',
          team: possession === 'user' ? 'bot' : 'user' // Cambio de posesión
        };

      case MATCH_CONFIG.EVENT_TYPES.FOUL:
        const foulTexts = [
          `Falta dura cometida por ${attackerName}. El árbitro pita.`,
          `${attackerName} comete falta. Tarjeta amarilla.`,
          `Falta táctica de ${attackerName}. Detiene el contraataque.`
        ];
        return {
          ...baseEvent,
          text: getRandomText(foulTexts),
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: simulationState.ballZone,
          stat_type: 'fouls'
        };

      case MATCH_CONFIG.EVENT_TYPES.CROSS:
        const crossTexts = [
          `${attackerName} envía un centro peligroso al área.`,
          `Centro medido de ${attackerName} buscando a su compañero.`,
          `${attackerName} manda el balón al segundo palo.`
        ];
        return {
          ...baseEvent,
          text: getRandomText(crossTexts),
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
          stat_type: 'crosses'
        };

      case MATCH_CONFIG.EVENT_TYPES.CORNER:
        return {
          ...baseEvent,
          text: `Saque de esquina a favor del equipo de ${attackerName}.`,
          intensity: MATCH_CONFIG.INTENSITY.MEDIUM,
          zone: MATCH_CONFIG.ZONES.BOT_DEFENSE,
          stat_type: 'corners'
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

  // 🗺️ SISTEMA DE TRANSICIÓN DE ZONAS MEJORADO
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

  // 🔄 MOTOR PRINCIPAL DE SIMULACIÓN MEJORADO
  const simulateMinute = useCallback((currentTime) => {
    if (!character || !selectedBot || !simulationState.isActive) return;

    // Calcular iniciativa con momentum y factores avanzados
    const userRating = calculatePlayerRating(character, 'balanced');
    const botRating = calculatePlayerRating(selectedBot, 'balanced');
    const momentumFactor = (simulationState.momentum - 50) / 50;
    const pressureFactor = (simulationState.pressure.user - simulationState.pressure.bot) / 100;
    
    let initiativeChance = (userRating / (userRating + botRating)) + 
                          momentumFactor * 0.15 + 
                          pressureFactor * 0.1;
    
    // Añadir aleatoriedad controlada
    initiativeChance += (Math.random() - 0.5) * 0.2;
    
    const hasUserInitiative = Math.random() < Math.max(0.15, Math.min(0.85, initiativeChance));
    const currentPossession = hasUserInitiative ? 'user' : 'bot';

    // Generar evento
    const event = generateMatchEvent(currentPossession, currentTime);
    if (!event) return;

    // Actualizar momentum basado en el evento
    const newMomentum = updateMomentum(simulationState.momentum, event, currentPossession);

    // Actualizar presión
    const newPressure = updatePressure(simulationState.pressure, event, currentPossession);

    // Actualizar todos los estados
    setSimulationState(prev => ({
      ...prev,
      possession: event.team,
      ballZone: event.zone,
      momentum: newMomentum,
      pressure: newPressure,
      lastAction: event.action
    }));

    // Actualizar posiciones de jugadores
    setPlayerPositions(calculatePlayerPositions(event.zone, event.team, currentTime));

    // Actualizar eventos del partido
    setMatchEvents(prev => [event, ...prev.slice(0, 24)]); // Mantener últimos 25 eventos

    // Actualizar estadísticas
    setMatchStats(prev => updateMatchStats(prev, event, currentTime));
  }, [character, selectedBot, simulationState, generateMatchEvent, calculatePlayerPositions, calculatePlayerRating]);

  // 📊 ACTUALIZADOR DE MOMENTUM MEJORADO
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

    // Efectos especiales por tipo de acción
    if (event.action === MATCH_CONFIG.EVENT_TYPES.TACKLE) {
      change = possession === 'user' ? -5 : 5; // El que pierde la posesión pierde momentum
    } else if (event.sub_type === 'saved') {
      change = possession === 'user' ? -8 : 5; // El portero gana momentum al salvar
    }

    // Añadir aleatoriedad controlada
    change += (Math.random() - 0.5) * 4;
    
    return Math.max(0, Math.min(100, currentMomentum + change));
  };

  // 🎯 ACTUALIZADOR DE PRESIÓN MEJORADO
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

  // 📈 ACTUALIZADOR DE ESTADÍSTICAS AVANZADO
  const updateMatchStats = (prevStats, event, currentTime) => {
    if (!prevStats) return prevStats;

    const newStats = JSON.parse(JSON.stringify(prevStats));
    
    // Actualizar estadística principal del evento
    if (event.stat_type) {
      newStats[event.team][event.stat_type]++;
    }

    // Estadísticas específicas por sub-tipo
    if (event.sub_type === 'saved') {
      newStats[event.team === 'user' ? 'bot' : 'user'].saves = 
        (newStats[event.team === 'user' ? 'bot' : 'user'].saves || 0) + 1;
    }

    // Calcular posesión en tiempo real
    const totalMinutes = currentTime;
    const userPossessionMinutes = (prevStats.user.possession / 100) * (totalMinutes - 1) + 
      (event.team === 'user' ? 1 : 0);
    
    newStats.user.possession = Math.round((userPossessionMinutes / totalMinutes) * 100);
    newStats.bot.possession = 100 - newStats.user.possession;

    // Calcular precisión de tiros
    if (event.stat_type === 'shots') {
      const totalShots = newStats[event.team].shots;
      const goals = newStats[event.team].goals || 0;
      newStats[event.team].shotAccuracy = totalShots > 0 ? Math.round((goals / totalShots) * 100) : 0;
    }

    // Calcular precisión de pases
    if (event.stat_type === 'passes') {
      newStats[event.team].completed_passes = (newStats[event.team].completed_passes || 0) + 1;
      const totalPasses = newStats[event.team].passes;
      const completed = newStats[event.team].completed_passes;
      newStats[event.team].passAccuracy = totalPasses > 0 ? Math.round((completed / totalPasses) * 100) : 100;
    }

    return newStats;
  };

  // 🛑 DETENER SIMULACIÓN MEJORADO
  const stopSimulation = useCallback((finalize = false) => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    if (finalize) {
      setSimulationState(prev => ({ ...prev, isActive: false }));
      
      // Enviar estadísticas finales
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

  // 🎮 SISTEMA DE VISUALIZACIÓN MEJORADO
  const getBallPosition = useCallback(() => {
    const { ballZone, isActive, matchTime } = simulationState;
    if (!isActive) return { x: 50, y: 50 };

    // Movimiento más natural con variación temporal
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

  // ⚡ EFECTO DE SIMULACIÓN SUPER PRO
  useEffect(() => {
    if (simulating && selectedBot && character && !simulationState.isActive) {
      console.log("🚀 INICIANDO SIMULACIÓN PROFESIONAL");
      
      // Reiniciar estados
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

      // Configurar intervalo de simulación
      simulationIntervalRef.current = setInterval(() => {
        setSimulationState(prev => {
          const newTime = prev.matchTime + 1;
          
          // Finalizar partido a los 90 minutos
          if (newTime >= MATCH_CONFIG.DURATION) {
            console.log("🏁 FINALIZANDO PARTIDO PROFESIONAL");
            stopSimulation(true);
            return { ...prev, isActive: false };
          }
          
          // Simular minuto actual
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

  const getDifficultyColor = useCallback((difficulty) => ({ 
    easy: '#4cc9f0', 
    medium: '#4361ee', 
    hard: '#7209b7',
    expert: '#f72585',
    legendary: '#ff9e00'
  }[difficulty] || '#00bbf9'), []);

  const getDifficultyText = useCallback((difficulty) => ({ 
    easy: 'FÁCIL', 
    medium: 'MEDIO', 
    hard: 'DIFÍCIL',
    expert: 'ÉLITE',
    legendary: 'LEYENDA'
  }[difficulty] || difficulty.toUpperCase()), []);

  const getBotAvatar = useCallback((botLevel) => { 
    if (botLevel <= 2) return "🥅"; 
    if (botLevel <= 4) return "⚽"; 
    if (botLevel <= 6) return "👟"; 
    if (botLevel <= 8) return "🔥"; 
    if (botLevel <= 10) return "🏆";
    return "👑"; 
  }, []);

  const getResultType = useCallback((match, characterId) => { 
    if (match.winner_id === characterId) return 'win'; 
    if (match.player1_score === match.player2_score) return 'draw'; 
    return 'lose'; 
  }, []);

  const ballPosition = getBallPosition();
  const currentPlayerPositions = playerPositions.user ? playerPositions : {
    user: { x: 25, y: 30 },
    bot: { x: 75, y: 60 }
  };

  return (
    <div className="training-dashboard super-pro">
      <div className="main-layout">
        <div className="left-panel">
          <div className="soccer-field professional">
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
              
              {/* Barra de Momentum */}
              <div className="momentum-overlay">
                <div className="momentum-bar-field">
                  <div 
                    className="momentum-fill-field" 
                    style={{ width: `${simulationState.momentum}%` }}
                    data-value={simulationState.momentum}
                  >
                    <span className="momentum-text">
                      Momentum: {simulationState.momentum}%
                    </span>
                  </div>
                </div>
              </div>

              {simulating && selectedBot && simulationState.isActive && (
                <>
                  {/* Jugador Usuario */}
                  <div 
                    className="player player-user professional" 
                    style={{ 
                      left: `${currentPlayerPositions.user.x}%`, 
                      top: `${currentPlayerPositions.user.y}%`,
                      '--pressure': `${simulationState.pressure.user}%`
                    }}
                  >
                    <div className="player-icon">👤</div>
                    <div className="player-name">{character?.nickname || "JUGADOR"}</div>
                    <div className="player-stats">
                      <span>Tiro: {character.tiro}</span>
                      <span>Vel: {character.velocidad}</span>
                    </div>
                    <div className="player-pressure-indicator"></div>
                  </div>
                  
                  {/* Jugador Bot */}
                  <div 
                    className="player player-bot professional" 
                    style={{ 
                      left: `${currentPlayerPositions.bot.x}%`, 
                      top: `${currentPlayerPositions.bot.y}%`,
                      '--pressure': `${simulationState.pressure.bot}%`
                    }}
                  >
                    <div className="player-icon">{getBotAvatar(selectedBot.level)}</div>
                    <div className="player-name">{selectedBot?.name || "RIVAL"}</div>
                    <div className="player-stats">
                      <span>Tiro: {selectedBot.tiro}</span>
                      <span>Vel: {selectedBot.velocidad}</span>
                    </div>
                    <div className="player-pressure-indicator"></div>
                  </div>
                  
                  {/* Balón con efectos */}
                  <div 
                    className="soccer-ball professional" 
                    style={{ 
                      left: `${ballPosition.x}%`, 
                      top: `${ballPosition.y}%`,
                      '--pulse': simulationState.lastAction === MATCH_CONFIG.EVENT_TYPES.GOAL ? '1' : '0'
                    }}
                  >
                    ⚽
                    {simulationState.lastAction === MATCH_CONFIG.EVENT_TYPES.GOAL && (
                      <div className="goal-effect">✨</div>
                    )}
                  </div>

                  {/* Indicador de Posesión */}
                  <div className="possession-indicator-field">
                    <div className={`possession-arrow ${simulationState.possession}`}></div>
                    <span className="possession-text">
                      {simulationState.possession === 'user' ? '▶️' : '◀️'} 
                      {simulationState.possession === 'user' ? character.nickname : selectedBot.name}
                    </span>
                  </div>
                </>
              )}
              
              {!simulating && (
                <div className="field-message professional">
                  <h3>⚽ SIMULADOR TÁCTICO PRO</h3>
                  <p>Selecciona un oponente para iniciar la simulación profesional.</p>
                  <div className="feature-list">
                    <span>🎯 Sistema de Momentum</span>
                    <span>🏃 Posicionamiento Dinámico</span>
                    <span>📊 Estadísticas Avanzadas</span>
                    <span>⚡ Múltiples Velocidades</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="match-commentary professional">
            <div className="commentary-header professional">
              <h3>🎙️ COMENTARIO EN VIVO</h3>
              <SimulationControls 
                speed={simulationState.speed} 
                setSpeed={(s) => setSimulationState(prev => ({ ...prev, speed: s }))}
                momentum={simulationState.momentum}
              />
              <div className="match-time professional">
                <span className="time">{simulationState.matchTime}'</span>
                <span className="phase">
                  {simulationState.matchTime <= 45 ? '1º TIEMPO' : 
                   simulationState.matchTime < 90 ? '2º TIEMPO' : 'FINAL'}
                </span>
              </div>
            </div>
            
            <div className="commentary-feed professional">
              {matchEvents.length === 0 ? (
                <div className="no-commentary professional">
                  <p>Esperando el inicio del partido...</p>
                  <div className="pre-match-info">
                    <div>Formación: {simulationState.formaciones.user}</div>
                    <div>Condiciones: Óptimas</div>
                    <div>Árbitro: Sistema VAR</div>
                  </div>
                </div>
              ) : (
                matchEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`commentary-event professional ${event.intensity} ${event.team} ${event.action}`}
                  >
                    <span className="event-time">{event.time}</span>
                    <span className="event-action">{getActionIcon(event.action)}</span>
                    <span className="event-text">{event.text}</span>
                    {event.sub_type && (
                      <span className="event-subtype">{event.sub_type}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Estadísticas Avanzadas */}
            {matchStats && (
              <div className="advanced-stats">
                <h4>📈 ESTADÍSTICAS DETALLADAS</h4>
                <div className="stats-grid">
                  <div className="stat-category">
                    <h5>⚽ ATAQUE</h5>
                    <div className="stat-row">
                      <span>Disparos:</span>
                      <span>{matchStats.user.shots} - {matchStats.bot.shots}</span>
                    </div>
                    <div className="stat-row">
                      <span>Goles:</span>
                      <span>{matchStats.user.goals} - {matchStats.bot.goals}</span>
                    </div>
                    <div className="stat-row">
                      <span>Precisión:</span>
                      <span>{matchStats.user.shotAccuracy}% - {matchStats.bot.shotAccuracy}%</span>
                    </div>
                    <div className="stat-row">
                      <span>Centros:</span>
                      <span>{matchStats.user.crosses} - {matchStats.bot.crosses}</span>
                    </div>
                  </div>
                  
                  <div className="stat-category">
                    <h5>🛡️ DEFENSA</h5>
                    <div className="stat-row">
                      <span>Entradas:</span>
                      <span>{matchStats.user.tackles} - {matchStats.bot.tackles}</span>
                    </div>
                    <div className="stat-row">
                      <span>Faltas:</span>
                      <span>{matchStats.user.fouls} - {matchStats.bot.fouls}</span>
                    </div>
                    <div className="stat-row">
                      <span>Paradas:</span>
                      <span>{matchStats.user.saves} - {matchStats.bot.saves}</span>
                    </div>
                    <div className="stat-row">
                      <span>Esquinas:</span>
                      <span>{matchStats.user.corners} - {matchStats.bot.corners}</span>
                    </div>
                  </div>
                  
                  <div className="stat-category">
                    <h5>🎯 POSESIÓN</h5>
                    <div className="stat-row">
                      <span>Posesión:</span>
                      <div className="possession-bar-mini">
                        <div 
                          className="possession-fill user" 
                          style={{ width: `${matchStats.user.possession}%` }}
                        >
                          {matchStats.user.possession}%
                        </div>
                        <div 
                          className="possession-fill bot" 
                          style={{ width: `${matchStats.bot.possession}%` }}
                        >
                          {matchStats.bot.possession}%
                        </div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <span>Pases:</span>
                      <span>{matchStats.user.passes} - {matchStats.bot.passes}</span>
                    </div>
                    <div className="stat-row">
                      <span>Precisión pases:</span>
                      <span>{matchStats.user.passAccuracy}% - {matchStats.bot.passAccuracy}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-panel professional">
        <div className="panel-tabs professional">
          <button className={`tab-button professional ${activePanel === "bots" ? "active" : ""}`} onClick={() => setActivePanel("bots")}>
            🤖 ELEGIR OPONENTE
          </button>
          <button className={`tab-button professional ${activePanel === "history" ? "active" : ""}`} onClick={() => setActivePanel("history")}>
            📊 HISTORIAL
          </button>
          <button className={`tab-button ${activePanel === "results" ? "active" : ""}`} onClick={() => setActivePanel("results")}>
            📈 ESTADÍSTICAS & 🏆 RESULTADOS
          </button>
        </div>
        
        <div className="panel-content professional">
  {activePanel === "bots" ? (
    <div className="bots-grid professional">
      {bots?.map(bot => (
        <div key={bot.id} className="bot-card professional">
          <div className="bot-header professional">
            <div 
              className="bot-avatar professional" 
              style={{ 
                background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`,
                boxShadow: `0 0 20px ${getDifficultyColor(bot.difficulty)}50`
              }}
            >
              {getBotAvatar(bot.level)}
              <div className="bot-level">Lvl {bot.level}</div>
            </div>
            <div className="bot-info professional">
              <h4>{bot.name}</h4>
              <div className="bot-stats">
                <div className="stat-bar">
                  <span>Tiro: {bot.tiro}</span>
                  <div className="bar">
                    <div 
                      className="fill" 
                      style={{ width: `${bot.tiro}%` }}
                    ></div>
                  </div>
                </div>
                <div className="stat-bar">
                  <span>Velocidad: {bot.velocidad}</span>
                  <div className="bar">
                    <div 
                      className="fill" 
                      style={{ width: `${bot.velocidad}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bot-meta professional">
                <span className="level-badge professional">Nivel {bot.level}</span>
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
            <div className="btn-glow"></div>
          </button>
        </div>
      ))}
    </div>
  ) : activePanel === "history" ? (
    <div className="history-section professional">
      <h3>📊 HISTORIAL DE PARTIDOS</h3>
      {!matchHistory || matchHistory.length === 0 ? (
        <div className="no-history professional">
          <p>No hay partidas registradas.</p>
          <div className="empty-state">
            <div>⚽</div>
            <p>Juega tu primer partido para comenzar tu historial</p>
          </div>
        </div>
      ) : (
        <div className="history-list professional">
          {matchHistory.map((match) => (
            <div key={match.id} className="history-item professional">
              <div className="match-result professional">
                <span className={`result-badge professional ${getResultType(match, character?.id)}`}>
                  {getResultType(match, character?.id) === 'win' ? 'V' : 
                   getResultType(match, character?.id) === 'draw' ? 'E' : 'D'}
                </span>
                <span className="score professional">{match.player1_score} - {match.player2_score}</span>
                <span className="opponent-name">vs {match.opponent_name || 'RIVAL'}</span>
              </div>
              <div className="match-info professional">
                <span className="match-date">
                  {new Date(match.finished_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
                <span className="match-rewards">+{match.rewards_exp} EXP</span>
                <span className="match-duration">{match.duration || 90}'</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="results-section">
      <h3>ÚLTIMO RESULTADO</h3>
      {matchResult ? (
        <div className="match-result-panel">
          <div className="result-header">
            <div className="result-score-large">
              {matchResult.simulation.player1Score} - {matchResult.simulation.player2Score}
            </div>
            <div className={`result-type ${
              matchResult.simulation.winnerId === character.id ? 'win' : 
              matchResult.simulation.player1Score === matchResult.simulation.player2Score ? 'draw' : 'lose'
            }`}>
              {matchResult.simulation.winnerId === character.id ? 'VICTORIA' : 
               matchResult.simulation.player1Score === matchResult.simulation.player2Score ? 'EMPATE' : 'DERROTA'}
            </div>
          </div>
          
          <p className="result-opponent">vs {matchResult.botName}</p>
          
          <div className="performance-grid">
            <div className="performance-stat-panel">
              <div className="stat-label-panel">Disparos</div>
              <div className="stat-value-panel">{finalStats?.user?.shots || 0}</div>
            </div>
            <div className="performance-stat-panel">
              <div className="stat-label-panel">Goles</div>
              <div className="stat-value-panel">{finalStats?.user?.goals || 0}</div>
            </div>
            <div className="performance-stat-panel">
              <div className="stat-label-panel">Pases</div>
              <div className="stat-value-panel">{finalStats?.user?.passes || 0}</div>
            </div>
            <div className="performance-stat-panel">
              <div className="stat-label-panel">Entradas</div>
              <div className="stat-value-panel">{finalStats?.user?.tackles || 0}</div>
            </div>
          </div>
          
          <div className="rewards-panel">
            <h4>🏆 RECOMPENSAS</h4>
            <div className="reward-item-panel">
              <span>Experiencia:</span>
              <span className="reward-amount-panel">+{matchResult.rewards.exp} EXP</span>
            </div>
            <div className="reward-item-panel">
              <span>Lupicoins:</span>
              <span className="reward-amount-panel">+{matchResult.rewards.coins} 🪙</span>
            </div>
            
            {matchResult.leveledUp && (
              <div className="level-up-badge">
                🎉 ¡Subiste al nivel {matchResult.newLevel}!
              </div>
            )}
          </div>
          
          <button className="close-result-btn" onClick={onCloseResult}>
            CERRAR RESULTADO
          </button>
        </div>
      ) : (
        <div className="no-history">
          <p>No hay resultados recientes</p>
          <p>Juega un partido para ver tus estadísticas aquí</p>
        </div>
      )}
    </div>
  )}
</div>
          ) : null}
        </div>
      </div>
  );
};

export default TrainingDashboard;
