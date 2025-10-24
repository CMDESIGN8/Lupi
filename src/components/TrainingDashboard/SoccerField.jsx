// SoccerField.jsx - VERSIÓN OPTIMIZADA Y FUNCIONAL
import React, { useState, useEffect, useRef } from 'react';
import "../../styles/SoccerField.css";

export const SoccerField = ({ state }) => {
  const { 
    simulating, 
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
  
  const [goalEffect, setGoalEffect] = useState(null);
  const [doublePenaltyEffect, setDoublePenaltyEffect] = useState(false);
  const [lastGoalTeam, setLastGoalTeam] = useState(null);
  const [currentZone, setCurrentZone] = useState('midfield');
  
  const lastProcessedEvent = useRef(null);
  const ballRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  const safeSetTimeout = (fn, delay) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(tid => tid !== id);
      fn();
    }, delay);
    timeoutsRef.current.push(id);
  };

  // Actualizar estilo del balón con ref
  const updateBallStyle = (ball) => {
    if (ballRef.current) {
      ballRef.current.style.setProperty('--ball-x', `${ball.x}%`);
      ballRef.current.style.setProperty('--ball-y', `${ball.y}%`);
    }
  };

  // Obtener posiciones según formación
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

  // Inicializar jugadores
  const initializePlayers = () => {
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
      hasBall: false
    }));

    const botPlayers = botPositions.map((pos, index) => ({
      id: `bot-${pos.position.toLowerCase()}${index}`,
      team: 'bot',
      position: pos.position,
      x: pos.x,
      y: pos.y,
      number: (index + 1).toString(),
      name: pos.position,
      hasBall: false
    }));

    return [...userPlayers, ...botPlayers];
  };

  // Configurar saque de centro tras gol
  const setupKickoffAfterGoal = (scoringTeam) => {
    const players = initializePlayers();
    const kickoffTeam = scoringTeam === 'user' ? 'bot' : 'user';

    // Buscar jugador para saque con fallback
    const kickoffPlayer = 
      players.find(p => p.team === kickoffTeam && p.position === 'FW') ||
      players.find(p => p.team === kickoffTeam && p.position === 'MF') ||
      players.find(p => p.team === kickoffTeam && p.position === 'DF') ||
      players.find(p => p.team === kickoffTeam && p.position === 'GK');

    if (kickoffPlayer) {
      const newState = {
        players: players.map(player => ({
          ...player,
          hasBall: player.id === kickoffPlayer.id
        })),
        ball: { x: 50, y: 50, withPlayer: kickoffPlayer.id },
        action: 'moving',
        targetPlayer: null
      };
      setGameState(newState);
      updateBallStyle(newState.ball);
      console.log(`🔄 Saque de centro: ${kickoffTeam} inicia`);
    }
  };

  // Procesar un solo evento
  const processEvent = (event) => {
    if (event.fieldZone) {
      setCurrentZone(event.fieldZone);
    }

    switch (event.type) {
      case 'goal': {
        const scoringTeam = event.team;
        const goalBallPosition = scoringTeam === 'user' 
          ? { x: 95, y: 45 + Math.random() * 10 } 
          : { x: 5, y: 45 + Math.random() * 10 };

        setGoalEffect('active');
        setLastGoalTeam(scoringTeam);
        setGameState(prev => ({
          ...prev,
          ball: { ...goalBallPosition, withPlayer: null },
          action: 'shooting'
        }));
        updateBallStyle(goalBallPosition);

        safeSetTimeout(() => {
          setGoalEffect(null);
          setupKickoffAfterGoal(scoringTeam);
        }, 2500);
        break;
      }

      case 'double_penalty': {
        setDoublePenaltyEffect(true);
        setGameState(prev => ({
          ...prev,
          action: 'double_penalty',
          ball: { x: 50, y: 38, withPlayer: null }
        }));
        updateBallStyle({ x: 50, y: 38 });

        safeSetTimeout(() => {
          setDoublePenaltyEffect(false);
          if (event.isGoal) {
            setGoalEffect('active');
            setLastGoalTeam(event.team);
            safeSetTimeout(() => {
              setGoalEffect(null);
              setupKickoffAfterGoal(event.team);
            }, 2500);
          } else {
            setupKickoffAfterGoal(event.team);
          }
        }, 1500);
        break;
      }

      case 'foul': {
        const foulBall = {
          x: event.team === 'user' ? 35 : 65,
          y: 30 + Math.random() * 40,
          withPlayer: null
        };
        setGameState(prev => ({
          ...prev,
          action: 'foul',
          ball: foulBall
        }));
        updateBallStyle(foulBall);

        safeSetTimeout(() => {
          setGameState(prev => ({ ...prev, action: 'moving' }));
        }, 1000);
        break;
      }

      case 'dribble':
      case 'tackle':
      case 'pass':
      case 'interception':
        // Aquí podrías añadir lógica específica si el evento incluye posición
        setGameState(prev => ({
          ...prev,
          action: event.type === 'dribble' ? 'dribbling' :
                   event.type === 'tackle' ? 'tackle' :
                   event.type === 'pass' ? 'passing' : 'moving'
        }));
        safeSetTimeout(() => {
          setGameState(prev => ({ ...prev, action: 'moving' }));
        }, 800);
        break;

      default:
        setGameState(prev => ({ ...prev, action: 'moving' }));
    }
  };

  // Manejar eventos del backend
  useEffect(() => {
    if (!simulating || !matchEvents?.length) return;

    const latestEvent = matchEvents[0];
    if (lastProcessedEvent.current === latestEvent.id) return;

    lastProcessedEvent.current = latestEvent.id;
    processEvent(latestEvent);
  }, [matchEvents, simulating, userFormation, botFormation]);

  // Inicializar estado al empezar
  useEffect(() => {
    if (simulating && gameState.players.length === 0) {
      const players = initializePlayers();
      const initialBall = { x: 50, y: 50, withPlayer: null };
      setGameState({ players, ball: initialBall, action: 'moving', targetPlayer: null });
      updateBallStyle(initialBall);
    }
  }, [simulating, userFormation, botFormation]);

  // Reiniciar al detener simulación
  useEffect(() => {
    if (!simulating) {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
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

        {/* Indicador de Zona */}
        {simulating && (
          <div className="field-zone-indicator">
            <div className={`zone-display ${currentZone}`}>
              ZONA: {currentZone === 'defensive' ? 'DEFENSIVA' : 
                     currentZone === 'midfield' ? 'MEDIO CAMPO' : 'DE ATAQUE'}
            </div>
          </div>
        )}

        {/* Efecto Doble Penalti */}
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
                  style={{ '--spark-angle': (i * 45) + 'deg' }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Efecto de Gol */}
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
                style={{ left: `${player.x}%`, top: `${player.y}%` }}
              >
                <div className="player-number">{player.number}</div>
                <div className="player-glow"></div>
                {player.hasBall && <div className="ball-holder"></div>}
                <div className="player-position-badge">{player.position}</div>
              </div>
            ))}

            {/* Balón */}
            <div 
              ref={ballRef}
              className={`soccer-ball ${gameState.action} ${gameState.ball.withPlayer ? 'with-player' : 'free'}`}
              style={{ left: `${gameState.ball.x}%`, top: `${gameState.ball.y}%` }}
            >
              <div className="ball-seams"></div>
            </div>

            {/* Línea de pase (opcional) */}
            {gameState.targetPlayer && (
              <div 
                className="pass-line"
                style={{ left: `${gameState.ball.x}%`, top: `${gameState.ball.y}%` }}
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
                  <div className="vs-badge"><span>VS</span></div>
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
