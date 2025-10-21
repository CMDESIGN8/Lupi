// BotSelector.jsx
import React from 'react';
import "../../styles/BotSelector.css";

export const BotSelector = ({ bots, onStartMatch, simulating }) => {
  // Función para obtener avatar (puedes moverla a un utils si quieres)
  const getBotAvatar = (level) => {
    if (level <= 2) return "👽"; 
    if (level <= 4) return "👻"; 
    if (level <= 6) return "🤖"; 
    return "🏆";
  };

  // Función para calcular recompensas basadas en nivel
  const getBotRewards = (level) => {
    const baseXP = 50;
    const baseCoins = 25;
    return {
      xp: baseXP * level,
      coins: baseCoins * level,
      items: level >= 5 ? ['Caja misteriosa'] : ['Moneda extra']
    };
  };

  // Función para obtener habilidades basadas en nivel
  const getBotSkills = (level) => {
    const skills = [
      'Disparo preciso', 'Regate básico', 'Pase corto'
    ];
    
    if (level >= 3) skills.push('Tiro con efecto');
    if (level >= 5) skills.push('Regate avanzado');
    if (level >= 7) skills.push('Tiro desde larga distancia');
    
    return skills;
  };

  // Función para obtener estadísticas basadas en nivel
  const getBotStats = (level) => {
    const baseStats = {
      velocidad: 50 + (level * 5),
      precision: 40 + (level * 6),
      defensa: 45 + (level * 4),
      ataque: 55 + (level * 7)
    };
    return baseStats;
  };

  // Función para calcular probabilidades de victoria
  const getWinProbability = (botLevel, playerLevel = 3) => {
    const levelDiff = botLevel - playerLevel;
    let baseProbability = 50;
    
    // Ajustar probabilidad según diferencia de nivel
    if (levelDiff >= 3) baseProbability = 20;
    else if (levelDiff >= 1) baseProbability = 35;
    else if (levelDiff <= -3) baseProbability = 80;
    else if (levelDiff <= -1) baseProbability = 65;
    
    return baseProbability;
  };

  return (
    <div className="panel-content">
      <div className="bots-grid professional">
        {bots.map(bot => {
          const rewards = getBotRewards(bot.level);
          const skills = getBotSkills(bot.level);
          const stats = getBotStats(bot.level);
          const winProbability = getWinProbability(bot.level);

          return (
            <div key={bot.id} className="bot-card professional">
              <div className="bot-header professional">
                <div className="bot-avatar professional">
                  {getBotAvatar(bot.level)}
                </div>
                <div className="bot-info professional">
                  <h4>{bot.name || 'Bot Futsal'}</h4>
                  <span className="bot-level">Nivel: {bot.level || 1}</span>
                  <div className="win-probability">
                    Probabilidad de victoria: {winProbability}%
                  </div>
                </div>
              </div>

              {/* Sección de Recompensas */}
              <div className="bot-section">
                <h5>Recompensas</h5>
                <div className="rewards-list">
                  <span>XP: {rewards.xp}</span>
                  <span>Monedas: {rewards.coins}</span>
                  {rewards.items.map((item, index) => (
                    <span key={index} className="reward-item">{item}</span>
                  ))}
                </div>
              </div>

              {/* Sección de Habilidades */}
              <div className="bot-section">
                <h5>Habilidades</h5>
                <div className="skills-list">
                  {skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Sección de Estadísticas */}
              <div className="bot-section">
                <h5>Estadísticas</h5>
                <div className="stats-grid">
                  <div className="stat-item">
                    <label>Velocidad</label>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{width: `${stats.velocidad}%`}}
                      ></div>
                    </div>
                    <span>{stats.velocidad}</span>
                  </div>
                  <div className="stat-item">
                    <label>Precisión</label>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{width: `${stats.precision}%`}}
                      ></div>
                    </div>
                    <span>{stats.precision}</span>
                  </div>
                  <div className="stat-item">
                    <label>Defensa</label>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{width: `${stats.defensa}%`}}
                      ></div>
                    </div>
                    <span>{stats.defensa}</span>
                  </div>
                  <div className="stat-item">
                    <label>Ataque</label>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{width: `${stats.ataque}%`}}
                      ></div>
                    </div>
                    <span>{stats.ataque}</span>
                  </div>
                </div>
              </div>

              <button 
                className="play-btn professional"
                onClick={() => onStartMatch(bot)} 
                disabled={simulating}
              >
                {simulating ? 'CARGANDO...' : 'JUGAR'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
