import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/TrainingDashboard.css";
import { simulationReducer, initialState } from './TrainingDashboard/simulationReducer';
import { MATCH_CONFIG } from './TrainingDashboard/futsalConfig';

import { SimulationControls } from './TrainingDashboard/SimulationControls';
import { TacticalControls } from './TrainingDashboard/TacticalControls';
import { SoccerField } from './TrainingDashboard/SoccerField';
import { StatsPanel } from './TrainingDashboard/StatsPanel';
import { EventsFeed } from './TrainingDashboard/EventsFeed';
import { BotSelector } from './TrainingDashboard/BotSelector';

const TrainingDashboard = ({ character, bots = [] }) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const simulationIntervalRef = useRef(null);

  useEffect(() => {
    if (state.simulating) {
      simulationIntervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK_MINUTE' });
      }, state.speed);
    } else {
      clearInterval(simulationIntervalRef.current);
    }
    return () => clearInterval(simulationIntervalRef.current);
  }, [state.simulating, state.speed]);

  const handleStartMatch = (bot) => {
    dispatch({ type: 'START_MATCH', payload: { character, selectedBot: bot } });
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
