// src/components/campaign/TrainingModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal de selección de minijuego + visualización de resultados
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { TrainingResult, TrainingGame, TrainingGameSelector, TrainingStat } from './TrainingGames';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrain: (result: TrainingResult, cardIds: string[]) => Promise<void>;
  deckCardIds: string[];  // IDs de las cartas del mazo activo
}

// Mapeo de juegos a estadísticas que mejoran
const GAME_STATS: Record<string, TrainingStat> = {
  shooting: 'finishing',
  dribbling: 'dribbling', 
  defending: 'defending',
  passing: 'passing',
  physical: 'physical'
};

const RUSSO = "'Russo One', sans-serif";

export function TrainingModal({ isOpen, onClose, onTrain, deckCardIds }: TrainingModalProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<TrainingResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  if (!isOpen) return null;

  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId);
    setGameResult(null);
  };

  const handleGameComplete = (result: TrainingResult) => {
    setGameResult(result);
    setIsTraining(true);
    
    // Aplicar el entrenamiento
    onTrain(result, deckCardIds).then(() => {
      setIsTraining(false);
      // Pequeño delay antes de cerrar para ver el resultado
      setTimeout(() => {
        handleClose();
      }, 2000);
    });
  };

  const handleClose = () => {
    setSelectedGame(null);
    setGameResult(null);
    setIsTraining(false);
    onClose();
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
    setGameResult(null);
  };

  // Si hay un resultado, mostrarlo
  if (gameResult) {
    return (
      <div style={styles.overlay} onClick={handleClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.resultContainer}>
            <div style={styles.resultIcon}>
              {gameResult.grade === 'S' && '🏆'}
              {gameResult.grade === 'A' && '⭐'}
              {gameResult.grade === 'B' && '👍'}
              {gameResult.grade === 'C' && '📈'}
            </div>
            
            <div style={styles.resultTitle}>
              ¡{gameResult.grade === 'S' ? 'PERFECTO' : 
                 gameResult.grade === 'A' ? 'EXCELENTE' :
                 gameResult.grade === 'B' ? 'BIEN' : 'MEJORABLE'}!
            </div>
            
            <div style={styles.resultStats}>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>CALIFICACIÓN:</span>
                <span style={{...styles.statValue, color: getGradeColor(gameResult.grade)}}>
                  {gameResult.grade}
                </span>
              </div>
              
              <div style={styles.statRow}>
                <span style={styles.statLabel}>MEJORA:</span>
                <span style={styles.statValue}>+{gameResult.delta}</span>
              </div>
              
              <div style={styles.statRow}>
                <span style={styles.statLabel}>BONO XP:</span>
                <span style={styles.statValue}>+{gameResult.xpBonus}</span>
              </div>
            </div>
            
            <div style={styles.resultMessage}>
              {gameResult.message}
            </div>
            
            {isTraining && (
              <div style={styles.loadingSpinner}>
                <div style={styles.spinner}></div>
                <span style={styles.loadingText}>Aplicando mejoras...</span>
              </div>
            )}
            
            <button 
              onClick={handleClose}
              style={styles.closeBtn}
              disabled={isTraining}
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar selector de juegos
  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>🎮 SELECCIONAR ENTRENAMIENTO</h2>
          <button onClick={handleClose} style={styles.closeButton}>✕</button>
        </div>
        
        <div style={styles.modalBody}>
          {!selectedGame ? (
            <TrainingGameSelector onSelectGame={handleSelectGame} />
          ) : (
            <div>
              <div style={styles.gameHeader}>
                <button onClick={handleBackToGames} style={styles.backButton}>
                  ← Volver
                </button>
                <div style={styles.gameTitle}>
                  {selectedGame === 'shooting' && '🎯 REMATE AL ARCO'}
                  {selectedGame === 'dribbling' && '⚡ GAMBETA RÁPIDA'}
                  {selectedGame === 'defending' && '🛡️ MURO DEFENSIVO'}
                  {selectedGame === 'passing' && '🌀 TIRO LIBRE'}
                  {selectedGame === 'physical' && '💪 ENTRENAMIENTO FÍSICO'}
                </div>
              </div>
              
              <TrainingGame 
                gameId={selectedGame}
                onComplete={handleGameComplete}
                stat={GAME_STATS[selectedGame]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGradeColor(grade: string): string {
  switch(grade) {
    case 'S': return '#FFD700';
    case 'A': return '#00FF87';
    case 'B': return '#00E5FF';
    case 'C': return '#FF6B6B';
    default: return '#fff';
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(135deg, #1a0b2e 0%, #0f0020 100%)',
    borderRadius: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85vh',
    overflow: 'auto',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
  },
  modalTitle: {
    fontSize: 14,
    color: '#FFD700',
    letterSpacing: 2,
    margin: 0,
    fontWeight: 900,
    fontFamily: RUSSO,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 8,
    transition: 'all 0.2s',
  },
  modalBody: {
    padding: 20,
  },
  gameHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: '6px 12px',
    fontSize: 11,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: RUSSO,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: RUSSO,
  },
  resultContainer: {
    textAlign: 'center',
    padding: 20,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#FFD700',
    fontFamily: RUSSO,
  },
  resultStats: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: RUSSO,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultMessage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
    fontStyle: 'italic',
    fontFamily: RUSSO,
  },
  closeBtn: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
    border: 'none',
    borderRadius: 40,
    padding: '12px 24px',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f0020',
    cursor: 'pointer',
    fontFamily: RUSSO,
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    padding: '12px',
    background: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 40,
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid rgba(255, 215, 0, 0.3)',
    borderTopColor: '#FFD700',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 11,
    color: '#FFD700',
    fontFamily: RUSSO,
  },
};

// Añadir la animación del spinner
if (typeof document !== 'undefined' && !document.getElementById('training-modal-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'training-modal-styles';
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}