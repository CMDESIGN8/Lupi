// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useLocalStorage('authToken', null);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Verificar token con el backend
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Error verifying token:', error);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, setToken]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };
};