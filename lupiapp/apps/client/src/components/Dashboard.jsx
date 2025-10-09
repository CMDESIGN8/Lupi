import React, { useEffect, useState } from "react";
import { getCharacter, getWallet } from "../services/api";
import '../styles/Dashboard.css' ;

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

  if (loading) return <p>⏳ Cargando tu panel...</p>;

  if (!character) {
    return (
      <div>
        <h2>⚠️ No tenés personaje creado</h2>
        <p>Creá tu personaje para empezar a jugar en LupiApp</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>🐺 Bienvenido a LupiApp, {character.nickname}!</h2>

      <section className="character-info">
        <h3>📊 Tu Personaje</h3>
        <p>Nivel: {character.level}</p>
        <p>Experiencia: {character.experience}/{character.experience_to_next_level}</p>
      </section>

      {wallet && (
        <section className="wallet-info">
          <h3>💰 Tu Wallet</h3>
          <p>Dirección: {wallet.address}</p>
          <p>Lupicoins: {wallet.lupicoins}</p>
        </section>
      )}

      <section className="stats">
        <h3>⚔️ Stats</h3>
        <ul>
          <li>📨 Pase: {character.pase}</li>
          <li>⚽ Potencia: {character.potencia}</li>
          <li>💨 Velocidad: {character.velocidad}</li>
          <li>👑 Liderazgo: {character.liderazgo}</li>
          <li>🥅 Tiro: {character.tiro}</li>
          <li>🎯 Regate: {character.regate}</li>
          <li>🔧 Técnica: {character.tecnica}</li>
          <li>🧠 Estrategia: {character.estrategia}</li>
          <li>📈 Inteligencia: {character.inteligencia}</li>
          <li>🛡️ Defensa: {character.defensa}</li>
          <li>🏃 Resistencia: {character.resistencia_base}</li>
        </ul>
      </section>

      <button onClick={() => fetchData(user.id)}>🔄 Refrescar datos</button>
    </div>
  );
};
