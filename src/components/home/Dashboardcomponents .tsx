// ── Componente QuickActions ────────────────────────────────────
// components/home/Dashboardcomponents.tsx - Actualizar QuickActions

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
  onOpenPack?: () => void;  // 👈 Nueva prop opcional
  packCount?: number;
  eventCount?: number;
}

export function QuickActions({
  onNavigate,
  onOpenPack,
  packCount = 0,
  eventCount = 0,
}: QuickActionsProps) {
  return (
    <>
      <style>{quickStyles}</style>
      <div className="quick-grid">

        {/* Botón ABRIR PACK - Usa onOpenPack en lugar de onNavigate */}
        <button 
          className="qcard qcard-pack" 
          onClick={() => onOpenPack ? onOpenPack() : onNavigate('album')}
        >
          <div className="qcard-icon-wrap">
            <span className="qcard-icon">📦</span>
            {packCount > 0 && <span className="qcard-badge">{packCount}</span>}
          </div>
          <span className="qcard-title">ABRIR PACK</span>
          <span className="qcard-sub">
            {packCount > 0 
              ? `Tienes ${packCount} pack${packCount !== 1 ? 's' : ''}`
              : '¡Pack diario disponible!'}
          </span>
        </button>

        <button className="qcard qcard-play" onClick={() => onNavigate('battle')}>
          <div className="qcard-icon-wrap">
            <span className="qcard-icon">⚽</span>
          </div>
          <span className="qcard-title">JUGAR</span>
          <span className="qcard-sub">Partido rápido</span>
        </button>

        <button className="qcard qcard-ticket" onClick={() => onNavigate('ticket')}>
          <div className="qcard-icon-wrap">
            <span className="qcard-icon">🎟️</span>
          </div>
          <span className="qcard-title">ENTRADAS</span>
          <span className="qcard-sub">Cargá y ganá</span>
        </button>

        <button className="qcard qcard-events" onClick={() => onNavigate('events')}>
          <div className="qcard-icon-wrap">
            <span className="qcard-icon">⭐</span>
          </div>
          <span className="qcard-title">EVENTOS</span>
          <span className="qcard-sub">Activos: {eventCount}</span>
        </button>

      </div>
    </>
  );
}

