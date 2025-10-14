// src/services/missions.js
import api from './api';

export const missionsService = {
  // Obtener todas las misiones
  getAllMissions: async () => {
    return await api.get('/missions');
  },

  // Obtener misiones diarias
  getDailyMissions: async () => {
    return await api.get('/missions/daily');
  },

  // Completar misión
  completeMission: async (missionId) => {
    return await api.post(`/missions/${missionId}/complete`);
  }
};