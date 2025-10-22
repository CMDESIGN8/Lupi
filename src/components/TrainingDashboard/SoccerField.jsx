// SoccerField.jsx - VERSIÓN CON POSICIÓN DE BALÓN SINCRONIZADA
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
    score 
  } = state;
  
  const [gameState, setGameState] = useState({
    players: [],
    ball: { x: 50, y: 50, withPlayer: null },
    action: 'moving',
    targetPlayer: null
  });
  
  // Estados para efectos
  const [goalEffect, setGoalEffect] = useState(null);
  const [lastGoalTeam, setLastGoalTeam] = useState(null);
  const lastProcessedEvent = useRef(null);
  const lastScore = useRef({ user: 0, bot: 0 });

  // Configuración inicial de jugadores
  const initializePlayers = () => {
    const userPlayers = [
      { id: 'user-gk', team: 'user', position: 'GK', x: 8, y: 50, number: '1', name: 'PORTERO', hasBall: false },
      { id: 'user-df1', team: 'user', position: 'DF', x: 25, y: 30, number: '2', name: 'DEFENSA', hasBall: false },
      { id: 'user-df2', team: 'user', position: 'DF', x: 25, y: 70, number: '3', name: 'DEFENSA', hasBall: false },
      { id: 'user-mf', team: 'user', position: 'MF', x: 45, y: 50, number: '4', name: 'MEDIO', hasBall: false },
      { id: 'user-fw', team: 'user', position: 'FW', x: 65, y: 50, number: '5', name: 'DELANTERO', hasBall: possession === 'user' }
    ];

    const botPlayers = [
      { id: 'bot-gk', team: 'bot', position: 'GK', x: 92, y: 50, number: '1', name: 'PORTERO', hasBall: false },
      { id: 'bot-df1', team: 'bot', position: 'DF', x: 75, y: 30, number: '2', name: 'DEFENSA', hasBall: false },
      { id: 'bot-df2', team: 'bot', position: 'DF', x: 75, y: 70, number: '3', name: 'DEFENSA', hasBall: false },
      { id: 'bot-mf', team: 'bot', position: 'MF', x: 55, y: 50, number: '4', name: 'MEDIO', hasBall: false },
      { id: 'bot-fw', team: 'bot', position: 'FW', x: 35, y: 50, number: '5', name: 'DELANTERO', hasBall: possession === 'bot' }
    ];

    return [...userPlayers, ...botPlayers];
  };

  // Sincronizar con eventos del backend - VERSIÓN MEJORADA
  useEffect(() => {
    if (!simulating || !matchEvents || matchEvents.length === 0) return;

    const latestEvent = matchEvents[0];
    
    // Evitar procesar el mismo evento múltiples veces
    if (lastProcessedEvent.current === latestEvent.id) return;
    
    lastProcessedEvent.current = latestEvent.id;

    // Manejar evento de GOL - CON POSICIÓN CORRECTA DEL BALÓN
    if (latestEvent.type === 'goal') {
      const scoringTeam = latestEvent.team;
      console.log(`⚽ GOL REAL de ${scoringTeam} - Posicionando balón en portería correcta`);
      
      // POSICIONAR EL BALÓN EN LA PORTERÍA CORRESPONDIENTE
      let goalBallPosition;
      if (scoringTeam === 'user') {
        // Gol de USER = balón en portería DERECHA (bot)
        goalBallPosition = { x: 98, y: 45 + Math.random() * 10 };
      } else {
        // Gol de BOT = balón en portería IZQUIERDA (user)  
        goalBallPosition = { x: 2, y: 45 + Math.random() * 10 };
      }

      // Actualizar estado visual inmediatamente
      setGameState(prev => ({
        ...prev,
        ball: { ...prev.ball, ...goalBallPosition, withPlayer: null },
        action: 'shooting'
      }));

      // Pequeño delay para que se vea el balón en la portería antes del efecto
      setTimeout(() => {
        setGoalEffect('active');
        setLastGoalTeam(scoringTeam);
      }, 100);

      // Resetear después del efecto
      setTimeout(() => {
        setGoalEffect(null);
        // Saque de centro del equipo que recibió el gol
        setGameState(prev => ({
          ...prev,
          players: initializePlayers(),
          ball: { x: 50, y: 50, withPlayer: scoringTeam === 'user' ? 'bot-fw' : 'user-fw' },
          action: 'moving'
        }));
      }, 2500);
    }

    // Manejar otros eventos
    if (latestEvent.type === 'foul' || latestEvent.type === 'double_penalty') {
      setGameState(prev => ({
        ...prev,
        action: latestEvent.type === 'double_penalty' ? 'double_penalty' : 'moving'
      }));
    }

  }, [matchEvents, simulating]);

  // También verificar cambios en el marcador - VERSIÓN MEJORADA
  useEffect(() => {
    if (score && simulating) {
      // Detectar si hubo un gol comparando con el marcador anterior
      if (score.user > lastScore.current.user) {
        console.log("📈 Gol de USER detectado por cambio de marcador - Posicionando balón");
        
        // Posicionar balón en portería de BOT (gol de user)
        setGameState(prev => ({
          ...prev,
          ball: { ...prev.ball, x: 98, y: 45 + Math.random() * 10, withPlayer: null },
          action: 'shooting'
        }));

        setTimeout(() => {
          setGoalEffect('active');
          setLastGoalTeam('user');
        }, 100);

        setTimeout(() => setGoalEffect(null), 2500);
        
      } else if (score.bot > lastScore.current.bot) {
        console.log("📈 Gol de BOT detectado por cambio de marcador - Posicionando balón");
        
        // Posicionar balón en portería de USER (gol de bot)
        setGameState(prev => ({
          ...prev,
          ball: { ...prev.ball, x: 2, y: 45 + Math.random() * 10, withPlayer: null },
          action: 'shooting'
        }));

        setTimeout(() => {
          setGoalEffect('active');
          setLastGoalTeam('bot');
        }, 100);

        setTimeout(() => setGoalEffect(null), 2500);
      }
      
      lastScore.current = { ...score };
    }
  }, [score, simulating]);

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

      if (player.team === possession) {
        switch (player.position) {
          case 'GK':
            targetX = player.team === 'user' ? 8 : 92;
            targetY = 50;
            break;
          case 'DF':
            targetX = player.team === 'user' ? 25 : 75;
            targetY = player.y;
            if (Math.random() > 0.7) targetY = 30 + Math.random() * 40;
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

  // Simulación visual solamente (sin lógica de gol)
  const simulateVisualAction = (currentState) => {
    if (goalEffect) return currentState; // Pausar durante efecto de gol

    const { players, ball, action } = currentState;
    
    let newBall = { ...ball };
    let newAction = action;
    let newTargetPlayer = null;

    // Solo simulación visual - EVITAR que el balón entre en porterías
    if (ball.withPlayer) {
      const playerWithBall = players.find(p => p.id === ball.withPlayer);
      
      if (playerWithBall) {
        const actionRoll = Math.random();
        
        if (actionRoll < 0.6) {
          // Pasar
          newAction = 'passing';
          const teammate = findTeammateForPass(playerWithBall, players);
          if (teammate) {
            newTargetPlayer = teammate.id;
            newBall.x = teammate.x;
            newBall.y = teammate.y;
            newBall.withPlayer = null;
          }
        } else if (actionRoll < 0.85) {
          // Driblar - CON LÍMITES PARA EVITAR PORTERÍAS
          newAction = 'dribbling';
          if (playerWithBall.team === 'user') {
            newBall.x = Math.min(88, playerWithBall.x + 6); // No llegar a portería
          } else {
            newBall.x = Math.max(12, playerWithBall.x - 6); // No llegar a portería
          }
          newBall.y = Math.max(15, Math.min(85, playerWithBall.y + (Math.random() - 0.5) * 12));
          newBall.withPlayer = null;
        } else {
          // Tirar - PERO DETENERSE ANTES DE LA PORTERÍA
          newAction = 'shooting';
          const isUser = playerWithBall.team === 'user';
          // Detener el tiro antes de la línea de gol (85% o 15%)
          const shotX = isUser ? 85 + Math.random() * 8 : 7 + Math.random() * 8;
          const shotY = 40 + Math.random() * 20;
          
          newBall.x = shotX;
          newBall.y = shotY;
          newBall.withPlayer = null;
        }
      }
    } else {
      // Balón suelto - EVITAR que entre en porterías
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

  // Efecto principal de simulación visual
  useEffect(() => {
    if (simulating && !goalEffect) {
      const gameInterval = setInterval(() => {
        setGameState(prev => {
          if (prev.players.length === 0) {
            return {
              players: initializePlayers(),
              ball: { x: 50, y: 50, withPlayer: possession === 'user' ? 'user-fw' : 'bot-fw' },
              action: 'moving',
              targetPlayer: null
            };
          }
          return simulateVisualAction(prev);
        });
      }, 400);

      return () => clearInterval(gameInterval);
    }
  }, [simulating, possession, goalEffect]);

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
      lastProcessedEvent.current = null;
      lastScore.current = { user: 0, bot: 0 };
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

        {/* EFECTO DE GOL - Solo cuando el backend lo indique */}
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

            {/* Indicador de Acción */}
            <div className="action-overlay">
              <div className={`action-indicator ${gameState.action}`}>
                <div className="action-icon">
                  {gameState.action === 'passing' && '⚽'}
                  {gameState.action === 'shooting' && '🎯'}
                  {gameState.action === 'dribbling' && '🌀'}
                  {gameState.action === 'moving' && '🏃'}
                  {gameState.action === 'double_penalty' && '💥'}
                </div>
                <div className="action-text">
                  {gameState.action === 'passing' && 'PASE →'}
                  {gameState.action === 'shooting' && 'TIRO A PUERTA!'}
                  {gameState.action === 'dribbling' && 'REGATE'}
                  {gameState.action === 'moving' && 'CIRCULACIÓN'}
                  {gameState.action === 'double_penalty' && 'DOBLE PENALTI!'}
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
