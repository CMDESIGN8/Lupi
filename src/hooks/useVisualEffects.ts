// hooks/useVisualEffects.ts (versión completa con confeti casero)
import { useCallback } from 'react';

export function useVisualEffects() {
  
  // Confeti casero
  const celebrate = useCallback((intensity: 'light' | 'medium' | 'epic' = 'medium') => {
    const counts = {
      light: 30,
      medium: 80,
      epic: 150
    };
    
    const particleCount = counts[intensity];
    const colors = ['#189df5', '#ffd700', '#ff4d6d', '#3dffa0', '#9b59b6', '#ff8c00'];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      const startX = Math.random() * window.innerWidth;
      const startY = -20;
      const rotation = Math.random() * 360;
      const duration = Math.random() * 2 + 1;
      const delay = Math.random() * 0.5;
      
      particle.style.cssText = `
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        transform: rotate(${rotation}deg);
        animation: confettiFall ${duration}s ease-out ${delay}s forwards;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), (duration + delay) * 1000);
    }
    
    // Vibración háptica
    if ('vibrate' in navigator) {
      if (intensity === 'epic') {
        navigator.vibrate([100, 50, 100, 50, 200]);
      } else if (intensity === 'medium') {
        navigator.vibrate([50, 30, 50]);
      } else {
        navigator.vibrate(30);
      }
    }
  }, []);
  
  // Mostrar puntos flotantes
  const showFloatingPoints = useCallback((points: number, x: number, y: number, isBonus: boolean = false) => {
    const div = document.createElement('div');
    div.className = `floating-points ${isBonus ? 'bonus' : ''}`;
    div.textContent = `+${points}`;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    
    document.body.appendChild(div);
    
    let startTime: number | null = null;
    const startY = y;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 1000, 1);
      
      const yOffset = progress * -100;
      const scale = 1 + progress * 0.5;
      const opacity = 1 - progress;
      
      div.style.transform = `translateY(${yOffset}px) scale(${scale})`;
      div.style.opacity = opacity.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        div.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }, []);
  
  // Efecto de combo
  const showCombo = useCallback((combo: number) => {
    const div = document.createElement('div');
    div.className = 'combo-text';
    div.textContent = `${combo}x COMBO!`;
    document.body.appendChild(div);
    
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 500, 1);
      
      const scale = 0.5 + progress * 0.7;
      const opacity = 1 - progress;
      
      div.style.transform = `translate(-50%, -50%) scale(${scale})`;
      div.style.opacity = opacity.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        div.remove();
      }
    };
    
    requestAnimationFrame(animate);
    
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
  }, []);
  
  // Efecto de nivel up
  const showLevelUp = useCallback((level: number) => {
    celebrate('epic');
    
    const div = document.createElement('div');
    div.className = 'level-up-text';
    div.textContent = `✨ NIVEL ${level} ✨`;
    document.body.appendChild(div);
    
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 1000, 1);
      
      const scale = 0.5 + progress * 0.8;
      const opacity = 1 - progress * 0.8;
      
      div.style.transform = `translate(-50%, -50%) scale(${scale})`;
      div.style.opacity = opacity.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        div.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }, [celebrate]);
  
  // Efecto de logro
  const showAchievement = useCallback((name: string, icon: string) => {
    const div = document.createElement('div');
    div.className = 'achievement-popup';
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 32px;">${icon}</div>
        <div>
          <div style="font-size: 12px; color: #ffd700; text-transform: uppercase;">¡Logro desbloqueado!</div>
          <div style="font-weight: bold; font-size: 14px;">${name}</div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      if (elapsed < 300) {
        const progress = elapsed / 300;
        div.style.transform = `translateX(${100 - progress * 100}%)`;
        div.style.opacity = progress.toString();
        requestAnimationFrame(animate);
      } else if (elapsed < 2700) {
        div.style.transform = 'translateX(0)';
        div.style.opacity = '1';
        requestAnimationFrame(animate);
      } else if (elapsed < 3000) {
        const progress = (elapsed - 2700) / 300;
        div.style.transform = `translateX(${progress * 100}%)`;
        div.style.opacity = (1 - progress).toString();
        requestAnimationFrame(animate);
      } else {
        div.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }, []);
  
  // Efecto de racha
  const showStreakBonus = useCallback((streak: number, points: number) => {
    const div = document.createElement('div');
    div.className = 'streak-bonus';
    div.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px;">🔥</div>
        <div style="font-size: 24px; font-weight: bold;">${streak} DÍAS</div>
        <div style="font-size: 18px;">+${points} PUNTOS BONUS</div>
      </div>
    `;
    document.body.appendChild(div);
    
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 2000, 1);
      
      const scale = 0.5 + progress * 0.5;
      const opacity = 1 - progress;
      
      div.style.transform = `translate(-50%, -50%) scale(${scale})`;
      div.style.opacity = opacity.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        div.remove();
      }
    };
    
    requestAnimationFrame(animate);
    celebrate('medium');
  }, [celebrate]);
  
  return {
    showFloatingPoints,
    celebrate,
    showCombo,
    showLevelUp,
    showAchievement,
    showStreakBonus
  };
}