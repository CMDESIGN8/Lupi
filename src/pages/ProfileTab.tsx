// src/pages/ProfileTab.tsx
import { useState, useEffect } from "react";
import { api, AppUser } from "../lib/api";
import { ShareButton } from "../components/ShareButton";
import { ReferralPanel } from "../components/ReferralPanel";
import { Achievements } from "../components/Achievements";
import { Toast } from "../components/Toast";
import { useToast } from "../hooks/useToast";

export function ProfileTab({
  user,
  onLogout,
  onRestartTour,
}: {
  user: AppUser;
  onLogout: () => void;
  onRestartTour: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rank, setRank] = useState(0);
  const [points, setPoints] = useState(user.points);
  const { toasts, hideToast } = useToast();

  useEffect(() => {
    api
      .getLeaderboard()
      .then((leaders) => {
        const userRank = leaders.findIndex((l) => l.id === user.id) + 1;
        setRank(userRank);
      })
      .catch(console.error);
  }, [user.id]);

  const handleLogout = async () => {
    setLoading(true);
    await api.logout();
    onLogout();
  };

  const handlePointsUpdate = (newPoints: number) => {
    setPoints(newPoints);
  };

  return (
    <div className="main-content profile-experience">
      <div className="profile-shell">
        {/* HERO DEL PERFIL */}
        <section className="profile-hero">
          <div className="profile-hero-inner">
            <div className="profile-hero-avatar">
              {user.username[0].toUpperCase()}
            </div>
            <div className="profile-hero-info">
              <h1 className="profile-hero-name">{user.username}</h1>
              <span className="profile-hero-email">{user.email}</span>
              <span className="profile-hero-club">🏟️ {user.club}</span>
            </div>
          </div>
          <div className="profile-hero-deco">⚽</div>
        </section>

        {/* STATS RÁPIDAS */}
        <section className="profile-stats-grid">
          <div className="profile-stat-card coins">
            <span className="profile-stat-icon">🪙</span>
            <strong>{(user.coins || 0).toLocaleString("es-AR")}</strong>
            <small>LUPICOINS</small>
          </div>
          <div className="profile-stat-card points">
            <span className="profile-stat-icon">⭐</span>
            <strong>{points.toLocaleString("es-AR")}</strong>
            <small>LUPIPOINTS</small>
          </div>
          <div className="profile-stat-card entries">
            <span className="profile-stat-icon">🎟️</span>
            <strong>{Math.floor(points / 10)}</strong>
            <small>ENTRADAS</small>
          </div>
          <div className="profile-stat-card rank">
            <span className="profile-stat-icon">🏆</span>
            <strong>#{rank || "—"}</strong>
            <small>POSICIÓN</small>
          </div>
        </section>

        {/* COMPARTIR */}
        <section className="profile-section">
          <ShareButton
            userId={user.id}
            user={{
              username: user.username,
              points,
              rank,
              club: user.club,
            }}
            onShareSuccess={handlePointsUpdate}
            variant="full"
          />
        </section>

        {/* REFERIDOS */}
        <section className="profile-section">
          <ReferralPanel userId={user.id} />
        </section>

        {/* LOGROS */}
        <section className="profile-section">
          <Achievements userId={user.id} user={user} rank={rank} />
        </section>

        {/* TUTORIAL */}
        <button
          onClick={onRestartTour}
          className="profile-tutorial-btn"
        >
          <span style={{ fontSize: 18 }}>🎓</span>
          Ver tutorial nuevamente
        </button>

        {/* TOASTS */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => hideToast(toast.id)}
            />
          ))}
        </div>

        {/* LOGOUT */}
        <button
          className="profile-logout-btn"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <>
              <div
                className="spinner"
                style={{
                  borderTopColor: "var(--accent2)",
                  borderColor: "rgba(255,77,109,0.2)",
                }}
              />
              Cerrando sesión...
            </>
          ) : (
            "Cerrar sesión"
          )}
        </button>
      </div>
    </div>
  );
}