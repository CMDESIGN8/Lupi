import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/TrainingDashboard.css";

const SimulationControls = ({ speed, setSpeed }) => (
  <div className="simulation-controls">
    <button onClick={() => setSpeed(1500)} title="Velocidad Lenta" className={speed === 1500 ? 'active' : ''}>🐢</button>
    <button onClick={() => setSpeed(800)} title="Velocidad Normal" className={speed === 800 ? 'active' : ''}>▶️</button>
    <button onClick={() => setSpeed(300)} title="Velocidad Rápida" className={speed === 300 ? 'active' : ''}>⏩</button>
  </div>
);

const TrainingDashboard = ({ character, bots, matchHistory, loading, simulating, selectedBot, onStartMatch, onMatchFinish }) => {
  const [activePanel, setActivePanel] = useState("bots");

  // ✅ CORRECCIÓN: Estado de simulación simplificado
  const [simulationState, setSimulationState] = useState({
    isActive: false,
    matchTime: 0,
    speed: 800,
    possession: 'neutral',
    ballZone: 'center',
  });

  const [matchStats, setMatchStats] = useState(null);
  const [matchEvents, setMatchEvents] = useState([]);
  const simulationIntervalRef = useRef(null);

  // ✅ CORRECCIÓN: stopSimulation mejorada
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setSimulationState(prev => ({ ...prev, isActive: false }));
  }, []);

  // ✅ CORRECCIÓN: generateMatchEvent sin dependencias problemáticas
  const generateMatchEvent = useCallback((currentPossession, currentTime) => {
    if (!character || !selectedBot) return null;

    const attackerName = currentPossession === 'user' ? character.nickname : selectedBot.name;
    const defenderName = currentPossession === 'user' ? selectedBot.name : character.nickname;
    
    let text, intensity, zone, stat_type;
    const random = Math.random();

    const attacker = currentPossession === 'user' ? character : selectedBot;
    const defender = currentPossession === 'user' ? selectedBot : character;

    if (random < 0.65) {
      text = `${attackerName} mueve el balón en el mediocampo.`;
      intensity = 'low';
      zone = 'center';
      stat_type = 'passes';
    } else if (random < 0.85) {
      text = `¡Buena recuperación de ${defenderName} en defensa!`;
      intensity = 'medium';
      zone = 'center';
      stat_type = 'tackles';
      // Cambio de posesión
      currentPossession = currentPossession === 'user' ? 'bot' : 'user';
    } else {
      zone = currentPossession === 'user' ? 'bot_defense' : 'user_defense';
      stat_type = 'shots';
      
      const goalProbability = (attacker.tiro + attacker.potencia) / ((attacker.tiro + attacker.potencia) + (defender.defensa + defender.velocidad) * 1.5);
      
      if (Math.random() < goalProbability) {
        text = `¡¡¡GOOOOL DE ${attackerName}!!! ¡Define con clase ante el portero!`;
        intensity = 'very-high';
        stat_type = 'goals';
      } else {
        text = `¡OCASIÓN PARA ${attackerName}! Su disparo es detenido por el portero.`;
        intensity = 'high';
      }
    }

    return { 
      id: Date.now() + currentTime, 
      time: `${currentTime}'`, 
      text, 
      intensity, 
      zone, 
      stat_type, 
      team: currentPossession 
    };
  }, [character, selectedBot]);

  // ✅ CORRECCIÓN: simulateMinute simplificada
  const simulateMinute = useCallback((currentTime) => {
    if (!character || !selectedBot) return;

    // Determinar posesión basada en ratings
    const userRating = (character.tiro + character.potencia + character.defensa + character.velocidad);
    const botRating = (selectedBot.tiro + selectedBot.potencia + selectedBot.defensa + selectedBot.velocidad);
    const initiativeChance = userRating / (userRating + botRating);
    const hasUserInitiative = Math.random() < initiativeChance;
    const currentPossession = hasUserInitiative ? 'user' : 'bot';

    // Generar evento
    const event = generateMatchEvent(currentPossession, currentTime);
    if (!event) return;

    // Actualizar estado de simulación
    setSimulationState(prev => ({ 
      ...prev, 
      possession: currentPossession, 
      ballZone: event.zone 
    }));

    // Actualizar eventos
    setMatchEvents(prev => [event, ...prev.slice(0, 14)]);

    // Actualizar estadísticas
    setMatchStats(prev => {
      if (!prev) return prev;
      
      const newStats = JSON.parse(JSON.stringify(prev));
      
      // Incrementar estadística del evento
      if (event.stat_type) {
        newStats[event.team][event.stat_type]++;
      }
      
      // Calcular posesión
      const totalMinutes = currentTime;
      const userPossessionMinutes = (prev.user.possession / 100) * (totalMinutes - 1) + (event.team === 'user' ? 1 : 0);
      newStats.user.possession = Math.round((userPossessionMinutes / totalMinutes) * 100);
      newStats.bot.possession = 100 - newStats.user.possession;

      return newStats;
    });
  }, [character, selectedBot, generateMatchEvent]);

  // ✅ CORRECCIÓN PRINCIPAL: useEffect simplificado y sin dependencias problemáticas
  useEffect(() => {
    // Iniciar simulación
    if (simulating && selectedBot && character && !simulationState.isActive) {
      console.log("🚀 INICIANDO SIMULACIÓN");
      
      // Reiniciar estados
      setMatchEvents([]);
      setMatchStats({
        user: { shots: 0, goals: 0, passes: 0, tackles: 0, possession: 50, name: character.nickname },
        bot: { shots: 0, goals: 0, passes: 0, tackles: 0, possession: 50, name: selectedBot.name }
      });
      
      setSimulationState(prev => ({ 
        ...prev, 
        isActive: true, 
        matchTime: 0, 
        possession: 'neutral', 
        ballZone: 'center' 
      }));

      // Configurar intervalo de simulación
      simulationIntervalRef.current = setInterval(() => {
        setSimulationState(prev => {
          const newTime = prev.matchTime + 1;
          
          // Finalizar partido a los 90 minutos
          if (newTime >= 10) { // Cambiado a 10 para pruebas, luego poner 90
            console.log("🏁 FINALIZANDO PARTIDO");
            clearInterval(simulationIntervalRef.current);
            
            // Obtener estadísticas finales y llamar callback
            setMatchStats(currentStats => {
              if (onMatchFinish && currentStats) {
                setTimeout(() => onMatchFinish(currentStats), 100);
              }
              return currentStats;
            });
            
            return { ...prev, isActive: false };
          }
          
          // Simular minuto actual
          simulateMinute(newTime);
          return { ...prev, matchTime: newTime };
        });
      }, simulationState.speed);
    }

    // Cleanup
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [simulating, selectedBot, character]); // ✅ Solo dependencias esenciales

  // ✅ CORRECCIÓN: Efecto separado para cambios de velocidad
  useEffect(() => {
    if (simulationState.isActive && simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      
      simulationIntervalRef.current = setInterval(() => {
        setSimulationState(prev => {
          const newTime = prev.matchTime + 1;
          
          if (newTime >= 10) { // Cambiado a 10 para pruebas
            clearInterval(simulationIntervalRef.current);
            setMatchStats(currentStats => {
              if (onMatchFinish && currentStats) {
                setTimeout(() => onMatchFinish(currentStats), 100);
              }
              return currentStats;
            });
            return { ...prev, isActive: false };
          }
          
          simulateMinute(newTime);
          return { ...prev, matchTime: newTime };
        });
      }, simulationState.speed);
    }
  }, [simulationState.speed]);

  const getBallPosition = () => {
    const { ballZone, isActive } = simulationState;
    let x = 50, y = 50;
    
    if (!isActive) return { x, y };
    
    const randomY = 30 + Math.random() * 40;
    if (ballZone === 'center') x = 40 + Math.random() * 20;
    else if (ballZone === 'user_defense') x = 10 + Math.random() * 25;
    else if (ballZone === 'bot_defense') x = 65 + Math.random() * 25;
    
    return { x, y: randomY };
  };

  const ballPosition = getBallPosition();
  const getDifficultyColor = useCallback((difficulty) => ({ easy: '#4cc9f0', medium: '#4361ee', hard: '#7209b7' }[difficulty] || '#00bbf9'), []);
  const getDifficultyText = useCallback((difficulty) => ({ easy: 'FÁCIL', medium: 'MEDIO', hard: 'DIFÍCIL' }[difficulty] || difficulty.toUpperCase()), []);
  const getBotAvatar = useCallback((botLevel) => { 
    if (botLevel <= 2) return "🥅"; 
    if (botLevel <= 4) return "⚽"; 
    if (botLevel <= 6) return "👟"; 
    if (botLevel <= 8) return "🔥"; 
    return "🏆"; 
  }, []);
  
  const getResultType = useCallback((match, characterId) => { 
    if (match.winner_id === characterId) return 'win'; 
    if (match.player1_score === match.player2_score) return 'draw'; 
    return 'lose'; 
  }, []);

  return (
    <div className="training-dashboard">
      <div className="main-layout">
        <div className="left-panel">
          <div className="soccer-field">
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
                  <div className="player player-user" style={{ left: '25%', top: '30%' }}>
                    <div className="player-icon">👤</div>
                    <div className="player-name">{character?.nickname || "JUGADOR"}</div>
                  </div>
                  <div className="player player-bot" style={{ left: '75%', top: '60%' }}>
                    <div className="player-icon">{getBotAvatar(selectedBot.level)}</div>
                    <div className="player-name">{selectedBot?.name || "RIVAL"}</div>
                  </div>
                  <div className="soccer-ball" style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}>⚽</div>
                </>
              )}
              
              {!simulating && (
                <div className="field-message">
                  <h3>⚽ SIMULADOR TÁCTICO</h3>
                  <p>Selecciona un oponente para iniciar la simulación.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="match-commentary">
            <div className="commentary-header">
              <h3>📻 EN VIVO</h3>
              <SimulationControls 
                speed={simulationState.speed} 
                setSpeed={(s) => setSimulationState(prev => ({ ...prev, speed: s }))} 
              />
              <div className="match-time">
                {simulationState.isActive ? `${simulationState.matchTime}'` : "PRE-PARTIDO"}
              </div>
            </div>
            <div className="commentary-feed">
              {matchEvents.length === 0 ? (
                <div className="no-commentary">
                  <p>Esperando el inicio del partido...</p>
                </div>
              ) : (
                matchEvents.map((event) => (
                  <div key={event.id} className={`commentary-event ${event.intensity} ${event.team}`}>
                    <div className="event-time">{event.time}</div>
                    <div className="event-text">{event.text}</div>
                  </div>
                ))
              )}
            </div>
            {matchStats && (
              <div className="live-stats">
                <h4>📊 ESTADÍSTICAS</h4>
                <div className="stats-overview">
                  <div className="stat-row">
                    <span>Posesión:</span>
                    <div className="possession-bar">
                      <div className="possession-fill user" style={{ width: `${matchStats.user.possession}%` }}>
                        {matchStats.user.possession}%
                      </div>
                      <div className="possession-fill bot" style={{ width: `${matchStats.bot.possession}%` }}>
                        {matchStats.bot.possession}%
                      </div>
                    </div>
                  </div>
                  <div className="stat-row">
                    <span>Disparos:</span>
                    <span>{matchStats.user.shots} - {matchStats.bot.shots}</span>
                  </div>
                  <div className="stat-row">
                    <span>Goles:</span>
                    <span>{matchStats.user.goals} - {matchStats.bot.goals}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-panel">
        <div className="panel-tabs">
          <button className={`tab-button ${activePanel === "bots" ? "active" : ""}`} onClick={() => setActivePanel("bots")}>
            🤖 ELEGIR OPONENTE
          </button>
          <button className={`tab-button ${activePanel === "history" ? "active" : ""}`} onClick={() => setActivePanel("history")}>
            📊 HISTORIAL
          </button>
        </div>
        <div className="panel-content">
          {activePanel === "bots" ? (
            <div className="bots-grid">
              {bots?.map(bot => (
                <div key={bot.id} className="bot-card">
                  <div className="bot-header">
                    <div className="bot-avatar" style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)` }}>
                      {getBotAvatar(bot.level)}
                    </div>
                    <div className="bot-info">
                      <h4>{bot.name}</h4>
                      <div className="bot-meta">
                        <span className="level-badge">Nivel {bot.level}</span>
                        <span className="difficulty-badge" style={{ color: getDifficultyColor(bot.difficulty) }}>
                          {getDifficultyText(bot.difficulty)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className={`play-btn ${bot.difficulty}`} 
                    onClick={() => onStartMatch(bot)} 
                    disabled={loading || simulating}
                    style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)` }}
                  >
                    {loading && selectedBot?.id === bot.id ? "🔄 INICIANDO..." : "⚔️ JUGAR"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-section">
              <h3>ÚLTIMOS PARTIDOS</h3>
              {!matchHistory || matchHistory.length === 0 ? (
                <div className="no-history"><p>No hay partidas registradas.</p></div>
              ) : (
                <div className="history-list">
                  {matchHistory.map((match) => (
                    <div key={match.id} className="history-item">
                      <div className="match-result">
                        <span className={`result-badge ${getResultType(match, character?.id)}`}>
                          {getResultType(match, character?.id).charAt(0).toUpperCase()}
                        </span>
                        <span className="score">{match.player1_score} - {match.player2_score}</span>
                      </div>
                      <div className="match-info">
                        <span className="match-date">
                          {new Date(match.finished_at).toLocaleDateString('es-ES')}
                        </span>
                        <span className="match-rewards">+{match.rewards_exp} EXP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboard;
