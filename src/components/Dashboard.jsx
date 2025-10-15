import React, { useEffect, useState } from "react";
import { updateStat, trainCharacter } from "../services/api";
import { motion } from "framer-motion";
import "../styles/dashboard.css";

export const Dashboard = ({ user }) => {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(false);

  // Cargar personaje al iniciar
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/characters/by-user/${user.id}`);
        const data = await res.json();
        setCharacter(data);
      } catch (err) {
        console.error("Error al cargar personaje:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCharacter();
  }, [user]);

  const handleTrain = async () => {
    try {
      const updated = await trainCharacter(character.id);
      if (updated.level > character.level) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 2000);
      }
      setCharacter(updated);
    } catch (err) {
      console.error("Error al entrenar:", err);
    }
  };

  const increaseStat = async (skillKey) => {
    try {
      const updated = await updateStat(character.id, skillKey);
      setCharacter(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!character) return <p>No hay personaje creado.</p>;

  return (
    <div className="dashboard">
      {levelUp && (
        <motion.div
          className="level-up-popup"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          🎉 ¡Nivel {character.level} alcanzado!
        </motion.div>
      )}

      <div className="character-card">
        <h2>{character.username}</h2>
        <p>Nivel {character.level}</p>
        <p>XP: {character.experience} / {character.level * 100}</p>

        <div className="xp-bar">
          <div
            className="xp-fill"
            style={{
              width: `${(character.experience / (character.level * 100)) * 100}%`
            }}
          ></div>
        </div>

        <motion.button
          className="train-btn"
          whileTap={{ scale: 0.9 }}
          onClick={handleTrain}
        >
          🏋️ Entrenar
        </motion.button>

        <p>Skill Points: {character.available_skill_points}</p>

        <div className="skills">
          {["strength", "agility", "intelligence"].map((key) => (
            <div key={key} className="skill-row">
              <span>{key.toUpperCase()}</span>
              <div className="skill-bar">
                <div
                  className={`skill-fill ${character[key] >= 100 ? "max" : ""}`}
                  style={{
                    width: `${character[key]}%`
                  }}
                ></div>
              </div>
              <button
                onClick={() => increaseStat(key)}
                disabled={character.available_skill_points <= 0 || character[key] >= 100}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
