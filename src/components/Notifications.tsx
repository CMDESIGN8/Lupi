import { useState, useEffect } from 'react';
import { api, Notification } from '../lib/api';

interface NotificationsProps {
  userId: string;
}

export function Notifications({ userId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
    <div className="notifications-container">
      <button 
        className="notifications-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="notifications-list">
            {loading ? (
              <div className="notifications-loading">
                <div className="spinner" />
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
          font-size: 24px;
          cursor: pointer;
          position: relative;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .notifications-bell:hover {
          background: rgba(255,255,255,0.1);
        }

        .notifications-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--accent2);
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notifications-dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          width: 380px;
          max-width: 90vw;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 1000;
          overflow: hidden;
        }

        .notifications-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notifications-header h3 {
          font-family: var(--font-display);
          font-size: 18px;
          margin: 0;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
        }

        .notifications-list {
          max-height: 500px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .notification-item:hover {
          background: rgba(255,255,255,0.05);
        }

        .notification-item.unread {
          background: rgba(24, 157, 245, 0.08);
          border-left: 3px solid var(--accent);
        }

        .notification-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .notification-message {
          font-size: 13px;
          color: var(--text2);
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 11px;
          color: var(--text2);
        }

        .notifications-loading,
        .notifications-empty {
          padding: 40px;
          text-align: center;
          color: var(--text2);
        }

        .notifications-empty span {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        @media (max-width: 480px) {
          .notifications-dropdown {
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            width: auto;
            margin: 0 16px;
          }
        }
      `}</style>
    </div>
  );
}