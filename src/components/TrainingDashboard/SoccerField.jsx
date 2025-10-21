// SoccerField.jsx
import React from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { simulating, possession, userFormation = '2-1-1', botFormation = '2-1-1' } = state;

  // Posiciones base para formaciones de fútsal
  const formations = {
    '2-1-1': {
      // [portero, defensa1, defensa2, medio, delantero]
      user: [
        { position: 'GK', top: '50%', left: '5%', emoji: '🧤' },
        { position: 'DF', top: '30%', left: '25%', emoji: '🔵' },
        { position: 'DF', top: '70%', left: '25%', emoji: '🔵' },
        { position: 'MF', top: '50%', left: '45%', emoji: '🟢' },
        { position: 'FW', top: '50%', left: '65%', emoji: '🔴' }
      ],
      bot: [
        { position: 'GK', top: '50%', left: '95%', emoji: '🧤' },
        { position: 'DF', top: '30%', left: '75%', emoji: '🔵' },
        { position: 'DF', top: '70%', left: '75%', emoji: '🔵' },
        { position: 'MF', top: '50%', left: '55%', emoji: '🟢' },
        { position: 'FW', top: '50%', left: '35%', emoji: '🔴' }
      ]
    },
    '3-1': {
      user: [
        { position: 'GK', top: '50%', left: '5%', emoji: '🧤' },
        { position: 'DF', top: '20%', left: '25%', emoji: '🔵' },
        { position: 'DF', top: '50%', left: '25%', emoji: '🔵' },
        { position: 'DF', top: '80%', left: '25%', emoji: '🔵' },
        { position: 'FW', top: '50%', left: '60%', emoji: '🔴' }
      ],
      bot: [
        { position: 'GK', top: '50%', left: '95%', emoji: '🧤' },
        { position: 'DF', top: '20%', left: '75%', emoji: '🔵' },
        { position: 'DF', top: '50%', left: '75%', emoji: '🔵' },
        { position: 'DF', top: '80%', left: '75%', emoji: '🔵' },
        { position: 'FW', top: '50%', left: '40%', emoji: '🔴' }
      ]
    },
    '1-2-1': {
      user: [
        { position: 'GK', top: '50%', left: '5%', emoji: '🧤' },
        { position: 'DF', top: '50%', left: '25%', emoji: '🔵' },
        { position: 'MF', top: '30%', left: '45%', emoji: '🟢' },
        { position: 'MF', top: '70%', left: '45%', emoji: '🟢' },
        { position: 'FW', top: '50%', left: '65%', emoji: '🔴' }
      ],
      bot: [
        { position: 'GK', top: '50%', left: '95%', emoji: '🧤' },
        { position: 'DF', top: '50%', left: '75%', emoji: '🔵' },
        { position: 'MF', top: '30%', left: '55%', emoji: '🟢' },
        { position: 'MF', top: '70%', left: '55%', emoji: '🟢' },
        { position: 'FW', top: '50%', left: '35%', emoji: '🔴' }
      ]
    }
  };

  const userPlayers = formations[userFormation]?.user || formations['2-1-1'].user;
  const botPlayers = formations[botFormation]?.bot || formations['2-1-1'].bot;

  // Determinar qué jugador tiene el balón
  const getPlayerWithBall = () => {
    if (possession === 'user') {
      // El delantero suele tener más probabilidades de tener el balón
      return userPlayers.findIndex(player => player.position === 'FW');
    } else {
      return botPlayers.findIndex(player => player.position === 'FW');
    }
  };

  const playerWithBallIndex = getPlayerWithBall();

  return (
    <div className="soccer-field improved futsal-field">
      <div className="field-grass">
        {/* Líneas del campo de fútsal */}
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        <div className="penalty-area left futsal-penalty"></div>
        <div className="penalty-area right futsal-penalty"></div>
        <div className="goal left futsal-goal"></div>
        <div className="goal right futsal-goal"></div>
        
        {simulating ? (
          <>
            {/* Jugadores del usuario */}
            {userPlayers.map((player, index) => (
              <div 
                key={`user-${index}`}
                className={`player user ${player.position} ${
                  possession === 'user' && index === playerWithBallIndex ? 'has-ball' : ''
                }`}
                style={{ 
                  top: player.top, 
                  left: player.left,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`${player.position} - ${state.character?.name || 'Usuario'}`}
              >
                {player.emoji}
                {possession === 'user' && index === playerWithBallIndex && (
                  <div className="ball-indicator">⚽</div>
                )}
              </div>
            ))}

            {/* Jugadores del bot */}
            {botPlayers.map((player, index) => (
              <div 
                key={`bot-${index}`}
                className={`player bot ${player.position} ${
                  possession === 'bot' && index === playerWithBallIndex ? 'has-ball' : ''
                }`}
                style={{ 
                  top: player.top, 
                  left: player.left,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`${player.position} - ${state.selectedBot?.name || 'Rival'}`}
              >
                {player.emoji}
                {possession === 'bot' && index === playerWithBallIndex && (
                  <div className="ball-indicator">⚽</div>
                )}
              </div>
            ))}

            {/* Información de posesión y formación */}
            <div className="game-info">
              <div className="possession-indicator-field">
                Posesión: {possession === 'user' ? state.character?.name : state.selectedBot?.name}
              </div>
              <div className="formation-info">
                Formación: {userFormation} vs {botFormation}
              </div>
            </div>
          </>
        ) : (
          <div className="field-message improved">
            <h3>SIMULADOR FÚTSAL PRO</h3>
            <p>Elige un oponente y formación para comenzar</p>
            <div className="formation-options">
              <div className="formation-option">
                <strong>2-1-1</strong> (Clásica)
              </div>
              <div className="formation-option">
                <strong>3-1</strong> (Defensiva)
              </div>
              <div className="formation-option">
                <strong>1-2-1</strong> (Ofensiva)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
