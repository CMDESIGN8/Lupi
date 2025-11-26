// src/components/IntegratedDashboard.jsx
import React, { useState, useEffect } from "react";
import { GameWorld } from "./GameWorld";
import TrainingDashboard from "./TrainingDashboard";
import BotMatchmaking from "./BotMatchmaking";
import { ClubList } from "./clubs/ClubList";
import { ClubCreation } from "./clubs/ClubCreation";
import { MyClub } from "./clubs/MyClub";
import { getCharacter, getWallet, getBots } from "../services/api";
import "../styles/IntegratedDashboard.css";

export const IntegratedDashboard = ({ user }) => {
  const [character, setCharacter] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("game"); // 'game', 'dashboard', 'clubs', 'bot-match', 'futsal'
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

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
        const botsData = await getBots();
        setBots(botsData);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    setShowDetailsPanel(false);
  };

  const handleClubUpdate = () => {
    fetchData(user.id);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Cargando Mundo...</h2>
          <p>Preparando tu aventura deportiva</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="error-screen">
        <h2>Error al cargar personaje</h2>
        <button onClick={() => fetchData(user.id)}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="integrated-dashboard">
      {/* Vista Principal: Mundo del Juego */}
      {currentView === "game" && (
        <div className="game-view">
          <GameWorld 
            character={character}
            user={user}
            onNavigate={handleNavigate}
          />
          
          {/* Botón para abrir panel de detalles */}
          <button 
            className="toggle-details-btn"
            onClick={() => setShowDetailsPanel(!showDetailsPanel)}
          >
            {showDetailsPanel ? '✕ Cerrar Detalles' : '📊 Ver Detalles'}
          </button>

          {/* Panel lateral con información detallada */}
          {showDetailsPanel && (
            <div className="details-panel">
              <div className="panel-content">
                <h2>Información del Personaje</h2>
                
                <div className="character-summary">
                  <div className="summary-avatar">
                    <div className="avatar-large">⚽</div>
                    <div className="level-display">Nivel {character.level}</div>
                  </div>
                  
                  <div className="summary-stats">
                    <h3>{character.nickname}</h3>
                    <div className="stat-grid">
                      <div className="stat-item">
                        <span className="stat-label">Energía</span>
                        <span className="stat-value">{character.energia}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Salud</span>
                        <span className="stat-value">{character.salud}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Experiencia</span>
                        <span className="stat-value">{character.experience}/{character.experience_to_next_level}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Lupicoins</span>
                        <span className="stat-value">{wallet?.lupicoins || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="quick-stats">
                  <h3>Habilidades Principales</h3>
                  <div className="skills-preview">
                    <SkillBar label="Tiro" value={character.tiro} />
                    <SkillBar label="Pase" value={character.pase} />
                    <SkillBar label="Velocidad" value={character.velocidad} />
                    <SkillBar label="Defensa" value={character.defensa} />
                  </div>
                </div>

                <div className="quick-missions">
                  <h3>Misiones Activas</h3>
                  <div className="mission-preview">
                    <div className="mission-item">
                      <span>🎯 Entrenamiento Diario</span>
                      <span className="mission-progress">2/3</span>
                    </div>
                    <div className="mission-item">
                      <span>⚔️ Victoria en Arena</span>
                      <span className="mission-progress">0/1</span>
                    </div>
                    <div className="mission-item">
                      <span>🏆 Unirse a Club</span>
                      <span className="mission-progress">{character.club_id ? '✓' : '0/1'}</span>
                    </div>
                  </div>
                </div>

                <div className="panel-actions">
                  <button onClick={() => handleNavigate('dashboard')} className="panel-btn">
                    📊 Dashboard Completo
                  </button>
                  <button onClick={() => handleNavigate('clubs')} className="panel-btn">
                    🏆 Mi Club
                  </button>
                  <button onClick={() => handleNavigate('bot-match')} className="panel-btn">
                    ⚔️ Arena
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista: Dashboard Clásico */}
      {currentView === "dashboard" && (
        <div className="classic-view">
          <button className="back-to-game" onClick={() => handleNavigate('game')}>
            🎮 Volver al Mundo
          </button>
          {/* Aquí renderizarías tu Dashboard.jsx original */}
          <div className="dashboard-content">
            <h2>Dashboard Clásico</h2>
            <p>Integra aquí tu Dashboard.jsx completo</p>
          </div>
        </div>
      )}

      {/* Vista: Clubes */}
      {currentView === "clubs" && (
        <div className="section-view">
          <div className="section-header">
            <button onClick={() => handleNavigate('game')} className="back-btn">
              ⬅ Volver al Mundo
            </button>
            <h2>🏆 CLUBES</h2>
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
      )}

      {/* Vista: Arena de Bots */}
      {currentView === "bot-match" && (
        <div className="section-view">
          <div className="section-header">
            <button onClick={() => handleNavigate('game')} className="back-btn">
              ⬅ Volver al Mundo
            </button>
            <h2>⚔️ ARENA DE ENTRENAMIENTO</h2>
          </div>
          <BotMatchmaking 
            character={character} 
            onMatchUpdate={() => fetchData(user.id)} 
          />
        </div>
      )}

      {/* Vista: Minijuego Futsal */}
      {currentView === "futsal" && (
        <div className="minigame-fullscreen">
          <button className="exit-minigame" onClick={() => handleNavigate('game')}>
            ✕ Salir del Minijuego
          </button>
          <TrainingDashboard character={character} bots={bots} />
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para mostrar barras de habilidad
const SkillBar = ({ label, value }) => (
  <div className="skill-bar-preview">
    <div className="skill-info">
      <span className="skill-label">{label}</span>
      <span className="skill-value">{value}</span>
    </div>
    <div className="skill-progress">
      <div 
        className="skill-fill" 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);