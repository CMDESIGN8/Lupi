import React, { useState, useEffect } from "react";
import { getCharacter, getWallet, updateStat, trainCharacter } from "../services/api";
import BotMatchmaking from "./BotMatchmaking";
import { ClubList } from "./clubs/ClubList";
import { ClubCreation } from "./clubs/ClubCreation";
import { MyClub } from "./clubs/MyClub";
import "../styles/Dashboard.css";

export const Dashboard = ({ user, character: initialCharacter }) => {
  const [character, setCharacter] = useState(initialCharacter);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [training, setTraining] = useState(false);
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("stats");

  useEffect(() => {
    if (user) fetchData(user.id);
  }, [user, refreshTrigger]);

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

  const handleClubUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchData(user.id);
  };

  const increaseStat = async (statKey) => {
    if (!character || character.available_skill_points <= 0) return;
    setAddingSkill(true);
    try {
      const updatedCharacter = await updateStat(character.id, statKey);
      setCharacter(updatedCharacter);
    } catch (err) {
      console.error("Error al agregar skill:", err);
      alert(err.message);
    } finally {
      setAddingSkill(false);
    }
  };

  const handleTrain = async () => {
    if (!character) return;
    setTraining(true);
    try {
      const result = await trainCharacter(character.id);
      if (result.character) {
        setCharacter(result.character);
        setWallet(result.wallet);
        if (result.leveledUp) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error entrenando:", err);
      alert(err.message);
    } finally {
      setTraining(false);
    }
  };

  // Pantalla de carga épica
  if (loading) return (
    <div className="epic-loading">
      <div className="loading-orb"></div>
      <div className="loading-text">
        <h2>INICIALIZANDO SISTEMA LUPI</h2>
        <p>Cargando datos del gladiador...</p>
      </div>
      <div className="scan-line"></div>
      <div className="loading-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
  );

  // Secciones específicas
  if (currentSection === "bot-match") {
    return (
      <div className="super-dashboard">
        <div className="section-header">
          <button onClick={() => setCurrentSection("dashboard")} className="btn-back epic-btn">
            ⬅ VOLVER AL NÚCLEO
          </button>
          <h2 className="section-title">⚔️ ARENA DE ENTRENAMIENTO</h2>
        </div>
        <BotMatchmaking character={character} onMatchUpdate={fetchData} />
      </div>
    );
  }

  if (currentSection === "clubs") {
    return (
      <div className="super-dashboard">
        <div className="section-header">
          <button onClick={() => setCurrentSection("dashboard")} className="btn-back epic-btn">
            ⬅ VOLVER AL NÚCLEO
          </button>
          <h2 className="section-title">🏆 CLANES DE GUERREROS</h2>
        </div>
        {character.club_id ? (
          <MyClub character={character} onClubUpdate={handleClubUpdate} />
        ) : (
          <div className="clubs-section">
            <ClubCreation user={user} character={character} onClubCreated={handleClubUpdate} />
            <ClubList character={character} onClubUpdate={handleClubUpdate} />
          </div>
        )}
      </div>
    );
  }

  // ========== DASHBOARD PRINCIPAL ÉPICO ==========
  return (
    <div className="super-dashboard">
      {/* Fondo con efectos épicos */}
      <div className="dashboard-bg">
        <div className="nebula-effect"></div>
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        <div className="grid-overlay"></div>
      </div>

      {/* Header Épico Mejorado */}
      <header className="epic-header">
        <div className="header-left">
          <div className="logo-glow">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">LUPI-CORE</span>
            <div className="logo-pulse"></div>
          </div>
          <div className="player-identity">
            <div className="player-badge">
              <span className="player-name">{character.nickname || "GLADIADOR"}</span>
              <span className="player-level">NV. {character.level || 1}</span>
            </div>
            {character.club_id && (
              <div className="club-indicator">
                <span className="club-badge">🏆 CLUB ACTIVO</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="header-center">
          <div className="system-status">
            <div className="status-indicator">
              <div className="pulse-dot"></div>
              <span className="status-text">SISTEMA OPERATIVO</span>
            </div>
            <div className="connection-bars">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="resources-panel">
            <div className="resource-card">
              <div className="resource-icon">⚡</div>
              <div className="resource-info">
                <div className="resource-value">{character.available_skill_points || 0}</div>
                <div className="resource-label">PUNTOS HABILIDAD</div>
              </div>
            </div>
            <div className="resource-card">
              <div className="resource-icon">💰</div>
              <div className="resource-info">
                <div className="resource-value">{wallet?.lupicoins || 0}</div>
                <div className="resource-label">LUPICOINS</div>
              </div>
            </div>
            <div className="resource-card">
              <div className="resource-icon">⭐</div>
              <div className="resource-info">
                <div className="resource-value">{character.experience || 0}</div>
                <div className="resource-label">EXPERIENCIA</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación Principal Mejorada */}
      <nav className="epic-navigation">
        <div className="nav-container">
          <button 
            className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">PANEL PRINCIPAL</span>
            <div className="nav-glow"></div>
          </button>
          <button 
            className={`nav-item ${activeTab === "skills" ? "active" : ""}`}
            onClick={() => setActiveTab("skills")}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">HABILIDADES</span>
            <div className="nav-glow"></div>
          </button>
          <button 
            className={`nav-item ${activeTab === "training" ? "active" : ""}`}
            onClick={() => setActiveTab("training")}
          >
            <span className="nav-icon">🏋️</span>
            <span className="nav-text">ENTRENAMIENTO</span>
            <div className="nav-glow"></div>
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="dashboard-main">
        
        {/* Pestaña de Panel Principal */}
        {activeTab === "stats" && (
          <div className="main-dashboard">
            <div className="dashboard-grid">
              
              {/* Panel del Héroe (70%) */}
              <div className="hero-panel">
                
                {/* Tarjeta de Perfil Épica */}
                <div className="epic-profile-card">
                  <div className="card-glow"></div>
                  <div className="card-header">
                    <h3 className="card-title">PERFIL DEL DEPORTISTA</h3>
                    <div className="card-badges">
                      <span className="badge level-badge">NV. {character.level}</span>
                      <span className="badge class-badge">DELANTERO</span>
                    </div>
                  </div>
                  
                  <div className="profile-content">
                    {/* Avatar y Info Básica */}
                    <div className="avatar-section">
                      <div className="avatar-container">
                        <div className="avatar-glow">
                          <div className="avatar-core">
                            <div className="avatar-icon">⚽</div>
                          </div>
                          <div className="avatar-rings">
                            <div className="ring"></div>
                            <div className="ring"></div>
                            <div className="ring"></div>
                          </div>
                        </div>
                        <div className="avatar-stats">
                          <div className="stat-mini">
                            <span className="mini-label">ENERGÍA</span>
                            <span className="mini-value">{character.energia || 100}</span>
                          </div>
                          <div className="stat-mini">
                            <span className="mini-label">SALUD</span>
                            <span className="mini-value">{character.salud || 100}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="player-info">
                        <h1 className="player-name-glow">{character.nickname}</h1>
                        <div className="player-title">DELANTERO ÉLITE</div>
                        
                        {/* Barra de Experiencia Mejorada */}
                        <div className="exp-section">
                          <div className="exp-header">
                            <span className="exp-label">EXPERIENCIA</span>
                            <span className="exp-numbers">
                              {character.experience || 0} / {character.experience_to_next_level || 100}
                            </span>
                          </div>
                          <div className="exp-bar-container">
                            <div className="exp-bar">
                              <div 
                                className="exp-fill" 
                                style={{ 
                                  width: `${Math.min((character.experience || 0) / (character.experience_to_next_level || 100) * 100, 100)}%` 
                                }}
                              >
                                <div className="exp-shine"></div>
                              </div>
                            </div>
                            <div className="exp-next">
                              Próximo nivel: <span>{character.experience_to_next_level - (character.experience || 0)} EXP</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Radar de Atributos */}
                    <div className="radar-section">
                      <div className="section-header">
                        <h4>RADAR DE ATRIBUTOS</h4>
                        <div className="section-actions">
                          <button className="btn-small">📊 DETALLES</button>
                        </div>
                      </div>
                      <div className="radar-container">
                        <EnhancedRadarChart character={character} />
                      </div>
                    </div>

              
                  </div>
                </div>
              </div>

              {/* Panel de Misiones (30%) */}
              <div className="missions-panel">
                <div className="missions-card">
                  <div className="card-glow"></div>
                  <div className="card-header">
                    <h3 className="card-title">MISIONES ACTIVAS</h3>
                    <div className="missions-count">5</div>
                  </div>
                  
                  <div className="missions-content">
                    <MissionList character={character} wallet={wallet} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Pestaña de Habilidades */}
        {activeTab === "skills" && (
          <SkillsTab 
            character={character} 
            onSkillUpgrade={increaseStat}
            addingSkill={addingSkill}
          />
        )}

        {/* Pestaña de Entrenamiento */}
        {activeTab === "training" && (
          <TrainingTab 
            character={character}
            onTrain={handleTrain}
            training={training}
          />
        )}

      </main>

      {/* Barra de Acciones Inferior Mejorada */}
      <footer className="action-bar">
        <div className="action-container">
          <button 
            className="action-btn primary-glow"
            onClick={() => setCurrentSection("bot-match")}
          >
            <span className="btn-icon">⚔️</span>
            <span className="btn-text">ARENA</span>
            <div className="btn-glow"></div>
          </button>
          
          <button 
            className="action-btn secondary-glow"
            onClick={() => setCurrentSection("clubs")}
          >
            <span className="btn-icon">🏆</span>
            <span className="btn-text">CLANES</span>
            <div className="btn-glow"></div>
          </button>
          
          <button className="action-btn">
            <span className="btn-icon">🛒</span>
            <span className="btn-text">MERCADO</span>
          </button>
          
          <button className="action-btn" onClick={() => fetchData(user.id)}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">ACTUALIZAR</span>
          </button>

          <button className="action-btn stats">
            <span className="btn-icon">📈</span>
            <span className="btn-text">ESTADÍSTICAS</span>
          </button>
        </div>
      </footer>

      {/* Efectos de Nivel Up Mejorados */}
      {showLevelUp && <LevelUpAnimation level={character.level} />}
    </div>
  );
};

// Componente de Radar Mejorado
const EnhancedRadarChart = ({ character }) => {
  const attributes = [
    { key: "pase", label: "PASE", value: character.pase || 0, color: "#00ff88" },
    { key: "tiro", label: "TIRO", value: character.tiro || 0, color: "#ff6b6b" },
    { key: "regate", label: "REGATE", value: character.regate || 0, color: "#4ecdc4" },
    { key: "velocidad", label: "VELOC", value: character.velocidad || 0, color: "#45b7d1" },
    { key: "defensa", label: "DEF", value: character.defensa || 0, color: "#96ceb4" },
    { key: "potencia", label: "FÍSICO", value: character.potencia || 0, color: "#feca57" }
  ];

  return (
    <div className="radar-chart-enhanced">
      <div className="radar-visual">
        <svg viewBox="0 0 200 200" className="radar-svg">
          {/* Círculos de referencia */}
          <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(0, 255, 136, 0.1)" strokeWidth="1"/>
          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0, 255, 136, 0.1)" strokeWidth="1"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0, 255, 136, 0.2)" strokeWidth="1"/>
          
          {/* Ejes */}
          {attributes.map((_, i) => {
            const angle = (i * 360) / attributes.length;
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 80 * Math.cos(rad);
            const y = 100 + 80 * Math.sin(rad);
            return (
              <line 
                key={i}
                x1="100" y1="100" 
                x2={x} y2={y} 
                stroke="rgba(0, 255, 136, 0.3)" 
                strokeWidth="1"
              />
            );
          })}
          
          {/* Polígono */}
          <polygon
            points={attributes.map(attr => {
              const angle = (attributes.indexOf(attr) * 360) / attributes.length;
              const rad = (angle * Math.PI) / 180;
              const value = (attr.value / 100) * 80;
              const x = 100 + value * Math.cos(rad);
              const y = 100 + value * Math.sin(rad);
              return `${x},${y}`;
            }).join(' ')}
            fill="rgba(0, 255, 136, 0.3)"
            stroke="#00ff88"
            strokeWidth="2"
          />
          
          {/* Puntos y etiquetas */}
          {attributes.map((attr, i) => {
            const angle = (i * 360) / attributes.length;
            const rad = (angle * Math.PI) / 180;
            const value = (attr.value / 100) * 80;
            const x = 100 + value * Math.cos(rad);
            const y = 100 + value * Math.sin(rad);
            const labelX = 100 + 95 * Math.cos(rad);
            const labelY = 100 + 95 * Math.sin(rad);

            return (
              <g key={attr.key}>
                <circle cx={x} cy={y} r="4" fill={attr.color} stroke="#000" strokeWidth="1"/>
                <text 
                  x={labelX} 
                  y={labelY} 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  className="radar-label"
                  fill={attr.color}
                  fontSize="8"
                  fontWeight="bold"
                >
                  {attr.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Componente de Categoría de Estadísticas
const StatCategory = ({ title, stats }) => {
  return (
    <div className="stat-category">
      <h5 className="category-title">{title}</h5>
      <div className="stats-list">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <div className="stat-info">
              <span className="stat-name">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
            <div className="stat-bar">
              <div 
                className="stat-fill" 
                style={{ width: `${stat.value}%` }}
                data-value={stat.value}
              >
                <div className="stat-glow"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de Lista de Misiones
const MissionList = ({ character, wallet }) => {
  const missions = [
    {
      icon: "🎯",
      title: "Entrenamiento Diario",
      description: "Completa 3 sesiones de entrenamiento",
      progress: 2,
      total: 3,
      type: "daily"
    },
    {
      icon: "⚔️",
      title: "Victoria en Arena",
      description: "Gana 1 partida contra bots",
      progress: 0,
      total: 1,
      type: "combat"
    },
    {
      icon: "🏆",
      title: "Unirse a un Clan",
      description: "Forma parte de una comunidad",
      progress: character.club_id ? 1 : 0,
      total: 1,
      type: "social"
    },
    {
      icon: "⭐",
      title: "Mejora de Habilidades",
      description: "Gasta 5 puntos de habilidad",
      progress: 1,
      total: 5,
      type: "progress"
    },
    {
      icon: "💰",
      title: "Recolector de Monedas",
      description: "Consigue 500 Lupicoins",
      progress: wallet?.lupicoins || 0,
      total: 500,
      type: "economy"
    }
  ];

  return (
    <div className="missions-list">
      {missions.map((mission, index) => (
        <div key={index} className={`mission-item ${mission.type}`}>
          <div className="mission-icon">{mission.icon}</div>
          <div className="mission-content">
            <h4>{mission.title}</h4>
            <p>{mission.description}</p>
            <div className="mission-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(mission.progress / mission.total) * 100}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {mission.progress}/{mission.total}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente de Pestaña de Habilidades
const SkillsTab = ({ character, onSkillUpgrade, addingSkill }) => {
  const skillCategories = {
    "TÉCNICA": [
      { key: "pase", label: "Pase Preciso", icon: "📨", desc: "Precisión en pases" },
      { key: "tiro", label: "Disparo Letal", icon: "🎯", desc: "Fuerza y precisión" },
      { key: "regate", label: "Regate Ágil", icon: "🌀", desc: "Habilidad para driblar" },
      { key: "tecnica", label: "Técnica", icon: "🔧", desc: "Habilidad técnica" }
    ],
    "FÍSICO": [
      { key: "velocidad", label: "Velocidad", icon: "💨", desc: "Rapidez en el campo" },
      { key: "potencia", label: "Potencia", icon: "💪", desc: "Fuerza física" },
      { key: "resistencia_base", label: "Resistencia", icon: "🏃", desc: "Resistencia física" }
    ],
    "DEFENSA": [
      { key: "defensa", label: "Defensa", icon: "🛡️", desc: "Habilidad defensiva" }
    ],
    "MENTAL": [
      { key: "liderazgo", label: "Liderazgo", icon: "👑", desc: "Capacidad de mando" },
      { key: "estrategia", label: "Estrategia", icon: "🧠", desc: "Inteligencia táctica" },
      { key: "inteligencia", label: "Inteligencia", icon: "📈", desc: "Visión de juego" }
    ]
  };

  return (
    <div className="skills-tab">
      <div className="skills-header">
        <h2>SISTEMA DE HABILIDADES</h2>
        <div className="skills-points">
          <span className="points-amount">{character.available_skill_points || 0}</span>
          <span className="points-label">PUNTOS DISPONIBLES</span>
        </div>
      </div>

      <div className="skills-categories">
        {Object.entries(skillCategories).map(([category, skills]) => (
          <div key={category} className="skill-category">
            <h3 className="category-header">{category}</h3>
            <div className="skills-grid">
              {skills.map(skill => {
                const value = character[skill.key] || 0;
                const canUpgrade = character.available_skill_points > 0 && value < 100;

                return (
                  <div key={skill.key} className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon">{skill.icon}</div>
                      <div className="skill-info">
                        <h4>{skill.label}</h4>
                        <p>{skill.desc}</p>
                      </div>
                    </div>
                    
                    <div className="skill-progress">
                      <div className="progress-container">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                      <span className="skill-value">{value}/100</span>
                    </div>

                    {canUpgrade ? (
                      <button
                        className="upgrade-btn"
                        onClick={() => onSkillUpgrade(skill.key)}
                        disabled={addingSkill}
                      >
                        {addingSkill ? "⚡..." : "⚡ MEJORAR"}
                      </button>
                    ) : value >= 100 ? (
                      <div className="max-level">NIVEL MÁXIMO</div>
                    ) : (
                      <div className="no-points">SIN PUNTOS</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de Pestaña de Entrenamiento
const TrainingTab = ({ character, onTrain, training }) => {
  return (
    <div className="training-tab">
      <div className="training-card">
        <div className="card-glow"></div>
        <div className="training-content">
          <div className="training-visual">
            <div className="training-orb">
              <div className="orb-core">
                <div className="orb-icon">⚽</div>
              </div>
              <div className="orb-rings">
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
              </div>
            </div>
          </div>
          
          <div className="training-info">
            <h2>CÁMARA DE ENTRENAMIENTO</h2>
            <p>Mejora tus habilidades básicas mediante entrenamiento riguroso y disciplinado</p>
            
            <div className="training-rewards">
              <div className="reward">
                <span className="reward-icon">⭐</span>
                <div className="reward-info">
                  <span className="reward-amount">+100</span>
                  <span className="reward-type">EXPERIENCIA</span>
                </div>
              </div>
              <div className="reward">
                <span className="reward-icon">💰</span>
                <div className="reward-info">
                  <span className="reward-amount">+150</span>
                  <span className="reward-type">LUPICOINS</span>
                </div>
              </div>
            </div>
            
            <button 
              className="train-btn"
              onClick={onTrain}
              disabled={training}
            >
              {training ? (
                <>
                  <div className="training-spinner"></div>
                  ENTRENANDO...
                </>
              ) : (
                "INICIAR ENTRENAMIENTO"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animación de Level Up Mejorada
const LevelUpAnimation = ({ level }) => {
  return (
    <div className="level-up-overlay">
      <div className="level-up-container">
        <div className="level-up-content">
          <div className="level-text">¡NIVEL ALCANZADO!</div>
          <div className="level-number">{level}</div>
          <div className="level-effects">
            <div className="explosion"></div>
            <div className="particles">
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
