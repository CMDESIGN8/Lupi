// src/components/TicketScanner.tsx
import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

interface TicketScannerProps {
  onScan: (ticketNumber: string) => void;
  onClose: () => void;
}

export function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Función para extraer números de 8-12 dígitos del texto
  // En extractTicketNumber, agregá:
const extractTicketNumber = (text: string): string | null => {
  console.log('🔍 Texto completo recibido:', text);
  console.log('📏 Longitud del texto:', text.length);
  
  // Mostrar todos los números encontrados
  const allNumbers = text.match(/\d+/g);
  console.log('🔢 Todos los números encontrados:', allNumbers);
  
  // Buscar números de 8-12 dígitos
  const longPattern = /\b(\d{8,12})\b/g;
  const longMatches = text.match(longPattern);
  console.log('📊 Números de 8-12 dígitos:', longMatches);
  
  if (longMatches && longMatches.length > 0) {
    return longMatches[0];
  }
  
  // Fallback: buscar cualquier número de 6+ dígitos
  const fallbackPattern = /\b(\d{6,})\b/g;
  const fallbackMatch = text.match(fallbackPattern);
  console.log('⚠️ Fallback (6+ dígitos):', fallbackMatch);
  
  return fallbackMatch ? fallbackMatch[0] : null;
};

  // Función para procesar imagen con OCR
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('🔍 Procesando imagen con OCR...');
      
      const worker = await createWorker('spa'); // Usar español para mejor reconocimiento
      
      // Reconocer texto
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      
      console.log('📝 Texto reconocido:', text);
      
      // Extraer número de entrada
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber) {
        console.log('✅ Número encontrado:', ticketNumber);
        
        // Feedback háptico
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber);
      } else {
        console.log('❌ No se encontró número válido');
        setError('No se pudo encontrar el número de entrada. Asegurate de que la imagen sea clara y muestre el número.');
        
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setError('Error al procesar la imagen. Intentá nuevamente con mejor iluminación.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tomar foto con la cámara
  const takePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Necesitamos acceso a la cámara para leer tu entrada.');
      } else {
        setError('Error al acceder a la cámara.');
      }
    }
  };

  // Capturar foto actual
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewUrl(imageDataUrl);
      
      // Detener stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Procesar la imagen
      processImage(imageDataUrl);
    }
  };

  // Seleccionar imagen de galería
  const selectFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      processImage(file);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setError('');
    setIsProcessing(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    takePhoto(); // Reiniciar cámara
  };

  // Iniciar cámara al montar
  useEffect(() => {
  takePhoto();
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };
}, []);

  return (
    <div className="scanner-modal">
      <div className="scanner-container">
        <div className="scanner-header">
          <h3>📷 Leer entrada</h3>
          <button className="scanner-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="scanner-content">
          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
            </div>
          )}

          {!previewUrl ? (
            // Vista de cámara
            <div className="camera-view">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-preview"
              />
              <div className="camera-guide">
                <div className="guide-frame"></div>
                <p className="guide-text">
                  📸 Enfocá el número de tu entrada<br/>
                  <small>Asegurate de tener buena iluminación</small>
                </p>
              </div>
            </div>
          ) : (
            // Vista previa de la imagen capturada
            <div className="preview-view">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>Leyendo número de entrada...</p>
                </div>
              )}
            </div>
          )}

          <div className="scanner-instructions">
            <p className="instruction-title">📌 ¿Qué estás buscando?</p>
            <div className="example-ticket">
              <div className="example-number">268275132</div>
              <div className="example-label">Número de entrada (8-12 dígitos)</div>
            </div>
            <div className="instruction-note">
              💡 La app busca automáticamente números de 8 a 12 dígitos en el texto
            </div>
          </div>
        </div>

        <div className="scanner-footer">
          {!previewUrl ? (
            // Botones cuando está la cámara activa
            <>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={capturePhoto}>
                📸 Tomar foto
              </button>
              <button className="btn btn-secondary" onClick={selectFromGallery}>
                🖼️ Galería
              </button>
            </>
          ) : (
            // Botones después de capturar
            <>
              <button className="btn btn-ghost" onClick={reset}>
                ↺ Volver a tomar
              </button>
              <button className="btn btn-secondary" onClick={selectFromGallery}>
                🖼️ Otra imagen
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}