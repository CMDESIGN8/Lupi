// BotSelector.jsx
import React, { useState } from 'react';
import "../../styles/BotSelector.css";

export const BotSelector = ({ bots, onStartMatch, simulating, playerLevel = 3 }) => {
  const [selectedBot, setSelectedBot] = useState(null);
  const [hoveredBot, setHoveredBot] = useState(null);

  // Sistema de avatares animados
  const getBotAvatar = (level) => {
    const avatars = {
      1: "🥅", 2: "⚽", 3: "👕", 4: "🥊", 
      5: "🚀", 6: "⚡", 7: "🔥", 8: "👑", 
      9: "💎", 10: "🎯"
    };
    return avatars[level] || "🤖";
  };

  // Sistema de dificultad con colores profesionales
  const getBotDifficulty = (level) => {
    if (level <= 3) return { 
      text: "PRINCIPIANTE", 
      color: "#10B981", 
      gradient: "from-green-500 to-emerald-400",
      bg: "bg-gradient-to-r from-green-500/20 to-emerald-400/20"
    };
    if (level <= 6) return { 
      text: "COMPETITIVO", 
      color: "#F59E0B", 
      gradient: "from-amber-500 to-orange-400",
      bg: "bg-gradient-to-r from-amber-500/20 to-orange-400/20"
    };
    return { 
      text: "ÉLITE", 
      color: "#EF4444", 
      gradient: "from-red-500 to-rose-400",
      bg: "bg-gradient-to-r from-red-500/20 to-rose-400/20"
    };
  };

  // Estadísticas balanceadas
  const getBotStats = (level) => {
    const baseStats = {
      velocidad: Math.min(95, 60 + (level * 3)),
      precision: Math.min(92, 55 + (level * 4)),
      defensa: Math.min(88, 50 + (level * 3.5)),
      ataque: Math.min(96, 58 + (level * 4.2)),
      resistencia: Math.min(85, 45 + (level * 4)),
      tecnica: Math.min(90, 52 + (level * 3.8))
    };
    return baseStats;
  };

  // Sistema de recompensas realista
  const getBotRewards = (level) => {
    return {
      xp: level * 100,
      coins: level * 50,
      items: level >= 5 ? ['Caja Élite'] : level >= 3 ? ['Caja Avanzada'] : ['Caja Básica'],
      tokens: level >= 7 ? Math.floor(level * 1.5) : 0
    };
  };

  // Habilidades progresivas
  const getBotSkills = (level) => {
    const allSkills = [
      'Tiro preciso', 'Regate básico', 'Pase corto', 'Control orientado',
      'Tiro con efecto', 'Regate avanzado', 'Visión de juego', 'Marcaje pressing',
      'Tiro lejano', 'Regate élite', 'Asistencia mortal', 'Defensa agresiva'
    ];
    return allSkills.slice(0, Math.min(level + 2, allSkills.length));
  };

  // Análisis de partida inteligente
  const getMatchAnalysis = (botLevel) => {
    const levelDiff = botLevel - playerLevel;
    let probability = 50;

    if (levelDiff >= 3) probability = 20;
    else if (levelDiff >= 1) probability = 35;
    else if (levelDiff <= -3) probability = 80;
    else if (levelDiff <= -1) probability = 65;

    return {
      probability,
      advantage: levelDiff > 0 ? 'Bot' : 'Jugador',
      intensity: levelDiff === 0 ? 'Equilibrado' : Math.abs(levelDiff) >= 3 ? 'Extremo' : 'Moderado'
    };
  };

  const BotCard = ({ bot }) => {
    const difficulty = getBotDifficulty(bot.level);
    const stats = getBotStats(bot.level);
    const rewards = getBotRewards(bot.level);
    const analysis = getMatchAnalysis(bot.level);

    return (
      <div 
        className={`bot-card ${difficulty.gradient} ${hoveredBot === bot.id ? 'hovered' : ''}`}
        onMouseEnter={() => setHoveredBot(bot.id)}
        onMouseLeave={() => setHoveredBot(null)}
      >
        {/* Header con información principal */}
        <div className="card-header">
          <div className="avatar-container">
            <div className="bot-avatar">
              {getBotAvatar(bot.level)}
            </div>
            <div className="level-indicator">
              NIVEL {bot.level}
            </div>
          </div>
          
          <div className="bot-info">
            <h3 className="bot-name">{bot.name || `Retador ${bot.id}`}</h3>
            <div className={`difficulty-badge ${difficulty.gradient}`}>
              {difficulty.text}
            </div>
          </div>
        </div>

        {/* Análisis de partida */}
        <div className="match-analysis">
          <div className="probability-circle">
            <div className="circle-background">
              <div 
                className="circle-progress" 
                style={{ 
                  background: `conic-gradient(${difficulty.color} ${analysis.probability * 3.6}deg, #374151 0deg)` 
                }}
              ></div>
              <div className="probability-text">
                <span className="percentage">{analysis.probability}%</span>
                <span className="label">Probabilidad</span>
              </div>
            </div>
          </div>
          
          <div className="analysis-details">
            <div className="detail-item">
              <span className="label">Ventaja:</span>
              <span className={`value ${analysis.advantage.toLowerCase()}`}>
                {analysis.advantage}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Intensidad:</span>
              <span className="value">{analysis.intensity}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas clave */}
        <div className="key-stats">
          <div className="stat-pair">
            <div className="stat">
              <span className="stat-label">Ataque</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill attack" 
                  style={{ width: `${stats.ataque}%` }}
                ></div>
              </div>
              <span className="stat-value">{stats.ataque}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Defensa</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill defense" 
                  style={{ width: `${stats.defensa}%` }}
                ></div>
              </div>
              <span className="stat-value">{stats.defensa}</span>
            </div>
          </div>
        </div>

        {/* Recompensas */}
        <div className="rewards-section">
          <h4>Recompensas</h4>
          <div className="rewards-grid">
            <div className="reward">
              <span className="icon">⭐</span>
              <span className="amount">{rewards.xp} XP</span>
            </div>
            <div className="reward">
              <span className="icon">🪙</span>
              <span className="amount">{rewards.coins}</span>
            </div>
            {rewards.tokens > 0 && (
              <div className="reward premium">
                <span className="icon">💎</span>
                <span className="amount">{rewards.tokens}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botón de acción */}
        <button 
          className={`play-button ${difficulty.gradient} ${simulating ? 'loading' : ''}`}
          onClick={() => onStartMatch(bot)}
          disabled={simulating}
        >
          {simulating ? (
            <>
              <div className="spinner"></div>
              CARGANDO...
            </>
          ) : (
            'INICIAR PARTIDA'
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bot-selector-container">
      <div className="selector-header">
        <h1>Selecciona tu Oponente</h1>
        <p>Enfrenta bots con diferentes niveles de habilidad y gana recompensas</p>
      </div>

      <div className="bots-grid">
        {bots.map(bot => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>

      {/* Leyenda de dificultad */}
      <div className="difficulty-legend">
        <div className="legend-item">
          <div className="color-indicator beginner"></div>
          <span>Principiante</span>
        </div>
        <div className="legend-item">
          <div className="color-indicator competitive"></div>
          <span>Competitivo</span>
        </div>
        <div className="legend-item">
          <div className="color-indicator elite"></div>
          <span>Élite</span>
        </div>
      </div>
    </div>
  );
};
