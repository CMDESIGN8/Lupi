import React from "react";
import type {
  Achievement,
  UnlockedAchievement,
} from "../hooks/useAchievements";

type AchievementsModalProps = {
  unlocked: UnlockedAchievement[];
  allAchievements: Achievement[];
  getProgress: (conditionType: string, target: number) => number;
  onClose: () => void;
};


const getRarity = (achievement: Achievement) => {
  const value = achievement.requirement_value ?? 0;
  const type = achievement.requirement_type;

  if (
    achievement.id === "rank_1" ||
    achievement.id === "jackpot"
  ) {
    return {
      label: "LEGENDARIO",
      color: "#ffc83d",
      glow: "rgba(255,200,61,0.65)",
      bg: "rgba(255,200,61,0.10)",
      shape: "shield",
    };
  }

  if (
    achievement.id === "streak_10" ||
    achievement.id === "points_500"
  ) {
    return {
      label: "ÉPICO",
      color: "#a78bfa",
      glow: "rgba(167,139,250,0.5)",
      bg: "rgba(167,139,250,0.10)",
      shape: "hexagon",
    };
  }

  if (value >= 3 || type === "rank") {
    return {
      label: "RARO",
      color: "#09bceb",
      glow: "rgba(9,188,235,0.5)",
      bg: "rgba(9,188,235,0.10)",
      shape: "hexagon",
    };
  }

  return {
    label: "COMÚN",
    color: "#9aabbf",
    glow: "rgba(154,171,191,0.3)",
    bg: "rgba(154,171,191,0.08)",
    shape: "circle",
  };
};


