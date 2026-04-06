// src/components/TicketScanner.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

interface TicketScannerProps {
  onScan: (ticketNumber: string, originalText: string) => void;
  onClose: () => void;
}

export function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // 1. MEJOR PROCESAMIENTO DE IMAGEN
  const enhanceImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Escalamiento más inteligente
        const targetWidth = Math.min(img.width * 1.5, 1920);
        const targetHeight = (targetWidth * img.height) / img.width;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Mejora avanzada de imagen
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Aplicar CLAHE-like (contraste adaptativo)
          const histogram = new Array(256).fill(0);
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
            histogram[gray]++;
          }
          
          // Calcular umbral adaptativo
          const total = data.length / 4;
          let sum = 0;
          let threshold = 128;
          for (let i = 0; i < 256; i++) {
            sum += histogram[i];
            if (sum > total * 0.5) {
              threshold = i;
              break;
            }
          }
          
          // Aplicar mejora y reducción de ruido
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            const enhanced = gray > threshold ? 255 : Math.max(0, gray - 20);
            const value = Math.min(255, enhanced);
            data[i] = value;
            data[i+1] = value;
            data[i+2] = value;
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = imageDataUrl;
    });
  };

  // 2. EXTRACCIÓN MÁS ROBUSTA
  const extractTicketNumber = (text: string): string | null => {
    console.log('🔍 Texto OCR:', text);
    
    // Limpieza más agresiva
    const cleanText = text
      .replace(/[^\w\s\d]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    
    // Patrones mejorados
    const patterns = [
      // Patrón específico para tu formato
      /N[°º]\s*0*(\d{6,12})/gi,
      /ENTRADA\s*N[°º]\s*0*(\d{6,12})/gi,
      /TICKET\s*N[°º]\s*0*(\d{6,12})/gi,
      // Patrones generales
      /(?:N[°º]|NUMERO|NRO)\s*:?\s*0*(\d{6,12})/gi,
      /\b0*(\d{8,12})\b/g,
      /(?:ENTRADA|TICKET)\s*:?\s*0*(\d{6,12})/gi,
    ];
    
    // Buscar con patrones específicos primero
    for (const pattern of patterns) {
      const matches = cleanText.matchAll(pattern);
      for (const match of matches) {
        const number = match[1] || match[0];
        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (cleanNumber.length >= 6) {
          console.log('✅ Match con patrón:', cleanNumber);
          return cleanNumber.padStart(8, '0');
        }
      }
    }
    
    // Extraer todos los números
    const allNumbers = cleanText.match(/\d+/g);
    if (!allNumbers) return null;
    
    // Análisis de contexto (buscar números cerca de palabras clave)
    const words = cleanText.split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const numberMatch = word.match(/\d+/);
      if (numberMatch) {
        const number = numberMatch[0];
        let score = 0;
        
        // Longitud ideal
        if (number.length >= 6 && number.length <= 12) score += 10;
        if (number.length >= 8) score += 5;
        
        // Contexto cercano
        const context = words.slice(Math.max(0, i-2), Math.min(words.length, i+3)).join(' ');
        if (/ENTRADA|TICKET|N[°º]|NUMERO|NRO/i.test(context)) score += 20;
        
        // Evitar números muy pequeños
        if (number.length < 4) score = -1;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = number;
        }
      }
    }
    
    if (bestMatch && bestMatch.length >= 6) {
      console.log('✅ Mejor match por contexto:', bestMatch);
      return bestMatch.padStart(8, '0');
    }
    
    // Fallback: el número más largo
    const longest = allNumbers.reduce((a, b) => a.length > b.length ? a : b, '');
    if (longest.length >= 6) {
      console.log('⚠️ Fallback - número más largo:', longest);
      return longest.padStart(8, '0');
    }
    
    return null;
  };

  // 3. CAPTURA AUTOMÁTICA MEJORADA
  const analyzeFrameForQuality = () => {
    if (!videoRef.current || !canvasRef.current || !autoCapture || isProcessing) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData) return;
    
    const data = imageData.data;
    let sum = 0;
    let variance = 0;
    
    // Calcular nitidez usando variación de Laplaciano
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      sum += gray;
    }
    
    const mean = sum / (data.length / 4);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      variance += Math.pow(gray - mean, 2);
    }
    
    const sharpness = Math.sqrt(variance / (data.length / 4));
    
    // Capturar automáticamente si la imagen es nítida
    if (sharpness > 30 && !isProcessing) {
      setAutoCapture(false);
      capturePhoto();
    }
  };

  // 4. PROCESAMIENTO OPTIMIZADO
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');
    
    const startTime = Date.now();
    
    try {
      console.log('🔍 Iniciando OCR...');
      
      let imageToProcess = imageFile;
      
      if (typeof imageToProcess === 'string' && imageToProcess.startsWith('data:')) {
        imageToProcess = await enhanceImage(imageToProcess);
      }
      
      // Usar worker persistente para mejor performance
      const worker = await createWorker('spa+eng');
      
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: '6', // Modo de segmentación para texto uniforme
        preserve_interword_spaces: '0',
        tessedit_ocr_engine_mode: '3', // Modo combinado LSTM + Legacy
      });
      
      const { data: { text, confidence } } = await worker.recognize(imageToProcess);
      await worker.terminate();
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ OCR completado en ${processingTime}ms, confianza: ${confidence}`);
      console.log('📝 Texto:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber) {
        console.log('✅ Número encontrado:', ticketNumber);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber, text);
      } else {
        throw new Error('Número no encontrado');
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setError('No se pudo leer el número. Intentá:\n• Mejor iluminación\n• Enfocar mejor\n• Limpiar la lente');
      
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. CÁMARA CON AUTOENFOQUE
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 4/3 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        
        // Iniciar análisis automático después de 1 segundo
        setTimeout(() => setAutoCapture(true), 1000);
      }
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      if (err.name === 'NotAllowedError') {
        setError('📱 Necesitamos acceso a la cámara para leer tu entrada.\nPor favor, permití el acceso.');
      } else {
        setError('❌ Error al acceder a la cámara.\nVerificá que no esté siendo usada por otra app.');
      }
    }
  };

  // 6. CAPTURA CON PREVIEW
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(imageDataUrl);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      processImage(imageDataUrl);
    }
  };

  // 7. LOOP DE ANÁLISIS
  useEffect(() => {
    if (autoCapture && cameraReady && !isProcessing) {
      const analyzeLoop = () => {
        analyzeFrameForQuality();
        animationFrameRef.current = requestAnimationFrame(analyzeLoop);
      };
      animationFrameRef.current = requestAnimationFrame(analyzeLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoCapture, cameraReady, isProcessing]);

  // Resto de funciones (selectFromGallery, handleFileSelect, reset)
  const selectFromGallery = () => fileInputRef.current?.click();
  
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
    setAutoCapture(false);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // UI mejorada
  return (
    <div className="scanner-modal">
      <div className="scanner-container">
        <div className="scanner-header">
          <h3>🎫 Escáner de Entradas</h3>
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
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <div className="camera-overlay">
                <div className="scanning-frame">
                  <div className="scanning-line"></div>
                </div>
                {autoCapture && !isProcessing && (
                  <div className="auto-capture-indicator">
                    🔍 Buscando número...
                  </div>
                )}
              </div>
              
              <div className="camera-guide">
                <p>📸 Enfocá el número de entrada</p>
                <small>Captura automática al enfocar correctamente</small>
              </div>
            </div>
          ) : (
            <div className="preview-view">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>🔍 Leyendo entrada...</p>
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="scanner-footer">
          {!previewUrl ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={capturePhoto}
                disabled={isProcessing}
              >
                📸 Tomar foto
              </button>
              <button className="btn btn-secondary" onClick={selectFromGallery}>
                🖼️ Galería
              </button>
              <button 
                className={`btn ${autoCapture ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => setAutoCapture(!autoCapture)}
              >
                {autoCapture ? '⏸️ Pausar auto' : '▶️ Auto-captura'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={reset}>
                ↺ Volver
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
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
