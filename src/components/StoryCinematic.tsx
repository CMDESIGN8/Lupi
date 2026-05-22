// src/components/StoryCinematic.tsx
// VERSION SUPERCAMPEONES / BLUE LOCK / ANIME FOOTBALL - MEJORADA

import { useEffect, useState, useRef } from 'react';
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
    name: 'LUPI',
    avatar: '/images/l1.png',
    color: '#ff2a2a',
    accentColor: '#ff0000',
    side: 'left' as const,
    catchphrase: '¡NUNCA ME RINDO!',
  },
  rival: {
    name: 'KAISER',
    avatar: '/images/l2.png',
    color: '#4da6ff',
    accentColor: '#0080ff',
    side: 'right' as const,
    catchphrase: 'LA PERFECCIÓN NO EXISTE',
  },
  coach: {
    name: 'ROBERTO',
    avatar: '/images/coach.png',
    color: '#ffd700',
    accentColor: '#ffaa00',
    side: 'left' as const,
    catchphrase: 'EL ESFUERZO ES TALENTO',
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
  const [skipVisible, setSkipVisible] = useState(false);
  const [showHitEffect, setShowHitEffect] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dialogues: DialogueLine[] = [
    {
      character: 'protagonist',
      text: '¡¿QUÉ?! ¡ESE DISPARO... ES IMPOSIBLE!',
      emotion: 'surprised',
    },
    {
      character: 'rival',
      text: 'JAJAJA... EN ESTE PAÍS EL FÚTBOL ES DIFERENTE. ¡TE VOY A DESTRUIR!',
      emotion: 'angry',
    },
    {
      character: 'protagonist',
      text: 'NO ME RENDIRÉ. ¡VOY A DEMOSTRARTE EL VERDADERO PODER DEL FÚTBOL!',
      emotion: 'determined',
    },
    {
      character: 'coach',
      text: 'ASÍ SE HABLA. EL VERDADERO TALENTO SE FORJA CON ESFUERZO.',
      emotion: 'normal',
    },
    {
      character: 'rival',
      text: 'INTERESANTE... TE ESPERO EN LA FINAL. ¡PREPÁRATE PARA LA DERROTA!',
      emotion: 'determined',
    },
  ];

  const currentDialogue = dialogues[currentIndex];
  const currentCharacter = CHARACTERS[currentDialogue?.character || 'protagonist'];
  const isLastDialogue = currentIndex === dialogues.length - 1;

  useEffect(() => {
    const timer = setTimeout(() => setSkipVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentDialogue) return;

    setDisplayedText('');
    setIsTyping(true);

    const text = currentDialogue.text;
    let i = 0;

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text[i]);
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Efecto de impacto para emociones fuertes
  useEffect(() => {
    if (currentDialogue.emotion === 'angry' || currentDialogue.emotion === 'determined') {
      setShowHitEffect(true);
      const timer = setTimeout(() => setShowHitEffect(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(currentDialogue.text);
      setIsTyping(false);
      return;
    }

    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getEmotionImageStyle = (): React.CSSProperties => {
    switch (currentDialogue.emotion) {
      case 'angry':
        return {
          transform: 'scale(1.12)',
          filter: `
            brightness(1.2)
            contrast(1.25)
            drop-shadow(0 0 35px rgba(255,0,0,0.6))
          `,
        };
      case 'determined':
        return {
          transform: 'scale(1.1)',
          filter: `
            brightness(1.15)
            contrast(1.2)
            drop-shadow(0 0 35px rgba(255,215,0,0.5))
          `,
        };
      case 'surprised':
        return {
          transform: 'scale(1.15)',
          filter: 'brightness(1.1)',
        };
      default:
        return {};
    }
  };

  const getScreenShake = () => {
    if (currentDialogue.emotion === 'angry') {
      return 'screenShake 0.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';
    }
    return undefined;
  };

  return (
    <div
      style={{
        ...styles.overlay,
        animation: getScreenShake(),
      }}
      onClick={handleNext}
    >
      {/* BACKGROUND */}
      <div style={styles.backgroundImage} />

      {/* DARK OVERLAY */}
      <div style={styles.darkOverlay} />

      {/* SPEED LINES */}
      <div style={styles.speedLines} />

      {/* SCANLINES */}
      <div style={styles.scanlines} />

      {/* HIT EFFECT FLASH */}
      {showHitEffect && <div style={styles.hitFlash} />}

      {/* JAPANESE FX */}
      <div style={styles.sfxText}>
        {currentDialogue.emotion === 'angry' ? 'ドドドド' : 'ゴゴゴゴ'}
      </div>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.dayBadge}>
          <span style={styles.dayIcon}>⚡</span>
          <span>DAY {dayNumber}</span>
        </div>

        <div style={styles.chapterBadge}>
          {chapter.title.toUpperCase()}
        </div>

        {skipVisible && (
          <button style={styles.skipButton} onClick={handleSkip}>
            SKIP ✕
          </button>
        )}
      </div>

      {/* CHARACTER AREA */}
      <div
        style={{
          ...styles.characterContainer,
          justifyContent:
            currentCharacter.side === 'left' ? 'flex-start' : 'flex-end',
        }}
      >
        {/* CUT IN EFFECT */}
        <div style={styles.cutIn} />

        {/* POWER AURA */}
        {(currentDialogue.emotion === 'determined' ||
          currentDialogue.emotion === 'angry') && (
          <div
            style={{
              ...styles.powerAura,
              background: `radial-gradient(circle, ${currentCharacter.accentColor}80, transparent 70%)`,
            }}
          />
        )}

        <div style={styles.characterWrapper}>
          <img
            src={currentCharacter.avatar}
            alt={currentCharacter.name}
            style={{
              ...styles.characterImage,
              ...getEmotionImageStyle(),
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.style.cssText = `
                  width: 100%;
                  aspect-ratio: 3/4;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  background: linear-gradient(135deg, #1a1a2e, #0a0a15);
                  border: 3px solid ${currentCharacter.color};
                  border-radius: 16px;
                  font-size: 80px;
                `;
                const emoji = currentCharacter.name === 'LUPI' ? '⚡' : 
                              currentCharacter.name === 'KAISER' ? '🎯' : '👨‍🏫';
                fallback.innerHTML = `
                  <span style="font-size:80px">${emoji}</span>
                  <span style="color:${currentCharacter.color};margin-top:15px;font-size:14px;font-weight:bold">${currentCharacter.name}</span>
                `;
                parent.appendChild(fallback);
              }
            }}
          />

          {/* NAME TAG */}
          <div
            style={{
              ...styles.characterName,
              background: currentCharacter.color,
              borderColor: currentCharacter.accentColor,
            }}
          >
            {currentCharacter.name}
          </div>

          {/* CATCHPHRASE */}
          <div style={styles.catchphrase}>
            {currentCharacter.catchphrase}
          </div>
        </div>
      </div>

      {/* DIALOGUE */}
      <div style={styles.dialogueContainer}>
        <div style={styles.dialogueBox}>
          {/* HEADER */}
          <div
            style={{
              ...styles.dialogueHeader,
              background: `linear-gradient(90deg, ${currentCharacter.color}22, transparent)`,
              borderLeftColor: currentCharacter.color,
            }}
          >
            <div style={styles.dialogueName}>
              <span style={styles.nameIcon}>
                {currentCharacter.name === 'LUPI' ? '⚡' : 
                 currentCharacter.name === 'KAISER' ? '🎯' : '👨‍🏫'}
              </span>
              {currentCharacter.name}
            </div>

            <div
              style={{
                ...styles.emotionBadge,
                background: currentCharacter.color,
              }}
            >
              {currentDialogue.emotion?.toUpperCase() || 'NORMAL'}
            </div>
          </div>

          {/* TEXT */}
          <div style={styles.dialogueText}>
            <span style={styles.quoteIcon}>「</span>
            {displayedText}
            {isTyping && <span style={styles.cursor}>_</span>}
            <span style={styles.quoteIcon}>」</span>
          </div>

          {/* BUTTON */}
          {!isTyping && (
            <button
              style={{
                ...styles.nextButton,
                background: `linear-gradient(90deg, ${currentCharacter.color}, ${currentCharacter.accentColor})`,
              }}
              onClick={handleNext}
            >
              {!isLastDialogue ? '▼ TAP TO CONTINUE ▼' : '⚽ START MATCH ⚽'}
            </button>
          )}
        </div>
      </div>

      {/* PROGRESS */}
      <div style={styles.progressContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${((currentIndex + 1) / dialogues.length) * 100}%`,
            background: `linear-gradient(90deg, ${currentCharacter.color}, ${currentCharacter.accentColor})`,
          }}
        />
        <div style={styles.progressDots}>
          {dialogues.map((_, idx) => (
            <div
              key={idx}
              style={{
                ...styles.progressDot,
                background: idx <= currentIndex ? currentCharacter.color : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS ANIMATIONS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Press+Start+2P&display=swap');

        @keyframes speedMove {
          0% { background-position: 0 0; }
          100% { background-position: 300px 0; }
        }

        @keyframes pulseAura {
          from { transform: scale(0.95); opacity: 0.4; }
          to { transform: scale(1.15); opacity: 0.8; }
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes buttonPulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }

        @keyframes cutFlash {
          0% { transform: translateX(-100%); opacity: 0; }
          30% { opacity: 0.6; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes screenShake {
          0% { transform: translate(1px, 1px); }
          25% { transform: translate(-1px, -2px); }
          50% { transform: translate(-2px, 1px); }
          75% { transform: translate(1px, -1px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes hitFlashAnim {
          0% { opacity: 0; }
          20% { opacity: 0.8; }
          100% { opacity: 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes characterFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .scanlines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 4px);
          pointer-events: none;
          z-index: 20;
        }

        @media (max-width: 768px) {
          .character-container {
            padding-bottom: 130px !important;
          }
          .dialogue-text {
            font-size: 13px !important;
            min-height: 80px !important;
          }
          .character-wrapper {
            width: clamp(200px, 40vw, 300px) !important;
          }
          .character-name {
            font-size: 10px !important;
            bottom: 20px !important;
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
    overflow: 'hidden',
    zIndex: 999999,
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontFamily: "'Orbitron', 'Press Start 2P', monospace",
    cursor: 'pointer',
  },

  backgroundImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("/images/estadio.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: 'scale(1.1)',
    filter: 'blur(6px) brightness(0.25) saturate(1.5)',
  },

  darkOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.9) 100%)',
  },

  speedLines: {
    position: 'absolute',
    inset: 0,
    background: `repeating-linear-gradient(-75deg, transparent, transparent 25px, rgba(255,255,255,0.04) 25px, rgba(255,255,255,0.04) 45px)`,
    animation: 'speedMove 1s linear infinite',
    pointerEvents: 'none',
  },

  hitFlash: {
    position: 'absolute',
    inset: 0,
    background: 'white',
    opacity: 0,
    animation: 'hitFlashAnim 0.3s ease-out',
    pointerEvents: 'none',
    zIndex: 15,
  },

  sfxText: {
    position: 'absolute',
    top: '15%',
    right: '3%',
    fontSize: 'clamp(45px, 7vw, 90px)',
    color: 'rgba(255,255,255,0.04)',
    fontWeight: 900,
    transform: 'rotate(-12deg)',
    zIndex: 1,
    fontFamily: 'monospace',
  },

  topBar: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    gap: 12,
  },

  dayBadge: {
    background: 'rgba(0,0,0,0.85)',
    border: '2px solid #ffd700',
    padding: '6px 12px',
    color: '#ffd700',
    fontSize: 11,
    letterSpacing: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  dayIcon: {
    fontSize: 14,
  },

  chapterBadge: {
    background: 'rgba(0,0,0,0.85)',
    border: '2px solid #ff2a2a',
    padding: '6px 12px',
    color: '#fff',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },

  skipButton: {
    background: 'rgba(0,0,0,0.85)',
    border: '2px solid #fff',
    color: '#fff',
    padding: '6px 16px',
    fontSize: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: 1,
    transition: 'opacity 0.2s',
  },

  characterContainer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: '180px',
    paddingLeft: 25,
    paddingRight: 25,
    zIndex: 3,
    pointerEvents: 'none',
    bottom: '150px',
  },

  characterWrapper: {
    position: 'relative',
    width: 'clamp(280px, 42vw, 480px)',
    animation: 'fadeIn 0.5s ease-out, characterFloat 3s ease-in-out infinite',
  },

  characterImage: {
    width: '100%',
    objectFit: 'contain',
    display: 'block',
    transform: 'scale(1.05)',
    transition: 'all 0.25s ease',
    filter: 'drop-shadow(15px 15px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,255,255,0.1))',
  },

  characterName: {
    position: 'absolute',
    bottom: 1,
    left: 15,
    color: '#fff',
    padding: '6px 16px',
    fontWeight: 900,
    letterSpacing: 2,
    fontSize: 13,
    border: '2px solid #fff',
    boxShadow: '5px 5px 0 rgba(0,0,0,0.5)',
    textTransform: 'uppercase' as const,
  },

  catchphrase: {
    position: 'absolute',
    bottom: -5,
    right: 10,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    letterSpacing: 1,
    fontStyle: 'italic',
  },

  cutIn: {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(120deg, transparent 0%, transparent 35%, rgba(255,255,255,0.12) 48%, transparent 60%, transparent 100%)`,
    animation: 'cutFlash 0.5s ease-out',
    pointerEvents: 'none',
  },

  powerAura: {
    position: 'absolute',
    inset: '-50px',
    filter: 'blur(35px)',
    animation: 'pulseAura 0.8s infinite alternate',
    zIndex: 0,
    borderRadius: '50%',
  },

  dialogueContainer: {
    position: 'relative',
    zIndex: 20,
    width: '100%',
    paddingBottom: 25,
    bottom: '30px',
  },

  dialogueBox: {
    width: '100%',
    background: 'rgba(5,5,15,0.96)',
    borderTop: '3px solid #ffd700',
    padding: '20px 24px',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 -15px 40px rgba(0,0,0,0.6)',
  },

  dialogueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    marginBottom: 16,
    borderLeft: '4px solid',
  },

  dialogueName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  nameIcon: {
    fontSize: 18,
  },

  emotionBadge: {
    color: '#fff',
    padding: '4px 12px',
    fontSize: 9,
    letterSpacing: 2,
    borderRadius: 20,
    fontWeight: 'bold',
  },

  dialogueText: {
    color: '#fff',
    fontSize: 'clamp(15px, 2.2vw, 22px)',
    lineHeight: 1.5,
    minHeight: 100,
    padding: '12px 8px',
    fontWeight: 700,
    letterSpacing: 1,
    textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
  },

  quoteIcon: {
    opacity: 0.5,
    fontSize: '0.9em',
    marginRight: 6,
    marginLeft: 6,
  },

  cursor: {
    animation: 'cursorBlink 1s infinite',
    marginLeft: 2,
  },

  nextButton: {
    width: '100%',
    marginTop: 12,
    padding: '14px',
    border: '2px solid #fff',
    color: '#fff',
    fontWeight: 900,
    letterSpacing: 2,
    cursor: 'pointer',
    fontSize: 12,
    animation: 'buttonPulse 1.5s infinite',
    boxShadow: '0 0 20px rgba(255,80,80,0.3)',
    transition: 'transform 0.1s',
  },

  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 50,
  },

  progressBar: {
    height: 4,
    transition: 'width 0.3s ease',
  },

  progressDots: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    display: 'flex',
    gap: 8,
  },

  progressDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
};