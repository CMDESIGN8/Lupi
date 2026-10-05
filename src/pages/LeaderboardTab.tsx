// src/pages/LeaderboardTab.tsx
import { useState, useEffect } from "react";
import { api, AppUser, LeaderEntry } from "../lib/api";

export function LeaderboardTab({ user }: { user: AppUser }) {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [clubRanking, setClubRanking] = useState<{ club: string; points: number; memberCount: number }[]>([]);
  const [rival, setRival] = useState<{ rival: LeaderEntry; diff: number; isAhead: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"individual" | "clubes">("individual");
  const [rankChange, setRankChange] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [l, clubs, rv] = await Promise.all([
          api.getLeaderboard(),
          api.getClubRanking(),
          api.getRival(user.id, user.points),
        ]);
        if (!mounted) return;

        setLeaders((prev) => {
          const oldRank = prev.findIndex((u) => u.id === user.id);
          const newRank = l.findIndex((u) => u.id === user.id);
          if (oldRank !== -1 && newRank !== -1 && oldRank !== newRank) {
            setRankChange(newRank < oldRank ? "up" : "down");
            setTimeout(() => setRankChange(null), 1500);
          }
          return l;
        });

        setClubRanking(clubs);
        setRival(rv);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const myClubRank = clubRanking.findIndex((c) => c.club === user.club) + 1;
  const ticketsNeeded = rival && rival.isAhead ? Math.ceil(rival.diff / 10) : 0;

  return (
    <div className="main-content">
      <div className="container">
        {rival && (
          <div
            className="fade-up"
            style={{
              background: rival.isAhead
                ? "linear-gradient(135deg, rgba(255,77,109,0.12), rgba(255,77,109,0.04))"
                : "linear-gradient(135deg, rgba(61,255,160,0.12), rgba(61,255,160,0.04))",
              border: `1px solid ${rival.isAhead ? "rgba(255,77,109,0.35)" : "rgba(61,255,160,0.35)"}`,
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{rival.isAhead ? "⚔️" : "🛡️"}</span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  letterSpacing: 1,
                  color: rival.isAhead ? "var(--accent2)" : "var(--success)",
                }}
              >
                {rival.isAhead ? "TU RIVAL MÁS CERCANO" : "¡ERES EL LÍDER!"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--surface2)",
                  border: `2px solid ${rival.isAhead ? "var(--accent2)" : "var(--success)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontSize: 20,
                  color: rival.isAhead ? "var(--accent2)" : "var(--success)",
                  flexShrink: 0,
                }}
              >
                {rival.rival.username[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{rival.rival.username}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{rival.rival.club}</div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  color: rival.isAhead ? "var(--accent2)" : "var(--success)",
                  letterSpacing: 0.5,
                }}
              >
                {rival.rival.points} pts
              </div>
            </div>

            <div
              style={{
                background: rival.isAhead ? "rgba(255,77,109,0.1)" : "rgba(61,255,160,0.1)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.5,
              }}
            >
              {rival.isAhead ? (
                <>
                  <span style={{ color: "var(--accent2)" }}>
                    {rival.rival.username} te lleva {rival.diff} pts de ventaja.
                  </span>
                  {ticketsNeeded > 0 && (
                    <>
                      {" "}Cargá{" "}
                      <strong style={{ color: "var(--accent)" }}>
                        {ticketsNeeded} {ticketsNeeded === 1 ? "entrada más" : "entradas más"}
                      </strong>{" "}
                      para superarlo. 🎯
                    </>
                  )}
                </>
              ) : (
                <>
                  <span style={{ color: "var(--success)" }}>Sos el líder 🏆</span>{" "}
                  {rival.rival.username} te sigue por{" "}
                  <strong style={{ color: "var(--accent)" }}>{rival.diff} pts</strong>. ¡No te duermas!
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["individual", "clubes"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: activeView === view ? "var(--accent)" : "transparent",
                color: activeView === view ? "#0a0a0f" : "var(--text2)",
                border: activeView === view ? "none" : "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                fontFamily: "var(--font-display)",
                fontSize: 16,
                letterSpacing: 1,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {view === "individual" ? "👤 Individual" : "🏟️ Por club"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
          </div>
        ) : activeView === "individual" ? (
          <>
            <div className="section-title fade-up">🏆 Ranking individual</div>
            {leaders.length === 0 ? (
              <div className="empty-state fade-up">
                <div className="empty-icon">🏟️</div>
                <div className="empty-text">Nadie cargó entradas todavía. ¡Sé el primero!</div>
              </div>
            ) : (
              leaders.map((u, i) => (
                <div
                  key={u.id}
                  className={`
                    leader-item fade-up
                    ${u.id === user.id ? "me" : ""}
                    ${u.id === user.id && rankChange === "up" ? "rank-up" : ""}
                    ${u.id === user.id && rankChange === "down" ? "rank-down" : ""}
                  `}
                >
                  <div className={`leader-rank${i < 3 ? " top" : ""}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div className="leader-avatar">{u.username[0].toUpperCase()}</div>
                  <div className="leader-info">
                    <div className="leader-name">
                      {u.username}
                      {u.id === user.id ? " (vos)" : ""}
                    </div>
                    <div className="leader-club">{u.club}</div>
                  </div>
                  <div className="leader-points">
                    {u.points} pts
                    {u.id === user.id && rankChange === "up" && " 🔥"}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className="section-title fade-up">🏟️ Ranking por club</div>

            {myClubRank > 0 && (
              <div
                className="fade-up"
                style={{
                  background: "rgba(24,157,245,0.08)",
                  border: "1px solid rgba(24,157,245,0.25)",
                  borderRadius: 12,
                  padding: "10px 16px",
                  marginBottom: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {myClubRank === 1 ? "🔥" : myClubRank <= 3 ? "⚡" : "📍"}
                </span>
                <span>
                  Tu club <strong style={{ color: "var(--accent)" }}>{user.club}</strong> está{" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {myClubRank === 1
                      ? "¡1° en el ranking!"
                      : myClubRank === 2
                      ? "2° — muy cerca del top!"
                      : `${myClubRank}° en el ranking`}
                  </strong>
                  {myClubRank > 1 && " 🏟️"}
                </span>
              </div>
            )}

            {rankChange === "up" && <div className="rank-toast up">🚀 Subiste de posición</div>}
            {rankChange === "down" && <div className="rank-toast down">⚠️ Te pasaron</div>}

            {clubRanking.length === 0 ? (
              <div className="empty-state fade-up">
                <div className="empty-icon">🏟️</div>
                <div className="empty-text">No hay datos de clubes todavía.</div>
              </div>
            ) : (
              clubRanking.map((c, i) => {
                const isMyClub = c.club === user.club;
                return (
                  <div
                    key={c.club}
                    className={`leader-item fade-up${isMyClub ? " me" : ""}`}
                  >
                    <div className={`leader-rank${i < 3 ? " top" : ""}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div
                      className="leader-avatar"
                      style={isMyClub ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
                    >
                      🏟️
                    </div>
                    <div className="leader-info">
                      <div className="leader-name">
                        {c.club}
                        {isMyClub ? " (tu club)" : ""}
                      </div>
                      <div className="leader-club">
                        {c.memberCount} {c.memberCount === 1 ? "miembro" : "miembros"}
                      </div>
                    </div>
                    <div className="leader-points">{c.points} pts</div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}