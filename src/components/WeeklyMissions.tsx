
import { useState, useEffect, useCallback, useRef } from "react";
import { api, AppUser, LeaderEntry, Ticket } from "../lib/api";
import { supabase } from "../lib/supabaseClient";

// ── Tipos ────────────────────────────────────────────────────
interface Mission {
  id: string;
  emoji: string;
  title: string;
  description: string;
  points: number;
  target: number;          // valor objetivo
  getValue: (ctx: MissionContext) => number; // valor actual
  accentColor: string;
  glowColor: string;
}

interface MissionContext {
  tickets: Ticket[];
  leaderboard: LeaderEntry[];
  user: AppUser;
  weeklyShares: number;
}

// ── Definición de misiones ───────────────────────────────────
const MISSIONS: Mission[] = [
  {
    id: "load_3_tickets",
    emoji: "🎟️",
    title: "Fanático de la semana",
    description: "Cargá 3 entradas esta semana",
    points: 30,
    target: 3,
    accentColor: "#189df5",
    glowColor: "rgba(24,157,245,0.35)",
    getValue: ({ tickets }) => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return tickets.filter(
        (t) => new Date(t.createdAt) >= startOfWeek
      ).length;
    },
  },
  {
    id: "invite_friend",
    emoji: "👥",
    title: "Traé a un amigo",
    description: "Invitá a 1 amigo nuevo con tu código",
    points: 50,
    target: 1,
    accentColor: "#3dffa0",
    glowColor: "rgba(61,255,160,0.35)",
    getValue: ({ user }) => {
      // referral_count ya existe en el perfil; tomamos si tiene al menos 1 esta semana
      // Como no tenemos fecha de referido en el perfil, usamos el total como proxy
      // Si ya completó la misión, el hook lo marca como done
      return user.referral_count ?? 0;
    },
  },
  {
    id: "keep_streak",
    emoji: "🔥",
    title: "Racha imparable",
    description: "Mantené tu racha 2 semanas seguidas",
    points: 25,
    target: 2,
    accentColor: "#ff4d6d",
    glowColor: "rgba(255,77,109,0.35)",
    getValue: ({ user }) => Math.min(user.streak ?? 0, 2),
  },
  {
    id: "share_app",
    emoji: "📤",
    title: "Difundí LupiApp",
    description: "Compartí la app con alguien esta semana",
    points: 20,
    target: 1,
    accentColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.35)",
    getValue: ({ weeklyShares }) => Math.min(weeklyShares, 1),
  },
  {
    id: "reach_top5",
    emoji: "🏆",
    title: "Élite de la semana",
    description: "Llegá al Top 5 del ranking general",
    points: 40,
    target: 1,
    accentColor: "#f5c518",
    glowColor: "rgba(245,197,24,0.35)",
    getValue: ({ leaderboard, user }) => {
      const rank = leaderboard.findIndex((u) => u.id === user.id) + 1;
      return rank > 0 && rank <= 5 ? 1 : 0;
    },
  },
];

// ── CSS ──────────────────────────────────────────────────────
const MISSIONS_CSS = `
.wm-section-title {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 1px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wm-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.wm-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
}

.wm-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.wm-summary-text {
  font-size: 13px;
  color: var(--text2);
  font-weight: 600;
}

.wm-summary-pts {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--accent);
  letter-spacing: 0.5px;
}

.wm-mission {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(42,42,58,0.6);
  transition: opacity 0.3s;
}

.wm-mission:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.wm-mission.done {
  opacity: 0.65;
}

.wm-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.wm-icon.done::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  background: rgba(10,10,15,0.55);
  backdrop-filter: blur(2px);
}

.wm-info {
  flex: 1;
  min-width: 0;
}

.wm-title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wm-desc {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 8px;
}

.wm-progress-track {
  height: 6px;
  background: var(--surface2);
  border-radius: 100px;
  overflow: hidden;
}

.wm-progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.wm-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.wm-pts-badge {
  font-family: var(--font-display);
  font-size: 14px;
  padding: 3px 10px;
  border-radius: 100px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.wm-progress-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  letter-spacing: 0.5px;
}

/* Toast de misión completada */
@keyframes wm-toast-in {
  from { transform: translateY(20px) scale(0.9); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes wm-toast-out {
  to { transform: translateY(-10px) scale(0.95); opacity: 0; }
}

.wm-toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5000;
  background: var(--surface);
  border: 1px solid;
  border-radius: 100px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  white-space: nowrap;
  animation: wm-toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
  font-weight: 700;
  font-size: 14px;
}

.wm-toast.hide {
  animation: wm-toast-out 0.3s ease forwards;
}
`;

