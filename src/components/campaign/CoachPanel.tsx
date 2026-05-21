// src/components/campaign/CoachPanel.tsx
import { useState, useEffect } from 'react';

interface CoachTip {
  id: string;
  title: string;
  message: string;
  category: 'basics' | 'missions' | 'league' | 'battle' | 'strategy';
  icon: string;
  isUnlocked: boolean;
}

interface CoachPanelProps {
  onClose: () => void;
  userId: string;
  currentLeague: string;
  completedWins: number;
  onMarkTipRead: (tipId: string) => void;
}

const COACH_TIPS: CoachTip[] = [
  {
    id: 'tip_1',
    title: '⚽ ¡CÓMO JUGAR!',
    message: 'Para jugar un partido, solo toca el botón "JUGAR" en cualquier rival. ¡El sistema de batalla hará el resto, como en los viejos tiempos!',
    category: 'basics',
    icon: '🎮',
    isUnlocked: true,
  },
  {
    id: 'tip_2',
    title: '⭐ MISIÓN DEL DÍA',
    message: 'Completa las misiones diarias para ganar experiencia extra. ¡No olvides reclamar tus recompensas antes del atardecer!',
    category: 'missions',
    icon: '🎯',
    isUnlocked: true,
  },
  {
    id: 'tip_3',
    title: '🏆 SUBIR DE LIGA',
    message: 'Para subir de liga, debes ganar los 3 partidos. Cada liga tiene rivales más fuertes... ¡como en el torneo nacional!',
    category: 'league',
    icon: '📈',
    isUnlocked: true,
  },
  {
    id: 'tip_4',
    title: '💪 ¡MEJORA TU EQUIPO!',
    message: 'Abre sobres para conseguir nuevas cartas. ¡Un equipo más fuerte es el camino al campeonato!',
    category: 'strategy',
    icon: '📦',
    isUnlocked: true,
  },
  {
    id: 'tip_5',
    title: '🔥 ¡RACHA DE VICTORIAS!',
    message: 'Mantén una racha de victorias para ganar recompensas. ¡Cada gol cuenta, cada partido importa!',
    category: 'battle',
    icon: '⚡',
    isUnlocked: true,
  },
  {
    id: 'tip_6',
    title: '📖 ¡LA HISTORIA CONTINÚA!',
    message: 'A medida que avances, desbloquearás cinemáticas épicas. ¡No te las pierdas, campeón!',
    category: 'basics',
    icon: '📖',
    isUnlocked: true,
  },
];

