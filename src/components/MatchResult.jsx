import React from "react";
import "../styles/MatchResult.css";

const MatchResult = ({ result, character, onClose }) => {
  // Verificar si tenemos datos válidos para mostrar
  if (!result) {
    console.log("No hay resultado válido para mostrar:", result);
    return null;
  }

  // ✅ USAR DATOS DEL BACKEND DIRECTAMENTE
  const getResultType = () => {
    if (!result.simulation && !result.match) return 'draw';
    
    // Preferir datos de simulation, luego de match
    const winnerId = result.simulation?.winnerId || result.match?.winner_id;
    const player1Score = result.simulation?.player1Score || result.match?.player1_score || 0;
    const player2Score = result.simulation?.player2Score || result.match?.player2_score || 0;
    
    console.log("🔍 Determinando resultado:", { winnerId, player1Score, player2Score, characterId: character?.id });
    
    if (winnerId === character?.id) return 'win';
    if (player1Score === player2Score) return 'draw';
    return 'lose';
  };

  const resultType = getResultType();
  
  // ✅ Obtener scores de manera segura desde backend
  const player1Score = result.simulation?.player1Score || result.match?.player1_score || 0;
  const player2Score = result.simulation?.player2Score || result.match?.player2_score || 0;

  // ✅ Obtener recompensas del backend
  const rewards = result.rewards || { exp: 0, coins: 0 };
  const leveledUp = result.leveledUp || false;
  const newLevel = result.newLevel || (character?.level || 1);

  console.log("🎯 Mostrando resultado final:", {
    resultType,
    score: `${player1Score}-${player2Score}`,
    rewards,
    leveledUp,
    newLevel
  });

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
          {player1Score} - {player2Score}
        </div>
        
        <p className="result-opponent">vs {result.botName || 'RIVAL'}</p>

        {/* SECCIÓN DE RECOMPENSAS */}
        <div className="rewards-display">
          <h4>🏆 RECOMPENSAS GANADAS</h4>
          <div className="reward-item">
            <span>Experiencia:</span>
            <span className="reward-amount">+{rewards.exp} EXP</span>
          </div>
          <div className="reward-item">
            <span>Lupicoins:</span>
            <span className="reward-amount">+{rewards.coins} 🪙</span>
          </div>
          
          {leveledUp && (
            <div className="level-up-badge">
              🎉 ¡Subiste al nivel {newLevel}!
            </div>
          )}
        </div>

        {/* MENSAJE DEL BACKEND */}
        {result.message && (
          <div className="backend-message">
            <p>{result.message}</p>
          </div>
        )}

        {/* BOTÓN PARA CERRAR MANUALMENTE */}
        <button className="close-result-btn" onClick={onClose}>
          CONTINUAR
        </button>
        
        <p className="close-hint">
          Haz clic en CONTINUAR para volver al entrenamiento
        </p>
      </div>
    </div>
  );
};

export default MatchResult;
