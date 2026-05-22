// src/components/campaign/TrainingModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal de selección de minijuego + visualización de resultados
// VERSIÓN CON VISTA PREVIA DE MEJORA
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { TrainingResult, TrainingGame, TrainingGameSelector, TrainingStat } from './TrainingGames';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrain: (result: TrainingResult, cardIds: string[]) => Promise<void>;
  deckCardIds: string[];
  selectedGame?: {
    id: string;
    name: string;
    icon: string;
    stat: string;
    description: string;
    difficulty: string;
    timeSeconds: number;
    color: string;
  };
  isDevMode?: boolean;
}

// Mapeo de juegos a estadísticas que mejoran
const GAME_STATS: Record<string, TrainingStat> = {
  shooting: 'finishing',
  dribbling: 'dribbling', 
  defending: 'defending',
  passing: 'passing',
  physical: 'physical',
  pace: 'pace',  // ← AGREGAR ESTA LÍNEA
};

// Estadísticas para vista previa
const GRADE_PREVIEW = {
  S: { delta: 8, xp: 200, label: '🏆 PERFECTO', color: '#FFD700', requirement: '30+ pts o 85%+ precisión' },
  A: { delta: 5, xp: 120, label: '⭐ EXCELENTE', color: '#00FF87', requirement: '20+ pts o 70%+ precisión' },
  B: { delta: 3, xp: 70, label: '👍 BIEN', color: '#00E5FF', requirement: '10+ pts o 50%+ precisión' },
  C: { delta: 1, xp: 40, label: '📈 MEJORABLE', color: '#FF6B6B', requirement: 'Menos de 10 pts' },
};

const RUSSO = "'Russo One', sans-serif";

