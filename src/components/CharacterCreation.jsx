// src/components/CharacterCreation.jsx
import React, { useState } from 'react';
import '../styles/CharacterCreation.css';
import { supabase } from '../lib/supabaseClient';
import avatarPlaceholder from '../assets/avatar-placeholder.png'; // Imagen ejemplo

const BASE_SKILLS = {
  pase: { name: '📨 Pase', value: 50 },
  potencia: { name: '⚽ Potencia', value: 50 },
  velocidad: { name: '💨 Velocidad', value: 50 },
  liderazgo: { name: '👑 Liderazgo', value: 50 },
  tiro: { name: '🥅 Tiro', value: 50 },
  regate: { name: '🎯 Regate', value: 50 },
  tecnica: { name: '🔧 Técnica', value: 50 },
  estrategia: { name: '🧠 Estrategia', value: 50 },
  inteligencia: { name: '📈 Inteligencia', value: 50 },
  defensa: { name: '🛡️ Defensa', value: 50 },
  resistencia_base: { name: '🏃 Resistencia', value: 50 }
};

export const CharacterCreation = ({ user, onCharacterCreated }) => {
  const [characterData, setCharacterData] = useState({
    nickname: '',
    skills: { ...BASE_SKILLS }
  });
  const [availablePoints, setAvailablePoints] = useState(10);
  const [loading, setLoading] = useState(false);

  const updateSkill = (skillKey, newValue) => {
    const currentValue = characterData.skills[skillKey].value;
    const difference = newValue - currentValue;
    if (difference > availablePoints || newValue < 50) return;

    setCharacterData(prev => ({
      ...prev,
      skills: { ...prev.skills, [skillKey]: { ...prev.skills[skillKey], value: newValue } }
    }));
    setAvailablePoints(prev => prev - difference);
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        username: user.email?.split('@')[0] || `user_${user.id.slice(0,8)}`,
        email: user.email
      }, { onConflict: 'id' });

      const skillsData = Object.fromEntries(
        Object.entries(characterData.skills).map(([k,v]) => [k, v.value])
      );

      const { data: character } = await supabase.from('characters').insert([{
        user_id: user.id,
        nickname: characterData.nickname,
        available_skill_points: availablePoints,
        ...skillsData
      }]).select().single();

      const walletAddress = `${characterData.nickname.toLowerCase().replace(/\s+/g, '')}.lupi`;
      await supabase.from('wallets').insert([{ character_id: character.id, address: walletAddress, lupicoins: 100 }]);

      alert(`¡Personaje creado! Wallet: ${walletAddress}`);
      onCharacterCreated(character);
    } catch (error) {
      alert(error.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="character-creation">
      <div className="creation-card">
        <h2>🎮 Crear tu Personaje Deportivo</h2>

        <div className="avatar-section">
          <img src={avatarPlaceholder} alt="Avatar" className="avatar-img" />
        </div>

        <form onSubmit={handleCreateCharacter}>
          <div className="form-group">
            <label>Nombre del Personaje</label>
            <input
              type="text"
              value={characterData.nickname}
              onChange={(e) => setCharacterData({...characterData, nickname: e.target.value})}
              placeholder="Ej: Messi10"
              required minLength={3} maxLength={20}
            />
          </div>

          <div className="points-display">
            <h3>Puntos Disponibles: {availablePoints}</h3>
          </div>

          <div className="skills-grid">
            {Object.entries(characterData.skills).map(([key, skill]) => (
              <div key={key} className="skill-item">
                <label>{skill.name}</label>
                <div className="skill-controls">
                  <button type="button" onClick={() => updateSkill(key, skill.value - 1)}>-</button>
                  <span className="skill-value">{skill.value}</span>
                  <button type="button" onClick={() => updateSkill(key, skill.value + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading || availablePoints > 0 || !characterData.nickname || characterData.nickname.length < 3}
            className="create-button"
          >
            {loading ? 'Creando...' : 'Crear Personaje'}
          </button>
        </form>
      </div>
    </div>
  );
};
