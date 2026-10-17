// hooks/useShareReward.ts
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useShareReward(userId: string) {
  const [canShare, setCanShare] = useState(true);
  const [nextShareDate, setNextShareDate] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStats, setShareStats] = useState({ totalShares: 0, totalPointsFromShares: 0 });

  useEffect(() => {
    if (userId) {
      checkShareEligibility();
      loadShareStats();
    }
  }, [userId]);

  const checkShareEligibility = async () => {
    try {
      const result = await api.canShareToday(userId);
      setCanShare(result.canShare);
      setNextShareDate(result.nextShareDate || null);
    } catch (error) {
      console.error('Error checking share eligibility:', error);
    }
  };

  const loadShareStats = async () => {
    try {
      const stats = await api.getShareStats(userId);
      setShareStats(stats);
    } catch (error) {
      console.error('Error loading share stats:', error);
    }
  };

  // Función separada solo para registrar el compartido (sin la parte de share)
  const registerShareAndGetPoints = async (): Promise<{ success: boolean; newPoints: number; message: string }> => {
    setIsSharing(true);

    try {
      // Registrar en Supabase y sumar puntos
      const result = await api.registerShare(userId, 'social');
      
      if (result.success) {
        // Actualizar estado local
        setCanShare(false);
        setShareStats(prev => ({
          totalShares: prev.totalShares + 1,
          totalPointsFromShares: prev.totalPointsFromShares + 50
        }));
        
        // Calcular próxima fecha
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setNextShareDate(tomorrow.toISOString());
        
        return { 
          success: true, 
          message: `🎉 ¡Gracias por compartir! +50 puntos. Total: ${result.newPoints} pts`,
          newPoints: result.newPoints
        };
      } else {
        return { success: false, message: result.message, newPoints: 0 };
      }
    } catch (error: any) {
      console.error('Error registering share:', error);
      return { 
        success: false, 
        message: error.message || 'Error al registrar el compartido',
        newPoints: 0
      };
    } finally {
      setIsSharing(false);
    }
  };

  const formatNextShareTime = () => {
    if (!nextShareDate) return '';
    const date = new Date(nextShareDate);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return { 
    registerShareAndGetPoints, // Renombrado para ser más claro
    canShare, 
    nextShareDate, 
    isSharing,
    shareStats,
    formatNextShareTime
  };
}