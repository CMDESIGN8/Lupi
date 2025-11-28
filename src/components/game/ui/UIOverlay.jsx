// src/components/game/ui/UIOverlay.jsx
import React, { useState, useEffect } from 'react';
import { LupicoinsDisplay } from './LupicoinsDisplay';
import '../../../styles/UIOverlay.css';

export const UIOverlay = ({ character, wallet, gameState, onToggleMenu, onAction }) => {
  const [showActions, setShowActions] = useState(false);
  const [currentWallet, setCurrentWallet] = useState(wallet);

  // Actualizar wallet cuando cambie
  useEffect(() => {
    setCurrentWallet(wallet);
  }, [wallet]);

  return (
    <div className="ui-overlay">
      {/* HUD Superior Compacto */}
      <div className="hud-top">
        <div className="player-info-compact">
          <div className="player-avatar-mini">⚽</div>
          <div className="player-data">
            <div className="player-name">{character.nickname}</div>
            <div className="player-level">Nv. {character.level}</div>
          </div>
          <div className="player-bars">
            <div className="mini-bar">
              <span>EXP</span>
              <div className="bar-fill exp" style={{ width: `${(character.experience / character.experience_to_next_level) * 100}%` }} />
            </div>
            <div className="mini-bar">
              <span>HP</span>
              <div className="bar-fill health" style={{ width: `${character.salud}%` }} />
            </div>
            <div className="mini-bar">
              <span>ENE</span>
              <div className="bar-fill energy" style={{ width: `${character.energia}%` }} />
            </div>
          </div>
        </div>

        <div className="resources-compact">
          {/* Display de Lupicoins en tiempo real */}
          <LupicoinsDisplay 
            userId={character.user_id} 
            characterId={character.id}
          />
          <div className="resource">⚡ <span>{character.available_skill_points}</span></div>
        </div>
      </div>
      
      {gameState.currentLocation && (
        <div className="location-indicator">
          📍 {getLocationName(gameState.currentLocation)}
        </div>
      )}

      {gameState.availableActions.length > 0 && (
        <div className="actions-panel">
          <button 
            className="actions-toggle"
            onClick={() => setShowActions(!showActions)}
          >
            {showActions ? '✕' : '⚙️'}
          </button>
          
          {showActions && (
            <div className="actions-list">
              {gameState.availableActions.map((action, index) => (
                <button
                  key={index}
                  className="action-btn"
                  onClick={() => {
                    onAction(action);
                    setShowActions(false);
                  }}
                >
                  {getActionIcon(action)} {action}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="hud-bottom">
        <div className="controls-hint">
          <kbd>WASD</kbd> Mover
          <kbd>E</kbd> Interactuar
        </div>

        <div className="quick-actions">
          <button className="quick-btn" onClick={onToggleMenu} title="Menú">☰</button>
          <button className="quick-btn" title="Inventario">🎒</button>
          <button className="quick-btn" title="Misiones">📋</button>
        </div>
      </div>

      <div className="minimap">
        <div className="minimap-title">MAPA</div>
        <div className="minimap-content">
          <div className="player-dot" />
        </div>
      </div>
    </div>
  );
};

// Las funciones getLocationName y getActionIcon permanecen igual
const getLocationName = (location) => {
  const names = {
    'training_ground': 'Entrenamiento',
    'arena': 'Arena',
    'market': 'Mercado',
    'club_house': 'Club',
    'exploration': 'Exploración'
  };
  return names[location] || location;
};

const getActionIcon = (action) => {
  const icons = {
    'Entrenar': '🏋️',
    'Minijuego Futsal': '⚽',
    'Ver Estadísticas': '📊',
    'Comprar Items': '🛒',
    'Ver Club': '🏆',
    'Desafiar Jugador': '⚔️',
    'Arena Bot': '🤖',
    'Buscar Items': '🔍',
    'Explorar': '🗺️'
  };
  return icons[action] || '•';
};