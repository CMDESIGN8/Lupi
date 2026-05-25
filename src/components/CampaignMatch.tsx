import { useEffect, useState } from 'react';
import { BotConfig } from '../types/campaign';
import { MatchStory } from '../data/campaignStories';

interface CampaignMatchIntroProps {
  opponent: BotConfig;

  story: MatchStory;

  onStartMatch: () => void;

  onBack?: () => void;

  matchNumber?: number;

  totalMatches?: number;

  leagueName?: string;

  leagueIcon?: string;

  userAvatar?: string;

  userTeamStats?: {
    overall: number;
    attack: number;
    defense: number;
    technique: number;
  };

  userTeamName?: string;
}

interface DialogueLine {
  character: 'protagonist' | 'rival' | 'coach';
  text: string;
  emotion?: 'normal' | 'angry' | 'surprised' | 'determined';
}

const CHARACTERS = {
  protagonist: {
    name: 'PLAYER',
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

export default function CampaignMatchIntro({
  opponent,
  story,
  onStartMatch,
  userTeamStats,
  userTeamName = 'FC NOVATOS',
}: CampaignMatchIntroProps) {

  // ======================================================
  // STATES
  // ======================================================

  const [currentIndex, setCurrentIndex] = useState(0);

  const [displayedText, setDisplayedText] = useState('');

  const [isTyping, setIsTyping] = useState(true);

  const [showCutIn, setShowCutIn] = useState(false);

  const [showKickOff, setShowKickOff] = useState(false);

  // ======================================================
  // DIALOGOS
  // ======================================================

  const dialogues: DialogueLine[] = [
    {
      character: 'protagonist',
      text:
        '¡¿Qué?! ¡Ese delantero... es muchísimo más rápido de lo que esperaba!',
      emotion: 'surprised',
    },

    {
      character: 'rival',
      text:
        story.opponentQuotes.before ||
        'Voy a aplastarte frente a todo el estadio.',
      emotion: 'angry',
    },

    {
      character: 'coach',
      text:
        'Escucha bien... Los verdaderos jugadores despiertan bajo presión.',
      emotion: 'determined',
    },

    {
      character: 'protagonist',
      text:
        'No importa quién esté enfrente... ¡voy a ganar este partido!',
      emotion: 'determined',
    },
  ];

  const currentDialogue = dialogues[currentIndex];

  const currentCharacter =
    CHARACTERS[currentDialogue.character];

  // ======================================================
  // TYPEWRITER
  // ======================================================

  useEffect(() => {

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

    }, 24);

    return () => clearInterval(interval);

  }, [currentIndex]);

  // ======================================================
  // NEXT
  // ======================================================

  const handleNext = () => {

    if (isTyping) return;

    if (currentIndex < dialogues.length - 1) {

      setCurrentIndex((prev) => prev + 1);

    } else {

      startMatchSequence();
    }
  };

  // ======================================================
  // MATCH SEQUENCE
  // ======================================================

  const startMatchSequence = () => {

    // CUT IN
    setShowCutIn(true);

    setTimeout(() => {

      setShowKickOff(true);

    }, 1400);

    setTimeout(() => {

      onStartMatch();

    }, 2500);
  };

  // ======================================================
  // STATS
  // ======================================================

  const teamOverall =
    userTeamStats?.overall ?? 74;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div style={styles.overlay}>

      {/* ======================================================
          CUT IN
      ====================================================== */}

      {showCutIn && (
        <div className="cutin-overlay">

          <div className="cutin-speed-lines" />

          <div className="cutin-slash" />

          <div className="cutin-content">

            <div className="cutin-avatar">
              {opponent.avatar}
            </div>

            <div className="cutin-title">
              SPECIAL ENTRY
            </div>

            <div className="cutin-quote">
              {story.opponentQuotes.before}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================
          KICK OFF
      ====================================================== */}

      {showKickOff && (
        <div className="kickoff-overlay">

          <div className="kickoff-text">
            KICK OFF
          </div>

        </div>
      )}

      {/* BG */}

      <div className="scanlines" />

      <div style={styles.speedLines} />

      <div style={styles.backgroundImage} />

      <div style={styles.vignette} />

      <div style={styles.sfxText}>
        ゴゴゴゴ
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={styles.header}>

        <div style={styles.dayBadge}>
          ⚡ MATCH
        </div>

        <div style={styles.chapterBadge}>
          {opponent.name}
        </div>

      </div>

      {/* ======================================================
          CHARACTER
      ====================================================== */}

      <div style={styles.characterContainer}>

        <div
          style={{
            ...styles.characterInner,

            justifyContent:
              currentCharacter.side === 'left'
                ? 'flex-start'
                : 'flex-end',
          }}
        >

          <div style={styles.characterCard}>

            <div
              style={{
                ...styles.characterGlow,

                background: `radial-gradient(circle, ${currentCharacter.color}80, transparent)`,
              }}
            />

            <img
              src={currentCharacter.avatar}
              alt={currentCharacter.name}
              style={styles.characterImage}
            />

            <div
              style={{
                ...styles.characterName,

                background: currentCharacter.color,
              }}
            >
              {currentCharacter.name}
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          DIALOGUE
      ====================================================== */}

      <div style={styles.dialogueContainer}>

        <div style={styles.dialogueWrapper}>

          <div style={styles.dialogueBox}>

            {/* HEADER */}

            <div
              style={{
                ...styles.dialogueHeader,

                background: `linear-gradient(135deg, ${currentCharacter.color}, ${currentCharacter.color}CC)`,
              }}
            >

              <span style={styles.dialogueName}>
                {currentCharacter.name}
              </span>

              <span style={styles.dialogueEmotion}>
                {currentDialogue.emotion?.toUpperCase()}
              </span>

            </div>

            {/* TEXT */}

            <div style={styles.dialogueText}>

              {displayedText}

              {isTyping && (
                <span style={styles.cursor}>
                  _
                </span>
              )}

            </div>

            {/* MINI CARD */}

            {!isTyping &&
              currentIndex === dialogues.length - 1 && (

                <div style={styles.matchCard}>

                  <div style={styles.matchTitle}>
                    ⚽ PRÓXIMO PARTIDO
                  </div>

                  <div style={styles.vsRow}>

                    <div style={styles.teamBox}>

                      <div style={styles.teamName}>
                        {userTeamName}
                      </div>

                      <div style={styles.teamPower}>
                        {teamOverall}
                      </div>

                    </div>

                    <div style={styles.vsText}>
                      VS
                    </div>

                    <div style={styles.teamBox}>

                      <div style={styles.teamName}>
                        {opponent.name}
                      </div>

                      <div
                        style={{
                          ...styles.teamPower,
                          background: '#ff4d4d',
                          color: '#2a0000',
                        }}
                      >
                        {opponent.overall}
                      </div>

                    </div>

                  </div>

                  <div style={styles.warningBox}>
                    💀 {story.rivalSpecial}
                  </div>

                </div>
              )}

            {/* BUTTON */}

            {!isTyping && (

              <button
                style={styles.nextButton}
                onClick={handleNext}
              >

                {currentIndex < dialogues.length - 1
                  ? '▼ CONTINUE ▼'
                  : '⚽ START MATCH ⚽'}

              </button>
            )}

          </div>

        </div>

      </div>

      {/* PROGRESS */}

      <div style={styles.progressContainer}>

        <div
          style={{
            ...styles.progressBar,

            width: `${
              ((currentIndex + 1) /
                dialogues.length) *
              100
            }%`,
          }}
        />

      </div>

      {/* ======================================================
          CSS
      ====================================================== */}

      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        *{
          box-sizing:border-box;
        }

        @keyframes speedLines{
          0%{
            background-position:0 0;
          }

          100%{
            background-position:200px 0;
          }
        }

        @keyframes fadeIn{
          0%{
            opacity:0;
            transform:scale(.9);
          }

          100%{
            opacity:1;
            transform:scale(1);
          }
        }

        @keyframes slideUp{
          0%{
            transform:translateY(50px);
            opacity:0;
          }

          100%{
            transform:translateY(0);
            opacity:1;
          }
        }

        @keyframes cursorBlink{
          0%,100%{
            opacity:1;
          }

          50%{
            opacity:0;
          }
        }

        @keyframes pulse{
          0%,100%{
            opacity:.5;
            transform:scale(1);
          }

          50%{
            opacity:.2;
            transform:scale(1.1);
          }
        }

        /* ======================================================
            CUTIN
        ====================================================== */

        .cutin-overlay{
          position:fixed;
          inset:0;

          z-index:999999;

          overflow:hidden;

          background:
            radial-gradient(circle at center,
              #0d2f5f 0%,
              #06101f 55%,
              #000 100%);

          animation:cutinFade 1.5s ease forwards;
        }

        .cutin-speed-lines{
          position:absolute;
          inset:-50%;

          background:
            repeating-linear-gradient(
              115deg,
              rgba(255,255,255,.08) 0px,
              rgba(255,255,255,.08) 2px,
              transparent 2px,
              transparent 18px
            );

          animation:speedMove 8s linear infinite;
        }

        .cutin-slash{
          position:absolute;

          width:180%;
          height:220px;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(0,180,255,.95) 35%,
              rgba(255,255,255,.98) 50%,
              rgba(0,180,255,.95) 65%,
              transparent 100%
            );

          transform:
            rotate(-12deg)
            translateX(-120%);

          box-shadow:
            0 0 40px rgba(0,180,255,.9);

          animation:slashMove 1s ease forwards;
        }

        .cutin-content{
          position:absolute;

          inset:0;

          display:flex;
          flex-direction:column;

          align-items:center;
          justify-content:center;

          z-index:3;

          transform:rotate(-6deg);
        }

        .cutin-avatar{
          font-size:140px;

          margin-bottom:8px;

          filter:
            drop-shadow(0 0 20px rgba(255,255,255,.8))
            drop-shadow(0 0 50px rgba(255,215,0,.5));
        }

        .cutin-title{
          color:#ffe600;

          font-size:16px;

          letter-spacing:4px;

          margin-bottom:8px;

          font-family:'Press Start 2P', monospace;
        }

        .cutin-quote{
          max-width:320px;

          text-align:center;

          color:white;

          font-size:26px;

          line-height:1.2;

          text-transform:uppercase;

          font-weight:900;

          text-shadow:
            5px 5px 0 #000,
            0 0 25px rgba(255,255,255,.4);
        }

        /* ======================================================
            KICKOFF
        ====================================================== */

        .kickoff-overlay{
          position:fixed;
          inset:0;

          background:white;

          z-index:9999999;

          display:flex;

          align-items:center;
          justify-content:center;

          animation:kickoffFlash 1s forwards;
        }

        .kickoff-text{
          font-size:72px;

          color:black;

          font-family:'Press Start 2P', monospace;

          transform:skew(-10deg);

          animation:kickoffZoom .8s ease;
        }

        /* ======================================================
            ANIMS
        ====================================================== */

        @keyframes slashMove{
          0%{
            transform:
              rotate(-12deg)
              translateX(-120%);
          }

          100%{
            transform:
              rotate(-12deg)
              translateX(40%);
          }
        }

        @keyframes cutinFade{
          0%{
            opacity:0;
          }

          10%,80%{
            opacity:1;
          }

          100%{
            opacity:0;
          }
        }

        @keyframes speedMove{
          from{
            transform:translateX(0);
          }

          to{
            transform:translateX(-120px);
          }
        }

        @keyframes kickoffFlash{
          0%{
            opacity:0;
          }

          20%{
            opacity:1;
          }

          100%{
            opacity:0;
          }
        }

        @keyframes kickoffZoom{
          0%{
            transform:
              scale(2.5)
              skew(-10deg);

            opacity:0;
          }

          100%{
            transform:
              scale(1)
              skew(-10deg);

            opacity:1;
          }
        }

        .scanlines{
          position:fixed;

          top:0;
          left:0;

          width:100%;
          height:100%;

          background:
            repeating-linear-gradient(
              0deg,
              rgba(0,0,0,.1) 0px,
              rgba(0,0,0,.1) 2px,
              transparent 2px,
              transparent 4px
            );

          pointer-events:none;

          z-index:20;
        }

      `}</style>

    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

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

    background: `
      repeating-linear-gradient(
        -75deg,
        transparent,
        transparent 20px,
        rgba(255,255,255,0.03) 20px,
        rgba(255,255,255,0.03) 40px
      )
    `,

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

    background: `
      radial-gradient(
        circle at center,
        transparent 30%,
        rgba(0,0,0,0.85) 100%
      )
    `,
  },

  sfxText: {
    position: 'absolute',
    top: '15%',
    right: '3%',
    fontSize: '70px',
    color: 'rgba(255,255,255,0.03)',
    transform: 'rotate(-15deg)',
  },

  header: {
    position: 'relative',
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

  characterContainer: {
    flex: 0.7,
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
    width: '220px',
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

    filter:
      'drop-shadow(8px 8px 0px rgba(0,0,0,0.5))',
  },

  characterName: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '5px 12px',
    color: '#FFF',
    fontSize: 12,
    letterSpacing: 1,
    border: '2px solid #000',
    whiteSpace: 'nowrap',
    boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
  },

  dialogueContainer: {
    position: 'relative',
    padding: '0 20px 25px 20px',
    marginTop: '-20px',
    zIndex: 5,
  },

  dialogueWrapper: {
    maxWidth: 900,
    margin: '0 auto',
    width: '100%',
  },

  dialogueBox: {
    background:
      'linear-gradient(135deg, rgba(20,20,30,0.98), rgba(10,10,20,0.98))',

    border: '3px solid #F5C518',

    borderRadius: 12,

    padding: '16px',

    boxShadow:
      '8px 8px 0px rgba(0,0,0,0.5)',

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
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  dialogueEmotion: {
    color: '#FFF',
    fontSize: 9,
    opacity: 0.8,
  },

  dialogueText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 1.8,
    minHeight: '80px',
    padding: '8px',
  },

  cursor: {
    animation: 'cursorBlink 1s step-end infinite',
    marginLeft: 2,
  },

  nextButton: {
    width: '100%',

    background:
      'linear-gradient(135deg, #E52525, #8B0000)',

    border: 'none',

    padding: '12px',

    color: '#FFF',

    fontSize: 11,

    cursor: 'pointer',

    fontFamily: "'Press Start 2P', monospace",

    letterSpacing: 1,

    marginTop: 16,

    borderRadius: 6,
  },

  progressContainer: {
    position: 'relative',
    height: 3,
    background: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },

  progressBar: {
    height: '100%',
    background:
      'linear-gradient(90deg, #F5C518, #E52525)',

    transition: 'width 0.3s ease',
  },

  // ======================================================
  // MATCH CARD
  // ======================================================

  matchCard: {
    marginTop: 18,

    background:
      'rgba(255,255,255,0.04)',

    border:
      '2px solid rgba(255,255,255,0.08)',

    borderRadius: 12,

    padding: 16,
  },

  matchTitle: {
    textAlign: 'center',
    color: '#F5C518',
    marginBottom: 16,
    fontSize: 12,
  },

  vsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  teamBox: {
    flex: 1,
    textAlign: 'center',
  },

  teamName: {
    color: '#FFF',
    fontSize: 10,
    marginBottom: 8,
  },

  teamPower: {
    background: '#4ade80',
    color: '#052010',

    borderRadius: 999,

    padding: '6px 12px',

    fontSize: 16,
  },

  vsText: {
    color: '#FFF',
    fontSize: 20,
  },

  warningBox: {
    marginTop: 14,

    background:
      'rgba(255,0,0,.15)',

    border:
      '1px solid rgba(255,0,0,.35)',

    color: '#fff',

    padding: 10,

    borderRadius: 10,

    textAlign: 'center',

    fontSize: 10,

    lineHeight: 1.6,
  },
};
