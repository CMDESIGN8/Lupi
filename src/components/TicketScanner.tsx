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
  const [cameraError, setCameraError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Función para mejorar la imagen
  const enhanceImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let targetWidth = img.width;
        let targetHeight = img.height;
        
        if (img.width < 1000) {
          const scale = 1000 / img.width;
          targetWidth = 1000;
          targetHeight = img.height * scale;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const data = imageData.data;
          
          const contrast = 1.4;
          const brightness = 10;
          
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
            data[i+1] = Math.min(255, Math.max(0, (data[i+1] - 128) * contrast + 128 + brightness));
            data[i+2] = Math.min(255, Math.max(0, (data[i+2] - 128) * contrast + 128 + brightness));
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageDataUrl;
    });
  };

  const extractTicketNumber = (text: string): string | null => {
    console.log('🔍 Texto OCR:', text);
    
    let normalized = text.toUpperCase()
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/Z/g, '2')
      .replace(/S/g, '5')
      .replace(/B/g, '8');
    
    const patterns = [
      /N[°º]\s*(\d{8,12})/i,
      /N[°º]\s+(\d{8,12})/i,
      /(?:ENTRADA|TICKET|NRO|NUMERO)[^\d]*(\d{8,12})/i,
      /\b(\d{8,12})\b/,
      /0{2,}(\d{6,10})/,
    ];
    
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        const num = match[1];
        if (num.length >= 8 && num.length <= 12) {
          console.log('✅ Número encontrado:', num);
          return num;
        }
      }
    }
    
    const allNumbers = normalized.match(/\d+/g);
    if (allNumbers && allNumbers.length > 0) {
      const candidates = allNumbers.filter(n => n.length >= 7);
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.length - a.length);
        const best = candidates[0];
        if (best.length >= 8) {
          console.log('✅ Número encontrado (fallback):', best);
          return best;
        }
      }
    }
    
    return null;
  };

  const processImage = async (imageSource: File | string) => {
    setIsProcessing(true);
    setError('');
    setCameraError('');
    
    try {
      console.log('🔍 Iniciando OCR...');
      
      let imageDataUrl: string;
      
      if (typeof imageSource === 'string') {
        imageDataUrl = imageSource;
      } else {
        imageDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageSource);
        });
      }
      
      const enhancedImage = await enhanceImage(imageDataUrl);
      
      const worker = await createWorker('spa');
      
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789N°ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      });
      
      const { data: { text } } = await worker.recognize(enhancedImage);
      await worker.terminate();
      
      console.log('📝 Texto OCR:', text);
      
      const ticketNumber = extractTicketNumber(text);
      
      if (ticketNumber) {
        console.log('✅ Éxito! Número:', ticketNumber);
        if ('vibrate' in navigator) navigator.vibrate(100);
        onScan(ticketNumber, text);
      } else {
        setError('⚠️ No se pudo encontrar el número de entrada.\n\nConsejos:\n• Mejor iluminación\n• Enfocar bien el número\n• El número tiene 8 dígitos');
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      }
    } catch (err: any) {
      console.error('❌ Error OCR:', err);
      setError('Error al procesar la imagen. Verificá que la foto sea clara.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
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
      console.error('Error al iniciar cámara:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Permiso denegado. Permití el acceso a la cámara en la configuración del navegador.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Usá la opción "Galería" para subir una foto.');
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
        setPreviewUrl(imageDataUrl);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        processImage(imageDataUrl);
      }
    }
  };

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
    setCameraError('');
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

  // Estilos inline para asegurar centrado correcto
  const styles = {
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: '#12121a',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#12121a',
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      margin: 0,
      color: '#fff',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '0',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: '20px',
    },
    errorAlert: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      color: '#991b1b',
      fontSize: '14px',
      whiteSpace: 'pre-line' as const,
    },
    cameraView: {
      position: 'relative' as const,
      backgroundColor: '#000',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '16px',
    },
    video: {
      width: '100%',
      height: 'auto',
      display: 'block',
    },
    guideFrame: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      height: '120px',
      border: '2px solid #ffffff',
      borderRadius: '8px',
      boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.5)',
    },
    previewView: {
      position: 'relative' as const,
      backgroundColor: '#12121a',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '16px',
    },
    imagePreview: {
      width: '100%',
      height: 'auto',
      display: 'block',
    },
    processingOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    instructions: {
      backgroundColor: '#12121a',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '16px',
    },
    instructionTitle: {
      fontSize: '13px',
      fontWeight: 600,
      marginBottom: '8px',
      color: '#fff',
    },
    instructionList: {
      fontSize: '12px',
      color: '#fff',
      margin: 0,
      paddingLeft: '20px',
    },
    footer: {
      display: 'flex',
      gap: '8px',
      padding: '16px 20px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#12121a',
    },
    button: {
      flex: 1,
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      transition: 'background-color 0.2s',
    },
    buttonGhost: {
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: '1px solid #d1d5db',
    },
    buttonPrimary: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    buttonSecondary: {
      backgroundColor: '#10b981',
      color: 'white',
    },
  };

  return (
    <div style={styles.modal}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>📷 Leer entrada</h3>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Error de cámara */}
          {cameraError && (
            <div style={styles.errorAlert}>
              ⚠️ {cameraError}
            </div>
          )}

          {/* Error de OCR */}
          {error && !cameraError && (
            <div style={styles.errorAlert}>
              ⚠️ {error}
            </div>
          )}

          {!previewUrl ? (
            <>
              <div style={styles.cameraView}>
                {!cameraError ? (
                  <>
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={styles.video}
                    />
                    <div style={styles.guideFrame}></div>
                  </>
                ) : (
                  <div style={{
                    backgroundColor: '#12121a',
                    padding: '40px',
                    textAlign: 'center',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      No se pudo acceder a la cámara<br/>
                      Usá la opción "Galería" para subir una foto
                    </p>
                  </div>
                )}
              </div>
              
              <div style={styles.instructions}>
                <p style={styles.instructionTitle}>📌 Consejos para mejor lectura:</p>
                <ul style={styles.instructionList}>
                  <li>✓ Iluminación clara (evitá sombras)</li>
                  <li>✓ Enfocá bien el número</li>
                  <li>✓ Mantené la cámara estable</li>
                  <li>✓ El número tiene 8 dígitos (ej: 00001680)</li>
                </ul>
              </div>
            </>
          ) : (
            <div style={styles.previewView}>
              <img src={previewUrl} alt="Preview" style={styles.imagePreview} />
              {isProcessing && (
                <div style={styles.processingOverlay}>
                  <div style={styles.spinner}></div>
                  <p style={{ marginTop: '12px' }}>Leyendo número de entrada...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          {!previewUrl ? (
            <>
              <button 
                style={{ ...styles.button, ...styles.buttonGhost }}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={capturePhoto}
                disabled={!!cameraError}
              >
                📸 Tomar foto
              </button>
              <button 
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={selectFromGallery}
              >
                🖼️ Galería
              </button>
            </>
          ) : (
            <>
              <button 
                style={{ ...styles.button, ...styles.buttonGhost }}
                onClick={reset}
              >
                ↺ Volver a tomar
              </button>
              <button 
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={selectFromGallery}
              >
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

      {/* Animación del spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
