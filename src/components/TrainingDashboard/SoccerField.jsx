// SoccerField.jsx
import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { simulating, possession, userFormation = '2-1-1', botFormation = '2-1-1', matchEvents } = state;
  const [playerPositions, setPlayerPositions] = useState({ user: [], bot: [] });
  const [ballPosition, setBallPosition] = useState({ top: '50%', left: '50%' });
  const [ballTrail, setBallTrail] = useState([]);
  const fieldRef = useRef(null);

  // Sistema de partículas para efectos cyberpunk
  const [particles, setParticles] = useState([]);

  // Posiciones base con estilo cyberpunk
  const baseFormations = {
    '2-1-1': {
      user: [
        { id: 'user-gk', position: 'GK', baseTop: '50%', baseLeft: '5%', emoji: '👁', color: '#00ff88' },
        { id: 'user-df1', position: 'DF', baseTop: '30%', baseLeft: '25%', emoji: '⚡', color: '#00ccff' },
        { id: 'user-df2', position: 'DF', baseTop: '70%', baseLeft: '25%', emoji: '⚡', color: '#00ccff' },
        { id: 'user-mf', position: 'MF', baseTop: '50%', baseLeft: '45%', emoji: '🔷', color: '#0099ff' },
        { id: 'user-fw', position: 'FW', baseTop: '50%', baseLeft: '65%', emoji: '🔥', color: '#ff0066' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', baseTop: '50%', baseLeft: '95%', emoji: '👁', color: '#ff0088' },
        { id: 'bot-df1', position: 'DF', baseTop: '30%', baseLeft: '75%', emoji: '⚡', color: '#ff00cc' },
        { id: 'bot-df2', position: 'DF', baseTop: '70%', baseLeft: '75%', emoji: '⚡', color: '#ff00cc' },
        { id: 'bot-mf', position: 'MF', baseTop: '50%', baseLeft: '55%', emoji: '🔷', color: '#cc00ff' },
        { id: 'bot-fw', position: 'FW', baseTop: '50%', baseLeft: '35%', emoji: '🔥', color: '#ff5500' }
      ]
    },
    '3-1': {
      user: [
        { id: 'user-gk', position: 'GK', baseTop: '50%', baseLeft: '5%', emoji: '👁', color: '#00ff88' },
        { id: 'user-df1', position: 'DF', baseTop: '20%', baseLeft: '25%', emoji: '🛡', color: '#00ccff' },
        { id: 'user-df2', position: 'DF', baseTop: '50%', baseLeft: '25%', emoji: '🛡', color: '#00ccff' },
        { id: 'user-df3', position: 'DF', baseTop: '80%', baseLeft: '25%', emoji: '🛡', color: '#00ccff' },
        { id: 'user-fw', position: 'FW', baseTop: '50%', baseLeft: '60%', emoji: '🔥', color: '#ff0066' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', baseTop: '50%', baseLeft: '95%', emoji: '👁', color: '#ff0088' },
        { id: 'bot-df1', position: 'DF', baseTop: '20%', baseLeft: '75%', emoji: '🛡', color: '#ff00cc' },
        { id: 'bot-df2', position: 'DF', baseTop: '50%', baseLeft: '75%', emoji: '🛡', color: '#ff00cc' },
        { id: 'bot-df3', position: 'DF', baseTop: '80%', baseLeft: '75%', emoji: '🛡', color: '#ff00cc' },
        { id: 'bot-fw', position: 'FW', baseTop: '50%', baseLeft: '40%', emoji: '🔥', color: '#ff5500' }
      ]
    }
  };

  // Efecto de partículas cyberpunk
  useEffect(() => {
    if (!simulating) return;

    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-20), // Mantener solo las últimas 20 partículas
        {
          id: Math.random(),
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          color: possession === 'user' ? '#00ff88' : '#ff0088'
        }
      ]);
    }, 200);

    return () => clearInterval(interval);
  }, [simulating, possession]);

  // Sistema de trail para el balón
  useEffect(() => {
    if (simulating) {
      setBallTrail(prev => [
        ...prev,
        { id: Date.now(), ...ballPosition }
      ].slice(-8)); // Mantener solo los últimos 8 puntos del trail
    }
  }, [ballPosition, simulating]);

  // Calcular posiciones dinámicas
  const calculateDynamicPositions = () => {
    const userBase = baseFormations[userFormation]?.user || baseFormations['2-1-1'].user;
    const botBase = baseFormations[botFormation]?.bot || baseFormations['2-1-1'].bot;

    const attackMultiplier = possession === 'user' ? 1 : -1;

    const adjustedUser = userBase.map(player => {
      let dynamicLeft = player.baseLeft;
      let dynamicTop = player.baseTop;

      // Movimiento ofensivo/defensivo
      if (player.position === 'FW') {
        dynamicLeft = possession === 'user' ? '75%' : '45%';
      } else if (player.position === 'MF') {
        dynamicLeft = possession === 'user' ? '55%' : '35%';
      } else if (player.position === 'DF') {
        dynamicLeft = possession === 'user' ? '35%' : '25%';
      }

      // Variación dinámica
      const variation = (Math.random() - 0.5) * 15;
      dynamicTop = `calc(${dynamicTop} + ${variation}%)`;

      return {
        ...player,
        top: dynamicTop,
        left: dynamicLeft,
        pulse: Math.random() > 0.7
      };
    });

    const adjustedBot = botBase.map(player => {
      let dynamicLeft = player.baseLeft;
      let dynamicTop = player.baseTop;

      if (player.position === 'FW') {
        dynamicLeft = possession === 'bot' ? '25%' : '55%';
      } else if (player.position === 'MF') {
        dynamicLeft = possession === 'bot' ? '45%' : '65%';
      } else if (player.position === 'DF') {
        dynamicLeft = possession === 'bot' ? '65%' : '75%';
      }

      const variation = (Math.random() - 0.5) * 15;
      dynamicTop = `calc(${dynamicTop} + ${variation}%)`;

      return {
        ...player,
        top: dynamicTop,
        left: dynamicLeft,
        pulse: Math.random() > 0.7
      };
    });

    return { user: adjustedUser, bot: adjustedBot };
  };

  // Calcular posición del balón con efectos
  const calculateBallPosition = () => {
    const positions = calculateDynamicPositions();
    let targetPlayer;

    if (possession === 'user') {
      targetPlayer = positions.user.find(p => p.position === 'FW') || positions.user[4];
    } else {
      targetPlayer = positions.bot.find(p => p.position === 'FW') || positions.bot[4];
    }

    return {
      top: targetPlayer.top,
      left: possession === 'user' 
        ? `calc(${targetPlayer.left} + 8%)`
        : `calc(${targetPlayer.left} - 8%)`
    };
  };

  // Actualizar animaciones
  useEffect(() => {
    if (simulating) {
      const animationInterval = setInterval(() => {
        const newPositions = calculateDynamicPositions();
        setPlayerPositions(newPositions);
        
        const newBallPosition = calculateBallPosition();
        setBallPosition(newBallPosition);
      }, 800); // Actualizar más rápido para más dinamismo

      return () => clearInterval(animationInterval);
    }
  }, [simulating, possession, userFormation, botFormation]);

  return (
    <div className="soccer-field cyberpunk-futsal" ref={fieldRef}>
      <div className="cyberpunk-field">
        {/* Efecto de grid cyberpunk */}
        <div className="cyber-grid"></div>
        
        {/* Partículas flotantes */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="cyber-particle"
            style={{
              top: particle.top,
              left: particle.left,
              '--particle-color': particle.color
            }}
          />
        ))}

        {/* Líneas del campo cyberpunk */}
        <div className="cyber-center-circle"></div>
        <div className="cyber-center-spot"></div>
        <div className="cyber-penalty left"></div>
        <div className="cyber-penalty right"></div>
        <div className="cyber-goal left"></div>
        <div className="cyber-goal right"></div>
        
        {/* Trail del balón */}
        {ballTrail.map((point, index) => (
          <div
            key={point.id}
            className="ball-trail"
            style={{
              top: point.top,
              left: point.left,
              opacity: (index + 1) / ballTrail.length,
              '--trail-color': possession === 'user' ? '#00ff88' : '#ff0088'
            }}
          />
        ))}

        {simulating ? (
          <>
            {/* Jugadores del usuario */}
            {playerPositions.user.map((player) => (
              <div 
                key={player.id}
                className={`cyber-player user ${player.position} ${player.pulse ? 'pulse' : ''} ${possession === 'user' ? 'attacking' : 'defending'}`}
                style={{ 
                  top: player.top, 
                  left: player.left,
                  '--player-glow': player.color
                }}
                title={`${player.position} - ${state.character?.name || 'Usuario'}`}
              >
                <div className="player-holo"></div>
                <div className="player-core"></div>
                <span className="player-emoji">{player.emoji}</span>
                <div className="player-pulse"></div>
              </div>
            ))}

            {/* Jugadores del bot */}
            {playerPositions.bot.map((player) => (
              <div 
                key={player.id}
                className={`cyber-player bot ${player.position} ${player.pulse ? 'pulse' : ''} ${possession === 'bot' ? 'attacking' : 'defending'}`}
                style={{ 
                  top: player.top, 
                  left: player.left,
                  '--player-glow': player.color
                }}
                title={`${player.position} - ${state.selectedBot?.name || 'Rival'}`}
              >
                <div className="player-holo"></div>
                <div className="player-core"></div>
                <span className="player-emoji">{player.emoji}</span>
                <div className="player-pulse"></div>
              </div>
            ))}

            {/* Balón cyberpunk */}
            <div 
              className="cyber-ball glitching"
              style={ballPosition}
              data-possession={possession}
            >
              <div className="ball-core"></div>
              <div className="ball-aura"></div>
              ⚡
            </div>

            {/* HUD Cyberpunk */}
            <div className="cyber-hud">
              <div className="hud-section possession">
                <div className="hud-label">POSESIÓN</div>
                <div className={`hud-value ${possession}`}>
                  {possession === 'user' ? state.character?.name : state.selectedBot?.name}
                </div>
              </div>
              
              <div className="hud-section formation">
                <div className="hud-label">TÁCTICA</div>
                <div className="hud-value">{userFormation} vs {botFormation}</div>
              </div>

              <div className="hud-section time">
                <div className="hud-label">TIEMPO</div>
                <div className="hud-value">{state.matchTime || '0:00'}</div>
              </div>
            </div>

            {/* Efectos de escaneo */}
            <div className="scan-line"></div>
            <div className="radar-pulse"></div>
          </>
        ) : (
          <div className="cyber-message">
            <div className="message-glitch">FÚTSAL_CYBER.exe</div>
            <div className="message-sub">SISTEMA DE SIMULACIÓN INICIADO</div>
            <div className="terminal-prompt">_</div>
          </div>
        )}
      </div>
    </div>
  );
};
