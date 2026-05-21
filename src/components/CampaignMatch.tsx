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

  // ─────────────────────────────────────────────────────────────
  // PANTALLA DE HISTORIA
  // ─────────────────────────────────────────────────────────────
    if (showStory) {
  return (
    <div style={s.screen}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');

        /* ── Speed lines & fondo ── */
        .as-speed-bg {
          position: absolute; inset: 0;
          overflow: hidden; pointer-events: none; z-index: 0;
        }
        .as-speed-bg svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%; opacity: 0.07;
        }

        /* ── Ki rings alrededor del avatar ── */
        .as-ki-ring {
          position: absolute; border-radius: 50%; border: 2px solid;
          animation: asKiPulse 2s ease-in-out infinite;
        }
        .as-ki-1 { width: 110px; height: 110px; border-color: rgba(200,100,255,0.6); animation-delay: 0s; }
        .as-ki-2 { width: 130px; height: 130px; border-color: rgba(255,215,0,0.3); animation-delay: 0.4s; }
        .as-ki-3 { width: 152px; height: 152px; border-color: rgba(255,50,50,0.15); animation-delay: 0.8s; }
        @keyframes asKiPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.05); opacity: 0.4; }
        }

        /* ── Avatar flotando ── */
        .as-avatar-emoji {
          font-size: 72px; line-height: 1; position: relative; z-index: 1;
          filter: drop-shadow(0 0 14px rgba(255,215,0,0.7));
          animation: asFloat 3s ease-in-out infinite;
        }
        @keyframes asFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }

        /* ── Flash de entrada ── */
        .as-entry-flash {
          position: absolute; inset: -20px;
          background: radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 65%);
          animation: asEntryFlash 0.6s ease-out forwards;
          pointer-events: none;
        }
        @keyframes asEntryFlash {
          0%   { opacity: 1; transform: scale(0.5); }
          100% { opacity: 0; transform: scale(2.2); }
        }

        /* ── Nombre con glitch ── */
        .as-rival-name {
          font-family: 'Russo One', sans-serif;
          font-size: 22px; color: #fff;
          text-transform: uppercase; letter-spacing: 2px;
          text-shadow: 2px 2px 0 #c800ff, -1px -1px 0 #ff0066;
          text-align: center; margin-bottom: 12px;
          animation: asGlitch 4s ease-in-out infinite;
        }
        @keyframes asGlitch {
          0%,85%,100% { text-shadow: 2px 2px 0 #c800ff, -1px -1px 0 #ff0066; clip-path: none; transform: none; }
          87% { text-shadow: -2px 2px 0 #00ffff, 2px -1px 0 #ff0066; clip-path: inset(30% 0 40% 0); transform: translateX(3px); }
          89% { text-shadow: 2px -2px 0 #ffd700, -2px 1px 0 #c800ff; clip-path: inset(60% 0 10% 0); transform: translateX(-2px); }
          91% { clip-path: none; transform: none; }
        }

        /* ── Bocadillo de cómic ── */
        .as-speech-bubble {
          position: relative;
          background: #fff; color: #0a0010;
          border-radius: 14px; border: 2px solid #0a0010;
          box-shadow: 3px 3px 0 #0a0010;
          padding: 10px 14px; max-width: 320px;
          font-family: 'Comic Sans MS', 'Chalkboard SE', cursive;
          font-size: 13px; font-weight: 700; line-height: 1.4;
          text-align: center; margin-bottom: 10px;
          animation: asBubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
        }
        @keyframes asBubblePop {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        .as-speech-bubble::after {
          content: '';
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          border: 10px solid transparent; border-bottom-color: #0a0010;
          border-top: none;
        }
        .as-speech-bubble::before {
          content: '';
          position: absolute; top: -7px; left: 50%; transform: translateX(-50%);
          border: 9px solid transparent; border-bottom-color: #fff;
          border-top: none; z-index: 1;
        }

        /* ── Separador manga (puntos) ── */
        .as-panel-div {
          width: 100%; height: 4px; margin: 8px 0;
          background: repeating-linear-gradient(90deg, #ffd700 0, #ffd700 4px, transparent 4px, transparent 8px);
          opacity: 0.35;
        }

        /* ── Texto intro ── */
        .as-intro-text {
          font-family: 'Russo One', sans-serif;
          font-size: 11px; color: rgba(255,255,255,0.7);
          line-height: 1.7; text-align: center;
          padding: 0 4px; margin-bottom: 10px; min-height: 36px;
        }
        .as-cursor { animation: asBlink 0.7s steps(1) infinite; }
        @keyframes asBlink { 50% { opacity: 0; } }

        /* ── Tip especial ── */
        .as-special-tip {
          width: 100%; border-radius: 10px;
          background: rgba(255,60,60,0.1);
          border: 1px solid rgba(255,60,60,0.5);
          padding: 8px 12px; margin-bottom: 6px;
          font-size: 11px; color: #ff6b6b;
          font-family: 'Russo One', sans-serif;
          animation: asAlertFlash 2s ease-in-out infinite;
          transition: opacity 0.5s, transform 0.5s;
        }
        @keyframes asAlertFlash {
          0%,100% { border-color: rgba(255,60,60,0.5); }
          50%      { border-color: rgba(255,60,60,1); box-shadow: 0 0 10px rgba(255,60,60,0.3); }
        }

        /* ── Botón COMENZAR ── */
        .as-start-btn {
          width: 100%;
          background: linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ff3300 100%);
          border: none; border-radius: 50px;
          padding: 14px; font-size: 16px; font-weight: 900;
          font-family: 'Russo One', sans-serif; letter-spacing: 2px;
          color: #0f0020; cursor: pointer; text-transform: uppercase;
          position: relative; overflow: hidden;
          animation: asStartPulse 1.5s ease-in-out infinite;
        }
        @keyframes asStartPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,140,0,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(255,140,0,0), 0 4px 30px rgba(255,140,0,0.5); }
        }
        .as-start-btn::after {
          content: '';
          position: absolute; top: -50%; left: -60%;
          width: 35%; height: 200%;
          background: rgba(255,255,255,0.3);
          transform: skewX(-20deg);
          animation: asStartShine 2.5s ease-in-out infinite;
        }
        @keyframes asStartShine {
          0%       { left: -60%; }
          35%,100% { left: 120%; }
        }
        .as-start-btn:hover { animation: asStartShake 0.3s ease-in-out; }
        @keyframes asStartShake {
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .as-star { position: absolute; font-size: 10px; opacity: 0.45; pointer-events: none; z-index: 1; animation: asStarSpin 6s linear infinite; }
        @keyframes asStarSpin { to { transform: rotate(360deg) translateX(8px); } }
      `}</style>

      <div style={{ ...s.storyCard, background: '#0f0020', border: '2px solid #ffd700', boxShadow: '0 0 0 4px rgba(255,215,0,0.08)', overflow: 'hidden', position: 'relative', fontFamily: "'Russo One', sans-serif" }}>

        {/* Speed lines SVG */}
        <div className="as-speed-bg">
          <svg viewBox="0 0 420 520" preserveAspectRatio="xMidYMid slice">
            {Array.from({ length: 60 }, (_, i) => {
              const angle = (i / 60) * Math.PI * 2;
              const r1 = 80 + Math.random() * 20;
              const r2 = 400 + Math.random() * 80;
              const cx = 210, cy = 180;
              return (
                <line key={i}
                  x1={cx + Math.cos(angle) * r1} y1={cy + Math.sin(angle) * r1}
                  x2={cx + Math.cos(angle) * r2} y2={cy + Math.sin(angle) * r2}
                  stroke={i % 3 === 0 ? '#ffd700' : '#fff'}
                  strokeWidth={(Math.random() * 1.5 + 0.3).toFixed(1)}
                />
              );
            })}
          </svg>
        </div>

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

          {/* Avatar con ki rings */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <div className="as-entry-flash" />
            <div className="as-ki-ring as-ki-3" />
            <div className="as-ki-ring as-ki-2" />
            <div className="as-ki-ring as-ki-1" />
            <div className="as-avatar-emoji">{opponent.avatar}</div>
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
              <div style={s.vsText}>VS</div>
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
    transition: 'width 0.8s ease',
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
    background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
    border: 'none',
    borderRadius: 40,
    padding: '13px',
    fontSize: 15,
    fontWeight: 900,
    cursor: 'pointer',
    color: '#0f172a',
    fontFamily: RUSSO,
    letterSpacing: 1,
    position: 'relative',
    overflow: 'hidden',
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
    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    border: 'none',
    padding: 16,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    color: '#0f172a',
    fontFamily: RUSSO,
    letterSpacing: 1,
  },
};