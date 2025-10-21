// SoccerField.jsx - Versión Mejorada
import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { 
    simulating, 
    possession, 
    userFormation = '2-1-1', 
    botFormation = '2-1-1', 
    matchEvents,
    character,
    selectedBot 
  } = state;
  
  const [gameState, setGameState] = useState({
    players: [],
    ball: { x: 50, y: 50, withPlayer: null, visible: true },
    currentAction: null,
    animationInProgress: false,
    goalCelebration: false
  });

  const animationRef = useRef(null);

  // Configuraciones de formaciones mejoradas
  const getFormationPositions = (team, formation, hasPossession) => {
    const basePositions = {
      'user': {
        '2-1-1': [
          { id: 'user-gk', position: 'GK', baseX: 8, baseY: 50, number: '1', name: 'PORTERO' },
          { id: 'user-df1', position: 'DF', baseX: 25, baseY: 30, number: '2', name: 'DEFENSA' },
          { id: 'user-df2', position: 'DF', baseX: 25, baseY: 70, number: '3', name: 'DEFENSA' },
          { id: 'user-mf', position: 'MF', baseX: 45, baseY: 50, number: '4', name: 'MEDIO' },
          { id: 'user-fw', position: 'FW', baseX: 65, baseY: 50, number: '5', name: 'DELANTERO' }
        ],
        '3-1': [
          { id: 'user-gk', position: 'GK', baseX: 8, baseY: 50, number: '1', name: 'PORTERO' },
          { id: 'user-df1', position: 'DF', baseX: 22, baseY: 25, number: '2', name: 'DEFENSA' },
          { id: 'user-df2', position: 'DF', baseX: 22, baseY: 50, number: '3', name: 'DEFENSA' },
          { id: 'user-df3', position: 'DF', baseX: 22, baseY: 75, number: '4', name: 'DEFENSA' },
          { id: 'user-fw', position: 'FW', baseX: 60, baseY: 50, number: '5', name: 'DELANTERO' }
        ],
        '1-2-1': [
          { id: 'user-gk', position: 'GK', baseX: 8, baseY: 50, number: '1', name: 'PORTERO' },
          { id: 'user-df', position: 'DF', baseX: 20, baseY: 50, number: '2', name: 'DEFENSA' },
          { id: 'user-mf1', position: 'MF', baseX: 40, baseY: 35, number: '3', name: 'MEDIO' },
          { id: 'user-mf2', position: 'MF', baseX: 40, baseY: 65, number: '4', name: 'MEDIO' },
          { id: 'user-fw', position: 'FW', baseX: 65, baseY: 50, number: '5', name: 'DELANTERO' }
        ]
      },
      'bot': {
        '2-1-1': [
          { id: 'bot-gk', position: 'GK', baseX: 92, baseY: 50, number: '1', name: 'PORTERO' },
          { id: 'bot-df1', position: 'DF', baseX: 75, baseY: 30, number: '2', name: 'DEFENSA' },
          { id: 'bot-df2', position: 'DF', baseX: 75, baseY: 70, number: '3', name: 'DEFENSA' },
          { id: 'bot-mf', position: 'MF', baseX: 55, baseY: 50, number: '4', name: 'MEDIO' },
          { id: 'bot-fw', position: 'FW', baseX: 35, baseY: 50, number: '5', name: 'DELANTERO' }
        ],
        '3-1': [
          { id: 'bot-gk', position: 'GK', baseX: 92, baseY: 50, number: '1', name: 'PORTERO' },
          { id: 'bot-df1', position: 'DF', baseX: 78, baseY: 25, number: '2', name: 'DEFENSA' },
          { id: 'bot-df2', position: 'DF', baseX: 78, baseY: 50, number: '3', name: 'DEFENSA' },
          { id: 'bot-df3', position: 'DF', baseX: 78, baseY: 75, number: '4', name: 'DEFENSA' },
          { id: 'bot-fw', position: 'FW', baseX: 40, baseY: 50, number: '5', name: 'DELANTERO' }
        ],
        '1-2-1': [
          { id: 'bot-gk', position: 'GK', baseX: 92, baseY: 50, number: '1', name: 'PORTERO' },
          { id: 'bot-df', position: 'DF', baseX: 80, baseY: 50, number: '2', name: 'DEFENSA' },
          { id: 'bot-mf1', position: 'MF', baseX: 60, baseY: 35, number: '3', name: 'MEDIO' },
          { id: 'bot-mf2', position: 'MF', baseX: 60, baseY: 65, number: '4', name: 'MEDIO' },
          { id: 'bot-fw', position: 'FW', baseX: 35, baseY: 50, number: '5', name: 'DELANTERO' }
        ]
      }
    };

    return basePositions[team][formation].map(player => ({
      ...player,
      team: team,
      x: player.baseX,
      y: player.baseY,
      targetX: player.baseX,
      targetY: player.baseY,
      hasBall: false,
      isMoving: false
    }));
  };

  // Inicializar jugadores
  const initializePlayers = () => {
    const userPlayers = getFormationPositions('user', userFormation, possession === 'user');
    const botPlayers = getFormationPositions('bot', botFormation, possession === 'bot');
    
    // Dar el balón al delantero del equipo con posesión inicial
    const players = [...userPlayers, ...botPlayers];
    const initialPlayerWithBall = possession === 'user' 
      ? players.find(p => p.id === 'user-fw')
      : players.find(p => p.id === 'bot-fw');
    
    if (initialPlayerWithBall) {
      initialPlayerWithBall.hasBall = true;
    }
    
    return players;
  };

  // Encontrar compañero para pasar
  const findPassTarget = (currentPlayer, players) => {
    const teammates = players.filter(p => 
      p.team === currentPlayer.team && 
      p.id !== currentPlayer.id &&
      !p.hasBall
    );

    if (teammates.length === 0) return null;

    // Priorizar jugadores en mejor posición (más adelantados para ataque)
    const sortedTeammates = teammates.sort((a, b) => {
      const aScore = a.baseX * (currentPlayer.team === 'user' ? 1 : -1);
      const bScore = b.baseX * (currentPlayer.team === 'user' ? 1 : -1);
      return bScore - aScore;
    });

    return sortedTeammates[0];
  };

  // Simular pase entre jugadores
  const simulatePass = (fromPlayer, toPlayer, currentPlayers) => {
    return new Promise((resolve) => {
      setGameState(prev => ({
        ...prev,
        animationInProgress: true,
        currentAction: {
          type: 'pass',
          fromPlayer: fromPlayer.id,
          toPlayer: toPlayer.id,
          startX: fromPlayer.x,
          startY: fromPlayer.y,
          endX: toPlayer.x,
          endY: toPlayer.y
        }
      }));

      // Animación del pase
      const startTime = Date.now();
      const duration = 800;

      const animatePass = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animatePass);
        } else {
          // Finalizar pase
          const updatedPlayers = currentPlayers.map(p => ({
            ...p,
            hasBall: p.id === toPlayer.id
          }));

          setGameState(prev => ({
            ...prev,
            players: updatedPlayers,
            ball: {
              ...prev.ball,
              withPlayer: toPlayer.id,
              x: toPlayer.x,
              y: toPlayer.y
            },
            animationInProgress: false,
            currentAction: null
          }));

          resolve();
        }
      };

      animatePass();
    });
  };

  // Simular tiro al arco
  const simulateShot = (shooter, currentPlayers) => {
    return new Promise((resolve) => {
      const isUserTeam = shooter.team === 'user';
      const goalX = isUserTeam ? 95 : 5;
      const goalY = 40 + Math.random() * 20; // Apuntar al centro del arco

      setGameState(prev => ({
        ...prev,
        animationInProgress: true,
        currentAction: {
          type: 'shot',
          fromPlayer: shooter.id,
          targetX: goalX,
          targetY: goalY,
          power: 1.0
        }
      }));

      const startTime = Date.now();
      const duration = 600;

      const animateShot = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateShot);
        } else {
          // Determinar si es gol o atajada
          const isGoal = Math.random() > 0.4; // 60% probabilidad de gol para demo

          if (isGoal) {
            // ¡GOOOL!
            setGameState(prev => ({
              ...prev,
              goalCelebration: true,
              ball: { x: goalX, y: goalY, withPlayer: null, visible: false },
              animationInProgress: false,
              currentAction: { type: 'goal', team: shooter.team }
            }));

            // Reset después del gol
            setTimeout(() => {
              setGameState(prev => ({
                ...prev,
                players: initializePlayers(),
                ball: { x: 50, y: 50, withPlayer: null, visible: true },
                goalCelebration: false,
                currentAction: null
              }));
              resolve('goal');
            }, 2000);
          } else {
            // El portero ataja
            const goalkeeper = currentPlayers.find(p => 
              p.position === 'GK' && p.team !== shooter.team
            );

            setGameState(prev => ({
              ...prev,
              players: prev.players.map(p => 
                p.id === goalkeeper.id ? { ...p, hasBall: true } : p
              ),
              ball: {
                ...prev.ball,
                withPlayer: goalkeeper.id,
                x: goalkeeper.x,
                y: goalkeeper.y
              },
              animationInProgress: false,
              currentAction: { type: 'save', byPlayer: goalkeeper.id }
            }));

            resolve('save');
          }
        }
      };

      animateShot();
    });
  };

  // Simular regate
  const simulateDribble = (player, currentPlayers) => {
    return new Promise((resolve) => {
      const direction = player.team === 'user' ? 1 : -1;
      const newX = Math.max(5, Math.min(95, player.x + direction * 8));
      const newY = Math.max(10, Math.min(90, player.y + (Math.random() - 0.5) * 20));

      setGameState(prev => ({
        ...prev,
        animationInProgress: true,
        currentAction: {
          type: 'dribble',
          player: player.id,
          startX: player.x,
          startY: player.y,
          endX: newX,
          endY: newY
        }
      }));

      const startTime = Date.now();
      const duration = 500;

      const animateDribble = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateDribble);
        } else {
          const updatedPlayers = currentPlayers.map(p => 
            p.id === player.id 
              ? { ...p, x: newX, y: newY }
              : p
          );

          setGameState(prev => ({
            ...prev,
            players: updatedPlayers,
            ball: {
              ...prev.ball,
              x: newX,
              y: newY
            },
            animationInProgress: false,
            currentAction: null
          }));

          resolve();
        }
      };

      animateDribble();
    });
  };

  // Lógica principal del juego
  const gameLoop = async () => {
    if (gameState.animationInProgress || gameState.goalCelebration) return;

    const currentPlayers = [...gameState.players];
    const playerWithBall = currentPlayers.find(p => p.hasBall);

    if (playerWithBall) {
      const actionRoll = Math.random();

      if (actionRoll < 0.5) {
        // Pasar (50% probabilidad)
        const passTarget = findPassTarget(playerWithBall, currentPlayers);
        if (passTarget) {
          await simulatePass(playerWithBall, passTarget, currentPlayers);
        }
      } else if (actionRoll < 0.8) {
        // Tirar (30% probabilidad) - solo si está en posición de tiro
        const isInShootingPosition = playerWithBall.team === 'user' 
          ? playerWithBall.x > 60 
          : playerWithBall.x < 40;
        
        if (isInShootingPosition || Math.random() < 0.3) {
          await simulateShot(playerWithBall, currentPlayers);
        } else {
          // Si no puede tirar, regatea
          await simulateDribble(playerWithBall, currentPlayers);
        }
      } else {
        // Regatear (20% probabilidad)
        await simulateDribble(playerWithBall, currentPlayers);
      }
    } else {
      // Balón suelto - buscar jugador más cercano
      const closestPlayer = currentPlayers.reduce((closest, player) => {
        const distance = Math.sqrt(
          Math.pow(player.x - gameState.ball.x, 2) + 
          Math.pow(player.y - gameState.ball.y, 2)
        );
        
        if (!closest || distance < closest.distance) {
          return { player, distance };
        }
        return closest;
      }, null);

      if (closestPlayer && closestPlayer.distance < 10) {
        // El jugador toma el balón
        const updatedPlayers = currentPlayers.map(p => ({
          ...p,
          hasBall: p.id === closestPlayer.player.id
        }));

        setGameState(prev => ({
          ...prev,
          players: updatedPlayers,
          ball: {
            ...prev.ball,
            withPlayer: closestPlayer.player.id,
            x: closestPlayer.player.x,
            y: closestPlayer.player.y
          }
        }));
      }
    }
  };

  // Efecto principal de simulación
  useEffect(() => {
    if (simulating) {
      if (gameState.players.length === 0) {
        setGameState({
          players: initializePlayers(),
          ball: { x: 50, y: 50, withPlayer: null, visible: true },
          currentAction: null,
          animationInProgress: false,
          goalCelebration: false
        });
      } else {
        const gameInterval = setInterval(() => {
          gameLoop();
        }, 1500); // Velocidad del juego

        return () => clearInterval(gameInterval);
      }
    } else {
      // Limpiar al detener simulación
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [simulating, gameState.players.length, gameState.animationInProgress]);

  // Actualizar balón durante animaciones
  useEffect(() => {
    if (gameState.currentAction && gameState.animationInProgress) {
      const action = gameState.currentAction;
      
      if (action.type === 'pass' || action.type === 'shot' || action.type === 'dribble') {
        const startTime = Date.now();
        const duration = action.type === 'shot' ? 600 : 800;
        
        const animateBall = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          let currentX, currentY;
          
          if (action.type === 'pass' || action.type === 'dribble') {
            currentX = action.startX + (action.endX - action.startX) * progress;
            currentY = action.startY + (action.endY - action.startY) * progress;
          } else if (action.type === 'shot') {
            // Trayectoria curva para el tiro
            currentX = action.startX + (action.targetX - action.startX) * progress;
            currentY = action.startY + (action.targetY - action.startY) * progress;
            // Agregar efecto de curva
            const curve = Math.sin(progress * Math.PI) * 5;
            currentY += curve;
          }
          
          setGameState(prev => ({
            ...prev,
            ball: {
              ...prev.ball,
              x: currentX,
              y: currentY,
              withPlayer: null
            }
          }));
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animateBall);
          }
        };
        
        animateBall();
      }
    }
  }, [gameState.currentAction, gameState.animationInProgress]);

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
                className={`player ${player.team} ${player.position} ${player.hasBall ? 'with-ball' : ''} ${gameState.currentAction?.type || 'idle'}`}
                style={{ 
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  transition: gameState.animationInProgress ? 'none' : 'all 0.3s ease'
                }}
              >
                <div className="player-number">{player.number}</div>
                <div className="player-glow"></div>
                {player.hasBall && <div className="ball-holder"></div>}
              </div>
            ))}

            {/* Balón */}
            {gameState.ball.visible && (
              <div 
                className={`soccer-ball ${gameState.currentAction?.type || 'idle'} ${gameState.ball.withPlayer ? 'with-player' : 'free'}`}
                style={{
                  left: `${gameState.ball.x}%`,
                  top: `${gameState.ball.y}%`
                }}
              >
                <div className="ball-seams"></div>
              </div>
            )}

            {/* Efectos de animación */}
            {gameState.currentAction && (
              <>
                {gameState.currentAction.type === 'pass' && (
                  <div 
                    className="pass-trail"
                    style={{
                      left: `${gameState.currentAction.startX}%`,
                      top: `${gameState.currentAction.startY}%`,
                      width: `${Math.sqrt(
                        Math.pow(gameState.currentAction.endX - gameState.currentAction.startX, 2) +
                        Math.pow(gameState.currentAction.endY - gameState.currentAction.startY, 2)
                      ) * 1.5}%`,
                      transform: `rotate(${Math.atan2(
                        gameState.currentAction.endY - gameState.currentAction.startY,
                        gameState.currentAction.endX - gameState.currentAction.startX
                      ) * 180 / Math.PI}deg)`
                    }}
                  />
                )}
                
                {gameState.currentAction.type === 'goal' && (
                  <div className="goal-effect">
                    <div className="goal-explosion"></div>
                    <div className="goal-text">¡GOOOL!</div>
                  </div>
                )}
                
                {gameState.currentAction.type === 'save' && (
                  <div className="save-effect">
                    <div className="save-sparkle"></div>
                  </div>
                )}
              </>
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
                {gameState.currentAction?.type === 'pass' && '⚽ PASE →'}
                {gameState.currentAction?.type === 'shot' && '🎯 TIRO A PUERTA!'}
                {gameState.currentAction?.type === 'dribble' && '🌀 AVANZANDO'}
                {gameState.currentAction?.type === 'goal' && '🥅 ¡GOOOL!'}
                {gameState.currentAction?.type === 'save' && '✋ ¡ATAJADA!'}
                {!gameState.currentAction && '⏳ EN JUEGO...'}
              </div>
            </div>
          </>
        ) : (
          <div className="pre-match">
            <div className="pre-match-content">
              <h3>FÚTSAL SIMULATOR PRO</h3>
              <p>Campo listo para el partido</p>
              <div className="formation-preview">
                <div className="formation-user">Tu formación: {userFormation}</div>
                <div className="formation-bot">Rival: {botFormation}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
