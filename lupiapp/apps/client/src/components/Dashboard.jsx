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

  if (loading) return <p>⏳ Cargando...</p>;
  if (!character) return <p>⚠️ No tienes personaje aún.</p>;

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
      <h2>🐺 Bienvenido a LupiApp, {character.nickname}!</h2>

      <section className="character-info">
        <h3>📊 Personaje</h3>
        <p>Nivel: {character.level}</p>

        <div className="exp-bar">
          <div
            className="exp-fill glow-progress"
            style={{ width: `${expPorcentaje}%` }}
          />
        </div>
        <p>
          EXP: <span>{expActual}</span> / {expMax} | Próximo Nivel:{" "}
          <span>{expMax - expActual}</span>
        </p>

        <p>
          🎯 Skill Points disponibles: <span>{character.available_skill_points || 0}</span>
        </p>
      </section>

      {wallet && (
        <section className="wallet-info">
          <h3>💰 Wallet</h3>
          <p>Dirección: {wallet.address}</p>
          <p>Lupicoins: {wallet.lupicoins}</p>
        </section>
      )}

      <section className="stats">
        <h3>⚔️ Stats</h3>
        <ul>
          {stats.map(({ key, label }) => (
            <li key={key} className="stat-item">
              <span className="stat-name">{label}</span>
              <div className="stat-bar">
                <div
                  className="fill glow-progress"
                  style={{ width: `${character[key]}%` }}
                ></div>
              </div>
              <span className="stat-value">{character[key]}</span>
              {character.available_skill_points > 0 && character[key] < 100 && (
                <button
                  className="add-skill-btn"
                  onClick={() => increaseStat(key)}
                  disabled={addingSkill}
                >
                  ➕
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="actions">
        <button onClick={handleTrain}>💪 Entrenar (+100 XP, +150 LC)</button>
        <button onClick={() => fetchData(user.id)}>🔄 Refrescar</button>
      </div>

      {showLevelUp && (
        <div className="levelup-popup">
          <h2>🎉 ¡Subiste a nivel {character.level}!</h2>
          <p>+5 Skill Points</p>
        </div>
      )}
    </div>
  );
};