export function AchievementsModal({
  unlocked,
  allAchievements,
  getProgress,
  onClose,
}: AchievementsModalProps) {
  const unlockedIds = new Set(unlocked.map((item) => item.achievement_id));

  const unlockedCount = allAchievements.filter((a) => unlockedIds.has(a.id)).length;
  const totalCount = allAchievements.length;
  const overallProgress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Encontrar el logro más cercano a completarse (el "MVP")
  const nextAchievement = allAchievements
    .filter((a) => !unlockedIds.has(a.id))
    .map((a) => {
      const target = Math.max(0, a.requirement_value ?? 0);
const raw = getProgress(a.requirement_type, target);
const progress = Math.max(0, Math.min(raw, target));
      const percentage = a.requirement_value > 0 ? (progress / a.requirement_value) * 100 : 0;
      return { achievement: a, progress, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage)[0];

  const nextRarity = nextAchievement ? getRarity(nextAchievement.achievement) : null;

  // Ordenar: desbloqueados primero, luego por porcentaje de progreso
  const sortedAchievements = [...allAchievements].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    
    if (!aUnlocked && !bUnlocked) {
      const aProg = a.requirement_value > 0
  ? getProgress(a.requirement_type, a.requirement_value) / a.requirement_value
  : 0;

const bProg = b.requirement_value > 0
  ? getProgress(b.requirement_type, b.requirement_value) / b.requirement_value
  : 0;

return bProg - aProg;
    }
    
    return 0;
  });

  return (
    <div className="achievements-modal-overlay" onClick={onClose}>
      <div className="achievements-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* FONDO DE PARTÍCULAS */}
        <div className="achievements-particles" aria-hidden />

        {/* CONTENIDO CON SCROLL */}
        <div className="achievements-modal-content">
          
          {/* HEADER */}
          <div className="achievements-modal-header">
            <div>
              <div className="achievements-modal-kicker">LUPI WORLD</div>
              <h2>🏆 SALA DE TROFEOS</h2>
              <p>Completá desafíos y construí tu legado.</p>
            </div>
            <button className="achievements-modal-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

      
{/* =====================================================
    ACHIEVEMENTS HUD — PROGRESO + PRÓXIMO DESAFÍO
   ===================================================== */}

<div className="achievements-overview">

  {/* PANEL 1 — PROGRESO TOTAL */}
  <section className="achievement-total-panel">

    <div className="achievement-panel-heading">
      <span className="achievement-panel-kicker">
        <span className="achievement-live-dot" />
        TU EVOLUCIÓN
      </span>
      <span className="achievement-panel-symbol">01 / WORLD</span>
    </div>

    <div className="achievement-total-content">

      {/* ANILLO CIRCULAR REAL */}
      <div className="achievement-progress-ring">
        <svg viewBox="0 0 100 100" aria-label={`Progreso total ${overallProgress}%`}>
          <circle
            className="achievement-ring-track"
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="7"
          />
          <circle
            className="achievement-ring-value"
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={263.89}
            strokeDashoffset={263.89 * (1 - overallProgress / 100)}
          />
        </svg>

        <div className="achievement-ring-center">
          <strong>{overallProgress}<small>%</small></strong>
          <span>COMPLETADO</span>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="achievement-total-info">
        <span className="achievement-total-label">LOGROS DESBLOQUEADOS</span>

        <div className="achievement-total-count">
          <strong>{unlockedCount}</strong>
          <span>/ {totalCount}</span>
        </div>

        <div className="achievement-total-bar">
          <div style={{ width: `${overallProgress}%` }} />
        </div>

        <div className="achievement-total-foot">
          <span>LEGADO LUPI</span>
          <strong>{Math.max(0, totalCount - unlockedCount)} RESTANTES</strong>
        </div>
      </div>

    </div>

    <div className="achievement-total-bottom">
      <span>⚡ CADA DESAFÍO CUENTA</span>
      <span>PROGRESO DE CARRERA</span>
    </div>

  </section>


  {/* PANEL 2 — PRÓXIMO LOGRO */}
  {nextAchievement && nextRarity && (
    <section
      className="achievement-next-panel"
      style={{
        "--rarity-color": nextRarity.color,
        "--rarity-glow": nextRarity.glow,
        "--rarity-bg": nextRarity.bg,
      } as React.CSSProperties}
    >

      <div className="achievement-panel-heading">
        <span className="achievement-panel-kicker">
          <span className="achievement-live-dot achievement-live-dot--gold" />
          PRÓXIMO DESAFÍO
        </span>

        <span className="achievement-next-rarity">
          {nextRarity.label}
        </span>
      </div>

      <div className="achievement-next-content">

        {/* MEDALLA */}
        <div className="achievement-next-medal">
          <div className="achievement-next-medal-glow" />
          <div className="achievement-next-medal-inner">
            <span>{nextAchievement.achievement.icon || "🏆"}</span>
          </div>
          <div className="achievement-next-medal-star">✦</div>
        </div>

        {/* INFORMACIÓN */}
        <div className="achievement-next-info">
          <h3>{nextAchievement.achievement.name}</h3>
          <p>{nextAchievement.achievement.description}</p>

          <div className="achievement-next-progress">
            <div className="achievement-next-progress-top">
              <span>PROGRESO DEL DESAFÍO</span>
              <strong>{Math.round(nextAchievement.percentage)}%</strong>
            </div>

            <div className="achievement-next-bar">
              <div
                style={{
                  width: `${nextAchievement.percentage}%`,
                }}
              />
            </div>

            <span className="achievement-next-counter">
              {nextAchievement.progress} / {nextAchievement.achievement.requirement_value}
            </span>
          </div>
        </div>

        {/* RECOMPENSA */}
        <div className="achievement-next-reward">
          <span className="achievement-reward-label">RECOMPENSA</span>
          <strong>+{nextAchievement.achievement.points_reward}</strong>
          <span className="achievement-reward-unit">PTS</span>

          <button
            className="achievement-next-button"
            onClick={onClose}
          >
            IR A POR ÉL <span>↗</span>
          </button>
        </div>

      </div>

      <div className="achievement-next-bottom">
        <span>✦ UN NUEVO HITO TE ESPERA</span>
        <span>DESBLOQUEÁ TU POTENCIAL</span>
      </div>

    </section>
  )}

</div>


          {/* GRILLA DE TROFEOS */}
          <div className="trophy-grid">
                        {sortedAchievements.map((achievement) => {
              const isUnlocked = unlockedIds.has(achievement.id);
              const unlockedData = unlocked.find((item) => item.achievement_id === achievement.id);
              const rarity = getRarity(achievement);
              const rawProgress = getProgress(achievement.requirement_type, achievement.requirement_value);
              const achievementProgress = Math.max(0, Math.min(rawProgress, achievement.requirement_value));
              const achievementPercentage = achievement.requirement_value > 0
                ? Math.min(100, Math.round((achievementProgress / achievement.requirement_value) * 100))
                : 0;

              return (
                <div
                  key={achievement.id}
                  className={`trophy-item trophy-item--${rarity.shape} ${isUnlocked ? "is-unlocked" : "is-locked"}`}
                  style={{
                    "--rarity-color": rarity.color,
                    "--rarity-glow": rarity.glow,
                    "--rarity-bg": rarity.bg,
                  } as React.CSSProperties}
                >
                  {/* Medalla con progreso circular */}
                  <div 
                    className="trophy-medal"
                    style={{
                      background: `conic-gradient(${rarity.color} ${achievementPercentage}%, rgba(255,255,255,0.1) 0)`
                    }}
                  >
                    <div className="trophy-medal-inner">
                      <span className="trophy-icon">
                        {isUnlocked ? achievement.icon : "🔒"}
                      </span>
                    </div>
                  </div>

                  {/* Nombre y rareza */}
                  <h3 className="trophy-name">{achievement.name}</h3>
                  <span className="trophy-rarity" style={{ color: rarity.color }}>
                    {rarity.label}
                  </span>

                  {/* Recompensa */}
                  <span className="trophy-reward">+{achievement.points_reward} PTS</span>

                  {/* TOOLTIP AL HACER HOVER */}
                  <div className="trophy-tooltip">
                    <strong>{achievement.name}</strong>
                    <p>{achievement.description}</p>
                    {!isUnlocked && (
                      <span className="trophy-tooltip-progress">
                        Progreso: {achievementProgress} / {achievement.requirement_value}
                      </span>
                    )}
                    {isUnlocked && (
                      <span className="trophy-tooltip-completed">
                        ¡Desbloqueado el {new Date(unlockedData?.unlocked_at || "").toLocaleDateString("es-AR")}!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="achievements-modal-footer">
          <span>🏆 Cada logro forma parte de tu progreso.</span>
          <button onClick={onClose}>VOLVER</button>
        </div>
      </div>
    </div>
  );
}