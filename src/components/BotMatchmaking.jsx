// components/BotMatchmaking.jsx
import React, { useState, useEffect } from "react";

const BotMatchmaking = ({ character, onMatchUpdate }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await fetch(`${API_URL}/bots`);
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error("Error cargando bots:", error);
    }
  };

  const startBotMatch = async (botId) => {
    if (!character) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bots/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          characterId: character.id, 
          botId 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentMatch(data.match);
        // Simular inmediatamente (o podrías mostrar una pantalla de carga)
        await simulateMatch(data.match.id);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error iniciando partida:", error);
      alert("Error al iniciar partida");
    } finally {
      setLoading(false);
    }
  };

  const simulateMatch = async (matchId) => {
    setSimulating(true);
    try {
      const response = await fetch(`${API_URL}/bots/${matchId}/simulate`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentMatch(data.match);
        alert(data.message);
        
        // Actualizar datos del personaje (para EXP y lupicoins)
        if (onMatchUpdate) {
          onMatchUpdate();
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error simulando partida:", error);
      alert("Error al simular partida");
    } finally {
      setSimulating(false);
      setCurrentMatch(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'var(--success)';
      case 'medium': return 'var(--secondary)';
      case 'hard': return 'var(--danger)';
      default: return 'var(--primary)';
    }
  };

  const getWinProbability = (playerLevel, botLevel, playerStats, botStats) => {
    const levelDiff = playerLevel - botLevel;
    const playerAvg = (playerStats.pase + playerStats.tiro + playerStats.regate + playerStats.velocidad + playerStats.defensa + playerStats.potencia) / 6;
    const botAvg = (botStats.pase + botStats.tiro + botStats.regate + botStats.velocidad + botStats.defensa + botStats.potencia) / 6;
    
    const advantage = (playerAvg - botAvg) + (levelDiff * 5);
    const probability = 50 + (advantage * 0.5);
    
    return Math.max(10, Math.min(90, probability)).toFixed(0);
  };

  return (
    <div className="bot-matchmaking">
      <h3>🤖 ENTRENAMIENTO CONTRA BOTS</h3>
      <p className="section-description">
        Mejora tus habilidades jugando contra bots. Gana experiencia y lupicoins.
      </p>

      {simulating && (
        <div className="simulation-overlay">
          <div className="simulation-message">
            <div className="loading-spinner"></div>
            <p>Simulando partida...</p>
          </div>
        </div>
      )}

      <div className="bots-grid">
        {bots.map(bot => {
          const winProbability = character ? 
            getWinProbability(character.level, bot.level, character, bot) : 50;
            
          return (
            <div key={bot.id} className="bot-card">
              <div className="bot-header">
                <div className="bot-avatar">🤖</div>
                <div className="bot-info">
                  <h4>{bot.name}</h4>
                  <div className="bot-meta">
                    <span className="bot-level">Nv. {bot.level}</span>
                    <span 
                      className="bot-difficulty"
                      style={{ color: getDifficultyColor(bot.difficulty) }}
                    >
                      {bot.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bot-stats">
                <div className="stat-bar">
                  <span>Pase</span>
                  <div className="bar">
                    <div 
                      className="fill" 
                      style={{ width: `${bot.pase}%` }}
                    ></div>
                  </div>
                  <span>{bot.pase}</span>
                </div>
                <div className="stat-bar">
                  <span>Tiro</span>
                  <div className="bar">
                    <div 
                      className="fill" 
                      style={{ width: `${bot.tiro}%` }}
                    ></div>
                  </div>
                  <span>{bot.tiro}</span>
                </div>
              </div>

              {character && (
                <div className="match-prediction">
                  <span>Probabilidad de victoria: </span>
                  <strong style={{ 
                    color: winProbability > 60 ? 'var(--success)' : 
                           winProbability > 40 ? 'var(--secondary)' : 'var(--danger)'
                  }}>
                    {winProbability}%
                  </strong>
                </div>
              )}

              <div className="rewards">
                <span>Recompensas:</span>
                <div className="reward-items">
                  <span>+{150 + (bot.level * 25)} EXP</span>
                  <span>+{200 + (bot.level * 30)} 🪙</span>
                </div>
              </div>

              <button
                className="play-btn"
                onClick={() => startBotMatch(bot.id)}
                disabled={loading || !character}
              >
                {loading ? "CARGANDO..." : "JUGAR PARTIDO"}
              </button>
            </div>
          );
        })}
      </div>

      {!character && (
        <div className="no-character-message">
          <p>Necesitas un personaje para jugar contra bots</p>
        </div>
      )}
    </div>
  );
};

export default BotMatchmaking;
