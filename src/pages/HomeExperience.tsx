// src/pages/HomeExperience.tsx
import { useState } from "react";
import "./HomeExperienceOnboarding.css";
import { AppUser } from "../lib/api";
import { useHeroDataCached } from "../hooks/useHeroData";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { usePacksCount } from "../hooks/usePacksCount";
import { PackModal } from "../components/PackModal";
import { HomeMission } from "../components/home/HomeMission";
import { HomeFutsal } from "../components/home/HomeFutsal";
import "./HomeDashboard.css";



type Props = {
  user: AppUser;
  onEnterGame: () => void;
  onNavigate: (t: string) => void;
  onRewardClaimed?: () => void;
  onCardReceived?: () => void;
  hasPlayedMatch?: boolean | null;
};

export function HomeExperience({
  user,
  onEnterGame,
  onNavigate,
  onRewardClaimed,
  onCardReceived,
  hasPlayedMatch = null,
}: Props) {
  const { data: heroData, refetch } = useHeroDataCached(user.id);
  const { count: packCount } = usePacksCount(user.id);
  const [showPackModal, setShowPackModal] = useState(false);
  // Solo se muestra una vez por usuario y dispositivo. No bloquea la navegación.
  const welcomeKey = `lupi-first-home-${user.id}`;
  const [showFirstHint, setShowFirstHint] = useState(() => {
    try { return window.localStorage.getItem(welcomeKey) !== "seen"; }
    catch { return false; }
  });
  const dismissFirstHint = () => {
    setShowFirstHint(false);
    try { window.localStorage.setItem(welcomeKey, "seen"); } catch { /* storage unavailable */ }
  };
  const enterGame = () => { dismissFirstHint(); onEnterGame(); };

  const level = heroData?.level ?? user.level ?? 1;
  const exp = heroData?.exp ?? user.exp ?? 0;
  const expNeeded = heroData?.expNeeded || 100;
  const progress = Math.max(0, Math.min(100, Math.round(exp / expNeeded * 100)));

  const { pullDistance, isRefreshing } = usePullToRefresh(async () => {
    refetch();
    await new Promise((r) => setTimeout(r, 600));
  });

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



        {showFirstHint && hasPlayedMatch === false && <section className="home-welcome"><span className="home-kicker">BIENVENIDO A LUPI</span><h2>Tu mundo empieza con vos.</h2><p>Jugá, conectá con tu club y construí tu personaje a tu ritmo.</p><button type="button" onClick={dismissFirstHint}>Entendido, vamos →</button></section>}
        <HomeFutsal userId={user.id}/>
        <div className="home-side-stack">
          <HomeMission userId={user.id} level={level} progress={progress} onNavigate={onNavigate} onClaimed={()=>{void refetch();onRewardClaimed?.();}}/>
          <section className="home-world"><div className="home-section-heading"></div><div className="home-destinations"><button type="button" onClick={enterGame}><span aria-hidden="true">🎮</span><strong>Entrar a Lupi World</strong><small>Jugá y encontrate con tu comunidad</small><b aria-hidden="true">↗</b></button><button type="button" onClick={()=>onNavigate("character")}><span aria-hidden="true">👕</span><strong>Mi personaje</strong><small>Avatar, equipo e inventario</small><b aria-hidden="true">↗</b></button></div></section>
          <nav className="home-action-tiles" aria-label="Accesos rápidos"><button type="button" className="hat-pack" onClick={()=>setShowPackModal(true)}><span className="hat-icon" aria-hidden="true">📦{packCount>0&&<b>{packCount}</b>}</span><strong>Abrir pack</strong><small>{packCount>0?`${packCount} ${packCount===1?'disponible':'disponibles'}`:'Ver mis packs'}</small></button><button type="button" className="hat-ranking" onClick={()=>onNavigate("ranking")}><span className="hat-icon" aria-hidden="true">🏆</span><strong>Ranking</strong><small>Tu posición</small></button><button type="button" className="hat-ticket" onClick={()=>onNavigate("ticket")}><span className="hat-icon" aria-hidden="true">🎟️</span><strong>Mis entradas</strong><small>Cargá y ganá</small></button><button type="button" className="hat-benefits" onClick={()=>onNavigate("benefits")}><span className="hat-icon" aria-hidden="true">🎁</span><strong>Mis beneficios</strong><small>Tus recompensas</small></button></nav>
        </div>




      </div>
    </main>
  );
}
