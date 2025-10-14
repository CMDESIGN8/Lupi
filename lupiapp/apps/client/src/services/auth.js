// src/services/auth.js
import api from './api';

export const authService = {
  // Login
  login: async (email, password) => {
    return await api.post('/players/login', { email, password });
  },

  // Registro
  register: async (userData) => {
    return await api.post('/players/register', userData);
  },

  // Obtener perfil
  getProfile: async () => {
    return await api.get('/players/profile');
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    return await api.put('/players/profile', userData);
  }
};