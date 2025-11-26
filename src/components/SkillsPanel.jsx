import React, { useState } from 'react';
import './SkillsPanel.css'; // Archivo CSS independiente

const SkillsPanel = ({ 
  characterData, 
  availablePoints, 
  updateSkill,
  onClose 
}) => {
  const [selectedSkill, setSelectedSkill] = useState(null);

  return (
    <div className="skills-panel-isolated">
      {/* Overlay de fondo */}
      <div className="skills-panel-overlay" onClick={onClose}></div>
      
      {/* Panel principal */}
      <div className="skills-panel-container">
        {/* Header con botón de cerrar */}
        <div className="skills-panel-header">
          <h2>Asignar Habilidades</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Puntos disponibles */}
        <div className="points-card-isolated">
          <div className="points-header-isolated">
            <span className="points-title-isolated">Puntos Disponibles</span>
            <span className="points-value-isolated">{availablePoints}</span>
          </div>
          <div className="points-subtitle-isolated">
            Distribuye tus puntos entre las habilidades
          </div>
        </div>

        {/* Grid de habilidades */}
        <div className="skills-grid-isolated">
          {Object.entries(characterData.skills).map(([key, skill]) => (
            <div 
              key={key} 
              className={`skill-card-isolated ${selectedSkill === key ? 'selected' : ''}`}
              onClick={() => setSelectedSkill(key)}
            >
              <div className="skill-header-isolated">
                <span className="skill-icon-isolated">{skill.icon}</span>
                <span className="skill-name-isolated">{skill.name}</span>
              </div>
              
              <div className="skill-controls-isolated">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSkill(key, skill.value - 1);
                  }}
                  disabled={skill.value <= 50 || availablePoints >= 10}
                  className="control-btn-isolated"
                >
                  -
                </button>
                
                <div className="skill-value-isolated">{skill.value}</div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSkill(key, skill.value + 1);
                  }}
                  disabled={availablePoints <= 0}
                  className="control-btn-isolated"
                >
                  +
                </button>
              </div>

              <div className="skill-bar-isolated">
                <div 
                  className="skill-progress-isolated"
                  style={{width: `${((skill.value - 50) / 50) * 100}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsPanel;