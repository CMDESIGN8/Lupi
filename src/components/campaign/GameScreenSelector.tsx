// src/components/campaign/GameScreenSelector.tsx
import { useState } from 'react';

interface GameScreenSelectorProps {
  onSelectMode: (mode: 'history' | 'quick' | 'training') => void;
  currentDay: number;
  streak: number;
}

export function GameScreenSelector({ onSelectMode, currentDay, streak }: GameScreenSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const modes = [
    { id: 'history', icon: '📖', title: 'MODO HISTORIA', subtitle: 'Vive la aventura', color: '#ff6b6b' },
    { id: 'quick', icon: '⚡', title: 'PARTIDO RÁPIDO', subtitle: 'Entrena sin presión', color: '#4ecdc4' },
    { id: 'training', icon: '💪', title: 'ENTRENAMIENTO', subtitle: 'Mejora tus habilidades', color: '#ffe66d' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.gameTitle}>
          <span style={styles.titleGlow}>⚽</span>
          <h1>DREAM LEAGUE</h1>
          <span style={styles.titleGlow}>🏆</span>
        </div>
        <div style={styles.statsBar}>
          <div>📅 DÍA {currentDay}</div>
          <div>🔥 RACHA {streak}</div>
        </div>
      </div>

      <div style={styles.menuGrid}>
        {modes.map((mode, idx) => (
          <button
            key={mode.id}
            style={{
              ...styles.menuButton,
              borderColor: idx === selectedIndex ? mode.color : 'rgba(255,255,255,0.2)',
              boxShadow: idx === selectedIndex ? `0 0 20px ${mode.color}` : 'none',
            }}
            onClick={() => {
              setSelectedIndex(idx);
              onSelectMode(mode.id as any);
            }}
          >
            <div style={styles.buttonIcon}>{mode.icon}</div>
            <div style={styles.buttonTitle}>{mode.title}</div>
            <div style={styles.buttonSubtitle}>{mode.subtitle}</div>
            <div style={{ ...styles.buttonBg, background: mode.color }} />
          </button>
        ))}
      </div>

      <div style={styles.menuFooter}>
        <div style={styles.controls}>
          <span>🔼🔼🔽🔽◀▶◀▶ B A</span>
          <span>Presiona START para comenzar</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(135deg, #0a0f2a, #03050b)',
    borderRadius: 24,
    padding: 30,
    textAlign: 'center',
    border: '2px solid #ffd700',
  },
  header: {
    marginBottom: 40,
  },
  gameTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 0 10px #ff6b6b',
  },
  titleGlow: {
    fontSize: 40,
    animation: 'pulse 1s infinite',
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
    color: '#00ffff',
    fontSize: 14,
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
    marginBottom: 40,
  },
  menuButton: {
    position: 'relative',
    padding: '30px 20px',
    background: 'rgba(0,0,0,0.6)',
    border: '2px solid',
    borderRadius: 20,
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.3s',
  },
  buttonIcon: {
    fontSize: 48,
    marginBottom: 10,
    position: 'relative',
    zIndex: 2,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    position: 'relative',
    zIndex: 2,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    position: 'relative',
    zIndex: 2,
  },
  buttonBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    transition: 'opacity 0.3s',
  },
  menuFooter: {
    borderTop: '1px solid rgba(255,215,0,0.3)',
    paddingTop: 20,
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: '#888',
    fontSize: 12,
  },
};