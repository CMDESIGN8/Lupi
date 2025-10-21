// TacticalControls.jsx
import React from 'react';
import { MATCH_CONFIG } from './futsalConfig';

export const TacticalControls = ({ state, dispatch }) => {
  const { tactic, simulating } = state;

  return (
    <div className="tactical-controls">
      <h4>MENTALIDAD TÁCTICA</h4>
      <div className="tactic-buttons">
        <button 
          onClick={() => dispatch({ type: 'CHANGE_TACTIC', payload: MATCH_CONFIG.TACTICS.DEFENSIVE })}
          className={`tactic-btn defensive ${tactic === 'defensive' ? 'active' : ''}`}
          disabled={!simulating}
        >
          🛡️ Defensiva
        </button>
        <button 
          onClick={() => dispatch({ type: 'CHANGE_TACTIC', payload: MATCH_CONFIG.TACTICS.BALANCED })}
          className={`tactic-btn balanced ${tactic === 'balanced' ? 'active' : ''}`}
          disabled={!simulating}
        >
          ⚖️ Equilibrada
        </button>
        <button 
          onClick={() => dispatch({ type: 'CHANGE_TACTIC', payload: MATCH_CONFIG.TACTICS.OFFENSIVE })}
          className={`tactic-btn offensive ${tactic === 'offensive' ? 'active' : ''}`}
          disabled={!simulating}
        >
          ⚔️ Ofensiva
        </button>
      </div>
    </div>
  );
};