import React, { useState, useEffect } from "react";
import "../styles/BotMatchmaking.css";

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
    // 1️⃣ Crear partida contra bot
    const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        characterId: character.id, 
        botId: bot.id 
      }),
    });

    const matchData = await matchResponse.json();
    console.log("🧩 MatchData recibido:", matchData);

    if (!matchResponse.ok || !matchData.match?.id) {
      alert(matchData.error || "Error al iniciar partida");
      return;
    }

    // 2️⃣ Simular partida usando el ID correcto de la partida
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
    // Asegurar que matchId sea un número
    const numericMatchId = Number(matchId);
    
    const response = await fetch(`https://lupiback.onrender.com/bots/${numericMatchId}/simulate`, {
      method: "POST",
    });

    const data = await response.json();
    console.log("🎮 Resultado simulación:", data);
    
    if (response.ok) {
      setTimeout(() => {
        if (data.simulation.winnerId === character.id) {
          alert(`🎉 ¡GANASTE! ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`);
        } else if (data.simulation.player1Score === data.simulation.player2Score) {
          alert(`🤝 EMPATE ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`);
        } else {
          alert(`😞 Perdiste ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`);
        }
      }, 500);

      if (onMatchUpdate) {
        setTimeout(() => onMatchUpdate(), 1000);
      }
    } else {
      alert(data.error || "Error al simular partida");
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

  const getWinProbability = (playerStats, botStats) => {
    const playerAvg = (playerStats.pase + playerStats.tiro + playerStats.regate + playerStats.velocidad + playerStats.defensa + playerStats.potencia) / 6;
    const botAvg = (botStats.pase + botStats.tiro + botStats.regate + botStats.velocidad + botStats.defensa + botStats.potencia) / 6;
    const levelDiff = playerStats.level - botStats.level;
    const advantage = (playerAvg - botAvg) + (levelDiff * 5);
    const probability = 50 + (advantage * 0.5);
    return Math.max(10, Math.min(90, probability)).toFixed(0);
  };

  const getBotAvatar = (botLevel) => {
    if (botLevel <= 2) return "🥅";
    if (botLevel <= 4) return "⚽";
    if (botLevel <= 6) return "👟";
    if (botLevel <= 8) return "🔥";
    return "🏆";
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
      <div className="bots-header">
        <h1>🤖 ENTRENAMIENTO CONTRA BOTS</h1>
        <p className="bots-subtitle">
          Mejora tus habilidades enfrentándote a bots de diferentes niveles. 
          Gana experiencia y lupicoins por cada victoria.
        </p>
      </div>

      {simulating && (
        <div className="simulation-overlay">
          <div className="simulation-content">
            <div className="simulation-spinner"></div>
            <h3>SIMULANDO PARTIDA...</h3>
            <p>Contra {selectedBot?.name}</p>
          </div>
        </div>
      )}

      <div className="bots-grid">
        {bots.map(bot => {
          const winProbability = character ? getWinProbability(character, bot) : 50;
          const winRewards = getRewards(bot.level, true);
          const loseRewards = getRewards(bot.level, false);
          
          return (
            <div key={bot.id} className="bot-card">
              <div className="bot-header">
                <div 
                  className="bot-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`
                  }}
                >
                  {getBotAvatar(bot.level)}
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

              <button
                className={`play-btn ${bot.difficulty}`}
                onClick={() => startBotMatch(bot)}
                disabled={loading || !character}
                style={{ 
                  background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`
                }}
              >
                {loading && selectedBot?.id === bot.id ? "🔄 CARGANDO..." : `⚽ ENTRENAR CONTRA ${bot.name}`}
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
