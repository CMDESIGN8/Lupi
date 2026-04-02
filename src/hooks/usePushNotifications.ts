// hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: NotificationAction[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  // Verificar soporte
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);
  
  // Solicitar permiso
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Notificaciones no soportadas');
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await registerServiceWorker();
        await subscribeToPush();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, [isSupported]);
  
  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  }, []);
  
  // Suscribirse a push notifications
  const subscribeToPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });
      
      setSubscription(subscription);
      
      // Guardar suscripción en Supabase
      if (userId && subscription) {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            subscription: JSON.stringify(subscription),
            updated_at: new Date().toISOString()
          });
      }
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  }, [userId]);
  
  // Mostrar notificación local
  // Mostrar notificación local
const showLocalNotification = useCallback(async (payload: NotificationPayload) => {
  if (!isSupported || permission !== 'granted') return;
  
  // Si tiene actions, intentar usar Service Worker
  if (payload.actions && payload.actions.length > 0) {
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        data: payload.data,
        actions: payload.actions,
        vibrate: [200, 100, 200],
        silent: false
      });
      return;
    } catch (error) {
      console.error('Error mostrando notificación con Service Worker:', error);
    }
  }
  
  // Fallback para notificaciones sin actions (usando window.Notification)
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    data: payload.data,
    vibrate: [200, 100, 200],
    silent: false
  };
  
  const notification = new Notification(payload.title, options);
  
  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    if (payload.data?.url) {
      window.location.href = payload.data.url;
    }
    notification.close();
  };
  
  return notification;
}, [isSupported, permission]);
  
  // Programar notificación
  const scheduleNotification = useCallback((
    payload: NotificationPayload,
    delayMs: number
  ) => {
    setTimeout(() => {
      showLocalNotification(payload);
    }, delayMs);
  }, [showLocalNotification]);
  
  // Notificación de racha en peligro
  const notifyStreakAtRisk = useCallback((streak: number) => {
    if (streak > 0) {
      scheduleNotification(
        {
          title: '🔥 ¡No rompas tu racha!',
          body: `Llevás ${streak} días seguidos. Cargá tu entrada antes de que termine el día.`,
          icon: '/icons/fire.png',
          data: { url: '/ticket' },
          actions: [
            { action: 'scan', title: 'Escanear entrada' },
            { action: 'remind', title: 'Recordarme más tarde' }
          ]
        },
        19 * 60 * 60 * 1000 // 7pm
      );
    }
  }, [scheduleNotification]);
  
  // Notificación de nuevo récord
  const notifyNewRecord = useCallback((streak: number) => {
    showLocalNotification({
      title: '🏆 ¡Nuevo récord!',
      body: `¡${streak} días consecutivos! Seguí así.`,
      icon: '/icons/trophy.png',
      data: { url: '/profile' }
    });
  }, [showLocalNotification]);
  
  // Notificación de recompensa
  const notifyReward = useCallback((points: number, reason: string) => {
    showLocalNotification({
      title: '🎁 ¡Recompensa!',
      body: `Ganaste ${points} puntos por ${reason}`,
      icon: '/icons/gift.png',
      data: { url: '/profile' }
    });
  }, [showLocalNotification]);
  
  // Notificación de sorteo
  const notifyRaffle = useCallback((prize: string) => {
    showLocalNotification({
      title: '🎟️ ¡Nuevo sorteo disponible!',
      body: `Participá por ${prize}. Cargá tu entrada ahora.`,
      icon: '/icons/ticket.png',
      data: { url: '/ticket' },
      actions: [
        { action: 'participate', title: 'Participar' }
      ]
    });
  }, [showLocalNotification]);
  
  // Verificar y enviar notificaciones según estado del usuario
  useEffect(() => {
    if (!userId || permission !== 'granted') return;
    
    // Verificar si ya cargó ticket hoy
    const checkDailyTicket = async () => {
      const today = new Date().toDateString();
      const lastTicket = localStorage.getItem(`last_ticket_${userId}`);
      
      if (lastTicket !== today) {
        // Notificación temprana (10am)
        scheduleNotification(
          {
            title: '🌅 ¡Buen día!',
            body: 'Cargá tu entrada temprano y ganá puntos extra.',
            icon: '/icons/morning.png',
            data: { url: '/ticket' }
          },
          10 * 60 * 60 * 1000 // 10am
        );
        
        // Notificación de tarde (5pm)
        scheduleNotification(
          {
            title: '⚡ ¡Últimas horas!',
            body: 'No te olvides de cargar tu entrada para el sorteo.',
            icon: '/icons/reminder.png',
            data: { url: '/ticket' }
          },
          17 * 60 * 60 * 1000 // 5pm
        );
      }
    };
    
    checkDailyTicket();
  }, [userId, permission, scheduleNotification]);
  
  return {
    isSupported,
    permission,
    requestPermission,
    showLocalNotification,
    scheduleNotification,
    notifyStreakAtRisk,
    notifyNewRecord,
    notifyReward,
    notifyRaffle,
    hasPermission: permission === 'granted'
  };
}

// Helper: Convertir base64 a Uint8Array para VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}