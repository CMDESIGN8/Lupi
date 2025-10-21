import React, { useState, useEffect, useReducer, useCallback } from "react";
import "../styles/TrainingDashboard.css";
import { simulationReducer, initialState } from './TrainingDashboard/simulationReducer';
import { MATCH_CONFIG } from './TrainingDashboard/futsalConfig';
import * as api from '../services/api';

import { SimulationControls } from './TrainingDashboard/SimulationControls';
import { TacticalControls } from './TrainingDashboard/TacticalControls';
import { SoccerField } from './TrainingDashboard/SoccerField';
import { StatsPanel } from './TrainingDashboard/StatsPanel';
import { EventsFeed } from './TrainingDashboard/EventsFeed';
import { BotSelector } from './TrainingDashboard/BotSelector';
import { MatchResultModal } from './TrainingDashboard/MatchResultModal'; // ¡Nuevo componente!

const TrainingDashboard = ({ character }) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const [bots, setBots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar los bots desde el backend al montar el componente
  useEffect(() => {
    const loadBots = async () => {
      try {
        const fetchedBots = await api.getBots();
        setBots(fetchedBots);
      } catch (error) {
        console.error("Error al cargar bots:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBots();
  }, []);

  // Iniciar una partida: Llama a la API para crear el registro
  const handleStartMatch = async (bot) => {
    if (!character || !character.id) {
        console.error("Error: El personaje no tiene un ID válido.");
        // Opcional: mostrar un mensaje al usuario
        return;
    }
    try {
      const { match } = await api.startMatch(character.id, bot.id);
      dispatch({
        type: 'START_MATCH',
        payload: {
          character,
          selectedBot: bot,
          matchId: match.id,
        },
      });
    } catch (error) {
      console.error("Error al iniciar la partida:", error);
    }
  };

  // Finalizar una partida: Llama a la API para guardar el resultado y obtener recompensas
  const handleFinishMatch = useCallback(async (finalState) => {
  try {
    const finalScore = {
      player1Score: finalState.matchStats.user.goals,
      player2Score: finalState.matchStats.bot.goals,
    };

    console.log("🏁 Finalizando partida con:", {
      matchId: finalState.matchId,
      finalScore,
      matchStats: finalState.matchStats
    });

    const result = await api.finishMatch(finalState.matchId, finalScore);
    console.log("✅ Partida finalizada, resultado:", result);
    
    dispatch({ type: 'SHOW_RESULTS', payload: result });

  } catch (error) {
    console.error("❌ Error al finalizar la partida:", error);
    // Muestra el error al usuario
    alert(`Error al finalizar partida: ${error.message}`);
  }
}, []);

  // useEffect principal que controla el motor de la simulación
  useEffect(() => {
    let interval = null;
    if (state.simulating) {
      interval = setInterval(() => {
        // Usamos una función de callback con dispatch para obtener el estado más reciente
        dispatch({ type: 'TICK_MINUTE' });
      }, state.speed);

      // Si el tiempo ha terminado, detenemos la simulación y finalizamos
      if (state.matchTime >= MATCH_CONFIG.DURATION) {
        dispatch({ type: 'END_MATCH' });
        handleFinishMatch(state);
      }
    }
    // Limpieza al desmontar o cambiar dependencias
    return () => clearInterval(interval);
  }, [state.simulating, state.speed, state.matchTime, state, handleFinishMatch]);
  
  const closeResultModal = () => {
    dispatch({ type: 'CLOSE_RESULTS' });
  };

  // ESTA ES LA SECCIÓN CORREGIDA: El return ahora está dentro de la función.
  return (
    <div className="training-dashboard futsal-version">
      
      {/* ¡NUEVO! Modal para mostrar resultados al finalizar */}
      {state.matchResult && (
        <MatchResultModal result={state.matchResult} onClose={closeResultModal} />
      )}

      <div className="app-header professional">
        <h2>🥅 Arena de Fútsal/h2>
        <div className="score-display-header">
          {state.matchStats ? `${state.matchStats.user.goals} - ${state.matchStats.bot.goals}` : '0 - 0'}
        </div>
      </div>
      
      <div className="main-layout improved">
  {/* Panel izquierdo - Ahora eventos */}
  <div className="left-panel">
    <EventsFeed state={state} character={character} />
  </div>

  {/* Panel central - Cancha (se mantiene igual) */}
  <div className="center-panel">
    <SoccerField state={state} />
  </div>

  {/* Panel derecho - Ahora controles y estadísticas */}
  <div className="right-panel">
    <SimulationControls state={state} dispatch={dispatch} />
    <TacticalControls state={state} dispatch={dispatch} />
    <hr className="divider" />
    <StatsPanel state={state} />
  </div>
</div>

      <div className="bottom-panel professional">
        {isLoading ? (
          <div className="loading-bots">Cargando oponentes...</div>
        ) : (
          <BotSelector
            bots={bots}
            onStartMatch={handleStartMatch}
            simulating={state.simulating}
          />
        )}
      </div>
    </div>
  );
};

export default TrainingDashboard;
