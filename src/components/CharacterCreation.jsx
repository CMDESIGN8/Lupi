// src/components/CharacterCreation.jsx
import React, { useState } from 'react';
import '../styles/CharacterCreation.css';
import { supabase } from '../lib/supabaseClient';

const BASE_SKILLS = {
  pase: { name: 'Pase', value: 50, icon: '↗️', color: '#00B894' },
  potencia: { name: 'Potencia', value: 50, icon: '💥', color: '#E84393' },
  velocidad: { name: 'Velocidad', value: 50, icon: '⚡', color: '#FDCB6E' },
  liderazgo: { name: 'Liderazgo', value: 50, icon: '👑', color: '#FF7675' },
  tiro: { name: 'Tiro', value: 50, icon: '🎯', color: '#6C5CE7' },
  regate: { name: 'Regate', value: 50, icon: '🌀', color: '#00CEC9' },
  tecnica: { name: 'Técnica', value: 50, icon: '🔧', color: '#A29BFE' },
  estrategia: { name: 'Estrategia', value: 50, icon: '🧠', color: '#FD79A8' },
  inteligencia: { name: 'Inteligencia', value: 50, icon: '📊', color: '#74B9FF' },
  defensa: { name: 'Defensa', value: 50, icon: '🛡️', color: '#636E72' },
  resistencia: { name: 'Resistencia', value: 50, icon: '🏃', color: '#00B894' }
};

const AvatarPreview = ({ nickname, stats }) => (
  <div className="avatar-preview">
    <div className="avatar-container">
      <div className="avatar-circle">
        <div className="avatar-face">
          <div className="avatar-eyes">
            <div className="eye"></div>
            <div className="eye"></div>
          </div>
          <div className="avatar-mouth"></div>
        </div>
        <div className="avatar-hair"></div>
      </div>
      <div className="avatar-jersey">
        <div className="jersey-number">
          {nickname ? nickname.slice(0, 2).toUpperCase() : '10'}
        </div>
      </div>
    </div>
    
    <div className="character-info">
      <h3 className="character-name">{nickname || 'Nuevo Jugador'}</h3>
      <div className="character-level">Nivel 1</div>
    </div>

    <div className="stats-overview">
      <div className="stat-card">
        <div className="stat-icon">⚔️</div>
        <div className="stat-info">
          <div className="stat-value">{stats.ataque}</div>
          <div className="stat-label">Ataque</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🛡️</div>
        <div className="stat-info">
          <div className="stat-value">{stats.defensa}</div>
          <div className="stat-label">Defensa</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🌟</div>
        <div className="stat-info">
          <div className="stat-value">{stats.tecnica}</div>
          <div className="stat-label">Técnica</div>
        </div>
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
  const [activeSkill, setActiveSkill] = useState(null);

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
      // Tu código existente para crear el personaje...
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
    <div className="character-creation-modern">
      <div className="creation-container">
        <div className="creation-header">
          <h1>CREAR PERSONAJE DEPORTIVO</h1>
          <p>Construye al próximo campeón del deporte mundial</p>
        </div>

        <div className="creation-layout">
          {/* Panel Izquierdo - Skills */}
          <div className="skills-panel">
            <div className="points-card">
              <div className="points-header">
                <span className="points-title">Puntos Disponibles</span>
                <span className="points-count">{availablePoints}</span>
              </div>
              <div className="points-subtitle">
                Distribuye {availablePoints} puntos adicionales entre tus habilidades
              </div>
            </div>

            <div className="skills-grid">
              {Object.entries(characterData.skills).map(([key, skill]) => (
                <div 
                  key={key}
                  className={`skill-card ${activeSkill === key ? 'active' : ''}`}
                  onMouseEnter={() => setActiveSkill(key)}
                  onMouseLeave={() => setActiveSkill(null)}
                >
                  <div className="skill-header">
                    <span className="skill-icon">{skill.icon}</span>
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-value">{skill.value}</span>
                  </div>
                  
                  <div className="skill-bar">
                    <div 
                      className="skill-progress"
                      style={{
                        width: `${((skill.value - 50) / 50) * 100}%`,
                        backgroundColor: skill.color
                      }}
                    ></div>
                  </div>

                  <div className="skill-controls">
                    <button
                      type="button"
                      onClick={() => updateSkill(key, skill.value - 5)}
                      disabled={skill.value <= 50 || availablePoints >= 10}
                      className="control-btn minus"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSkill(key, skill.value - 1)}
                      disabled={skill.value <= 50 || availablePoints >= 10}
                      className="control-btn minus"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSkill(key, skill.value + 1)}
                      disabled={availablePoints <= 0}
                      className="control-btn plus"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSkill(key, skill.value + 5)}
                      disabled={availablePoints < 5}
                      className="control-btn plus"
                    >
                      +5
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Central - Avatar */}
          <div className="avatar-panel">
            <AvatarPreview nickname={characterData.nickname} stats={stats} />
            
            <form onSubmit={handleCreateCharacter} className="creation-form">
              <div className="name-input-group">
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

              <button 
                type="submit" 
                disabled={loading || availablePoints > 0 || !characterData.nickname || characterData.nickname.length < 3}
                className="create-character-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creando Personaje...
                  </>
                ) : (
                  '🎮 Crear Personaje'
                )}
              </button>

              {availablePoints > 0 && (
                <div className="warning-message">
                  ⚠️ Aún tienes {availablePoints} punto(s) por asignar
                </div>
              )}
            </form>
          </div>

          {/* Panel Derecho - Stats */}
          <div className="stats-panel">
            <div className="stats-card">
              <h3>Estadísticas Generales</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <div className="stat-bar-container">
                    <div className="stat-label">
                      <span>Ataque</span>
                      <span>{stats.ataque}</span>
                    </div>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill attack" 
                        style={{width: `${stats.ataque}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-bar-container">
                    <div className="stat-label">
                      <span>Defensa</span>
                      <span>{stats.defensa}</span>
                    </div>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill defense" 
                        style={{width: `${stats.defensa}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-bar-container">
                    <div className="stat-label">
                      <span>Técnica</span>
                      <span>{stats.tecnica}</span>
                    </div>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill technique" 
                        style={{width: `${stats.tecnica}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-bar-container">
                    <div className="stat-label">
                      <span>Mental</span>
                      <span>{stats.mental}</span>
                    </div>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill mental" 
                        style={{width: `${stats.mental}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tips-card">
              <h4>💡 Consejos</h4>
              <ul>
                <li>Equilibra tus habilidades según tu estilo de juego</li>
                <li>La resistencia afecta tu duración en partidos largos</li>
                <li>El liderazgo mejora el rendimiento del equipo</li>
                <li>Distribuye todos los puntos antes de crear</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
