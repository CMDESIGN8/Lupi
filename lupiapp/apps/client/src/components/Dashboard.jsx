import React, { useState, useEffect } from "react";
import { getCharacter, getWallet, updateStat, trainCharacter } from "../services/api";
import GuideTour from "./GuideTour";
import "../styles/Dashboard.css";

export const Dashboard = ({ user }) => {
  const [character, setCharacter] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async (userId) => {
      if (!userId) return;
      
      setLoading(true);
      try {
        console.log(`🔄 Fetching data for user: ${userId}`);
        
        const charData = await getCharacter(userId);
        if (charData?.id && isMounted) {
          setCharacter(charData);
          const walletData = await getWallet(charData.id);
          if (isMounted) {
            setWallet(walletData);
          }
        }
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user?.id) {
      fetchData(user.id);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const increaseStat = async (statKey) => {
    if (!character || character.available_skill_points <= 0) return;

    try {
      const updated = await updateStat(character.id, statKey);
      setCharacter(updated);
    } catch (err) {
      console.error("Error al agregar skill:", err);
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

  const handleRefresh = () => {
    if (user?.id) {
      setLoading(true);
      getCharacter(user.id)
        .then(charData => {
          if (charData?.id) {
            setCharacter(charData);
            return getWallet(charData.id);
          }
        })
        .then(walletData => {
          if (walletData) {
            setWallet(walletData);
          }
        })
        .catch(error => {
          console.error("❌ Error refrescando datos:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  if (loading) return <div className="dashboard-loading">⏳ Cargando...</div>;
  if (!character) return <div className="dashboard-error">⚠️ No tienes personaje aún.</div>;

  const expActual = character.experience;
  const expMax = character.experience_to_next_level;
  const expPorcentaje = Math.min((expActual / expMax) * 100, 100);

  const stats = [
    { key: "pase", label: "📨 Pase" },
    { key: "potencia", label: "⚽ Potencia" },
    { key: "velocidad", label: "💨 Velocidad" },
    { key: "liderazgo", label: "👑 Liderazgo" },
    { key: "tiro", label: "🥅 Tiro" },
    { key: "regate", label: "🎯 Regate" },
    { key: "tecnica", label: "🔧 Técnica" },
    { key: "estrategia", label: "🧠 Estrategia" },
    { key: "inteligencia", label: "📈 Inteligencia" },
    { key: "defensa", label: "🛡️ Defensa" },
    { key: "resistencia_base", label: "🏃 Resistencia" },
  ];

  return (
    <div className="dashboard">
      {/* IZQUIERDA - Personaje */}
      <div className="panel panel-left">
        <h3>📊 Personaje</h3>
        <div className="avatar"></div>
        <div className="character-details">
          <p>Nombre: <span>{character.nickname}</span></p>
          <p>Nivel: <span>{character.level}</span></p>
          <div className="exp-bar">
            <div className="exp-fill" style={{ width: `${expPorcentaje}%` }} />
          </div>
          <p>EXP: <span>{expActual}</span> / {expMax}</p>
          {wallet && <p>Lupicoins: <span>{wallet.lupicoins}</span></p>}
          <p>Skill Points: <span>{character.available_skill_points}</span></p>
        </div>
      </div>

      {/* CENTRO - Skills */}
      <div className="panel panel-center">
        <h3>⚔️ Skills</h3>
        <div className="skills-grid">
          {stats.map(({ key, label }) => (
            <div key={key} className="skill-card">
              <div className="skill-info">
                <span className="skill-name">{label}</span>
                <span className="skill-value">{character[key]}/100</span>
              </div>
              {character.available_skill_points > 0 && character[key] < 100 && (
                <button 
                  className="skill-btn" 
                  onClick={() => increaseStat(key)}
                  title="Aumentar skill"
                >
                  ➕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DERECHA - Acciones */}
      <div className="panel panel-right">
        <h3>🛠️ Acciones</h3>
        <div className="actions">
          <button onClick={handleTrain}>💪 Entrenar</button>
          <button onClick={handleRefresh}>🔄 Refrescar</button>
          <button>🛒 Mercado</button>
          <button>🎒 Inventario</button>
          <button>⚽ Clubes</button>
        </div>
      </div>

      {/* Componente de Guía */}
      <GuideTour />

      {showLevelUp && (
        <div className="levelup-popup">
          <h2>🎉 ¡Subiste a nivel {character.level}!</h2>
          <p>+5 Skill Points</p>
        </div>
      )}
    </div>
  );
};
