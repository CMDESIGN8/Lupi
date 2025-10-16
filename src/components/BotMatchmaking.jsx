import React, { useState, useEffect } from "react";

const BotMatchmaking = ({ character, onMatchUpdate }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots`);
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error("Error cargando bots:", error);
    }
  };

  const startBotMatch = async (bot) => {
    if (!character) return;
    
    setLoading(true);
    setSelectedBot(bot);
    
    try {
      // 1. Iniciar partida
      const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          characterId: character.id, 
          botId: bot.id 
        }),
      });

      const matchData = await matchResponse.json();
      
      if (!matchResponse.ok) {
        alert(matchData.error);
        return;
      }

      // 2. Simular partida inmediatamente
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
        // Mostrar resultado
        setTimeout(() => {
          if (data.simulation.winnerId === character.id) {
            alert(`🎉 ¡GANASTE! ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`);
          } else if (data.simulation.player1Score === data.simulation.player2Score) {
            alert(`🤝 EMPATE ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`);
          } else {
            alert(`😞 Perdiste ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`);
          }
        }, 500);
        
        // Actualizar datos del personaje
        if (onMatchUpdate) {
          setTimeout(() => {
            onMatchUpdate();
          }, 1000);
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error simulando partida:", error);
      alert("Error al simular partida");
    } finally {
      setSimulating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4cc9f0'; // Cyan
      case 'medium': return '#4361ee'; // Azul
      case 'hard': return '#7209b7'; // Violeta
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

  const getWinProbability = (playerStats, botStats) => {
    const playerAvg = (playerStats.pase + playerStats.tiro + playerStats.regate + playerStats.velocidad + playerStats.defensa + playerStats.potencia) / 6;
    const botAvg = (botStats.pase + botStats.tiro + botStats.regate + botStats.velocidad + botStats.defensa + botStats.potencia) / 6;
    
    const levelDiff = playerStats.level - botStats.level;
    const advantage = (playerAvg - botAvg) + (levelDiff * 5);
    const probability = 50 + (advantage * 0.5);
    
    return Math.max(10, Math.min(90, probability)).toFixed(0);
  };

  const getBotAvatar = (botLevel, difficulty) => {
    if (botLevel <= 2) return "🥅"; // Portero novato
    if (botLevel <= 4) return "⚽"; // Jugador básico
    if (botLevel <= 6) return "👟"; // Jugador experimentado
    if (botLevel <= 8) return "🔥"; // Jugador estrella
    return "🏆"; // Leyenda
  };

  const getRewards = (botLevel, isWinner = true) => {
    const baseExp = isWinner ? 150 : 75;
    const baseCoins = isWinner ? 200 : 100;
    const levelBonus = Math.max(0, botLevel - (character?.level || 1)) * 0.1;
    
    return {
      exp: Math.round(baseExp * (1 + levelBonus)),
      coins: Math.round(baseCoins * (1 + levelBonus))
    };
  };

  return (
    <div className="bot-matchmaking">
      {/* Header Section */}
      <div className="bots-header">
        <h1>🤖 ENTRENAMIENTO CONTRA BOTS</h1>
        <p className="bots-subtitle">
          Mejora tus habilidades enfrentándote a bots de diferentes niveles. 
          Gana experiencia y lupicoins por cada victoria.
        </p>
      </div>

      {/* Simulation Overlay */}
      {simulating && (
        <div className="simulation-overlay">
          <div className="simulation-content">
            <div className="simulation-spinner"></div>
            <h3>SIMULANDO PARTIDA...</h3>
            <p>Contra {selectedBot?.name}</p>
          </div>
        </div>
      )}

      {/* Bots Grid */}
      <div className="bots-grid">
        {bots.map(bot => {
          const winProbability = character ? 
            getWinProbability(character, bot) : 50;
          const winRewards = getRewards(bot.level, true);
          const loseRewards = getRewards(bot.level, false);
          
          return (
            <div key={bot.id} className="bot-card">
              {/* Bot Header */}
              <div className="bot-header">
                <div 
                  className="bot-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`,
                    borderColor: getDifficultyColor(bot.difficulty)
                  }}
                >
                  {getBotAvatar(bot.level, bot.difficulty)}
                </div>
                <div className="bot-info">
                  <h3 className="bot-name">{bot.name}</h3>
                  <div className="bot-meta">
                    <span className="bot-level">NIVEL {bot.level}</span>
                    <span 
                      className="bot-difficulty"
                      style={{ color: getDifficultyColor(bot.difficulty) }}
                    >
                      {getDifficultyText(bot.difficulty)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="bot-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Pase</span>
                  <div className="stat-value">{bot.pase}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{ width: `${bot.pase}%` }}
                    ></div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tiro</span>
                  <div className="stat-value">{bot.tiro}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{ width: `${bot.tiro}%` }}
                    ></div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Regate</span>
                  <div className="stat-value">{bot.regate}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{ width: `${bot.regate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Velocidad</span>
                  <div className="stat-value">{bot.velocidad}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{ width: `${bot.velocidad}%` }}
                    ></div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Defensa</span>
                  <div className="stat-value">{bot.defensa}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{ width: `${bot.defensa}%` }}
                    ></div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Físico</span>
                  <div className="stat-value">{bot.potencia}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{ width: `${bot.potencia}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Match Prediction */}
              {character && (
                <div className="prediction-section">
                  <div className="prediction-label">Probabilidad de victoria:</div>
                  <div className="prediction-value">
                    <span 
                      style={{ 
                        color: winProbability > 60 ? '#4cc9f0' : 
                               winProbability > 40 ? '#4361ee' : '#7209b7'
                      }}
                    >
                      {winProbability}%
                    </span>
                  </div>
                </div>
              )}

              {/* Rewards Section */}
              <div className="rewards-section">
                <div className="rewards-title">Recompensas:</div>
                <div className="rewards-grid">
                  <div className="reward-item win-reward">
                    <span className="reward-type">🏆 VICTORIA</span>
                    <div className="reward-amounts">
                      <span>+{winRewards.exp} EXP</span>
                      <span>+{winRewards.coins} 🪙</span>
                    </div>
                  </div>
                  <div className="reward-item lose-reward">
                    <span className="reward-type">💪 DERROTA</span>
                    <div className="reward-amounts">
                      <span>+{loseRewards.exp} EXP</span>
                      <span>+{loseRewards.coins} 🪙</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`play-btn ${bot.difficulty}`}
                onClick={() => startBotMatch(bot)}
                disabled={loading || !character}
                style={{ 
                  background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`
                }}
              >
                {loading && selectedBot?.id === bot.id ? (
                  "🔄 CARGANDO..."
                ) : (
                  `⚽ ENTRENAR CONTRA ${bot.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {!character && (
        <div className="no-character-message">
          <p>⚠️ Necesitas un personaje para jugar contra bots</p>
        </div>
      )}
    </div>
  );
};

export default BotMatchmaking;
