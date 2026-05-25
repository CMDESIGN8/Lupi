
import { useEffect, useState } from 'react';
import { StoryChapter } from '../types/campaignStory';

interface StoryCinematicProps {
  chapter: StoryChapter;
  onComplete: () => void;
  dayNumber: number;
}

interface DialogueLine {
  character: 'protagonist' | 'rival' | 'coach';
  text: string;
  emotion?: 'normal' | 'angry' | 'surprised' | 'determined';
}

const CHARACTERS = {
  protagonist: {
    name: 'Player',
    avatar: '/images/l3.png',
    color: '#2568e5',
    side: 'left' as const,
  },
  rival: {
    name: 'KAISER',
    avatar: '/images/l2.png',
    color: '#e14141',
    side: 'right' as const,
  },
  coach: {
    name: 'LUPI',
    avatar: '/images/l1.png',
    color: '#F5C518',
    side: 'left' as const,
  },
};

export default function StoryCinematic({
  chapter,
  onComplete,
  dayNumber,
}: StoryCinematicProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  const dialogues: DialogueLine[] = [
    {
      character: 'protagonist',
      text: '¡¿Qué?! ¡Ese disparo... es imposible!',
      emotion: 'surprised',
    },
    {
      character: 'rival',
      text: 'Jajaja... En este país el fútbol es diferente. ¿Acaso crees que podrás vencerme con esas habilidades?',
      emotion: 'angry',
    },
    {
      character: 'protagonist',
      text: 'No me rendiré. ¡Voy a demostrarte el verdadero poder del fútbol!',
      emotion: 'determined',
    },
    {
      character: 'coach',
      text: 'Así se habla. Recuerda, el verdadero talento no nace, se forja con esfuerzo y dedicación.',
      emotion: 'normal',
    },
    {
      character: 'rival',
      text: 'Interesante... Muy bien, te espero en la final. ¡Prepárate para conocer la derrota!',
      emotion: 'determined',
    },
  ];

  const currentDialogue = dialogues[currentIndex];
  const currentCharacter = CHARACTERS[currentDialogue?.character || 'protagonist'];

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentIndex < dialogues.length) {
      setDisplayedText('');
      setIsTyping(true);
      const text = dialogues[currentIndex].text;
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text[i]);
          i++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => onComplete();

  const getEmotionStyle = () => {
    const emotions: Record<string, React.CSSProperties> = {
      normal: {},
      angry: { transform: 'scale(1.05)', filter: 'brightness(1.2)' },
      surprised: { transform: 'scale(1.1)' },
      determined: { filter: 'contrast(1.2)' },
    };
    return emotions[currentDialogue?.emotion || 'normal'];
  };

  return (
    <div style={styles.overlay}>
      {/* Efectos de fondo */}
      <div className="scanlines" />
      <div style={styles.speedLines} />
      <div style={styles.backgroundImage} />
      <div style={styles.vignette} />
      <div style={styles.sfxText}>ゴゴゴゴ</div>

      {/* Header superior */}
      <div style={styles.header}>
        <div style={styles.dayBadge}>⚡ DAY {dayNumber}</div>
        <div style={styles.chapterBadge}>{chapter.title}</div>
        {showSkip && (
          <button style={styles.skipButton} onClick={handleSkip}>
            ✕ SKIP
          </button>
        )}
      </div>

      {/* Contenedor de personaje - más arriba */}
      <div style={styles.characterContainer}>
        <div style={{
          ...styles.characterInner,
          justifyContent: currentCharacter.side === 'left' ? 'flex-start' : 'flex-end',
        }}>
          <div style={styles.characterCard}>
            <div style={{
              ...styles.characterGlow,
              background: `radial-gradient(circle, ${currentCharacter.color}80, transparent)`,
            }} />
            <img
              src={currentCharacter.avatar}
              alt={currentCharacter.name}
              style={{
                ...styles.characterImage,
                ...getEmotionStyle(),
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border: 3px solid ${currentCharacter.color};
                    border-radius: 20px;
                  `;
                  const emoji = currentCharacter.name === 'LUPI' ? '⚡' : 
                                currentCharacter.name === 'KAISER' ? '🎯' : '👨‍🏫';
                  fallback.innerHTML = `<span style="font-size:80px">${emoji}</span>
                                        <span style="color:${currentCharacter.color};margin-top:15px;font-size:14px">${currentCharacter.name}</span>`;
                  parent.appendChild(fallback);
                }
              }}
            />
            <div style={{
              ...styles.characterName,
              background: currentCharacter.color,
            }}>
              {currentCharacter.name}
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo - SUBIDO MÁS ARRIBA */}
      <div style={styles.dialogueContainer}>
        <div style={styles.dialogueWrapper}>
          <div style={styles.dialogueBox}>
            <div style={{
              ...styles.dialogueHeader,
              background: `linear-gradient(135deg, ${currentCharacter.color}, ${currentCharacter.color}CC)`,
            }}>
              <span style={styles.dialogueName}>{currentCharacter.name}</span>
              <span style={styles.dialogueEmotion}>
                {currentDialogue.emotion?.toUpperCase() || 'NORMAL'}
              </span>
            </div>
            <div style={styles.dialogueText}>
              {displayedText}
              {isTyping && <span style={styles.cursor}>_</span>}
            </div>
            {!isTyping && (
              <button style={styles.nextButton} onClick={handleNext}>
                {currentIndex < dialogues.length - 1 ? '▼ PRESS A TO CONTINUE ▼' : '⚽ START MATCH ⚽'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={styles.progressContainer}>
        <div style={{
          ...styles.progressBar,
          width: `${((currentIndex + 1) / dialogues.length) * 100}%`,
        }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        @keyframes speedLines {
          0% { background-position: 0 0; }
          100% { background-position: 200px 0; }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes slideUp {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }

        .scanlines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px);
          pointer-events: none;
          z-index: 20;
        }

        @media (max-width: 768px) {
          .character-card {
            width: 130px !important;
          }
          .dialogue-text {
            font-size: 11px !important;
            min-height: 70px !important;
          }
          .dialogue-box {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    fontFamily: "'Press Start 2P', monospace",
    overflow: 'hidden',
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
  },

  speedLines: {
    position: 'absolute',
    inset: 0,
    background: `repeating-linear-gradient(-75deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)`,
    animation: 'speedLines 1s linear infinite',
    pointerEvents: 'none',
  },

  backgroundImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("/images/estadio.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(4px) brightness(0.4)',
  },

  vignette: {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)`,
    pointerEvents: 'none',
  },

  sfxText: {
    position: 'absolute',
    top: '15%',
    right: '3%',
    fontSize: 'clamp(30px, 6vw, 80px)',
    color: 'rgba(255,255,255,0.03)',
    fontFamily: 'monospace',
    transform: 'rotate(-15deg)',
    pointerEvents: 'none',
    zIndex: 1,
  },

  header: {
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    zIndex: 10,
  },

  dayBadge: {
    background: 'rgba(0,0,0,0.85)',
    border: '2px solid #E52525',
    padding: '6px 12px',
    color: '#F5C518',
    fontSize: 10,
    letterSpacing: 2,
  },

  chapterBadge: {
    background: 'rgba(0,0,0,0.85)',
    border: '2px solid #F5C518',
    padding: '6px 12px',
    color: '#E52525',
    fontSize: 10,
    letterSpacing: 2,
  },

  skipButton: {
    background: 'rgba(0,0,0,0.85)',
    border: '2px solid #FFF',
    color: '#FFF',
    padding: '6px 12px',
    fontSize: 9,
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
  },

  // Contenedor del personaje - más arriba
  characterContainer: {
    flex: 0.7, // Reducido de 1 a 0.7 para dar más espacio al diálogo
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 20px 0 20px',
    zIndex: 5,
  },

  characterInner: {
    display: 'flex',
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
  },

  characterCard: {
    position: 'relative',
    width: 'clamp(150px, 18vw, 250px)',
    animation: 'fadeIn 0.5s ease-out',
  },

  characterGlow: {
    position: 'absolute',
    inset: '-20px',
    borderRadius: '50%',
    filter: 'blur(25px)',
    animation: 'pulse 2s infinite',
  },

  characterImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.5))',
    transition: 'all 0.2s ease',
  },

  characterName: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '5px 12px',
    color: '#FFF',
    fontSize: 'clamp(9px, 1.5vw, 12px)',
    letterSpacing: 1,
    border: '2px solid #000',
    whiteSpace: 'nowrap',
    boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
  },

  // Contenedor del diálogo - SUBIDO
  dialogueContainer: {
    position: 'relative',
    padding: '0 20px 25px 20px',
    marginTop: '-20px', // Sube el diálogo
    zIndex: 5,
  },

  dialogueWrapper: {
    maxWidth: 900,
    margin: '0 auto',
    width: '100%',
  },

  dialogueBox: {
    background: 'linear-gradient(135deg, rgba(20,20,30,0.98), rgba(10,10,20,0.98))',
    border: '3px solid #F5C518',
    borderRadius: 12,
    padding: '16px',
    boxShadow: '8px 8px 0px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    animation: 'slideUp 0.4s ease-out',
  },

  dialogueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    marginBottom: 12,
    borderRadius: 6,
  },

  dialogueName: {
    color: '#FFF',
    fontSize: 'clamp(11px, 1.8vw, 14px)',
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  dialogueEmotion: {
    color: '#FFF',
    fontSize: 'clamp(7px, 1.2vw, 10px)',
    opacity: 0.8,
  },

  dialogueText: {
    color: '#FFF',
    fontSize: 'clamp(12px, 1.8vw, 16px)',
    lineHeight: 1.6,
    minHeight: '70px',
    padding: '8px',
    wordBreak: 'break-word',
  },

  cursor: {
    animation: 'cursorBlink 1s step-end infinite',
    marginLeft: 2,
  },

  nextButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #E52525, #8B0000)',
    border: 'none',
    padding: '10px',
    color: '#FFF',
    fontSize: 'clamp(9px, 1.5vw, 12px)',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    letterSpacing: 1,
    marginTop: 12,
    borderRadius: 6,
    transition: 'transform 0.1s, opacity 0.2s',
  },

  progressContainer: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },

  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #F5C518, #E52525)',
    transition: 'width 0.3s ease',
  },
};