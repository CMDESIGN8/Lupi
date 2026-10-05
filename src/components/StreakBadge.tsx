import React from "react";

interface StreakBadgeProps {
  current: number;
  best: number;
  activeToday: boolean;
  atRisk: boolean;
  variant?: "compact" | "full" | "minimal";
}

export function StreakBadge({
  current,
  best,
  activeToday,
  atRisk,
  variant = "full",
}: StreakBadgeProps) {

  const getStreakStyle = () => {
    if (current >= 30) return "legendary";
    if (current >= 14) return "epic";
    if (current >= 7) return "great";
    if (current >= 3) return "good";
    return "normal";
  };

  const streakStyle = getStreakStyle();

  if (variant === "compact") {
    return (
      <div className={`streak-compact ${streakStyle}`}>
        🔥 <strong>{current}</strong>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="streak-minimal">
        🔥 {current} día{current !== 1 ? "s" : ""}
      </div>
    );
  }

  return (
    <div className={`streak-card ${streakStyle}`}>
      <div className="streak-header">
        <span className="streak-icon">🔥</span>

        <div>
          <div className="streak-current">
            {current} día{current !== 1 ? "s" : ""} consecutivo
            {current !== 1 ? "s" : ""}
          </div>

          {best > 0 && (
            <div className="streak-best">
              Récord: {best} día{best !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {activeToday && (
        <div className="streak-reward">
          ✅ Racha activa hoy
        </div>
      )}

      {!activeToday && atRisk && current > 0 && (
        <div className="streak-warning">
          ⚠️ No pierdas tu racha hoy
        </div>
      )}

      {current === 0 && (
        <div className="streak-warning">
          🚀 Comenzá tu racha hoy
        </div>
      )}
    </div>
  );
}