import { useState, useEffect } from 'react';
import { api, AppUser } from '../lib/api';

export function useSupabase() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await api.getSession();
      setUser(session);
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { email: string; username: string; club: string; password: string }) => {
    const user = await api.register(userData);
    setUser(user);
    return user;
  };

  const login = async (credentials: { email: string; password: string }) => {
    const user = await api.login(credentials);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const submitTicket = async (data: { ticketNumber: string }) => {
    const result = await api.submitTicket(data);
    setUser(prev => prev ? { ...prev, points: result.newPoints } : null);
    return result;
  };

  const getUserTickets = async (userId: string) => {
    return await api.getUserTickets(userId);
  };

  const getLeaderboard = async () => {
    return await api.getLeaderboard();
  };

  return {
    user,
    loading,
    register,
    login,
    logout,
    submitTicket,
    getUserTickets,
    getLeaderboard,
  };
}