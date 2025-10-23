// apps/client/src/components/CharacterCreation.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

    if (difference > availablePoints) {
      alert('No tienes suficientes puntos disponibles');
      return;
    }

    if (newValue < 50) {
      alert('No puedes bajar un skill por debajo de 50');
      return;
    }

    setCharacterData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillKey]: {
          ...prev.skills[skillKey],
          value: newValue
        }
      }
    }));

    setAvailablePoints(prev => prev - difference);
  };

  // ✅ Aseguramos que la función sea async correctamente
  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos
      const skillsData = {};
      Object.keys(characterData.skills).forEach(key => {
        skillsData[key] = characterData.skills[key].value;
      });

      // Crear personaje
      const { data: character, error } = await supabase
        .from('characters')
        .insert([
          {
            user_id: user.id,
            nickname: characterData.nickname,
            available_skill_points: 0,
            ...skillsData
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este nombre de personaje ya está en uso. Por favor elige otro.');
        }
        throw error;
      }

      // ✅ Crear wallet (mismo bloque async)
      const walletAddress = `${characterData.nickname.toLowerCase().replace(/\s+/g, '')}.lupi`;
      const { error: walletError } = await supabase
        .from('wallets')
        .insert([
          {
            character_id: character.id,
            address: walletAddress,
            lupicoins: 100.00
          }
        ]);

      if (walletError) throw walletError;

      console.log('✅ Personaje creado exitosamente:', character);
      alert(`¡Personaje creado exitosamente!\nWallet: ${walletAddress}`);
      onCharacterCreated(character);

    } catch (error) {
      console.error('❌ Error creando personaje:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }; // 👈 esta llave debe cerrar justo después del bloque try/catch

  return (
    <div className="character-creation">
      <div className="creation-card">
        <h2>Crear tu Personaje Deportivo</h2>
        <form onSubmit={handleCreateCharacter}>
          <div className="form-group">
            <label>Nombre del Personaje (Nickname)</label>
            <input
              type="text"
              value={characterData.nickname}
              onChange={(e) =>
                setCharacterData({ ...characterData, nickname: e.target.value })
              }
              placeholder="Ej: Messi10"
              required
            />
            <small>Este será tu nombre en el juego</small>
          </div>

          <div className="points-display">
            <h3>Puntos de Skill Disponibles: {availablePoints}</h3>
          </div>

          <div className="skills-grid">
            <h3>Distribuye tus 10 puntos adicionales:</h3>
            {Object.entries(characterData.skills).map(([key, skill]) => (
              <div key={key} className="skill-item">
                <label>{skill.name}</label>
                <div className="skill-controls">
                  <button
                    type="button"
                    onClick={() => updateSkill(key, skill.value - 1)}
                    disabled={skill.value <= 50}
                  >
                    -
                  </button>
                  <span className="skill-value">{skill.value}</span>
                  <button
                    type="button"
                    onClick={() => updateSkill(key, skill.value + 1)}
                    disabled={availablePoints <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || availablePoints > 0 || !characterData.nickname}
            className="create-button"
          >
            {loading ? 'Creando...' : 'Crear Personaje'}
          </button>

          {availablePoints > 0 && (
            <p className="warning">¡Aún tienes {availablePoints} punto(s) por asignar!</p>
          )}
        </form>
      </div>
    </div>
  );
};
