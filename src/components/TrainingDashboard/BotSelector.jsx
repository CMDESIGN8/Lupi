// BotSelector.jsx
import React, { useState } from 'react';
import "../../styles/BotSelector.css";

export const BotSelector = ({ bots, onStartMatch, simulating, playerLevel = 3 }) => {
  const [selectedBot, setSelectedBot] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Sistema de avatares premium
  const getBotAvatar = (level, difficulty) => {
    const avatars = {
      easy: ["🟢", "🟡", "🟠"],
      medium: ["🔴", "🟣", "🔵"],
      hard: ["💀", "👹", "🐉"],
      expert: ["🌌", "⚡", "🔥"]
    };

    if (level <= 2) return avatars.easy[level - 1] || "🟢";
    if (level <= 4) return avatars.medium[level - 3] || "🔴";
    if (level <= 7) return avatars.hard[level - 5] || "💀";
    return avatars.expert[level - 8] || "🌌";
  };

  // Sistema de dificultad
  const getBotDifficulty = (level) => {
    if (level <= 2) return { text: "FÁCIL", color: "#4CAF50", class: "easy" };
    if (level <= 4) return { text: "MEDIO", color: "#FF9800", class: "medium" };
    if (level <= 7) return { text: "DIFÍCIL", color: "#F44336", class: "hard" };
    return { text: "EXPERT", color: "#9C27B0", class: "expert" };
  };

  // Sistema de recompensas avanzado
  const getBotRewards = (level) => {
    const baseRewards = {
      xp: level * 75,
      coins: level * 40,
      premiumCurrency: level >= 5 ? Math.floor(level / 2) : 0,
      items: []
    };

    // Items basados en nivel y dificultad
    if (level >= 3) baseRewards.items.push('🏆 Trofeo de Bronce');
    if (level >= 5) baseRewards.items.push('🥈 Trofeo de Plata');
    if (level >= 7) baseRewards.items.push('🥇 Trofeo de Oro');
    if (level >= 9) baseRewards.items.push('💎 Trofeo de Diamante');

    // Recompensas especiales
    if (level % 3 === 0) baseRewards.items.push('🎁 Caja Sorpresa');
    if (level >= 6) baseRewards.items.push('⚡ Potenciador x2');

    return baseRewards;
  };

  // Sistema de habilidades por categoría
  const getBotSkills = (level) => {
    const skillCategories = {
      ofensivas: [],
      defensivas: [],
      especiales: []
    };

    // Habilidades ofensivas
    if (level >= 1) skillCategories.ofensivas.push('Tiro Básico');
    if (level >= 3) skillCategories.ofensivas.push('Regate Avanzado');
    if (level >= 5) skillCategories.ofensivas.push('Tiro con Efecto');
    if (level >= 7) skillCategories.ofensivas.push('Tiro desde Larga Distancia');
    if (level >= 9) skillCategories.ofensivas.push('Tiro Imparable');

    // Habilidades defensivas
    if (level >= 2) skillCategories.defensivas.push('Bloqueo Básico');
    if (level >= 4) skillCategories.defensivas.push('Anticipación');
    if (level >= 6) skillCategories.defensivas.push('Barrida Perfecta');
    if (level >= 8) skillCategories.defensivas.push('Muro Defensivo');

    // Habilidades especiales
    if (level >= 5) skillCategories.especiales.push('Furia Ofensiva');
    if (level >= 7) skillCategories.especiales.push('Escudo Defensivo');
    if (level >= 9) skillCategories.especiales.push('Modo Leyenda');

    return skillCategories;
  };

  // Estadísticas detalladas con progresión no lineal
  const getBotStats = (level) => {
    const baseStats = {
      velocidad: Math.min(85, 50 + (level * 4) + Math.pow(level, 1.5)),
      precision: Math.min(90, 45 + (level * 5) + (level >= 5 ? 10 : 0)),
      defensa: Math.min(80, 40 + (level * 4) + (level >= 4 ? 8 : 0)),
      ataque: Math.min(95, 55 + (level * 6) + (level >= 6 ? 15 : 0)),
      resistencia: Math.min(75, 35 + (level * 3) + Math.pow(level, 1.2)),
      tecnica: Math.min(88, 42 + (level * 5) + (level >= 3 ? 12 : 0))
    };

    return baseStats;
  };

  // Sistema de probabilidades avanzado
  const getMatchAnalysis = (botLevel, playerLevel) => {
    const levelDiff = botLevel - playerLevel;
    const stats = getBotStats(botLevel);
    
    // Cálculo complejo de probabilidades
    let winProbability = 50;
    let difficultyMultiplier = 1;

    if (levelDiff >= 3) {
      winProbability = 15;
      difficultyMultiplier = 2.5;
    } else if (levelDiff >= 1) {
      winProbability = 30;
      difficultyMultiplier = 1.8;
    } else if (levelDiff <= -3) {
      winProbability = 85;
      difficultyMultiplier = 0.6;
    } else if (levelDiff <= -1) {
      winProbability = 70;
      difficultyMultiplier = 0.8;
    }

    // Ajuste por estadísticas
    const statBonus = (stats.ataque + stats.defensa - 100) / 2;
    winProbability += statBonus;

    // Asegurar límites
    winProbability = Math.max(5, Math.min(95, Math.round(winProbability)));

    return {
      winProbability,
      difficultyMultiplier,
      riskLevel: levelDiff >= 2 ? 'ALTO' : levelDiff >= 0 ? 'MEDIO' : 'BAJO',
      rewardMultiplier: (1 + (levelDiff * 0.3)).toFixed(1)
    };
  };

  const handleBotSelect = (bot) => {
    setSelectedBot(bot);
    setShowDetails(true);
  };

  const handleStartMatch = (bot) => {
    onStartMatch(bot);
    setShowDetails(false);
  };

  const BotCard = ({ bot }) => {
    const difficulty = getBotDifficulty(bot.level);
    const rewards = getBotRewards(bot.level);
    const analysis = getMatchAnalysis(bot.level, playerLevel);

    return (
      <div className={`bot-card premium ${difficulty.class}`}>
        <div className="card-glow"></div>
        
        {/* Header con información principal */}
        <div className="bot-header premium">
          <div className="avatar-section">
            <div className="bot-avatar premium">
              {getBotAvatar(bot.level, difficulty.class)}
            </div>
            <div className="level-badge">LV. {bot.level}</div>
          </div>
          
          <div className="bot-info premium">
            <h4>{bot.name || `Bot ${bot.id}`}</h4>
            <div className={`difficulty-tag ${difficulty.class}`}>
              {difficulty.text}
            </div>
            <div className="win-probability">
              <span className="probability-value">{analysis.winProbability}%</span>
              <span className="probability-label">Prob. Victoria</span>
            </div>
          </div>
        </div>

        {/* Análisis rápido */}
        <div className="quick-analysis">
          <div className="analysis-item">
            <span>Riesgo</span>
            <span className={`risk-level ${analysis.riskLevel.toLowerCase()}`}>
              {analysis.riskLevel}
            </span>
          </div>
          <div className="analysis-item">
            <span>Multiplicador</span>
            <span className="multiplier">x{analysis.rewardMultiplier}</span>
          </div>
        </div>

        {/* Recompensas preview */}
        <div className="rewards-preview">
          <div className="reward-item">
            <span>⭐ {rewards.xp} XP</span>
          </div>
          <div className="reward-item">
            <span>🪙 {rewards.coins}</span>
          </div>
          {rewards.premiumCurrency > 0 && (
            <div className="reward-item premium">
              <span>💎 {rewards.premiumCurrency}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="bot-actions">
          <button 
            className="info-btn"
            onClick={() => handleBotSelect(bot)}
          >
            DETALLES
          </button>
          <button 
            className={`play-btn premium ${difficulty.class}`}
            onClick={() => handleStartMatch(bot)}
            disabled={simulating}
          >
            {simulating ? '⚡ CARGANDO...' : '🎯 JUGAR'}
          </button>
        </div>
      </div>
    );
  };

  const BotDetailsModal = ({ bot, onClose, onStart }) => {
    const difficulty = getBotDifficulty(bot.level);
    const rewards = getBotRewards(bot.level);
    const skills = getBotSkills(bot.level);
    const stats = getBotStats(bot.level);
    const analysis = getMatchAnalysis(bot.level, playerLevel);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="bot-details-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>ANÁLISIS DETALLADO - {bot.name}</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-content">
            {/* Header del modal */}
            <div className="details-header">
              <div className="details-avatar">
                {getBotAvatar(bot.level, difficulty.class)}
                <div className="details-level">NIVEL {bot.level}</div>
              </div>
              <div className="details-info">
                <div className={`difficulty-badge ${difficulty.class}`}>
                  {difficulty.text}
                </div>
                <div className="match-analysis">
                  <div className="analysis-card">
                    <div className="analysis-title">PROBABILIDAD DE VICTORIA</div>
                    <div className="analysis-value">{analysis.winProbability}%</div>
                  </div>
                  <div className="analysis-card">
                    <div className="analysis-title">MULTIPLICADOR RECOMPENSA</div>
                    <div className="analysis-value">x{analysis.rewardMultiplier}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas detalladas */}
            <div className="stats-section">
              <h4>ESTADÍSTICAS</h4>
              <div className="stats-grid-detailed">
                {Object.entries(stats).map(([stat, value]) => (
                  <div key={stat} className="stat-item-detailed">
                    <div className="stat-header">
                      <span className="stat-name">
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </span>
                      <span className="stat-value">{value}</span>
                    </div>
                    <div className="stat-bar-detailed">
                      <div 
                        className={`stat-fill-detailed ${stat}`}
                        style={{width: `${value}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Habilidades por categoría */}
            <div className="skills-section">
              <h4>HABILIDADES</h4>
              <div className="skills-categories">
                {Object.entries(skills).map(([category, categorySkills]) => (
                  <div key={category} className="skill-category">
                    <h5>{category.toUpperCase()}</h5>
                    <div className="skills-list">
                      {categorySkills.map((skill, index) => (
                        <div key={index} className="skill-item">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recompensas completas */}
            <div className="rewards-section">
              <h4>RECOMPENSAS</h4>
              <div className="rewards-grid">
                <div className="reward-category">
                  <h6>EXPERIENCIA</h6>
                  <div className="reward-value">⭐ {rewards.xp} XP</div>
                </div>
                <div className="reward-category">
                  <h6>MONEDAS</h6>
                  <div className="reward-value">🪙 {rewards.coins}</div>
                </div>
                {rewards.premiumCurrency > 0 && (
                  <div className="reward-category">
                    <h6>MONEDAS PREMIUM</h6>
                    <div className="reward-value premium">💎 {rewards.premiumCurrency}</div>
                  </div>
                )}
                <div className="reward-category">
                  <h6>ITEMS</h6>
                  <div className="reward-items">
                    {rewards.items.map((item, index) => (
                      <div key={index} className="reward-item-detailed">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Acción final */}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                VOLVER
              </button>
              <button 
                className={`btn-primary ${difficulty.class}`}
                onClick={() => onStart(bot)}
                disabled={simulating}
              >
                {simulating ? 'INICIANDO PARTIDA...' : `DESAFIAR A ${bot.name}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="panel-content premium">
      <div className="bots-header">
        <h2>SELECCIONA TU OPONENTE</h2>
        <p>Elige estratégicamente según tu nivel y habilidades</p>
      </div>
      
      <div className="bots-grid premium">
        {bots.map(bot => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>

      {showDetails && selectedBot && (
        <BotDetailsModal
          bot={selectedBot}
          onClose={() => setShowDetails(false)}
          onStart={handleStartMatch}
        />
      )}
    </div>
  );
};
