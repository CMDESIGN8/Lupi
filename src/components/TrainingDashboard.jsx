import React, { useState, useEffect, useRef, useCallback, useReducer } from "react";
import "../styles/TrainingDashboard.css";
import { simulationReducer, initialState } from './TrainingDashboard/simulationReducer';
import { MATCH_CONFIG } from './TrainingDashboard/futsalConfig';
import * as api from '../services/apiService'; // ¡Importamos el servicio!

import { SimulationControls } from './TrainingDashboard/SimulationControls';
import { TacticalControls } from './TrainingDashboard/TacticalControls';
import { SoccerField } from './TrainingDashboard/SoccerField';
import { StatsPanel } from './TrainingDashboard/StatsPanel';
import { EventsFeed } from './TrainingDashboard/EventsFeed';
import { BotSelector } from './TrainingDashboard/BotSelector';

const TrainingDashboard = ({ character }) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const [bots, setBots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ¡NUEVO! Hook para cargar los bots al inicio
  useEffect(() => {
    const loadBots = async () => {
      try {
        const fetchedBots = await api.getBots();
        setBots(fetchedBots);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBots();
  }, []);

  // Modificamos el manejador para iniciar la partida
  const handleStartMatch = async (bot) => {
    try {
      const { match } = await api.startMatch(character.id, bot.id);
      dispatch({ 
        type: 'START_MATCH', 
        payload: { 
          character, 
          selectedBot: bot, 
          matchId: match.id // Guardamos el ID de la partida
        } 
      });
    } catch (error) {
      console.error("Error al iniciar la partida:", error);
    }
  };
  
  // ¡NUEVO! Creamos un manejador para finalizar la partida
  const handleFinishMatch = useCallback(async (finalState) => {
    try {
      const finalScore = {
        player1Score: finalState.matchStats.user.goals,
        player2Score: finalState.matchStats.bot.goals,
      };
      
      const result = await api.finishMatch(finalState.matchId, finalScore);
      console.log("✅ Partida finalizada, resultado:", result);
      
      // Aquí puedes disparar una acción para mostrar un modal de resultados
      dispatch({ type: 'SHOW_RESULTS', payload: result });

    } catch (error) {
      console.error("Error al finalizar la partida:", error);
    }
  }, []); // useCallback para evitar que se re-cree en cada render

  // Modificamos el useEffect principal
  useEffect(() => {
    if (state.simulating) {
      const interval = setInterval(() => {
        dispatch({ type: 'TICK_MINUTE' });
      }, state.speed);
      
      // Detener y finalizar cuando el tiempo se acaba
      if (state.matchTime >= MATCH_CONFIG.DURATION && state.simulating) {
        dispatch({ type: 'END_MATCH' });
        handleFinishMatch(state);
      }
      
      return () => clearInterval(interval);
    }
  }, [state.simulating, state.speed, state.matchTime, state, handleFinishMatch]);

  // En tu reducer (`simulationReducer.js`), añade el `matchId` al estado inicial y a la acción START_MATCH
  // initialState = { ... matchId: null, ... }
  // case 'START_MATCH': return { ...state, matchId: action.payload.matchId, ... }
  
  // ... resto de tu JSX ...
  // Pasa `bots={bots}` a tu componente BotSelector
};
  
  return (
    <div className="training-dashboard futsal-version">
      <div className="app-header professional">
         <h2>🥅 SIMULADOR FÚTSAL PRO v2.0</h2>
         <div className="score-display-header">
            {state.matchStats ? `${state.matchStats.user.goals} - ${state.matchStats.bot.goals}` : '0 - 0'}
         </div>
      </div>
      
      <div className="main-layout improved">
        <div className="left-panel">
           <SimulationControls state={state} dispatch={dispatch} />
           <TacticalControls state={state} dispatch={dispatch} />
           <hr className="divider" />
           <StatsPanel state={state} />
        </div>

        <div className="center-panel">
          <SoccerField state={state} />
        </div>

        <div className="right-panel">
          <EventsFeed state={state} character={character} />
        </div>
      </div>

      <div className="bottom-panel professional">
        <BotSelector 
          bots={bots} 
          onStartMatch={handleStartMatch} 
          simulating={state.simulating} 
        />
      </div>
    </div>
  );
};

export default TrainingDashboard;
