import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state, dispatch }) => {
  const { possession, simulating } = state;
  const [players, setPlayers] = useState([]);
  const [ball, setBall] = useState({ x: 50, y: 50, withPlayer: 'user-fw', action: 'idle' });
  const [eventText, setEventText] = useState(null);
  const animationRef = useRef();

  // Inicializar jugadores
  useEffect(() => {
    const basePlayers = [
      { id: 'user-gk', team: 'user', position: 'GK', x: 8, y: 50 },
      { id: 'user-df1', team: 'user', position: 'DF', x: 25, y: 35 },
      { id: 'user-df2', team: 'user', position: 'DF', x: 25, y: 65 },
      { id: 'user-mf', team: 'user', position: 'MF', x: 45, y: 50 },
      { id: 'user-fw', team: 'user', position: 'FW', x: 65, y: 50 },

      { id: 'bot-gk', team: 'bot', position: 'GK', x: 92, y: 50 },
      { id: 'bot-df1', team: 'bot', position: 'DF', x: 75, y: 35 },
      { id: 'bot-df2', team: 'bot', position: 'DF', x: 75, y: 65 },
      { id: 'bot-mf', team: 'bot', position: 'MF', x: 55, y: 50 },
      { id: 'bot-fw', team: 'bot', position: 'FW', x: 35, y: 50 }
    ];
    setPlayers(basePlayers);
  }, []);

  // Función para movimiento suave
  const moveToward = (from, to, speed = 0.07) => from + (to - from) * speed;

  // Simula una acción aleatoria
  const simulateAction = () => {
    const currentPlayer = players.find(p => p.id === ball.withPlayer);
    if (!currentPlayer) return;

    const r = Math.random();
    if (r < 0.6) handlePass(currentPlayer);
    else if (r < 0.9) handleShot(currentPlayer);
    else handleDribble(currentPlayer);
  };

  // ---- ACCIONES ----

  const handlePass = (player) => {
    const teammates = players.filter(p => p.team === player.team && p.id !== player.id);
    const target = teammates[Math.floor(Math.random() * teammates.length)];
    if (!target) return;

    setBall({ ...ball, action: 'passing', from: player, to: target });
    setEventText(`${player.team === 'user' ? 'Usuario' : 'Bot'} realiza un pase a ${target.position}`);

    dispatch({
      type: 'ADD_EVENT',
      payload: {
        type: 'pass',
        team: player.team,
        text: `${player.position} realizó un pase a ${target.position}`,
        intensity: 'normal'
      }
    });
  };

  const handleShot = (player) => {
    const goalX = player.team === 'user' ? 97 : 3;
    const goalY = 45 + Math.random() * 10;
    setBall({ ...ball, action: 'shooting', from: player, to: { x: goalX, y: goalY } });
    setEventText(`${player.position} intenta un tiro al arco ⚽`);

    dispatch({
      type: 'ADD_EVENT',
      payload: {
        type: 'shot',
        team: player.team,
        text: `${player.position} intentó un tiro al arco`,
        intensity: 'high'
      }
    });
  };

  const handleDribble = (player) => {
    setBall({ ...ball, action: 'dribbling' });
    setEventText(`${player.position} avanza con el balón...`);

    dispatch({
      type: 'ADD_EVENT',
      payload: {
        type: 'tackle',
        team: player.team,
        text: `${player.position} intenta avanzar con la pelota`,
        intensity: 'normal'
      }
    });
  };

  const handleGoal = (team) => {
    setEventText(`🔥 ¡GOOOL del ${team === 'user' ? 'usuario' : 'bot'}!`);
    dispatch({
      type: 'ADD_EVENT',
      payload: {
        type: 'goal',
        team,
        text: `¡Gol del ${team === 'user' ? 'usuario' : 'bot'}!`,
        intensity: 'critical'
      }
    });

    setTimeout(() => setEventText(null), 2000);
    setBall({ x: 50, y: 50, withPlayer: team === 'user' ? 'bot-fw' : 'user-fw', action: 'idle' });
  };

  // ---- ANIMACIÓN PRINCIPAL ----

  useEffect(() => {
    if (!simulating) return;

    const animate = () => {
      setPlayers(prev =>
        prev.map(p => {
          let targetX = p.x, targetY = p.y;

          if (p.team === possession) {
            // Movimiento ofensivo
            if (p.position === 'FW') targetX += (p.team === 'user' ? 0.3 : -0.3);
          } else {
            // Movimiento defensivo
            if (p.position !== 'GK') targetX += (p.team === 'user' ? -0.1 : 0.1);
          }

          return { ...p, x: targetX, y: moveToward(p.y, 50, 0.02) };
        })
      );

      setBall(prev => {
        let bx = prev.x, by = prev.y;

        if (prev.action === 'passing' && prev.from && prev.to) {
          bx = moveToward(prev.x, prev.to.x, 0.15);
          by = moveToward(prev.y, prev.to.y, 0.15);
          const dist = Math.hypot(prev.to.x - bx, prev.to.y - by);
          if (dist < 2) {
            setBall({ x: prev.to.x, y: prev.to.y, withPlayer: prev.to.id, action: 'idle' });
          }
        } else if (prev.action === 'shooting') {
          bx = moveToward(prev.x, prev.to.x, 0.25);
          by = moveToward(prev.y, prev.to.y, 0.25);
          if (bx > 97 && by > 40 && by < 60) handleGoal('user');
          if (bx < 3 && by > 40 && by < 60) handleGoal('bot');
        } else if (prev.withPlayer) {
          const holder = players.find(p => p.id === prev.withPlayer);
          if (holder) {
            bx = holder.x + (holder.team === 'user' ? 1.5 : -1.5);
            by = holder.y;
          }
        }

        return { ...prev, x: bx, y: by };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    const actionInterval = setInterval(simulateAction, 2000);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(actionInterval);
    };
  }, [simulating, possession, players]);

  // ---- RENDER ----

  return (
    <div className="soccer-field futsal-professional">
      <div className="field-surface" />
      {/* Jugadores */}
      {players.map(p => (
        <div
          key={p.id}
          className={`player ${p.team} ${p.position} ${ball.withPlayer === p.id ? 'with-ball' : ''}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className="player-number">{p.number}</div>
        </div>
      ))}

      {/* Balón */}
      <div
        className={`soccer-ball ${ball.action}`}
        style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
      >
        <div className="ball-seams"></div>
      </div>

      {/* HUD de eventos */}
      {eventText && (
        <div className="match-hud">
          <div className="action-indicator">{eventText}</div>
        </div>
      )}
    </div>
  );
};
