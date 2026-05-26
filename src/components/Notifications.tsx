import { useState, useEffect, useRef } from 'react';
import { api, Notification } from '../lib/api';

interface NotificationsProps {
  userId: string;
}

export function Notifications({ userId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Suscripción en tiempo real
    const unsubscribe = api.subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => unsubscribe();
  }, [userId]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await api.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead(userId);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'winner': return '🏆';
      case 'validation': return '✅';
      case 'info': return 'ℹ️';
      case 'alert': return '⚠️';
      default: return '📢';
    }
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className="notifications-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notificaciones</h3>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read">
                  Marcar todas
                </button>
              )}
              {/* Botón de cerrar */}
              <button onClick={closeDropdown} className="close-dropdown" aria-label="Cerrar">
                ✕
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {loading ? (
              <div className="notifications-loading">
                <div className="spinner" />
                <p>Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <span>📭</span>
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.created_at).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .notifications-container {
          position: relative;
        }

        .notifications-bell {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bell-icon {
          font-size: 30px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          transition: transform 0.2s ease;
        }

        .notifications-bell:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .notifications-bell:hover .bell-icon {
          transform: rotate(15deg);
        }

        .notifications-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #ff4444, #cc0000);
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          animation: badgePop 0.3s ease-out;
        }

        @keyframes badgePop {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .notifications-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          width: 400px;
          max-width: 90vw;
          background: linear-gradient(145deg, #12121f, #0a0a14);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          overflow: hidden;
          backdrop-filter: blur(10px);
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notifications-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
        }

        .notifications-header h3 {
          font-family: 'Teko', 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #fff, #ccc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mark-all-read {
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 20px;
          padding: 4px 12px;
          color: #ffd700;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mark-all-read:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.02);
        }

        /* Botón de cerrar */
        .close-dropdown {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: rgba(255, 255, 255, 0.6);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-dropdown:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: rotate(90deg);
        }

        .notifications-list {
          max-height: 450px;
          overflow-y: auto;
        }

        .notifications-list::-webkit-scrollbar {
          width: 6px;
        }

        .notifications-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .notifications-list::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 3px;
        }

        .notification-item {
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        .notification-item.unread {
          background: rgba(24, 157, 245, 0.08);
          border-left: 3px solid #189df5;
        }

        .notification-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
          color: #fff;
        }

        .notification-message {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .notifications-loading,
        .notifications-empty {
          padding: 48px 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }

        .notifications-empty span {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .notifications-loading p {
          margin-top: 12px;
          font-size: 13px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 215, 0, 0.2);
          border-top-color: #ffd700;
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .notifications-dropdown {
            position: fixed;
            top: 56px;
            left: 16px;
            right: 16px;
            width: auto;
            max-width: none;
          }

          .notifications-header h3 {
            font-size: 18px;
          }

          .close-dropdown {
            width: 32px;
            height: 32px;
          }

          .notification-item {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}