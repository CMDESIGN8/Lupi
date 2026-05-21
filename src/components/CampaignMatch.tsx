// src/components/CampaignMatch.tsx - Versión ANIME / FIFA ULTIMATE TEAM
import { useState,useEffect } from 'react';
import { BotConfig } from '../types/campaign';
import { MatchStory } from '../data/campaignStories';

// Dentro del mismo archivo, antes del componente CampaignMatch
function AnimeTypewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, 22);
    return () => clearInterval(id);
  }, [text]);

  return (
    <div className="as-intro-text">
      {displayed}{!done && <span className="as-cursor">▋</span>}
    </div>
  );
}

interface CampaignMatchProps {
  opponent: BotConfig;
  matchNumber: number;
  totalMatches: number;
  leagueName: string;
  leagueIcon: string;
  story: MatchStory;
  onStartMatch: () => void;
  onBack: () => void;
  userTeamStats?: {
    overall: number;
    attack: number;
    defense: number;
    technique: number;
    cardsCount: number;
  };
  userTeamName?: string;
  userAvatar?: string;
}

type StatKey = 'atk' | 'def' | 'tec' | null;

export function CampaignMatch({
  opponent,
  matchNumber,
  totalMatches,
  leagueName,
  leagueIcon,
  story,
  onStartMatch,
  onBack,
  userTeamStats,
  userTeamName = 'MI EQUIPO',
  userAvatar = '⚡',
}: CampaignMatchProps) {
  const [showStory, setShowStory] = useState(true);
  const [activeTip, setActiveTip] = useState<StatKey>(null);
  const [introFlash, setIntroFlash] = useState(true);
const [showPowerAura, setShowPowerAura] = useState(false);
const [showCutIn, setShowCutIn] = useState(true);

useEffect(() => {

  const cutin = setTimeout(() => {
    setShowCutIn(false);
  }, 1600);

  const flash = setTimeout(() => {
    setIntroFlash(false);
  }, 2200);

  const aura = setTimeout(() => {
    setShowPowerAura(true);
  }, 2400);

  return () => {
    clearTimeout(cutin);
    clearTimeout(flash);
    clearTimeout(aura);
  };

}, []);

  const teamOverall = userTeamStats?.overall ?? 75;
  const teamAttack = userTeamStats?.attack ?? 70;
  const teamDefense = userTeamStats?.defense ?? 70;
  const teamTechnique = userTeamStats?.technique ?? 70;
  

  const rivalStats = {
    attack: Math.floor(opponent.overall * 0.9),
    defense: Math.floor(opponent.overall * 0.85),
    technique: Math.floor(opponent.overall * 0.88),
  };

  const maxStat = 100;

  const statDefs = [
    {
      key: 'atk' as StatKey,
      label: '⚔️ Ataque',
      iconClass: 'icon-atk',
      userVal: teamAttack,
      rivalVal: rivalStats.attack,
      barClass: 'bar-atk',
      rivalBarClass: 'bar-atk-rival',
      numColor: '#ff6b6b',
      tipTitle: '⚔️ Ataque = hacer goles',
      tipText:
        'Cuanto más alto, más chances de meter la pelota adentro. Si tu ataque es mayor que el de ellos, ¡vas a hacer más goles!',
    },
    {
      key: 'def' as StatKey,
      label: '🛡️ Defensa',
      iconClass: 'icon-def',
      userVal: teamDefense,
      rivalVal: rivalStats.defense,
      barClass: 'bar-def',
      rivalBarClass: 'bar-def-rival',
      numColor: '#4ade80',
      tipTitle: '🛡️ Defensa = no recibir goles',
      tipText:
        'Es el muro de tu equipo. Si tu defensa es alta, el rival va a tener que sudar mucho para meterte un gol.',
    },
    {
      key: 'tec' as StatKey,
      label: '✨ Técnica',
      iconClass: 'icon-tec',
      userVal: teamTechnique,
      rivalVal: rivalStats.technique,
      barClass: 'bar-tec',
      rivalBarClass: 'bar-tec-rival',
      numColor: '#a17aff',
      tipTitle: '✨ Técnica = jugadas mágicas',
      tipText:
        'Es la habilidad del equipo. Alta técnica = gambetas, pases increíbles y jugadas que nadie espera. ¡Como Messi!',
    },
  ];

  const totalUser = teamOverall;
  const totalRival = opponent.overall;
  const totalSum = totalUser + totalRival;
  const userPct = Math.round((totalUser / totalSum) * 100);
  const rivalPct = 100 - userPct;

  const difficultyLabel: Record<string, string> = {
    easy: '⭐ FÁCIL',
    medium: '⚡ MEDIO',
    hard: '🔥 DIFÍCIL',
  };

  if (showCutIn) {
  return (
    <div className="anime-cutin-screen">

      <style>{`

        .anime-cutin-screen{
          position:fixed;
          inset:0;

          background:
            radial-gradient(circle at center,
              #0d2f5f 0%,
              #06101f 55%,
              #000 100%);

          overflow:hidden;

          display:flex;
          align-items:center;
          justify-content:center;

          z-index:99999;

          animation:cutinFade 1.6s ease forwards;
        }

        /* SPEED LINES */

        .anime-cutin-screen::before{
          content:'';

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

        /* DIAGONAL */

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

        /* CONTENT */

        .cutin-content{
          position:relative;

          z-index:3;

          display:flex;
          flex-direction:column;
          align-items:center;

          transform:rotate(-6deg);

          animation:contentPop .5s ease;
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

          text-shadow:
            0 0 14px rgba(255,230,0,.8);
        }

        .cutin-quote{
          max-width:320px;

          text-align:center;

          color:white;

          font-size:34px;

          line-height:1.05;

          text-transform:uppercase;

          font-weight:900;

          text-shadow:
            5px 5px 0 #000,
            0 0 25px rgba(255,255,255,.4);
        }

        /* ANIMS */

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

        @keyframes contentPop{
          0%{
            transform:
              rotate(-6deg)
              scale(1.5);

            opacity:0;
          }

          100%{
            transform:
              rotate(-6deg)
              scale(1);

            opacity:1;
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

      `}</style>

      <div className="cutin-slash" />

      <div className="cutin-content">

        <div className="cutin-avatar">
          {opponent.avatar}
        </div>

        <div className="cutin-title">
          SPECIAL ENTRY
        </div>

        <div className="cutin-quote">
          LA NOCHE ES NUESTRA
        </div>

      </div>
    </div>
  );
}

  // ─────────────────────────────────────────────────────────────
  // PANTALLA DE HISTORIA
  // ─────────────────────────────────────────────────────────────
    if (showStory) {
  return (
    <div style={s.screen}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');

*{
  box-sizing:border-box;
}

/* =========================
   SUPER CAMPEONES FX
========================= */

.as-screen-flash{
  position:absolute;
  inset:0;
  background:white;
  z-index:999;
  animation:flashAnime .9s forwards;
  pointer-events:none;
}

@keyframes flashAnime{
  0%{opacity:1;}
  100%{opacity:0;}
}

/* SPEED LINES */

.as-speed-bg{
  position:absolute;
  inset:0;
  overflow:hidden;
  z-index:0;
}

.anime-rays{
  background:
    repeating-linear-gradient(
      115deg,
      rgba(120,190,255,0.10) 0px,
      rgba(120,190,255,0.10) 2px,
      transparent 2px,
      transparent 18px
    );
  opacity:.35;
  pointer-events:none;
}

.as-speed-bg::before{
  content:'';
  position:absolute;
  inset:-50%;
  background:
    repeating-linear-gradient(
      115deg,
      rgba(255,255,255,.14) 0px,
      rgba(255,255,255,.14) 2px,
      transparent 2px,
      transparent 14px
    );
  animation:speedMove 12s linear infinite;
  transform:scale(1.4);
}

@keyframes speedMove{
  from{transform:translateX(0) scale(1.4);}
  to{transform:translateX(-120px) scale(1.4);}
}

/* MANGA PANELS */

.as-manga-panel{
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.06;
  background-image:
    linear-gradient(125deg, transparent 48%, white 49%, white 50%, transparent 51%),
    linear-gradient(-125deg, transparent 48%, white 49%, white 50%, transparent 51%);
  background-size:100% 100%;
}

/* ENERGY */

.as-energy{
  position:absolute;
  width:240px;
  height:240px;
  border-radius:50%;

  background:
    radial-gradient(circle,
      rgba(255,255,255,.9) 0%,
      rgba(255,220,0,.55) 20%,
      rgba(255,120,0,.18) 45%,
      transparent 70%);

  filter:blur(18px);

  animation:
    auraPulse 1.8s ease-in-out infinite,
    auraRotate 8s linear infinite;
}
    @keyframes auraPulse{
  0%,100%{
    transform:scale(1);
    opacity:.8;
  }

  50%{
    transform:scale(1.25);
    opacity:1;
  }
}

@keyframes auraRotate{
  from{ transform:rotate(0deg); }
  to{ transform:rotate(360deg); }
}

@keyframes energyPulse{
  0%,100%{
    transform:scale(1);
    opacity:.8;
  }
  50%{
    transform:scale(1.2);
    opacity:1;
  }
}

/* AVATAR */

.as-avatar-emoji{
  font-size:84px;
  position:relative;
  z-index:2;
  animation:avatarFloat 3s ease-in-out infinite;
  filter:
    drop-shadow(0 0 10px rgba(255,255,255,.6))
    drop-shadow(0 0 30px rgba(255,215,0,.5));
}

@keyframes avatarFloat{
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(-10px);}
}

/* NAME */

.as-rival-name{
  font-family:'Russo One', sans-serif;

  font-size:42px;

  text-transform:uppercase;

  letter-spacing:4px;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #0066ff 45%,
      #00ffff 100%
    );

  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;

  transform:skew(-8deg);

  text-shadow:
    4px 4px 0 #e7e7e7,
    0 0 25px rgba(0, 4, 255, 0.45);

  margin-bottom:18px;

  animation:titleImpact .5s ease;
}

@keyframes nameImpact{
  from{
    transform:scale(2);
    opacity:0;
  }
  to{
    transform:scale(1);
    opacity:1;
  }
}

/* EPISODE */

.as-episode{
  position:absolute;
  top:18px;
  left:18px;
  background:#000;
  border:2px solid #ffd700;
  color:#ffd700;
  padding:6px 14px;
  border-radius:40px;
  font-size:11px;
  letter-spacing:2px;
  z-index:4;
}

/* SPEECH */

.as-speech-bubble{
  position:relative;
  background:#f5f5f5;
  color:#111;
  border-radius:22px;
  padding:18px 22px;
  max-width:320px;
  margin-bottom: 20px;
  font-size:15px;
  font-weight:900;
  line-height:1.5;

  border:4px solid #111;

  box-shadow:
    0 6px 0 #111,
    0 0 30px rgba(255,255,255,.1);

  transform:rotate(-1deg);
}

@keyframes bubblePop{
  from{
    transform:scale(.5);
    opacity:0;
  }
  to{
    transform:scale(1);
    opacity:1;
  }
}

.as-speech-bubble::after{
  content:'';
  position:absolute;
  bottom:-20px;
  left:50%;
  transform:translateX(-50%);
  border-width:20px 18px 0;
  border-style:solid;
  border-color:black transparent transparent;
}

.as-speech-bubble::before{
  content:'';
  position:absolute;
  bottom:-14px;
  left:50%;
  transform:translateX(-50%);
  border-width:16px 14px 0;
  border-style:solid;
  border-color:white transparent transparent;
  z-index:1;
}

/* TYPEWRITER */

.as-intro-text{
  font-size:13px;
  color:rgba(255,255,255,.85);

  line-height:1.8;
  text-align:center;

  max-width:340px;

  margin:auto;
  margin-bottom:14px;
}

.as-cursor{
  animation:blink .7s infinite;
}

@keyframes blink{
  50%{opacity:0;}
}

/* SPECIAL WARNING */

.as-special-tip{
  background:
    linear-gradient(
      135deg,
      rgba(255,0,0,.22),
      rgba(255,140,0,.12)
    );
  border:2px solid #ff6b6b;
  color:#fff;
  border-radius:16px;
  padding:12px;
  font-size:12px;
  line-height:1.5;
  box-shadow:0 0 18px rgba(255,0,0,.2);
  animation:dangerPulse 1.6s infinite;
}

@keyframes dangerPulse{
  0%,100%{
    transform:scale(1);
  }
  50%{
    transform:scale(1.03);
  }
}

/* START BUTTON */

.as-start-btn{
  position:relative;

  width:100%;

  background:
    linear-gradient(
      135deg,
      #00e1ff 0%,
      #0077ff 45%,
      #002bff 100%
    );

  border:4px solid white;

  border-radius:18px;

  padding:20px;

  font-size:20px;

  font-weight:900;

  letter-spacing:3px;

  color:white;

  transform:skew(-8deg);

  overflow:hidden;

  box-shadow:
    0 0 30px rgba(0,140,255,.45),
    0 0 60px rgba(0,140,255,.25);

  transition:.2s;
}

.as-start-btn:hover{
  transform:skew(-8deg) scale(1.04);
}

.as-start-btn::before{
  content:'';
  position:absolute;
  top:-50%;
  left:-60%;
  width:40%;
  height:200%;
  background:rgba(255,255,255,.35);
  transform:skewX(-20deg);
  animation:btnShine 2s infinite;
}

@keyframes btnShine{
  0%{left:-60%;}
  100%{left:130%;}
}

/* MOBILE */

@media(max-width:700px){

  .as-rival-name{
    font-size:22px;
  }

 .as-avatar-emoji{
  font-size:96px;
  line-height:1;

  filter:
    drop-shadow(0 0 25px rgba(255,215,0,.45));

  animation:captainFloat 3s ease-in-out infinite;
}

@keyframes captainFloat{
  0%,100%{
    transform:translateY(0);
  }

  50%{
    transform:translateY(-8px);
  }
}

  .as-speech-bubble{
    max-width:100%;
    font-size:13px;
  }

  .as-start-btn{
    font-size:15px;
    padding:16px;
  }
}
  .impact-kanji{
  position:absolute;

  top:10px;
  right:20px;

  font-size:64px;
  font-weight:900;

  color:white;

  opacity:.08;

  transform:rotate(-12deg);

  text-shadow:
    0 0 10px rgba(255,255,255,.5);

  animation:kanjiPulse 2s infinite;
}
  @keyframes kanjiPulse{
  0%,100%{
    transform:rotate(-12deg) scale(1);
  }

  50%{
    transform:rotate(-12deg) scale(1.08);
  }
}
  /* =========================
   ANIME CUT-IN
========================= */

.anime-cutin{
  position:absolute;
  inset:0;

  z-index:50;

  overflow:hidden;

  pointer-events:none;

  animation:cutinFade 1.1s ease forwards;
}

/* FRANJA DIAGONAL */

.cutin-slash{
  position:absolute;

  width:160%;
  height:180px;

  background:
    linear-gradient(
      90deg,
      rgba(0,0,0,.0),
      rgba(0,140,255,.95),
      rgba(255,255,255,.95),
      rgba(0,140,255,.95),
      rgba(0,0,0,.0)
    );

  top:50%;

  left:-120%;

  transform:
    translateY(-50%)
    rotate(-12deg);

  box-shadow:
    0 0 40px rgba(0,140,255,.8);

  animation:slashMove .9s ease forwards;
}

/* CONTENIDO */

.cutin-content{
  position:absolute;

  inset:0;

  display:flex;

  align-items:center;

  justify-content:center;

  gap:18px;

  transform:rotate(-8deg);
}

/* AVATAR */

.cutin-avatar{
  font-size:90px;

  filter:
    drop-shadow(0 0 12px rgba(255,255,255,.9))
    drop-shadow(0 0 40px rgba(0,140,255,.9));

  animation:cutinPop .5s ease;
}

/* TEXTO */

.cutin-text-wrap{
  display:flex;
  flex-direction:column;
}

.cutin-title{
  font-size:14px;

  letter-spacing:3px;

  color:#ffe600;

  text-shadow:
    0 0 10px rgba(255,230,0,.8);

  margin-bottom:4px;
}

.cutin-quote{
  max-width:240px;

  font-size:20px;

  line-height:1.2;

  color:white;

  font-weight:900;

  text-transform:uppercase;

  text-shadow:
    4px 4px 0 #000,
    0 0 18px rgba(255,255,255,.45);
}

/* ANIMACIONES */

@keyframes slashMove{
  0%{
    left:-140%;
  }

  100%{
    left:40%;
  }
}

@keyframes cutinFade{
  0%{
    opacity:0;
  }

  10%{
    opacity:1;
  }

  80%{
    opacity:1;
  }

  100%{
    opacity:0;
  }
}

@keyframes cutinPop{
  0%{
    transform:scale(2);
    opacity:0;
  }

  100%{
    transform:scale(1);
    opacity:1;
  }
}
`}</style>
      <div style={{ ...s.storyCard, background:
'linear-gradient(180deg,#06101f 0%,#0b2347 50%,#020814 100%)', border: '2px solid #ffd700', boxShadow: '0 0 0 4px rgba(255,215,0,0.08)', overflow: 'hidden', position: 'relative', fontFamily: "'Russo One', sans-serif" }}>

        {introFlash && <div className="as-screen-flash" />}

<div className="as-manga-panel" />
<div className="anime-rays" />

        {/* Destellos decorativos */}
        <span className="as-star" style={{ top: 30, left: 20 }}>✦</span>
        <span className="as-star" style={{ top: 80, right: 25, animationDelay: '-2s' }}>✧</span>
        <span className="as-star" style={{ bottom: 80, left: 30, animationDelay: '-4s' }}>✦</span>

        {/* Header */}
        <div style={s.storyHeader}>
          <span style={{ color: '#ffd700', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {leagueIcon} {leagueName}
          </span>
          <button style={s.skipBtn} onClick={() => setShowStory(false)}>SALTAR ✕</button>
        </div>
        {/* Panel principal */}
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <div className="impact-kanji">危</div>

          {/* Avatar con ki rings */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <div className="as-entry-flash" />
            <div className="as-ki-ring as-ki-1" />
            <>
  {showPowerAura && <div className="as-energy" />}
  <div className="as-avatar-emoji">
    {opponent.avatar}
  </div>
</>
          </div>

          <div className="as-rival-name">{opponent.name}</div>

          <div className="as-speech-bubble">"{story.opponentQuotes.before}"</div>

          <div className="as-panel-div" />

          <AnimeTypewriter text={story.intro} />

          <div className="as-special-tip">💀 {story.rivalSpecial}</div>
        </div>

        <div className="as-panel-div" style={{ margin: '12px 0 0' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px 16px' }}>
          <button className="as-start-btn" onClick={() => setShowStory(false)}>
            ⚡ COMENZAR PARTIDO ⚡
          </button>
        </div>
      </div>
    </div>
  );
}

  // ─────────────────────────────────────────────────────────────
  // PANTALLA PRINCIPAL DE PARTIDO
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={s.screen}>
      {/* Fuente Russo One desde Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');

        .cm-btn-play {
            width: 100%;
    background: linear-gradient(135deg, #00e1ff, #0077ff, #002bff);
    border: 4px solid white;
    box-shadow: 0 0 30px rgba(0, 140, 255, 0.45), 0 0 60px rgba(0, 140, 255, 0.25);
    padding: 16px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    color: #fff;
    font-family: 'Russo One', sans-serif; /* asumiendo RUSSO es Russo One */
    letter-spacing: 1px;}
    
        .cm-btn-play::after {
          content: '';
          position: absolute;
          top: -50%; left: -60%;
          width: 40%; height: 200%;
          background: rgba(255,255,255,0.25);
          transform: skewX(-20deg);
          animation: cmShine 3s ease-in-out infinite;
        }
        @keyframes cmShine {
          0%   { left: -60%; }
          40%, 100% { left: 120%; }
        }
        @keyframes cmSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .cm-ball-spin { animation: cmSpin 4s linear infinite; display: inline-block; }

        .cm-stat-row { cursor: pointer; transition: background 0.2s; border-radius: 10px; padding: 6px 8px; }
        .cm-stat-row:hover { background: rgba(255,255,255,0.05); }

        .bar-atk       { background: #ff6b6b; }
        .bar-atk-rival { background: #cc3333; opacity: 0.75; }
        .bar-def       { background: #4ade80; }
        .bar-def-rival { background: #22a35a; opacity: 0.75; }
        .bar-tec       { background: #a17aff; }
        .bar-tec-rival { background: #7a44ee; opacity: 0.75; }

        .icon-atk { background: rgba(255,107,107,0.2); border: 1px solid rgba(255,107,107,0.4); }
        .icon-def { background: rgba(74,222,128,0.2);  border: 1px solid rgba(74,222,128,0.4); }
        .icon-tec { background: rgba(161,122,255,0.2); border: 1px solid rgba(161,122,255,0.4); }

        .diff-easy   { background: #4ade80; color: #052010; }
        .diff-medium { background: #fbbf24; color: #2a1800; }
        .diff-hard   { background: #ff6b6b; color: #2a0000; }
      `}</style>

      <div style={s.card}>

        {/* ── FONDO CANCHA ── */}
        <div style={s.pitchBg}>
          <div style={s.pitchGrid} />
          <div style={s.pitchCircle} />

          {/* Banner de liga */}
          <div style={s.leagueBanner}>
            <span>{leagueIcon} {leagueName}</span>
            <span>Partido {matchNumber} de {totalMatches}</span>
          </div>

          {/* ── ÁREA VS ── */}
          <div style={s.vsArea}>

            {/* EQUIPO USUARIO */}
            <div style={s.teamSide}>
              <div style={{ ...s.avatarRing, ...s.avatarUser }}>{userAvatar}</div>
              <div style={s.teamLabel}>{userTeamName}</div>
              <div style={{ ...s.overallPill, ...s.pillUser }}>{teamOverall}</div>
            </div>

            {/* VS CENTRAL */}
            <div style={s.vsCenter}>
              <div style={{
  ...s.vsText,
  fontSize: 42,
  transform: 'skew(-10deg)',
  color: '#fff',
  textShadow: `
    0 0 10px #ffd700,
    0 0 30px #ff6600,
    4px 4px 0 #000
  `,
}}>
  VS
