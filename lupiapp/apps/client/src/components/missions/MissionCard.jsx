import React from 'react';

const MissionCard = ({ mission, onProgressUpdate }) => {
  const progress = mission.user_progress?.progress || 0;
  const isCompleted = mission.user_progress?.is_completed || false;
  const progressPercentage = (progress / mission.required_value) * 100;

  const handleIncrement = () => {
    if (!isCompleted) {
      onProgressUpdate(mission.id, progress + 1);
    }
  };

  return (
    <div className={`mission-card ${isCompleted ? 'completed' : ''}`}>
      <div className="mission-header">
        <h3>{mission.name}</h3>
        <span className="mission-category">{mission.category}</span>
      </div>
      
      <p className="mission-description">{mission.description}</p>
      
      <div className="mission-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {progress} / {mission.required_value}
        </span>
      </div>

      <div className="mission-rewards">
        <span className="reward">XP: {mission.xp_reward}</span>
        <span className="reward">LupiCoins: {mission.lupicoins_reward}</span>
        <span className="reward">Puntos: {mission.skill_points_reward}</span>
      </div>

      {!isCompleted && (
        <button 
          className="btn btn-primary"
          onClick={handleIncrement}
          disabled={isCompleted}
        >
          {isCompleted ? 'Completada' : 'Incrementar Progreso'}
        </button>
      )}
    </div>
  );
};

export default MissionCard;