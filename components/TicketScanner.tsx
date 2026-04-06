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
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Mejorar contraste y convertir a blanco y negro
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i+1] + data[i+2]) / 3;
            // Umbral más bajo para detectar números
            const enhanced = gray > 50 ? 255 : 0;
            data[i] = enhanced;
            data[i+1] = enhanced;
            data[i+2] = enhanced;
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.98));
      };
      img.src = imageDataUrl;
    });
  };

  // Función mejorada para extraer números del formato específico de la entrada
  const extractTicketNumber = (text: string): string | null => {
    console.log('🔍 Texto completo recibido:', text);
    
    // Patrones específicos para tu formato de entrada
    const patterns = [
      // Patrón: Nº 00001681 (formato exacto de tu entrada)
      /N[°º]\s*(\d{8,10})/gi,
      // Patrón: NÚMERO seguido de dígitos
      /NUMERO\s*:?\s*(\d{8,10})/gi,
      // Patrón: NRO seguido de dígitos
      /NRO\s*:?\s*(\d{8,10})/gi,
      // Patrón: ENTRADA seguido de dígitos
      /ENTRADA\s*:?\s*(\d{8,10})/gi,
      // Patrón: números de 8 dígitos exactos (formato de tu entrada)
      /\b(\d{8})\b/g,
      // Patrón: números de 6-10 dígitos
      /\b(\d{6,10})\b/g,
      // Patrón: después de N° con o sin espacio
      /N[°º]\s*(\d+)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const numbers = match.replace(/[^0-9]/g, '');
          // Aceptar números de 6-10 dígitos (tu formato es 8)
          if (numbers.length >= 6 && numbers.length <= 10) {
            console.log('✅ Encontrado por patrón:', numbers);
            return numbers;
          }
        }
      }
    }
    
    // Estrategia alternativa: buscar todos los números
    const allNumbers = text.match(/\d+/g);
    console.log('🔢 Todos los números encontrados:', allNumbers);
    
    if (allNumbers && allNumbers.length > 0) {
      // Buscar números de exactamente 8 dígitos primero (formato de tu entrada)
      const exactEight = allNumbers.find(num => num.length === 8);
      if (exactEight) {
        console.log('✅ Número exacto de 8 dígitos:', exactEight);
        return exactEight;
      }
      
      // Luego buscar números de 6-10 dígitos
      const validNumbers = allNumbers.filter(num => num.length >= 6 && num.length <= 10);
      
      if (validNumbers.length > 0) {
        // Ordenar por longitud (priorizar los más largos)
        const sorted = validNumbers.sort((a, b) => b.length - a.length);
        const candidate = sorted[0];
        console.log('✅ Número candidato:', candidate);
        return candidate;
      }
    }
    
    return null;
  };

  // Función para procesar imagen con OCR
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('🔍 Procesando imagen con OCR...');
      
      let imageToProcess = imageFile;
      
      // Mejorar calidad de imagen si es dataURL
      if (typeof imageToProcess === 'string' && imageToProcess.startsWith('data:')) {
        console.log('📸 Mejorando calidad de imagen...');
        imageToProcess = await enhanceImage(imageToProcess);
      }
      
      const worker = await createWorker('spa+eng'); // Usar español e inglés
      
      // Configurar para mejor reconocimiento de números
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789N°ºABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: '6', // Modo de segmentación: bloque de texto uniforme
        preserve_interword_spaces: '0',
      });
      
      const { data: { text } } = await worker.recognize(imageToProcess);
      await worker.terminate();
      
      console.log('📝 Texto reconocido:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber) {
        console.log('✅ Número encontrado:', ticketNumber);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber, text);
      } else {
        console.log('❌ No se encontró número válido');
        setError(`❌ No se pudo encontrar el número de entrada.
        
📌 Intentá:
• Mejor iluminación (sin sombras)
• Enfocar bien el "Nº 00001681"
• Acercar la cámara al número
• Mantener la cámara estable
• Asegurar que el papel esté plano`);
        
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setError('❌ Error al procesar la imagen. Intentá nuevamente.');
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
        setError('📷 Necesitamos acceso a la cámara para leer tu entrada.');
      } else {
        setError('❌ Error al acceder a la cámara.');
      }
    }
  };

  // Capturar foto
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

  // Seleccionar de galería
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
            <div className="alert alert-error" style={{ 
              whiteSpace: 'pre-line', 
              marginBottom: '12px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #ffcdd2'
            }}>
              {error}
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
                  <small>Busca el formato: Nº 00001681</small>
                </p>
              </div>
            </div>
          ) : (
            <div className="preview-view">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>🔍 Leyendo número de entrada...</p>
                  <small style={{ fontSize: '11px', marginTop: '8px' }}>Esto puede tomar unos segundos</small>
                </div>
              )}
            </div>
          )}

          <div className="scanner-instructions">
            <p className="instruction-title">📌 Buscá el número en este formato:</p>
            <div className="example-ticket">
              <div className="example-number">Nº 00001681</div>
              <div className="example-label">El número tiene 8 dígitos</div>
            </div>
            <p className="instruction-title" style={{ marginTop: '12px' }}>💡 Consejos:</p>
            <ul className="instruction-list">
              <li>✓ Buena iluminación (evitá sombras)</li>
              <li>✓ Enfocá bien el número</li>
              <li>✓ Mantené la cámara estable</li>
              <li>✓ El papel debe estar plano</li>
            </ul>
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
