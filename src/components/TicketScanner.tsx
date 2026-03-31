import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface TicketScannerProps {
  onScan: (ticketNumber: string) => void;
  onClose: () => void;
}

export function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = 'qr-scanner-container';

  useEffect(() => {
    // Crear el scanner
    const scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      },
      false
    );

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      // Limpiar el número (solo dígitos)
      const cleanNumber = decodedText.replace(/[^0-9]/g, '');
      
      if (cleanNumber.length >= 4) {
        // Detener el scanner
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        // Feedback háptico
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
        onScan(cleanNumber);
      } else {
        setError('El código escaneado no parece ser un número de entrada válido');
        // Vibrar para error
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    };

    const onScanError = (err: string) => {
      console.warn('Scan error:', err);
      // No mostrar todos los errores al usuario, solo los importantes
      if (err.includes('No MultiFormat Readers')) {
        setError('Error al leer el código. Intentá nuevamente.');
      }
    };

    scanner.render(onScanSuccess, onScanError);

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScan]);

  const handleRequestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setError('');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Necesitamos acceso a la cámara para escanear. Por favor, permití el acceso.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo');
      } else {
        setError('Error al acceder a la cámara');
      }
    }
  };

  // Solicitar permiso de cámara al montar
  useEffect(() => {
    handleRequestCamera();
  }, []);

  return (
    <div className="scanner-modal">
      <div className="scanner-container">
        <div className="scanner-header">
          <h3>📷 Escanear entrada</h3>
          <button className="scanner-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: '16px' }}>
            ⚠️ {error}
            <button 
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        <div id={containerId} style={{ width: '100%', padding: '16px' }}></div>

        <div className="scanner-guide-text">
          <p>Alineá el código QR dentro del marco</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            💡 Tip: Asegurate de tener buena iluminación
          </p>
        </div>

        <div className="scanner-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
                setError('');
                // Reiniciar scanner
                const newScanner = new Html5QrcodeScanner(
                  containerId,
                  { fps: 10, qrbox: { width: 250, height: 250 } },
                  false
                );
                scannerRef.current = newScanner;
                newScanner.render(
                  (text) => {
                    const cleanNumber = text.replace(/[^0-9]/g, '');
                    if (cleanNumber.length >= 4) {
                      newScanner.clear();
                      onScan(cleanNumber);
                    } else {
                      setError('Código inválido');
                    }
                  },
                  (err) => console.warn(err)
                );
              }
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}