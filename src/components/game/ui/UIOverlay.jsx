// src/components/game/ui/UIOverlay.jsx
import React, { useState } from 'react';
import '../../../styles/UIOverlay.css';

export const UIOverlay = ({ character, gameState, onToggleMenu, onAction }) => {
  const [showActions, setShowActions] = useState(false);
  const [showQuickStats, setShowQuickStats] = useState(true);

  return (
    <div className="ui-overlay">
      {/* HUD Superior */}
      <div className="hud-top">
        <div className="player-info-hud">
          <div className="avatar-mini">
            <div className="avatar-icon">⚽</div>
            <div className="level-badge">{character.level}</div>
          </div>
          <div className="player-stats-mini">
            <div className="stat-name">{character.nickname}</div>
            <div className="stat-bars">
              <div className="stat-bar">
                <div className="stat-label">EXP</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill exp" 
                    style={{ width: `${(character.experience / character.experience_to_next_level) * 100}%` }}
                  />
                </div>
                <div className="stat-value">{character.experience}/{character.experience_to_next_level}</div>
              </div>
              <div className="stat-bar">
                <div className="stat-label">❤️</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill health" 
                    style={{ width: `${character.salud}%` }}
                  />
                </div>
                <div className="stat-value">{character.salud}%</div>
              </div>
              <div className="stat-bar">
                <div className="stat-label">⚡</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill energy" 
                    style={{ width: `${character.energia}%` }}
                  />
                </div>
                <div className="stat-value">{character.energia}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="resources-hud">
          <div className="resource-item">
            <span className="resource-icon">💰</span>
            <span className="resource-amount">Loading...</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">⚡</span>
            <span className="resource-amount">{character.available_skill_points}</span>
          </div>
        </div>
      </div>

      {/* Ubicación Actual */}
      {gameState.currentLocation && (
        <div className="location-indicator">
          <div className="location-icon">📍</div>
          <div className="location-name">
            {getLocationName(gameState.currentLocation)}
          </div>
        </div>
      )}

      {/* Acciones Disponibles */}
      {gameState.availableActions.length > 0 && (
        <div className="actions-panel">
          <button 
            className="actions-toggle"
            onClick={() => setShowActions(!showActions)}
          >
            {showActions ? '✕ Cerrar' : '⚙️ Acciones'}
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

      {/* Controles Inferiores */}
      <div className="hud-bottom">
        <div className="controls-hint">
          <div className="control-item">
            <kbd>WASD</kbd> <span>Mover</span>
          </div>
          <div className="control-item">
            <kbd>E</kbd> <span>Interactuar</span>
          </div>
          <div className="control-item">
            <kbd>ESC</kbd> <span>Menú</span>
          </div>
        </div>

        <div className="quick-actions">
          <button className="quick-btn" onClick={onToggleMenu} title="Menú Principal">
            ☰
          </button>
          <button className="quick-btn" title="Inventario">
            🎒
          </button>
          <button className="quick-btn" title="Misiones">
            📋
          </button>
          <button className="quick-btn" title="Mapa">
            🗺️
          </button>
        </div>
      </div>

      {/* Mini Mapa */}
      <div className="minimap">
        <div className="minimap-title">MAPA</div>
        <div className="minimap-content">
          <div className="player-dot" style={{ left: '50%', top: '50%' }} />
          {/* Aquí se renderizarían puntos de interés */}
        </div>
      </div>

      {/* Notificaciones */}
      <div className="notifications-container">
        {/* Las notificaciones aparecerían aquí dinámicamente */}
      </div>
    </div>
  );
};

const getLocationName = (location) => {
  const names = {
    'training_ground': 'Campo de Entrenamiento',
    'arena': 'Arena de Combate',
    'market': 'Mercado',
    'club_house': 'Casa del Club',
    'exploration': 'Zona de Exploración'
  };
  return names[location] || location;
};

const getActionIcon = (action) => {
  const icons = {
    'Entrenar': '🏋️',
    'Minijuego Futsal': '⚽',
    'Ver Estadísticas': '📊',
    'Comprar Items': '🛒',
    'Vender Items': '💰',
    'Ver Club': '🏆',
    'Desafiar Jugador': '⚔️',
    'Arena Bot': '🤖',
    'Buscar Items': '🔍',
    'Explorar': '🗺️',
    'Misiones': '📋'
  };
  return icons[action] || '•';
};