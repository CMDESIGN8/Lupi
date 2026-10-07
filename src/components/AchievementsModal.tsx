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

  // Logros máximos / legendarios
  if (
    achievement.id === "rank_1" ||
    achievement.id === "jackpot" ||
    achievement.id === "streak_10" ||
    achievement.id === "points_500"
  ) {
    return {
      label: "ÉPICO",
      color: "#f5c518",
      glow: "rgba(245,197,24,0.55)",
      bg: "rgba(245,197,24,0.08)",
    };
  }

  // Logros intermedios
  if (value >= 3 || type === "rank") {
    return {
      label: "RARO",
      color: "#189df5",
      glow: "rgba(24,157,245,0.45)",
      bg: "rgba(24,157,245,0.08)",
    };
  }

  // Iniciales
  return {
    label: "COMÚN",
    color: "#8888aa",
    glow: "rgba(136,136,170,0.35)",
    bg: "rgba(136,136,170,0.08)",
  };
};

export function AchievementsModal({
  unlocked,
  allAchievements,
  getProgress,
  onClose,
}: AchievementsModalProps) {
  const unlockedIds = new Set(
    unlocked.map((item) => item.achievement_id)
  );

  const unlockedCount = allAchievements.filter((achievement) =>
    unlockedIds.has(achievement.id)
  ).length;

  const totalCount = allAchievements.length;

  const overallProgress =
    totalCount > 0
      ? Math.round((unlockedCount / totalCount) * 100)
      : 0;

  return (
    <div
      className="achievements-modal-overlay"
      onClick={onClose}
    >
      <div
        className="achievements-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="achievements-modal-header">
          <div>
            <div className="achievements-modal-kicker">
              LUPI WORLD
            </div>

            <h2>🏆 LOGROS</h2>

            <p>
              Completá desafíos y construí tu legado.
            </p>
          </div>

          <button
            type="button"
            className="achievements-modal-close"
            onClick={onClose}
            aria-label="Cerrar logros"
          >
            ✕
          </button>
        </div>

        {/* PROGRESO GENERAL */}
        <div className="achievements-progress-card">
          <div className="achievements-progress-top">
            <div>
              <span className="achievements-progress-label">
                PROGRESO
              </span>

              <strong>
                {unlockedCount}
                <span> / {totalCount}</span>
              </strong>
            </div>

            <div className="achievements-progress-percent">
              {overallProgress}%
            </div>
          </div>

          <div className="achievements-progress-bar">
            <div
              className="achievements-progress-fill"
              style={{
                width: `${overallProgress}%`,
              }}
            />
          </div>
        </div>

        {/* LISTA */}
        <div className="achievements-modal-body">
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);

            const unlockedData = unlocked.find(
              (item) => item.achievement_id === achievement.id
            );

            const rarity = getRarity(achievement);

            // ==========================================
            // PROGRESO DEL LOGRO
            // ==========================================

            const rawProgress = getProgress(
              achievement.requirement_type,
              achievement.requirement_value
            );

            const achievementProgress = Math.max(
              0,
              Math.min(
                rawProgress,
                achievement.requirement_value
              )
            );

            const achievementPercentage =
              achievement.requirement_value > 0
                ? Math.min(
                    100,
                    Math.round(
                      (achievementProgress /
                        achievement.requirement_value) *
                        100
                    )
                  )
                : 0;

            return (
              <div
                key={achievement.id}
                className={`achievement-card ${
                  isUnlocked
                    ? "achievement-card--unlocked"
                    : "achievement-card--locked"
                }`}
                style={
                  isUnlocked
                    ? {
                        borderColor: `${rarity.color}55`,
                        boxShadow: `0 0 24px ${rarity.glow}`,
                      }
                    : undefined
                }
              >
                {/* ICONO */}
                <div
                  className="achievement-card-icon"
                  style={
                    isUnlocked
                      ? {
                          background: rarity.bg,
                          borderColor: `${rarity.color}55`,
                          boxShadow: `0 0 18px ${rarity.glow}`,
                        }
                      : undefined
                  }
                >
                  {isUnlocked ? (
                    achievement.icon
                  ) : (
                    <span className="achievement-lock">
                      🔒
                    </span>
                  )}
                </div>

                {/* INFO */}
                <div className="achievement-card-info">
                  <div className="achievement-card-title-row">
                    <h3
                      style={
                        isUnlocked
                          ? {
                              color: rarity.color,
                            }
                          : undefined
                      }
                    >
                      {achievement.name}
                    </h3>

                    {isUnlocked && (
                      <span className="achievement-check">
                        ✓
                      </span>
                    )}
                  </div>

                  <p>{achievement.description}</p>

                  {/* ======================================
                      PROGRESO INDIVIDUAL
                  ====================================== */}

                  <div className="achievement-progress">
                    <div className="achievement-progress-header">
                      <span>
                        {isUnlocked
                          ? "COMPLETADO"
                          : "PROGRESO"}
                      </span>

                      <strong>
                        {achievementProgress} /{" "}
                        {achievement.requirement_value}
                      </strong>
                    </div>

                    <div className="achievement-progress-bar">
                      <div
                        className="achievement-progress-fill"
                        style={{
                          width: `${achievementPercentage}%`,
                          background: isUnlocked
                            ? `linear-gradient(90deg, ${rarity.color}, ${rarity.color})`
                            : undefined,
                          boxShadow: isUnlocked
                            ? `0 0 10px ${rarity.glow}`
                            : undefined,
                        }}
                      />
                    </div>
                  </div>

                  {/* ESTADO */}
                  {isUnlocked && unlockedData ? (
                    <span className="achievement-date">
                      Desbloqueado el{" "}
                      {new Date(
                        unlockedData.unlocked_at
                      ).toLocaleDateString("es-AR")}
                    </span>
                  ) : (
                    <span className="achievement-locked-text">
                      🔒 Todavía no desbloqueado
                    </span>
                  )}
                </div>

                {/* RECOMPENSA / RAREZA */}
                <div className="achievement-card-right">
                  <div
                    className="achievement-rarity"
                    style={{
                      color: rarity.color,
                      borderColor: `${rarity.color}44`,
                      background: rarity.bg,
                    }}
                  >
                    {rarity.label}
                  </div>

                  <div className="achievement-reward">
                    +{achievement.points_reward} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="achievements-modal-footer">
          <span>
            🏆 Cada logro forma parte de tu progreso.
          </span>

          <button
            type="button"
            onClick={onClose}
          >
            VOLVER
          </button>
        </div>
      </div>
    </div>
  );
}