// ── Toast de misión completada ───────────────────────────────
function MissionToast({
  mission,
  onHide,
}: {
  mission: Mission;
  onHide: () => void;
}) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 3000);
    const t2 = setTimeout(() => onHide(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onHide]);

  return (
    <div
      className={`wm-toast${hiding ? " hide" : ""}`}
      style={{ borderColor: mission.accentColor, color: mission.accentColor,
        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 20px ${mission.glowColor}` }}
    >
      <span style={{ fontSize: 20 }}>{mission.emoji}</span>
      <span style={{ color: "var(--text)" }}>
        ¡Misión completada!{" "}
        <strong style={{ color: mission.accentColor }}>+{mission.points} pts</strong>
      </span>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
interface WeeklyMissionsProps {
  user: AppUser;
  tickets: Ticket[];
  leaderboard: LeaderEntry[];
  onPointsUpdate: (newPoints: number) => void;
}

export function WeeklyMissions({
  user,
  tickets,
  leaderboard,
  onPointsUpdate,
}: WeeklyMissionsProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [weeklyShares, setWeeklyShares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMission, setToastMission] = useState<Mission | null>(null);
  // Evitar doble-trigger en el mismo render
  const processingRef = useRef<Set<string>>(new Set());

  // Cargar estado inicial
  useEffect(() => {
    Promise.all([
      api.getCompletedMissions(user.id),
      api.getWeeklyShareCount(user.id),
    ]).then(([done, shares]) => {
      setCompletedIds(new Set(done));
      setWeeklyShares(shares);
      setLoading(false);
    });
  }, [user.id]);

  // Evaluar misiones y disparar completado si corresponde
  const ctx: MissionContext = { tickets, leaderboard, user, weeklyShares };

  useEffect(() => {
    if (loading) return;

    MISSIONS.forEach(async (mission) => {
      if (completedIds.has(mission.id)) return;
      if (processingRef.current.has(mission.id)) return;

      const current = mission.getValue(ctx);
      if (current >= mission.target) {
        processingRef.current.add(mission.id);

        const result = await api.completeMission(user.id, mission.id, mission.points);

        if (result.success) {
          setCompletedIds((prev) => new Set([...prev, mission.id]));
          setToastMission(mission);
          if (result.newPoints !== undefined) {
            onPointsUpdate(result.newPoints);
          }
        }

        processingRef.current.delete(mission.id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, leaderboard, weeklyShares, loading]);

  const completedCount = MISSIONS.filter((m) => completedIds.has(m.id)).length;
  const totalPossiblePts = MISSIONS.reduce((s, m) => s + m.points, 0);
  const earnedPts = MISSIONS.filter((m) => completedIds.has(m.id)).reduce(
    (s, m) => s + m.points,
    0
  );

  if (loading) return null;

  return (
    <>
      <style>{MISSIONS_CSS}</style>

      {toastMission && (
        <MissionToast
          mission={toastMission}
          onHide={() => setToastMission(null)}
        />
      )}

      <div className="wm-section-title fade-up">🎯 Misiones de la semana</div>

      <div className="wm-card fade-up">
        {/* Resumen */}
        <div className="wm-summary">
          <div>
            <div className="wm-summary-text">
              {completedCount}/{MISSIONS.length} completadas
            </div>
            <div style={{ marginTop: 6, height: 5, width: 160, background: "var(--surface2)", borderRadius: 100, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(completedCount / MISSIONS.length) * 100}%`,
                  background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                  borderRadius: 100,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text2)", textAlign: "right", marginBottom: 2 }}>
              Ganado
            </div>
            <div className="wm-summary-pts">
              {earnedPts}<span style={{ fontSize: 14, color: "var(--text2)" }}>/{totalPossiblePts}</span>
            </div>
          </div>
        </div>

        {/* Lista de misiones */}
        {MISSIONS.map((mission) => {
          const current = mission.getValue(ctx);
          const done = completedIds.has(mission.id);
          const pct = Math.min((current / mission.target) * 100, 100);

          return (
            <div
              key={mission.id}
              className={`wm-mission${done ? " done" : ""}`}
            >
              {/* Ícono */}
              <div
                className={`wm-icon${done ? " done" : ""}`}
                style={{
                  background: `${mission.accentColor}18`,
                  boxShadow: done ? `0 0 14px ${mission.glowColor}` : "none",
                  transition: "box-shadow 0.4s",
                }}
              >
                {mission.emoji}
              </div>

              {/* Info + barra */}
              <div className="wm-info">
                <div className="wm-title">{mission.title}</div>
                <div className="wm-desc">{mission.description}</div>
                <div className="wm-progress-track">
                  <div
                    className="wm-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: done
                        ? `linear-gradient(90deg, ${mission.accentColor}, ${mission.accentColor}aa)`
                        : `linear-gradient(90deg, ${mission.accentColor}88, ${mission.accentColor})`,
                      boxShadow: done ? `0 0 6px ${mission.glowColor}` : "none",
                    }}
                  />
                </div>
              </div>

              {/* Puntos + progreso */}
              <div className="wm-right">
                <div
                  className="wm-pts-badge"
                  style={{
                    background: done
                      ? `${mission.accentColor}22`
                      : "var(--surface2)",
                    color: done ? mission.accentColor : "var(--text2)",
                    border: `1px solid ${done ? mission.accentColor + "44" : "var(--border)"}`,
                  }}
                >
                  {done ? "✓" : "+"}{mission.points} pts
                </div>
                <div className="wm-progress-label">
                  {done
                    ? "¡Completada!"
                    : `${Math.min(current, mission.target)}/${mission.target}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}