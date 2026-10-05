// src/pages/HomeExperience.tsx
import { useState } from "react";
import { AppUser } from "../lib/api";
import { useHeroDataCached } from "../hooks/useHeroData";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { usePacksCount } from "../hooks/usePacksCount";
import { PackModal } from "../components/PackModal";
import { QuickActions } from "../components/home/Dashboardcomponents ";
import { processUserAction } from "../services/progressionService";
import { UserCardProfile } from "../components/UserCardProfile";

type Props = {
  user: AppUser;
  onEnterGame: () => void;
  onNavigate: (t: string) => void;
  onRewardClaimed?: () => void;
  onCardReceived?: () => void;
};

export function HomeExperience({
  user,
  onEnterGame,
  onNavigate,
  onRewardClaimed,
  onCardReceived,
}: Props) {
  const { data: heroData, loading, refetch } = useHeroDataCached(user.id);
  const { count: packCount } = usePacksCount(user.id);
  const [showPackModal, setShowPackModal] = useState(false);

  const level = heroData?.level || 1;
  const exp = heroData?.exp || 0;
  const expNeeded = heroData?.expNeeded || 100;
  const progress = Math.min(100, Math.round((exp / Math.max(expNeeded, 1)) * 100));
  const streak = heroData?.streak ?? user.streak ?? 0;
  const coins = heroData?.coins ?? user.coins ?? 0;
const points = heroData?.points ?? user.points ?? 0;
  const [challengeDone, setChallengeDone] = useState(false);

  const { pullDistance, isRefreshing } = usePullToRefresh(async () => {
    refetch();
    await new Promise((r) => setTimeout(r, 600));
  });

  const [missionLoading, setMissionLoading] = useState(false);

const handleMissionDone = async () => {
  if (challengeDone || missionLoading) return;

  try {
    setMissionLoading(true);

    const today = new Date().toISOString().slice(0, 10);

    const result = await processUserAction({
      userId: user.id,
      actionType: "challenge",
      actionValue: 10,
      referenceId: `daily-challenge-${today}`,
      metadata: {
        source: "home",
        mission_type: "daily_challenge",
      },
    });

    console.log("🎯 Resultado misión diaria:", result);

    setChallengeDone(true);
    await refetch();
    onRewardClaimed?.();
  } catch (error) {
    console.error("❌ Error completando misión diaria:", error);
  } finally {
    setMissionLoading(false);
  }
};

  const handlePackCardReceived = () => {
    onCardReceived?.();
    onRewardClaimed?.();
  };

  return (
    <main className="main-content home-experience">
      <div className="home-shell-v2">
        {/* Indicador de pull-to-refresh */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="ptr-indicator visible"
            style={{
              transform: `translateX(-50%) translateY(${isRefreshing ? 12 : pullDistance}px)`,
              opacity: isRefreshing ? 1 : Math.min(pullDistance / 60, 1),
            }}
          >
            <span
              style={{
                display: "inline-block",
                transition: "transform 0.2s",
                transform: isRefreshing ? "rotate(360deg)" : `rotate(${pullDistance * 3}deg)`,
              }}
            >
              {isRefreshing ? "🔄" : "⬇️"}
            </span>
            <span>
              {isRefreshing
                ? "Actualizando..."
                : pullDistance > 60
                ? "Soltá para actualizar"
                : "Deslizá hacia abajo"}
            </span>
          </div>
        )}

        {/* Modal del sobre diario */}
        <PackModal
          isOpen={showPackModal}
          onClose={() => setShowPackModal(false)}
          userId={user.id}
          onCardReceived={handlePackCardReceived}
        />

        <section className="journey-hero">
          <div className="journey-hero-copy">
            <span className="journey-kicker">LUPIAPP · TU JORNADA</span>
            <h1>Hoy también podés<br /><em>subir de nivel.</em></h1>
            <p>No necesitás cambiar todo. Solo hacer una cosa mejor que ayer.</p>
          </div>
          <div className="journey-level-orb">
            <span>NIVEL</span>
            <strong>{level}</strong>
            <small>{progress}%</small>
          </div>
        </section>

        {/* PLAYER RENDER */}

        <UserCardProfile
  userId={user.id}
  onLevelUp={(newLevel, newRarity) => {
    console.log(
      "🎉 Player Card Level Up:",
      newLevel,
      newRarity
    );
  }}
/>

        <section className="today-header">
          <div>
            <span className="journey-kicker">TU DÍA</span>
            <h2>Una misión. Un paso.</h2>
          </div>
          <span className="today-status">{challengeDone ? "COMPLETADO" : "PENDIENTE"}</span>
        </section>

        <section className={`daily-mission-v2 ${challengeDone ? "completed" : ""}`}>
          <div className="mission-number">01</div>
          <div className="mission-main">
            <span className="mission-label">DESAFÍO DIARIO</span>
            <h3>
              {challengeDone
                ? "Hoy elegiste avanzar."
                : "Hacé una cosa que te haga avanzar."}
            </h3>
            <p>
              {challengeDone
                ? "Marcaste tu desafío como realizado. El próximo paso será sumar esta acción al sistema de progreso."
                : "Puede ser entrenar, estudiar, ordenar, ayudar, crear o simplemente cumplir una promesa que te hiciste."}
            </p>
          </div>
          <button
  className="mission-action"
  onClick={handleMissionDone}
  disabled={challengeDone || missionLoading}
>
  {missionLoading
    ? "..."
    : challengeDone
    ? "✓"
    : "HECHO"}
</button>
        </section>

      <section className="journey-progress-card">
          <div className="journey-progress-head">
            <div>
              <span>PROGRESO DE NIVEL</span>
              <strong>{exp} <small>/ {expNeeded} XP</small></strong>
            </div>
            <div className="journey-xp-badge">⚡ XP</div>
          </div>
          <div className="journey-progress-track">
            <div className="journey-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="journey-progress-foot">
            <span>{Math.max(expNeeded - exp, 0)} XP para el próximo nivel</span>
            <span>🔥 {streak} días</span>
          </div>
          {/* =====================================================
          QUICK PROGRESSION
      ====================================================== */}

      <div className="aura-meta">

        <div className="aura-meta-item">

          <span>🔥</span>

          <strong>
            {streak}
          </strong>

          <small>
            STREAK
          </small>

        </div>

        <div className="aura-meta-item">

          <span>💰</span>

          <strong>
            {coins}
          </strong>

          <small>
            COINS
          </small>

        </div>

        <div className="aura-meta-item">

          <span>⭐</span>

          <strong>
            {points}
          </strong>

          <small>
            POINTS
          </small>

        </div>

      </div>
        </section>
        

        <section
          className="game-launch-v2"
          onClick={onEnterGame}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") onEnterGame(); }}
        >
          <div className="game-launch-bg" />
          <div className="game-launch-copy">
            <span className="journey-kicker">🎮 LUPI GAME</span>
            <h2>Tu progreso<br />también se juega.</h2>
            <p>Cartas · Equipo · Partidos · Campaña</p>
            <button
              className="game-launch-button"
              onClick={(e) => { e.stopPropagation(); onEnterGame(); }}
            >
              ENTRAR AL JUEGO <span>→</span>
            </button>
          </div>
          <div className="game-launch-ball">⚽</div>
        </section>
        <QuickActions
          onNavigate={onNavigate}
          onOpenPack={() => setShowPackModal(true)}
          packCount={packCount}
          eventCount={0}
        />

        {!loading && heroData?.nextRewardDescription && (
          <section className="next-reward-v2">
            <span>🎁</span>
            <div>
              <small>PRÓXIMA RECOMPENSA</small>
              <strong>{heroData.nextRewardDescription}</strong>
            </div>
            <b>→</b>
          </section>
        )}

        <section className="journey-shortcuts">
          <button onClick={() => onNavigate("shop")}>
            <span>🛒</span><strong>Tienda</strong><small>Gastá tus coins</small>
          </button>
          <button onClick={() => onNavigate("ranking")}>
            <span>🏆</span><strong>Ranking</strong><small>Competí con otros</small>
          </button>
          <button onClick={() => onNavigate("profile")}>
            <span>👤</span><strong>Perfil</strong><small>Tu identidad</small>
          </button>
        </section>

        <p className="journey-footer-line">MEJOR QUE AYER · UN DÍA A LA VEZ</p>
      </div>
    </main>
  );
}