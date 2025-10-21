// StatsPanel.jsx
import React from 'react';
import '../../styles/StatsPanel.css'; // Reutilizamos los estilos

export const StatsPanel = ({ state }) => {
  const { matchStats } = state;

  if (!matchStats) {
    return <div className="panel-content"><p>Esperando inicio del partido...</p></div>;
  }
  
  return (
    <div className="panel-content stats-content">
      <div className="advanced-stats">
        <h4>ESTADÍSTICAS</h4>
        <div className="stat-row">
          <span>{state.character.name}</span>
          <span>{state.selectedBot.name}</span>
        </div>
        <div className="stat-row">
          <span>{matchStats.user.shots}</span>
          <span>Disparos</span>
          <span>{matchStats.bot.shots}</span>
        </div>
         <div className="stat-row">
          <span>{matchStats.user.saves}</span>
          <span>Paradas</span>
          <span>{matchStats.bot.saves}</span>
        </div>
        <div className="stat-row">
          <span>{matchStats.user.tackles}</span>
          <span>Entradas</span>
          <span>{matchStats.bot.tackles}</span>
        </div>
        <div className="stat-row">
          <span>{matchStats.user.fouls}</span>
          <span>Faltas</span>
          <span>{matchStats.bot.fouls}</span>
        </div>
      </div>
    </div>
  );

};
