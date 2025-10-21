// SoccerField.jsx
import React from 'react';

export const SoccerField = ({ state }) => {
  const { simulating, possession } = state;

  return (
    <div className="soccer-field improved futsal-field">
      <div className="field-grass">
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        <div className="penalty-area left futsal-penalty"></div>
        <div className="penalty-area right futsal-penalty"></div>
        
        {simulating ? (
          <>
            <div className={`player user ${possession === 'user' ? 'has-ball' : ''}`} style={{ top: '50%', left: '30%' }}>👤</div>
            <div className={`player bot ${possession === 'bot' ? 'has-ball' : ''}`} style={{ top: '50%', left: '70%' }}>🤖</div>
            <div className="soccer-ball" style={{ top: '50%', left: possession === 'user' ? '35%' : '65%' }}>⚽</div>
            <div className="possession-indicator-field">
                Posesión: {possession === 'user' ? state.character.name : state.selectedBot.name}
            </div>
          </>
        ) : (
           <div className="field-message improved">
              <h3>SIMULADOR FÚTSAL PRO</h3>
              <p>Elige un oponente para comenzar</p>
            </div>
        )}
      </div>
    </div>
  );
};
