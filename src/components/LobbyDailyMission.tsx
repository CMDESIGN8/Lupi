import React from "react";
import { DailyMission } from "../types/campaignStory";

type Props = {
  mission: DailyMission | null;
  currentDay: number;
  onClaimReward: (missionId: string) => void;
  onStartMission: (mission: DailyMission) => void;
};

function getMissionIcon(type: string) {
  const icons: Record<string, string> = {
    play_match: '⚽',
    share: '📱',
    social_share: '📱',
    chat: '💬',
    challenge: '⚔️',
    challenge_accept: '🤝',
    challenge_win: '🏆',
    open_pack: '📦',
    watch_ad: '📺',
    complete_training: '💪',
    training: '💪',
  };

  return icons[type] || '✦';
}
export function LobbyDailyMission({
  mission,
  currentDay,
  onClaimReward,
  onStartMission,
}: Props) {
  if (!mission) {
    return (
      <div className="gh-world__mission">
        <span className="gh-world__mission-kicker">
          MISIÓN DEL DÍA · DÍA {currentDay}
        </span>

        <strong>PREPARANDO MISIÓN</strong>

        <span>
          Volvé en unos segundos.
        </span>
      </div>
    );
  }

  const progress = Math.min(
    100,
    Math.round(
      (mission.currentProgress /
        Math.max(1, mission.requirement)) *
        100
    )
  );

  const completed =
    mission.isCompleted && !mission.isClaimed;

  const claimed =
    mission.isCompleted && mission.isClaimed;

  /*
   * Cuando todavía está en progreso:
   * mostramos exactamente el estilo anterior.
   *
   * Cuando está completa:
   * cambiamos solamente el texto inferior.
   */

  let kicker = `MISIÓN DEL DÍA · DÍA ${currentDay}`;
  let title = mission.title;
  let description = mission.description;

  if (completed) {
    kicker = "MISIÓN COMPLETADA";
    title = "¡RECOMPENSA LISTA!";
    description = `+${mission.reward.xp} XP${
      mission.reward.coins
        ? ` · +${mission.reward.coins} monedas`
        : ""
    }`;
  }

  if (claimed) {
    kicker = "MISIÓN COMPLETADA";
    title = "¡OBJETIVO CUMPLIDO!";
    description = "La recompensa ya fue reclamada.";
  }

  return (
    <div className="gh-world__mission">
      <span className="gh-world__mission-kicker">
        {kicker}
      </span>

      <strong>{title}</strong>

      <span>
        {description}
      </span>

      {/* progreso */}
      {!completed && !claimed && (
        <div className="gh-world__mission-progress">
          <div className="gh-world__mission-progress-track">
            <div
              className="gh-world__mission-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span>
            {getMissionIcon(mission.type)}{" "}
            {mission.currentProgress}/
            {mission.requirement}
          </span>
        </div>
      )}

      {/* recompensa */}
      {!claimed && (
        <div className="gh-world__mission-reward">
          <span>
            ✦ +{mission.reward.xp} XP
          </span>

          {mission.reward.coins && (
            <span>
              🪙 +{mission.reward.coins}
            </span>
          )}
          {mission.reward.points && (
  <span>⭐ +{mission.reward.points}</span>
)}
        </div>
      )}

      {/* acción */}
      {completed && (
        <button
          type="button"
          className="gh-world__mission-action gh-world__mission-action--claim"
          onClick={() => onClaimReward(mission.id)}
        >
          🎁 RECLAMAR
        </button>
      )}

      {!completed && !claimed && (
        <button
          type="button"
          className="gh-world__mission-action"
          onClick={() => onStartMission(mission)}
        >
          {getMissionIcon(mission.type)} VER MISIÓN
        </button>
      )}
    </div>
  );
}