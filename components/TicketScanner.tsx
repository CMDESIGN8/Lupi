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
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);

  // 1. Inicializar Tesseract una sola vez
  useEffect(() => {
    async function initWorker() {
      try {
        const worker = await createWorker('spa');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789Noº. ',
          tessedit_pageseg_mode: '6' as any, // Asume un bloque de texto único
        });
        workerRef.current = worker;
        setIsWorkerReady(true);
      } catch (err) {
        setError('Error al cargar el motor de lectura.');
      }
    }
    initWorker();
    startCamera();

    return () => {
      workerRef.current?.terminate();
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
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
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Revisa los permisos.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const extractTicketNumber = (text: string): string | null => {
    // Limpieza: quitar espacios y símbolos comunes que el OCR confunde
    const cleanText = text.replace(/[\s.º°No]/g, '');
    const matches = cleanText.match(/\d{4,8}/g);
    
    if (matches) {
      // Priorizar el que tenga exactamente 8 dígitos (formato estándar)
      const eightDigit = matches.find(m => m.length === 8);
      return eightDigit || matches[0];
    }
    return null;
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !workerRef.current || !isWorkerReady) return;

    setIsProcessing(true);
    setError('');

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // --- LÓGICA DE RECORTE (CROP) ---
    // Calculamos el área del recuadro blanco (80% ancho, 200px alto)
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;
    const actualWidth = video.videoWidth;
    const actualHeight = video.videoHeight;

    const scaleX = actualWidth / displayWidth;
    const scaleY = actualHeight / displayHeight;

    const cropWidth = actualWidth * 0.8;
    const cropHeight = 200 * scaleY;
    const cropX = (actualWidth - cropWidth) / 2;
    const cropY = (actualHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Aplicar filtros de imagen para mejorar lectura
    ctx.filter = 'contrast(150%) grayscale(100%)';
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(imageDataUrl);

    try {
      const { data: { text } } = await workerRef.current.recognize(imageDataUrl);
      const ticketNumber = extractTicketNumber(text);

      if (ticketNumber) {
        if ('vibrate' in navigator) navigator.vibrate(200);
        onScan(ticketNumber, text);
      } else {
        setError('No se detectó el número. Asegúrate que esté dentro del recuadro y bien iluminado.');
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      setError('Error al procesar la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px', backgroundColor: '#1a1a1a', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', color: '#fff'
      }}>
        <span style={{ fontWeight: 'bold' }}>Lectura de Ticket</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>✕</button>
      </div>

      {/* Camera / Preview Area */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!previewUrl ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Overlay Recuadro */}
            <div style={{
              position: 'absolute', width: '80%', height: '200px',
              border: '2px solid #4CAF50', borderRadius: '8px',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute', bottom: '-30px', width: '100%',
                textAlign: 'center', color: '#4CAF50', fontSize: '12px', fontWeight: 'bold'
              }}>
                PON EL NÚMERO AQUÍ
              </div>
            </div>
          </>
        ) : (
          <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: '90%', border: '2px solid #333' }} />
            {isProcessing && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <div className="spinner" />
                <p>Analizando...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div style={{ padding: '20px', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {error && <div style={{ color: '#ff5252', fontSize: '14px', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {!previewUrl ? (
            <button
              onClick={captureAndProcess}
              disabled={!isWorkerReady || isProcessing}
              style={{
                flex: 1, padding: '15px', backgroundColor: isWorkerReady ? '#4CAF50' : '#666',
                color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold'
              }}
            >
              {isWorkerReady ? '📸 ESCANEAR AHORA' : 'Cargando motor...'}
            </button>
          ) : (
            <button
              onClick={() => { setPreviewUrl(null); setError(''); }}
              style={{
                flex: 1, padding: '15px', backgroundColor: '#333',
                color: '#fff', border: 'none', borderRadius: '10px'
              }}
            >
              🔄 Reintentar
            </button>
          )}
        </div>
      </div>

      <style>{`
        .spinner {
          width: 30px; height: 30px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
