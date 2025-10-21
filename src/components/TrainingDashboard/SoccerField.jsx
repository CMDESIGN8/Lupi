// SoccerField.jsx - Versión simplificada y funcional
import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state, dispatch }) => {
  const { 
    simulating, 
    possession, 
    userFormation = '2-1-1', 
    matchEvents,
    character,
    selectedBot 
  } = state;
  
  const [gameState, setGameState] = useState({
    players: [],
    ball: { x: 50, y: 50, withPlayer: null, visible: true },
    currentAction: null
  });

  const lastEventRef = useRef(null);

  // Configuración de posiciones base
  const formationConfigs = {
    '2-1-1': {
      user: [
        { id: 'user-gk', position: 'GK', x: 10, y: 50, number: '1' },
        { id: 'user-df1', position: 'DF', x: 25, y: 30, number: '2' },
        { id: 'user-df2', position: 'DF', x: 25, y: 70, number: '3' },
        { id: 'user-mf', position: 'MF', x: 45, y: 50, number: '4' },
        { id: 'user-fw', position: 'FW', x: 65, y: 50, number: '5' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', x: 90, y: 50, number: '1' },
        { id: 'bot-df1', position: 'DF', x: 75, y: 30, number: '2' },
        { id: 'bot-df2', position: 'DF', x: 75, y: 70, number: '3' },
        { id: 'bot-mf', position: 'MF', x: 55, y: 50, number: '4' },
        { id: 'bot-fw', position: 'FW', x: 35, y: 50, number: '5' }
      ]
    },
    '3-1': {
      user: [
        { id: 'user-gk', position: 'GK', x: 10, y: 50, number: '1' },
        { id: 'user-df1', position: 'DF', x: 22, y: 25, number: '2' },
        { id: 'user-df2', position: 'DF', x: 22, y: 50, number: '3' },
        { id: 'user-df3', position: 'DF', x: 22, y: 75, number: '4' },
        { id: 'user-fw', position: 'FW', x: 60, y: 50, number: '5' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', x: 90, y: 50, number: '1' },
        { id: 'bot-df1', position: 'DF', x: 78, y: 25, number: '2' },
        { id: 'bot-df2', position: 'DF', x: 78, y: 50, number: '3' },
        { id: 'bot-df3', position: 'DF', x: 78, y: 75, number: '4' },
        { id: 'bot-fw', position: 'FW', x: 40, y: 50, number: '5' }
      ]
    }
  };

  // Inicializar jugadores
  const initializePlayers = () => {
    const config = formationConfigs[userFormation] || formationConfigs['2-1-1'];
    const userPlayers = config.user.map(p => ({ ...p, team: 'user', hasBall: false }));
    const botPlayers = config.bot.map(p => ({ ...p, team: 'bot', hasBall: false }));
    
    // Dar balón al delantero del equipo con posesión
    const allPlayers = [...userPlayers, ...botPlayers];
    const playerWithBall = possession === 'user' 
      ? allPlayers.find(p => p.id === 'user-fw')
      : allPlayers.find(p => p.id === 'bot-fw');
    
    if (playerWithBall) {
      playerWithBall.hasBall = true;
    }
    
    return allPlayers;
  };

  // Efecto para inicializar
  useEffect(() => {
    if (simulating && gameState.players.length === 0) {
      setGameState({
        players: initializePlayers(),
        ball: { x: 50, y: 50, withPlayer: null, visible: true },
        currentAction: null
      });
    }
  }, [simulating]);

  // Efecto para manejar eventos del partido
  useEffect(() => {
    if (simulating && matchEvents.length > 0) {
      const latestEvent = matchEvents[0];
      
      // Evitar procesar el mismo evento múltiples veces
      if (latestEvent.id !== lastEventRef.current) {
        lastEventRef.current = latestEvent.id;
        handleMatchEvent(latestEvent);
      }
    }
  }, [matchEvents, simulating]);

  // Manejar evento del partido
  const handleMatchEvent = (event) => {
    setGameState(prev => {
      const players = [...prev.players];
      
      // Resetear balón de todos los jugadores
      players.forEach(p => p.hasBall = false);
      
      let newBallPosition = { ...prev.ball };
      let currentAction = event.type;
      
      switch (event.type) {
        case 'pass':
          // Mover balón hacia un compañero
          const passer = players.find(p => p.hasBall);
          if (passer) {
            passer.hasBall = false;
            // Encontrar un compañero para pasar
            const receiver = players.find(p => 
              p.team === passer.team && 
              p.id !== passer.id && 
              p.position !== 'GK'
            );
            if (receiver) {
              receiver.hasBall = true;
              newBallPosition = { 
                x: receiver.x, 
                y: receiver.y, 
                withPlayer: receiver.id, 
                visible: true 
              };
            }
          }
          break;
          
        case 'dribble':
          // Jugador con balón se mueve hacia adelante
          const dribbler = players.find(p => p.hasBall);
          if (dribbler) {
            const direction = dribbler.team === 'user' ? 1 : -1;
            dribbler.x = Math.max(10, Math.min(90, dribbler.x + (direction * 8)));
            dribbler.y = Math.max(15, Math.min(85, dribbler.y + (Math.random() - 0.5) * 20));
            newBallPosition = { 
              x: dribbler.x, 
              y: dribbler.y, 
              withPlayer: dribbler.id, 
              visible: true 
            };
          }
          break;
          
        case 'shot':
          // Animación de tiro
          const shooter = players.find(p => p.hasBall);
          if (shooter) {
            shooter.hasBall = false;
            currentAction = 'shooting';
            // Trayectoria del tiro hacia la portería
            const goalX = shooter.team === 'user' ? 92 : 8;
            const goalY = 45 + Math.random() * 10;
            
            setTimeout(() => {
              setGameState(prev => ({
                ...prev,
                ball: { x: goalX, y: goalY, withPlayer: null, visible: true },
                currentAction: null
              }));
            }, 500);
          }
          break;
          
        case 'goal':
          // ¡GOOOL!
          currentAction = 'goal';
          setTimeout(() => {
            setGameState(prev => ({
              players: initializePlayers(),
              ball: { x: 50, y: 50, withPlayer: null, visible: true },
              currentAction: null
            }));
          }, 2000);
          break;
          
        case 'save':
          // Portero ataja
          const goalkeeper = players.find(p => p.position === 'GK' && p.team !== event.team);
          if (goalkeeper) {
            goalkeeper.hasBall = true;
            newBallPosition = { 
              x: goalkeeper.x, 
              y: goalkeeper.y, 
              withPlayer: goalkeeper.id, 
              visible: true 
            };
            currentAction = 'save';
          }
          break;
          
        case 'tackle':
          // Cambio de posesión
          const tackler = players.find(p => p.team === event.team && p.position !== 'GK');
          if (tackler) {
            tackler.hasBall = true;
            newBallPosition = { 
              x: tackler.x, 
              y: tackler.y, 
              withPlayer: tackler.id, 
              visible: true 
            };
          }
          break;
          
        default:
          break;
      }
      
      return {
        ...prev,
        players,
        ball: newBallPosition,
        currentAction
      };
    });
  };

  // Encontrar jugador con balón
  const getPlayerWithBall = () => {
    return gameState.players.find(p => p.hasBall);
  };

  const playerWithBall = getPlayerWithBall();

  return (
    <div className="soccer-field futsal-professional">
      <div className="field-surface">
        {/* Líneas del campo */}
        <div className="field-line touch-line top"></div>
        <div className="field-line touch-line bottom"></div>
        <div className="field-line goal-line left"></div>
        <div className="field-line goal-line right"></div>
        <div className="field-line halfway-line"></div>
        
        <div className="center-circle"></div>
        <div className="center-mark"></div>
        
        {/* Áreas de penal */}
        <div className="penalty-area left">
          <div className="penalty-mark"></div>
          <div className="penalty-arc"></div>
        </div>
        <div className="penalty-area right">
          <div className="penalty-mark"></div>
          <div className="penalty-arc"></div>
        </div>

        {/* Arcos */}
        <div className="goal-frame left"></div>
        <div className="goal-frame right"></div>
        <div className="goal-net left"></div>
        <div className="goal-net right"></div>

        {simulating ? (
          <>
            {/* Jugadores */}
            {gameState.players.map((player) => (
              <div 
                key={player.id}
                className={`player ${player.team} ${player.position} ${player.hasBall ? 'with-ball' : ''}`}
                style={{ 
                  left: `${player.x}%`,
                  top: `${player.y}%`
                }}
              >
                <div className="player-number">{player.number}</div>
                <div className="player-glow"></div>
                {player.hasBall && <div className="ball-holder"></div>}
              </div>
            ))}

            {/* Balón */}
            <div 
              className={`soccer-ball ${gameState.currentAction || 'idle'} ${playerWithBall ? 'with-player' : 'free'}`}
              style={{
                left: `${gameState.ball.x}%`,
                top: `${gameState.ball.y}%`,
                transition: gameState.currentAction === 'shooting' ? 'all 0.5s ease-out' : 'all 0.3s ease'
              }}
            >
              <div className="ball-seams"></div>
            </div>

            {/* Efectos especiales */}
            {gameState.currentAction === 'goal' && (
              <div className="goal-effect">
                <div className="goal-explosion"></div>
                <div className="goal-text">¡GOOOL!</div>
              </div>
            )}

            {gameState.currentAction === 'save' && (
              <div className="save-effect">
                <div className="save-sparkle"></div>
              </div>
            )}

            {/* HUD del partido */}
            <div className="match-hud">
              <div className="possession-display">
                <span className={`team ${possession}`}>
                  {possession === 'user' ? character?.name : selectedBot?.name}
                </span>
                <span> tiene la posesión</span>
              </div>
              <div className="action-indicator">
                {gameState.currentAction === 'pass' && '⚽ PASE'}
                {gameState.currentAction === 'dribble' && '🌀 REGATE'}
                {gameState.currentAction === 'shot' && '🎯 TIRO!'}
                {gameState.currentAction === 'shooting' && '🚀 DISPARO...'}
                {gameState.currentAction === 'goal' && '🥅 ¡GOOOL!'}
                {gameState.currentAction === 'save' && '✋ ¡PARADA!'}
                {gameState.currentAction === 'tackle' && '⚔️ RECUPERA'}
                {!gameState.currentAction && playerWithBall && '⏹️ EN POSESIÓN'}
                {!gameState.currentAction && !playerWithBall && '🎯 BALÓN SUELTO'}
              </div>
            </div>
          </>
        ) : (
          <div className="pre-match">
            <div className="pre-match-content">
              <h3>FÚTSAL SIMULATOR</h3>
              <p>Campo listo para el partido</p>
              <div className="formation-preview">
                <div className="formation-user">Tu formación: {userFormation}</div>
                <div className="formation-bot">Preparado para comenzar</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
