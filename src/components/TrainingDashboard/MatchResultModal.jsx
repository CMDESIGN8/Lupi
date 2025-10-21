import React from 'react';
import '../../styles/MatchResultModal.css'; // Reutilizamos los estilos

export const MatchResultModal = ({ result, onClose }) => {
  const { matchResult, rewards, message } = result;
  
  const isWinner = matchResult.winner_id === matchResult.player1_id;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${isWinner ? 'victory' : 'defeat'}`}>
        <h2 className="modal-title">{message}</h2>
        <div className="modal-score">
          <span>{matchResult.player1_score}</span>
          <span>-</span>
          <span>{matchResult.player2_score}</span>
        </div>
        <div className="modal-rewards">
          <h3>Recompensas Obtenidas</h3>
          <p className="reward-item">
            <span className="reward-label">Experiencia:</span>
            <span className="reward-value exp">+{rewards.exp} XP</span>
          </p>
          <p className="reward-item">
            <span className="reward-label">Lupicoins:</span>
            <span className="reward-value coins">+{rewards.coins} 💰</span>
          </p>
        </div>
        {result.leveledUp && (
          <div className="level-up-alert">
            🎉 ¡SUBISTE DE NIVEL! ({result.levelsGained} nivel/es) 🎉
          </div>
        )}
        <button onClick={onClose} className="modal-close-btn">
          Continuar
        </button>
      </div>
    </div>
  );
};
