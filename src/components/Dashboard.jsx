import React, { useState, useEffect } from "react";
import { getCharacter, getWallet, updateStat, trainCharacter } from "../services/api";
import BotMatchmaking from "../components/BotMatchmaking";
import { ClubList } from "../components/clubs/ClubList";
import { ClubCreation } from "../components/clubs/ClubCreation";
import { MyClub } from "../components/clubs/MyClub";
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

  // Pantalla de carga
  if (loading) return (
    <div className="epic-loading">
      <div className="loading-orb"></div>
      <div className="loading-text">
        <h2>INICIALIZANDO SISTEMA</h2>
        <p>Cargando datos del gladiador...</p>
      </div>
      <div className="scan-line"></div>
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

  // ========== DASHBOARD PRINCIPAL ==========
  return (
    <div className="super-dashboard">
      {/* Fondo con efectos */}
      <div className="dashboard-bg">
        <div className="particles"></div>
        <div className="grid-lines"></div>
      </div>

      {/* Header Épico */}
      <header className="epic-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">LUPI-CORE</span>
          </div>
          <div className="player-tag">
            <span className="tag">{character.nickname || "GLADIADOR"}</span>
            <span className="level-badge">NV. {character.level || 1}</span>
          </div>
        </div>
        
        <div className="header-center">
          <div className="mission-status">
            <span className="status-pulse"></span>
            SISTEMA ACTIVO
          </div>
        </div>

        <div className="header-right">
          <div className="resource-display">
            <div className="resource">
              <span className="resource-icon">⚡</span>
              <span className="resource-value">{character.available_skill_points || 0}</span>
              <span className="resource-label">PUNTOS HABILIDAD</span>
            </div>
            <div className="resource">
              <span className="resource-icon">💰</span>
              <span className="resource-value">{wallet?.lupicoins || 0}</span>
              <span className="resource-label">LUPICOINS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación Principal */}
      <nav className="epic-nav">
        <button 
          className={`nav-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 PANEL PRINCIPAL
        </button>
        <button 
          className={`nav-btn ${activeTab === "skills" ? "active" : ""}`}
          onClick={() => setActiveTab("skills")}
        >
          🎯 TODAS LAS HABILIDADES
        </button>
        <button 
          className={`nav-btn ${activeTab === "training" ? "active" : ""}`}
          onClick={() => setActiveTab("training")}
        >
          🏋️ ENTRENAMIENTO
        </button>
      </nav>

      {/* Contenido Principal */}
      <main className="dashboard-main">
        
       // En la pestaña de Panel Principal, reemplaza el main-grid con esto:
{activeTab === "stats" && (
  <div className="tab-content stats-tab">
    <div className="main-layout-70-30">
      
      {/* Panel Principal (70%) */}
      <div className="main-panel">
        <div className="panel-content">
          
          {/* Perfil del Jugador */}
          <div className="epic-card profile-card">
            <div className="card-header">
              <h3>PERFIL DEL GLADIADOR</h3>
              <div className="card-badge">ACTIVO</div>
            </div>
            <div className="profile-content">
              <div className="character-avatar">
                <div className="avatar-glowing">
                  <div className="avatar-core">⚽</div>
                  <div className="avatar-ring"></div>
                </div>
                <div className="avatar-level">NV. {character.level}</div>
              </div>
              
              <div className="profile-info">
                <h2 className="character-name">{character.nickname}</h2>
                <div className="character-class">DELANTERO ÉLITE</div>
                
                {/* Estadísticas del Personaje */}
                <div className="stats-summary">
                  <div className="stat-row">
                    <span className="stat-name">Experiencia</span>
                    <span className="stat-value">
                      {character.experience || 0} / {character.experience_to_next_level || 100}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-name">Energía</span>
                    <span className="stat-value">{character.energia || 100}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-name">Salud</span>
                    <span className="stat-value">{character.salud || 100}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-name">Hambre</span>
                    <span className="stat-value">{character.hambre || 100}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-name">Sed</span>
                    <span className="stat-value">{character.sed || 100}</span>
                  </div>
                </div>

                <div className="exp-display">
                  <div className="exp-bar-container">
                    <div className="exp-bar">
                      <div 
                        className="exp-fill" 
                        style={{ 
                          width: `${Math.min((character.experience || 0) / (character.experience_to_next_level || 100) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="exp-numbers">
                      PRÓXIMO NIVEL: {character.experience_to_next_level - (character.experience || 0)} EXP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Radar de Atributos */}
          <div className="epic-card radar-card">
            <div className="card-header">
              <h3>RADAR DE ATRIBUTOS</h3>
            </div>
            <div className="radar-container">
              <EnhancedRadarChart character={character} />
            </div>
          </div>

        </div>
      </div>

      {/* Panel de Misiones (30%) */}
      <div className="missions-panel">
        <div className="epic-card missions-card">
          <div className="card-header">
            <h3>MISIONES ACTIVAS</h3>
            <div className="missions-count">4</div>
          </div>
          <div className="missions-list">
            <div className="mission-item">
              <div className="mission-icon">🎯</div>
              <div className="mission-info">
                <h4>Entrenamiento Diario</h4>
                <p>Completa 3 sesiones de entrenamiento</p>
                <div className="mission-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '66%'}}></div>
                  </div>
                  <span>2/3</span>
                </div>
              </div>
            </div>
            
            <div className="mission-item">
              <div className="mission-icon">⚔️</div>
              <div className="mission-info">
                <h4>Victoria en Arena</h4>
                <p>Gana 1 partida contra bots</p>
                <div className="mission-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '0%'}}></div>
                  </div>
                  <span>0/1</span>
                </div>
              </div>
            </div>
            
            <div className="mission-item">
              <div className="mission-icon">🏆</div>
              <div className="mission-info">
                <h4>Unirse a un Clan</h4>
                <p>Forma parte de una comunidad</p>
                <div className="mission-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: character.club_id ? '100%' : '0%'}}></div>
                  </div>
                  <span>{character.club_id ? '1/1' : '0/1'}</span>
                </div>
              </div>
            </div>

            <div className="mission-item">
              <div className="mission-icon">⭐</div>
              <div className="mission-info">
                <h4>Mejora de Habilidades</h4>
                <p>Gasta 5 puntos de habilidad</p>
                <div className="mission-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '20%'}}></div>
                  </div>
                  <span>1/5</span>
                </div>
              </div>
            </div>

            <div className="mission-item">
              <div className="mission-icon">💰</div>
              <div className="mission-info">
                <h4>Recolector de Monedas</h4>
                <p>Consigue 500 Lupicoins</p>
                <div className="mission-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${Math.min(((wallet?.lupicoins || 0) / 500) * 100, 100)}%`}}></div>
                  </div>
                  <span>{wallet?.lupicoins || 0}/500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
)}

        {/* Pestaña de Todas las Habilidades */}
        {activeTab === "skills" && (
          <div className="tab-content skills-tab">
            <AllSkillsGrid 
              character={character} 
              onSkillUpgrade={increaseStat}
              addingSkill={addingSkill}
            />
          </div>
        )}

        {/* Pestaña de Entrenamiento */}
        {activeTab === "training" && (
          <div className="tab-content training-tab">
            <TrainingSection 
              character={character}
              onTrain={handleTrain}
              training={training}
            />
          </div>
        )}

      </main>

      {/* Barra de Acciones (NO FIJA) */}
      <div className="epic-actions-container">
        <div className="epic-actions">
          <button 
            className="action-btn primary"
            onClick={() => setCurrentSection("bot-match")}
          >
            <span className="btn-icon">⚔️</span>
            <span className="btn-text">ARENA</span>
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => setCurrentSection("clubs")}
          >
            <span className="btn-icon">🏆</span>
            <span className="btn-text">CLANES</span>
          </button>
          
          <button className="action-btn">
            <span className="btn-icon">🛒</span>
            <span className="btn-text">MERCADO</span>
          </button>
          
          <button className="action-btn" onClick={() => fetchData(user.id)}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">ACTUALIZAR</span>
          </button>
        </div>
      </div>

      {/* Efectos de Nivel Up */}
      {showLevelUp && <LevelUpAnimation />}
    </div>
  );
};