// ── Componente SeasonCard ──────────────────────────────────────
export function SeasonCard({
  level,
  exp,
  expNeeded,
  division = 'BRONCE',
  divisionTier = 'I',
  daysLeft = 17,
}: {
  level: number;
  exp: number;
  expNeeded: number;
  division?: string;
  divisionTier?: string;
  daysLeft?: number;
}) {
  const pct = Math.min((exp / expNeeded) * 100, 100);

  const divisionColor =
    division === 'ORO' ? '#ffd700' :
    division === 'PLATA' ? '#c0c0c0' :
    division === 'BRONCE' ? '#cd7f32' : '#189df5';

  const divisionIcon =
    division === 'ORO' ? '🥇' :
    division === 'PLATA' ? '🥈' :
    division === 'BRONCE' ? '🏅' : '🏆';

  return (
    <>
      <style>{seasonStyles}</style>
      <div className="season-card">
        <div className="season-top">
          <div>
            <div className="season-title-text">TEMPORADA APERTURA</div>
            <div className="season-days">⏱ {daysLeft} días restantes</div>
          </div>
          <div className="division-block">
            <div className="division-label-text">DIVISIÓN</div>
            <div className="division-name-row">
              <span className="division-icon">{divisionIcon}</span>
              <div>
                <div className="division-name-text" style={{ color: divisionColor }}>
                  {division}
                </div>
                <div className="division-tier" style={{ color: divisionColor }}>{divisionTier}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="season-xp-row">
          <span className="season-lvl-label">NIVEL {level}</span>
          <div className="season-xp-track">
            <div className="season-xp-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="season-xp-nums">{exp} / {expNeeded} XP</span>
        </div>

        <div className="season-rewards-section">
          <div className="season-rewards-label">
            <span className="rewards-arrow-label">›</span>
            PRÓXIMA RECOMPENSA
            <span className="rewards-lvl-tag">Nivel {level + 1}</span>
          </div>
          <div className="season-rewards-row">
            <div className="reward-box">
              <span className="reward-box-icon">📦</span>
              <span className="reward-box-name">PACK<br/>BRONCE</span>
            </div>
            <div className="reward-box reward-box-locked">
              <span className="reward-box-icon">💰</span>
              <span className="reward-box-name">1.000<br/>MONEDAS</span>
              <span className="reward-lock-icon">🔒</span>
            </div>
            <div className="reward-box reward-box-locked">
              <span className="reward-box-icon">💎</span>
              <span className="reward-box-name">50<br/>GEMAS</span>
              <span className="reward-lock-icon">🔒</span>
            </div>
            <button className="rewards-more-btn">›</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Componente RivalCard ───────────────────────────────────────
export function RivalCard({
  rivalName,
  rivalPts,
  myPts,
  diff,
  onChallenge,
}: {
  rivalName: string;
  rivalPts: number;
  myPts: number;
  diff: number;
  onChallenge?: () => void;
}) {
  const pct = Math.min((myPts / rivalPts) * 100, 100);

  return (
    <>
      <style>{rivalStyles}</style>
      <div className="rival-card" onClick={onChallenge}>
        <div className="rival-art-bg" />
        <div className="rival-left">
          <div className="rival-label-text">TU RIVAL</div>
          <div className="rival-name-row">
            <span className="rival-username">{rivalName}</span>
            <span className="rival-club-icon">🛡️</span>
          </div>
          <div className="rival-diff-text">Te superó por {diff} pts</div>
          <div className="rival-bar-track">
            <div className="rival-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="rival-right">
          <div className="rival-pts-val">{rivalPts.toLocaleString('es-AR')}</div>
          <div className="rival-pts-label">PTS</div>
          <span className="rival-chevron">›</span>
        </div>
      </div>
    </>
  );
}

// ── CSS: Quick Actions ─────────────────────────────────────────
const quickStyles = `
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
  }

  .qcard {
    background: #12162a;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 12px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: transform 0.18s ease;
    position: relative;
    overflow: hidden;
  }

  .qcard:active { transform: scale(0.94); }

  .qcard-pack  { background: linear-gradient(160deg, #1a1440 0%, #0f0d28 100%); }
  .qcard-play  { background: linear-gradient(160deg, #0a2014 0%, #081810 100%); }
  .qcard-ticket{ background: linear-gradient(160deg, #1e0d00 0%, #150900 100%); }
  .qcard-events{ background: linear-gradient(160deg, #180830 0%, #100620 100%); }

  .qcard-icon-wrap {
    position: relative;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
  }

  .qcard-icon { font-size: 28px; line-height: 1; }

  .qcard-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ff3333;
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    border-radius: 50%;
    width: 17px;
    height: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #0a0c16;
  }

  .qcard-title {
    font-size: 10px;
    font-weight: 900;
    color: #fff;
    text-align: center;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .qcard-sub {
    font-size: 9px;
    color: rgba(255,255,255,0.4);
    text-align: center;
    font-weight: 500;
    line-height: 1.2;
  }

  @media (max-width: 360px) {
    .qcard-title { font-size: 9px; }
    .qcard { border-radius: 12px; padding: 10px 4px; }
  }
`;

// ── CSS: Season Card ───────────────────────────────────────────
const seasonStyles = `
  .season-card {
    background: #12162a;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px;
    padding: 16px;
    width: 100%;
  }

  .season-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    gap: 10px;
  }

  .season-title-text {
    font-size: 12px;
    font-weight: 800;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }

  .season-days {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .division-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .division-label-text {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .division-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .division-icon { font-size: 28px; line-height: 1; }

  .division-name-text {
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.5px;
    line-height: 1.1;
  }

  .division-tier {
    font-size: 11px;
    font-weight: 800;
    text-align: right;
  }

  .season-xp-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .season-lvl-label {
    font-size: 10px;
    font-weight: 800;
    color: #189df5;
    letter-spacing: 1px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .season-xp-track {
    flex: 1;
    height: 6px;
    background: rgba(255,255,255,0.07);
    border-radius: 4px;
    overflow: hidden;
  }

  .season-xp-fill {
    height: 100%;
    background: linear-gradient(90deg, #189df5, #00d4ff);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .season-xp-nums {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
    flex-shrink: 0;
    font-family: monospace;
  }

  .season-rewards-section {}

  .season-rewards-label {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .rewards-arrow-label { color: rgba(255,255,255,0.2); font-size: 12px; }

  .rewards-lvl-tag {
    margin-left: 4px;
    color: #ffd700;
    font-size: 9px;
    font-weight: 700;
  }

  .season-rewards-row {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .reward-box {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 58px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }

  .reward-box:hover { background: rgba(255,255,255,0.09); }

  .reward-box-locked { opacity: 0.5; }

  .reward-box-icon { font-size: 22px; line-height: 1; }

  .reward-box-name {
    font-size: 8.5px;
    font-weight: 700;
    color: #ffd700;
    text-align: center;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .reward-lock-icon {
    position: absolute;
    top: 3px;
    right: 4px;
    font-size: 9px;
    opacity: 0.7;
  }

  .rewards-more-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: rgba(255,255,255,0.3);
    font-size: 20px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding: 0;
    transition: color 0.2s;
  }

  .rewards-more-btn:hover { color: rgba(255,255,255,0.6); }
`;

// ── CSS: Rival Card ────────────────────────────────────────────
const rivalStyles = `
  .rival-card {
    background: linear-gradient(135deg, #150608, #1c0910);
    border: 1px solid rgba(255, 50, 50, 0.15);
    border-radius: 18px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s;
    width: 100%;
  }

  .rival-card:hover { border-color: rgba(255,50,50,0.3); }

  .rival-art-bg {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 50%;
    background: linear-gradient(to left, rgba(160, 0, 0, 0.2), transparent);
    pointer-events: none;
    z-index: 0;
  }

  .rival-left {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
  }

  .rival-label-text {
    font-size: 9px;
    font-weight: 800;
    color: #ff6b6b;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .rival-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .rival-username {
    font-size: 22px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 0.3px;
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
  }

  .rival-club-icon { font-size: 18px; line-height: 1; }

  .rival-diff-text {
    font-size: 12px;
    font-weight: 600;
    color: #ff4444;
    margin-bottom: 8px;
  }

  .rival-bar-track {
    height: 5px;
    width: 140px;
    max-width: 100%;
    background: rgba(255,255,255,0.08);
    border-radius: 3px;
    overflow: hidden;
  }

  .rival-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff3333, #ff6666);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .rival-right {
    position: relative;
    z-index: 1;
    text-align: right;
    flex-shrink: 0;
  }

  .rival-pts-val {
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    line-height: 1;
  }

  .rival-pts-label {
    font-size: 11px;
    color: #ff6b6b;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .rival-chevron {
    display: block;
    font-size: 20px;
    color: rgba(255,255,255,0.2);
  }
`;

// ── CSS GLOBAL a agregar en el const styles de App.tsx ─────────
export const dashboardStyles = `
  /* ── Dashboard container ── */
  .dashboard-container {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 14px 14px 100px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .dashboard-container > * {
    width: 100%;
    box-sizing: border-box;
  }
`;