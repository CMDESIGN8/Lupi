// src/components/TourButton.tsx
import { useState } from 'react';

export function TourButton({ onRestartTour }: { onRestartTour: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onRestartTour}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--accent), #0f6bc0)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 999,
          transition: 'transform 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🎓
      </button>
      
      {showTooltip && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          right: '20px',
          background: 'var(--surface)',
          border: '1px solid var(--accent)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          Ver tutorial nuevamente 🎓
        </div>
      )}
    </div>
  );
}