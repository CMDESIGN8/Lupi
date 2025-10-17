import React, { useEffect } from "react";
import "../styles/MatchResult.css";

const MatchResult = ({ result, character, onClose, finalStats }) => {
  // result: contiene información de recompensas (exp, coins, etc.)
  // finalStats: contiene las estadísticas del partido (goles, disparos, etc.)

  const getResultType = () => {
    if (result.simulation.winnerId === character.id) return 'win';
    if (result.simulation.player1Score === result.simulation.player2Score) return 'draw';
    return 'lose';
  };

  const resultType = getResultType();

  // Cierre automático después de un tiempo
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // 10 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  // Si no hay estadísticas, no renderizar nada para evitar errores
  if (!finalStats) {
    return null;
  }

  const { user: userStats } = finalStats;

  return (
    <div className="match-result-overlay">
      <div className={`match-result-card ${resultType}`}>
        <div className="result-icon">
          {resultType === 'win' ? '🎉' : resultType === 'draw' ? '🤝' : '😞'}
        </div>
        
        <h2 className="result-title">
          {resultType === 'win' ? '¡VICTORIA!' : resultType === 'draw' ? 'EMPATE' : 'DERROTA'}
        </h2>
        
        <div className={`result-score ${resultType}`}>
          {result.simulation.player1Score} - {result.simulation.player2Score}
        </div>
        
        <p className="result-opponent">vs {result.botName}</p>
        
        <div className="performance-stats">
          <h4>📈 TU RENDIMIENTO</h4>
          <div className="stats-grid">
            <div className="performance-stat">
              <span className="stat-label">Disparos</span>
              <span className="stat-value">{userStats.shots}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Goles</span>
              <span className="stat-value">{userStats.goals}</span>
            </div>
             <div className="performance-stat">
              <span className="stat-label">Pases</span>
              <span className="stat-value">{userStats.passes}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Entradas</span>
              <span className="stat-value">{userStats.tackles}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Posesión</span>
              <span className="stat-value">{userStats.possession}%</span>
            </div>
          </div>
        </div>

        <div className="rewards-display">
          <h4>🏆 RECOMPENSAS</h4>
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
              🎉 ¡Subiste al nivel {result.newLevel}!
            </div>
          )}
        </div>

        <div className="auto-close-timer">
          ⏱️ Se cerrará en 10 segundos...
        </div>

        <button className="close-result-btn" onClick={onClose}>
          CONTINUAR
        </button>
      </div>
    </div>
  );
};

export default MatchResult;
