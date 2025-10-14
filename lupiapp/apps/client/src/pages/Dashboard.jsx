import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import Loading from '../components/common/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, loading, error, refetch } = useApi(() => apiService.getUserProfile());

  if (loading) return <Loading />;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenido de vuelta, {profile?.username || user?.email}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Nivel</h3>
          <div className="stat-value">{profile?.level || 1}</div>
        </div>
        <div className="stat-card">
          <h3>Experiencia</h3>
          <div className="stat-value">{profile?.experience || 0}</div>
        </div>
        <div className="stat-card">
          <h3>LupiCoins</h3>
          <div className="stat-value">{profile?.lupi_coins || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Puntos de Habilidad</h3>
          <div className="stat-value">{profile?.skill_points || 0}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Misiones del Día</h2>
          <div className="mission-progress">
            <p>Misiones completadas: {profile?.daily_missions_completed || 0}</p>
            {/* Aquí irían las misiones diarias específicas */}
          </div>
        </div>

        <div className="section">
          <h2>Club Actual</h2>
          {profile?.clubs ? (
            <div className="club-info">
              <h3>{profile.clubs.name}</h3>
              <p>{profile.clubs.description}</p>
            </div>
          ) : (
            <p>No estás en un club. <a href="/clubs">¡Únete a uno!</a></p>
          )}
        </div>

        <div className="section">
          <h2>Habilidades</h2>
          <div className="skills-list">
            {profile?.player_skills?.map(skill => (
              <div key={skill.id} className="skill-item">
                <span>{skill.skill_name}</span>
                <span className="skill-value">{skill.skill_value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;