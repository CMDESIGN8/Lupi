// TacticalControls.jsx - VERSIÓN MEJORADA Y CORREGIDA
import React from 'react';
import '../../styles/TacticalControls.css';
import { MATCH_CONFIG } from './futsalConfig';

export const TacticalControls = ({ state, dispatch }) => {
  const { tactic, userFormation, simulating } = state;

  const handleTacticChange = (newTactic) => {
    dispatch({ type: 'CHANGE_TACTIC', payload: newTactic });
  };

  const handleFormationChange = (newFormation) => {
    dispatch({ type: 'CHANGE_FORMATION', payload: newFormation });
  };

  // Textos descriptivos para cada táctica
  const tacticDescriptions = {
    [MATCH_CONFIG.TACTICS.DEFENSIVE]: {
      short: '+ Entradas, - Disparos',
      long: 'Estructura sólida, prioriza la seguridad defensiva'
    },
    [MATCH_CONFIG.TACTICS.BALANCED]: {
      short: 'Balance ofensivo/defensivo',
      long: 'Juego versátil y adaptativo al desarrollo del partido'
    },
    [MATCH_CONFIG.TACTICS.OFFENSIVE]: {
      short: '+ Disparos, - Defensa',
      long: 'Presión constante y creación de oportunidades de gol'
    }
  };

  // Nombres amigables para formaciones
  const formationNames = {
    '2-1-1': '2-1-1 (Clásica)',
    '3-1': '3-1 (Defensiva)',
    '1-2-1': '1-2-1 (Ofensiva)'
  };

  return (
    <div className="tactical-controls">
      <h4>CONTROL TÁCTICO</h4>
      
      <div className="tactics-container">
        {/* Control de Formación */}
        <div className="formation-controls">
          <div className="formation-header">
            <span className="formation-label">Formación:</span>
            <div className="formation-display">
              <span className="formation-value">
                {formationNames[userFormation] || '2-1-1 (Clásica)'}
              </span>
            </div>
          </div>
          
          <div className="formation-selector">
            <select 
              value={userFormation} 
              onChange={(e) => handleFormationChange(e.target.value)}
              disabled={simulating}
              className="formation-dropdown"
            >
              {Object.entries(MATCH_CONFIG.FORMATIONS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de Táctica */}
        <div className="tactic-buttons">
          <button 
            onClick={() => handleTacticChange(MATCH_CONFIG.TACTICS.DEFENSIVE)}
            className={`tactic-btn defensive ${tactic === MATCH_CONFIG.TACTICS.DEFENSIVE ? 'active' : ''} ${simulating ? '' : 'disabled'}`}
            disabled={simulating}
          >
            <div className="tactic-icon">🛡️</div>
            <div className="tactic-content">
              <div className="tactic-name">Defensiva</div>
              <div className="tactic-short-desc">{tacticDescriptions[MATCH_CONFIG.TACTICS.DEFENSIVE].short}</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleTacticChange(MATCH_CONFIG.TACTICS.BALANCED)}
            className={`tactic-btn balanced ${tactic === MATCH_CONFIG.TACTICS.BALANCED ? 'active' : ''} ${simulating ? '' : 'disabled'}`}
            disabled={simulating}
          >
            <div className="tactic-icon">⚖️</div>
            <div className="tactic-content">
              <div className="tactic-name">Equilibrada</div>
              <div className="tactic-short-desc">{tacticDescriptions[MATCH_CONFIG.TACTICS.BALANCED].short}</div>
            </div>
          </button>
          
          <button 
            onClick={() => handleTacticChange(MATCH_CONFIG.TACTICS.OFFENSIVE)}
            className={`tactic-btn offensive ${tactic === MATCH_CONFIG.TACTICS.OFFENSIVE ? 'active' : ''} ${simulating ? '' : 'disabled'}`}
            disabled={simulating}
          >
            <div className="tactic-icon">⚔️</div>
            <div className="tactic-content">
              <div className="tactic-name">Ofensiva</div>
              <div className="tactic-short-desc">{tacticDescriptions[MATCH_CONFIG.TACTICS.OFFENSIVE].short}</div>
            </div>
          </button>
        </div>

        {/* Descripción de Táctica Actual */}
        <div className="tactic-description">
          <div className="tactic-description-text">
            {tactic ? tacticDescriptions[tactic].long : 'Selecciona una táctica para comenzar'}
          </div>
        </div>

        {/* Estado del Partido */}
        <div className="match-status">
          {!simulating ? (
            <div className="waiting-indicator">
              <div className="waiting-text">Esperando inicio del partido...</div>
            </div>
          ) : (
            <div className="active-indicator">
              <div className="active-pulse"></div>
              <div className="active-text">Táctica activa: <strong>{tactic}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
