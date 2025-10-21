// SoccerField.jsx
import React, { useState, useEffect } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { simulating, possession, userFormation = '2-1-1', botFormation = '2-1-1', matchEvents } = state;
  const [playerPositions, setPlayerPositions] = useState({ user: [], bot: [] });
  const [ballPosition, setBallPosition] = useState({ top: '50%', left: '50%' });

  // Posiciones base para formaciones
  const baseFormations = {
    '2-1-1': {
      user: [
        { id: 'user-gk', position: 'GK', baseTop: '50%', baseLeft: '8%', emoji: '🧤' },
        { id: 'user-df1', position: 'DF', baseTop: '30%', baseLeft: '25%', emoji: '🔵' },
        { id: 'user-df2', position: 'DF', baseTop: '70%', baseLeft: '25%', emoji: '🔵' },
        { id: 'user-mf', position: 'MF', baseTop: '50%', baseLeft: '45%', emoji: '🟢' },
        { id: 'user-fw', position: 'FW', baseTop: '50%', baseLeft: '65%', emoji: '🔴' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', baseTop: '50%', baseLeft: '92%', emoji: '🧤' },
        { id: 'bot-df1', position: 'DF', baseTop: '30%', baseLeft: '75%', emoji: '🔵' },
        { id: 'bot-df2', position: 'DF', baseTop: '70%', baseLeft: '75%', emoji: '🔵' },
        { id: 'bot-mf', position: 'MF', baseTop: '50%', baseLeft: '55%', emoji: '🟢' },
        { id: 'bot-fw', position: 'FW', baseTop: '50%', left: '35%', emoji: '🔴' }
      ]
    },
    '3-1': {
      user: [
        { id: 'user-gk', position: 'GK', baseTop: '50%', baseLeft: '8%', emoji: '🧤' },
        { id: 'user-df1', position: 'DF', baseTop: '20%', baseLeft: '25%', emoji: '🔵' },
        { id: 'user-df2', position: 'DF', baseTop: '50%', baseLeft: '25%', emoji: '🔵' },
        { id: 'user-df3', position: 'DF', baseTop: '80%', baseLeft: '25%', emoji: '🔵' },
        { id: 'user-fw', position: 'FW', baseTop: '50%', baseLeft: '60%', emoji: '🔴' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', baseTop: '50%', baseLeft: '92%', emoji: '🧤' },
        { id: 'bot-df1', position: 'DF', baseTop: '20%', baseLeft: '75%', emoji: '🔵' },
        { id: 'bot-df2', position: 'DF', baseTop: '50%', baseLeft: '75%', emoji: '🔵' },
        { id: 'bot-df3', position: 'DF', baseTop: '80%', baseLeft: '75%', emoji: '🔵' },
        { id: 'bot-fw', position: 'FW', baseTop: '50%', baseLeft: '40%', emoji: '🔴' }
      ]
    },
    '1-2-1': {
      user: [
        { id: 'user-gk', position: 'GK', baseTop: '50%', baseLeft: '8%', emoji: '🧤' },
        { id: 'user-df', position: 'DF', baseTop: '50%', baseLeft: '25%', emoji: '🔵' },
        { id: 'user-mf1', position: 'MF', baseTop: '30%', baseLeft: '45%', emoji: '🟢' },
        { id: 'user-mf2', position: 'MF', baseTop: '70%', baseLeft: '45%', emoji: '🟢' },
        { id: 'user-fw', position: 'FW', baseTop: '50%', baseLeft: '65%', emoji: '🔴' }
      ],
      bot: [
        { id: 'bot-gk', position: 'GK', baseTop: '50%', baseLeft: '92%', emoji: '🧤' },
        { id: 'bot-df', position: 'DF', baseTop: '50%', baseLeft: '75%', emoji: '🔵' },
        { id: 'bot-mf1', position: 'MF', baseTop: '30%', baseLeft: '55%', emoji: '🟢' },
        { id: 'bot-mf2', position: 'MF', baseTop: '70%', baseLeft: '55%', emoji: '🟢' },
        { id: 'bot-fw', position: 'FW', baseTop: '50%', baseLeft: '35%', emoji: '🔴' }
      ]
    }
  };

  // Calcular posiciones dinámicas basadas en la posesión
  const calculateDynamicPositions = () => {
    const userBase = baseFormations[userFormation]?.user || baseFormations['2-1-1'].user;
    const botBase = baseFormations[botFormation]?.bot || baseFormations['2-1-1'].bot;

    // Ajustar posiciones según quién tiene la posesión
    const adjustedUser = userBase.map(player => {
      let dynamicLeft = player.baseLeft;
      let dynamicTop = player.baseTop;

      if (possession === 'user') {
        // Cuando el usuario ataca, avanzan posiciones
        if (player.position === 'FW') {
          dynamicLeft = '75%';
        } else if (player.position === 'MF') {
          dynamicLeft = '55%';
        } else if (player.position === 'DF') {
          dynamicLeft = '35%';
        }
      } else {
        // Cuando el usuario defiende, retroceden
        if (player.position === 'FW') {
          dynamicLeft = '45%';
        } else if (player.position === 'MF') {
          dynamicLeft = '30%';
        }
      }

      // Pequeñas variaciones aleatorias para movimiento natural
      const randomVariation = (Math.random() - 0.5) * 10;
      dynamicTop = `calc(${dynamicTop} + ${randomVariation}%)`;

      return {
        ...player,
        top: dynamicTop,
        left: dynamicLeft
      };
    });

    const adjustedBot = botBase.map(player => {
      let dynamicLeft = player.baseLeft;
      let dynamicTop = player.baseTop;

      if (possession === 'bot') {
        // Cuando el bot ataca, avanzan
        if (player.position === 'FW') {
          dynamicLeft = '25%';
        } else if (player.position === 'MF') {
          dynamicLeft = '45%';
        } else if (player.position === 'DF') {
          dynamicLeft = '65%';
        }
      } else {
        // Cuando el bot defiende, retroceden
        if (player.position === 'FW') {
          dynamicLeft = '55%';
        } else if (player.position === 'MF') {
          dynamicLeft = '70%';
        }
      }

      const randomVariation = (Math.random() - 0.5) * 10;
      dynamicTop = `calc(${dynamicTop} + ${randomVariation}%)`;

      return {
        ...player,
        top: dynamicTop,
        left: dynamicLeft
      };
    });

    return { user: adjustedUser, bot: adjustedBot };
  };

  // Calcular posición del balón
  const calculateBallPosition = () => {
    const positions = calculateDynamicPositions();
    
    if (possession === 'user') {
      // El balón sigue al delantero del usuario
      const forwardPlayer = positions.user.find(p => p.position === 'FW') || positions.user[4];
      return {
        top: forwardPlayer.top,
        left: `calc(${forwardPlayer.left} + 5%)`
      };
    } else {
      // El balón sigue al delantero del bot
      const forwardPlayer = positions.bot.find(p => p.position === 'FW') || positions.bot[4];
      return {
        top: forwardPlayer.top,
        left: `calc(${forwardPlayer.left} - 5%)`
      };
    }
  };

  // Actualizar posiciones cuando cambia la posesión o eventos
  useEffect(() => {
    if (simulating) {
      const newPositions = calculateDynamicPositions();
      setPlayerPositions(newPositions);
      
      const newBallPosition = calculateBallPosition();
      setBallPosition(newBallPosition);
    }
  }, [simulating, possession, userFormation, botFormation, matchEvents]);

  // Inicializar posiciones
  useEffect(() => {
    if (simulating) {
      const initialPositions = calculateDynamicPositions();
      setPlayerPositions(initialPositions);
      setBallPosition(calculateBallPosition());
    }
  }, [simulating]);

  return (
    <div className="soccer-field improved futsal-field">
      <div className="field-grass">
        {/* Líneas del campo */}
        <div className="center-circle"></div>
        <div className="center-spot"></div>
        <div className="penalty-area left futsal-penalty"></div>
        <div className="penalty-area right futsal-penalty"></div>
        <div className="goal left futsal-goal"></div>
        <div className="goal right futsal-goal"></div>
        
        {simulating ? (
          <>
            {/* Jugadores del usuario con movimiento */}
            {playerPositions.user.map((player) => (
              <div 
                key={player.id}
                className={`player user ${player.position} moving`}
                style={{ 
                  top: player.top, 
                  left: player.left
                }}
                title={`${player.position} - ${state.character?.name || 'Usuario'}`}
              >
                {player.emoji}
              </div>
            ))}

            {/* Jugadores del bot con movimiento */}
            {playerPositions.bot.map((player) => (
              <div 
                key={player.id}
                className={`player bot ${player.position} moving`}
                style={{ 
                  top: player.top, 
                  left: player.left
                }}
                title={`${player.position} - ${state.selectedBot?.name || 'Rival'}`}
              >
                {player.emoji}
              </div>
            ))}

            {/* Balón con movimiento suave */}
            <div 
              className="soccer-ball moving"
              style={ballPosition}
            >
              ⚽
            </div>

            {/* Información del juego */}
            <div className="game-info">
              <div className="possession-indicator-field">
                Posesión: {possession === 'user' ? state.character?.name : state.selectedBot?.name}
              </div>
              <div className="formation-info">
                {userFormation} vs {botFormation}
              </div>
            </div>
          </>
        ) : (
          <div className="field-message improved">
            <h3>SIMULADOR FÚTSAL PRO</h3>
            <p>Elige un oponente y formación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};
