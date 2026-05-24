// src/components/campaign/TutorialCoach.tsx

import { useEffect, useState } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  action: 'next' | 'play_match' | 'open_missions' | 'view_league';
  highlightElement?: string;
}

interface TutorialCoachProps {
  onComplete: () => void;
  onStartMatch?: () => void;
  onOpenMissions?: () => void;
  onViewLeague?: () => void;
  userId: string;
}

const COACH_MESSAGES: TutorialStep[] = [
  {
    id: 'welcome',
    title: '¡¡BIENVENIDO A LUPIAPP!!',
    message:
      '¡¡HE OBSERVADO A MILES DE JUGADORES!!\n\nPero en tus ojos... veo el fuego de un verdadero campeón.\n\n¿ESTÁS LISTO PARA CAMBIAR TU DESTINO?',
    action: 'next',
  },
  {
    id: 'story_intro',
    title: '¡EL CAMINO HACIA LA GLORIA!',
    message:
      'Aquí no solo jugarás partidos.\n\nCada victoria... cada derrota...\nTODO formará parte de tu leyenda.\n\n¡¡LLEVA A TU   CLUB A LA CIMA!!',
    action: 'next',
  },
  {
    id: 'missions',
    title: '¡MISIONES ESPECIALES!',
    message:
      'Las misiones diarias te harán más fuerte.\n\nEntrena.\nCompite.\nSupérate.\n\n¡UN VERDADERO CAMPEÓN NUNCA DESCANSA!',
    action: 'open_missions',
  },
  {
    id: 'league',
    title: '¡EL SISTEMA DE LIGAS!',
    message:
      'Conquista todas las ligas\nRookie...\nBronce...\nPlata...\nOro...\n\n¡Y FINALMENTE...\nLA LIGA DE LOS CAMPEONES!',
    action: 'view_league',
  },
  {
    id: 'match',
    title: '¡TU PRIMER PARTIDO!',
    message:
      'Ha llegado el momento.\n\nEl balón decidirá tu destino.\n\n¡SAL AHÍ Y DEMUÉSTRALES QUIÉN ERES!',
    action: 'play_match',
  },
];

