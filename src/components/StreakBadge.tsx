import React from "react";
import { useStreak } from "../hooks/useStreak";
import type { AppUser } from "../lib/api";

interface StreakBadgeProps {
  user: AppUser;
  variant?: "compact" | "full" | "minimal";
}

export function StreakBadge({
  user,
  variant = "full",
}: StreakBadgeProps) {
  const {
    current,
    best,
    activeToday,
    atRisk,
  } = useStreak(user);

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
        🔥 {current} {current === 1 ? "día" : "días"}
      </div>
    );
  }

  return (
    <div className={`streak-card ${streakStyle}`}>
      <div className="streak-header">
        <span className="streak-icon">🔥</span>

        <div>
          <div className="streak-current">
            {current} {current === 1 ? "día" : "días"} consecutivos
          </div>

          {best > 0 && (
            <div className="streak-best">
              Récord: {best} días
            </div>
          )}
        </div>
      </div>

      {activeToday ? (
        <div className="streak-reward">
          ✅ Racha activa hoy
        </div>
      ) : atRisk ? (
        <div className="streak-warning">
          ⚠️ No pierdas tu racha hoy
        </div>
      ) : null}
    </div>
  );
}