// src/components/BottomNav.tsx
import { NavBadge } from "./NavBadge";
import type { Tab, GameTab } from "../types/nav";

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onEnterGame: () => void;
  pendingRewards?: number;
};

export function BottomNav({
  activeTab,
  onTabChange,
  onEnterGame,
  pendingRewards = 0,
}: Props) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
      <button
        className={`nav-item${activeTab === "home" ? " active" : ""}`}
        onClick={() => onTabChange("home")}
        aria-current={activeTab === "home" ? "page" : undefined}
        aria-label="Inicio"
      >
        <span className="nav-icon">🏠</span>
        Inicio
      </button>

      <button
        className={`nav-item${activeTab === "shop" ? " active" : ""}`}
        onClick={() => onTabChange("shop")}
        aria-current={activeTab === "shop" ? "page" : undefined}
        aria-label="Tienda"
      >
        <span className="nav-icon">🛒</span>
        Tienda
      </button>

      <button
        className="nav-item game-nav-main"
        onClick={onEnterGame}
        aria-label="Jugar"
      >
        <span className="nav-icon">🎮</span>
        Jugar
      </button>

      <button
        className={`nav-item${activeTab === "benefits" ? " active" : ""}`}
        onClick={() => onTabChange("benefits")}
        aria-current={activeTab === "benefits" ? "page" : undefined}
        aria-label="Beneficios"
      >
        <span className="nav-icon nav-icon-rel">
          🎁
          <NavBadge count={pendingRewards} />
        </span>
        Beneficios
      </button>

      <button
        className={`nav-item${activeTab === "profile" ? " active" : ""}`}
        onClick={() => onTabChange("profile")}
        aria-current={activeTab === "profile" ? "page" : undefined}
        aria-label="Perfil"
      >
        <span className="nav-icon">👤</span>
        Perfil
      </button>
    </nav>
  );
}

export function GameBottomNav({
  activeTab,
  onTabChange,
  onBackHome,
}: {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  onBackHome: () => void;
}) {
  // ... queda igual que antes
  return (
    <nav className="bottom-nav game-bottom-nav" aria-label="Navegación del juego">
      <button className="nav-item" onClick={onBackHome} aria-label="Volver a Jornada">
        <span className="nav-icon">←</span>
        Jornada
      </button>
      <button
        className={`nav-item${activeTab === "play" ? " active" : ""}`}
        onClick={() => onTabChange("play")}
      >
        <span className="nav-icon">⚔️</span>
        Jugar
      </button>
      <button
        className={`nav-item${activeTab === "deck" ? " active" : ""}`}
        onClick={() => onTabChange("deck")}
      >
        <span className="nav-icon">👕</span>
        Equipo
      </button>
      <button
        className={`nav-item${activeTab === "album" ? " active" : ""}`}
        onClick={() => onTabChange("album")}
      >
        <span className="nav-icon">📖</span>
        Álbum
      </button>
    </nav>
  );
}