export function CoachPanel({ onClose, userId, currentLeague, completedWins, onMarkTipRead }: CoachPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showStarEffect, setShowStarEffect] = useState(false);
  const [readTips, setReadTips] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`coach_read_tips_${userId}`);
    if (saved) {
      setReadTips(JSON.parse(saved));
    }
  }, [userId]);

  const categories = [
    { id: 'all', name: 'TODO', icon: '⭐' },
    { id: 'basics', name: 'BÁSICO', icon: '⚽' },
    { id: 'missions', name: 'MISIONES', icon: '🎯' },
    { id: 'league', name: 'LIGAS', icon: '🏆' },
    { id: 'battle', name: 'BATALLA', icon: '🔥' },
    { id: 'strategy', name: 'ESTRATEGIA', icon: '💪' },
  ];

  const filteredTips = selectedCategory === 'all' 
    ? COACH_TIPS 
    : COACH_TIPS.filter(tip => tip.category === selectedCategory);

  const unreadCount = filteredTips.filter(tip => !readTips.includes(tip.id)).length;

  const handleTipClick = (tipId: string) => {
    if (!readTips.includes(tipId)) {
      const newReadTips = [...readTips, tipId];
      setReadTips(newReadTips);
      localStorage.setItem(`coach_read_tips_${userId}`, JSON.stringify(newReadTips));
      onMarkTipRead(tipId);
      
      setShowStarEffect(true);
      setTimeout(() => setShowStarEffect(false), 1500);
    }
  };

  const getSpecialMessage = () => {
    if (completedWins === 0) {
      return {
        title: '¡BIENVENIDO CAMPEÓN!',
        message: '¡Hola! Soy el Profesor Takamura. Déjame guiarte en este camino hacia la gloria.',
        bgColor: '#ff6b6b',
      };
    }
    if (completedWins === 1) {
      return {
        title: '🎉 ¡PRIMERA VICTORIA! 🎉',
        message: '¡Excelente comienzo! Así se empieza el camino al campeonato. ¿Necesitas algún consejo?',
        bgColor: '#ffd700',
      };
    }
    if (completedWins >= 5) {
      return {
        title: '⚡ ¡VAS COMO UNA BALA! ⚡',
        message: `¡${completedWins} victorias ya! El equipo de ${currentLeague} tiembla ante tu poder.`,
        bgColor: '#ff6b6b',
      };
    }
    return {
      title: '💬 CONSEJOS DEL PROFESOR',
      message: 'Selecciona cualquier tema para aprender más. ¡El conocimiento es poder en el fútbol!',
      bgColor: '#4a90e2',
    };
  };

  const specialMsg = getSpecialMessage();

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Banda superior estilo SNES */}
        <div style={styles.topBanner}>
          <div style={styles.snesStripes}>
            <div style={styles.redStripe} />
            <div style={styles.yellowStripe} />
            <div style={styles.greenStripe} />
          </div>
        </div>

        {/* Header con el entrenador */}
        <div style={styles.header}>
          <div style={styles.coachArea}>
            <div style={styles.coachAvatar}>
              <div style={styles.coachFace}>
                <span style={styles.coachIcon}>👨🏼</span>
              </div>
              <div style={styles.coachShadow} />
            </div>
            <div style={styles.coachInfo}>
              <h2 style={styles.title}>
                <span style={styles.titleGlow}>PROFESOR</span>
                <span style={styles.titleName}> TAKAMURA</span>
              </h2>
              <p style={styles.subtitle}>☆ Entrenador de Leyenda ☆</p>
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        {/* Mensaje especial tipo manga */}
        <div style={{...styles.specialMessage, background: specialMsg.bgColor}}>
          <div style={styles.specialIcon}>💬</div>
          <div style={styles.specialContent}>
            <div style={styles.specialTitle}>{specialMsg.title}</div>
            <div style={styles.specialText}>{specialMsg.message}</div>
          </div>
          <div style={styles.specialTail} />
        </div>

        {/* Categorías estilo menú SNES */}
        <div style={styles.categories}>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === cat.id ? styles.categoryActive : {}),
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span style={styles.categoryIcon}>{cat.icon}</span>
              <span style={styles.categoryName}>{cat.name}</span>
              {selectedCategory === cat.id && <span style={styles.categorySelector}>▶</span>}
            </button>
          ))}
        </div>

        {/* Lista de tips estilo revista de fútbol */}
        <div style={styles.tipsContainer}>
          <div style={styles.tipsHeader}>
            <span style={styles.headerIcon}>📋</span>
            <span style={styles.headerText}>LISTA DE CONSEJOS</span>
            {unreadCount > 0 && (
              <span style={styles.unreadBadge}>+{unreadCount} NUEVOS</span>
            )}
          </div>
          
          <div style={styles.tipsList}>
            {filteredTips.map((tip, idx) => (
              <div
                key={tip.id}
                style={{
                  ...styles.tipCard,
                  ...(readTips.includes(tip.id) ? styles.tipRead : {}),
                }}
                onClick={() => handleTipClick(tip.id)}
              >
                <div style={styles.tipIcon}>{tip.icon}</div>
                <div style={styles.tipContent}>
                  <div style={styles.tipTitle}>
                    {!readTips.includes(tip.id) && <span style={styles.newFlag}>NEW!</span>}
                    {tip.title}
                  </div>
                  <div style={styles.tipMessage}>{tip.message}</div>
                </div>
                <div style={styles.tipArrow}>→</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer con estadísticas estilo marcador */}
        <div style={styles.footer}>
          <div style={styles.statsCard}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>📚 CONSEJOS</span>
              <span style={styles.statValue}>{readTips.length}/{COACH_TIPS.length}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statLabel}>🏆 VICTORIAS</span>
              <span style={styles.statValue}>{completedWins}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statLabel}>⭐ LIGA</span>
              <span style={styles.statValue}>{currentLeague}</span>
            </div>
          </div>
          <div style={styles.motivation}>
            <span style={styles.quoteIcon}>「</span>
            GANBATTE!
            <span style={styles.quoteIcon}>」</span>
          </div>
          <div style={styles.progressContainer}>
            <div style={styles.progressLabel}>PROGRESO</div>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: `${(readTips.length / COACH_TIPS.length) * 100}%`}} />
            </div>
            <div style={styles.progressPercent}>{Math.round((readTips.length / COACH_TIPS.length) * 100)}%</div>
          </div>
        </div>

        {/* Efecto de estrella al leer */}
        {showStarEffect && (
          <div style={styles.starEffect}>
            <span>✨</span>
            <span>⭐</span>
            <span>🌟</span>
            <span>✨</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.3s ease-out',
  },
  panel: {
    width: '90%',
    maxWidth: 650,
    maxHeight: '85vh',
    background: 'linear-gradient(180deg, #1a2a3a 0%, #0d1a2a 100%)',
    borderRadius: '20px',
    border: '4px solid #ffd700',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease-out',
    position: 'relative',
  },
  topBanner: {
    position: 'relative',
    height: 6,
  },
  snesStripes: {
    display: 'flex',
    height: '100%',
  },
  redStripe: {
    flex: 1,
    background: '#e74c3c',
  },
  yellowStripe: {
    flex: 1,
    background: '#f1c40f',
  },
  greenStripe: {
    flex: 1,
    background: '#2ecc71',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 16px 24px',
    background: 'linear-gradient(135deg, #2c3e50, #1a2a3a)',
    borderBottom: '2px solid #ffd700',
  },
  coachArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  coachAvatar: {
    position: 'relative',
  },
  coachFace: {
    position: 'relative',
    width: 75,
    height: 75,
    background: 'linear-gradient(135deg, #f5a623, #f5d142)',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #fff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  coachIcon: {
    fontSize: 38,
    marginTop: -8,
  },
  coachEyes: {
    fontSize: 16,
    letterSpacing: 4,
    marginTop: -8,
  },
  coachGlasses: {
    position: 'absolute',
    bottom: 12,
    fontSize: 12,
    background: '#fff',
    borderRadius: 10,
    padding: '2px 6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  coachShadow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 50,
    height: 8,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '50%',
    filter: 'blur(3px)',
  },
  coachInfo: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleGlow: {
    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  titleName: {
    color: '#fff',
    textShadow: '1px 1px 0 #ff8c00',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#ffd700',
    fontSize: 11,
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  specialMessage: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    margin: '16px 20px',
    padding: '14px 20px',
    borderRadius: '15px',
    color: '#fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  },
  specialIcon: {
    fontSize: 32,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
  },
  specialContent: {
    flex: 1,
  },
  specialTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  specialText: {
    fontSize: 12,
    opacity: 0.95,
    lineHeight: 1.4,
  },
  specialTail: {
    position: 'absolute',
    left: -8,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent',
    borderRight: '8px solid',
  },
  categories: {
    display: 'flex',
    gap: 8,
    padding: '12px 20px',
    overflowX: 'auto',
    background: 'rgba(0,0,0,0.2)',
    borderBottom: '1px solid rgba(255,215,0,0.2)',
  },
  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: '30px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  categoryActive: {
    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    borderColor: 'transparent',
    color: '#1a2a3a',
    boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  categorySelector: {
    fontSize: 10,
    animation: 'pulse 0.8s infinite',
  },
  tipsContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 20px',
  },
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #2c3e50, #243342)',
    borderRadius: '10px',
    marginBottom: 12,
    borderLeft: '4px solid #ffd700',
  },
  headerIcon: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  unreadBadge: {
    background: '#e74c3c',
    color: '#fff',
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  tipsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingRight: 4,
  },
  tipCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255,215,0,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  tipRead: {
    opacity: 0.6,
    background: 'rgba(255,255,255,0.02)',
  },
  tipIcon: {
    fontSize: 32,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  newFlag: {
    background: '#e74c3c',
    color: '#fff',
    fontSize: 8,
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold',
  },
  tipMessage: {
    color: '#ecf0f1',
    fontSize: 11,
    lineHeight: 1.4,
  },
  tipArrow: {
    color: '#ffd700',
    fontSize: 16,
    opacity: 0.5,
  },
  footer: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #1a2a3a, #0d1a2a)',
    borderTop: '2px solid #ffd700',
  },
  statsCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    padding: '10px 16px',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    textAlign: 'center',
  },
  statLabel: {
    display: 'block',
    fontSize: 9,
    color: '#bdc3c7',
    marginBottom: 4,
  },
  statValue: {
    display: 'block',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  statDivider: {
    width: 1,
    height: 30,
    background: 'rgba(255,215,0,0.3)',
  },
  motivation: {
    textAlign: 'center',
    padding: '10px',
    fontSize: 11,
    color: '#ffd700',
    fontStyle: 'italic',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    marginBottom: 12,
  },
  quoteIcon: {
    color: '#ff8c00',
    margin: '0 4px',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  progressLabel: {
    fontSize: 9,
    color: '#bdc3c7',
    fontWeight: 'bold',
    minWidth: 55,
  },
  progressBar: {
    flex: 1,
    height: 8,
    background: 'rgba(0,0,0,0.5)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressPercent: {
    fontSize: 10,
    color: '#ffd700',
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
  starEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    gap: 20,
    fontSize: 40,
    animation: 'starBurst 1.5s ease-out forwards',
    pointerEvents: 'none',
    zIndex: 100,
  },
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: translateX(0); }
      50% { opacity: 0.5; transform: translateX(3px); }
    }
    @keyframes starBurst {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
  `;
  document.head.appendChild(styleSheet);
}