// SoccerField.jsx - VERSIÓN CORREGIDA CON DETECCIÓN DE GOLES MEJORADA
import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { simulating, possession, userFormation = '2-1-1', botFormation = '2-1-1', matchEvents, fouls } = state;
  const [gameState, setGameState] = useState({
    players: [],
    ball: { x: 50, y: 50, withPlayer: null },
    action: 'moving',
    targetPlayer: null
  });
  
  // Estados para efectos de gol
  const [goalEffect, setGoalEffect] = useState(null);
  const [lastGoalTeam, setLastGoalTeam] = useState(null);
  const goalProcessed = useRef(false); // Para evitar múltiples detecciones

  // Configuración inicial de jugadores
  const initializePlayers = () => {
    const userPlayers = [
      { id: 'user-gk', team: 'user', position: 'GK', x: 8, y: 50, number: '1', name: 'PORTERO', hasBall: false },
      { id: 'user-df1', team: 'user', position: 'DF', x: 25, y: 30, number: '2', name: 'DEFENSA', hasBall: false },
      { id: 'user-df2', team: 'user', position: 'DF', x: 25, y: 70, number: '3', name: 'DEFENSA', hasBall: false },
      { id: 'user-mf', team: 'user', position: 'MF', x: 45, y: 50, number: '4', name: 'MEDIO', hasBall: false },
      { id: 'user-fw', team: 'user', position: 'FW', x: 65, y: 50, number: '5', name: 'DELANTERO', hasBall: true }
    ];

    const botPlayers = [
      { id: 'bot-gk', team: 'bot', position: 'GK', x: 92, y: 50, number: '1', name: 'PORTERO', hasBall: false },
      { id: 'bot-df1', team: 'bot', position: 'DF', x: 75, y: 30, number: '2', name: 'DEFENSA', hasBall: false },
      { id: 'bot-df2', team: 'bot', position: 'DF', x: 75, y: 70, number: '3', name: 'DEFENSA', hasBall: false },
      { id: 'bot-mf', team: 'bot', position: 'MF', x: 55, y: 50, number: '4', name: 'MEDIO', hasBall: false },
      { id: 'bot-fw', team: 'bot', position: 'FW', x: 35, y: 50, number: '5', name: 'DELANTERO', hasBall: false }
    ];

    return [...userPlayers, ...botPlayers];
  };

  // Función mejorada para detectar si es gol
  const checkForGoal = (ballX, ballY) => {
    // Gol del USER (balón en portería DERECHA - coordenadas más precisas)
    if (ballX >= 98 && ballY >= 35 && ballY <= 65) {
      return 'user';
    }
    // Gol del BOT (balón en portería IZQUIERDA - coordenadas más precisas)
    if (ballX <= 2 && ballY >= 35 && ballY <= 65) {
      return 'bot';
    }
    return null;
  };

  // Encontrar jugador más cercano al balón
  const findClosestPlayer = (ballX, ballY, players) => {
    let closestPlayer = null;
    let minDistance = Infinity;

    players.forEach(player => {
      const distance = Math.sqrt(Math.pow(player.x - ballX, 2) + Math.pow(player.y - ballY, 2));
      if (distance < minDistance) {
        minDistance = distance;
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

    // Priorizar jugadores más adelantados
    const sortedTeammates = teammates.sort((a, b) => {
      if (currentPlayer.team === 'user') {
        return b.x - a.x;
      } else {
        return a.x - b.x;
      }
    });

    return sortedTeammates[0];
  };

  // Mover jugadores de forma inteligente
  const updatePlayerPositions = (players, ball, possession) => {
    return players.map(player => {
      let targetX = player.x;
      let targetY = player.y;

      // Comportamiento según posición y equipo
      if (player.team === possession) {
        // Equipo con posesión - comportamiento ofensivo
        switch (player.position) {
          case 'GK':
            targetX = player.team === 'user' ? 8 : 92;
            targetY = 50;
            break;
          case 'DF':
            targetX = player.team === 'user' ? 25 : 75;
            targetY = player.y;
            if (Math.random() > 0.7) {
              targetY = 30 + Math.random() * 40;
            }
            break;
          case 'MF':
            targetX = player.team === 'user' ? 45 : 55;
            targetY = 20 + Math.random() * 60;
            break;
          case 'FW':
            targetX = player.team === 'user' ? 65 : 35;
            targetY = 30 + Math.random() * 40;
            break;
        }
      } else {
        // Equipo sin posesión - comportamiento defensivo
        switch (player.position) {
          case 'GK':
            targetX = player.team === 'user' ? 8 : 92;
            targetY = 50;
            break;
          case 'DF':
            targetX = player.team === 'user' ? 30 : 70;
            targetY = ball.y;
            break;
          case 'MF':
            targetX = player.team === 'user' ? 40 : 60;
            targetY = ball.y;
            break;
          case 'FW':
            targetX = player.team === 'user' ? 55 : 45;
            targetY = ball.y;
            break;
        }
      }

      // Movimiento suave hacia la posición objetivo
      const speed = 0.8;
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

  // Función para manejar el gol
  const handleGoal = (scoringTeam) => {
    if (goalProcessed.current) return; // Evitar múltiples procesamientos
    
    goalProcessed.current = true;
    setGoalEffect('active');
    setLastGoalTeam(scoringTeam);
    
    console.log(`¡GOL marcado por: ${scoringTeam}`); // Para debug

    // Disparar evento de gol para que el componente padre lo maneje
    if (typeof state.onGoal === 'function') {
      state.onGoal(scoringTeam);
    }

    // Resetear después de 2 segundos
    setTimeout(() => {
      setGoalEffect(null);
      goalProcessed.current = false;
      
      // Reposicionar jugadores y balón después del gol
      // El equipo que recibió el gol inicia con el balón
      const nextPossession = scoringTeam === 'user' ? 'bot' : 'user';
      setGameState({
        players: initializePlayers(),
        ball: { x: 50, y: 50, withPlayer: nextPossession === 'user' ? 'user-fw' : 'bot-fw' },
        action: 'moving',
        targetPlayer: null
      });
    }, 2000);
  };

  // Simular acción del juego - VERSIÓN CORREGIDA

  const simulateGameAction = (currentState) => {
    // Si hay un efecto de gol activo (desde el estado), no hacer nada.
    // Esto detiene el bucle principal en useEffect.
    if (goalEffect) return currentState; 

    const { players, ball, action } = currentState;

    // PRIMERO: Verificar si hay gol
    const goalScored = checkForGoal(ball.x, ball.y);
    if (goalScored && !goalProcessed.current) {
      handleGoal(goalScored);
      return currentState; // Congelar el estado
    }
    if (goalProcessed.current) {
      return currentState;
    }
    
    let newBall = { ...ball };
    let newAction = action;
    let newTargetPlayer = null;

    // PRIMERO: Verificar si hay gol (antes de cualquier movimiento)
    const goalScored = checkForGoal(ball.x, ball.y);
    if (goalScored && !goalProcessed.current) {
      handleGoal(goalScored);
      return currentState; // Congelar el estado
    }

    // Si el balón está con un jugador
    if (ball.withPlayer) {
      const playerWithBall = players.find(p => p.id === ball.withPlayer);
      
      if (!playerWithBall) {
        // Jugador no encontrado, liberar balón
        newBall.withPlayer = null;
      } else {
        // Decidir acción: pasar, driblar o tirar
        const actionRoll = Math.random();
        
        if (actionRoll < 0.6) {
          // Pasar a compañero (60% probabilidad)
          newAction = 'passing';
          const teammate = findTeammateForPass(playerWithBall, players);
          if (teammate) {
            newTargetPlayer = teammate.id;
            newBall.x = teammate.x;
            newBall.y = teammate.y;
            newBall.withPlayer = null;
          }
        } else if (actionRoll < 0.85) {
          // Driblar (25% probabilidad)
          newAction = 'dribbling';
          if (playerWithBall.team === 'user') {
            newBall.x = Math.min(90, playerWithBall.x + 8);
          } else {
            newBall.x = Math.max(10, playerWithBall.x - 8);
          }
          newBall.y = Math.max(10, Math.min(90, playerWithBall.y + (Math.random() - 0.5) * 15));
          newBall.withPlayer = null;
        } else {
          // Tirar a puerta (15% probabilidad)
          newAction = 'shooting';
          // Coordenadas más precisas para el tiro
          const goalY = 35 + Math.random() * 30; // Entre 35 y 65
          if (playerWithBall.team === 'user') {
            newBall.x = 98; // Más cerca de la portería
            newBall.y = goalY;
          } else {
            newBall.x = 2; // Más cerca de la portería
            newBall.y = goalY;
          }
          newBall.withPlayer = null;
        }
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
        
        if (distance < 8) {
          newBall.withPlayer = closestPlayer.id;
          newBall.x = closestPlayer.x;
          newBall.y = closestPlayer.y;
        } else {
          const speed = 0.6;
          newBall.x = ball.x + (closestPlayer.x - ball.x) * speed;
          newBall.y = ball.y + (closestPlayer.y - ball.y) * speed;
        }
      }
    }

    return {
      players: updatePlayerPositions(players, newBall, possession),
      ball: newBall,
      action: newAction,
      targetPlayer: newTargetPlayer
    };
  };

  // Efecto principal de simulación - VERSIÓN MEJORADA
  useEffect(() => {
    if (simulating && !goalEffect) {
      const gameInterval = setInterval(() => {
        setGameState(prev => {
          if (prev.players.length === 0) {
            return {
              players: initializePlayers(),
              ball: { x: 50, y: 50, withPlayer: 'user-fw' },
              action: 'moving',
              targetPlayer: null
            };
          }
          return simulateGameAction(prev);
        });
      }, 400); // Intervalo ligeramente más largo para mejor rendimiento

      return () => clearInterval(gameInterval);
    }
  }, [simulating, possession, matchEvents, goalEffect]);

  // Reiniciar cuando para la simulación
  useEffect(() => {
    if (!simulating) {
      setGameState({
        players: [],
        ball: { x: 50, y: 50, withPlayer: null },
        action: 'moving',
        targetPlayer: null
      });
      setGoalEffect(null);
      goalProcessed.current = false;
    }
  }, [simulating]);

  return (
    <div className="soccer-field">
      <div className="field-grass">
        {/* Áreas de futsal redondeadas */}
        <div className="futsal-area left"></div>
        <div className="futsal-area right"></div>
        
        {/* Puntos de penalti */}
        <div className="futsal-penalty-spot first"></div>
        <div className="futsal-penalty-spot second"></div>
        <div className="futsal-penalty-spot third"></div>
        <div className="futsal-penalty-spot fourth"></div>
        
        {/* Puntos de doble penalti */}
        <div className="double-penalty-spot left"></div>
        <div className="double-penalty-spot right"></div>
        
        {/* Líneas de tiro libre */}
        <div className="free-kick-line left"></div>
        <div className="free-kick-line right"></div>
        
        {/* Elementos centrales */}
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        
        {/* Porterías */}
        <div className="futsal-goal left"></div>
        <div className="futsal-goal right"></div>

        {/* EFECTO DE GOL MEJORADO */}
        {goalEffect && (
          <div className="goal-celebration">
            <div className="goal-explosion">
              <div className="goal-ring"></div>
              <div className="goal-core"></div>
              <div className="goal-text">¡GOL!</div>
              <div className="goal-team">
                {lastGoalTeam === 'user' 
                  ? (state.character?.name || 'TU EQUIPO') 
                  : (state.selectedBot?.name || 'RIVAL')}
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
                className={`player ${player.team} ${player.position} ${player.hasBall ? 'with-ball' : ''} ${gameState.action}`}
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

            {/* Indicador de Acción Mejorado */}
            <div className="action-overlay">
              <div className={`action-indicator ${gameState.action}`}>
                <div className="action-icon">
                  {gameState.action === 'passing' && '⚽'}
                  {gameState.action === 'shooting' && '🎯'}
                  {gameState.action === 'dribbling' && '🌀'}
                  {gameState.action === 'moving' && '🏃'}
                  {matchEvents[0]?.type === 'double_penalty' && '💥'}
                </div>
                <div className="action-text">
                  {gameState.action === 'passing' && 'PASE →'}
                  {gameState.action === 'shooting' && 'TIRO A PUERTA!'}
                  {gameState.action === 'dribbling' && 'REGATE'}
                  {gameState.action === 'moving' && 'CIRCULACIÓN'}
                  {matchEvents[0]?.type === 'double_penalty' && 'DOBLE PENALTI!'}
                </div>
                <div className="action-glow"></div>
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
                  <p className="arena-ready">ARENA SINCRONIZADA</p>
                </div>
                
                <div className="tactical-breakdown">
                  <div className="formation-card user-formation">
                    <div className="formation-badge">TU ESTRATEGIA</div>
                    <div className="formation-display">
                      <span className="formation-value">{userFormation}</span>
                      <div className="formation-type">OFENSIVA</div>
                    </div>
                  </div>
                  
                  <div className="vs-badge">
                    <span>VS</span>
                  </div>
                  
                  <div className="formation-card rival-formation">
                    <div className="formation-badge">RIVAL DETECTADO</div>
                    <div className="formation-display">
                      <span className="formation-value">{botFormation}</span>
                      <div className="formation-type">CONTRAATAQUE</div>
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

