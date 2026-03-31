// components/Toast.tsx - Crear este archivo
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div className={`toast-message toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}