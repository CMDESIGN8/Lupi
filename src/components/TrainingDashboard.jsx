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
    shots: 0, passes: 0, tackles: 0, dribbles: 0, goals: 0, saves: 0, possession: 50 
  }); 

  const animationRef = useRef(null);
  const timeoutRefs = useRef([]);

  // Limpiar todos los timeouts y animaciones
  const clearAllAnimations = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  useEffect(() => { 
    if (simulating) { 
      startMatchAnimation(); 
    } else { 
      resetAnimations(); 
    } 
    
    return () => {
      clearAllAnimations();
    };
  }, [simulating, clearAllAnimations]); 

  const resetAnimations = useCallback(() => { 
    clearAllAnimations();
    setMatchEvents([]); 
    setBallPosition({ x: 50, y: 50 }); 
    setPlayerPositions({ 
      user: { x: 20, y: 30 }, 
      bot: { x: 80, y: 30 } 
    }); 
    setMatchStats({ 
      shots: 0, passes: 0, tackles: 0, dribbles: 0, goals: 0, saves: 0, possession: 50 
    }); 
  }, [clearAllAnimations]); 

  const startMatchAnimation = useCallback(() => { 
    // Configurar animación del balón 
    animateBall(); 

    // Generar eventos de partido en tiempo real 
    const eventTypes = [ 
      { type: 'shot', text: '¡Disparo del delantero!', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'high' }, 
      { type: 'save', text: 'El arquero despeja el peligro', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'medium' }, 
      { type: 'pass', text: 'Pase preciso al mediocampo', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'low' }, 
      { type: 'tackle', text: 'Entrada limpia del defensa', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'medium' }, 
      { type: 'dribble', text: 'Regate magistral del jugador', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'medium' }, 
      { type: 'cross', text: 'Centro al área', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'low' }, 
      { type: 'corner', text: 'Saque de esquina', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'medium' }, 
      { type: 'freekick', text: 'Tiro libre directo', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'high' }, 
      { type: 'goal', text: '¡¡¡GOOOOL!!!', team: Math.random() > 0.5 ? 'user' : 'bot', intensity: 'very-high' } 
    ]; 

    for (let i = 0; i < 15; i++) { 
      const timeout = setTimeout(() => { 
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]; 
        const eventWithTime = { 
          ...randomEvent, 
          id: Date.now() + i, 
          time: `${Math.floor(i / 2)}'${(i % 2) * 30}`.padStart(3, '0')
        }; 
        
        setMatchEvents(prev => [eventWithTime, ...prev.slice(0, 14)]); 
        
        // Actualizar estadísticas 
        updateMatchStats(randomEvent.type, randomEvent.team); 
        
        // Mover jugadores para eventos importantes 
        if (randomEvent.intensity === 'high' || randomEvent.intensity === 'very-high') { 
          movePlayersForEvent(randomEvent.type, randomEvent.team); 
        } 
      }, i * 800); 
      
      timeoutRefs.current.push(timeout);
    } 
  }, []); 

  const animateBall = useCallback(() => { 
    const startTime = Date.now(); 
    const duration = 12000; 
    
    const animate = () => { 
      const elapsed = Date.now() - startTime; 
      const progress = elapsed / duration; 
      
      if (progress < 1) { 
        const x = 50 + 35 * Math.sin(progress * Math.PI * 3); 
        const y = 50 + 25 * Math.sin(progress * Math.PI * 6); 
        setBallPosition({ x, y }); 
        animationRef.current = requestAnimationFrame(animate); 
      } else {
        animationRef.current = null;
      } 
    }; 
    
    animationRef.current = requestAnimationFrame(animate); 
  }, []); 

  const updateMatchStats = useCallback((eventType, team) => { 
    setMatchStats(prev => { 
      const newStats = { ...prev }; 
      
      switch (eventType) { 
        case 'shot': newStats.shots++; break; 
        case 'pass': newStats.passes++; break; 
        case 'tackle': newStats.tackles++; break; 
        case 'dribble': newStats.dribbles++; break; 
        case 'goal': newStats.goals++; break; 
        case 'save': newStats.saves++; break; 
        default: break;
      } 
      
      // Actualizar posesión basada en eventos 
      if (team === 'user') { 
        newStats.possession = Math.min(100, newStats.possession + 2); 
      } else { 
        newStats.possession = Math.max(0, newStats.possession - 2); 
      } 
      
      return newStats; 
    }); 
  }, []); 

  const movePlayersForEvent = useCallback((eventType, team) => { 
    if (eventType === 'shot') { 
      if (team === 'user') { 
        setPlayerPositions(prev => ({ 
          user: { x: 65, y: 25 }, 
          bot: { x: 35, y: 75 } 
        })); 
      } else { 
        setPlayerPositions(prev => ({ 
          user: { x: 35, y: 75 }, 
          bot: { x: 65, y: 25 } 
        })); 
      } 
    } else if (eventType === 'goal') { 
      // Celebración de gol 
      if (team === 'user') { 
        setPlayerPositions(prev => ({ 
          user: { x: 70, y: 20 }, 
          bot: { x: 30, y: 80 } 
        })); 
      } else { 
        setPlayerPositions(prev => ({ 
          user: { x: 30, y: 80 }, 
          bot: { x: 70, y: 20 } 
        })); 
      } 
    } 
    
    // Volver a posición después de un tiempo 
    const timeout = setTimeout(() => { 
      setPlayerPositions({ 
        user: { x: 20, y: 30 }, 
        bot: { x: 80, y: 30 } 
      }); 
    }, 1500); 
    
    timeoutRefs.current.push(timeout);
  }, []); 

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

  const calculatePlayerRating = useCallback(() => { 
    const totalActions = matchStats.shots + matchStats.passes + matchStats.tackles + matchStats.dribbles; 
    if (totalActions === 0) return '6.0'; 
    
    const effectiveness = (matchStats.passes * 0.3 + matchStats.tackles * 0.4 + matchStats.dribbles * 0.3) / totalActions; 
    return Math.min(10, 6 + effectiveness * 4).toFixed(1); 
  }, [matchStats]); 

  return ( 
    <div className="training-dashboard"> 
      {/* HEADER SOLO CON ESTADÍSTICAS - SIN TÍTULO GRANDE */} 
      <div className="dashboard-header"> 
        <div className="player-stats"> 
          <div className="stat-item"> 
            <span className="stat-label">Nivel</span> 
            <span className="stat-value">{character?.level || 1}</span> 
          </div> 
          <div className="stat-item"> 
            <span className="stat-label">Rating</span> 
            <span className="stat-value">{calculatePlayerRating()}</span> 
          </div> 
          <div className="stat-item"> 
            <span className="stat-label">Partidos</span> 
            <span className="stat-value">{matchHistory?.length || 0}</span> 
          </div> 
          <div className="stat-item"> 
            <span className="stat-label">Posesión</span> 
            <span className="stat-value">{matchStats.possession}%</span> 
          </div> 
        </div> 
      </div> 

      <div className="main-layout"> 
        {/* PANEL IZQUIERDO 70% - CAMPO DE JUEGO */} 
        <div className="left-panel"> 
          <div className="soccer-field"> 
            <div className="field-grass"> 
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

              {/* Jugador */} 
              <div className="player player-user" style={{ left: `${playerPositions.user.x}%`, top: `${playerPositions.user.y}%` }} > 
                <div className="player-icon">👤</div> 
                <div className="player-name">{character?.nickname || "JUGADOR"}</div> 
              </div> 

              {/* Bot */} 
              <div className="player player-bot" style={{ left: `${playerPositions.bot.x}%`, top: `${playerPositions.bot.y}%` }} > 
                <div className="player-icon"> 
                  {selectedBot ? getBotAvatar(selectedBot.level) : "🤖"} 
                </div> 
                <div className="player-name"> 
                  {selectedBot?.name || "RIVAL"} 
                </div> 
              </div> 

              {/* Balón animado */} 
              {simulating && ( 
                <div className="soccer-ball" style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }} > 
                  ⚽ 
                </div> 
              )} 

              {/* Mensaje central cuando no hay simulación */} 
              {!simulating && ( 
                <div className="field-message"> 
                  <h3>⚽ SIMULADOR PROFESIONAL</h3> 
                  <p>Selecciona un oponente para iniciar la simulación con comentarios en vivo</p> 
                </div> 
              )} 

              {/* Efectos visuales */} 
              {simulating && ( 
                <> 
                  <div className="field-effect shot-effect"></div> 
                  <div className="field-effect dribble-effect"></div> 
                </> 
              )} 
            </div> 
          </div> 
        </div> 

        {/* PANEL DERECHO 30% - COMENTARIOS DEL PARTIDO */} 
        <div className="right-panel"> 
          <div className="match-commentary"> 
            <div className="commentary-header"> 
              <h3>📻 COMENTARIOS EN VIVO</h3> 
              <div className="match-time"> 
                {simulating ? "EN VIVO" : "PRE-PARTIDO"} 
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
                      {event.team === 'user' ? character?.nickname : selectedBot?.name} 
                    </div> 
                  </div> 
                )) 
              )} 
            </div> 

            {/* Estadísticas rápidas */} 
            <div className="live-stats"> 
              <h4>📊 ESTADÍSTICAS RÁPIDAS</h4> 
              <div className="stats-overview"> 
                <div className="stat-row"> 
                  <span>Posesión:</span> 
                  <div className="possession-bar"> 
                    <div className="possession-fill user" style={{ width: `${matchStats.possession}%` }} > 
                      {matchStats.possession}% 
                    </div> 
                    <div className="possession-fill bot" style={{ width: `${100 - matchStats.possession}%` }} > 
                      {100 - matchStats.possession}% 
                    </div> 
                  </div> 
                </div> 
                <div className="stat-row"> 
                  <span>Disparos:</span> 
                  <span>{matchStats.shots}</span> 
                </div> 
                <div className="stat-row"> 
                  <span>Pases:</span> 
                  <span>{matchStats.passes}</span> 
                </div> 
                <div className="stat-row"> 
                  <span>Entradas:</span> 
                  <span>{matchStats.tackles}</span> 
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
