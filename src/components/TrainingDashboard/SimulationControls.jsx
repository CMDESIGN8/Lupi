// SimulationControls.jsx
import React from 'react';

export const SimulationControls = ({ state, dispatch }) => {
  const { speed, matchTime } = state;

  return (
    <div className="simulation-controls professional">
      <h4>CONTROL DE PARTIDO</h4>
      <div className="speed-controls">
        <button onClick={() => dispatch({ type: 'CHANGE_SPEED', payload: 1200 })} className={speed === 1200 ? 'active' : ''}>🐢</button>
        <button onClick={() => dispatch({ type: 'CHANGE_SPEED', payload: 800 })} className={speed === 800 ? 'active' : ''}>▶️</button>
        <button onClick={() => dispatch({ type: 'CHANGE_SPEED', payload: 400 })} className={speed === 400 ? 'active' : ''}>⏩</button>
        <button onClick={() => dispatch({ type: 'CHANGE_SPEED', payload: 150 })} className={speed === 150 ? 'active' : ''}>⚡</button>
      </div>
      <div className="match-time-display">
        <div className="time">{matchTime}'</div>
        <div className="phase">
          {matchTime <= 20 ? '1º TIEMPO' : matchTime < 40 ? '2º TIEMPO' : 'FINAL'}
        </div>
      </div>
    </div>
  );
};