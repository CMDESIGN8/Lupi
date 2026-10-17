// src/components/CountdownTimer.tsx
import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsComplete(true);
        if (onComplete) onComplete();
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ff8c00, #ffd700)',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        animation: 'pulse 1s infinite'
      }}>
        <span style={{ fontSize: '32px' }}>🎲</span>
        <h3 style={{ margin: '8px 0 0 0' }}>¡Sorteo en curso!</h3>
        <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Los ganadores se anunciarán pronto</p>
      </div>
    );
  }

  return (
    <div className="countdown-timer" style={{
      background: 'linear-gradient(135deg, var(--accent), #0f6bc0)',
      borderRadius: '16px',
      padding: '16px',
      textAlign: 'center',
      marginBottom: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontSize: '12px', opacity: 0.9, letterSpacing: '1px' }}>
        🎯 PRÓXIMO SORTEO SEMANAL
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center', 
        marginTop: '12px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '4px 12px',
            minWidth: '60px'
          }}>
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>Días</div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', alignSelf: 'center' }}>:</div>
        <div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '4px 12px',
            minWidth: '60px'
          }}>
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>Horas</div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', alignSelf: 'center' }}>:</div>
        <div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '4px 12px',
            minWidth: '60px'
          }}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>Min</div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', alignSelf: 'center' }}>:</div>
        <div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '4px 12px',
            minWidth: '60px'
          }}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px' }}>Seg</div>
        </div>
      </div>
      <div style={{ fontSize: '11px', marginTop: '12px', opacity: 0.8 }}>
        🎟️ 3 ganadores | 🏆 Entradas gratis
      </div>
    </div>
  );
}