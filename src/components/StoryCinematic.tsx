// src/components/StoryCinematic.tsx

import { useEffect, useState } from 'react';
import { StoryChapter } from '../types/campaignStory';

interface StoryCinematicProps {
  chapter: StoryChapter;
  onComplete: () => void;
  dayNumber: number;
}

export default function StoryCinematic({
  chapter,
  onComplete,
  dayNumber,
}: StoryCinematicProps) {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [showText, setShowText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);

  const dialogues = chapter.cinematics.characterDialogues;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentDialogueIndex < dialogues.length) {
      setShowText('');
      setIsTyping(true);

      const text = dialogues[currentDialogueIndex].text;

      let i = 0;

      const interval = setInterval(() => {
        if (i < text.length) {
          setShowText((prev) => prev + text[i]);
          i++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 28);

      setFlashScreen(true);

      setTimeout(() => {
        setFlashScreen(false);
      }, 150);

      return () => clearInterval(interval);
    }
  }, [currentDialogueIndex]);

  const currentDialogue = dialogues[currentDialogueIndex];

  const handleNext = () => {
    if (currentDialogueIndex < dialogues.length - 1) {
      setCurrentDialogueIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const emotionColor = {
    happy: '#ffcc00',
    sad: '#5dade2',
    determined: '#ff5500',
    angry: '#ff2222',
  }[currentDialogue?.emotion || 'happy'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');

        @keyframes speedLines {
          from {
            background-position: 0 0;
          }

          to {
            background-position: 400px 0;
          }
        }

        @keyframes animeEntrance {
          0% {
            transform: scale(1.3);
            opacity: 0;
            filter: blur(10px);
          }

          100% {
            transform: scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes dialogueImpact {
          0% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes blinkCursor {
          0%, 100% {
            opacity: 1;
          }

          50% {
            opacity: 0;
          }
        }

        @keyframes flashAnim {
          0% {
            opacity: 0.8;
          }

          100% {
            opacity: 0;
          }
        }

        @keyframes shakeText {
          0% { transform: translateX(0px); }
          25% { transform: translateX(-1px); }
          50% { transform: translateX(1px); }
          75% { transform: translateX(-1px); }
          100% { transform: translateX(0px); }
        }

        .cinematic-mobile {
          flex-direction: row;
        }

        @media (max-width: 768px) {

          .cinematic-mobile {
            flex-direction: column;
            align-items: center;
          }

        }
      `}</style>

      <div style={styles.overlay}>
        {/* FLASH */}
        {flashScreen && (
          <div style={styles.flashOverlay} />
        )}

        {/* SPEEDLINES */}
        <div style={styles.speedBackground} />

        {/* OSCURECER */}
        <div style={styles.darkLayer} />

        {/* SFX JAPONES */}
        <div style={styles.sfx}>ゴゴゴゴ</div>

        {/* DIA */}
        <div style={styles.dayBadge}>
          DAY {dayNumber}
        </div>

        {/* TITULO */}
        <div style={styles.chapterTitle}>
          {chapter.title}
        </div>

        {/* CINEMATICA */}
        <div
          style={styles.cinematicContainer}
          className="cinematic-mobile"
        >
          {/* PERSONAJE */}
          <div style={styles.characterSide}>
            <div
              style={{
                ...styles.characterAura,
                background: `radial-gradient(circle, ${emotionColor}, transparent 70%)`,
              }}
            />

            <img
              src="https://i.imgur.com/VKQF0dZ.png"
              alt="character"
              style={styles.characterImage}
            />

            {/* EMOCION */}
            <div
              style={{
                ...styles.emotionBadge,
                background: emotionColor,
              }}
            >
              {currentDialogue.emotion?.toUpperCase()}
            </div>
          </div>

          {/* DIALOGO */}
          <div style={styles.dialogueBox}>
            {/* FLASH LINE */}
            <div style={styles.flashLine} />

            {/* NOMBRE */}
            <div style={styles.characterName}>
              {currentDialogue.character}
            </div>

            {/* TEXTO */}
            <div style={styles.dialogueText}>
              {showText}

              {isTyping && (
                <span style={styles.cursor}>
                  ▋
                </span>
              )}
            </div>

            {/* BOTON */}
            {!isTyping && (
              <button
                style={styles.nextButton}
                onClick={handleNext}
              >
                {currentDialogueIndex <
                dialogues.length - 1
                  ? '▶ CONTINUAR'
                  : '⚽ COMENZAR PARTIDO'}
              </button>
            )}
          </div>
        </div>

        {/* SKIP */}
        {showSkip && (
          <button
            style={styles.skipButton}
            onClick={handleSkip}
          >
            SKIP ✕
          </button>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    zIndex: 99999,
    fontFamily: "'Bangers', cursive",
    background: '#000',
  },

  flashOverlay: {
    position: 'absolute',
    inset: 0,
    background: '#fff',
    zIndex: 10,
    animation: 'flashAnim 0.15s ease-out',
    pointerEvents: 'none',
  },

  speedBackground: {
    position: 'absolute',
    inset: 0,

    background: `
      repeating-linear-gradient(
        -75deg,
        #111,
        #111 2px,
        #1d1d1d 2px,
        #1d1d1d 6px
      )
    `,

    animation: 'speedLines 1s linear infinite',
  },

  darkLayer: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.85) 100%)',
  },

  sfx: {
    position: 'absolute',

    top: '2vh',
    right: '3vw',

    fontSize: 'clamp(60px, 10vw, 160px)',

    color: 'rgba(255,255,255,0.05)',

    transform: 'rotate(-10deg)',

    pointerEvents: 'none',
  },

  dayBadge: {
    position: 'absolute',

    top: 20,
    left: 20,

    background:
      'linear-gradient(to bottom, #ffcc00, #ff5500)',

    border: '4px solid #000',

    boxShadow: '0 5px 0 #000',

    padding: '10px 20px',

    color: '#fff',

    fontSize: 20,

    letterSpacing: '2px',

    zIndex: 5,
  },

  chapterTitle: {
    position: 'absolute',

    top: 90,
    width: '100%',

    textAlign: 'center',

    fontSize: 'clamp(28px, 4vw, 60px)',

    color: '#fff',

    textShadow: `
      0 0 20px #ffcc00,
      4px 4px 0 #000
    `,

    letterSpacing: '4px',

    animation: 'shakeText 0.5s infinite',

    zIndex: 5,
  },

  cinematicContainer: {
    position: 'absolute',

    bottom: '3vh',
    left: '3vw',

    width: '94vw',
    maxWidth: '1400px',

    display: 'flex',
    alignItems: 'flex-end',
    gap: '2vw',

    animation: 'animeEntrance 0.4s ease-out',
  },

  characterSide: {
    position: 'relative',
    flexShrink: 0,
  },

  characterAura: {
    position: 'absolute',
    inset: -30,

    borderRadius: '50%',

    filter: 'blur(30px)',

    opacity: 0.7,
  },

  characterImage: {
    width: 'clamp(180px, 25vw, 380px)',

    position: 'relative',

    zIndex: 2,

    filter: `
      drop-shadow(0 0 20px rgba(255,200,0,0.4))
      drop-shadow(8px 8px 0px #000)
    `,
  },

  emotionBadge: {
    position: 'absolute',

    bottom: 20,
    right: 0,

    border: '4px solid #000',

    padding: '8px 14px',

    color: '#fff',

    fontSize: 18,

    zIndex: 5,

    boxShadow: '0 5px 0 #000',
  },

  dialogueBox: {
    position: 'relative',

    flex: 1,

    minWidth: '280px',

    background: `
      radial-gradient(#dcdcdc 1px, transparent 1px),
      white
    `,

    backgroundSize: '8px 8px',

    border: '5px solid #000',

    boxShadow: '14px 14px 0px #000',

    padding: 'clamp(18px, 2vw, 30px)',

    transform: 'skew(-2deg)',

    animation: 'dialogueImpact 0.2s ease-out',
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

  characterName: {
    color: '#ff5500',

    fontSize: 'clamp(22px, 2vw, 36px)',

    marginBottom: 20,

    textShadow: '2px 2px 0 #000',

    letterSpacing: '2px',
  },

  dialogueText: {
    color: '#111',

    whiteSpace: 'pre-line',

    fontSize: 'clamp(18px, 2vw, 28px)',

    lineHeight: 1.6,

    minHeight: 120,

    letterSpacing: '1px',
  },

  cursor: {
    animation: 'blinkCursor 1s infinite',
  },

  nextButton: {
    marginTop: 24,

    background:
      'linear-gradient(to bottom, #ffcc00, #ff5500)',

    border: '4px solid #000',

    boxShadow: '0 6px 0 #000',

    padding: '14px 26px',

    color: '#fff',

    fontSize: 'clamp(18px, 2vw, 24px)',

    cursor: 'pointer',

    fontFamily: "'Bangers', cursive",

    letterSpacing: '2px',
  },

  skipButton: {
    position: 'absolute',

    top: 20,
    right: 20,

    background: '#111',

    border: '4px solid #000',

    color: '#fff',

    padding: '10px 16px',

    cursor: 'pointer',

    fontSize: 16,

    fontFamily: "'Bangers', cursive",

    boxShadow: '0 5px 0 #000',

    zIndex: 5,
  },
};