// src/components/CharacterCreation.jsx
import React, { useState } from 'react';
import '../styles/CharacterCreation.css';
import { supabase } from '../lib/supabaseClient';

const BASE_SKILLS = {
  pase: { name: 'Pase', value: 50, icon: '↗️' },
  potencia: { name: 'Potencia', value: 50, icon: '💥' },
  velocidad: { name: 'Velocidad', value: 50, icon: '⚡' },
  liderazgo: { name: 'Liderazgo', value: 50, icon: '👑' },
  tiro: { name: 'Tiro', value: 50, icon: '🎯' },
  regate: { name: 'Regate', value: 50, icon: '🌀' },
  tecnica: { name: 'Técnica', value: 50, icon: '🔧' },
  estrategia: { name: 'Estrategia', value: 50, icon: '🧠' },
  inteligencia: { name: 'Inteligencia', value: 50, icon: '📊' },
  defensa: { name: 'Defensa', value: 50, icon: '🛡️' },
  resistencia: { name: 'Resistencia', value: 50, icon: '🏃' }
};

const CharacterAvatar = ({ nickname, className = '' }) => (
  <div className={`character-avatar ${className}`}>
    <div className="avatar-display">
      <div className="avatar-image">
        <div className="avatar-base">
          <div className="avatar-head"></div>
          <div className="avatar-body"></div>
        </div>
        <div className="avatar-glow"></div>
      </div>
      <div className="avatar-info">
        <h3 className="avatar-name">{nickname || 'Nuevo Jugador'}</h3>
        <div className="avatar-class">Deportista Profesional</div>
        <div className="avatar-level">Nivel 1</div>
      </div>
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
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.slice(0,8)}`,
          email: user.email
        }, { onConflict: 'id' });

      if (profileError) throw new Error('Error al crear perfil de usuario');

      const skillsData = {};
      Object.keys(characterData.skills).forEach(key => {
        skillsData[key] = characterData.skills[key].value;
      });

      const { data: character, error: characterError } = await supabase
        .from('characters')
        .insert([{
          user_id: user.id,
          nickname: characterData.nickname,
          available_skill_points: availablePoints,
          ...skillsData
        }])
        .select()
        .single();

      if (characterError) {
        if (characterError.code === '23505') {
          throw new Error('Este nombre de personaje ya está en uso. Por favor elige otro.');
        }
        throw characterError;
      }

      const walletAddress = `${characterData.nickname.toLowerCase().replace(/\s+/g, '')}.lupi`;
      await supabase
        .from('wallets')
        .insert([{
          character_id: character.id,
          address: walletAddress,
          lupicoins: 100.00
        }]);

      alert(`¡Personaje creado exitosamente!\nWallet: ${walletAddress}\nRecibiste 100 LupiCoins de bienvenida!`);
      onCharacterCreated(character);

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const skills = characterData.skills;
    return {
      ataque: Math.round((skills.potencia.value + skills.tiro.value + skills.regate.value) / 3),
      defensa: Math.round((skills.defensa.value + skills.resistencia.value) / 2),
      tecnica: Math.round((skills.pase.value + skills.tecnica.value + skills.estrategia.value) / 3),
      mental: Math.round((skills.liderazgo.value + skills.inteligencia.value) / 2)
    };
  };

  const stats = calculateStats();

  return (
    <div className="character-creation-rom">
      <div className="creation-container">
        <div className="creation-header">
          <h1>CREAR PERSONAJE</h1>
          <p>Construye a tu leyenda del deporte</p>
        </div>

        <div className="creation-content">
          {/* Panel Izquierdo - Avatar y Stats */}
          <div className="left-panel">
            <CharacterAvatar nickname={characterData.nickname} />
            
            <div className="stats-panel">
              <h3>Estadísticas del Personaje</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-name">Ataque</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{width: `${stats.ataque}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.ataque}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">Defensa</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{width: `${stats.defensa}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.defensa}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">Técnica</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{width: `${stats.tecnica}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.tecnica}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-name">Mental</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill" 
                      style={{width: `${stats.mental}%`}}
                    ></div>
                  </div>
                  <span className="stat-value">{stats.mental}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Central - Skills */}
          <div className="center-panel">
            <div className="skills-section">
              <div className="section-header">
                <h2>Habilidades Deportivas</h2>
                <div className="points-display">
                  <span className="points-label">Puntos disponibles:</span>
                  <span className="points-value">{availablePoints}</span>
                </div>
              </div>

              <div className="skills-grid">
                {Object.entries(characterData.skills).map(([key, skill]) => (
                  <div 
                    key={key} 
                    className={`skill-row ${selectedSkill === key ? 'selected' : ''}`}
                    onClick={() => setSelectedSkill(key)}
                  >
                    <div className="skill-info">
                      <span className="skill-icon">{skill.icon}</span>
                      <span className="skill-name">{skill.name}</span>
                    </div>
                    
                    <div className="skill-controls">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSkill(key, skill.value - 1);
                        }}
                        disabled={skill.value <= 50 || availablePoints >= 10}
                        className="control-btn minus"
                      >
                        -
                      </button>
                      
                      <div className="skill-value-display">
                        <span className="value">{skill.value}</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSkill(key, skill.value + 1);
                        }}
                        disabled={availablePoints <= 0}
                        className="control-btn plus"
                      >
                        +
                      </button>
                    </div>

                    <div className="skill-bar">
                      <div 
                        className="skill-progress"
                        style={{width: `${((skill.value - 50) / 50) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Derecho - Formulario */}
          <div className="right-panel">
            <div className="creation-form">
              <div className="form-section">
                <h3>Información del Personaje</h3>
                <div className="input-group">
                  <label>Nombre del Personaje</label>
                  <input
                    type="text"
                    value={characterData.nickname}
                    onChange={(e) => setCharacterData({
                      ...characterData, 
                      nickname: e.target.value
                    })}
                    placeholder="Ingresa el nombre de tu personaje"
                    className="name-input"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  <small>3-20 caracteres. Este será tu nombre en el juego.</small>
                </div>
              </div>

              <div className="form-section">
                <h3>Resumen</h3>
                <div className="summary-card">
                  <div className="summary-item">
                    <span>Puntos utilizados:</span>
                    <span>{10 - availablePoints}/10</span>
                  </div>
                  <div className="summary-item">
                    <span>Habilidades asignadas:</span>
                    <span>{Object.values(characterData.skills).filter(s => s.value > 50).length}</span>
                  </div>
                  <div className="summary-item">
                    <span>Estadística más alta:</span>
                    <span>{Math.max(...Object.values(stats))}</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                onClick={handleCreateCharacter}
                disabled={loading || availablePoints > 0 || !characterData.nickname || characterData.nickname.length < 3}
                className="create-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creando Personaje...
                  </>
                ) : (
                  'Crear Personaje'
                )}
              </button>

              {availablePoints > 0 && (
                <div className="warning-message">
                  ⚠️ Aún tienes {availablePoints} punto(s) por asignar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
