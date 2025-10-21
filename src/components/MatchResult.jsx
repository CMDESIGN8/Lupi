import React from "react";
import "../styles/MatchResult.css";

const MatchResult = ({ result, character, onClose, finalStats }) => {
  // Verificar si tenemos datos válidos para mostrar
  if (!result || !result.simulation) {
    console.log("No hay resultado válido para mostrar:", result);
    return null;
  }

  // Usar finalStats si están disponibles, sino usar las de result
  const stats = finalStats?.user || result.simulation?.userStats;

  const getResultType = () => {
    if (!result.simulation) return 'draw';
    
    // Verificar diferentes formas en que puede venir el winnerId
    const winnerId = result.simulation.winnerId || result.simulation.winner_id;
    const player1Score = result.simulation.player1Score || result.simulation.player1_score || 0;
    const player2Score = result.simulation.player2Score || result.simulation.player2_score || 0;
    
    if (winnerId === character?.id) return 'win';
    if (player1Score === player2Score) return 'draw';
    return 'lose';
  };

  const resultType = getResultType();
  
  // Obtener scores de manera segura
  const player1Score = result.simulation.player1Score || result.simulation.player1_score || 0;
  const player2Score = result.simulation.player2Score || result.simulation.player2_score || 0;

  // Obtener recompensas de manera segura
  const rewards = result.rewards || { exp: 50, coins: 30 };
  const leveledUp = result.leveledUp || false;
  const newLevel = result.newLevel || (character?.level || 1) + 1;

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

        {/* SECCIÓN DE RECOMPENSAS - SIEMPRE VISIBLE */}
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

        {/* ESTADÍSTICAS OPCIONALES - SOLO SI HAY DATOS */}
        {stats && (
          <div className="performance-stats">
            <h4>📈 ESTADÍSTICAS DEL PARTIDO</h4>
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
        )}

        {/* BOTÓN PARA CERRAR MANUALMENTE - ÚNICA FORMA DE CERRAR */}
        <button className="close-result-btn" onClick={onClose}>
          CONTINUAR
        </button>
        
        {/* Mensaje indicativo para el usuario */}
        <p className="close-hint">
          Haz clic en CONTINUAR para volver al entrenamiento
        </p>
      </div>
    </div>
  );
};

export default MatchResult;
