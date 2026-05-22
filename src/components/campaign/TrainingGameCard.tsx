// src/components/campaign/TrainingGameCard.tsx
import { useState } from 'react';

const COLORS = {
  primary: '#00f3ff',
  secondary: '#ff00ff',
  text: '#ffffff',
  textDim: '#88aaff',
  darkBg: '#0a0a1a',
};

const RUSSO = "'Russo One', sans-serif";

interface GameCardProps {
  game: {
    id: string;
    name: string;
    icon: string;
    stat: string;
    description: string;
    difficulty: string;
    timeSeconds: number;
    color: string;
  };
  disabled: boolean;
  onSelect: () => void;
}

export function TrainingGameCard({ game, disabled, onSelect }: GameCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div 
      style={styles.card}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Efecto glow */}
      <div style={{ ...styles.cardGlow, background: game.color }} />
      
      <div style={styles.cardContent}>
        <div style={{ ...styles.iconContainer, background: `${game.color}22` }}>
          <span style={styles.icon}>{game.icon}</span>
        </div>
        
        <h3 style={styles.name}>{game.name}</h3>
        
        <div style={styles.statsRow}>
          <span style={styles.statBadge}>🎯 +{game.stat === 'finishing' ? 'Remate' : 
            game.stat === 'dribbling' ? 'Gambeta' :
            game.stat === 'defending' ? 'Defensa' :
            game.stat === 'passing' ? 'Pase' : 'Físico'}</span>
          <span style={styles.statBadge}>⏱️ {game.timeSeconds}s</span>
        </div>

        <div style={styles.difficulty}>
          {game.difficulty}
        </div>

        {showDetails && (
          <div style={styles.description}>
            {game.description.split('\n').map((line, i) => (
              <p key={i} style={styles.descText}>{line}</p>
            ))}
          </div>
        )}

        <button 
          onClick={onSelect}
          disabled={disabled}
          style={{
            ...styles.playButton,
            ...(disabled ? styles.playButtonDisabled : {}),
            background: `linear-gradient(135deg, ${game.color}, ${game.color}99)`,
          }}
        >
          {disabled ? '⏳ SIN ENERGÍA' : `⚡ JUGAR AHORA`}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    background: 'rgba(15, 15, 42, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    border: '1px solid rgba(0, 243, 255, 0.2)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.6,
  },
  cardContent: {
    padding: 20,
    textAlign: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  icon: { fontSize: 48 },
  name: { fontSize: 16, color: COLORS.text, marginBottom: 12, fontFamily: RUSSO },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 },
  statBadge: {
    fontSize: 10,
    background: 'rgba(255,255,255,0.1)',
    padding: '4px 8px',
    borderRadius: 12,
    color: COLORS.textDim,
  },
  difficulty: { fontSize: 9, color: COLORS.textDim, marginBottom: 12 },
  description: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    background: 'rgba(0,0,0,0.95)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    zIndex: 10,
    border: `1px solid ${COLORS.primary}`,
  },
  descText: { fontSize: 11, color: COLORS.text, margin: '4px 0', lineHeight: 1.4 },
  playButton: {
    width: '100%',
    border: 'none',
    borderRadius: 30,
    padding: '10px',
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    cursor: 'pointer',
    fontFamily: RUSSO,
    transition: 'transform 0.2s',
    marginTop: 8,
  },
  playButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};