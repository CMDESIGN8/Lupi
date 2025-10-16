import React from "react";
import "../styles/MatchResult.css";

const MatchResult = ({ result, character, onClose }) => {
  const getResultType = () => {
    if (result.simulation.winnerId === character.id) return 'win';
    if (result.simulation.player1Score === result.simulation.player2Score) return 'draw';
    return 'lose';
  };

  const resultType = getResultType();

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
        
        <div className="rewards-display">
          <h4>Recompensas Obtenidas:</h4>
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

        <div className="auto-close-timer">
          ⏱️ Se cerrará automáticamente en 5 segundos...
        </div>

        <button className="close-result-btn" onClick={onClose}>
          CERRAR AHORA
        </button>
      </div>
    </div>
  );
};

export default MatchResult;
