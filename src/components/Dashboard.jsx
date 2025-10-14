import React, { useState, useEffect } from "react";
import { getCharacter, getWallet } from "../services/api";
import "./Dashboard.css";

export const Dashboard = ({ user }) => {
  const [character, setCharacter] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (userId) => {
    try {
      setLoading(true);
      const charData = await getCharacter(userId);

      if (charData?.id) {
        // Si ya había personaje cargado y detectamos que subió de nivel
        if (character && charData.level > character.level) {
          triggerLevelUp(charData);
        }

        setCharacter(charData);
        const walletData = await getWallet(charData.id);
        setWallet(walletData);
      } else {
        setCharacter(null);
      }
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerLevelUp = (charData) => {
    // Sumar 5 skill points
    const newChar = {
      ...charData,
      available_skill_points: (charData.available_skill_points || 0) + 5,
    };

    setCharacter(newChar);
    setShowLevelUp(true);

    // Ocultar popup a los 3 seg
    setTimeout(() => setShowLevelUp(false), 3000);
  };

  if (loading) return <p>⏳ Cargando tu dashboard...</p>;
  if (!character) return <p>⚠️ No tienes personaje creado aún.</p>;

  // Calcular EXP
  const expActual = character.experience;
  const expMax = character.experience_to_next_level;
  const expFaltante = expMax - expActual;
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

        {/* Barra de EXP */}
        <div className="exp-bar">
          <div
            className="exp-fill"
            style={{ width: `${expPorcentaje}%` }}
          ></div>
        </div>
        <p>
          EXP actual: <span>{expActual}</span> / {expMax}
          &nbsp;| Falta: <span>{expFaltante}</span>
        </p>

        <p>
          🎯 Skill Points disponibles:{" "}
          <span>{character.available_skill_points || 0}</span>
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
            <li key={key}>
              <span className="stat-name">{label}</span>
              <div className="stat-bar">
                <div
                  className="fill"
                  style={{ width: `${character[key]}%` }}
                ></div>
              </div>
              <span className="stat-value">{character[key]}</span>
            </li>
          ))}
        </ul>
      </section>

      <button onClick={() => fetchData(user.id)}>🔄 Refrescar</button>

      {/* Popup Level Up */}
      {showLevelUp && (
        <div className="levelup-popup">
          <h2>🎉 ¡Subiste a nivel {character.level}!</h2>
          <p>+5 Skill Points</p>
        </div>
      )}
    </div>
  );
};
