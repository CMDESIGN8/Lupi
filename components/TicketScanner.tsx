// src/components/TicketScanner.tsx
import { useState, useRef, useEffect } from 'react';
import { createWorker, PSM } from 'tesseract.js';

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

  // Función para extraer números
  const extractTicketNumber = (text: string): string | null => {
    console.log('📝 Texto OCR:', text);
    
    // Buscar números de 4 o más dígitos
    const numberMatches = text.match(/[0-9]{4,}/g);
    
    if (numberMatches && numberMatches.length > 0) {
      console.log('🔢 Números encontrados:', numberMatches);
      
      // Buscar número de 8 dígitos (formato de la entrada)
      const eightDigit = numberMatches.find(num => num.length === 8);
      if (eightDigit) {
        console.log('✅ Número de 8 dígitos:', eightDigit);
        return eightDigit;
      }
      
      // Si no, devolver el más largo
      const longest = numberMatches.reduce((a, b) => a.length >= b.length ? a : b);
      console.log('✅ Número más largo:', longest);
      return longest;
    }
    
    // Buscar patrón N° o Nº
    const nPattern = /N[°º]\s*([0-9]+)/gi;
    const nMatch = nPattern.exec(text);
    if (nMatch && nMatch[1]) {
      console.log('✅ Número después de N°:', nMatch[1]);
      return nMatch[1];
    }
    
    return null;
  };

  // Función para mejorar la imagen antes de OCR
  const preprocessImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Aumentar tamaño para mejor reconocimiento
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Mejorar contraste drásticamente
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Convertir a gris
            const gray = (data[i] + data[i+1] + data[i+2]) / 3;
            // Aumentar contraste
            const enhanced = gray > 60 ? 255 : 0;
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

  // Procesar imagen con OCR
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('🚀 Iniciando OCR...');
      
      let processedImage = imageFile;
      
      // Si es dataURL de la cámara, preprocesar
      let processedImage = imageFile;
    if (typeof processedImage === 'string' && processedImage.startsWith('data:')) {
      processedImage = await preprocessImage(processedImage);
    }
    
    const worker = await createWorker('spa');
      
      // Configuración corregida - sin tipo incorrecto
      await worker.setParameters({
      tessedit_char_whitelist: '0123456789N°º',
      tessedit_pageseg_mode: PSM.SINGLE_LINE as any,
    });
    
    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();
      
      console.log('📝 Texto reconocido:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber && ticketNumber.length >= 4) {
        console.log('🎉 Éxito! Número:', ticketNumber);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber, text);
      } else {
        console.log('❌ No se encontró número válido');
        setError(`❌ No se encontró el número

Consejos:
• Usá mejor iluminación
• Enfocá bien el Nº 00001681
• El papel debe estar plano
• Probá con la opción "Galería"`);
        
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setError('Error al procesar la imagen. Intentá de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar cámara con mejor resolución
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Solicitar la mejor resolución posible
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error cámara:', err);
      setError('No se pudo acceder a la cámara. Usá la opción Galería.');
    }
  };

  // Capturar foto con mejor calidad
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Usar el tamaño real del video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Opcional: dibujar un rectángulo guía para enfocar el número
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.6, canvas.height * 0.2);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
        setPreviewUrl(imageDataUrl);
        
        // Detener la cámara
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        processImage(imageDataUrl);
      }
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '16px',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ color: '#fff', margin: 0 }}>📷 Leer entrada</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
        {error && (
          <div style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '16px',
            margin: '16px',
            borderRadius: '8px',
            whiteSpace: 'pre-line',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {error}
          </div>
        )}

        {!previewUrl ? (
          <div style={{ position: 'relative', height: '100%' }}>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '10%',
              right: '10%',
              border: '2px solid #4CAF50',
              height: '15%',
              borderRadius: '8px',
              boxShadow: '0 0 0 999px rgba(0,0,0,0.6)'
            }}>
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                🎯 Enfoca el número aquí
              </div>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: 0,
              right: 0,
              textAlign: 'center',
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '8px',
              fontSize: '12px'
            }}>
              💡 Si no funciona, usá la opción "Galería"
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{
                width: '100%',
                height: 'auto'
              }}
            />
            {isProcessing && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #fff',
                  borderTop: '3px solid #4CAF50',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '16px', fontWeight: 'bold' }}>🔍 Leyendo número...</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Esto puede tomar unos segundos</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        gap: '12px',
        borderTop: '1px solid #333'
      }}>
        {!previewUrl ? (
          <>
            <button 
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={capturePhoto}
              style={{
                flex: 2,
                padding: '14px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📸 Tomar foto
            </button>
            <button 
              onClick={selectFromGallery}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🖼️ Galería
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={reset}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ↺ Volver
            </button>
            <button 
              onClick={selectFromGallery}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🖼️ Galería
            </button>
          </>
        )}
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #333'
      }}>
        <p style={{ color: '#888', margin: 0, fontSize: '11px', textAlign: 'center' }}>
          📌 Ejemplo de número: <strong style={{ color: '#4CAF50' }}>Nº 00001681</strong>
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
