import React, { useState, useEffect } from "react";
import "../styles/BotMatchmaking.css";

const BotMatchmaking = ({ character, onMatchUpdate }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [activePanel, setActivePanel] = useState("bots"); // "bots" o "history"
  const [matchResult, setMatchResult] = useState(null);
  const [matchAnimation, setMatchAnimation] = useState([]);

  useEffect(() => {
    fetchBots();
    if (character) {
      fetchMatchHistory();
    }
  }, [character]);

  // Efecto para cerrar automáticamente el resultado
  useEffect(() => {
    if (matchResult) {
      const timer = setTimeout(() => {
        closeResult();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [matchResult]);

  // Animación de partido en tiempo real
  useEffect(() => {
    if (simulating) {
      startMatchAnimation();
    }
  }, [simulating]);

  const fetchMatchHistory = async () => {
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots/history/${character.id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setMatchHistory(data.matches || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
      setMatchHistory([]);
    }
  };

  const fetchBots = async () => {
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots`);
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error("Error cargando bots:", error);
    }
  };

  const startMatchAnimation = () => {
    const events = [];
    const eventTypes = ["⚽ Disparo!", "🎯 Pase preciso", "🛡️ Defensa", "🔥 Regate", "🚀 Tiro lejano", "⭐ Jugada maestra"];
    
    // Generar eventos de animación
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        setMatchAnimation(prev => [...prev.slice(-4), randomEvent]); // Mantener solo los últimos 4 eventos
      }, i * 600);
    }
  };

  const startBotMatch = async (bot) => {
    if (!character) return;
    
    setLoading(true);
    setSelectedBot(bot);
    setMatchAnimation([]);
    
    try {
      const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, botId: bot.id }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok) {
        alert(matchData.error || "Error al iniciar partida");
        return;
      }

      if (!matchData.match?.id) {
        alert("No se pudo obtener el ID de la partida");
        return;
      }

      await simulateMatch(matchData.match.id, bot);
      
    } catch (error) {
      console.error("Error en partida contra bot:", error);
      alert("Error al jugar contra bot");
    } finally {
      setLoading(false);
      setSelectedBot(null);
    }
  };

  const simulateMatch = async (matchId, bot) => {
    setSimulating(true);
    
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots/${matchId}/simulate`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        setMatchResult({
          ...data,
          botName: bot.name
        });
        fetchMatchHistory();
        if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 1000);
      } else {
        alert(data.error || "Error al simular partida");
      }
    } catch (error) {
      console.error("Error simulando partida:", error);
      alert("Error al simular partida");
    } finally {
      setSimulating(false);
      setMatchAnimation([]);
    }
  };

  const closeResult = () => {
    setMatchResult(null);
  };

  const getResultType = (simulation, characterId) => {
    if (simulation.winnerId === characterId) return 'win';
    if (simulation.player1Score === simulation.player2Score) return 'draw';
    return 'lose';
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

  return (
    <div className="training-dashboard">
      {/* Overlay de resultado */}
      {matchResult && (
        <div className="match-result-overlay">
          <div className={`match-result-card ${getResultType(matchResult.simulation, character.id)}`}>
            <div className="result-icon">
              {matchResult.simulation.winnerId === character.id ? '🎉' : 
               matchResult.simulation.player1Score === matchResult.simulation.player2Score ? '🤝' : '😞'}
            </div>
            <h2 className="result-title">
              {matchResult.simulation.winnerId === character.id ? '¡VICTORIA!' : 
               matchResult.simulation.player1Score === matchResult.simulation.player2Score ? 'EMPATE' : 'DERROTA'}
            </h2>
            <div className={`result-score ${getResultType(matchResult.simulation, character.id)}`}>
              {matchResult.simulation.player1Score} - {matchResult.simulation.player2Score}
            </div>
            <p className="result-opponent">vs {matchResult.botName}</p>
            
            <div className="rewards-display">
              <h4>Recompensas Obtenidas:</h4>
              <div className="reward-item">
                <span>Experiencia:</span>
                <span className="reward-amount">+{matchResult.rewards.exp} EXP</span>
              </div>
              <div className="reward-item">
                <span>Lupicoins:</span>
                <span className="reward-amount">+{matchResult.rewards.coins} 🪙</span>
              </div>
              
              {matchResult.leveledUp && (
                <div className="level-up-badge">
                  🎉 ¡Subiste al nivel {matchResult.newLevel}! +{matchResult.levelsGained * 2} puntos de habilidad
                </div>
              )}
            </div>

            <div className="auto-close-timer">
              ⏱️ Se cerrará en 5 segundos...
            </div>

            <button className="close-result-btn" onClick={closeResult}>
              CERRAR AHORA
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-main">
          <h1>🏟️ SALA DE ENTRENAMIENTO</h1>
          <p>Mejora tus habilidades enfrentándote a oponentes controlados por IA</p>
        </div>
        
        <div className="player-stats">
          {character && (
            <>
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
            </>
          )}
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
                  <div className="player-name">{character?.nickname || "TÚ"}</div>
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
                    <div key={index} className="match-event fade-in">
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
                      onClick={() => startBotMatch(bot)}
                      disabled={loading || simulating || !character}
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
                          <span className={`result-badge-side ${getResultType(
                            {winnerId: match.winner_id, player1Score: match.player1_score, player2Score: match.player2_score}, 
                            character.id
                          )}`}>
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

      {!character && (
        <div className="no-character-overlay">
          <div className="no-character-message">
            <h3>⚠️ PERSONAJE REQUERIDO</h3>
            <p>Necesitas crear un personaje para acceder a la sala de entrenamiento</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotMatchmaking;
