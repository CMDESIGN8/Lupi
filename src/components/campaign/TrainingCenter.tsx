// src/components/campaign/TrainingCenter.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CENTRO DE ENTRENAMIENTO - Vista completa con selección de cartas
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { UserCard } from '../../types/cards';
import { useTrainingSystem } from '../../hooks/useTrainingSystem';
import { TrainingHub } from './TrainingHub';
import { TrainingModal } from './TrainingModal';
import { getCardData } from '../../utils/battleEngine';

interface TrainingCenterProps {
  userId: string;
  userCards: UserCard[];
  deckCards: UserCard[];
  onCardsUpdated: (updatedCards: UserCard[]) => void;
  onClose: () => void;
}

const RUSSO = "'Russo One', sans-serif";

// Función auxiliar para obtener el avatar de la carta
const getCardAvatar = (cardData: any): string => {
  // Intentar obtener avatar de diferentes fuentes posibles
  if (cardData.avatar) return cardData.avatar;
  if (cardData.icon) return cardData.icon;
  if (cardData.emoji) return cardData.emoji;
  
  // Avatares por defecto según posición
  const position = cardData.position?.toLowerCase() || '';
  if (position.includes('delanter') || position.includes('forward')) return '⚽';
  if (position.includes('medioc') || position.includes('midfield')) return '⚡';
  if (position.includes('defens') || position.includes('defender')) return '🛡️';
  if (position.includes('porter') || position.includes('goalie')) return '🧤';
  
  return '⚽';
};

