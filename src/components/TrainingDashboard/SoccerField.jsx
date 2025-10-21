// SoccerField.jsx
import React, { useState, useEffect } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { simulating, possession, userFormation = '2-1-1', botFormation = '2-1-1' } = state;
  const [playerPositions, setPlayerPositions] = useState({ user: [], bot: [] });
  const [ballPosition, setBallPosition] = useState({ top: '50%', left: '50%' });

  // Jugadores fijos para usuario y bot
  const userPlayers = [
    { id: 'user-gk', position: 'GK', baseTop: '50%', baseLeft: '5%', number: '1', name: 'PORTERO' },
    { id: 'user-df1', position: 'DF', baseTop: '30%', baseLeft: '25%', number: '2', name: 'DEFENSA' },
    { id: 'user-df2', position: 'DF', baseTop: '70%', baseLeft: '25%', number: '3', name: 'DEFENSA' },
    { id: 'user-mf', position: 'MF', baseTop: '50%', baseLeft: '45%', number: '4', name: 'MEDIO' },
    { id: 'user-fw', position: 'FW', baseTop: '50%', baseLeft: '65%', number: '5', name: 'DELANTERO' }
  ];

  const botPlayers = [
    { id: 'bot-gk', position: 'GK', baseTop: '50%', baseLeft: '95%', number: '1', name: 'PORTERO' },
    { id: 'bot-df1', position: 'DF', baseTop: '30%', baseLeft: '75%', number: '2', name: 'DEFENSA' },
    { id: 'bot-df2', position: 'DF', baseTop: '70%', baseLeft: '75%', number: '3', name: 'DEFENSA' },
    { id: 'bot-mf', position: 'MF', baseTop: '50%', baseLeft: '55%', number: '4', name: 'MEDIO' },
    { id: 'bot-fw', position: 'FW', baseTop: '50%', baseLeft: '35%', number: '5', name: 'DELANTERO' }
  ];

  // Calcular posiciones dinámicas
  const calculateDynamicPositions = () => {
    const adjustedUser = userPlayers.map(player => {
      let dynamicLeft = player.baseLeft;
      let dynamicTop = player.baseTop;

      // Ajustes según posesión
      if (possession === 'user') {
        if (player.position === 'FW') dynamicLeft = '72%';
        if (player.position === 'MF') dynamicLeft = '52%';
        if (player.position === 'DF') dynamicLeft = '32%';
      } else {
        if (player.position === 'FW') dynamicLeft = '42%';
        if (player.position === 'MF') dynamicLeft = '28%';
      }

      // Pequeña variación vertical para movimiento natural
      const variation = (Math.random() - 0.5) * 8;
      return {
        ...player,
        top: `calc(${dynamicTop} + ${variation}%)`,
        left: dynamicLeft
      };
    });

    const adjustedBot = botPlayers.map(player => {
      let dynamicLeft = player.baseLeft;
      let dynamicTop = player.baseTop;

      if (possession === 'bot') {
        if (player.position === 'FW') dynamicLeft = '28%';
        if (player.position === 'MF') dynamicLeft = '48%';
        if (player.position === 'DF') dynamicLeft = '68%';
      } else {
        if (player.position === 'FW') dynamicLeft = '58%';
        if (player.position === 'MF') dynamicLeft = '72%';
      }

      const variation = (Math.random() - 0.5) * 8;
      return {
        ...player,
        top: `calc(${dynamicTop} + ${variation}%)`,
        left: dynamicLeft
      };
    });

    return { user: adjustedUser, bot: adjustedBot };
  };

  // Calcular posición del balón
  const calculateBallPosition = () => {
    const positions = calculateDynamicPositions();
    
    if (possession === 'user') {
      const forwardPlayer = positions.user.find(p => p.position === 'FW') || positions.user[4];
      return {
        top: forwardPlayer.top,
        left: `calc(${forwardPlayer.left} + 6%)`
      };
    } else {
      const forwardPlayer = positions.bot.find(p => p.position === 'FW') || positions.bot[4];
      return {
        top: forwardPlayer.top,
        left: `calc(${forwardPlayer.left} - 6%)`
      };
    }
  };

  // Actualizar animaciones
  useEffect(() => {
    if (simulating) {
      const interval = setInterval(() => {
        const newPositions = calculateDynamicPositions();
        setPlayerPositions(newPositions);
        setBallPosition(calculateBallPosition());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [simulating, possession]);

  // Inicializar
  useEffect(() => {
    if (simulating) {
      const initialPositions = calculateDynamicPositions();
      setPlayerPositions(initialPositions);
      setBallPosition(calculateBallPosition());
    }
  }, [simulating]);

  return (
    <div className="soccer-field futsal-realistic">
      <div className="field-surface">
        {/* Líneas de la cancha de fútsal */}
        <div className="field-line touch-line top"></div>
        <div className="field-line touch-line bottom"></div>
        <div className="field-line goal-line left"></div>
        <div className="field-line goal-line right"></div>
        <div className="field-line halfway-line"></div>
        
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        
        {/* Áreas de penal */}
        <div className="penalty-area left">
          <div className="penalty-spot"></div>
          <div className="penalty-arc"></div>
        </div>
        <div className="penalty-area right">
          <div className="penalty-spot"></div>
          <div className="penalty-arc"></div>
        </div>

        {/* Punto de doble penal (6ta falta) */}
        <div className="second-penalty-spot"></div>
        
        {/* Arcos */}
        <div className="goal left"></div>
        <div className="goal right"></div>

        {simulating ? (
          <>
            {/* Jugadores del usuario */}
            {playerPositions.user.map((player) => (
              <div 
                key={player.id}
                className={`player user ${player.position} ${possession === 'user' && player.position === 'FW' ? 'with-ball' : ''}`}
                style={{ 
                  top: player.top, 
                  left: player.left
                }}
              >
                <div className="player-number">{player.number}</div>
                <div className="player-position">{player.name}</div>
              </div>
            ))}

            {/* Jugadores del bot */}
            {playerPositions.bot.map((player) => (
              <div 
                key={player.id}
                className={`player bot ${player.position} ${possession === 'bot' && player.position === 'FW' ? 'with-ball' : ''}`}
                style={{ 
                  top: player.top, 
                  left: player.left
                }}
              >
                <div className="player-number">{player.number}</div>
                <div className="player-position">{player.name}</div>
              </div>
            ))}

            {/* Balón */}
            <div 
              className="soccer-ball"
              style={ballPosition}
            >
              <div className="ball-pattern"></div>
            </div>

            {/* Indicador de posesión */}
            <div className="possession-indicator">
              <div className={`possession-team ${possession}`}>
                {possession === 'user' ? state.character?.name : state.selectedBot?.name}
              </div>
              <div className="formation-display">
                Formación: {userFormation} vs {botFormation}
              </div>
            </div>
          </>
        ) : (
          <div className="field-message">
            <h3>SIMULADOR DE FÚTSAL</h3>
            <p>Preparado para comenzar el partido</p>
          </div>
        )}
      </div>
    </div>
  );
};
