import React, { useState, useEffect } from "react";
import { getCharacter, getWallet, updateStat, trainCharacter } from "../services/api";
import "../styles/Dashboard.css";

export const Dashboard = ({ user }) => {
  const [character, setCharacter] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    if (user) fetchData(user.id);
  }, [user]);

  const fetchData = async (userId) => {
    setLoading(true);
    try {
      const charData = await getCharacter(userId);
      if (charData?.id) {
        setCharacter(charData);
        const walletData = await getWallet(charData.id);
        setWallet(walletData);
      }
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const increaseStat = async (statKey) => {
    if (!character || character.available_skill_points <= 0) return;
    setAddingSkill(true);
    try {
      const updated = await updateStat(character.id, statKey);
      setCharacter(updated);
    } catch (err) {
      console.error("Error al agregar skill:", err);
    } finally {
      setAddingSkill(false);
    }
  };

  const handleTrain = async () => {
    if (!character) return;
    try {
      const result = await trainCharacter(character.id);
      if (result.character) {
        setCharacter(result.character);
        setWallet(result.wallet);
        if (result.character.level > character.level) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error entrenando:", err);
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Cargando datos del atleta...</p>
    </div>
  );
  
  if (!character) return <p>⚠️ No tienes personaje aún.</p>;

  const expActual = character.experience;
  const expMax = character.experience_to_next_level;
  const expPorcentaje = Math.min((expActual / expMax) * 100, 100);

  // Stats para el gráfico radial (6 stats principales)
  const mainStats = [
    { key: "pase", label: "Pase", value: character.pase || 50, short: "PAS" },
    { key: "tiro", label: "Tiro", value: character.tiro || 50, short: "TIR" },
    { key: "regate", label: "Regate", value: character.regate || 51, short: "REG" },
    { key: "velocidad", label: "Velocidad", value: character.velocidad || 51, short: "VEL" },
    { key: "defensa", label: "Defensa", value: character.defensa || 50, short: "DEF" },
    { key: "fisico", label: "Físico", value: character.potencia || 51, short: "FIS" }
  ];

  // Calcular promedio general
  const totalStats = mainStats.reduce((sum, stat) => sum + stat.value, 0);
  const averageRating = Math.round(totalStats / mainStats.length);

  // Función para generar el gráfico radial
  const RadarChart = ({ stats, size = 200 }) => {
    const center = size / 2;
    const radius = size * 0.4;
    
    const points = stats.map((stat, index) => {
      const angle = (index * 2 * Math.PI) / stats.length - Math.PI / 2;
      const value = (stat.value / 100) * radius;
      return {
        x: center + value * Math.cos(angle),
        y: center + value * Math.sin(angle),
        label: stat.short,
        value: stat.value
      };
    });

    const polygonPoints = points.map(point => `${point.x},${point.y}`).join(' ');

    return (
      <div className="radar-chart-container">
        <svg width={size} height={size} className="radar-chart">
          {/* Círculos concéntricos */}
          <circle cx={center} cy={center} r={radius * 0.75} className="radar-circle" />
          <circle cx={center} cy={center} r={radius * 0.5} className="radar-circle" />
          <circle cx={center} cy={center} r={radius * 0.25} className="radar-circle" />
          
          {/* Ejes */}
          {points.map((point, index) => (
            <line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos((index * 2 * Math.PI) / stats.length - Math.PI / 2)}
              y2={center + radius * Math.sin((index * 2 * Math.PI) / stats.length - Math.PI / 2)}
              className="radar-axis"
            />
          ))}
          
          {/* Polígono de stats */}
          <polygon
            points={polygonPoints}
            className="radar-polygon"
          />
          
          {/* Puntos */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              className="radar-point"
            />
          ))}
          
          {/* Etiquetas */}
          {points.map((point, index) => {
            const angle = (index * 2 * Math.PI) / stats.length - Math.PI / 2;
            const labelRadius = radius + 20;
            return (
              <g key={`label-${index}`}>
                <text
                  x={center + labelRadius * Math.cos(angle)}
                  y={center + labelRadius * Math.sin(angle)}
                  className="radar-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {point.label}
                </text>
                <text
                  x={center + (labelRadius + 15) * Math.cos(angle)}
                  y={center + (labelRadius + 15) * Math.sin(angle)}
                  className="radar-value"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {point.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Todas las stats para la lista
  const allStats = [
    { key: "pase", label: "📨 Pase", icon: "⚽" },
    { key: "potencia", label: "Potencia", icon: "💪" },
    { key: "velocidad", label: "Velocidad", icon: "💨" },
    { key: "liderazgo", label: "Liderazgo", icon: "👑" },
    { key: "tiro", label: "Tiro", icon: "🎯" },
    { key: "regate", label: "Regate", icon: "🌀" },
    { key: "tecnica", label: "Técnica", icon: "🔧" },
    { key: "estrategia", label: "Estrategia", icon: "🧠" },
    { key: "inteligencia", label: "Inteligencia", icon: "📈" },
    { key: "defensa", label: "Defensa", icon: "🛡️" },
    { key: "resistencia_base", label: "Resistencia", icon: "🏃" },
  ];

  return (
    <div className="dashboard">
      {/* Game Header */}
      <div className="game-header">
        <h1>FOOTBALL MODE</h1>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-label">NIVEL</span>
            <span className="stat-value">{character.level}</span>
          </div>
          <div className="header-stat">
            <span className="stat-label">SKILL POINTS</span>
            <span className="stat-value">{character.available_skill_points || 0}</span>
          </div>
          <div className="header-stat">
            <span className="stat-label">RATING</span>
            <span className="stat-value">{averageRating}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Columna Izquierda - Perfil del Atleta */}
        <div className="left-column">
          <section className="athlete-profile">
            <div className="profile-header">
              <div className="player-avatar">
                <div className="avatar-icon">⚽</div>
                <div className="overall-rating">{averageRating}</div>
              </div>
              <div className="player-info">
                <h2 className="player-name">{character.nickname || "LLP"}</h2>
                <div className="player-level">NIVEL {character.level || 1}</div>
                <div className="player-class">Delantero Estrella</div>
                <div className="player-position">POSICIÓN: DELANTERO</div>
              </div>
            </div>

            {/* Gráfico FIFA Style */}
            <div className="fifa-chart-section">
              <h3>📊 ESTADÍSTICAS PRINCIPALES</h3>
              
              <RadarChart stats={mainStats} size={280} />
              
              {/* Resumen de stats */}
              <div className="stats-summary">
                <div className="stats-string">
                  {mainStats.map(stat => (
                    <span key={stat.key} className="stat-abbr">
                      {stat.short}
                      <span className="stat-number">{stat.value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Leyenda de stats */}
              <div className="stats-legend">
                {mainStats.map(stat => (
                  <div key={stat.key} className="legend-item">
                    <span className="legend-label">{stat.label}</span>
                    <span className="legend-value">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="exp-section">
              <div className="exp-info">
                <span className="exp-label">EXPERIENCIA</span>
                <span className="exp-numbers">{expActual} / {expMax}</span>
              </div>
              <div className="exp-bar">
                <div
                  className="exp-fill glow-progress"
                  style={{ width: `${expPorcentaje}%` }}
                />
              </div>
              <div className="next-level">
                Próximo nivel: <span>{expMax - expActual} EXP</span>
              </div>
            </div>
          </section>

          <section className="training-section">
            <h3>🏋️ ENTRENAMIENTO</h3>
            <div className="training-info">
              <p>Mejora tus habilidades y gana recompensas</p>
              <div className="training-rewards">
                <span>+100 EXP</span>
                <span>+150 Lupicoins</span>
              </div>
            </div>
            <button className="train-btn" onClick={handleTrain}>
              💪 ENTRENAR AHORA
            </button>
          </section>
        </div>

        {/* Columna Derecha - Wallet y Habilidades */}
        <div className="right-column">
          {/* Wallet Section */}
          <section className="wallet-card">
            <div className="wallet-header">
              <h3>💰 WALLET</h3>
              <div className="wallet-balance">
                <span className="balance-amount">{wallet?.lupicoins || 0}</span>
                <span className="balance-label">LUPICOINS</span>
              </div>
            </div>
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="address-label">Dirección:</span>
                <span className="address-value">{wallet?.address || 'LLP/LLP'}</span>
              </div>
            </div>
            <div className="wallet-actions">
              <button className="wallet-btn primary">TRANSFERIR</button>
              <button className="wallet-btn">HISTORIAL</button>
            </div>
          </section>

          {/* Skills Section */}
          <section className="skills-section">
            <div className="skills-header">
              <h3>🎯 TODAS LAS HABILIDADES</h3>
              <div className="skills-points">
                <span className="points-available">{character.available_skill_points || 0}</span>
                <span className="points-label">Puntos Disponibles</span>
              </div>
            </div>

            <div className="skills-grid">
              {allStats.map(({ key, label, icon }) => (
                <div key={key} className="skill-card">
                  <div className="skill-header">
                    <div className="skill-icon">{icon}</div>
                    <div className="skill-info">
                      <span className="skill-name">{label}</span>
                      <span className="skill-level">Nv. {Math.floor((character[key] || 50) / 10)}</span>
                    </div>
                  </div>
                  
                  <div className="skill-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${character[key] || 50}%` }}
                      ></div>
                    </div>
                    <span className="skill-value">{character[key] || 50}</span>
                  </div>

                  {character.available_skill_points > 0 && (character[key] || 50) < 100 && (
                    <button
                      className="upgrade-btn"
                      onClick={() => increaseStat(key)}
                      disabled={addingSkill}
                    >
                      {addingSkill ? "..." : "⬆️"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Acciones Globales */}
      <div className="global-actions">
        <button onClick={() => fetchData(user.id)} className="refresh-btn">
          🔄 ACTUALIZAR DATOS
        </button>
        <button className="match-btn">
          ⚽ BUSCAR PARTIDO
        </button>
        <button className="market-btn">
          🛒 MERCADO
        </button>
      </div>

      {/* Popup de Level Up */}
      {showLevelUp && (
        <div className="levelup-popup">
          <div className="levelup-content">
            <h2>🎉 ¡SUBISTE DE NIVEL!</h2>
            <div className="levelup-stats">
              <div className="level-stat">
                <span>Nuevo Nivel</span>
                <span className="level-number">{character.level}</span>
              </div>
              <div className="level-stat">
                <span>Skill Points</span>
                <span className="skill-points">+5</span>
              </div>
            </div>
            <p>¡Continúa entrenando para mejorar tus habilidades!</p>
          </div>
        </div>
      )}
    </div>
  );
};
