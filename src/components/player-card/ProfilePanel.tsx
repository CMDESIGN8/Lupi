// src/components/player-card/ProfilePanel.tsx
import type { CSSProperties } from "react";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { AttributeRadar } from "./AttributeRadar";
import { ArenaSymbol } from "../match/ArenaSymbol";
import { ACTIVITY_LABEL } from "./constants";
import { ATTRIBUTE_META } from "./constants";
import { DailyMission } from "./DailyMission";
import type { PlayerCompetitiveStats, PlayerProfile } from "./types";
import { useDailyMission } from "./useDailyMission";

type Props = {
  player: LobbyPlayer;
  profile: PlayerProfile | null;
  stats?: PlayerCompetitiveStats | null;
  /** Solo en tu propio perfil: muestra la misión del día arriba de todo. */
  showDailyMission?: boolean;
};

export function ProfilePanel({ player, profile, stats, showDailyMission }: Props) {
  const mission = useDailyMission(player.userId);

  const entries: { label: string; value: number }[] = [{ label: "NIVEL", value: player.level }];
  if (stats?.matchesPlayed != null) entries.push({ label: "PARTIDOS", value: stats.matchesPlayed });
  if (stats?.wins != null) entries.push({ label: "VICTORIAS", value: stats.wins });
  if (stats?.achievements != null) entries.push({ label: "LOGROS", value: stats.achievements.length });

  return (
    <>
      {showDailyMission && mission && <DailyMission mission={mission} />}

      {profile ? (
        <section className="lw-attrs" aria-label="Atributos del jugador">
          <AttributeRadar attributes={profile.attributes} />
          <ul className="lw-attr-list">
            {ATTRIBUTE_META.map((meta) => (
              <li
                key={meta.key}
                className="lw-attr"
                title={`${meta.life} se juega como ${meta.futsal}`}
                style={{ "--v": profile.attributes[meta.key] / 99 } as CSSProperties}
              >
                <span>
                  {meta.life} <small>{meta.code}</small>
                </span>
                <strong>{profile.attributes[meta.key]}</strong>
                <i className="lw-attr__bar" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="lw-player-passport" aria-label="Identidad pública del jugador">
          <span className="lw-player-passport__kicker">EL JUGADOR DETRÁS DEL EQUIPO</span>
          <div className="lw-player-passport__identity"><ArenaSymbol kind="shield"/><div><h4>{player.username}</h4><p>{player.club || "Lupi World"}</p></div><b>NIVEL {player.level}</b></div>
          <div className="lw-player-passport__facts"><span><small>ESTADO</small><strong>{ACTIVITY_LABEL[player.activity]}</strong></span><span><small>VESTUARIO ACTUAL</small><strong>{Object.values(player.look).filter(Boolean).length} equipables</strong></span></div>
          <p className="lw-player-passport__note">La identidad se construye dentro y fuera de la cancha.</p>
        </section>
      )}
      {(profile || entries.length > 1) && <dl className="lw-stats">
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt>{entry.label}</dt>
            <dd>{entry.value}</dd>
          </div>
        ))}
      </dl>}
    </>
  );
}