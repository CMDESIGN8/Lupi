// EventsFeed.jsx
import React from 'react';
import "../../styles/EventsFeed.css";

export const EventsFeed = ({ state, character }) => {
  const { matchEvents, selectedBot } = state;

  const getActionIcon = (action) => {
    const icons = {
      goal: '🥅', shot: '⚽', pass: '🔄', tackle: '🛡️', foul: '⚠️', save: '🧤'
    };
    return icons[action] || '●';
  };

  return (
    <div className="panel-content events-content">
      <div className="panel-header"><h3>EVENTOS DEL PARTIDO</h3></div>
      {matchEvents.length === 0 ? (
        <p>Los eventos aparecerán aquí.</p>
      ) : (
        <div className="events-feed">
          {matchEvents.map((event) => (
            <div key={event.id} className={`event-item ${event.intensity} ${event.team}`}>
              <div className="event-header">
                <span className="event-time">{event.time}</span>
                <span className="event-action-icon">{getActionIcon(event.type)}</span>
                <span className="event-team">
                  {event.team === 'user' ? character?.nickname : selectedBot?.name}
                </span>
              </div>
              <div className="event-text">{event.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

};
