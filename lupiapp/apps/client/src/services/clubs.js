// src/services/clubs.js
import api from './api';

export const clubsService = {
  // Obtener todos los clubs
  getAllClubs: async () => {
    return await api.get('/clubs');
  },

  // Obtener club por ID
  getClubById: async (id) => {
    return await api.get(`/clubs/${id}`);
  },

  // Crear nuevo club
  createClub: async (clubData) => {
    return await api.post('/clubs', clubData);
  },

  // Unirse a un club
  joinClub: async (clubId) => {
    return await api.post(`/clubs/${clubId}/join`);
  },

  // Obtener miembros del club
  getClubMembers: async (clubId) => {
    return await api.get(`/clubs/${clubId}/members`);
  }
};