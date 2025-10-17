import React, { useEffect } from "react";
import "../styles/MatchResult.css";

const MatchResult = ({ result, character, onClose, finalStats }) => {
  // Usar finalStats si están disponibles, sino usar las de result
  const stats = finalStats || result.simulation?.userStats;

  const getResultType = () => {
    if (result.simulation.winnerId === character.id) return 'win';
    if (result.simulation.player1Score === result.simulation.player2Score) return 'draw';
    return 'lose';
  };

  const resultType = getResultType();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!stats) {
    return null;
  }

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
              <span className="stat-value">{stats.shots || 0}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Goles</span>
              <span className="stat-value">{stats.goals || 0}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Pases</span>
              <span className="stat-value">{stats.passes || 0}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Entradas</span>
              <span className="stat-value">{stats.tackles || 0}</span>
            </div>
            <div className="performance-stat">
              <span className="stat-label">Posesión</span>
              <span className="stat-value">{stats.possession || 50}%</span>
            </div>
            {stats.passAccuracy && (
              <div className="performance-stat">
                <span className="stat-label">Precisión pases</span>
                <span className="stat-value">{stats.passAccuracy}%</span>
              </div>
            )}
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
