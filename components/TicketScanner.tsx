// src/components/TicketScanner.tsx
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface TicketScannerProps {
  onScan: (ticketNumber: string) => void;
  onClose: () => void;
}

export function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = 'qr-scanner-container';

  // Función para extraer SOLO números
  const extractNumbers = (text: string): string => {
    // Remover todo lo que no sea número
    let numbers = text.replace(/[^0-9]/g, '');
    
    // Si el número tiene más de 12 dígitos, tomar los últimos 12
    if (numbers.length > 12) {
      numbers = numbers.slice(-12);
    }
    
    return numbers;
  };

  // Función para validar si es un número de entrada válido
  const isValidTicketNumber = (numbers: string): boolean => {
    // Validar que tenga entre 4 y 12 dígitos
    return numbers.length >= 4 && numbers.length <= 12;
  };

  useEffect(() => {
    // Crear el scanner con opciones optimizadas
    const scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        formatsToSupport: [Html5QrcodeScanner.QR_CODE],
      },
      false
    );

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      console.log('Texto escaneado:', decodedText);
      
      // Extraer SOLO números
      const numbersOnly = extractNumbers(decodedText);
      console.log('Solo números:', numbersOnly);
      
      if (isValidTicketNumber(numbersOnly)) {
        // Detener el scanner inmediatamente
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        
        // Feedback háptico de éxito
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        // Llamar al callback con el número limpio
        onScan(numbersOnly);
      } else {
        // Error: número inválido
        setError(`Número inválido: "${decodedText}". Solo se aceptan números de 4 a 12 dígitos.`);
        
        // Feedback háptico de error
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Opcional: continuar escaneando después de error
        setTimeout(() => setError(''), 3000);
      }
    };

    const onScanError = (err: string) => {
      console.warn('Scan error:', err);
      // No mostrar errores de escaneo continuo al usuario
    };

    scanner.render(onScanSuccess, onScanError);

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  // Solicitar permiso de cámara
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setError('');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('❌ Necesitamos acceso a la cámara para escanear. Por favor, permití el acceso.');
      } else if (err.name === 'NotFoundError') {
        setError('❌ No se encontró ninguna cámara en este dispositivo');
      } else {
        setError('❌ Error al acceder a la cámara');
      }
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  return (
    <div className="scanner-modal">
      <div className="scanner-container">
        {/* Header fijo */}
        <div className="scanner-header">
          <h3>📷 Escanear entrada</h3>
          <button className="scanner-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Área de contenido con scroll */}
        <div className="scanner-content">
          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
            </div>
          )}

          {/* Contenedor del scanner */}
          <div id={containerId} className="scanner-view"></div>

          {/* Instrucciones */}
          <div className="scanner-instructions">
            <div className="instruction-icon">📱</div>
            <p className="instruction-title">¿Cómo escanear?</p>
            <ul className="instruction-list">
              <li>✓ Asegurate de tener buena iluminación</li>
              <li>✓ Mantené el código QR dentro del marco</li>
              <li>✓ El código debe contener el número de entrada</li>
            </ul>
            <div className="instruction-note">
              💡 Solo se aceptan números de 4 a 12 dígitos
            </div>
          </div>
        </div>

        {/* Botones fijos al final */}
        <div className="scanner-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                setError('');
                setIsScanning(true);
                // Reiniciar scanner
                const newScanner = new Html5QrcodeScanner(
                  containerId,
                  {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                  },
                  false
                );
                scannerRef.current = newScanner;
                newScanner.render(
                  (text) => {
                    const numbersOnly = text.replace(/[^0-9]/g, '');
                    if (numbersOnly.length >= 4 && numbersOnly.length <= 12) {
                      newScanner.clear().catch(console.error);
                      onScan(numbersOnly);
                    } else {
                      setError(`Número inválido: solo se permiten ${numbersOnly.length} dígitos (mínimo 4, máximo 12)`);
                      setTimeout(() => setError(''), 3000);
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