</div>
              <span className="cm-ball-spin" style={{ fontSize: 22 }}>⚽</span>
            </div>

            {/* EQUIPO RIVAL */}
            <div style={s.teamSide}>
              <div style={{ ...s.avatarRing, ...s.avatarRival }}>{opponent.avatar}</div>
              <div style={s.teamLabel}>{opponent.name}</div>
              <div style={{ ...s.overallPill, ...s.pillRival }}>{opponent.overall}</div>
              <span
                className={`diff-${opponent.difficulty ?? 'medium'}`}
                style={s.diffBadge}
              >
                {difficultyLabel[opponent.difficulty ?? 'medium'] ?? '⚡ MEDIO'}
              </span>
            </div>
          </div>
        </div>

        {/* ── STATS ENFRENTADAS ── */}
        <div style={s.statsSection}>
          <div style={s.statsTitle}>⚡ tocá cada stat para entender qué hace ⚡</div>

          {statDefs.map((st) => (
            <div key={st.key as string}>
              <div
                className="cm-stat-row"
                onClick={() => setActiveTip(activeTip === st.key ? null : st.key)}
              >
                <div style={s.statRowInner}>
                  <div className={`icon-box ${st.iconClass}`} style={s.iconBox}>
                    {st.label.split(' ')[0]}
                  </div>
                  <div style={s.barWrap}>
                    <div style={s.barLabelRow}>
                      <span style={s.statName}>{st.label}</span>
                      <span style={{ ...s.statNums, color: st.numColor }}>
                        {st.userVal} vs {st.rivalVal}
                      </span>
                    </div>
                    <div style={s.doubleBar}>
                      <div
                        className={st.barClass}
                        style={{
                          ...s.barHalf,
                          width: `${(st.userVal / maxStat) * 100}%`,
                          borderRadius: '4px 0 0 4px',
                        }}
                      />
                      <div
                        className={st.rivalBarClass}
                        style={{
                          ...s.barHalf,
                          width: `${(st.rivalVal / maxStat) * 100}%`,
                          borderRadius: '0 4px 4px 0',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tooltip desplegable */}
              {activeTip === st.key && (
                <div style={s.tooltip}>
                  <div style={s.tooltipTitle}>{st.tipTitle}</div>
                  <div style={s.tooltipText}>{st.tipText}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── BARRA DE PODER TOTAL ── */}
        <div style={s.powerCompare}>
          <div style={s.powerHeader}>
            <span>⚡ TU PODER</span>
            <span>PODER RIVAL 🔥</span>
          </div>
          <div style={s.powerTrack}>
            <div style={{ ...s.powerUser, width: `${userPct}%` }}>{totalUser}</div>
            <div style={{ ...s.powerRival, width: `${rivalPct}%` }}>{totalRival}</div>
          </div>
        </div>

        {/* ── RECOMPENSAS ── */}
        <div style={s.rewardsRow}>
          <div style={s.rewardChip}>✨ +{opponent.xpBase} XP</div>
          <div style={s.rewardChip}>🪙 +{Math.floor(opponent.xpBase * 1.5)} Pts</div>
          <div style={s.rewardChip}>⭐ +1 Estrella</div>
        </div>

        <div style={{
  marginTop: 16,
  textAlign: 'center',
  color: '#ffd700',
  fontSize: 11,
  letterSpacing: 1,
  padding: '0 20px',
  lineHeight: 1.6,
}}>
  📣 "¡El estadio entero contiene la respiración!
  Este podría ser el partido que cambie la historia del club..."
</div>

        {/* ── BOTONES ── */}
        <div style={s.btnRow}>
          <button style={s.btnBack} onClick={onBack}>VOLVER</button>
          <button
            className="cm-btn-play"
            style={s.btnPlay}
            onClick={onStartMatch}
          >
            ⚽ JUGAR
          </button>
        </div>

        <div style={s.tapHint}>tocá cada stat para aprender qué hace</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const RUSSO = "'Russo One', sans-serif";

const s: Record<string, React.CSSProperties> = {
  screen: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(180deg, #0a0f1a 0%, #0a1525 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
    overflowY: 'auto',
  },
  card: {
    maxWidth: 500,
    width: '100%',
    backgroundColor: '#05101e',
    borderRadius: 24,
    border: '1px solid #ffd700',
    boxShadow: '0 0 40px rgba(255,215,0,0.12)',
    overflow: 'hidden',
    fontFamily: RUSSO,
    paddingBottom: 20,
  },

  // ── CANCHA ──
  pitchBg: {
    position: 'relative',
    background: 'radial-gradient(ellipse at center, #1a6e35 0%, #0d4220 60%, #072812 100%)',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  pitchGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 60px),
      repeating-linear-gradient(0deg,  rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 60px)
    `,
  },
  pitchCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  leagueBanner: {
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 20px',
    fontSize: 11,
    color: '#ffd700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,215,0,0.2)',
  },

  // ── VS ──
  vsArea: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 16px 0',
    gap: 8,
    zIndex: 1,
  },
  teamSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 44,
    marginBottom: 4,
  },
  avatarUser: {
    background: 'radial-gradient(circle, #1e3a5f, #0a1e3a)',
    border: '3px solid #4ade80',
    boxShadow: '0 0 20px rgba(74,222,128,0.4)',
  },
  avatarRival: {
    background: 'radial-gradient(circle, #3a1e1e, #1a0a0a)',
    border: '3px solid #ff6b6b',
    boxShadow: '0 0 20px rgba(255,107,107,0.4)',
  },
  teamLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: 110,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  overallPill: {
    fontSize: 22,
    fontWeight: 900,
    padding: '2px 14px',
    borderRadius: 30,
    fontFamily: RUSSO,
  },
  pillUser: { background: '#4ade80', color: '#052010' },
  pillRival: { background: '#ff6b6b', color: '#2a0000' },
  diffBadge: {
    fontSize: 9,
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  vsCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    width: 60,
  },
  vsText: {
    fontSize: 26,
    fontWeight: 900,
    color: '#ffd700',
    textShadow: '0 0 12px rgba(255,215,0,0.5)',
    fontFamily: RUSSO,
  },

  // ── STATS ──
  statsSection: {
    padding: '16px 16px 0',
  },
  statsTitle: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statRowInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  barWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  barLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statNums: {
    fontSize: 10,
  },
  doubleBar: {
    height: 8,
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
  },
  barHalf: {
    height: '100%',
    transition: 'width 1.2s cubic-bezier(.17,.67,.2,1.3)',
    boxShadow: '0 0 12px rgba(255,255,255,.15)',
  },
  tooltip: {
    background: 'rgba(0,0,0,0.88)',
    borderRadius: 10,
    padding: '8px 12px',
    margin: '4px 8px 8px',
    borderLeft: '3px solid #ffd700',
  },
  tooltipTitle: {
    fontWeight: 700,
    color: '#ffd700',
    fontSize: 12,
    marginBottom: 2,
    fontFamily: RUSSO,
  },
  tooltipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.5,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 400,
  },

  // ── PODER TOTAL ──
  powerCompare: {
    margin: '14px 16px 0',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  powerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  powerTrack: {
    height: 16,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
  },
  powerUser: {
    background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 6,
    fontSize: 9,
    fontWeight: 700,
    color: '#052010',
    transition: 'width 1s ease',
  },
  powerRival: {
    background: 'linear-gradient(90deg, #ff6b6b, #f97316)',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 6,
    fontSize: 9,
    fontWeight: 700,
    color: '#2a0000',
    transition: 'width 1s ease',
  },

  // ── REWARDS ──
  rewardsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    margin: '14px 16px 0',
    flexWrap: 'wrap',
  },
  rewardChip: {
    background: 'rgba(255,215,0,0.1)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 11,
    color: '#ffd700',
    fontWeight: 700,
  },

  // ── BOTONES ──
  btnRow: {
    display: 'flex',
    gap: 10,
    margin: '14px 16px 0',
  },
  btnBack: {
    flex: 1,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
    borderRadius: 40,
    padding: '12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: RUSSO,
    letterSpacing: 0.5,
  },
  btnPlay: {
  flex: 2,
  background:
    'linear-gradient(135deg,#00e1ff  0%,#0077ff  45%,#002bff  100%)',
  border: '2px solid #fff',
  borderRadius: 999,
  padding: '15px',
  fontSize: 17,
  fontWeight: 900,
  cursor: 'pointer',
  color: '#fff',
  fontFamily: RUSSO,
  letterSpacing: 2,
  position: 'relative',
  overflow: 'hidden',
  boxShadow:
    '0 0 30px rgba(0,140,255,.45)',
},
  tapHint: {
    textAlign: 'center',
    fontSize: 9,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 10,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 400,
    letterSpacing: 0.5,
  },

  // ── HISTORIA ──
  storyCard: {
    maxWidth: 450,
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    overflow: 'hidden',
    border: '1px solid #ffd700',
    fontFamily: RUSSO,
  },
  storyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottom: '1px solid rgba(255,215,0,0.2)',
    fontSize: 12,
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: RUSSO,
  },
  storyContent: {
    padding: 24,
    textAlign: 'center',
  },
  storyAvatar: {
    fontSize: 80,
    marginBottom: 12,
  },
  storyName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#ffd700',
    marginBottom: 16,
  },
  storyQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 16,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 20,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 400,
  },
  storyTip: {
    fontSize: 12,
    padding: 12,
    backgroundColor: 'rgba(61,255,160,0.08)',
    borderRadius: 12,
    border: '1px solid rgba(61,255,160,0.25)',
    color: '#4ade80',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 400,
  },
  startBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #00e1ff,#0077ff , #002bff',
    border: '4px solid white',
    padding: 16,
    fontWeight: 700,
    fontSize: 16, 
    cursor: 'pointer',
    color: '#fff',
    fontFamily: RUSSO,
    letterSpacing: 1,
  },
};


  
