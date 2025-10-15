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

  const stats = [
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
      {/* Header del Juego */}
      <div className="game-header">
        <h1>⚽ LUPIAPP - MODE FOOTBALL</h1>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-label">NIVEL</span>
            <span className="stat-value">{character.level}</span>
          </div>
          <div className="header-stat">
            <span className="stat-label">SKILL POINTS</span>
            <span className="stat-value">{character.available_skill_points || 0}</span>
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
              </div>
              <div className="player-info">
                <h2 className="player-name">{character.nickname}</h2>
                <div className="player-level">NIVEL {character.level}</div>
                <div className="player-class">Delantero Estrella</div>
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

            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-label">Partidos</span>
                <span className="quick-value">47</span>
              </div>
              <div className="quick-stat">
                <span className="quick-label">Victorias</span>
                <span className="quick-value">32</span>
              </div>
              <div className="quick-stat">
                <span className="quick-label">Goles</span>
                <span className="quick-value">28</span>
              </div>
              <div className="quick-stat">
                <span className="quick-label">Asistencias</span>
                <span className="quick-value">15</span>
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
                <span className="address-value">{wallet?.address || 'No disponible'}</span>
              </div>
            </div>
            <div className="wallet-actions">
              <button className="wallet-btn">TRANSFERIR</button>
              <button className="wallet-btn">HISTORIAL</button>
            </div>
          </section>

          {/* Skills Section */}
          <section className="skills-section">
            <div className="skills-header">
              <h3>🎯 HABILIDADES</h3>
              <div className="skills-points">
                <span className="points-available">{character.available_skill_points || 0}</span>
                <span className="points-label">Puntos Disponibles</span>
              </div>
            </div>

            <div className="skills-grid">
              {stats.map(({ key, label, icon }) => (
                <div key={key} className="skill-card">
                  <div className="skill-header">
                    <div className="skill-icon">{icon}</div>
                    <div className="skill-info">
                      <span className="skill-name">{label}</span>
                      <span className="skill-level">Nv. {Math.floor(character[key] / 10)}</span>
                    </div>
                  </div>
                  
                  <div className="skill-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${character[key]}%` }}
                      ></div>
                    </div>
                    <span className="skill-value">{character[key]}</span>
                  </div>

                  {character.available_skill_points > 0 && character[key] < 100 && (
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
