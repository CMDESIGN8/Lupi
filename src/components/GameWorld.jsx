import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainScene } from './game/scenes/MainScene';
import { BattleScene } from './game/scenes/BattleScene'; 
import { UIOverlay } from './game/ui/UIOverlay';
import { gameService } from '../services/gameService'; 
import '../styles/GameWorld.css';

// CORRECCIÓN CLAVE: Recibir la prop 'club'
export const GameWorld = ({ character, wallet, user, club, onNavigate }) => { 
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
      width: window.innerWidth,
      height: window.innerHeight,
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
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // --- INYECCIÓN DE DATOS Y SERVICIOS ---
    
    // 1. Datos estáticos iniciales
    game.registry.set('character', character);
    game.registry.set('user', user);
    game.registry.set('wallet', wallet);
    game.registry.set('clubData', club); 

    // 2. Inyectar funciones de servicio para que las Escenas puedan llamar a la BD
    game.registry.set('services', {
      saveProgress: (characterId, x, y, loc) => gameService.saveProgress(characterId, x, y, loc),
      getItems: () => gameService.getUserItems(user.id),
      getClubDetails: (clubId) => gameService.getClubDetails(clubId), 
      getRanking: () => gameService.getTopPlayers(),
      getWallet: (characterId) => gameService.getWallet(characterId),
      updateLupicoins: (characterId, amount) => gameService.updateLupicoins(characterId, amount),
      addLupicoins: (characterId, amount, reason) => gameService.addLupicoins(characterId, amount, reason)
    });
    
    // --------------------------------------

    // Escuchar eventos del juego (Phaser -> React)
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
      if (game.scene.isActive('MainScene')) {
        game.scene.pause('MainScene');
      }
    });

    game.events.on('navigate', (destination) => {
      onNavigate(destination);
    });

    return () => {
      if (phaserGameRef.current) {
        // Guardar posición al desmontar componente
        const mainScene = phaserGameRef.current.scene.getScene('MainScene');
        if (mainScene && mainScene.player) {
           gameService.saveProgress(
             character.id, 
             mainScene.player.x, 
             mainScene.player.y, 
             mainScene.currentLocation
           );
        }
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [character, user, club, onNavigate]); // Añadir 'club' a las dependencias si lo usas en el effect

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
    if (phaserGameRef.current) {
      phaserGameRef.current.scene.resume('MainScene');
    }
  };

  return (
    <div className="game-world-container">
      <div id="game-container" ref={gameRef} />
      
      <UIOverlay
        character={character}
        gameState={gameState}
        onToggleMenu={() => setGameState(prev => ({ ...prev, showMenu: !prev.showMenu }))}
        onAction={handleAction}
      />

      {showMinigame === 'futsal' && (
        <div className="minigame-modal">
          <div className="minigame-container">
            <button className="close-minigame" onClick={closeMinigame}>
              ✕ Volver al Mundo
            </button>
            <div className="minigame-content">
               <h2 style={{color: 'white', textAlign: 'center', marginTop: '20px'}}>
                 Minijuego de Futsal Cargando...
               </h2>
            </div>
          </div>
        </div>
      )}

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