// Radar de Atributos Mejorado
const EnhancedRadarChart = ({ character }) => {
  const mainAttributes = [
    { key: "pase", label: "PASE", value: character.pase || 0, color: "#00ff88" },
    { key: "tiro", label: "TIRO", value: character.tiro || 0, color: "#ff4444" },
    { key: "regate", label: "REGATE", value: character.regate || 0, color: "#8844ff" },
    { key: "velocidad", label: "VELOCIDAD", value: character.velocidad || 0, color: "#ffaa00" },
    { key: "defensa", label: "DEFENSA", value: character.defensa || 0, color: "#00aaff" },
    { key: "potencia", label: "FÍSICO", value: character.potencia || 0, color: "#ff44aa" },
  ];

  const maxValue = 100;
  const center = 150;
  const radius = 120;

  return (
    <div className="enhanced-radar">
      <svg width="300" height="300" viewBox="0 0 300 300" className="radar-svg">
        {/* Círculos de referencia */}
        <circle cx={center} cy={center} r={radius * 0.25} fill="none" stroke="rgba(0, 255, 136, 0.2)" strokeWidth="1"/>
        <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="rgba(0, 255, 136, 0.2)" strokeWidth="1"/>
        <circle cx={center} cy={center} r={radius * 0.75} fill="none" stroke="rgba(0, 255, 136, 0.2)" strokeWidth="1"/>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0, 255, 136, 0.3)" strokeWidth="2"/>

        {/* Líneas de ejes */}
        {mainAttributes.map((attr, index) => {
          const angle = (index * 2 * Math.PI) / mainAttributes.length - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line 
              key={`axis-${index}`}
              x1={center} 
              y1={center} 
              x2={x} 
              y2={y} 
              stroke="rgba(0, 255, 136, 0.3)" 
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono de atributos */}
        <polygon
          points={mainAttributes.map((attr, index) => {
            const angle = (index * 2 * Math.PI) / mainAttributes.length - Math.PI / 2;
            const valueRadius = (attr.value / maxValue) * radius;
            const x = center + valueRadius * Math.cos(angle);
            const y = center + valueRadius * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ')}
          fill="rgba(0, 255, 136, 0.3)"
          stroke="#00ff88"
          strokeWidth="2"
        />

        {/* Puntos y etiquetas */}
        {mainAttributes.map((attr, index) => {
          const angle = (index * 2 * Math.PI) / mainAttributes.length - Math.PI / 2;
          const valueRadius = (attr.value / maxValue) * radius;
          const x = center + valueRadius * Math.cos(angle);
          const y = center + valueRadius * Math.sin(angle);
          const labelRadius = radius + 20;
          const labelX = center + labelRadius * Math.cos(angle);
          const labelY = center + labelRadius * Math.sin(angle);

          return (
            <g key={attr.key}>
              {/* Punto */}
              <circle cx={x} cy={y} r="4" fill={attr.color} stroke="#000" strokeWidth="1"/>
              
              {/* Línea al punto */}
              <line 
                x1={center} 
                y1={center} 
                x2={x} 
                y2={y} 
                stroke={attr.color} 
                strokeWidth="1" 
                opacity="0.5"
              />
              
              {/* Etiqueta */}
              <text 
                x={labelX} 
                y={labelY} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="radar-label"
                fill={attr.color}
                fontSize="10"
                fontWeight="bold"
              >
                {attr.label}
              </text>
              
              {/* Valor */}
              <text 
                x={x} 
                y={y - 10} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="radar-value"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
              >
                {attr.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Componente de Todas las Habilidades
const AllSkillsGrid = ({ character, onSkillUpgrade, addingSkill }) => {
  const allSkills = [
    { key: "pase", label: "Pase Preciso", icon: "📨", desc: "Precisión en pases", category: "Técnica" },
    { key: "tiro", label: "Disparo Letal", icon: "🎯", desc: "Fuerza y precisión de tiro", category: "Ataque" },
    { key: "regate", label: "Regate Ágil", icon: "🌀", desc: "Habilidad para driblar", category: "Técnica" },
    { key: "velocidad", label: "Velocidad Explosiva", icon: "💨", desc: "Rapidez en el campo", category: "Físico" },
    { key: "defensa", label: "Muro Defensivo", icon: "🛡️", desc: "Habilidad defensiva", category: "Defensa" },
    { key: "potencia", label: "Fuerza Bruta", icon: "💪", desc: "Potencia física", category: "Físico" },
    { key: "liderazgo", label: "Liderazgo", icon: "👑", desc: "Capacidad de liderazgo", category: "Mental" },
    { key: "tecnica", label: "Técnica", icon: "🔧", desc: "Habilidad técnica", category: "Técnica" },
    { key: "estrategia", label: "Estrategia", icon: "🧠", desc: "Inteligencia táctica", category: "Mental" },
    { key: "inteligencia", label: "Inteligencia", icon: "📈", desc: "Visión de juego", category: "Mental" },
    { key: "resistencia_base", label: "Resistencia", icon: "🏃", desc: "Resistencia física", category: "Físico" },
  ];

  // Agrupar habilidades por categoría
  const skillsByCategory = allSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <div className="all-skills-container">
      <div className="skills-header">
        <h3>SISTEMA COMPLETO DE HABILIDADES</h3>
        <div className="skill-points-display">
          <span className="points-count">{character.available_skill_points || 0}</span>
          <span className="points-label">PUNTOS DISPONIBLES</span>
        </div>
      </div>
      
      {Object.entries(skillsByCategory).map(([category, skills]) => (
        <div key={category} className="skills-category">
          <h4 className="category-title">{category}</h4>
          <div className="skills-grid">
            {skills.map(skill => {
              const currentValue = character[skill.key] || 0;
              const canUpgrade = character.available_skill_points > 0 && currentValue < 100;
              
              return (
                <div key={skill.key} className="skill-card epic">
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
                        style={{ width: `${currentValue}%` }}
                      ></div>
                    </div>
                    <span className="skill-value">{currentValue}/100</span>
                  </div>

                  {canUpgrade ? (
                    <button
                      className="upgrade-btn epic"
                      onClick={() => onSkillUpgrade(skill.key)}
                      disabled={addingSkill}
                    >
                      {addingSkill ? "⚡..." : "⚡ MEJORAR"}
                    </button>
                  ) : currentValue >= 100 ? (
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
  );
};

// Componente de Entrenamiento (mantenemos el mismo)
const TrainingSection = ({ character, onTrain, training }) => {
  return (
    <div className="training-container">
      <div className="training-card epic-card">
        <div className="card-header">
          <h3>CÁMARA DE ENTRENAMIENTO</h3>
        </div>
        
        <div className="training-content">
          <div className="training-visual">
            <div className="training-orb">
              <div className="orb-core"></div>
              <div className="orb-rings">
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="ring"></div>
              </div>
            </div>
          </div>
          
          <div className="training-info">
            <h4>ENTRENAMIENTO INTENSIVO</h4>
            <p>Mejora tus habilidades básicas mediante entrenamiento riguroso</p>
            
            <div className="training-rewards">
              <div className="reward-item">
                <span className="reward-icon">⭐</span>
                <span className="reward-text">+100 EXP</span>
              </div>
              <div className="reward-item">
                <span className="reward-icon">💰</span>
                <span className="reward-text">+150 LUPICOINS</span>
              </div>
            </div>
            
            <button 
              className="train-btn epic"
              onClick={onTrain}
              disabled={training}
            >
              {training ? (
                <>
                  <span className="training-spinner"></span>
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

// Animación de Level Up (mantenemos igual)
const LevelUpAnimation = () => {
  return (
    <div className="level-up-overlay">
      <div className="level-up-content">
        <div className="level-up-text">¡NIVEL ALCANZADO!</div>
        <div className="level-up-effects">
          <div className="explosion"></div>
          <div className="particles"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
