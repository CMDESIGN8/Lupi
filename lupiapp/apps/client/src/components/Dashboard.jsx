import React, { useEffect, useState } from "react";
import { getCharacter, getWallet } from "../services/api";
import "../styles/Dashboard.css"; // importamos los estilos

export const Dashboard = ({ user }) => {
  const [character, setCharacter] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>⏳ Cargando tu dashboard...</p>;
  if (!character) return <p>⚠️ No tienes personaje creado aún.</p>;

  // Campos que vamos a renderizar como stats RPG
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
        <p>
          Experiencia: {character.experience}/{character.experience_to_next_level}
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
    </div>
  );
};
