// apps/client/src/components/CharacterCreation.jsx
import React, { useState } from 'react';
import '../styles/CharacterCreation.css';

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

    if (newValue > 100) {
      alert('No puedes subir un skill por encima de 100');
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

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (availablePoints > 0) {
      alert(`¡Aún tienes ${availablePoints} punto(s) por asignar!`);
      return;
    }

    if (!characterData.nickname.trim()) {
      alert('Por favor ingresa un nombre para tu personaje');
      return;
    }

    if (characterData.nickname.length < 3) {
      alert('El nombre debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);

    try {
      console.log('🎮 Iniciando creación de personaje para usuario:', user.id);

      // Preparar datos para la API - CORREGIDO: usar nickname en lugar de name
      const skillsData = {};
      Object.keys(characterData.skills).forEach(key => {
        skillsData[key] = characterData.skills[key].value;
      });

      const characterPayload = {
        user_id: user.id,
        nickname: characterData.nickname, // ← CORREGIDO: cambiar 'name' por 'nickname'
        position: 'delantero',
        ...skillsData
      };

      console.log('📤 Enviando datos a la API:', characterPayload);

      // URL del backend en Render
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://lupiback.onrender.com';
      
      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterPayload)
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('❌ Respuesta no JSON:', text.substring(0, 200));
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!response.ok) {
        // Mostrar el error específico de Supabase si está disponible
        const errorMessage = result.error?.message || result.error || result.details || 'Error desconocido al crear personaje';
        throw new Error(errorMessage);
      }

      console.log('✅ Personaje creado exitosamente:', result);
      
      // Mostrar mensaje de éxito
      const walletInfo = result.wallet ? 
        `\n💰 Wallet: ${result.wallet.address}\n🪙 Lupicoins: ${result.wallet.lupicoins}` : 
        '\n💰 Wallet creada con 100 lupicoins';
      
      alert(`¡Personaje "${result.character.nickname}" creado exitosamente!${walletInfo}`);
      
      // Llamar callback si existe
      if (onCharacterCreated) {
        onCharacterCreated(result.character);
      }

    } catch (error) {
      console.error('❌ Error creando personaje:', error);
      
      // Mensajes de error más específicos
      if (error.message.includes('23505') || error.message.includes('duplicate')) {
        alert('❌ Este nombre de personaje ya está en uso. Por favor elige otro.');
      } else if (error.message.includes('profiles') || error.message.includes('foreign key')) {
        alert('❌ Error de perfil de usuario. Por favor contacta al soporte.');
      } else if (error.message.includes('nickname') || error.message.includes('not-null constraint')) {
        alert('❌ Error: El campo nickname es requerido. Por favor verifica los datos.');
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        alert('❌ Error de conexión. Verifica que el servidor esté funcionando.');
      } else {
        alert(`❌ Error al crear personaje: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetSkills = () => {
    setCharacterData({
      nickname: characterData.nickname,
      skills: { ...BASE_SKILLS }
    });
    setAvailablePoints(10);
  };

  // Calcular total de stats para mostrar
  const totalStats = Object.values(characterData.skills).reduce(
    (sum, skill) => sum + skill.value, 0
  );

  return (
    <div className="character-creation">
      <div className="creation-card">
        <h2>⚽ Crear tu Personaje Deportivo</h2>
        
        <form onSubmit={handleCreateCharacter}>
          <div className="form-group">
            <label><strong>Nombre del Personaje (Nickname)</strong></label>
            <input
              type="text"
              value={characterData.nickname}
              onChange={(e) =>
                setCharacterData({ ...characterData, nickname: e.target.value })
              }
              placeholder="Ej: Messi10, CR7_Goat, FuturoCrack..."
              required
              minLength={3}
              maxLength={20}
              disabled={loading}
            />
            <small>Este será tu nombre en el juego (3-20 caracteres)</small>
          </div>

          <div className="points-display">
            <h3>🎯 Puntos de Skill Disponibles: <span className="points-count">{availablePoints}</span></h3>
            <p className="total-stats">Total de Stats: {totalStats} / {550 + 10} (base + puntos extra)</p>
            
            {availablePoints > 0 && (
              <p className="warning">⚠️ ¡Aún tienes {availablePoints} punto(s) por asignar!</p>
            )}
          </div>

          <div className="skills-section">
            <div className="skills-header">
              <h3>📊 Distribuye tus 10 puntos adicionales:</h3>
              <button 
                type="button" 
                onClick={resetSkills} 
                className="reset-button"
                disabled={loading}
              >
                🔄 Reiniciar
              </button>
            </div>
            
            <div className="skills-grid">
              {Object.entries(characterData.skills).map(([key, skill]) => (
                <div key={key} className="skill-item">
                  <label>{skill.name}</label>
                  <div className="skill-controls">
                    <button
                      type="button"
                      onClick={() => updateSkill(key, skill.value - 1)}
                      disabled={skill.value <= 50 || loading}
                      className="skill-btn"
                    >
                      -
                    </button>
                    <span className="skill-value">{skill.value}</span>
                    <button
                      type="button"
                      onClick={() => updateSkill(key, skill.value + 1)}
                      disabled={availablePoints <= 0 || loading}
                      className="skill-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill"
                      style={{ width: `${skill.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || availablePoints > 0 || !characterData.nickname.trim()}
            className={`create-button ${loading ? 'loading' : ''}`}
          >
            {loading ? '⏳ Creando...' : '🚀 Crear Personaje'}
          </button>

          {availablePoints === 0 && characterData.nickname.trim() && !loading && (
            <p className="success">✅ ¡Todo listo! Puedes crear tu personaje.</p>
          )}
        </form>
      </div>
    </div>
  );
};
