  // src/components/CharacterCreation.jsx
  import React, { useState } from 'react';
  import '../styles/CharacterCreation.css';
  import { supabase } from '../lib/supabaseClient';
  import SkillsPanel from './SkillsPanel';

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
    <div className="avatar-container">
      <div className="avatar-info">
        <div className="avatar-name">{nickname || 'Nuevo Jugador'}</div>
        <div className="avatar-details">
          <span className="avatar-class">Deportista Profesional</span>
          <span className="avatar-level">Nivel 1</span>
        </div>
      </div>
      <img 
        src="https://i.ibb.co/zVd0skVf/avatar-placeholder.png" 
        alt="Avatar del personaje"
        className="character-avatar"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
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
    const [showSkillsPanel, setShowSkillsPanel] = useState(false);

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
      <div className="character-creation-dashboard">
        <div className="dashboard-container">
          <div className="dashboard-content">
            {/* Panel Información - Orden 1 en mobile */}
            <div className="info-panel">
              <div className="panel-section">
                <h3 className="section-title">📝 Información Básica</h3>
                <div className="input-group">
                  <label className="input-label">Nombre del Personaje</label>
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
                  <small className="input-hint">
                    3-20 caracteres. Este será tu nombre en el juego.
                  </small>
                </div>
              </div>

              <div className="panel-section">
                <h3 className="section-title">💡 Consejos</h3>
                <div className="tips-grid">
                  <div className="tip-card">
                    <div className="tip-title">Equilibra tus habilidades</div>
                    <div className="tip-description">
                      Un personaje balanceado puede adaptarse a diferentes situaciones del juego.
                    </div>
                  </div>
                  <div className="tip-card">
                    <div className="tip-title">Enfoque especializado</div>
                    <div className="tip-description">
                      Maximiza las habilidades clave para tu estilo de juego preferido.
                    </div>
                  </div>
                  <div className="tip-card">
                    <div className="tip-title">Resistencia importante</div>
                    <div className="tip-description">
                      La resistencia afecta tu duración en partidos largos y torneos.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Avatar con Botones - Orden 2 en mobile */}
            <div className="avatar-panel">
              <CharacterAvatar nickname={characterData.nickname} />
              
              {/* Botones movidos aquí debajo del avatar */}
              <div className="avatar-actions">

                <button 
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
                    '🎮 Crear Personaje'
                  )}
                </button>

                {availablePoints > 0 && (
                  <div className="warning-message">
                    ⚠️ Aún tienes {availablePoints} punto(s) por asignar
                  </div>
                )}
              </div>
            </div>

            {/* Panel Skills - Orden 3 en mobile */}
            <div className="skills-panel">
              <div className="skills-header">
                <div className="points-card">
                  <div className="points-header">
                    <span className="points-title">Puntos Disponibles</span>
                    <span className="points-value">  {availablePoints}</span>
                  </div>
                  <div className="points-subtitle">
                    Distribuye tus puntos entre las habilidades
                  </div>
                </div>
              </div>

              <div className="skills-grid">
                {Object.entries(characterData.skills).map(([key, skill]) => (
                  <div 
                    key={key} 
                    className={`skill-card ${selectedSkill === key ? 'selected' : ''}`}
                    onClick={() => setSelectedSkill(key)}
                  >
                    <div className="skill-header">
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
                        className="control-btn"
                      >
                        -
                      </button>
                      
                      <div className="skill-value">{skill.value}</div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSkill(key, skill.value + 1);
                        }}
                        disabled={availablePoints <= 0}
                        className="control-btn"
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
        </div>
      </div>
    );
  };