export function TrainingCenter({ 
  userId, 
  userCards, 
  deckCards, 
  onCardsUpdated, 
  onClose 
}: TrainingCenterProps) {
  const { dailyLoop, applyTraining, canTrain, history, isLoading, trainingsLeftToday } = 
    useTrainingSystem(userId, userCards);
  
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'stats' | 'cards' | 'history'>('stats');

  const handleTrain = async (result: any) => {
    const updated = await applyTraining(result, deckCards, selectedCardId || undefined);
    if (updated?.success && updated.upgradedCards) {
      onCardsUpdated(updated.upgradedCards);
    }
  };

  // Calcular estadísticas totales del equipo
  const teamStats = deckCards.reduce((acc, card) => {
    const data = getCardData(card);
    return {
      finishing: acc.finishing + (data.finishing || 50),
      dribbling: acc.dribbling + (data.dribbling || 50),
      defending: acc.defending + (data.defending || 50),
      passing: acc.passing + (data.passing || 50),
      physical: acc.physical + (data.physical || 50),
    };
  }, { finishing: 0, dribbling: 0, defending: 0, passing: 0, physical: 0 });

  const avgStats = {
    finishing: Math.round(teamStats.finishing / deckCards.length),
    dribbling: Math.round(teamStats.dribbling / deckCards.length),
    defending: Math.round(teamStats.defending / deckCards.length),
    passing: Math.round(teamStats.passing / deckCards.length),
    physical: Math.round(teamStats.physical / deckCards.length),
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.icon}>🏋️</div>
            <div>
              <h2 style={styles.title}>CENTRO DE ENTRENAMIENTO</h2>
              <p style={styles.subtitle}>Mejorá las habilidades de tu equipo</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button 
            onClick={() => setSelectedTab('stats')}
            style={{...styles.tab, ...(selectedTab === 'stats' ? styles.tabActive : {})}}
          >
            📊 ESTADÍSTICAS
          </button>
          <button 
            onClick={() => setSelectedTab('cards')}
            style={{...styles.tab, ...(selectedTab === 'cards' ? styles.tabActive : {})}}
          >
            🃏 CARTAS
          </button>
          <button 
            onClick={() => setSelectedTab('history')}
            style={{...styles.tab, ...(selectedTab === 'history' ? styles.tabActive : {})}}
          >
            📜 HISTORIAL
          </button>
        </div>

        {/* Contenido */}
        <div style={styles.content}>
          {selectedTab === 'stats' && (
            <div>
              <TrainingHub
                dailyLoop={dailyLoop}
                history={history}
                canTrain={canTrain}
                onOpenTraining={() => setShowTrainingModal(true)}
              />
              
              <div style={styles.teamStats}>
                <h3 style={styles.sectionTitle}>⚡ ESTADÍSTICAS DEL EQUIPO</h3>
                <div style={styles.statsGrid}>
                  <StatBar label="⚽ Remate" value={avgStats.finishing} color="#FF4757" />
                  <StatBar label="⚡ Gambeta" value={avgStats.dribbling} color="#00E5FF" />
                  <StatBar label="🛡️ Defensa" value={avgStats.defending} color="#2ED573" />
                  <StatBar label="🌀 Pase" value={avgStats.passing} color="#A55FEF" />
                  <StatBar label="💪 Físico" value={avgStats.physical} color="#FFA502" />
                </div>
              </div>

              {trainingsLeftToday > 0 && (
                <div style={styles.remainingCard}>
                  <div style={styles.remainingIcon}>⚡</div>
                  <div>
                    <div style={styles.remainingTitle}>ENTRENAMIENTOS DISPONIBLES</div>
                    <div style={styles.remainingCount}>{trainingsLeftToday} / {dailyLoop.maxDailyTrainings}</div>
                  </div>
                  <button 
                    onClick={() => setShowTrainingModal(true)}
                    disabled={!canTrain || isLoading}
                    style={{...styles.trainButton, ...(!canTrain || isLoading ? styles.trainButtonDisabled : {})}}
                  >
                    {isLoading ? '⏳ ENTRENANDO...' : '🏋️ ENTRENAR AHORA'}
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'cards' && (
            <div>
              <h3 style={styles.sectionTitle}>🎴 SELECCIONAR CARTA PARA ENTRENAR</h3>
              <p style={styles.sectionSubtitle}>
                {selectedCardId 
                  ? `Entrenando carta específica: +bonus del 50%` 
                  : "Entrenando a todo el equipo (sin selección)"}
              </p>
              
              <div style={styles.cardsGrid}>
                <button
                  onClick={() => setSelectedCardId(null)}
                  style={{
                    ...styles.cardItem,
                    ...(!selectedCardId ? styles.cardSelected : {}),
                  }}
                >
                  <div style={styles.cardEmoji}>👥</div>
                  <div style={styles.cardName}>TODO EL EQUIPO</div>
                  <div style={styles.cardBonus}>Mejora general</div>
                </button>
                
                {deckCards.slice(0, 8).map(card => {
                  const cardData = getCardData(card);
                  const isSelected = selectedCardId === card.id;
                  // Obtener nombre de la carta
                  const cardName = cardData.name || `Carta ${card.id.slice(0, 4)}`;
                  const cardAvatar = getCardAvatar(cardData);
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      style={{
                        ...styles.cardItem,
                        ...(isSelected ? styles.cardSelected : {}),
                        position: 'relative' as const,
                      }}
                    >
                      <div style={styles.cardEmoji}>{cardAvatar}</div>
                      <div style={styles.cardName}>{cardName}</div>
                      <div style={styles.cardRating}>OVR {cardData.overall_rating || 50}</div>
                      {isSelected && <div style={styles.cardBadge}>✨ +50% XP</div>}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setShowTrainingModal(true)}
                disabled={!canTrain || isLoading}
                style={{...styles.trainButtonLarge, ...(!canTrain || isLoading ? styles.trainButtonDisabled : {})}}
              >
                {isLoading ? '⏳ PROCESANDO...' : `🎮 INICIAR ENTRENAMIENTO (${dailyLoop.energy}⚡ disponibles)`}
              </button>
            </div>
          )}

          {selectedTab === 'history' && (
            <div>
              <h3 style={styles.sectionTitle}>📜 HISTORIAL DE ENTRENAMIENTOS</h3>
              <div style={styles.historyList}>
                {history.length === 0 ? (
                  <div style={styles.emptyHistory}>
                    <div style={styles.emptyIcon}>🏋️</div>
                    <p>Aún no hay entrenamientos realizados</p>
                    <p style={styles.emptyHint}>¡Completá tu primer entrenamiento!</p>
                  </div>
                ) : (
                  history.slice(0, 20).map((entry, i) => (
                    <div key={i} style={styles.historyItem}>
                      <div style={styles.historyDate}>
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <div style={styles.historyInfo}>
                        <span style={styles.historyGame}>{getGameIcon(entry.stat)} {entry.stat}</span>
                        <span style={{...styles.historyGrade, color: getGradeColor(entry.grade)}}>
                          {entry.grade}
                        </span>
                        <span style={styles.historyDelta}>+{entry.delta}</span>
                      </div>
                      <div style={styles.historyCard}>
                        {entry.cardName || 'Equipo completo'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <TrainingModal
          isOpen={showTrainingModal}
          onClose={() => setShowTrainingModal(false)}
          onTrain={handleTrain}
          deckCardIds={selectedCardId ? [selectedCardId] : deckCards.map(c => c.id)}
        />
      </div>
    </div>
  );
}

// Componentes auxiliares
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={statStyles.container}>
      <div style={statStyles.labelRow}>
        <span style={statStyles.label}>{label}</span>
        <span style={statStyles.value}>{value}</span>
      </div>
      <div style={statStyles.track}>
        <div style={{...statStyles.fill, width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function getGameIcon(stat: string): string {
  const icons: Record<string, string> = {
    finishing: '🎯',
    dribbling: '⚡',
    defending: '🛡️',
    passing: '🌀',
    physical: '💪',
  };
  return icons[stat] || '🏋️';
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

const statStyles: Record<string, React.CSSProperties> = {
  container: { marginBottom: 12 },
  labelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  value: { fontSize: 12, fontWeight: 'bold', color: '#FFD700' },
  track: { height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, transition: 'width 0.3s' },
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 800,
    maxHeight: '90vh',
    background: 'linear-gradient(135deg, #1a0b2e 0%, #0f0020 100%)',
    borderRadius: 32,
    border: '2px solid rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: RUSSO,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  icon: { fontSize: 36 },
  title: { fontSize: 18, color: '#FFD700', margin: 0 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    color: '#fff',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: 8,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0 16px',
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '12px 20px',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontFamily: RUSSO,
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#FFD700',
    borderBottom: '2px solid #FFD700',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
  },
  teamStats: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 16,
  },
  statsGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  remainingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 100, 0, 0.1))',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  remainingIcon: { fontSize: 32 },
  remainingTitle: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  remainingCount: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  trainButton: {
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
    border: 'none',
    borderRadius: 40,
    padding: '10px 20px',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f0020',
    cursor: 'pointer',
    fontFamily: RUSSO,
  },
  trainButtonLarge: {
    width: '100%',
    background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
    border: 'none',
    borderRadius: 40,
    padding: '14px',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f0020',
    cursor: 'pointer',
    fontFamily: RUSSO,
    marginTop: 20,
  },
  trainButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  cardItem: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    padding: 12,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardSelected: {
    borderColor: '#FFD700',
    background: 'rgba(255, 215, 0, 0.1)',
    boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
  },
  cardEmoji: { fontSize: 40, marginBottom: 8 },
  cardName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  cardRating: { fontSize: 10, color: '#FFD700' },
  cardBonus: { fontSize: 9, color: '#00FF87', marginTop: 6 },
  cardBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    background: '#FFD700',
    color: '#0f0020',
    fontSize: 8,
    padding: '2px 6px',
    borderRadius: 12,
  },
  historyList: {
    maxHeight: 400,
    overflow: 'auto',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  historyDate: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  historyInfo: { display: 'flex', gap: 12, alignItems: 'center' },
  historyGame: { fontSize: 11, textTransform: 'capitalize' },
  historyGrade: { fontSize: 12, fontWeight: 'bold' },
  historyDelta: { fontSize: 11, color: '#00FF87' },
  historyCard: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  emptyHistory: { textAlign: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyHint: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
};