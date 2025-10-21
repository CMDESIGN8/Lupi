// BotSelector.jsx
import React from 'react';
import "../../styles/Botselector.css";
export const BotSelector = ({ bots, onStartMatch, simulating }) => {
  // Función para obtener avatar (puedes moverla a un utils si quieres)
  const getBotAvatar = (level) => {
    if (level <= 2) return "👽"; 
    if (level <= 4) return "👻"; 
    if (level <= 6) return "🤖"; 
    return "🏆";
  };

  return (
    <div className="panel-content">
      <div className="bots-grid professional">
        {bots.map(bot => (
          <div key={bot.id} className="bot-card professional">
            <div className="bot-header professional">
              <div className="bot-avatar professional">
                {getBotAvatar(bot.level)}
              </div>
              <div className="bot-info professional">
                <h4>{bot.name || 'Bot Futsal'}</h4>
                <span>Nivel: {bot.level || 1}</span>
              </div>
            </div>
            <button 
              className="play-btn professional"
              onClick={() => onStartMatch(bot)} 
              disabled={simulating}
            >
              JUGAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );

};
