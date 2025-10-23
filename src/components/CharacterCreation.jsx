// src/components/CharacterCreation.jsx
import React, { useState } from 'react';
import '../styles/CharacterCreation.css';
import { supabase } from '../lib/supabaseClient';

const BASE_SKILLS = {
  pase: { name: '📨 Pase', value: 50, color: '#4CAF50' },
  potencia: { name: '⚽ Potencia', value: 50, color: '#FF5722' },
  velocidad: { name: '💨 Velocidad', value: 50, color: '#2196F3' },
  liderazgo: { name: '👑 Liderazgo', value: 50, color: '#FFC107' },
  tiro: { name: '🥅 Tiro', value: 50, color: '#E91E63' },
  regate: { name: '🎯 Regate', value: 50, color: '#9C27B0' },
  tecnica: { name: '🔧 Técnica', value: 50, color: '#607D8B' },
  estrategia: { name: '🧠 Estrategia', value: 50, color: '#795548' },
  inteligencia: { name: '📈 Inteligencia', value: 50, color: '#00BCD4' },
  defensa: { name: '🛡️ Defensa', value: 50, color: '#3F51B5' },
  resistencia_base: { name: '🏃 Resistencia', value: 50, color: '#009688' }
};

// Avatar por defecto (esto sería reemplazado por tu sistema de avatares)
const DefaultAvatar = ({ nickname }) => (
  <div className="character-avatar">
    <div className="avatar-circle">
      <div className="avatar-initials">
        {nickname ? nickname.substring(0, 2).toUpperCase() : '??'}
      </div>
    </div>
    <div className="avatar-equipment">
      <div className="equipment-item jersey"></div>
      <div className="equipment-item shorts"></div>
      <div className="equipment-item boots"></div>
    </div>
  </div>
);

export const CharacterCreation = ({ user, onCharacterCreated }) => {
  const [characterData, setCharacterData] = useState({
    nickname: '',
    skills: { ...BASE_SKILLS }
  });
  const [availablePoints, setAvailablePoints] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

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

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ PRIMERO: Asegurar que el perfil existe
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.slice(0,8)}`,
          email: user.email
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('❌ Error creando perfil:', profileError);
        throw new Error('Error al crear perfil de usuario');
      }

      console.log('✅ Perfil verificado/creado');

      // ✅ SEGUNDO: Preparar datos del personaje
      const skillsData = {};
      Object.keys(characterData.skills).forEach(key => {
        skillsData[key] = characterData.skills[key].value;
      });

      // ✅ TERCERO: Crear personaje
      const { data: character, error: characterError } = await supabase
        .from('characters')
        .insert([
          {
            user_id: user.id,
            nickname: characterData.nickname,
            available_skill_points: availablePoints, // Guardar puntos restantes
            ...skillsData
          }
        ])
        .select()
        .single();

      if (characterError) {
        if (characterError.code === '23505') {
          throw new Error('Este nombre de personaje ya está en uso. Por favor elige otro.');
        }
        if (characterError.code === '23503') {
          throw new Error('Error de permisos. Contacta al administrador.');
        }
        throw characterError;
      }

      console.log('✅ Personaje creado:', character);

      // ✅ CUARTO: Crear wallet
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

      if (walletError) {
        console.error('❌ Error creando wallet:', walletError);
        // No lanzar error aquí, el personaje ya fue creado
      }

      console.log('✅ Wallet creada:', walletAddress);
      
      alert(`¡Personaje creado exitosamente!\nWallet: ${walletAddress}\nRecibiste 100 LupiCoins de bienvenida!`);
      onCharacterCreated(character);

    } catch (error) {
      console.error('❌ Error completo creando personaje:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas del personaje para mostrar en el avatar
  const calculateStats = () => {
    const skills = characterData.skills;
    return {
      ataque: Math.round((skills.potencia.value + skills.tiro.value + skills.regate.value) / 3),
      defensa: Math.round((skills.defensa.value + skills.resistencia_base.value) / 2),
      tecnica: Math.round((skills.pase.value + skills.tecnica.value + skills.estrategia.value) / 3),
      mental: Math.round((skills.liderazgo.value + skills.inteligencia.value) / 2)
    };
  };

  const stats = calculateStats();

  return (
    <div className="character-creation">
      <div className="creation-card">
        <h2 className="creation-title">CREAR TU PERSONAJE DEPORTIVO</h2>
        
        <div className="creation-content">
          {/* Panel izquierdo - Formulario */}
          <div className="form-panel">
            <form onSubmit={handleCreateCharacter}>
              {/* Nombre del Personaje */}
              <div className="form-group">
                <label>Nombre del Personaje (Nickname)</label>
                <input
                  type="text"
                  value={characterData.nickname}
                  onChange={(e) => setCharacterData({
                    ...characterData, 
                    nickname: e.target.value
                  })}
                  placeholder="Ej: Messi10"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <small>Este será tu nombre en el juego (3-20 caracteres)</small>
              </div>

              {/* Puntos Disponibles */}
              <div className="points-display">
                <div className="points-counter">
                  <span className="points-label">Puntos de Skill Disponibles:</span>
                  <span className="points-value">{availablePoints}</span>
                </div>
                <small>Base: 50 puntos en cada skill + {availablePoints} puntos extra para distribuir</small>
              </div>

              {/* Skills */}
              <div className="skills-container">
                <h3>Distribuye tus {availablePoints} puntos adicionales:</h3>
                <div className="skills-grid">
                  {Object.entries(characterData.skills).map(([key, skill]) => (
                    <div 
                      key={key} 
                      className={`skill-item ${selectedSkill === key ? 'selected' : ''}`}
                      onClick={() => setSelectedSkill(key)}
                    >
                      <div className="skill-header">
                        <span className="skill-icon">{skill.name.split(' ')[0]}</span>
                        <span className="skill-name">{skill.name.split(' ').slice(1).join(' ')}</span>
                      </div>
                      <div className="skill-bar-container">
                        <div 
                          className="skill-bar" 
                          style={{
                            width: `${(skill.value / 100) * 100}%`,
                            backgroundColor: skill.color
                          }}
                        ></div>
                      </div>
                      <div className="skill-controls">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSkill(key, skill.value - 1);
                          }}
                          disabled={skill.value <= 50 || availablePoints >= 10}
                          className="skill-btn minus"
                        >
                          -
                        </button>
                        <span className="skill-value">{skill.value}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSkill(key, skill.value + 1);
                          }}
                          disabled={availablePoints <= 0}
                          className="skill-btn plus"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || availablePoints > 0 || !characterData.nickname || characterData.nickname.length < 3}
                className="create-button"
              >
                {loading ? 'Creando...' : 'Crear Personaje'}
              </button>

              {availablePoints > 0 && (
                <p className="warning">¡Aún tienes {availablePoints} punto(s) por asignar!</p>
              )}
            </form>
          </div>

          {/* Panel central - Avatar */}
          <div className="avatar-panel">
            <DefaultAvatar nickname={characterData.nickname} />
            
            <div className="character-stats">
              <h3>Estadísticas del Personaje</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Ataque</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill attack" 
                      style={{width: `${stats.ataque}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.ataque}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Defensa</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill defense" 
                      style={{width: `${stats.defensa}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.defensa}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Técnica</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill technique" 
                      style={{width: `${stats.tecnica}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.tecnica}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Mental</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill mental" 
                      style={{width: `${stats.mental}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.mental}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
