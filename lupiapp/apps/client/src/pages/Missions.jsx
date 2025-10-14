import React from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import MissionCard from '../components/missions/MissionCard';
import Loading from '../components/common/Loading';

const Missions = () => {
  const { data: missions, loading, error, refetch } = useApi(() => apiService.getMissions());

  const handleProgressUpdate = async (missionId, progress) => {
    try {
      await apiService.updateMissionProgress(missionId, progress);
      refetch(); // Recargar las misiones
    } catch (err) {
      console.error('Error updating mission:', err);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="error">Error: {error}</div>;

  const dailyMissions = missions?.filter(m => m.is_daily) || [];
  const regularMissions = missions?.filter(m => !m.is_daily) || [];

  return (
    <div className="missions-page">
      <div className="page-header">
        <h1>🎯 Misiones</h1>
        <p>Completa misiones para ganar recompensas</p>
      </div>

      <div className="missions-section">
        <h2>Misiones Diarias</h2>
        <div className="missions-grid">
          {dailyMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </div>
      </div>

      <div className="missions-section">
        <h2>Misiones Principales</h2>
        <div className="missions-grid">
          {regularMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Missions;