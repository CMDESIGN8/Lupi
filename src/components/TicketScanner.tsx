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

  // Función para extraer números - SIN LIMITACIONES ESTRICTAS
  const extractTicketNumber = (text: string): string | null => {
    console.log('📝 Texto OCR completo:', text);
    
    // Tomar TODO lo que parezca un número (incluyendo números con ceros a la izquierda)
    const numberMatches = text.match(/[0-9]{4,}/g);
    
    if (numberMatches && numberMatches.length > 0) {
      console.log('🔢 Números encontrados:', numberMatches);
      
      // Priorizar números de 8 dígitos (formato de tu entrada)
      const eightDigit = numberMatches.find(num => num.length === 8);
      if (eightDigit) {
        console.log('✅ Número de 8 dígitos:', eightDigit);
        return eightDigit;
      }
      
      // Si no, tomar el más largo
      const longest = numberMatches.reduce((a, b) => a.length >= b.length ? a : b);
      console.log('✅ Número más largo:', longest);
      return longest;
    }
    
    // Si no encuentra números, buscar patrón N° o Nº
    const nPattern = /N[°º]\s*([0-9]+)/gi;
    const nMatch = nPattern.exec(text);
    if (nMatch && nMatch[1]) {
      console.log('✅ Número después de N°:', nMatch[1]);
      return nMatch[1];
    }
    
    return null;
  };

  // Procesar imagen con OCR - MÁS SIMPLE
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('🚀 Iniciando OCR...');
      
      let imageToProcess = imageFile;
      
      // Si es dataURL, convertir a blob/file
      if (typeof imageToProcess === 'string' && imageToProcess.startsWith('data:')) {
        const blob = await (await fetch(imageToProcess)).blob();
        imageToProcess = new File([blob], 'ticket.jpg', { type: 'image/jpeg' });
      }
      
      // Configuración MÁS SIMPLE de Tesseract
      const worker = await createWorker('spa', 1, {
        logger: m => console.log(m),
      });
      
      // Solo números y letras básicas
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789N°º',
        tessedit_pageseg_mode: '6', // Bloque de texto uniforme
      });
      
      const { data: { text } } = await worker.recognize(imageToProcess);
      await worker.terminate();
      
      console.log('📝 Texto reconocido:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber && ticketNumber.length >= 4) {
        console.log('🎉 ÉXITO - Número encontrado:', ticketNumber);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        onScan(ticketNumber, text);
      } else {
        console.log('❌ No se encontró número');
        setError(`❌ No se encontró el número

Intentá:
• Mejor luz
• Enfocar el Nº 00001681
• El papel debe estar plano
• Cerrar un poco más la cámara`);
        
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (err: any) {
      console.error('Error OCR:', err);
      setError('Error al procesar. Intentá de nuevo.');
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
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error cámara:', err);
      setError('No se pudo acceder a la cámara');
    }
  };

  // Capturar foto
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Mejorar contraste antes de procesar
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          const enhanced = brightness > 80 ? 255 : 0;
          data[i] = enhanced;
          data[i+1] = enhanced;
          data[i+2] = enhanced;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(imageDataUrl);
        
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
            fontSize: '14px'
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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid #fff',
              width: '80%',
              height: '200px',
              borderRadius: '8px',
              boxShadow: '0 0 0 999px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                📸 Enfoca el número
              </div>
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
                <p style={{ marginTop: '16px' }}>Leyendo número...</p>
              </div>
            )}
          </div>
        )}

        <div style={{
          padding: '16px',
          backgroundColor: '#1a1a1a',
          margin: '16px',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '12px' }}>
            📌 Busca el número en este formato:
          </p>
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '12px',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <span style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold' }}>
              Nº 00001681
            </span>
          </div>
        </div>
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
                padding: '12px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={capturePhoto}
              style={{
                flex: 2,
                padding: '12px',
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
                padding: '12px',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🖼️
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={reset}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ↺ Volver
            </button>
            <button 
              onClick={selectFromGallery}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🖼️ Otra
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
