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

  // 🔍 Extraer número
  const extractTicketNumber = (text: string): string | null => {
    const numbers = text.match(/\d{4,}/g);
    if (!numbers) return null;

    // Prioridad: 8 dígitos
    const exact = numbers.find(n => n.length === 8);
    if (exact) return exact;

    // Si no, el más largo
    return numbers.sort((a, b) => b.length - a.length)[0];
  };

  // 🧠 PRO: Preprocesamiento fuerte para OCR
  const preprocessImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width * 2;
        canvas.height = img.height * 2;

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i+1] + data[i+2]) / 3;

            // 🔥 Binarización agresiva (clave para números)
            const value = gray > 120 ? 255 : 0;

            data[i] = value;
            data[i+1] = value;
            data[i+2] = value;
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 1.0));
      };

      img.src = imageDataUrl;
    });
  };

  // 🚀 OCR principal
  const processImage = async (imageFile: File | string) => {
    setIsProcessing(true);
    setError('');

    try {
      let processedImage = imageFile;

      if (typeof processedImage === 'string' && processedImage.startsWith('data:')) {
        processedImage = await preprocessImage(processedImage);
      }

      const worker = await createWorker('spa');

      // ✅ FIX DEFINITIVO TS + OCR OPTIMIZADO
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: Number(PSM.SINGLE_WORD), // 🔥 clave
      });

      const { data: { text } } = await worker.recognize(processedImage);
      await worker.terminate();

      const ticket = extractTicketNumber(text);

      if (ticket) {
        if ('vibrate' in navigator) navigator.vibrate(200);
        onScan(ticket, text);
      } else {
        setError(`❌ No se pudo leer el número

Tips:
• Más luz
• Enfocar bien
• Evitar sombras
• Usar galería si falla`);
      }

    } catch (err) {
      console.error(err);
      setError('Error procesando imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  // 📷 Cámara
  const startCamera = async () => {
    try {
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

    } catch {
      setError('No se pudo acceder a la cámara');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    const img = canvas.toDataURL('image/jpeg', 1);
    setPreviewUrl(img);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    processImage(img);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    processImage(file);
  };

  const reset = () => {
    setPreviewUrl(null);
    setError('');
    startCamera();
  };

  useEffect(() => {
    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:9999 }}>
      
      {error && <div style={{color:'red', padding:10}}>{error}</div>}

      {!previewUrl ? (
        <>
          <video ref={videoRef} autoPlay playsInline style={{width:'100%', height:'80%'}} />

          <button onClick={capturePhoto}>📸 Foto</button>
          <button onClick={() => fileInputRef.current?.click()}>Galería</button>
          <button onClick={onClose}>Cerrar</button>
        </>
      ) : (
        <>
          <img src={previewUrl} style={{width:'100%'}} />
          {isProcessing && <p>🔍 Procesando...</p>}

          <button onClick={reset}>Reintentar</button>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
    </div>
  );
}
