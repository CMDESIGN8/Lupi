import React, { useState, useEffect, useRef, useCallback } from "react"; 
import "../styles/TrainingDashboard.css"; 

const TrainingDashboard = ({ character, bots, matchHistory, loading, simulating, selectedBot, onStartMatch }) => { 
  const [activePanel, setActivePanel] = useState("bots"); 
  const [matchEvents, setMatchEvents] = useState([]); 
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 }); 
  const [playerPositions, setPlayerPositions] = useState({ 
    user: { x: 20, y: 30 }, 
    bot: { x: 80, y: 30 } 
  }); 
  const [matchStats, setMatchStats] = useState({ 
    shots: { user: 0, bot: 0 },
    shotsOnTarget: { user: 0, bot: 0 },
    passes: { user: 0, bot: 0 },
    tackles: { user: 0, bot: 0 },
    dribbles: { user: 0, bot: 0 },
    goals: { user: 0, bot: 0 },
    saves: { user: 0, bot: 0 },
    possession: { user: 50, bot: 50 },
    fouls: { user: 0, bot: 0 },
    corners: { user: 0, bot: 0 },
    offsides: { user: 0, bot: 0 }
  }); 

  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [teamLineups, setTeamLineups] = useState({
    user: [],
    bot: []
  });

  const animationRef = useRef(null);
  const timeoutRefs = useRef([]);
  const matchTimerRef = useRef(null);

  // Limpiar todos los timeouts y animaciones
  const clearAllAnimations = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (matchTimerRef.current) {
      clearInterval(matchTimerRef.current);
      matchTimerRef.current = null;
    }
    
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  useEffect(() => { 
    if (simulating) { 
      initializeMatch();
      startMatchAnimation(); 
    } else { 
      resetAnimations(); 
    } 
    
    return () => {
      clearAllAnimations();
    };
  }, [simulating, clearAllAnimations]); 

  const initializeMatch = useCallback(() => {
    setCurrentMinute(0);
    setIsPaused(false);
    setMatchResult(null);
    
    // Inicializar alineaciones
    const userPlayers = generateLineup(character, 'user');
    const botPlayers = generateLineup(selectedBot, 'bot');
    setTeamLineups({ user: userPlayers, bot: botPlayers });
    
    // Iniciar cronómetro del partido
    matchTimerRef.current = setInterval(() => {
      setCurrentMinute(prev => {
        if (prev >= 90) {
          endMatch();
          return 90;
        }
        return prev + 1;
      });
    }, 1000); // 1 segundo = 1 minuto de juego
  }, [character, selectedBot]);

  const generateLineup = (team, teamType) => {
    const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'];
    return positions.map((pos, index) => ({
      id: `${teamType}-${index}`,
      position: pos,
      number: index + 1,
      name: teamType === 'user' ? `${character?.nickname} ${index + 1}` : `${selectedBot?.name} ${index + 1}`,
      x: getInitialPosition(pos, teamType).x,
      y: getInitialPosition(pos, teamType).y
    }));
  };

  const getInitialPosition = (position, teamType) => {
    const baseX = teamType === 'user' ? 25 : 75;
    
    const positions = {
      'GK': { x: baseX, y: 50 },
      'DF': { x: baseX + (teamType === 'user' ? 10 : -10), y: [30, 50, 70][Math.floor(Math.random() * 3)] },
      'MF': { x: baseX + (teamType === 'user' ? 25 : -25), y: [25, 50, 75][Math.floor(Math.random() * 3)] },
      'FW': { x: baseX + (teamType === 'user' ? 40 : -40), y: [35, 50, 65][Math.floor(Math.random() * 3)] }
    };
    
    return positions[position] || { x: baseX, y: 50 };
  };

  const endMatch = () => {
    clearAllAnimations();
    setIsPaused(true);
    
    const result = {
      userScore: matchStats.goals.user,
      botScore: matchStats.goals.bot,
      winner: matchStats.goals.user > matchStats.goals.bot ? 'user' : 
              matchStats.goals.user < matchStats.goals.bot ? 'bot' : 'draw'
    };
    
    setMatchResult(result);
    
    // Agregar evento final
    const finalEvent = {
      id: Date.now(),
      type: 'final',
      text: result.winner === 'draw' ? '⚽ FINAL DEL PARTIDO - EMPATE' : 
            `🏆 FINAL DEL PARTIDO - ${result.winner === 'user' ? character?.nickname : selectedBot?.name} GANA`,
      team: 'neutral',
      intensity: 'very-high',
      time: '90\''
    };
    
    setMatchEvents(prev => [finalEvent, ...prev]);
  };

  const resetAnimations = useCallback(() => { 
    clearAllAnimations();
    setMatchEvents([]); 
    setBallPosition({ x: 50, y: 50 }); 
    setPlayerPositions({ 
      user: { x: 20, y: 30 }, 
      bot: { x: 80, y: 30 } 
    }); 
    setMatchStats({ 
      shots: { user: 0, bot: 0 },
      shotsOnTarget: { user: 0, bot: 0 },
      passes: { user: 0, bot: 0 },
      tackles: { user: 0, bot: 0 },
      dribbles: { user: 0, bot: 0 },
      goals: { user: 0, bot: 0 },
      saves: { user: 0, bot: 0 },
      possession: { user: 50, bot: 50 },
      fouls: { user: 0, bot: 0 },
      corners: { user: 0, bot: 0 },
      offsides: { user: 0, bot: 0 }
    }); 
    setCurrentMinute(0);
    setIsPaused(false);
    setMatchResult(null);
    setTeamLineups({ user: [], bot: [] });
  }, [clearAllAnimations]); 

  const startMatchAnimation = useCallback(() => { 
    // Evento inicial
    addMatchEvent({
      type: 'kickoff',
      text: '⚽ ¡COMIENZA EL PARTIDO!',
      team: 'neutral',
      intensity: 'medium'
    });

    // Generar eventos del partido basados en estadísticas de equipos
    generateMatchEvents();
  }, [character, selectedBot]); 

  const generateMatchEvents = useCallback(() => {
    const eventInterval = setInterval(() => {
      if (!simulating || isPaused || currentMinute >= 90) {
        clearInterval(eventInterval);
        return;
      }

      // Probabilidad de evento basada en minuto y estadísticas
      const eventProbability = getEventProbability();
      
      if (Math.random() < eventProbability) {
        const event = generateRealisticEvent();
        if (event) {
          addMatchEvent(event);
          updateMatchStats(event);
          animateEvent(event);
        }
      }
    }, 1500); // Evento cada 1.5 segundos

    timeoutRefs.current.push(eventInterval);
  }, [simulating, isPaused, currentMinute, character, selectedBot]);

  const getEventProbability = () => {
    // Más eventos en minutos clave
    if (currentMinute < 5) return 0.3; // Inicio tranquilo
    if (currentMinute > 85) return 0.8; // Final emocionante
    if (currentMinute > 40 && currentMinute < 45) return 0.7; // Final primera parte
    if (currentMinute > 80) return 0.6; // Final del partido
    
    return 0.4; // Probabilidad base
  };

  const generateRealisticEvent = () => {
    const eventTypes = [
      { type: 'pass', weight: 40 },
      { type: 'dribble', weight: 15 },
      { type: 'tackle', weight: 12 },
      { type: 'shot', weight: 10 },
      { type: 'cross', weight: 8 },
      { type: 'corner', weight: 5 },
      { type: 'freekick', weight: 4 },
      { type: 'foul', weight: 3 },
      { type: 'offside', weight: 2 },
      { type: 'goal', weight: 1 }
    ];

    const totalWeight = eventTypes.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedEvent;
    for (const event of eventTypes) {
      random -= event.weight;
      if (random <= 0) {
        selectedEvent = event.type;
        break;
      }
    }

    const team = Math.random() * 100 < (50 + (character?.level - selectedBot?.level) * 5) ? 'user' : 'bot';
    
    return createEventData(selectedEvent, team);
  };

  const createEventData = (eventType, team) => {
    const baseEvents = {
      pass: [
        'Pase corto al mediocampo',
        'Pase largo al delantero',
        'Pase filtrado entre líneas',
        'Pase de pared efectivo',
        'Cambio de juego al otro lado'
      ],
      dribble: [
        'Regate magistral',
        'Gambeta espectacular',
        'Amago y cambio de dirección',
        'Túnel al defensor',
        'Control orientado y avance'
      ],
      tackle: [
        'Entrada limpia',
        'Barrida precisa',
        'Recuperación del balón',
        'Anticipación perfecta',
        'Carga fuerte pero legal'
      ],
      shot: [
        'Disparo desde fuera del área',
        'Remate de cabeza',
        'Tiro colocado',
        'Chut potente',
        'Vaselina al arquero'
      ],
      cross: [
        'Centro al área',
        'Centro atrás',
        'Centro raso',
        'Centro elevado',
        'Centro desde la línea de fondo'
      ],
      corner: [
        'Saque de esquina',
        'Corner corto',
        'Corner al primer palo',
        'Corner al punto de penal'
      ],
      freekick: [
        'Tiro libre directo',
        'Falta estratégica',
        'Tiro libre al área',
        'Falta cerca del área'
      ],
      foul: [
        'Falta táctica',
        'Entrada dura',
        'Juego peligroso',
        'Tirón de camiseta'
      ],
      offside: [
        'Fuera de juego',
        'Trampa del fuera de juego',
        'Posición adelantada'
      ],
      goal: [
        '¡¡¡GOOOOL!!!',
        'Gol espectacular',
        'Gol de cabeza',
        'Gol desde fuera del área',
        'Gol en jugada colectiva'
      ]
    };

    const intensities = {
      pass: 'low', dribble: 'medium', tackle: 'medium', shot: 'high',
      cross: 'medium', corner: 'medium', freekick: 'high', foul: 'medium',
      offside: 'low', goal: 'very-high'
    };

    const texts = baseEvents[eventType];
    const text = texts ? texts[Math.floor(Math.random() * texts.length)] : 'Acción del partido';

    return {
      type: eventType,
      text: text,
      team: team,
      intensity: intensities[eventType] || 'medium',
      time: `${currentMinute}'`
    };
  };

  const addMatchEvent = (event) => {
    const eventWithId = {
      ...event,
      id: Date.now() + Math.random(),
      time: `${currentMinute}'`
    };
    
    setMatchEvents(prev => [eventWithId, ...prev.slice(0, 19)]); // Mantener últimos 20 eventos
  };

  const updateMatchStats = (event) => {
    setMatchStats(prev => {
      const newStats = { ...prev };
      const team = event.team;
      
      if (team !== 'neutral') {
        switch (event.type) {
          case 'pass':
            newStats.passes[team]++;
            newStats.possession[team] = Math.min(100, newStats.possession[team] + 1);
            newStats.possession[team === 'user' ? 'bot' : 'user'] = Math.max(0, newStats.possession[team === 'user' ? 'bot' : 'user'] - 1);
            break;
          case 'shot':
            newStats.shots[team]++;
            if (Math.random() > 0.4) newStats.shotsOnTarget[team]++;
            break;
          case 'tackle':
            newStats.tackles[team]++;
            break;
          case 'dribble':
            newStats.dribbles[team]++;
            break;
          case 'goal':
            newStats.goals[team]++;
            newStats.shots[team]++;
            newStats.shotsOnTarget[team]++;
            break;
          case 'foul':
            newStats.fouls[team]++;
            break;
          case 'corner':
            newStats.corners[team]++;
            break;
          case 'offside':
            newStats.offsides[team]++;
            break;
        }
      }
      
      return newStats;
    });
  };

  const animateEvent = (event) => {
    if (event.type === 'goal') {
      // Animación especial para gol
      celebrateGoal(event.team);
    } else if (event.intensity === 'high' || event.intensity === 'very-high') {
      // Mover jugadores para eventos importantes
      movePlayersForEvent(event.type, event.team);
    }
    
    // Animación del balón
    animateBallMovement(event.type, event.team);
  };

  const celebrateGoal = (team) => {
    const celebrationPositions = team === 'user' 
      ? { user: { x: 70, y: 20 }, bot: { x: 30, y: 80 } }
      : { user: { x: 30, y: 80 }, bot: { x: 70, y: 20 } };
    
    setPlayerPositions(celebrationPositions);
    
    // Volver a posición después de celebración
    timeoutRefs.current.push(setTimeout(() => {
      setPlayerPositions({ 
        user: { x: 20, y: 30 }, 
        bot: { x: 80, y: 30 } 
      });
      setBallPosition({ x: 50, y: 50 }); // Saque de centro
    }, 3000));
  };

  const movePlayersForEvent = (eventType, team) => {
    let newPositions = {};
    
    if (eventType === 'shot') {
      newPositions = team === 'user' 
        ? { user: { x: 65, y: 25 }, bot: { x: 35, y: 75 } }
        : { user: { x: 35, y: 75 }, bot: { x: 65, y: 25 } };
    } else if (eventType === 'corner') {
      newPositions = team === 'user'
        ? { user: { x: 70, y: 15 }, bot: { x: 30, y: 85 } }
        : { user: { x: 30, y: 85 }, bot: { x: 70, y: 15 } };
    }
    
    if (Object.keys(newPositions).length > 0) {
      setPlayerPositions(newPositions);
      
      timeoutRefs.current.push(setTimeout(() => {
        setPlayerPositions({ 
          user: { x: 20, y: 30 }, 
          bot: { x: 80, y: 30 } 
        });
      }, 2000));
    }
  };

  const animateBallMovement = (eventType, team) => {
    const startTime = Date.now();
    const duration = 1000;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        let x, y;
        
        switch (eventType) {
          case 'shot':
            x = team === 'user' ? 50 + 25 * progress : 50 - 25 * progress;
            y = 50 - 20 * Math.sin(progress * Math.PI);
            break;
          case 'pass':
            x = 50 + 15 * Math.sin(progress * Math.PI * 2);
            y = 50 + 10 * Math.sin(progress * Math.PI * 4);
            break;
          default:
            x = 50 + 10 * Math.sin(progress * Math.PI);
            y = 50 + 5 * Math.sin(progress * Math.PI * 2);
        }
        
        setBallPosition({ x, y });
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      clearInterval(matchTimerRef.current);
    } else {
      matchTimerRef.current = setInterval(() => {
        setCurrentMinute(prev => {
          if (prev >= 90) {
            endMatch();
            return 90;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const getDifficultyColor = useCallback((difficulty) => { 
    switch (difficulty) { 
      case 'easy': return '#4cc9f0'; 
      case 'medium': return '#4361ee'; 
      case 'hard': return '#7209b7'; 
      default: return '#00bbf9'; 
    } 
  }, []); 

  const getDifficultyText = useCallback((difficulty) => { 
    switch (difficulty) { 
      case 'easy': return 'FÁCIL'; 
      case 'medium': return 'MEDIO'; 
      case 'hard': return 'DIFÍCIL'; 
      default: return difficulty.toUpperCase(); 
    } 
  }, []); 

  const getBotAvatar = useCallback((botLevel) => { 
    if (botLevel <= 2) return "🥅"; 
    if (botLevel <= 4) return "⚽"; 
    if (botLevel <= 6) return "👟"; 
    if (botLevel <= 8) return "🔥"; 
    return "🏆"; 
  }, []); 

  const getResultType = useCallback((match, characterId) => { 
    if (match.winner_id === characterId) return 'win'; 
    if (match.player1_score === match.player2_score) return 'draw'; 
    return 'lose'; 
  }, []); 

  return ( 
    <div className="training-dashboard"> 
      {/* SCOREBOARD PROFESIONAL */}
      {simulating && (
        <div className="scoreboard">
          <div className="team-score user-team">
            <span className="team-name">{character?.nickname || "JUGADOR"}</span>
            <span className="score">{matchStats.goals.user}</span>
          </div>
          <div className="match-info">
            <div className="minute">{currentMinute}'</div>
            <div className="match-status">{isPaused ? 'PAUSA' : 'EN VIVO'}</div>
          </div>
          <div className="team-score bot-team">
            <span className="score">{matchStats.goals.bot}</span>
            <span className="team-name">{selectedBot?.name || "RIVAL"}</span>
          </div>
          <button className="pause-btn" onClick={togglePause}>
            {isPaused ? '▶️' : '⏸️'}
          </button>
        </div>
      )}

      <div className="main-layout"> 
        {/* CAMPO DE JUEGO PROFESIONAL */} 
        <div className="left-panel"> 
          <div className="soccer-field"> 
            <div className="field-grass"> 
              {/* Líneas del campo */}
              <div className="center-circle"></div> 
              <div className="center-spot"></div> 
              <div className="penalty-area left"></div> 
              <div className="penalty-area right"></div> 
              <div className="small-area left"></div> 
              <div className="small-area right"></div> 
              <div className="goal left"></div> 
              <div className="goal right"></div> 
              <div className="penalty-spot left"></div> 
              <div className="penalty-spot right"></div> 

              {/* Jugadores del equipo usuario */}
              {teamLineups.user.map(player => (
                <div key={player.id} className="player player-user" 
                     style={{ left: `${player.x}%`, top: `${player.y}%` }}>
                  <div className="player-icon">{player.position === 'GK' ? '🧤' : '👤'}</div>
                  <div className="player-number">{player.number}</div>
                </div>
              ))}

              {/* Jugadores del equipo bot */}
              {teamLineups.bot.map(player => (
                <div key={player.id} className="player player-bot" 
                     style={{ left: `${player.x}%`, top: `${player.y}%` }}>
                  <div className="player-icon">{player.position === 'GK' ? '🧤' : '🤖'}</div>
                  <div className="player-number">{player.number}</div>
                </div>
              ))}

              {/* Balón animado */} 
              {simulating && ( 
                <div className="soccer-ball" style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }} > 
                  ⚽ 
                </div> 
              )} 

              {/* Mensaje central cuando no hay simulación */} 
              {!simulating && ( 
                <div className="field-message"> 
                  <h3>⚽ SIMULADOR PC FÚTBOL</h3> 
                  <p>Selecciona un oponente para iniciar la simulación profesional</p> 
                </div> 
              )} 

              {/* RESULTADO FINAL */}
              {matchResult && (
                <div className="match-result-overlay">
                  <div className="result-card">
                    <h3>🏆 FINAL DEL PARTIDO</h3>
                    <div className="final-score">
                      <span>{character?.nickname} {matchResult.userScore}</span>
                      <span>-</span>
                      <span>{matchResult.botScore} {selectedBot?.name}</span>
                    </div>
                    <div className="result-message">
                      {matchResult.winner === 'draw' ? 'EMPATE' : 
                       `VICTORIA DE ${matchResult.winner === 'user' ? character?.nickname : selectedBot?.name}`}
                    </div>
                    <button className="close-result" onClick={resetAnimations}>
                      CERRAR
                    </button>
                  </div>
                </div>
              )}
            </div> 
          </div> 
        </div> 

        {/* PANEL DERECHO - COMENTARIOS Y ESTADÍSTICAS PROFESIONALES */} 
        <div className="right-panel"> 
          <div className="match-commentary"> 
            <div className="commentary-header"> 
              <h3>📻 COMENTARIOS EN VIVO</h3> 
              <div className="match-time"> 
                {simulating ? `${currentMinute}'` : "PRE-PARTIDO"} 
              </div> 
            </div> 
            <div className="commentary-feed"> 
              {matchEvents.length === 0 ? ( 
                <div className="no-commentary"> 
                  <p>El partido aún no ha comenzado...</p> 
                  <p>Los comentarios aparecerán aquí en tiempo real</p> 
                </div> 
              ) : ( 
                matchEvents.map((event) => ( 
                  <div key={event.id} className={`commentary-event ${event.intensity} ${event.team}`} > 
                    <div className="event-time">{event.time}</div> 
                    <div className="event-text">{event.text}</div> 
                    <div className="event-team"> 
                      {event.team === 'user' ? character?.nickname : 
                       event.team === 'bot' ? selectedBot?.name : 'PARTIDO'}
                    </div> 
                  </div> 
                )) 
              )} 
            </div> 

            {/* ESTADÍSTICAS DETALLADAS */} 
            <div className="live-stats"> 
              <h4>📊 ESTADÍSTICAS DETALLADAS</h4> 
              <div className="stats-grid">
                <div className="stat-category">
                  <h5>ATAQUE</h5>
                  <div className="stat-row">
                    <span>Disparos:</span>
                    <span>{matchStats.shots.user} - {matchStats.shots.bot}</span>
                  </div>
                  <div className="stat-row">
                    <span>Al arco:</span>
                    <span>{matchStats.shotsOnTarget.user} - {matchStats.shotsOnTarget.bot}</span>
                  </div>
                  <div className="stat-row">
                    <span>Corners:</span>
                    <span>{matchStats.corners.user} - {matchStats.corners.bot}</span>
                  </div>
                </div>
                <div className="stat-category">
                  <h5>DEFENSA</h5>
                  <div className="stat-row">
                    <span>Entradas:</span>
                    <span>{matchStats.tackles.user} - {matchStats.tackles.bot}</span>
                  </div>
                  <div className="stat-row">
                    <span>Faltas:</span>
                    <span>{matchStats.fouls.user} - {matchStats.fouls.bot}</span>
                  </div>
                  <div className="stat-row">
                    <span>Offsides:</span>
                    <span>{matchStats.offsides.user} - {matchStats.offsides.bot}</span>
                  </div>
                </div>
                <div className="stat-category">
                  <h5>POSESIÓN</h5>
                  <div className="possession-display">
                    <div className="possession-team user">{matchStats.possession.user}%</div>
                    <div className="possession-bar">
                      <div className="possession-fill user" style={{ width: `${matchStats.possession.user}%` }}></div>
                    </div>
                    <div className="possession-team bot">{matchStats.possession.bot}%</div>
                  </div>
                </div>
              </div>
            </div> 
          </div> 
        </div> 
      </div> 

      {/* PANEL INFERIOR - OPONENTES E HISTORIAL */} 
      <div className="bottom-panel"> 
        <div className="panel-tabs"> 
          <button className={`tab-button ${activePanel === "bots" ? "active" : ""}`} onClick={() => setActivePanel("bots")} > 
            🤖 ELEGIR OPONENTE 
          </button> 
          <button className={`tab-button ${activePanel === "history" ? "active" : ""}`} onClick={() => setActivePanel("history")} > 
            📊 HISTORIAL DE PARTIDOS 
          </button> 
        </div> 
        <div className="panel-content"> 
          {activePanel === "bots" ? ( 
            <div className="bots-grid"> 
              {bots?.map(bot => ( 
                <div key={bot.id} className="bot-card"> 
                  <div className="bot-header"> 
                    <div className="bot-avatar" style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)` }} > 
                      {getBotAvatar(bot.level)} 
                    </div> 
                    <div className="bot-info"> 
                      <h4>{bot.name}</h4> 
                      <div className="bot-meta"> 
                        <span className="level-badge">Nivel {bot.level}</span> 
                        <span className="difficulty-badge" style={{ color: getDifficultyColor(bot.difficulty) }} > 
                          {getDifficultyText(bot.difficulty)} 
                        </span> 
                      </div> 
                    </div> 
                  </div> 
                  <div className="bot-stats"> 
                    <div className="stat-row"> 
                      <span>Ataque:</span> 
                      <span>{Math.round((bot.tiro + bot.potencia) / 2)}</span> 
                    </div> 
                    <div className="stat-row"> 
                      <span>Defensa:</span> 
                      <span>{Math.round((bot.defensa + bot.velocidad) / 2)}</span> 
                    </div> 
                  </div> 
                  <button className={`play-btn ${bot.difficulty}`} onClick={() => onStartMatch(bot)} disabled={loading || simulating} style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)` }} > 
                    {loading && selectedBot?.id === bot.id ? "🔄" : "⚔️"} 
                    {loading && selectedBot?.id === bot.id ? " INICIANDO..." : " JUGAR"} 
                  </button> 
                </div> 
              ))} 
            </div> 
          ) : ( 
            <div className="history-section"> 
              <h3>ÚLTIMOS PARTIDOS</h3> 
              {!matchHistory || matchHistory.length === 0 ? ( 
                <div className="no-history"> 
                  <p>No hay partidas registradas</p> 
                  <p>¡Juega tu primer partido!</p> 
                </div> 
              ) : ( 
                <div className="history-list"> 
                  {matchHistory.map((match) => ( 
                    <div key={match.id} className="history-item"> 
                      <div className="match-result"> 
                        <span className={`result-badge ${getResultType(match, character?.id)}`}> 
                          {match.winner_id === character?.id ? 'V' : match.player1_score === match.player2_score ? 'E' : 'D'} 
                        </span> 
                        <span className="score"> 
                          {match.player1_score} - {match.player2_score} 
                        </span> 
                      </div> 
                      <div className="match-info"> 
                        <span className="match-date"> 
                          {new Date(match.finished_at).toLocaleDateString('es-ES')} 
                        </span> 
                        <span className="match-rewards"> 
                          +{match.rewards_exp} EXP 
                        </span> 
                      </div> 
                    </div> 
                  ))} 
                </div> 
              )} 
            </div> 
          )} 
        </div> 
      </div> 
    </div> 
  ); 
}; 

export default TrainingDashboard;
