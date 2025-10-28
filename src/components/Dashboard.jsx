import React, { useState, useEffect } from "react";
import { getCharacter, getWallet, updateStat, trainCharacter } from "../services/api";
import BotMatchmaking from "../components/BotMatchmaking";
import { ClubList } from "../components/clubs/ClubList";
import { ClubCreation } from "../components/clubs/ClubCreation";
import { MyClub } from "../components/clubs/MyClub";
import "../styles/SuperDashboard.css";

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

  // Efectos de partículas en el fondo (simulados con CSS)
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

  // Si está cargando - Pantalla de carga épica
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

  // Renderizar secciones específicas
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

  // ========== SUPER DASHBOARD PRINCIPAL ==========
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
          📊 ESTADÍSTICAS
        </button>
        <button 
          className={`nav-btn ${activeTab === "skills" ? "active" : ""}`}
          onClick={() => setActiveTab("skills")}
        >
          🎯 HABILIDADES
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
        
        {/* Pestaña de Estadísticas */}
        {activeTab === "stats" && (
          <div className="tab-content stats-tab">
            <div className="stats-grid">
              
              {/* Tarjeta de Perfil Épica */}
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
                          {character.experience || 0} / {character.experience_to_next_level || 100} EXP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Radar de Habilidades */}
              <div className="epic-card radar-card">
                <div className="card-header">
                  <h3>RADAR DE ATRIBUTOS</h3>
                </div>
                <div className="radar-container">
                  <SkillsRadar character={character} />
                </div>
              </div>

              {/* Stats Rápidas */}
              <div className="epic-card quick-stats">
                <div className="card-header">
                  <h3>ESTADÍSTICAS RÁPIDAS</h3>
                </div>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-icon">🎯</span>
                    <span className="stat-name">Precisión</span>
                    <span className="stat-value">{character.tiro || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">💨</span>
                    <span className="stat-name">Velocidad</span>
                    <span className="stat-value">{character.velocidad || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🛡️</span>
                    <span className="stat-name">Defensa</span>
                    <span className="stat-value">{character.defensa || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">⚡</span>
                    <span className="stat-name">Energía</span>
                    <span className="stat-value">{character.energia || 100}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Pestaña de Habilidades */}
        {activeTab === "skills" && (
          <div className="tab-content skills-tab">
            <SkillsGrid 
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

      {/* Barra de Acciones Inferior */}
      <footer className="epic-actions">
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
      </footer>

      {/* Efectos de Nivel Up */}
      {showLevelUp && <LevelUpAnimation />}
    </div>
  );
};

// Componente de Radar de Habilidades
const SkillsRadar = ({ character }) => {
  const skills = [
    { key: "pase", label: "PASE", value: character.pase || 0 },
    { key: "tiro", label: "TIRO", value: character.tiro || 0 },
    { key: "regate", label: "REGATE", value: character.regate || 0 },
    { key: "velocidad", label: "VELOCIDAD", value: character.velocidad || 0 },
    { key: "defensa", label: "DEFENSA", value: character.defensa || 0 },
    { key: "potencia", label: "FÍSICO", value: character.potencia || 0 },
  ];

  return (
    <div className="skills-radar">
      <div className="radar-chart">
        {skills.map((skill, index) => {
          const angle = (index * 360) / skills.length;
          const radius = (skill.value / 100) * 80;
          return (
            <div 
              key={skill.key}
              className="radar-point"
              style={{
                transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
              }}
            >
              <div className="point-value">{skill.value}</div>
              <div className="point-label">{skill.label}</div>
            </div>
          );
        })}
        <div className="radar-grid">
          {[25, 50, 75, 100].map(percent => (
            <div 
              key={percent}
              className="grid-circle"
              style={{ width: `${percent * 1.6}px`, height: `${percent * 1.6}px` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente de Grid de Habilidades
const SkillsGrid = ({ character, onSkillUpgrade, addingSkill }) => {
  const allSkills = [
    { key: "pase", label: "Pase Preciso", icon: "📨", desc: "Precisión en pases" },
    { key: "tiro", label: "Disparo Letal", icon: "🎯", desc: "Fuerza y precisión de tiro" },
    { key: "regate", label: "Regate Ágil", icon: "🌀", desc: "Habilidad para driblar" },
    { key: "velocidad", label: "Velocidad Explosiva", icon: "💨", desc: "Rapidez en el campo" },
    { key: "defensa", label: "Muro Defensivo", icon: "🛡️", desc: "Habilidad defensiva" },
    { key: "potencia", label: "Fuerza Bruta", icon: "💪", desc: "Potencia física" },
    { key: "liderazgo", label: "Liderazgo", icon: "👑", desc: "Capacidad de liderazgo" },
    { key: "tecnica", label: "Técnica", icon: "🔧", desc: "Habilidad técnica" },
  ];

  return (
    <div className="skills-grid-container">
      <div className="skills-header">
        <h3>SISTEMA DE HABILIDADES</h3>
        <div className="skill-points-display">
          <span className="points-count">{character.available_skill_points || 0}</span>
          <span className="points-label">PUNTOS DISPONIBLES</span>
        </div>
      </div>
      
      <div className="skills-grid">
        {allSkills.map(skill => {
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
              ) : (
                <div className="max-level">NIVEL MÁXIMO</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Entrenamiento
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

// Animación de Level Up
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

// Funciones existentes (increaseStat, handleTrain, etc.)
const increaseStat = async (statKey) => {
  // ... tu código existente
};

const handleTrain = async () => {
  // ... tu código existente
};

export default Dashboard;
