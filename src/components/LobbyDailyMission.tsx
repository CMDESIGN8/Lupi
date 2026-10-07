import React from "react";
import { DailyMission } from "../types/campaignStory";
import "./LobbyDailyMission.css";

type Props = {
  mission: DailyMission | null;
  currentDay: number;
  onClaimReward: (missionId: string) => void;
  onStartMission: (mission: DailyMission) => void;
};

function getMissionIcon(type: string) {
  const icons: Record<string, string> = {
    play_match: "⚽",
    share: "📱",
    open_pack: "📦",
    watch_ad: "📺",
    complete_training: "💪",
    social_share: "🤝",
  };

  return icons[type] || "✦";
}

export function LobbyDailyMission({
  mission,
  currentDay,
  onClaimReward,
  onStartMission,
}: Props) {
  if (!mission) {
    return (
      <section className="lobby-daily lobby-daily--empty">
        <div className="lobby-daily__top">
          <span>DAILY QUEST</span>
          <strong>DÍA {currentDay}</strong>
        </div>

        <div className="lobby-daily__empty">
          <span>✦</span>
          <strong>PREPARANDO TU MISIÓN</strong>
          <small>Volvé en unos segundos.</small>
        </div>
      </section>
    );
  }

  const progress = Math.min(
    100,
    Math.round(
      (mission.currentProgress / Math.max(1, mission.requirement)) * 100
    )
  );

  const completed =
    mission.isCompleted && !mission.isClaimed;

  const claimed =
    mission.isCompleted && mission.isClaimed;

  return (
    <section
      className={[
        "lobby-daily",
        completed ? "is-ready" : "",
        claimed ? "is-completed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="lobby-daily__glow" />

      <header className="lobby-daily__header">
        <div>
          <span className="lobby-daily__eyebrow">
            DAILY QUEST
          </span>

          <strong>
            MISIÓN DEL DÍA
          </strong>
        </div>

        <span className="lobby-daily__day">
          ☀ DÍA {currentDay}
        </span>
      </header>

      <div className="lobby-daily__body">
        <div className="lobby-daily__icon">
          {mission.icon || getMissionIcon(mission.type)}
        </div>

        <div className="lobby-daily__content">
          <strong className="lobby-daily__title">
            {mission.title}
          </strong>

          <span className="lobby-daily__description">
            {mission.description}
          </span>

          <div className="lobby-daily__progress">
            <div className="lobby-daily__track">
              <div
                className="lobby-daily__fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span>
              {mission.currentProgress}/{mission.requirement}
            </span>
          </div>

          <div className="lobby-daily__rewards">
            <span>✦ +{mission.reward.xp} XP</span>

            {mission.reward.coins && (
              <span>🪙 +{mission.reward.coins}</span>
            )}
          </div>
        </div>
      </div>

      <footer className="lobby-daily__footer">
        {completed ? (
          <button
            type="button"
            onClick={() => onClaimReward(mission.id)}
          >
            🎁 RECLAMAR
          </button>
        ) : claimed ? (
          <span className="lobby-daily__claimed">
            ✓ COMPLETADA
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onStartMission(mission)}
          >
            {getMissionIcon(mission.type)} VER MISIÓN
          </button>
        )}
      </footer>
    </section>
  );
}