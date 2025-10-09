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
  {/* FICHA TÉCNICA */}
  <div className="panel">
    <h3>FICHA TÉCNICA</h3>
    <div className="avatar" style={{ backgroundImage: `url(${character.avatar})` }} />
    <p>Jugador: <span>{character.nickname}</span></p>
    <p>LVL: <span>{character.level}</span></p>
    <p>Posición: <span>{character.position}</span></p>
    <p>Deporte: <span>{character.sport}</span></p>
    <p>Club: <span>{character.club}</span></p>
    <p>Wallet: <span>{wallet?.address}</span></p>
    <div className="exp-bar">
      <div className="exp-fill" style={{ width: `${(character.experience / character.experience_to_next_level) * 100}%` }} />
    </div>
    <p>EXP: {character.experience}/{character.experience_to_next_level}</p>
  </div>

  {/* ESTADÍSTICAS */}
  <div className="panel">
    <h3>ESTADÍSTICAS</h3>
    <p>Puntos disponibles: {character.available_skill_points}</p>
    <ul className="stats-grid">
      {stats.map(({ key, label }) => (
        <li className="skill-card" key={key}>
          <div>{label}: {character[key]}</div>
          {character.available_skill_points > 0 && <button className="skill-btn" onClick={() => increaseStat(key)}>↑</button>}
        </li>
      ))}
    </ul>
  </div>

  {/* ACCIÓN RÁPIDA */}
  <div className="panel">
    <h3>ACCIÓN RÁPIDA</h3>
    <div className="actions">
      <button>🌎 Mundo Lupi</button>
      <button>💪 Entrenar</button>
      <button>🏆 MMORPG Deportivo</button>
      <button>🔍 Buscar Objeto</button>
      <button>⚽ Misiones</button>
      <button>🏠 Sala Común</button>
      <button>➡️ Transferir</button>
    </div>
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
