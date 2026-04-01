// components/NotificationPermission.tsx
import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationPermissionProps {
  userId: string;
}

export function NotificationPermission({ userId }: NotificationPermissionProps) {
  const { isSupported, permission, requestPermission, hasPermission } = usePushNotifications(userId);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Verificar si ya se solicitó antes
    const asked = localStorage.getItem('notification_asked');
    if (!asked && !hasPermission && isSupported) {
      // Esperar un poco antes de preguntar
      setTimeout(() => {
        setDismissed(false);
      }, 5000);
    }
  }, [isSupported, hasPermission]);
  
  if (!isSupported || hasPermission || dismissed) return null;
  
  const handleAllow = async () => {
    const granted = await requestPermission();
    if (granted) {
      localStorage.setItem('notification_asked', 'true');
    }
    setDismissed(true);
  };
  
  const handleLater = () => {
    setDismissed(true);
    localStorage.setItem('notification_asked', 'later');
  };
  
  return (
    <div className="notification-permission-popup">
      <div className="notification-content">
        <div className="notification-icon">🔔</div>
        <div className="notification-text">
          <strong>¡No te pierdas nada!</strong>
          <p>Recibí notificaciones cuando haya sorteos, recompensas y más.</p>
        </div>
        <div className="notification-actions">
          <button onClick={handleAllow} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Activar
          </button>
          <button onClick={handleLater} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}