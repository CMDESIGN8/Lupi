// SoccerField.jsx - VERSIÓN MEJORADA
import React from 'react';

export const SoccerField = ({ state }) => {
  const { simulating, possession, playerPositions } = state;

  const renderPlayers = (team, isUser) => {
    if (!playerPositions[team]) return null;
    
    return Object.entries(playerPositions[team]).map(([playerId, player], index) => (
      <div 
        key={playerId}
        className={`player ${team} ${player.role} ${possession === team ? 'has-ball' : ''}`}
        style={{ 
          left: `${player.position.x}%`, 
          top: `${player.position.y}%`,
          animationDelay: `${index * 0.1}s`
        }}
      >
        {getPlayerIcon(player.role, isUser)}
        <div className="player-role">{player.role}</div>
      </div>
    ));
  };

  const getPlayerIcon = (role, isUser) => {
    const icons = {
      portero: '🧤',
      defensor: isUser ? '🛡️' : '🔵',
      goleador: isUser ? '⚽' : '🔴',
      ala: isUser ? '💨' : '🟢'
    };
    return icons[role] || (isUser ? '👤' : '🤖');
  };

  return (
    <div className="soccer-field improved futsal-field">
      <div className="field-grass">
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        <div className="penalty-area left futsal-penalty"></div>
        <div className="penalty-area right futsal-penalty"></div>
        
        {simulating ? (
          <>
            {renderPlayers('user', true)}
            {renderPlayers('bot', false)}
            
            <div 
              className="soccer-ball" 
              style={{ 
                top: '50%', 
                left: possession === 'user' ? '35%' : '65%' 
              }}
            >
              ⚽
            </div>
            
            <div className="possession-indicator-field">
              Posesión: {possession === 'user' ? state.character.name : state.selectedBot.name}
            </div>

            <div className="tactic-indicator">
              Táctica: {state.tactic} | Zona: {state.ballZone}
            </div>
          </>
        ) : (
          <div className="field-message improved">
            <h3>SIMULADOR FÚTSAL PRO v2.0</h3>
            <p>Elige un oponente y formación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};