export default function TutorialCoach({
  onComplete,
  onStartMatch,
  onOpenMissions,
  onViewLeague,
  userId,
}: TutorialCoachProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tutorialSeen = localStorage.getItem(`tutorial_seen_${userId}`);

    if (tutorialSeen === 'true') {
      onComplete();
    } else {
      setVisible(true);
    }
  }, [userId]);

  const current = COACH_MESSAGES[currentStep];

  const handleNext = () => {
    switch (current.action) {
      case 'open_missions':
        onOpenMissions?.();
        break;

      case 'view_league':
        onViewLeague?.();
        break;

      case 'play_match':
        onStartMatch?.();
        break;
    }

    if (currentStep < COACH_MESSAGES.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem(`tutorial_seen_${userId}`, 'true');
      setVisible(false);
      onComplete();
    }
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');

        @keyframes animeEntrance {
          0% {
            transform: translateX(-300px) scale(1.8);
            opacity: 0;
            filter: blur(12px);
          }

          60% {
            transform: translateX(20px) scale(1.05);
            opacity: 1;
            filter: blur(0px);
          }

          100% {
            transform: translateX(0px) scale(1);
            opacity: 1;
          }
        }

        @keyframes speedMove {
          from {
            background-position: 0 0;
          }

          to {
            background-position: 400px 0;
          }
        }

        @keyframes pulseGlow {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.05);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes textShake {
          0% { transform: translateX(0px); }
          25% { transform: translateX(-1px); }
          50% { transform: translateX(1px); }
          75% { transform: translateX(-1px); }
          100% { transform: translateX(0px); }
        }

        @keyframes flash {
          0% {
            opacity: 0.2;
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.2;
          }
        }
      `}</style>

      <div style={styles.overlay}>
        {/* SPEED LINES */}
        <div style={styles.speedLines} />
          <div style={styles.backgroundImage} />


        {/* OSCURECER FONDO */}
        <div style={styles.darkLayer} />

        {/* TEXTO JAPONES */}
        <div style={styles.sfx}>ゴゴゴゴ</div>

        {/* COACH */}
        <div style={styles.container} className="tutorial-mobile-stack">
          {/* RETRATO */}
          <div style={styles.characterWrapper}>
            <div style={styles.characterAura} />

            <img
              src="/images/l1.png"
              alt="Coach"
              style={styles.character}
            />
          </div>

          {/* DIALOGO */}
          <div style={styles.dialogBox}>
            <div style={styles.flashLine} />

            <h2 style={styles.title}>{current.title}</h2>

            <p style={styles.message}>
              {current.message}
            </p>

            <button
              style={styles.button}
              onClick={handleNext}
            >
              {current.action === 'play_match'
                ? '⚽ ¡A JUGAR! ⚽'
                : '▶ CONTINUAR'}
            </button>

            {/* PROGRESO */}
            <div style={styles.progress}>
              {COACH_MESSAGES.map((_, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.dot,
                    background:
                      index === currentStep
                        ? '#ffcc00'
                        : index < currentStep
                        ? '#ff5500'
                        : '#333',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// REEMPLAZÁ TODO EL OBJETO styles POR ESTE

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    overflow: 'hidden',
    fontFamily: "'Bangers', cursive",
  },

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
        #1a1a1a 2px,
        #1a1a1a 6px
      )
    `,
    animation: 'speedMove 1.2s linear infinite',
  },

  darkLayer: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(2px)',
  },

  sfx: {
    position: 'absolute',
    top: '2vw',
    right: '3vw',
    fontSize: 'clamp(50px, 10vw, 120px)',
    color: 'rgba(255,255,255,0.06)',
    transform: 'rotate(-12deg)',
    letterSpacing: '8px',
    pointerEvents: 'none',
    userSelect: 'none',
  },

  container: {
    position: 'absolute',
    bottom: '2vh',
    left: '2vw',

    width: '95vw',
    maxWidth: '1200px',

    display: 'flex',
    alignItems: 'flex-end',
    gap: '2vw',

    animation: 'animeEntrance 0.7s ease-out',

    flexWrap: 'wrap',
  },

  characterWrapper: {
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
    animation: 'pulseGlow 2s infinite',
  },

  character: {
    width: 'clamp(140px, 22vw, 260px)',
    height: 'auto',
    objectFit: 'contain',
    position: 'relative',
    zIndex: 2,

    filter: `
      drop-shadow(0 0 20px rgba(255,200,0,0.6))
      drop-shadow(6px 6px 0px #000)
    `,
  },

  dialogBox: {
    position: 'relative',

    flex: 1,
    minWidth: '280px',

    maxWidth: '700px',

    background: `
      radial-gradient(#dcdcdc 1px, transparent 1px),
      white
    `,

    backgroundSize: '8px 8px',

    border: '5px solid #000',

    boxShadow: '12px 12px 0px #000',

    padding: 'clamp(16px, 2vw, 28px)',

    transform: 'skew(-2deg)',

    overflow: 'hidden',
  },

  flashLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 6,
    background: 'linear-gradient(to right, #ffcc00, #ff5500)',
    animation: 'flash 1s infinite',
  },

  title: {
    fontSize: 'clamp(22px, 3vw, 38px)',

    color: '#006eff',

    marginBottom: 16,

    letterSpacing: '2px',

    textShadow: '3px 3px 0px #000',

    animation: 'textShake 0.4s infinite',

    lineHeight: 1.1,
  },

  message: {
    whiteSpace: 'pre-line',

    fontSize: 'clamp(15px, 1.8vw, 24px)',

    color: '#111',

    lineHeight: 1.5,

    letterSpacing: '1px',

    marginBottom: 24,
  },

  button: {
      background:
    'linear-gradient(135deg,#00e1ff  0%,#0077ff  45%,#002bff  100%)',

      color: '#fff',

      border: '4px solid #000',

      boxShadow: '0 6px 0 #000',

      padding: 'clamp(10px, 1vw, 16px) clamp(18px, 2vw, 30px)',

      fontSize: 'clamp(16px, 2vw, 24px)',

      cursor: 'pointer',

      fontFamily: "'Bangers', cursive",

      letterSpacing: '2px',

      textTransform: 'uppercase',

      transition: 'all 0.15s ease',

      width: '100%',

      maxWidth: '320px',
  },

  progress: {
    display: 'flex',

    gap: 10,

    marginTop: 20,

    flexWrap: 'wrap',
  },

  dot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid #000',
  },
};