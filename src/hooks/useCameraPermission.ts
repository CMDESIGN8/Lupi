// hooks/useCameraPermission.ts
import { useState, useEffect } from 'react';

export function useCameraPermission() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [error, setError] = useState<string>('');

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      setError('');
      return true;
    } catch (err: any) {
      setPermission('denied');
      if (err.name === 'NotAllowedError') {
        setError('Permiso denegado. Por favor, permití el acceso a la cámara en la configuración de tu navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setError('Error al acceder a la cámara.');
      }
      return false;
    }
  };

  useEffect(() => {
    // Verificar permiso existente
    navigator.permissions?.query({ name: 'camera' as PermissionName })
      .then((result) => {
        setPermission(result.state as any);
        result.onchange = () => setPermission(result.state as any);
      })
      .catch(() => {
        // Fallback si permissions API no está disponible
        setPermission('prompt');
      });
  }, []);

  return { permission, error, requestPermission };
}