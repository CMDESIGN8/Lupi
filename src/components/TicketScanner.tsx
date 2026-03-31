// src/components/TicketScanner.tsx
import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

interface TicketScannerProps {
  onScan: (ticketNumber: string, originalText: string) => void;
  onClose: () => void;
}

export function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Función mejorada para mejorar la imagen antes de OCR
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
            // Umbral dinámico para mejor detección
            const enhanced = gray > 80 ? 255 : 0;
            data[i] = enhanced;
            data[i+1] = enhanced;
            data[i+2] = enhanced;
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = imageDataUrl;
    });
  };

  // Función mejorada para extraer números con múltiples estrategias
  const extractTicketNumber = (text: string): string | null => {
    console.log('🔍 Texto completo recibido:', text);
    
    // Estrategia 1: Buscar patrones específicos de números largos
    const patterns = [
      // Números de 8-12 dígitos aislados
      /\b(\d{8,12})\b/g,
      // Números después de palabras clave
      /(?:entrada|ticket|n[°º]|numero|nro)\s*:?\s*(\d{6,12})/gi,
      // Números al final de línea
      /[\n\r](\d{8,12})[\n\r]/g,
      // Números que parecen códigos (con letras alrededor pero extraer solo números)
      /[A-Z]{0,3}(\d{8,12})[A-Z]{0,3}/g,
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const numbers = match.replace(/[^0-9]/g, '');
          if (numbers.length >= 8 && numbers.length <= 12) {
            console.log('✅ Encontrado por patrón:', numbers);
            return numbers;
          }
        }
      }
    }
    
    // Estrategia 2: Buscar todos los números y tomar el más largo
    const allNumbers = text.match(/\d+/g);
    console.log('🔢 Todos los números encontrados:', allNumbers);
    
    if (allNumbers && allNumbers.length > 0) {
      // Ordenar por longitud (mayor a menor)
      const sorted = allNumbers.sort((a, b) => b.length - a.length);
      const longest = sorted[0];
      
      if (longest.length >= 8) {
        console.log('✅ Tomando el número más largo:', longest);
        return longest;
      }
      
      // Si el más largo es de 6-7 dígitos, podría ser válido
      if (longest.length >= 6) {
        console.log('⚠️ Usando número de 6-7 dígitos:', longest);
        return longest;
      }
    }
    
    // Estrategia 3: Buscar números que parezcan válidos (no contengan solo ceros)
    if (allNumbers) {
      const validNumbers = allNumbers.filter(num => 
        num.length >= 6 && 
        !/^0+$/.test(num) &&  // No son solo ceros
        !/^\d{1,3}$/.test(num) // No son números muy pequeños
      );
      
      if (validNumbers.length > 0) {
        console.log('✅ Número válido encontrado:', validNumbers[0]);
        return validNumbers[0];
      }
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
      
      const worker = await createWorker('spa+eng'); // Usar español e inglés
      
      // Configurar parámetros para mejor reconocimiento
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: 6, // Corregido: número, no string
        preserve_interword_spaces: '0',
        textord_force_make_prop_words: '1',
        tessedit_ocr_engine_mode: 1, // Usar LSTM
      });
      
      // Reconocer texto
      const { data: { text } } = await worker.recognize(imageToProcess);
      await worker.terminate();
      
      console.log('📝 Texto reconocido completo:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber) {
        console.log('✅ Número encontrado:', ticketNumber);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber, text);
      } else {
        console.log('❌ No se encontró número válido');
        setError('No se pudo encontrar el número de entrada. Intentá: \n• Mejor iluminación\n• Enfocar mejor el número\n• Asegurarte que el número esté dentro del marco');
        
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
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
      setPreviewUrl(imageDataUrl);
      
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
            <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>
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
                  <small>El número suele ser de 8-12 dígitos</small>
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
              <li>✓ Iluminación clara (evitá sombras)</li>
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