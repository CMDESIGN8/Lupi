// hooks/useVisualEffects.ts
import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useVisualEffects() {
  
  // Mostrar puntos flotantes
  const showFloatingPoints = useCallback((points: number, x: number, y: number, isBonus: boolean = false) => {
    const div = document.createElement('div');
    div.className = `floating-points ${isBonus ? 'bonus' : ''}`;
    div.textContent = `+${points}`;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    div.style.position = 'fixed';
    div.style.zIndex = '10000';
    div.style.pointerEvents = 'none';
    div.style.fontSize = isBonus ? '32px' : '24px';
    div.style.fontWeight = 'bold';
    div.style.color = isBonus ? '#ffd700' : '#189df5';
    div.style.textShadow = '0 0 10px currentColor';
    div.style.animation = 'floatUp 1s ease-out forwards';
    
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 1000);
  }, []);
  
  // Confeti de celebración
  const celebrate = useCallback((intensity: 'light' | 'medium' | 'epic' = 'medium') => {
    const configs = {
      light: {
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      },
      medium: {
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#189df5', '#ffd700', '#ff4d6d']
      },
      epic: {
        particleCount: 300,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#ffd700', '#ff4d6d', '#189df5', '#3dffa0', '#9b59b6'],
        startVelocity: 20,
        decay: 0.9
      }
    };
    
    confetti(configs[intensity]);
    
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
  
  // Efecto de combo
  const showCombo = useCallback((combo: number) => {
    const div = document.createElement('div');
    div.className = 'combo-text';
    div.textContent = `${combo}x COMBO!`;
    div.style.position = 'fixed';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.zIndex = '10000';
    div.style.fontSize = '48px';
    div.style.fontWeight = 'bold';
    div.style.color = '#ff4d6d';
    div.style.textShadow = '0 0 20px #ff4d6d';
    div.style.whiteSpace = 'nowrap';
    div.style.animation = 'comboPulse 0.5s ease-out';
    div.style.pointerEvents = 'none';
    
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 1000);
    
    // Vibración especial para combo
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
  }, []);
  
  // Efecto de nivel up
  const showLevelUp = useCallback((level: number) => {
    // Confeti épico
    celebrate('epic');
    
    // Texto flotante gigante
    const div = document.createElement('div');
    div.className = 'level-up-text';
    div.textContent = `✨ NIVEL ${level} ✨`;
    div.style.position = 'fixed';
    div.style.top = '40%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.zIndex = '10000';
    div.style.fontSize = '48px';
    div.style.fontWeight = 'bold';
    div.style.color = '#ffd700';
    div.style.textShadow = '0 0 30px #ffd700';
    div.style.whiteSpace = 'nowrap';
    div.style.animation = 'levelUpPulse 1s ease-out';
    div.style.pointerEvents = 'none';
    
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 2000);
  }, [celebrate]);
  
  // Efecto de logro desbloqueado
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
    div.style.position = 'fixed';
    div.style.top = '80px';
    div.style.right = '20px';
    div.style.background = 'linear-gradient(135deg, #2a2a3a, #1c1c28)';
    div.style.borderLeft = '4px solid #ffd700';
    div.style.borderRadius = '12px';
    div.style.padding = '12px 20px';
    div.style.zIndex = '10000';
    div.style.animation = 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 2.7s forwards';
    div.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 3000);
    
    // Sonido (opcional)
    try {
      const audio = new Audio('/sounds/achievement.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
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
    div.style.position = 'fixed';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.background = 'linear-gradient(135deg, #ff4d6d, #ff6b4a)';
    div.style.borderRadius = '24px';
    div.style.padding = '24px';
    div.style.zIndex = '10000';
    div.style.animation = 'streakBonusPop 0.5s ease-out';
    div.style.boxShadow = '0 0 50px rgba(255,77,109,0.5)';
    
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 2000);
    
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