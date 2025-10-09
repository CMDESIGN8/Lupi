import React, { useState, useEffect } from "react";
import { trainCharacter, addSkillPoint } from "../lib/api"; // funciones de API
import "./Dashboard.css";

const skillKeys = [
  "pase", "potencia", "velocidad", "liderazgo",
  "tiro", "regate", "tecnica", "estrategia",
  "inteligencia", "defensa", "resistencia_base"
];

export const Dashboard = ({ character, setCharacter }) => {
  const [loadingSkill, setLoadingSkill] = useState(false);

  const handleAddSkill = async (skillKey) => {
    if (loadingSkill) return;
    if (character.available_skill_points <= 0) return;

    setLoadingSkill(true);
    try {
      const updatedChar = await addSkillPoint(character.id, skillKey);
      setCharacter(updatedChar);
    } catch (err) {
      console.error("Error al agregar skill:", err);
      alert(err.message || "Error al agregar skill");
    } finally {
      setLoadingSkill(false);
    }
  };

  const handleTrain = async () => {
    try {
      const { character: updatedChar } = await trainCharacter(character.id);
      setCharacter(updatedChar);
    } catch (err) {
      console.error("Error entrenando:", err);
    }
  };

  return (
    <div className="dashboard">
      <h2>{character.nickname} - Nivel {character.level}</h2>

      <div className="xp-bar">
        <div
          className="xp-progress"
          style={{
            width: `${(character.experience / character.experience_to_next_level) * 100}%`
          }}
        />
        <span>{character.experience} / {character.experience_to_next_level} XP</span>
      </div>

      <button className="train-btn" onClick={handleTrain}>
        Entrenar (+100 XP, +150 Lupicoins)
      </button>

      <div className="skills-grid">
        {skillKeys.map((key) => (
          <div key={key} className="skill-card">
            <span className="skill-name">{key}</span>
            <div className="skill-bar-container">
              <div
                className="skill-bar"
                style={{ width: `${(character[key] / 100) * 100}%` }}
              />
              <span className="skill-value">{character[key]} / 100</span>
            </div>
            <button
              className="skill-btn"
              onClick={() => handleAddSkill(key)}
              disabled={character.available_skill_points <= 0}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <p>Skill Points disponibles: {character.available_skill_points}</p>
    </div>
  );
};
