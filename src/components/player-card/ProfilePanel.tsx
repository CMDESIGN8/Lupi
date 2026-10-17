// src/components/player-card/ProfilePanel.tsx
import type { CSSProperties } from "react";
import type { LobbyPlayer } from "../../hooks/useLobbyPresence";
import { AttributeRadar } from "./AttributeRadar";
import { ATTRIBUTE_META } from "./constants";
import type { PlayerCompetitiveStats, PlayerProfile } from "./types";

type Props = {
  player: LobbyPlayer;
  profile: PlayerProfile | null;
  stats?: PlayerCompetitiveStats | null;
};

export function ProfilePanel({ player, profile, stats }: Props) {
  const entries: { label: string; value: number }[] = [{ label: "NIVEL", value: player.level }];
  if (stats?.matchesPlayed != null) entries.push({ label: "PARTIDOS", value: stats.matchesPlayed });
  if (stats?.wins != null) entries.push({ label: "VICTORIAS", value: stats.wins });
  if (stats?.achievements != null) entries.push({ label: "LOGROS", value: stats.achievements.length });

  return (
    <>
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
        <p className="lw-note">Todavía no hay atributos públicos disponibles.</p>
      )}
      <dl className="lw-stats">
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt>{entry.label}</dt>
            <dd>{entry.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
