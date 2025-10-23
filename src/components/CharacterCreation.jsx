// apps/client/src/components/CharacterCreation.jsx
import React, { useState } from 'react';

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

      // Preparar datos para la API
      const skillsData = {};
      Object.keys(characterData.skills).forEach(key => {
        skillsData[key] = characterData.skills[key].value;
      });

      const characterPayload = {
        user_id: user.id,
        name: characterData.nickname,
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Error desconocido al crear personaje');
      }

      console.log('✅ Personaje creado exitosamente:', result);
      
      // Mostrar mensaje de éxito
      const walletInfo = result.wallet ? 
        `\nWallet: ${result.wallet.address}\nLupicoins: ${result.wallet.lupicoins}` : 
        '\nWallet creada con 100 lupicoins';
      
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
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        alert('❌ Error de conexión. Verifica que el servidor esté funcionando en Render.');
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
              <button type="button" onClick={resetSkills} className="reset-button">
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

          {availablePoints === 0 && characterData.nickname.trim() && (
            <p className="success">✅ ¡Todo listo! Puedes crear tu personaje.</p>
          )}
        </form>
      </div>

      <style jsx>{`
        .character-creation {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .creation-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 2px solid #e5e7eb;
        }
        
        h2 {
          text-align: center;
          color: #1f2937;
          margin-bottom: 30px;
          font-size: 24px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }
        
        input {
          width: 100%;
          padding: 12px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        small {
          display: block;
          margin-top: 5px;
          color: #6b7280;
          font-size: 12px;
        }
        
        .points-display {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #3b82f6;
        }
        
        .points-count {
          color: #10b981;
          font-weight: bold;
        }
        
        .total-stats {
          color: #6b7280;
          font-size: 14px;
          margin: 5px 0 0 0;
        }
        
        .warning {
          color: #ef4444;
          font-weight: 500;
          margin: 10px 0 0 0;
        }
        
        .success {
          color: #10b981;
          font-weight: 500;
          text-align: center;
          margin-top: 15px;
        }
        
        .skills-section {
          margin-bottom: 30px;
        }
        
        .skills-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .reset-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .reset-button:hover {
          background: #4b5563;
        }
        
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .skill-item {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .skill-item label {
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .skill-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .skill-btn {
          background: #3b82f6;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .skill-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
        
        .skill-btn:not(:disabled):hover {
          background: #2563eb;
        }
        
        .skill-value {
          font-weight: bold;
          font-size: 16px;
          min-width: 30px;
          text-align: center;
        }
        
        .skill-bar {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .skill-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          transition: width 0.3s;
        }
        
        .create-button {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .create-button:hover:not(:disabled) {
          background: #059669;
        }
        
        .create-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .create-button.loading {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};
