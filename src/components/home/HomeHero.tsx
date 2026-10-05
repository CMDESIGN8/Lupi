// components/home/HomeHero.tsx
interface HomeHeroProps {
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  onClick: () => void;
  energy?: number;
  energyMax?: number;
  timerLabel?: string;
  rewardIcon?: string;  // 👈 Nueva prop
  rewardCoins?: number;  // 👈 Nueva prop
  rewardDescription?: string; // 👈 Nueva prop
}

export function HomeHero({
  title,
  subtitle,
  buttonText,
  image,
  onClick,
  energy = 18,
  energyMax = 20,
  timerLabel = '02:45',
  rewardIcon = '💰',
  rewardCoins = 500,
  rewardDescription,
}: HomeHeroProps) {
  return (
    <>
      <style>{heroStyles}</style>

      <div className="hero-banner">
        <img src={image} className="hero-bg-img" alt="" aria-hidden="true" />
        <div className="hero-overlay-dark" />
        <div className="hero-glow-blue" />
        <div className="hero-lines-deco" />

        <div className="hero-content">
          <div className="hero-top-row">
            <div className="hero-mission-badge">⚽ MISIÓN ACTUAL</div>
            <div className="hero-meta">
              <div className="hero-energy-pill">
                <span className="hero-energy-icon">⚡</span>
                <span className="hero-energy-val">{energy}/{energyMax}</span>
                <button className="hero-energy-plus">+</button>
              </div>
              <div className="hero-timer">{timerLabel}</div>
            </div>
          </div>

          <h2 className="hero-title">{title}</h2>

          <p className="hero-subtitle"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />

          <div className="hero-reward-row">
            <span className="hero-reward-label">RECOMPENSA</span>
            <div className="hero-reward-items">
              <div className="hero-reward-item">{rewardIcon}</div>
              <span className="hero-reward-arrow">›</span>
              <div className="hero-reward-item">🌟 {rewardCoins}</div>
            </div>
            {rewardDescription && (
              <div className="hero-reward-hint">{rewardDescription}</div>
            )}
          </div>

          <button className="hero-cta-btn" onClick={onClick}>
            <span className="hero-cta-icon">⚽</span>
            {buttonText}
            <span className="hero-cta-arrow">›</span>
          </button>
        </div>
      </div>
    </>
  );
}

const heroStyles = `
  .hero-banner {
    position: relative;
    overflow: hidden;
    border-radius: 22px;
    min-height: 290px;
    background: linear-gradient(160deg, #0a0f28 0%, #03060f 100%);
    border: 1px solid rgba(0, 150, 255, 0.18);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    isolation: isolate;
  }

  /* BG image */
  .hero-bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: right center;
    opacity: 0.38;
    transform: scale(1.04);
    filter: saturate(1.2) contrast(1.05);
    pointer-events: none;
    z-index: 0;
  }

  /* Dark overlay bottom-to-top */
  .hero-overlay-dark {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(4, 8, 22, 0.63) 35%,
      rgba(4, 8, 22, 0.5) 65%,
      rgba(4, 8, 22, 0.15) 100%
    );
    z-index: 1;
  }

  /* Blue glow top-right */
  .hero-glow-blue {
    position: absolute;
    top: -80px;
    right: -60px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 140, 255, 0.3) 0%, transparent 70%);
    z-index: 1;
    pointer-events: none;
  }

  /* Diagonal lines decoration */
  .hero-lines-deco {
    position: absolute;
    bottom: -20px;
    left: -10%;
    width: 120%;
    height: 100px;
    background: repeating-linear-gradient(
      -12deg,
      rgba(255, 255, 255, 0.025),
      rgba(255, 255, 255, 0.025) 2px,
      transparent 2px,
      transparent 14px
    );
    z-index: 2;
    pointer-events: none;
  }

  /* Main content */
  .hero-content {
    position: relative;
    z-index: 3;
    padding: 18px 18px 18px 18px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Top row */
  .hero-top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  /* Mission badge */
  .hero-mission-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 200, 150, 0.12);
    border: 1px solid rgba(0, 200, 150, 0.28);
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #00e5b0;
    text-transform: uppercase;
  }

  /* Right meta: energy + timer */
  .hero-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .hero-energy-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 200, 0, 0.12);
    border: 1px solid rgba(255, 200, 0, 0.28);
    border-radius: 999px;
    padding: 4px 10px;
  }

  .hero-energy-icon { font-size: 13px; line-height: 1; }

  .hero-energy-val {
    font-size: 13px;
    font-weight: 700;
    color: #ffd700;
  }

  .hero-energy-plus {
    background: rgba(255, 200, 0, 0.2);
    border: none;
    color: #ffd700;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 1;
  }

  .hero-timer {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
    font-weight: 600;
    text-align: right;
    font-family: monospace;
  }

  /* Title */
  .hero-title {
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: 48px;
    line-height: 0.92;
    font-weight: 900;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: -1px;
    max-width: 230px;
    text-shadow: 0 3px 20px rgba(0, 0, 0, 0.6);
    margin: 0 0 10px;
  }

  /* Subtitle */
  .hero-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.78);
    font-weight: 500;
    line-height: 1.45;
    max-width: 210px;
    margin: 0 0 14px;
  }

  .hero-subtitle span,
  .hero-subtitle strong {
    color: #189df5;
    font-weight: 700;
  }

  /* Reward row */
  .hero-reward-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .hero-reward-label {
    font-size: 9.5px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #ffd700;
    text-transform: uppercase;
  }

  .hero-reward-items {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .hero-reward-item {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 5px 9px;
    font-size: 13px;
    font-weight: 700;
    color: #ffd700;
  }

  .hero-reward-arrow {
    color: rgba(255, 255, 255, 0.3);
    font-size: 16px;
    line-height: 1;
  }

  /* CTA Button */
  .hero-cta-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 54px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(180deg, #ffd200 0%, #e69500 100%);
    color: #111;
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow:
      0 8px 28px rgba(230, 149, 0, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
    transition: transform 0.14s ease, box-shadow 0.18s ease;
  }

  .hero-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 34px rgba(230, 149, 0, 0.52),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  .hero-cta-btn:active {
    transform: scale(0.975);
  }

  .hero-cta-icon { font-size: 20px; line-height: 1; }
  .hero-cta-arrow { font-size: 20px; opacity: 0.6; }

  /* Responsive */
  @media (max-width: 380px) {
    .hero-title { font-size: 38px; max-width: 190px; }
    .hero-banner { min-height: 260px; }
    .hero-cta-btn { height: 50px; font-size: 19px; }
  }
    .hero-reward-hint {
    font-size: 9px;
    color: rgba(255,255,255,0.5);
    margin-left: 8px;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 480px) {
    .hero-reward-hint {
      display: none;
    }
  }
`;