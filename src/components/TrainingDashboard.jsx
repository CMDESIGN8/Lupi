import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (simulating) {
      startMatchAnimation();
    } else {
      setMatchAnimation([]);
    }
  }, [simulating]);

  const startMatchAnimation = () => {
    const events = [];
    const eventTypes = ["⚽ Disparo!", "🎯 Pase preciso", "🛡️ Defensa", "🔥 Regate", "🚀 Tiro lejano"];
    
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        setMatchAnimation(prev => [...prev.slice(-3), randomEvent]);
      }, i * 800);
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

  return (
    <div className="training-dashboard">
      <div className="dashboard-header">
        <div className="header-main">
          <h1>🏟️ SALA DE ENTRENAMIENTO</h1>
          <p>Mejora tus habilidades enfrentándote a oponentes controlados por IA</p>
        </div>
        
        <div className="player-stats">
          <div className="stat-item">
            <span className="stat-label">Nivel</span>
            <span className="stat-value">{character.level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">EXP</span>
            <span className="stat-value">{character.experience || 0}/{character.experience_to_next_level || 100}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Puntos</span>
            <span className="stat-value">{character.available_skill_points || 0}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* PANEL CENTRAL - CAMPO DE JUEGO */}
        <div className="central-panel">
          <div className="field-container">
            <div className="soccer-field">
              <div className="field-grass">
                <div className="center-circle"></div>
                <div className="center-spot"></div>
                
                {/* Jugador */}
                <div className="player player-user">
                  <div className="player-icon">👤</div>
                  <div className="player-name">{character.nickname}</div>
                </div>
                
                {/* Bot */}
                <div className="player player-bot">
                  <div className="player-icon">
                    {selectedBot ? getBotAvatar(selectedBot.level) : "🤖"}
                  </div>
                  <div className="player-name">
                    {selectedBot?.name || "RIVAL"}
                  </div>
                </div>

                {/* Animación del balón */}
                {simulating && (
                  <div className="soccer-ball">⚽</div>
                )}

                {/* Eventos de la animación */}
                <div className="match-events">
                  {matchAnimation.map((event, index) => (
                    <div key={index} className="match-event">
                      {event}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Estado del partido */}
            <div className="match-status">
              {simulating ? (
                <div className="simulation-in-progress">
                  <div className="pulse-animation"></div>
                  <h3>PARTIDA EN CURSO...</h3>
                  <p>vs {selectedBot?.name}</p>
                </div>
              ) : (
                <div className="waiting-for-match">
                  <h3>⚽ LISTO PARA ENTRENAR</h3>
                  <p>Selecciona un oponente del panel lateral</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL LATERAL DERECHO */}
        <div className="side-panel">
          <div className="panel-tabs">
            <button 
              className={`tab-button ${activePanel === "bots" ? "active" : ""}`}
              onClick={() => setActivePanel("bots")}
            >
              🤖 OPONENTES
            </button>
            <button 
              className={`tab-button ${activePanel === "history" ? "active" : ""}`}
              onClick={() => setActivePanel("history")}
            >
              📊 HISTORIAL
            </button>
          </div>

          <div className="panel-content">
            {activePanel === "bots" ? (
              <div className="bots-list">
                <h3>ELIGE TU RIVAL</h3>
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
                        <span>Pase:</span>
                        <span>{bot.pase}</span>
                      </div>
                      <div className="stat-row">
                        <span>Tiro:</span>
                        <span>{bot.tiro}</span>
                      </div>
                      <div className="stat-row">
                        <span>Defensa:</span>
                        <span>{bot.defensa}</span>
                      </div>
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
                      {loading && selectedBot?.id === bot.id ? " DESAFIANDO..." : " DESAFIAR"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="history-panel">
                <h3>ÚLTIMOS PARTIDOS</h3>
                {matchHistory.length === 0 ? (
                  <div className="no-history">
                    <p>No hay partidas jugadas todavía</p>
                    <p>¡Enfréntate a un bot para comenzar!</p>
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