export function TrainingModal({ 
  isOpen, 
  onClose, 
  onTrain, 
  deckCardIds,
  selectedGame: preselectedGame,
  isDevMode = false
}: TrainingModalProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(
    preselectedGame?.id || null
  );
  const [gameResult, setGameResult] = useState<TrainingResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [skipToResult, setSkipToResult] = useState(false);

  if (!isOpen) return null;

  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId);
    setGameResult(null);
  };

  const handleGameComplete = (result: TrainingResult) => {
    setGameResult(result);
    setIsTraining(true);
    
    onTrain(result, deckCardIds).then(() => {
      setIsTraining(false);
      setTimeout(() => {
        handleClose();
      }, 2000);
    });
  };

  const handleClose = () => {
    setSelectedGame(preselectedGame?.id || null);
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

  // Modo dev: skip al resultado
  if (isDevMode && skipToResult) {
    const mockResult: TrainingResult = {
      stat: selectedGame ? GAME_STATS[selectedGame] : 'finishing',
      grade: 'S',
      delta: 8,
      xpBonus: 200,
      message: '🎮 MODO DEV: Entrenamiento simulado exitoso!'
    };
    setTimeout(() => handleGameComplete(mockResult), 1000);
    return (
      <div style={styles.overlay} onClick={handleClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.devSimulating}>
            <div style={styles.spinnerLarge}></div>
            <div style={styles.devText}>🎮 SIMULANDO ENTRENAMIENTO...</div>
            <button onClick={() => setSkipToResult(false)} style={styles.devCancelBtn}>
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar selector de juegos o juego seleccionado con vista previa
  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {preselectedGame ? `🎮 ${preselectedGame.name}` : '🎮 SELECCIONAR ENTRENAMIENTO'}
          </h2>
          {isDevMode && (
            <button 
              onClick={() => setSkipToResult(true)} 
              style={styles.devSkipBtn}
              title="Modo Dev: Saltar entrenamiento"
            >
              🎮 SKIP
            </button>
          )}
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
                  {selectedGame === 'pace' && '🏃‍♂️ CARRERA DE VELOCIDAD'}
                </div>
              </div>

              {/* NUEVO: VISTA PREVIA DE MEJORA */}
              <div style={styles.previewSection}>
                <div style={styles.previewHeader}>
                  <span>📈 POSIBLE MEJORA SEGÚN CALIFICACIÓN</span>
                  <span style={styles.previewHint}>🎯 ¡Jugá mejor para más puntos!</span>
                </div>
                <div style={styles.previewGrid}>
                  {Object.entries(GRADE_PREVIEW).map(([grade, data]) => (
                    <div key={grade} style={{...styles.previewCard, borderColor: data.color}}>
                      <div style={{...styles.previewGrade, color: data.color}}>{data.label}</div>
                      <div style={styles.previewStats}>
                        <span style={styles.previewDelta}>+{data.delta} pts</span>
                        <span style={styles.previewXp}>+{data.xp} XP</span>
                      </div>
                      <div style={styles.previewReq}>{data.requirement}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NUEVO: INFO DEL JUEGO */}
              {preselectedGame && (
                <div style={styles.gameInfoSection}>
                  <div style={styles.gameInfoHeader}>
                    <span>🎮 CÓMO JUGAR</span>
                  </div>
                  <div style={styles.gameInfoContent}>
                    <div style={styles.gameInfoDesc}>{preselectedGame.description}</div>
                    <div style={styles.gameInfoDetails}>
                      <span>⏱️ Duración: {preselectedGame.timeSeconds} segundos</span>
                      <span>🎯 Dificultad: {preselectedGame.difficulty}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <TrainingGame 
                gameId={selectedGame}
                onComplete={handleGameComplete}
                stat={GAME_STATS[selectedGame]}
                isDevMode={isDevMode}
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
    zIndex: 1001,
  },
  modal: {
    background: 'linear-gradient(135deg, #1a0b2e 0%, #0f0020 100%)',
    borderRadius: 24,
    width: '90%',
    maxWidth: 600,
    maxHeight: '85vh',
    overflow: 'auto',
    border: '2px solid rgba(0, 243, 255, 0.5)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 243, 255, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 14,
    color: '#00f3ff',
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
  devSkipBtn: {
    background: '#ff00ff',
    border: 'none',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 10,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: RUSSO,
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
    border: '1px solid rgba(0, 243, 255, 0.3)',
    borderRadius: 20,
    padding: '6px 12px',
    fontSize: 11,
    color: '#00f3ff',
    cursor: 'pointer',
    fontFamily: RUSSO,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00f3ff',
    fontFamily: RUSSO,
  },
  // NUEVOS ESTILOS PARA VISTA PREVIA
  previewSection: {
    marginBottom: 20,
    padding: 12,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    fontSize: 10,
    color: '#00f3ff',
    letterSpacing: 1,
  },
  previewHint: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  previewCard: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 10,
    textAlign: 'center',
    border: '1px solid',
  },
  previewGrade: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  previewStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  previewDelta: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FF87',
  },
  previewXp: {
    fontSize: 11,
    color: '#FFD700',
  },
  previewReq: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  gameInfoSection: {
    marginBottom: 20,
    padding: 12,
    background: 'rgba(0, 243, 255, 0.05)',
    borderRadius: 12,
    border: '1px solid rgba(0, 243, 255, 0.2)',
  },
  gameInfoHeader: {
    fontSize: 10,
    color: '#00f3ff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  gameInfoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  gameInfoDesc: {
    fontSize: 11,
    color: '#fff',
    lineHeight: 1.4,
  },
  gameInfoDetails: {
    display: 'flex',
    gap: 16,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
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
    color: '#00f3ff',
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
    background: 'linear-gradient(135deg, #00f3ff 0%, #ff00ff 100%)',
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
    background: 'rgba(0, 243, 255, 0.1)',
    borderRadius: 40,
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid rgba(0, 243, 255, 0.3)',
    borderTopColor: '#00f3ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 11,
    color: '#00f3ff',
    fontFamily: RUSSO,
  },
  devSimulating: {
    textAlign: 'center',
    padding: 40,
  },
  spinnerLarge: {
    width: 50,
    height: 50,
    border: '3px solid rgba(0, 243, 255, 0.3)',
    borderTopColor: '#00f3ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 20px',
  },
  devText: {
    fontSize: 14,
    color: '#00f3ff',
    fontFamily: RUSSO,
    marginBottom: 20,
  },
  devCancelBtn: {
    background: 'rgba(255, 51, 102, 0.2)',
    border: '1px solid #ff3366',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 11,
    color: '#ff3366',
    cursor: 'pointer',
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