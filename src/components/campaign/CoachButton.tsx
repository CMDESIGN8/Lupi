// src/components/campaign/CoachButton.tsx - VERSIÓN MEJORADA

import { useState, useEffect } from 'react';

interface CoachButtonProps {
  userId: string;
  onOpenCoach: () => void;
  onOpenContextualHelp: () => void;  // Nueva prop
  onRestartTutorial: () => void;      // Nueva prop
  unreadTips?: number;
}

export function CoachButton({ 
  userId, 
  onOpenCoach, 
  onOpenContextualHelp,
  onRestartTutorial,
  unreadTips = 0 
}: CoachButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem(`coach_tooltip_${userId}`);
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem(`coach_tooltip_${userId}`, 'true');
      }, 5000);
    }
  }, [userId]);

  return (
    <div style={styles.container}>
      {showTooltip && (
        <div style={styles.tooltip}>
          <span>💬</span>
          <span>¡Toca aquí para ayuda rápida!</span>
          <div style={styles.tooltipArrow} />
        </div>
      )}
      
      <div style={styles.buttonWrapper}>
        <button
          style={{
            ...styles.coachButton,
            ...(isHovered ? styles.coachButtonHover : {}),
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setShowMenu(!showMenu)}
        >
          <div style={styles.coachAvatar}>
  <img
    src="/images/l1.png"
    alt="Coach"
    style={styles.coachImage}
  />
</div>
          <div style={styles.coachText}>
            <span style={styles.coachName}>Lupi</span>
            <span style={styles.coachTitle}>Tu entrenador</span>
          </div>
          {unreadTips > 0 && (
            <div style={styles.notificationBadge}>
              {unreadTips}
            </div>
          )}
          <div style={styles.dropdownArrow}>▼</div>
        </button>

        {/* Menú desplegable */}
        {showMenu && (
          <div style={styles.dropdownMenu}>
            <button 
              style={styles.menuItem}
              onClick={() => {
                setShowMenu(false);
                onOpenCoach();
              }}
            >
              <span>📚</span>
              <span>Todos los consejos</span>
            </button>
            <button 
              style={styles.menuItem}
              onClick={() => {
                setShowMenu(false);
                onOpenContextualHelp();
              }}
            >
              <span>🎯</span>
              <span>Próximos pasos</span>
            </button>
            <button 
              style={{...styles.menuItem, ...styles.menuItemWarning}}
              onClick={() => {
                setShowMenu(false);
                if (confirm('¿Reiniciar el tutorial? El entrenador te guiará nuevamente desde el principio.')) {
                  onRestartTutorial();
                }
              }}
            >
              <span>🔄</span>
              <span>Reiniciar tutorial</span>
            </button>
          </div>
        )}
      </div>

      {isHovered && (
        <div style={styles.particles}>
          <span>✨</span>
          <span>⭐</span>
          <span>💫</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  buttonWrapper: {
    position: 'relative',
    bottom:'40px',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 10,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    animation: 'bounceIn 0.5s ease-out',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 20,
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid #764ba2',
  },
  coachButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#00aeff',
    borderRadius: 60,
    padding: '8px 20px 8px 12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  coachButtonHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
    borderColor: '#ffaa00',
  },
  coachAvatar: {
    position: 'relative',
    width: 48,
    height: 48,
    background: 'linear-gradient(135deg, #f5a623, #f5d142)',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
  },
  coachIcon: {
    fontSize: 24,
  },
  coachGlasses: {
    position: 'absolute',
    bottom: 4,
    fontSize: 10,
    background: '#fff',
    borderRadius: 10,
    padding: '1px 4px',
  },
  coachText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  coachName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0099ff',
  },
  coachTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#ffd700',
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    background: '#ff4444',
    color: 'white',
    borderRadius: '50%',
    width: 20,
    height: 20,
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    animation: 'pulse 1s infinite',
  },
  dropdownMenu: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 10,
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    border: '1px solid #ffd700',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.2s ease-out',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  menuItemWarning: {
    borderTop: '1px solid rgba(255,215,0,0.2)',
    color: '#ff6b6b',
  },
  particles: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    gap: 5,
    pointerEvents: 'none',
    animation: 'floatUp 0.5s ease-out',
  },
  coachImage: {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%',
  border: '3px solid #fff',
  boxShadow: `
    0 0 20px rgba(255,255,255,0.4),
    0 0 40px rgba(255,215,0,0.25)
  `,
  filter: `
    contrast(1.1)
    saturate(1.2)
  `,
},
};