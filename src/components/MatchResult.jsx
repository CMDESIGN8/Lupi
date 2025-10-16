import React from "react";
import "../styles/MatchResult.css";

const MatchResult = ({ result, character, onClose }) => {
  const getResultType = () => {
    if (result.simulation.winnerId === character.id) return 'win';
    if (result.simulation.player1Score === result.simulation.player2Score) return 'draw';
    return 'lose';
  };

  const resultType = getResultType();

  // Calcular estadísticas de rendimiento (simuladas para el ejemplo)
  const calculatePerformanceStats = () => {
    const baseStats = {
      shots: Math.floor(Math.random() * 8) + 3,
      shotsOnTarget: Math.floor(Math.random() * 5) + 2,
      passes: Math.floor(Math.random() * 40) + 20,
      passAccuracy: Math.floor(Math.random() * 30) + 65,
      tackles: Math.floor(Math.random() * 10) + 2,
      dribbles: Math.floor(Math.random() * 8) + 2,
      possession: Math.floor(Math.random() * 40) + 30,
      fouls: Math.floor(Math.random() * 5) + 1
    };

    // Ajustar según resultado
    if (resultType === 'win') {
      baseStats.passAccuracy += 5;
      baseStats.possession += 10;
    } else if (resultType === 'lose') {
      baseStats.passAccuracy -= 5;
      baseStats.possession -= 10;
    }

    return baseStats;
  };

  const performanceStats = calculatePerformanceStats();

  return (
    <div className="match-result-overlay">
      <div className={`match-result-card ${resultType}`}>
        <div className="result-icon">
          {resultType === 'win' ? '🎉' : 
           resultType === 'draw' ? '🤝' : '😞'}
        </div>
        
        <h2 className="result-title">
          {resultType === 'win' ? '¡VICTORIA!' : 
           resultType === 'draw' ? 'EMPATE' : 'DERROTA'}
        </h2>
        
        <div className={`result-score ${resultType}`}>
          {result.simulation.player1Score} - {result.simulation.player2Score}
        </div>
        
        <p className="result-opponent">vs {result.botName}</p>
        
        {/* ESTADÍSTICAS DE RENDIMIENTO */}
        <div className="performance-stats">
          <h4>📈 ESTADÍSTICAS DE RENDIMIENTO</h4>
          <div className="stats-grid">
            <div className="performance-stat">
              <span className="stat-label">Disparos</span>
              <span className="stat-value">{performanceStats.shots}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Pases</span>
              <span className="stat-value">{performanceStats.passes}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Precisión</span>
              <span className="stat-value">{performanceStats.passAccuracy}%</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Posesión</span>
              <span className="stat-value">{performanceStats.possession}%</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Regates</span>
              <span className="stat-value">{performanceStats.dribbles}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Entradas</span>
              <span className="stat-value">{performanceStats.tackles}</span>
            </div>
          </div>
        </div>

        <div className="rewards-display">
          <h4>🏆 RECOMPENSAS OBTENIDAS</h4>
          <div className="reward-item">
            <span>Experiencia:</span>
            <span className="reward-amount">+{result.rewards.exp} EXP</span>
          </div>
          <div className="reward-item">
            <span>Lupicoins:</span>
            <span className="reward-amount">+{result.rewards.coins} 🪙</span>
          </div>
          
          {result.leveledUp && (
            <div className="level-up-badge">
              🎉 ¡Subiste al nivel {result.newLevel}! +{result.levelsGained * 2} puntos de habilidad
            </div>
          )}
        </div>

        <div className="match-summary">
          <p>
            {resultType === 'win' 
              ? '¡Excelente partido! Dominaste el encuentro con un gran rendimiento.' 
              : resultType === 'draw'
              ? 'Partido equilibrado. Sigue entrenando para conseguir la victoria.'
              : 'Partido complicado. Analiza tu rendimiento y mejora para la próxima.'
            }
          </p>
        </div>

        <div className="auto-close-timer">
          ⏱️ Se cerrará automáticamente en 5 segundos...
        </div>

        <button className="close-result-btn" onClick={onClose}>
          ANALIZAR ESTADÍSTICAS
        </button>
      </div>
    </div>
  );
};

export default MatchResult;
