// src/components/TicketScanner.tsx
import { useState, useRef, useEffect } from 'react';
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

  // Función para mejorar la imagen antes de OCR
  const enhanceImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Aumentar resolución
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        if (ctx) {
          // Dibujar imagen escalada
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Obtener datos de imagen
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Mejorar contraste y convertir a blanco y negro
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i+1] + data[i+2]) / 3;
            // Aumentar contraste
            const enhanced = gray > 100 ? 255 : 0;
            data[i] = enhanced;     // R
            data[i+1] = enhanced;   // G
            data[i+2] = enhanced;   // B
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageDataUrl;
    });
  };

  // Función mejorada para extraer números
  const extractTicketNumber = (text: string): string | null => {
    console.log('🔍 Texto completo recibido:', text);
    console.log('📏 Longitud del texto:', text.length);
    
    // Limpiar el texto: eliminar caracteres especiales
    const cleanText = text.replace(/[^\w\s\d]/g, ' ');
    console.log('🧹 Texto limpio:', cleanText);
    
    // Mostrar todos los números encontrados
    const allNumbers = cleanText.match(/\d+/g);
    console.log('🔢 Todos los números encontrados:', allNumbers);
    
    if (!allNumbers) return null;
    
    // Buscar números de 8-12 dígitos
    const longNumbers = allNumbers.filter(num => num.length >= 8 && num.length <= 12);
    console.log('📊 Números de 8-12 dígitos:', longNumbers);
    
    if (longNumbers.length > 0) {
      // Priorizar números que no sean solo ceros
      const validNumbers = longNumbers.filter(num => !/^0+$/.test(num));
      return validNumbers.length > 0 ? validNumbers[0] : longNumbers[0];
    }
    
    // Buscar números de 6-7 dígitos (fallback)
    const mediumNumbers = allNumbers.filter(num => num.length >= 6 && num.length <= 7);
    console.log('⚠️ Fallback (6-7 dígitos):', mediumNumbers);
    
    if (mediumNumbers.length > 0) {
      return mediumNumbers[0];
    }
    
    return null;
  };

  // Función para procesar imagen con OCR mejorado
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('🔍 Procesando imagen con OCR...');
      
      let imageToProcess = imageFile;
      
      // Si es una URL de datos, mejorar la imagen
      if (typeof imageToProcess === 'string' && imageToProcess.startsWith('data:')) {
        console.log('📸 Mejorando calidad de imagen...');
        imageToProcess = await enhanceImage(imageToProcess);
      }
      
      const worker = await createWorker('spa');
      
      // Configurar parámetros para mejor reconocimiento
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: '6', // Modo para texto uniforme
        preserve_interword_spaces: '0',
        textord_force_make_prop_words: '1',
      });
      
      // Reconocer texto con opciones
      const { data: { text } } = await worker.recognize(imageToProcess);
      await worker.terminate();
      
      console.log('📝 Texto reconocido:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber) {
        console.log('✅ Número encontrado:', ticketNumber);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber);
      } else {
        console.log('❌ No se encontró número válido');
        setError('No se pudo encontrar el número de entrada. Intentá con mejor iluminación y enfoque.');
        
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setError('Error al procesar la imagen. Intentá nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar cámara
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      if (err.name === 'NotAllowedError') {
        setError('Necesitamos acceso a la cámara para leer tu entrada.');
      } else {
        setError('Error al acceder a la cámara.');
      }
    }
  };

  // Capturar foto con mejor calidad
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Usar resolución más alta
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0); // Máxima calidad
      setPreviewUrl(imageDataUrl);
      
      // Detener stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
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
    startCamera();
  };

  // Iniciar cámara al montar
  useEffect(() => {
    startCamera();
    
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
                  <small>Asegurate de tener buena iluminación y que el texto sea legible</small>
                </p>
              </div>
            </div>
          ) : (
            <div className="preview-view">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>Leyendo número de entrada...</p>
                  <small style={{ fontSize: '11px', marginTop: '8px' }}>Esto puede tomar unos segundos</small>
                </div>
              )}
            </div>
          )}

          <div className="scanner-instructions">
            <p className="instruction-title">📌 Consejos para mejor lectura:</p>
            <ul className="instruction-list">
              <li>✓ Buena iluminación (evitá sombras)</li>
              <li>✓ Enfocá bien el número</li>
              <li>✓ Mantené la cámara estable</li>
              <li>✓ El número debe estar dentro del marco</li>
            </ul>
            <div className="example-ticket">
              <div className="example-number">268275132</div>
              <div className="example-label">Busca números como este (8-12 dígitos)</div>
            </div>
          </div>
        </div>

        <div className="scanner-footer">
          {!previewUrl ? (
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