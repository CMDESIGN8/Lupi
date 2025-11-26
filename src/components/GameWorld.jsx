// src/components/GameWorld.jsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainScene } from './game/scenes/MainScene';
import BattleScene from './game/scenes/BattleScene';
import { UIOverlay } from './game/ui/UIOverlay';
import '../styles/GameWorld.css';

export const GameWorld = ({ character, user, onNavigate }) => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [gameState, setGameState] = useState({
    showMenu: false,
    currentLocation: null,
    nearbyPlayers: [],
    availableActions: []
  });
  const [showMinigame, setShowMinigame] = useState(null);

  useEffect(() => {
    if (!character || phaserGameRef.current) return;

    // Configuración de Phaser
    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 1280,
      height: 720,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene, BattleScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Pasar datos del personaje a Phaser
    game.registry.set('character', character);
    game.registry.set('user', user);
    
    // Escuchar eventos del juego
    game.events.on('location-entered', (location) => {
      setGameState(prev => ({
        ...prev,
        currentLocation: location,
        availableActions: getLocationActions(location)
      }));
    });

    game.events.on('player-nearby', (players) => {
      setGameState(prev => ({ ...prev, nearbyPlayers: players }));
    });

    game.events.on('open-minigame', (minigameType) => {
      setShowMinigame(minigameType);
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [character, user]);

  const getLocationActions = (location) => {
    const actions = {
      'training_ground': ['Entrenar', 'Minijuego Futsal', 'Ver Estadísticas'],
      'market': ['Comprar Items', 'Vender Items', 'Ver Ofertas'],
      'club_house': ['Ver Club', 'Misiones de Club', 'Ranking'],
      'arena': ['Desafiar Jugador', 'Arena Bot', 'Torneos'],
      'exploration': ['Buscar Items', 'Explorar', 'Misiones']
    };
    return actions[location] || [];
  };

  const handleAction = (action) => {
    switch (action) {
      case 'Minijuego Futsal':
        setShowMinigame('futsal');
        break;
      case 'Ver Club':
        onNavigate('clubs');
        break;
      case 'Arena Bot':
        onNavigate('bot-match');
        break;
      case 'Entrenar':
        handleTraining();
        break;
      default:
        console.log('Acción:', action);
    }
  };

  const handleTraining = () => {
    if (phaserGameRef.current) {
      phaserGameRef.current.events.emit('start-training');
    }
  };

  const closeMinigame = () => {
    setShowMinigame(null);
    // Reanudar el juego de fondo
    if (phaserGameRef.current) {
      phaserGameRef.current.scene.resume('MainScene');
    }
  };

  return (
    <div className="game-world-container">
      {/* Canvas de Phaser */}
      <div id="game-container" ref={gameRef} />

      {/* UI Overlay sobre el canvas */}
      <UIOverlay
        character={character}
        gameState={gameState}
        onToggleMenu={() => setGameState(prev => ({ ...prev, showMenu: !prev.showMenu }))}
        onAction={handleAction}
      />

      {/* Minijuego Futsal en Modal */}
      {showMinigame === 'futsal' && (
        <div className="minigame-modal">
          <div className="minigame-container">
            <button className="close-minigame" onClick={closeMinigame}>
              ✕ Volver al Mundo
            </button>
            {/* Aquí se renderiza tu TrainingDashboard */}
            <div className="minigame-content">
              {/* Importarás y renderizarás TrainingDashboard aquí */}
            </div>
          </div>
        </div>
      )}

      {/* Menú de Pausa / Opciones */}
      {gameState.showMenu && (
        <div className="game-menu-overlay">
          <div className="game-menu">
            <h2>MENÚ</h2>
            <button onClick={() => onNavigate('dashboard')}>📊 Dashboard</button>
            <button onClick={() => onNavigate('clubs')}>🏆 Club</button>
            <button onClick={() => handleAction('Ver Estadísticas')}>📈 Estadísticas</button>
            <button onClick={() => setGameState(prev => ({ ...prev, showMenu: false }))}>
              ↩️ Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};