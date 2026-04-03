// components/ClickEffect.tsx
import React, { useEffect } from 'react';
import { useVisualEffects } from '../hooks/useVisualEffects';

interface ClickEffectProps {
  children: React.ReactNode;
  onPointsGain?: (points: number, x: number, y: number) => void;
}

export function ClickEffect({ children, onPointsGain }: ClickEffectProps) {
  const { showFloatingPoints } = useVisualEffects();
  
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Buscar si el elemento clickeado tiene datos de puntos
    const pointsElement = target.closest('[data-points]');
    if (pointsElement) {
      const points = parseInt(pointsElement.getAttribute('data-points') || '0');
      const isBonus = pointsElement.getAttribute('data-bonus') === 'true';
      
      if (points > 0) {
        showFloatingPoints(points, e.clientX, e.clientY, isBonus);
        if (onPointsGain) onPointsGain(points, e.clientX, e.clientY);
      }
    }
  };
  
  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}