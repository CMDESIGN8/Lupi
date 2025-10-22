// TacticalControls.jsx - VERSIÓN MEJORADA
import React from 'react';
import '../../styles/TacticalControls.css'; // Reutilizamos los estilos
import { MATCH_CONFIG } from './futsalConfig';

export const TacticalControls = ({ state, dispatch }) => {
  const { tactic, formation, simulating } = state;

  return (
    <div className="tactical-controls">
  <h4>CONTROL TÁCTICO</h4>
  
  <div className="tactics-container">
    {/* Display de formación */}
    <div className="formation-display">
      <div className="formation-label">Formación:</div>
      <div className="formation-value">{state.userFormation || '2-1-1'} (Clásica)</div>
    </div>

    {/* Botones de táctica */}
    <div className="tactic-buttons">
      <button 
        className={`tactic-btn defensive ${state.tactic === 'defensive' ? 'active' : ''}`}
        onClick={() => handleTacticChange('defensive')}
        disabled={state.simulating}
      >
        Defensivo
      </button>
      
      <button 
        className={`tactic-btn balanced ${state.tactic === 'balanced' ? 'active' : ''}`}
        onClick={() => handleTacticChange('balanced')}
        disabled={state.simulating}
      >
        Equilibrado
      </button>
      
      <button 
        className={`tactic-btn offensive ${state.tactic === 'offensive' ? 'active' : ''}`}
        onClick={() => handleTacticChange('offensive')}
        disabled={state.simulating}
      >
        Ofensivo
      </button>
    </div>

    {/* Descripción de táctica actual */}
    <div className="tactic-description">
      <p className="tactic-description-text">
        {state.tactic === 'defensive' && 'Estructura sólida, prioriza la seguridad defensiva y contraataques organizados'}
        {state.tactic === 'balanced' && 'Balance ofensivo/defensivo, juego versátil y adaptativo al desarrollo del partido'}
        {state.tactic === 'offensive' && 'Presión constante, ataque organizado y creación continua de oportunidades de gol'}
      </p>
    </div>

    {/* Indicador de estado */}
    {!state.simulating && (
      <div className="waiting-indicator">
        <p className="waiting-text">Esperando inicio del partido...</p>
      </div>
    )}
  </div>
</div>

  );
};


