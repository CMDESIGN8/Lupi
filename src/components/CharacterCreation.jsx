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
  resistencia_base: { name: 'Resistencia', value: 50, icon: '🏃' }
};

const CharacterAvatar = ({ nickname }) => (
  <div className="character-avatar-center">
    <div className="avatar-display-center">
      <img 
        src="https://i.ibb.co/zVd0skVf/avatar-placeholder.png" 
        alt="Avatar del personaje"
        className="avatar-image-main"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <div className="avatar-fallback">
        <div className="avatar-placeholder">
          <div className="avatar-silhouette"></div>
        </div>
      </div>
      <div className="avatar-info-center">
        <h2 className="avatar-name-main">{nickname || 'Nuevo Jugador'}</h2>
        <div className="avatar-details">
          <span className="avatar-class-main">Deportista Profesional</span>
          <span className="avatar-level-main">Nivel 1</span>
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

  return (
    <div className="character-creation-rom">
      <div className="creation-container">
        <div className="creation-header">
          <h1>CREAR PERSONAJE</h1>
          <p>Construye a tu leyenda del deporte</p>
        </div>

        <div className="creation-content-new">
          {/* Panel Izquierdo - Información y Consejos */}
          <div className="left-panel-new">
            <div className="info-section">
              <h3>Información del Personaje</h3>
              <div className="input-group-new">
                <label>Nombre del Personaje</label>
                <input
                  type="text"
                  value={characterData.nickname}
                  onChange={(e) => setCharacterData({
                    ...characterData, 
                    nickname: e.target.value
                  })}
                  placeholder="Ingresa el nombre de tu personaje"
                  className="name-input-new"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <small>3-20 caracteres. Este será tu nombre en el juego.</small>
              </div>
            </div>

            <div className="points-section">
              <div className="points-card-new">
                <div className="points-header-new">
                  <span className="points-title-new">Puntos Disponibles</span>
                  <span className="points-value-new">{availablePoints}</span>
                </div>
                <div className="points-subtitle">
                  Distribuye {availablePoints} puntos adicionales entre tus habilidades
                </div>
              </div>
            </div>

            <div className="tips-section">
              <h3>💡 Consejos de Creación</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <strong>Equilibra tus habilidades</strong>
                  <p>Un personaje balanceado puede adaptarse a diferentes situaciones del juego.</p>
                </div>
                <div className="tip-item">
                  <strong>Enfoque especializado</strong>
                  <p>Si prefieres un estilo específico, maximiza las habilidades clave para ese rol.</p>
                </div>
                <div className="tip-item">
                  <strong>Resistencia importante</strong>
                  <p>La resistencia afecta tu duración en partidos largos y torneos.</p>
                </div>
                <div className="tip-item">
                  <strong>Liderazgo en equipo</strong>
                  <p>El liderazgo mejora el rendimiento de todo tu equipo en partidas grupales.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateCharacter}
              disabled={loading || availablePoints > 0 || !characterData.nickname || characterData.nickname.length < 3}
              className="create-btn-new"
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
              <div className="warning-message-new">
                ⚠️ Aún tienes {availablePoints} punto(s) por asignar
              </div>
            )}
          </div>

          {/* Panel Central - Avatar Grande */}
          <div className="center-panel-new">
            <CharacterAvatar nickname={characterData.nickname} />
          </div>

          {/* Panel Derecho - Skills */}
          <div className="right-panel-new">
            <div className="skills-section-new">
              <div className="section-header-new">
                <h2>Habilidades Deportivas</h2>
              </div>

              <div className="skills-grid-new">
                {Object.entries(characterData.skills).map(([key, skill]) => (
                  <div 
                    key={key} 
                    className={`skill-row-new ${selectedSkill === key ? 'selected' : ''}`}
                    onClick={() => setSelectedSkill(key)}
                  >
                    <div className="skill-info-new">
                      <span className="skill-icon-new">{skill.icon}</span>
                      <span className="skill-name-new">{skill.name}</span>
                    </div>
                    
                    <div className="skill-controls-new">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSkill(key, skill.value - 1);
                        }}
                        disabled={skill.value <= 50 || availablePoints >= 10}
                        className="control-btn-new minus"
                      >
                        -
                      </button>
                      
                      <div className="skill-value-display-new">
                        <span className="value-new">{skill.value}</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSkill(key, skill.value + 1);
                        }}
                        disabled={availablePoints <= 0}
                        className="control-btn-new plus"
                      >
                        +
                      </button>
                    </div>

                    <div className="skill-bar-new">
                      <div 
                        className="skill-progress-new"
                        style={{width: `${((skill.value - 50) / 50) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
