// TacticalControls.jsx - VERSIÓN MEJORADA
import React from 'react';
import { MATCH_CONFIG } from './futsalConfig';

export const TacticalControls = ({ state, dispatch }) => {
  const { tactic, formation, simulating } = state;

  return (
    <div className="tactical-controls">
      <h4>CONTROL TÁCTICO</h4>
      
      <div className="formation-controls">
        <label>Formación:</label>
        <select 
          value={formation} 
          onChange={(e) => dispatch({ type: 'CHANGE_FORMATION', payload: e.target.value })}
          disabled={simulating}
        >
          {Object.entries(MATCH_CONFIG.FORMATIONS).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
      </div>

      <div className="tactic-buttons">
        <button 
          onClick={() => dispatch({ type: 'CHANGE_TACTIC', payload: MATCH_CONFIG.TACTICS.DEFENSIVE })}
          className={`tactic-btn defensive ${tactic === 'defensive' ? 'active' : ''}`}
          disabled={!simulating}
        >
          🛡️ Defensiva
          <span>+ Entradas, - Disparos</span>
        </button>
        
        <button 
          onClick={() => dispatch({ type: 'CHANGE_TACTIC', payload: MATCH_CONFIG.TACTICS.BALANCED })}
          className={`tactic-btn balanced ${tactic === 'balanced' ? 'active' : ''}`}
          disabled={!simulating}
        >
          ⚖️ Equilibrada
          <span>Balance ofensivo/defensivo</span>
        </button>
        
        <button 
          onClick={() => dispatch({ type: 'CHANGE_TACTIC', payload: MATCH_CONFIG.TACTICS.OFFENSIVE })}
          className={`tactic-btn offensive ${tactic === 'offensive' ? 'active' : ''}`}
          disabled={!simulating}
        >
          ⚔️ Ofensiva
          <span>+ Disparos, - Defensa</span>
        </button>
      </div>
    </div>
  );
};
