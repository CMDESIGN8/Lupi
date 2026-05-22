// src/components/campaign/ContextualHelp.tsx

import { useState } from 'react';

interface ContextualHelpProps {
  userId: string;
  currentLeague: string;
  completedWins: number;
  currentDay: number;
  hasUnreadMissions: boolean;
  canUpgradeTeam: boolean;
  onRestartTutorial: () => void;
  onClose: () => void;
}

interface HelpTip {
  id: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'high' | 'medium' | 'low';
}

export default function ContextualHelp({
  currentLeague,
  completedWins,
  currentDay,
  hasUnreadMissions,
  canUpgradeTeam,
  onRestartTutorial,
  onClose,
}: ContextualHelpProps) {
  const [showAllTips, setShowAllTips] = useState(false);

  const getContextualTips = (): HelpTip[] => {
    const tips: HelpTip[] = [];

    if (completedWins === 0) {
      tips.push({
        id: 'first_match',
        title: '¡¡TU PRIMER PARTIDO!!',
        message:
          'El balón ya está rodando...\n\n¡¡SAL AL CAMPO Y DEMUESTRA TU VERDADERO PODER!!',
        priority: 'high',
      });
    }

    if (completedWins === 1) {
      tips.push({
        id: 'continue',
        title: '¡¡SIGUE AVANZANDO!!',
        message:
          `Has conseguido una victoria en ${currentLeague}.\n\nPero esto recién comienza.\n\n¡¡LOS VERDADEROS RIVALES TE ESTÁN ESPERANDO!!`,
        priority: 'high',
      });
    }

    if (completedWins === 2) {
      tips.push({
        id: 'promotion',
        title: '¡¡EL PARTIDO DEFINITIVO!!',
        message:
          '¡¡ESTÁS A UN PASO DEL ASCENSO!!\n\nTodo dependerá de este partido.\n\n¡¡DALO TODO!!',
        priority: 'high',
      });
    }

    if (hasUnreadMissions) {
      tips.push({
        id: 'missions',
        title: '¡¡MISIONES DISPONIBLES!!',
        message:
          'Tus desafíos diarios siguen esperando.\n\n¡¡UN VERDADERO CAMPEÓN NUNCA DEJA ENTRENAMIENTO PENDIENTE!!',
        priority: 'medium',
      });
    }

    if (canUpgradeTeam) {
      tips.push({
        id: 'upgrade',
        title: '¡¡HAZ MÁS FUERTE A TU EQUIPO!!',
        message:
          'Tus jugadores todavía tienen un potencial oculto.\n\n¡¡MEJORA SUS CARTAS Y DESATA SU VERDADERA FUERZA!!',
        priority: 'medium',
      });
    }

    if (currentDay > 1) {
      tips.push({
        id: 'story',
        title: '¡¡LA HISTORIA CONTINÚA!!',
        message:
          'Cada día desbloquea un nuevo capítulo.\n\n¡¡TU LEYENDA RECIÉN COMIENZA!!',
        priority: 'low',
      });
    }

    tips.push({
      id: 'tutorial',
      title: '¡¡ENTRENAMIENTO ESPECIAL!!',
      message:
        'Si has olvidado algo...\n\n¡¡EL ENTRENADOR PUEDE GUIARTE OTRA VEZ HACIA LA GLORIA!!',
      priority: 'low',
      action: {
        label: '🔥 REINICIAR TUTORIAL 🔥',
        onClick: onRestartTutorial,
      },
    });

    return tips;
  };

  const tips = getContextualTips();

  const highPriorityTips = tips.filter(
    (t) => t.priority === 'high'
  );

  const otherTips = tips.filter(
    (t) => t.priority !== 'high'
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');

        @keyframes mangaEntrance {
          0% {
            transform: scale(1.4) translateY(100px);
            opacity: 0;
            filter: blur(10px);
          }

          100% {
            transform: scale(1) translateY(0px);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes speedMove {
          from {
            background-position: 0 0;
          }

          to {
            background-position: 300px 0;
          }
        }

        @keyframes pulseBorder {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.02);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes textImpact {
          0% { transform: translateX(0px); }
          25% { transform: translateX(-1px); }
          50% { transform: translateX(1px); }
          75% { transform: translateX(-1px); }
          100% { transform: translateX(0px); }
        }

        .manga-mobile {
          flex-direction: row;
        }

        @media (max-width: 768px) {

          .manga-mobile {
            flex-direction: column;
            align-items: center;
          }

        }
      `}</style>

      <div style={styles.overlay}>
        {/* FONDO CON IMAGEN */}
  <div style={styles.backgroundImage} />
        {/* SPEED LINES */}
        <div style={styles.speedLines} />

        {/* OSCURECER */}
        <div style={styles.darkLayer} />

        {/* TEXTO JAPONES */}
        <div style={styles.sfx}>ドドドド</div>

        {/* PANEL */}
        <div style={styles.panel} className="manga-mobile">
          {/* PERSONAJE */}
          <div style={styles.characterSide}>
            <div style={styles.characterAura} />

            <img
              src="/images/l1 .png"
              alt="Coach"
              style={styles.character}
            />
          </div>

          {/* DIALOGO */}
          <div style={styles.dialog}>
            <div style={styles.flashLine} />

            {/* HEADER */}
            <div style={styles.header}>
              <div>
                <h2 style={styles.title}>
                  ⚡ PRÓXIMOS PASOS ⚡
                </h2>

                <p style={styles.subtitle}>
                  El entrenador tiene consejos para ti
                </p>
              </div>

              <button
                style={styles.closeBtn}
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            {/* PROGRESO */}
            <div style={styles.progressWrapper}>
              <div style={styles.progressText}>
                <span>🏆 {currentLeague}</span>
                <span>{completedWins}/3</span>
              </div>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${(completedWins / 3) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* HIGH PRIORITY */}
            {highPriorityTips.map((tip) => (
              <div
                key={tip.id}
                style={styles.highCard}
              >
                <div style={styles.cardTitle}>
                  {tip.title}
                </div>

                <div style={styles.cardMessage}>
                  {tip.message}
                </div>

                {tip.action && (
                  <button
                    style={styles.actionButton}
                    onClick={tip.action.onClick}
                  >
                    {tip.action.label}
                  </button>
                )}
              </div>
            ))}

            {/* VER MÁS */}
            {!showAllTips && (
              <button
                style={styles.moreButton}
                onClick={() => setShowAllTips(true)}
              >
                📖 MÁS CONSEJOS
              </button>
            )}

            {/* EXTRA TIPS */}
            {showAllTips && (
              <div style={styles.extraTips}>
                {otherTips.map((tip) => (
                  <div
                    key={tip.id}
                    style={styles.lowCard}
                  >
                    <div style={styles.lowTitle}>
                      {tip.title}
                    </div>

                    <div style={styles.lowMessage}>
                      {tip.message}
                    </div>

                    {tip.action && (
                      <button
                        style={styles.smallButton}
                        onClick={tip.action.onClick}
                      >
                        {tip.action.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10001,
    overflow: 'hidden',
    fontFamily: "'Bangers', cursive",
  },

  // NUEVO: Fondo con imagen
  backgroundImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("/images/estadio.png")', // Cambia la ruta
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },

  speedLines: {
    position: 'absolute',
    inset: 0,

    background: `
      repeating-linear-gradient(
        -75deg,
        #111,
        #111 2px,
        #1b1b1b 2px,
        #1b1b1b 6px
      )
    `,

    animation: 'speedMove 1s linear infinite',
  },

  darkLayer: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(2px)',
  },

  sfx: {
    position: 'absolute',
    top: '2vw',
    right: '3vw',
    fontSize: 'clamp(50px, 10vw, 140px)',
    color: 'rgba(255,255,255,0.05)',
    transform: 'rotate(-10deg)',
    pointerEvents: 'none',
  },

  panel: {
    position: 'absolute',

    bottom: '2vh',
    left: '2vw',

    width: '95vw',
    maxWidth: '1200px',

    display: 'flex',
    gap: '2vw',

    alignItems: 'flex-end',

    animation: 'mangaEntrance 0.5s ease-out',
  },

  characterSide: {
    position: 'relative',
    flexShrink: 0,
  },

  characterAura: {
    position: 'absolute',
    inset: -20,

    borderRadius: '50%',

    background:
      'radial-gradient(circle, rgba(255,200,0,0.6), transparent 70%)',

    filter: 'blur(20px)',

    animation: 'pulseBorder 2s infinite',
  },

  character: {
    width: 'clamp(140px, 22vw, 260px)',

    position: 'relative',

    zIndex: 2,

    filter: `
      drop-shadow(0 0 20px rgba(255,200,0,0.6))
      drop-shadow(6px 6px 0px #000)
    `,
  },

  dialog: {
    position: 'relative',

    flex: 1,

    minWidth: '280px',

    maxHeight: '85vh',

    overflowY: 'auto',

    background: `
      radial-gradient(#dcdcdc 1px, transparent 1px),
      white
    `,

    backgroundSize: '8px 8px',

    border: '5px solid #000',

    boxShadow: '12px 12px 0px #000',

    padding: 'clamp(18px, 2vw, 28px)',

    transform: 'skew(-2deg)',
  },

  flashLine: {
    position: 'absolute',
    top: 0,
    left: 0,

    width: '100%',
    height: 6,

    background:
      'linear-gradient(to right, #ffcc00, #ff5500)',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 20,
  },

  title: {
    margin: 0,

    fontSize: 'clamp(24px, 3vw, 40px)',

    color: '#ff3c00',

    textShadow: '3px 3px 0px #000',

    letterSpacing: '2px',

    animation: 'textImpact 0.4s infinite',
  },

  subtitle: {
    marginTop: 8,

    fontSize: 'clamp(12px, 1.5vw, 16px)',

    color: '#555',
  },

  closeBtn: {
    width: 50,
    height: 50,

    border: '4px solid #000',

    background:
      'linear-gradient(to bottom, #ffcc00, #ff5500)',

    color: '#fff',

    fontSize: 20,

    cursor: 'pointer',

    boxShadow: '0 4px 0 #000',

    fontFamily: "'Bangers', cursive",
  },

  progressWrapper: {
    marginBottom: 24,
  },

  progressText: {
    display: 'flex',
    justifyContent: 'space-between',

    marginBottom: 10,

    fontSize: 18,

    color: '#111',
  },

  progressBar: {
    height: 18,

    background: '#ddd',

    border: '3px solid #000',

    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',

    background:
      'linear-gradient(to right, #ffcc00, #ff5500)',

    transition: '0.3s',
  },

  highCard: {
    background:
      'linear-gradient(135deg, rgba(255,80,0,0.18), rgba(255,200,0,0.15))',

    border: '4px solid #000',

    boxShadow: '6px 6px 0px #000',

    padding: 20,

    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 'clamp(20px, 2vw, 30px)',

    color: '#ff3c00',

    marginBottom: 14,

    textShadow: '2px 2px 0px #000',
  },

  cardMessage: {
    whiteSpace: 'pre-line',

    color: '#111',

    fontSize: 'clamp(15px, 1.5vw, 22px)',

    lineHeight: 1.5,
  },

  actionButton: {
    marginTop: 18,

    background:
      'linear-gradient(to bottom, #ffcc00, #ff5500)',

    border: '4px solid #000',

    boxShadow: '0 6px 0 #000',

    color: '#fff',

    padding: '12px 20px',

    fontSize: 18,

    cursor: 'pointer',

    fontFamily: "'Bangers', cursive",
  },

  moreButton: {
    width: '100%',

    marginTop: 8,

    background: '#111',

    border: '4px solid #000',

    color: '#ffcc00',

    padding: '14px',

    fontSize: 20,

    cursor: 'pointer',

    boxShadow: '0 6px 0 #000',

    fontFamily: "'Bangers', cursive",
  },

  extraTips: {
    marginTop: 20,

    display: 'flex',
    flexDirection: 'column',

    gap: 16,
  },

  lowCard: {
    border: '3px solid #000',

    padding: 16,

    background: 'rgba(255,255,255,0.8)',
  },

  lowTitle: {
    fontSize: 20,

    color: '#ff5500',

    marginBottom: 10,
  },

  lowMessage: {
    whiteSpace: 'pre-line',

    fontSize: 15,

    color: '#111',

    lineHeight: 1.5,
  },

  smallButton: {
    marginTop: 14,

    background:
      'linear-gradient(to bottom, #ffcc00, #ff5500)',

    border: '3px solid #000',

    color: '#fff',

    padding: '8px 14px',

    fontSize: 14,

    cursor: 'pointer',

    fontFamily: "'Bangers', cursive",
  },
};