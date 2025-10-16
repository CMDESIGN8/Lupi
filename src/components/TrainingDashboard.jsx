import React, { useState, useEffect, useRef } from "react";
import "../styles/TrainingDashboard.css";

const TrainingDashboard = ({ 
  character, 
  bots, 
  matchHistory, 
  loading, 
  simulating, 
  selectedBot, 
  onStartMatch 
}) => {
  const [activePanel, setActivePanel] = useState("bots");
  const [matchAnimation, setMatchAnimation] = useState([]);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [matchStats, setMatchStats] = useState({
    shots: 0,
    passes: 0,
    tackles: 0,
    dribbles: 0,
    goals: 0,
    saves: 0
  });
  const [playerPositions, setPlayerPositions] = useState({
    user: { x: 20, y: 30 },
    bot: { x: 80, y: 30 }
  });
  const animationRef = useRef(null);

  useEffect(() => {
    if (simulating) {
      startMatchAnimation();
    } else {
      resetAnimations();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulating]);

  const resetAnimations = () => {
    setMatchAnimation([]);
    setBallPosition({ x: 50, y: 50 });
    setPlayerPositions({
      user: { x: 20, y: 30 },
      bot: { x: 80, y: 30 }
    });
    setMatchStats({
      shots: 0,
      passes: 0,
      tackles: 0,
      dribbles: 0,
      goals: 0,
      saves: 0
    });
  };

  const startMatchAnimation = () => {
    const events = [];
    let currentTime = 0;
    const totalTime = 8000; // 8 segundos de animación
    
    // Configurar animación del balón
    animateBall();
    
    // Generar eventos de partido
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const event = generateMatchEvent();
        events.push(event);
        setMatchAnimation(prev => [...prev.slice(-4), event]);
        
        // Actualizar estadísticas basado en el evento
        updateMatchStats(event.type);
        
        // Mover jugadores durante eventos específicos
        if (event.type === 'shot' || event.type === 'dribble') {
          movePlayersForEvent(event.type);
        }
      }, i * 650);
    }
  };

  const animateBall = () => {
    const startTime = Date.now();
    const duration = 8000;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        // Movimiento más realista del balón en forma de 8
        const x = 50 + 30 * Math.sin(progress * Math.PI * 2);
        const y = 50 + 20 * Math.sin(progress * Math.PI * 4);
        
        setBallPosition({ x, y });
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const generateMatchEvent = () => {
    const events = [
      { 
        type: 'shot', 
        text: '🚀 ¡Disparo potente!', 
        emoji: '⚽',
        intensity: 'high'
      },
      { 
        type: 'pass', 
        text: '🎯 Pase preciso al compañero', 
        emoji: '🔄',
        intensity: 'medium'
      },
      { 
        type: 'tackle', 
        text: '🛡️ Entrada limpia', 
        emoji: '💥',
        intensity: 'high'
      },
      { 
        type: 'dribble', 
        text: '🔥 Regate magistral', 
        emoji: '👟',
        intensity: 'medium'
      },
      { 
        type: 'save', 
        text: '✋ ¡Parada del portero!', 
        emoji: '🥅',
        intensity: 'high'
      },
      { 
        type: 'cross', 
        text: '📨 Centro al área', 
        emoji: '↗️',
        intensity: 'medium'
      },
      { 
        type: 'freekick', 
        text: '🎯 Tiro libre directo', 
        emoji: '📍',
        intensity: 'high'
      },
      { 
        type: 'corner', 
        text: '🔄 Saque de esquina', 
        emoji: '↩️',
        intensity: 'medium'
      }
    ];
    
    return events[Math.floor(Math.random() * events.length)];
  };

  const updateMatchStats = (eventType) => {
    setMatchStats(prev => ({
      shots: eventType === 'shot' ? prev.shots + 1 : prev.shots,
      passes: eventType === 'pass' ? prev.passes + 1 : prev.passes,
      tackles: eventType === 'tackle' ? prev.tackles + 1 : prev.tackles,
      dribbles: eventType === 'dribble' ? prev.dribbles + 1 : prev.dribbles,
      goals: eventType === 'goal' ? prev.goals + 1 : prev.goals,
      saves: eventType === 'save' ? prev.saves + 1 : prev.saves
    }));
  };

  const movePlayersForEvent = (eventType) => {
    if (eventType === 'shot') {
      // Movimiento de ataque
      setPlayerPositions(prev => ({
        user: { x: 40, y: 20 },
        bot: { x: 60, y: 70 }
      }));
      
      // Volver a posición después de un tiempo
      setTimeout(() => {
        setPlayerPositions({
          user: { x: 20, y: 30 },
          bot: { x: 80, y: 30 }
        });
      }, 1000);
    } else if (eventType === 'dribble') {
      // Movimiento de regate
      setPlayerPositions(prev => ({
        user: { x: 35, y: 40 },
        bot: { x: 65, y: 40 }
      }));
      
      setTimeout(() => {
        setPlayerPositions({
          user: { x: 20, y: 30 },
          bot: { x: 80, y: 30 }
        });
      }, 800);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4cc9f0';
      case 'medium': return '#4361ee';
      case 'hard': return '#7209b7';
      default: return '#00bbf9';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'FÁCIL';
      case 'medium': return 'MEDIO';
      case 'hard': return 'DIFÍCIL';
      default: return difficulty.toUpperCase();
    }
  };

  const getBotAvatar = (botLevel) => {
    if (botLevel <= 2) return "🥅";
    if (botLevel <= 4) return "⚽";
    if (botLevel <= 6) return "👟";
    if (botLevel <= 8) return "🔥";
    return "🏆";
  };

  const getResultType = (match, characterId) => {
    if (match.winner_id === characterId) return 'win';
    if (match.player1_score === match.player2_score) return 'draw';
    return 'lose';
  };

  const calculatePlayerRating = () => {
    const totalActions = matchStats.shots + matchStats.passes + matchStats.tackles + matchStats.dribbles;
    if (totalActions === 0) return 6.0;
    
    const effectiveness = (matchStats.passes * 0.3 + matchStats.tackles * 0.4 + matchStats.dribbles * 0.3) / totalActions;
    return Math.min(10, 6 + effectiveness * 4).toFixed(1);
  };

  return (
    <div className="training-dashboard">
      <div className="dashboard-header">
        <div className="header-main">
          <h1>🏟️ SALA DE ENTRENAMIENTO PRO</h1>
          <p>Sistema de simulación avanzada con estadísticas en tiempo real</p>
        </div>
        
        <div className="player-stats">
          <div className="stat-item">
            <span className="stat-label">Nivel</span>
            <span className="stat-value">{character.level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rating</span>
            <span className="stat-value">{calculatePlayerRating()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Partidos</span>
            <span className="stat-value">{matchHistory.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* PANEL CENTRAL - CAMPO DE JUEGO MEJORADO */}
        <div className="central-panel">
          <div className="field-container">
            <div className="soccer-field">
              <div className="field-grass">
                <div className="center-circle"></div>
                <div className="center-spot"></div>
                <div className="penalty-area left"></div>
                <div className="penalty-area right"></div>
                <div className="goal left"></div>
                <div className="goal right"></div>
                
                {/* Jugador con posición dinámica */}
                <div 
                  className="player player-user"
                  style={{
                    left: `${playerPositions.user.x}%`,
                    top: `${playerPositions.user.y}%`
                  }}
                >
                  <div className="player-icon">👤</div>
                  <div className="player-name">{character.nickname}</div>
                  <div className="player-rating">{calculatePlayerRating()}</div>
                </div>
                
                {/* Bot con posición dinámica */}
                <div 
                  className="player player-bot"
                  style={{
                    left: `${playerPositions.bot.x}%`,
                    top: `${playerPositions.bot.y}%`
                  }}
                >
                  <div className="player-icon">
                    {selectedBot ? getBotAvatar(selectedBot.level) : "🤖"}
                  </div>
                  <div className="player-name">
                    {selectedBot?.name || "RIVAL"}
                  </div>
                </div>

                {/* Balón con animación mejorada */}
                {simulating && (
                  <div 
                    className="soccer-ball"
                    style={{
                      left: `${ballPosition.x}%`,
                      top: `${ballPosition.y}%`
                    }}
                  >
                    ⚽
                  </div>
                )}

                {/* Eventos de la animación mejorados */}
                <div className="match-events">
                  {matchAnimation.map((event, index) => (
                    <div 
                      key={index} 
                      className={`match-event ${event.intensity}`}
                    >
                      <span className="event-emoji">{event.emoji}</span>
                      <span className="event-text">{event.text}</span>
                    </div>
                  ))}
                </div>

                {/* Efectos visuales */}
                {simulating && (
                  <>
                    <div className="field-effect shot-effect"></div>
                    <div className="field-effect dribble-effect"></div>
                  </>
                )}
              </div>
            </div>

            {/* Panel de estadísticas en tiempo real */}
            <div className="live-stats-panel">
              <h4>📊 ESTADÍSTICAS EN VIVO</h4>
              <div className="stats-grid">
                <div className="live-stat">
                  <span className="stat-icon">🚀</span>
                  <span className="stat-name">Disparos</span>
                  <span className="stat-value">{matchStats.shots}</span>
                </div>
                <div className="live-stat">
                  <span className="stat-icon">🎯</span>
                  <span className="stat-name">Pases</span>
                  <span className="stat-value">{matchStats.passes}</span>
                </div>
                <div className="live-stat">
                  <span className="stat-icon">🛡️</span>
                  <span className="stat-name">Entradas</span>
                  <span className="stat-value">{matchStats.tackles}</span>
                </div>
                <div className="live-stat">
                  <span className="stat-icon">🔥</span>
                  <span className="stat-name">Regates</span>
                  <span className="stat-value">{matchStats.dribbles}</span>
                </div>
                <div className="live-stat">
                  <span className="stat-icon">🥅</span>
                  <span className="stat-name">Paradas</span>
                  <span className="stat-value">{matchStats.saves}</span>
                </div>
                <div className="live-stat rating">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-name">Rating</span>
                  <span className="stat-value">{calculatePlayerRating()}</span>
                </div>
              </div>
            </div>

            {/* Estado del partido */}
            <div className="match-status">
              {simulating ? (
                <div className="simulation-in-progress">
                  <div className="pulse-animation"></div>
                  <h3>PARTIDA EN CURSO - SIMULACIÓN AVANZADA</h3>
                  <p>vs {selectedBot?.name} | Sistema Pro v2.1</p>
                </div>
              ) : (
                <div className="waiting-for-match">
                  <h3>⚽ SISTEMA DE ENTRENAMIENTO PRO</h3>
                  <p>Selecciona un oponente para iniciar simulación con estadísticas avanzadas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL LATERAL DERECHO (se mantiene igual pero con mejoras visuales) */}
        <div className="side-panel">
          <div className="panel-tabs">
            <button 
              className={`tab-button ${activePanel === "bots" ? "active" : ""}`}
              onClick={() => setActivePanel("bots")}
            >
              🤖 OPONENTES IA
            </button>
            <button 
              className={`tab-button ${activePanel === "history" ? "active" : ""}`}
              onClick={() => setActivePanel("history")}
            >
              📊 HISTORIAL PRO
            </button>
          </div>

          <div className="panel-content">
            {activePanel === "bots" ? (
              <div className="bots-list">
                <h3>SELECCIONA RIVAL IA</h3>
                {bots.map(bot => (
                  <div key={bot.id} className="bot-card-side">
                    <div className="bot-header-side">
                      <div 
                        className="bot-avatar-side"
                        style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)` }}
                      >
                        {getBotAvatar(bot.level)}
                      </div>
                      <div className="bot-info-side">
                        <h4>{bot.name}</h4>
                        <div className="bot-meta-side">
                          <span className="level-badge">Nvl {bot.level}</span>
                          <span 
                            className="difficulty-badge"
                            style={{ color: getDifficultyColor(bot.difficulty) }}
                          >
                            {getDifficultyText(bot.difficulty)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bot-stats-side">
                      <div className="stat-row">
                        <span>ATAQUE:</span>
                        <span>{Math.round((bot.tiro + bot.potencia) / 2)}</span>
                      </div>
                      <div className="stat-row">
                        <span>DEFENSA:</span>
                        <span>{Math.round((bot.defensa + bot.velocidad) / 2)}</span>
                      </div>
                      <div className="stat-row">
                        <span>TÉCNICA:</span>
                        <span>{Math.round((bot.pase + bot.regate) / 2)}</span>
                      </div>
                    </div>

                    <div className="ai-indicator">
                      <span>🤖 IA AVANZADA</span>
                    </div>

                    <button
                      className={`challenge-btn ${bot.difficulty}`}
                      onClick={() => onStartMatch(bot)}
                      disabled={loading || simulating}
                      style={{ 
                        background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`
                      }}
                    >
                      {loading && selectedBot?.id === bot.id ? "🔄" : "⚔️"} 
                      {loading && selectedBot?.id === bot.id ? " INICIANDO SIM..." : " SIMULAR PARTIDA"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="history-panel">
                <h3>HISTORIAL DETALLADO</h3>
                {matchHistory.length === 0 ? (
                  <div className="no-history">
                    <p>No hay partidas registradas</p>
                    <p>¡Comienza un entrenamiento!</p>
                  </div>
                ) : (
                  <div className="history-list-side">
                    {matchHistory.map((match) => (
                      <div key={match.id} className="history-item-side">
                        <div className="match-result-side">
                          <span className={`result-badge-side ${getResultType(match, character.id)}`}>
                            {match.winner_id === character.id ? 'V' : 
                             match.player1_score === match.player2_score ? 'E' : 'D'}
                          </span>
                          <span className="score-side">
                            {match.player1_score} - {match.player2_score}
                          </span>
                        </div>
                        <div className="match-info-side">
                          <span className="match-date">
                            {new Date(match.finished_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                          <span className="match-rewards-side">
                            +{match.rewards_exp} EXP
                          </span>
                          <span className="match-duration">
                            ⏱️ 5'
                          </span>
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
    </div>
  );
};

export default TrainingDashboard;
