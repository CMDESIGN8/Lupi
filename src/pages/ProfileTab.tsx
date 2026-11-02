// src/pages/ProfileTab.tsx
import { useState, useEffect } from "react";
import { api, AppUser } from "../lib/api";
import { ShareButton } from "../components/ShareButton";
import { ReferralPanel } from "../components/ReferralPanel";
import { Achievements } from "../components/Achievements";
import { Toast } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import "./ProfileTab.css"; 

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
    <div className="game-screen profile-screen">
      {/* Fondo decorativo animado Cyberpunk */}
      <div className="game-bg-grid"></div>
      <div className="game-bg-glow"></div>

      <div className="game-container">
        
        {/* HERO DEL PERFIL - Tarjeta de Jugador */}
        <section className="game-card profile-header-card animate-pop-in" style={{ animationDelay: '0.1s' }}>
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-game">
              {user.username[0].toUpperCase()}
            </div>
            <div className="level-badge">Lvl {Math.floor(points / 100) + 1}</div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name-game">{user.username}</h1>
            <span className="profile-email-game">{user.email}</span>
            <div className="profile-club-tag">
              <span className="badge-icon animate-wiggle">🏟️</span> {user.club}
            </div>
          </div>
        </section>

        {/* STATS - Estilo Medallas Neón */}
        <section className="stats-grid-game">
          <div className="stat-card-game coins animate-pop-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon-game animate-float">💰</div>
            <div className="stat-data-game">
              <strong>{(user.coins || 0).toLocaleString("es-AR")}</strong>
              <small>LUPICOINS</small>
            </div>
          </div>
          <div className="stat-card-game points animate-pop-in" style={{ animationDelay: '0.25s' }}>
            <div className="stat-icon-game animate-float-delayed">⭐</div>
            <div className="stat-data-game">
              <strong>{points.toLocaleString("es-AR")}</strong>
              <small>LUPIPOINTS</small>
            </div>
          </div>
          <div className="stat-card-game entries animate-pop-in" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon-game animate-float">🎟️</div>
            <div className="stat-data-game">
              <strong>{Math.floor(points / 10)}</strong>
              <small>ENTRADAS</small>
            </div>
          </div>
          <div className="stat-card-game rank animate-pop-in" style={{ animationDelay: '0.35s' }}>
            <div className="stat-icon-game animate-float-delayed">🏆</div>
            <div className="stat-data-game">
              <strong>#{rank || "—"}</strong>
              <small>POSICIÓN</small>
            </div>
          </div>
        </section>

        {/* COMPARTIR - Botón 3D */}
        <section className="game-card action-section animate-pop-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="section-title-game">¡COMPARTÍ Y GANÁ!</h3>
          <p className="section-subtitle-game">+50 PUNTOS por compartir</p>
          <div className="game-btn-wrapper">
            <ShareButton
              userId={user.id}
              user={{ username: user.username, points, rank, club: user.club }}
              onShareSuccess={handlePointsUpdate}
              variant="full"
            />
          </div>
        </section>

        {/* REFERIDOS */}
        <section className="game-card action-section animate-pop-in" style={{ animationDelay: '0.45s' }}>
          <h3 className="section-title-game">INVITÁ A TUS AMIGOS</h3>
          <p className="section-subtitle-game">Ganá 50 puntos por cada amigo</p>
          <ReferralPanel userId={user.id} />
        </section>

        {/* LOGROS */}
        <section className="game-card action-section animate-pop-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="section-title-game">TUS LOGROS</h3>
          <div className="achievements-wrapper-game">
             <Achievements userId={user.id} user={user} rank={rank} />
          </div>
        </section>

        {/* TUTORIAL */}
        <button onClick={onRestartTour} className="game-btn-secondary animate-pop-in" style={{ animationDelay: '0.55s' }}>
          <span className="btn-icon animate-spin-slow">🎓</span>
          VER TUTORIAL
        </button>

        {/* TOASTS */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => hideToast(toast.id)} />
          ))}
        </div>

        {/* LOGOUT */}
        <button
          className="game-btn-logout animate-pop-in"
          onClick={handleLogout}
          disabled={loading}
          style={{ animationDelay: '0.6s' }}
        >
          {loading ? (
            <>
              <div className="spinner-game" />
              CERRANDO...
            </>
          ) : (
            "SALIR DEL JUEGO"
          )}
        </button>
      </div>
    </div>
  );
}