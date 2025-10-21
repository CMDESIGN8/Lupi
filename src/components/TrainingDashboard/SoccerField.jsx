// SoccerField.jsx
import React, { useState, useEffect } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { simulating, possession, userFormation = '2-1-1', botFormation = '2-1-1', matchEvents } = state;
  const [gameState, setGameState] = useState({
    players: [],
    ball: { x: 50, y: 50, withPlayer: null },
    action: 'moving', // moving, passing, shooting
    targetPlayer: null
  });

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
        return b.x - a.x; // Para usuario, más cerca de la portería rival
      } else {
        return a.x - b.x; // Para bot, más cerca de la portería usuario
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
            // Movimiento lateral para dar opciones de pase
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
            targetY = ball.y; // Seguir la vertical del balón
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

  // Simular acción del juego
  const simulateGameAction = (currentState) => {
    const { players, ball, action } = currentState;
    
    let newBall = { ...ball };
    let newAction = action;
    let newTargetPlayer = null;

    // Si el balón está con un jugador
    if (ball.withPlayer) {
      const playerWithBall = players.find(p => p.id === ball.withPlayer);
      
      // Decidir acción: pasar, driblar o tirar
      const actionRoll = Math.random();
      
      if (actionRoll < 0.6) {
        // Pasar a compañero (60% probabilidad)
        newAction = 'passing';
        const teammate = findTeammateForPass(playerWithBall, players);
        if (teammate) {
          newTargetPlayer = teammate.id;
          // Mover balón hacia el compañero
          newBall.x = teammate.x;
          newBall.y = teammate.y;
          newBall.withPlayer = null;
        }
      } else if (actionRoll < 0.85) {
        // Driblar (25% probabilidad)
        newAction = 'dribbling';
        // Pequeño movimiento hacia adelante
        if (playerWithBall.team === 'user') {
          newBall.x = Math.min(85, playerWithBall.x + 5);
        } else {
          newBall.x = Math.max(15, playerWithBall.x - 5);
        }
        newBall.y = playerWithBall.y + (Math.random() - 0.5) * 20;
        newBall.withPlayer = null;
      } else {
        // Tirar a puerta (15% probabilidad)
        newAction = 'shooting';
        const goalY = 40 + Math.random() * 20; // Apuntar al centro de la portería
        if (playerWithBall.team === 'user') {
          newBall.x = 95;
          newBall.y = goalY;
        } else {
          newBall.x = 5;
          newBall.y = goalY;
        }
        newBall.withPlayer = null;
      }
    } else {
      // Balón suelto - encontrar jugador más cercano
      newAction = 'moving';
      const closestPlayer = findClosestPlayer(ball.x, ball.y, players);
      if (closestPlayer) {
        const distance = Math.sqrt(
          Math.pow(closestPlayer.x - ball.x, 2) + 
          Math.pow(closestPlayer.y - ball.y, 2)
        );
        
        if (distance < 8) { // Si está suficientemente cerca, coge el balón
          newBall.withPlayer = closestPlayer.id;
          newBall.x = closestPlayer.x;
          newBall.y = closestPlayer.y;
        } else {
          // Mover balón hacia el jugador más cercano
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

  // Efecto principal de simulación
  useEffect(() => {
    if (simulating) {
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
    }
  }, [simulating, possession, matchEvents]);

  // Reiniciar cuando para la simulación
  useEffect(() => {
    if (!simulating) {
      setGameState({
        players: [],
        ball: { x: 50, y: 50, withPlayer: null },
        action: 'moving',
        targetPlayer: null
      });
    }
  }, [simulating]);

  return (
    <div className="soccer-field futsal-professional">
      <div className="field-surface">
        {/* Líneas del campo de fútsal profesional */}
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

        {/* Punto de doble penal */}
        <div className="second-penalty-mark"></div>
        
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

            {/* HUD del partido */}
            <div className="match-hud">
              <div className="possession-display">
                <span className={`team ${possession}`}>
                  {possession === 'user' ? state.character?.name : state.selectedBot?.name}
                </span>
                <span className="possession-text"> tiene la posesión</span>
              </div>
              <div className="action-indicator">
                {gameState.action === 'passing' && '⚽ PASE →'}
                {gameState.action === 'shooting' && '🎯 TIRO A PUERTA!'}
                {gameState.action === 'dribbling' && '🌀 REGATE'}
                {gameState.action === 'moving' && '⇄ CIRCULACIÓN'}
              </div>
            </div>
          </>
        ) : (
          <div className="pre-match-arena">
  <div className="pre-match-overlay">
    <div className="match-header">
      <div className="title-container">
        <h1 className="game-title">FÚTSAL<span className="title-accent">ARENA</span></h1>
        <div className="match-status">
          <div className="status-pulse"></div>
          <span className="status-text">PREPARACIÓN DE BATALLA</span>
        </div>
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
    
    <div className="match-countdown">
      <div className="countdown-text">INICIANDO EN...</div>
      <div className="countdown-timer">3</div>
    </div>
  </div>
</div>
        )}
      </div>
    </div>
  );
};

