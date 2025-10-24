// SoccerField.jsx - VERSIÓN CORREGIDA PARA SAQUE DE CENTRO DESPUÉS DEL GOL
import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { 
    simulating, 
    possession, 
    userFormation = '2-1-1', 
    botFormation = '2-1-1', 
    matchEvents = [], 
    fouls,
    matchStats,
    character,
    selectedBot
  } = state;
  
  const [gameState, setGameState] = useState({
    players: [],
    ball: { x: 50, y: 50, withPlayer: null },
    action: 'moving',
    targetPlayer: null
  });
  
  // Estados para efectos mejorados
  const [goalEffect, setGoalEffect] = useState(null);
  const [doublePenaltyEffect, setDoublePenaltyEffect] = useState(false);
  const [lastGoalTeam, setLastGoalTeam] = useState(null);
  const [currentZone, setCurrentZone] = useState('midfield');
  
  const lastProcessedEvent = useRef(null);
  const lastScore = useRef({ user: 0, bot: 0 });
  const gameIntervalRef = useRef(null);
  const isResettingAfterGoal = useRef(false);

  // Configuración inicial de jugadores MEJORADA con formaciones
  const initializePlayers = () => {
    const getFormationPositions = (formation, isUser) => {
      const formations = {
        '2-1-1': [
          { position: 'GK', x: isUser ? 8 : 92, y: 50 },
          { position: 'DF', x: isUser ? 25 : 75, y: 30 },
          { position: 'DF', x: isUser ? 25 : 75, y: 70 },
          { position: 'MF', x: isUser ? 45 : 55, y: 50 },
          { position: 'FW', x: isUser ? 65 : 35, y: 50 }
        ],
        '3-1': [
          { position: 'GK', x: isUser ? 8 : 92, y: 50 },
          { position: 'DF', x: isUser ? 25 : 75, y: 20 },
          { position: 'DF', x: isUser ? 25 : 75, y: 50 },
          { position: 'DF', x: isUser ? 25 : 75, y: 80 },
          { position: 'FW', x: isUser ? 65 : 35, y: 50 }
        ],
        '1-2-1': [
          { position: 'GK', x: isUser ? 8 : 92, y: 50 },
          { position: 'DF', x: isUser ? 25 : 75, y: 50 },
          { position: 'MF', x: isUser ? 45 : 55, y: 30 },
          { position: 'MF', x: isUser ? 45 : 55, y: 70 },
          { position: 'FW', x: isUser ? 65 : 35, y: 50 }
        ],
        '2-2': [
          { position: 'GK', x: isUser ? 8 : 92, y: 50 },
          { position: 'DF', x: isUser ? 25 : 75, y: 30 },
          { position: 'DF', x: isUser ? 25 : 75, y: 70 },
          { position: 'MF', x: isUser ? 45 : 55, y: 30 },
          { position: 'MF', x: isUser ? 45 : 55, y: 70 }
        ],
        '1-3': [
          { position: 'GK', x: isUser ? 8 : 92, y: 50 },
          { position: 'DF', x: isUser ? 25 : 75, y: 50 },
          { position: 'MF', x: isUser ? 45 : 55, y: 25 },
          { position: 'MF', x: isUser ? 45 : 55, y: 50 },
          { position: 'MF', x: isUser ? 45 : 55, y: 75 }
        ]
      };

      return formations[formation] || formations['2-1-1'];
    };

    const userPositions = getFormationPositions(userFormation, true);
    const botPositions = getFormationPositions(botFormation, false);

    const userPlayers = userPositions.map((pos, index) => ({
      id: `user-${pos.position.toLowerCase()}${index}`,
      team: 'user',
      position: pos.position,
      x: pos.x,
      y: pos.y,
      number: (index + 1).toString(),
      name: pos.position,
      hasBall: false // Inicialmente sin balón
    }));

    const botPlayers = botPositions.map((pos, index) => ({
      id: `bot-${pos.position.toLowerCase()}${index}`,
      team: 'bot',
      position: pos.position,
      x: pos.x,
      y: pos.y,
      number: (index + 1).toString(),
      name: pos.position,
      hasBall: false // Inicialmente sin balón
    }));

    return [...userPlayers, ...botPlayers];
  };

  // Función para configurar el saque de centro después de un gol
  const setupKickoffAfterGoal = (scoringTeam) => {
    const players = initializePlayers();
    
    // El equipo que recibió el gol saca del centro
    const kickoffTeam = scoringTeam === 'user' ? 'bot' : 'user';
    
    // Encontrar el delantero del equipo que saca
    const kickoffPlayer = players.find(player => 
      player.team === kickoffTeam && player.position === 'FW'
    );

    if (kickoffPlayer) {
      // Posicionar el balón en el centro con el delantero que saca
      const newState = {
        players: players.map(player => ({
          ...player,
          hasBall: player.id === kickoffPlayer.id
        })),
        ball: { 
          x: 50, 
          y: 50, 
          withPlayer: kickoffPlayer.id 
        },
        action: 'moving',
        targetPlayer: null
      };
      
      setGameState(newState);
      updateBallStyle(newState.ball);
      console.log(`🔄 Saque de centro: ${kickoffTeam} inicia con la posesión`);
    }
  };

  // Función para actualizar las propiedades CSS del balón
  const updateBallStyle = (ball) => {
    const ballElement = document.querySelector('.soccer-ball');
    if (ballElement) {
      ballElement.style.setProperty('--ball-x', `${ball.x}%`);
      ballElement.style.setProperty('--ball-y', `${ball.y}%`);
    }
  };

  // Sincronizar con eventos del backend
  useEffect(() => {
    if (!simulating || !matchEvents || matchEvents.length === 0) return;

    const latestEvent = matchEvents[0];
    
    if (lastProcessedEvent.current === latestEvent.id) return;
    
    lastProcessedEvent.current = latestEvent.id;

    // Actualizar zona del campo basado en el evento
    if (latestEvent.fieldZone) {
      setCurrentZone(latestEvent.fieldZone);
    }

    // Manejar DOBLE PENALTI
    if (latestEvent.type === 'double_penalty') {
      console.log(`🎯 DOBLE PENALTI detectado`);
      
      setDoublePenaltyEffect(true);
      const newState = {
        ...gameState,
        action: 'double_penalty',
        ball: { x: 50, y: 38, withPlayer: null }
      };
      setGameState(newState);
      updateBallStyle(newState.ball);

      setTimeout(() => {
        if (latestEvent.isGoal) {
          setGoalEffect('active');
          setLastGoalTeam(latestEvent.team);
        }
        setDoublePenaltyEffect(false);
      }, 1500);

      setTimeout(() => {
        setGoalEffect(null);
        setupKickoffAfterGoal(latestEvent.team);
      }, 3000);
    }

    // Manejar evento de GOL - CORREGIDO
    else if (latestEvent.type === 'goal') {
      const scoringTeam = latestEvent.team;
      console.log(`⚽ GOL de ${scoringTeam}`);
      
      let goalBallPosition;
      if (scoringTeam === 'user') {
        goalBallPosition = { x: 95, y: 45 + Math.random() * 10 };
      } else {
        goalBallPosition = { x: 5, y: 45 + Math.random() * 10 };
      }

      // Mostrar efecto de gol inmediatamente
      setGoalEffect('active');
      setLastGoalTeam(scoringTeam);
      
      // Posicionar balón en la portería
      const newState = {
        ...gameState,
        ball: { ...goalBallPosition, withPlayer: null },
        action: 'shooting'
      };
      setGameState(newState);
      updateBallStyle(newState.ball);

      // Después del efecto de gol, configurar saque de centro
      setTimeout(() => {
        setGoalEffect(null);
        isResettingAfterGoal.current = true;
        
        // Pequeña pausa antes del saque
        setTimeout(() => {
          setupKickoffAfterGoal(scoringTeam);
          isResettingAfterGoal.current = false;
        }, 500);
        
      }, 2500);
    }

    // Manejar otros eventos
    else if (latestEvent.type === 'foul') {
      const newState = {
        ...gameState,
        action: 'foul',
        ball: { 
          x: latestEvent.team === 'user' ? 35 : 65, 
          y: 30 + Math.random() * 40, 
          withPlayer: null 
        }
      };
      setGameState(newState);
      updateBallStyle(newState.ball);

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          action: 'moving'
        }));
      }, 1000);
    }
    else if (latestEvent.type === 'dribble') {
      setGameState(prev => ({
        ...prev,
        action: 'dribbling'
      }));

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          action: 'moving'
        }));
      }, 800);
    }
    else if (latestEvent.type === 'tackle') {
      setGameState(prev => ({
        ...prev,
        action: 'tackle'
      }));

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          action: 'moving'
        }));
      }, 800);
    }

  }, [matchEvents, simulating, userFormation, botFormation, possession]);

  // Verificar cambios en el marcador - CORREGIDO
  useEffect(() => {
    if (matchStats && simulating && !isResettingAfterGoal.current) {
      const currentUserGoals = matchStats.user?.goals || 0;
      const currentBotGoals = matchStats.bot?.goals || 0;
      
      if (currentUserGoals > lastScore.current.user) {
        console.log("📈 Gol de USER detectado por cambio de marcador");
        setGoalEffect('active');
        setLastGoalTeam('user');
        
        // Posicionar balón en portería rival
        const goalState = {
          ...gameState,
          ball: { x: 95, y: 45 + Math.random() * 10, withPlayer: null },
          action: 'shooting'
        };
        setGameState(goalState);
        updateBallStyle(goalState.ball);
        
        setTimeout(() => {
          setGoalEffect(null);
          isResettingAfterGoal.current = true;
          setTimeout(() => {
            setupKickoffAfterGoal('user');
            isResettingAfterGoal.current = false;
          }, 500);
        }, 2500);
        
      } else if (currentBotGoals > lastScore.current.bot) {
        console.log("📈 Gol de BOT detectado por cambio de marcador");
        setGoalEffect('active');
        setLastGoalTeam('bot');
        
        // Posicionar balón en portería rival
        const goalState = {
          ...gameState,
          ball: { x: 5, y: 45 + Math.random() * 10, withPlayer: null },
          action: 'shooting'
        };
        setGameState(goalState);
        updateBallStyle(goalState.ball);
        
        setTimeout(() => {
          setGoalEffect(null);
          isResettingAfterGoal.current = true;
          setTimeout(() => {
            setupKickoffAfterGoal('bot');
            isResettingAfterGoal.current = false;
          }, 500);
        }, 2500);
      }
      
      lastScore.current = { 
        user: currentUserGoals, 
        bot: currentBotGoals 
      };
    }
  }, [matchStats, simulating]);

  // Encontrar jugador más cercano al balón
  const findClosestPlayer = (ballX, ballY, players) => {
    let closestPlayer = null;
    let minDistance = Infinity;

    players.forEach(player => {
      const distance = Math.sqrt(Math.pow(player.x - ballX, 2) + Math.pow(player.y - ballY, 2));
      const adjustedDistance = player.team === possession ? distance * 0.8 : distance;
      
      if (adjustedDistance < minDistance) {
        minDistance = adjustedDistance;
        closestPlayer = player;
      }
    });

    return closestPlayer;
  };

  // Encontrar compañero para pasar
  const findTeammateForPass = (currentPlayer, players) => {
    const teammates = players.filter(p => 
      p.team === currentPlayer.team && p.id !== currentPlayer.id
    );

    if (teammates.length === 0) return null;

    const sortedTeammates = teammates.sort((a, b) => {
      const aScore = (currentPlayer.team === 'user' ? a.x : 100 - a.x) + (50 - Math.abs(a.y - 50));
      const bScore = (currentPlayer.team === 'user' ? b.x : 100 - b.x) + (50 - Math.abs(b.y - 50));
      return bScore - aScore;
    });

    return sortedTeammates[0];
  };

  // Mover jugadores de forma inteligente
  const updatePlayerPositions = (players, ball, possession, zone) => {
    return players.map(player => {
      let targetX = player.x;
      let targetY = player.y;

      if (player.team === possession) {
        switch (player.position) {
          case 'GK':
            targetX = player.team === 'user' ? 8 : 92;
            targetY = 50;
            break;
          case 'DF':
            if (zone === 'defensive') {
              targetX = player.team === 'user' ? 20 : 80;
            } else if (zone === 'attacking') {
              targetX = player.team === 'user' ? 40 : 60;
            } else {
              targetX = player.team === 'user' ? 30 : 70;
            }
            targetY = player.y + (Math.random() - 0.5) * 20;
            break;
          case 'MF':
            if (zone === 'defensive') {
              targetX = player.team === 'user' ? 35 : 65;
            } else if (zone === 'attacking') {
              targetX = player.team === 'user' ? 60 : 40;
            } else {
              targetX = player.team === 'user' ? 45 : 55;
            }
            targetY = 20 + Math.random() * 60;
            break;
          case 'FW':
            if (zone === 'attacking') {
              targetX = player.team === 'user' ? 75 : 25;
            } else {
              targetX = player.team === 'user' ? 65 : 35;
            }
            targetY = 30 + Math.random() * 40;
            break;
        }
      } else {
        switch (player.position) {
          case 'GK':
            targetX = player.team === 'user' ? 8 : 92;
            targetY = ball.y;
            break;
          case 'DF':
            targetX = player.team === 'user' ? 
              Math.max(20, ball.x - 15) : 
              Math.min(80, ball.x + 15);
            targetY = ball.y + (Math.random() - 0.5) * 10;
            break;
          case 'MF':
            targetX = player.team === 'user' ? 
              Math.max(30, ball.x - 10) : 
              Math.min(70, ball.x + 10);
            targetY = ball.y + (Math.random() - 0.5) * 15;
            break;
          case 'FW':
            targetX = player.team === 'user' ? 
              Math.max(40, ball.x - 5) : 
              Math.min(60, ball.x + 5);
            targetY = ball.y;
            break;
        }
      }

      targetX = Math.max(5, Math.min(95, targetX));
      targetY = Math.max(10, Math.min(90, targetY));

      const speed = 0.6 + Math.random() * 0.4;
      const newX = player.x + (targetX - player.x) * speed;
      const newY = player.y + (targetY - player.y) * speed;

      return {
        ...player,
        x: newX,
        y: newY,
        hasBall: player.id === ball.withPlayer
      };
    });
  };

  // Simulación visual MEJORADA con verificación de estado
  const simulateVisualAction = (currentState) => {
    if (goalEffect || doublePenaltyEffect || isResettingAfterGoal.current) {
      return currentState;
    }

    const { players, ball, action } = currentState;
    
    // Verificar que el estado sea válido
    if (!players || players.length === 0) {
      console.log('⚠️ No hay jugadores, reiniciando...');
      const initialState = {
        players: initializePlayers(),
        ball: { x: 50, y: 50, withPlayer: possession === 'user' ? 'user-fw0' : 'bot-fw0' },
        action: 'moving',
        targetPlayer: null
      };
      return initialState;
    }

    let newBall = { ...ball };
    let newAction = action;
    let newTargetPlayer = null;

    // Si el balón está con un jugador
    if (ball.withPlayer) {
      const playerWithBall = players.find(p => p.id === ball.withPlayer);
      
      if (playerWithBall) {
        const actionRoll = Math.random();
        
        if (actionRoll < 0.5) {
          // Pasar
          newAction = 'passing';
          const teammate = findTeammateForPass(playerWithBall, players);
          if (teammate && Math.random() < 0.8) {
            newTargetPlayer = teammate.id;
            newBall.x = teammate.x;
            newBall.y = teammate.y;
            newBall.withPlayer = null;
          } else {
            newBall.x = playerWithBall.x + (Math.random() - 0.5) * 30;
            newBall.y = playerWithBall.y + (Math.random() - 0.5) * 20;
            newBall.withPlayer = null;
          }
        } else if (actionRoll < 0.8) {
          // Driblar
          newAction = 'dribbling';
          const dribbleDistance = 8 + Math.random() * 12;
          if (playerWithBall.team === 'user') {
            newBall.x = Math.min(90, playerWithBall.x + dribbleDistance);
          } else {
            newBall.x = Math.max(10, playerWithBall.x - dribbleDistance);
          }
          newBall.y = Math.max(15, Math.min(85, playerWithBall.y + (Math.random() - 0.5) * 15));
          newBall.withPlayer = null;
        } else {
          // Tirar
          newAction = 'shooting';
          const isUser = playerWithBall.team === 'user';
          const shotX = isUser ? 85 + Math.random() * 10 : 5 + Math.random() * 10;
          const shotY = 35 + Math.random() * 30;
          
          newBall.x = shotX;
          newBall.y = shotY;
          newBall.withPlayer = null;
        }
      } else {
        // Jugador con balón no encontrado, liberar balón
        newBall.withPlayer = null;
        newAction = 'moving';
      }
    } else {
      // Balón suelto
      newAction = 'moving';
      const closestPlayer = findClosestPlayer(ball.x, ball.y, players);
      
      if (closestPlayer) {
        const distance = Math.sqrt(
          Math.pow(closestPlayer.x - ball.x, 2) + 
          Math.pow(closestPlayer.y - ball.y, 2)
        );
        
        if (distance < 12) {
          newBall.withPlayer = closestPlayer.id;
          newBall.x = closestPlayer.x;
          newBall.y = closestPlayer.y;
        } else {
          const speed = 0.8;
          newBall.x = ball.x + (closestPlayer.x - ball.x) * speed;
          newBall.y = ball.y + (closestPlayer.y - ball.y) * speed;
          newBall.x += (Math.random() - 0.5) * 4;
          newBall.y += (Math.random() - 0.5) * 3;
        }
      } else {
        newBall.x += (Math.random() - 0.5) * 8;
        newBall.y += (Math.random() - 0.5) * 6;
      }
    }

    newBall.x = Math.max(2, Math.min(98, newBall.x));
    newBall.y = Math.max(5, Math.min(95, newBall.y));

    return {
      players: updatePlayerPositions(players, newBall, possession, currentZone),
      ball: newBall,
      action: newAction,
      targetPlayer: newTargetPlayer
    };
  };

  // Efecto principal de simulación visual
  useEffect(() => {
    if (simulating && !goalEffect && !doublePenaltyEffect && !isResettingAfterGoal.current) {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }

      // Verificar e inicializar estado si es necesario
      if (gameState.players.length === 0) {
        const initialState = {
          players: initializePlayers(),
          ball: { x: 50, y: 50, withPlayer: possession === 'user' ? 'user-fw0' : 'bot-fw0' },
          action: 'moving',
          targetPlayer: null
        };
        setGameState(initialState);
        updateBallStyle(initialState.ball);
      }

      gameIntervalRef.current = setInterval(() => {
        setGameState(prev => {
          const newState = simulateVisualAction(prev);
          updateBallStyle(newState.ball);
          return newState;
        });
      }, 350);

      return () => {
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = null;
        }
      };
    }
  }, [simulating, possession, goalEffect, doublePenaltyEffect, userFormation, botFormation, currentZone]);

  // Actualizar CSS cuando cambia el estado del balón
  useEffect(() => {
    updateBallStyle(gameState.ball);
  }, [gameState.ball]);

  // Reiniciar cuando para la simulación
  useEffect(() => {
    if (!simulating) {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
      
      setGameState({
        players: [],
        ball: { x: 50, y: 50, withPlayer: null },
        action: 'moving',
        targetPlayer: null
      });
      setGoalEffect(null);
      setDoublePenaltyEffect(false);
      setCurrentZone('midfield');
      lastProcessedEvent.current = null;
      lastScore.current = { user: 0, bot: 0 };
      isResettingAfterGoal.current = false;
    }
  }, [simulating]);

  return (
    <div className="soccer-field">
      <div className="field-grass">
        {/* Elementos del campo */}
        <div className="futsal-area left"></div>
        <div className="futsal-area right"></div>
        <div className="futsal-penalty-spot first"></div>
        <div className="futsal-penalty-spot second"></div>
        <div className="futsal-penalty-spot third"></div>
        <div className="futsal-penalty-spot fourth"></div>
        <div className="double-penalty-spot left"></div>
        <div className="double-penalty-spot right"></div>
        <div className="free-kick-line left"></div>
        <div className="free-kick-line right"></div>
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        <div className="futsal-goal left"></div>
        <div className="futsal-goal right"></div>

        {/* Indicador de Zona del Campo */}
        {simulating && (
          <div className="field-zone-indicator">
            <div className={`zone-display ${currentZone}`}>
              ZONA: {currentZone === 'defensive' ? 'DEFENSIVA' : 
                     currentZone === 'midfield' ? 'MEDIO CAMPO' : 'DE ATAQUE'}
            </div>
          </div>
        )}

        {/* EFECTO DE DOBLE PENALTI */}
        {doublePenaltyEffect && (
          <div className="double-penalty-effect">
            <div className="penalty-explosion">
              <div className="penalty-ring"></div>
              <div className="penalty-core"></div>
              <div className="penalty-text">DOBLE PENALTI!</div>
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="penalty-spark"
                  style={{
                    '--spark-angle': (i * 45) + 'deg'
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* EFECTO DE GOL */}
        {goalEffect && (
          <div className="goal-celebration">
            <div className="goal-explosion">
              <div className="goal-ring"></div>
              <div className="goal-core"></div>
              <div className="goal-text">¡GOL!</div>
              <div className="goal-team">
                {lastGoalTeam === 'user' 
                  ? (character?.name || 'TU EQUIPO') 
                  : (selectedBot?.name || 'RIVAL')}
              </div>
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i}
                  className="goal-sparkle"
                  style={{
                    '--sparkle-x': Math.cos((i * 30) * Math.PI / 180),
                    '--sparkle-y': Math.sin((i * 30) * Math.PI / 180)
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

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
                <div className="player-position-badge">{player.position}</div>
              </div>
            ))}

            {/* Balón */}
            <div 
              className={`soccer-ball ${gameState.action} ${gameState.ball.withPlayer ? 'with-player' : 'free'}`}
              style={{
                left: `${gameState.ball.x}%`,
                top: `${gameState.ball.y}%`
              }}
            >
              <div className="ball-seams"></div>
            </div>

            {/* Línea de pase */}
            {gameState.targetPlayer && (
              <div 
                className="pass-line"
                style={{
                  left: `${gameState.ball.x}%`,
                  top: `${gameState.ball.y}%`
                }}
              >
                <div className="pass-target"></div>
              </div>
            )}

            {/* Indicador de Acción */}
            <div className="action-overlay">
              <div className={`action-indicator ${gameState.action}`}>
                <div className="action-icon">
                  {gameState.action === 'passing' && '⚽'}
                  {gameState.action === 'shooting' && '🎯'}
                  {gameState.action === 'dribbling' && '🌀'}
                  {gameState.action === 'moving' && '🏃'}
                  {gameState.action === 'double_penalty' && '💥'}
                  {gameState.action === 'foul' && '⚠️'}
                  {gameState.action === 'tackle' && '🛡️'}
                </div>
                <div className="action-text">
                  {gameState.action === 'passing' && 'PASE →'}
                  {gameState.action === 'shooting' && 'TIRO A PUERTA!'}
                  {gameState.action === 'dribbling' && 'REGATE'}
                  {gameState.action === 'moving' && 'CIRCULACIÓN'}
                  {gameState.action === 'double_penalty' && 'DOBLE PENALTI!'}
                  {gameState.action === 'foul' && 'FALTA COMETIDA'}
                  {gameState.action === 'tackle' && 'INTERCEPCIÓN!'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="pre-match-arena">
            <div className="pre-match-overlay">
              <div className="match-header">
                <div className="title-container">
                  <h1 className="game-title">FÚTSAL<span className="title-accent">ARENA</span></h1>
                </div>
              </div>
              
              <div className="arena-display">
                <div className="stadium-preview">
                  <div className="field-glow"></div>
                  <p className="arena-ready">ARENA MEJORADA</p>
                  <p className="arena-features">Sistema de zonas • Fatiga dinámica • Doble penalti</p>
                </div>
                
                <div className="tactical-breakdown">
                  <div className="formation-card user-formation">
                    <div className="formation-badge">TU ESTRATEGIA</div>
                    <div className="formation-display">
                      <span className="formation-value">{userFormation}</span>
                      <div className="formation-type">
                        {userFormation === '3-1' ? 'DEFENSIVA' : 
                         userFormation === '1-3' ? 'OFENSIVA' : 'BALANCEADA'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="vs-badge">
                    <span>VS</span>
                  </div>
                  
                  <div className="formation-card rival-formation">
                    <div className="formation-badge">RIVAL</div>
                    <div className="formation-display">
                      <span className="formation-value">{botFormation}</span>
                      <div className="formation-type">
                        {botFormation === '3-1' ? 'DEFENSIVA' : 
                         botFormation === '1-3' ? 'OFENSIVA' : 'BALANCEADA'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

