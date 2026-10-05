import { useCallback, useEffect, useState } from "react";
import { api, type AppUser } from "./lib/api";
import { ToastProvider } from "./components/ToastProvider";
import { usePendingRewards } from "./hooks/usePendingRewards";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useStreak } from "./hooks/useStreak";
import { useUserCards } from "./hooks/useUserCards";
import { useActiveDeck } from "./hooks/useActiveDeck";
import { useAppNavigation } from "./hooks/useAppNavigation";

import { AuthScreen } from "./pages/AuthScreen";
import { HomeExperience } from "./pages/HomeExperience";
import { BenefitsTab } from "./pages/BenefitsTab";
import { TicketTab } from "./pages/TicketTab";
import { LeaderboardTab } from "./pages/LeaderboardTab";
import { ProfileTab } from "./pages/ProfileTab";
import { GameHub } from "./pages/GameHub";
import { MarketplaceTab } from "./pages/MarketplaceTab";

import { AppHeader } from "./components/home/AppHeader";
import { OnboardingTour } from "./components/OnboardingTour";
import { DevTools } from "./components/DevTools";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNav } from "./components/BottomNav";
import { scrollTop } from "./lib/scroll";
import type { Tab } from "./types/nav";

import "./styles/theme.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/auth.css";
import "./styles/home.css";
import "./styles/benefits.css";
import "./styles/game.css";
import "./styles/animations.css";
import "./styles/shop.css";
import "./styles/profile.css";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [, setTourKey] = useState(0);

  const navigation = useAppNavigation();
  const { appRoute, tab, gameTab, setGameTab, handleTabChange, handleNavigate, enterGame, goHome } = navigation;

  const { notifyStreakAtRisk, notifyNewRecord } = usePushNotifications(user?.id);
  const streak = useStreak(user);
  const { userCards, loadUserCards } = useUserCards(user);
  const { activeDeck, setActiveDeck, loadActiveDeck } = useActiveDeck(user);
  const { count: pendingRewards, refresh: refreshPendingRewards } = usePendingRewards(user?.id);

  // La racha se calcula/actualiza en backend al completar la actividad.
  // Acá solamente observamos el estado persistido y notificamos.
  useEffect(() => {
    if (streak.atRisk) {
      notifyStreakAtRisk(streak.current);
    }
  }, [streak.atRisk, streak.current, notifyStreakAtRisk]);

  useEffect(() => {
    api.getSession().then((sessionUser) => {
      if (sessionUser) setUser(sessionUser);
      setHydrated(true);
    });
  }, []);

  const handleAuth = useCallback((authenticatedUser: AppUser) => {
    setUser(authenticatedUser);
    if (!localStorage.getItem("tour_completed")) {
      setTimeout(() => setShowTour(true), 500);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    goHome();
  }, [goHome]);

  const handlePointsUpdate = useCallback(async (newPoints: number) => {
    // TicketTab ya actualizó backend. Refrescamos TODO el perfil para que
    // points, streak, best_streak y last_ticket_date queden sincronizados.
    const freshUser = await api.getSession();

    setUser((current) => {
      if (!current) return current;
      if (freshUser && freshUser.streak > (current.best_streak ?? 0)) {
        notifyNewRecord(freshUser.streak);
      }
      return freshUser
        ? freshUser
        : { ...current, points: newPoints };
    });
  }, [notifyNewRecord]);

  const handleCoinsUpdate = useCallback((newCoins: number) => {
    setUser((current) => current ? { ...current, coins: newCoins } : current);
  }, []);

  const handleRestartTour = useCallback(() => {
    localStorage.removeItem("tour_completed");
    setTourKey((key) => key + 1);
    setShowTour(true);
  }, []);

  const handleTourComplete = useCallback(() => {
    setShowTour(false);
    localStorage.setItem("tour_completed", "true");
  }, []);

  const handleGameTab = useCallback((nextTab: typeof gameTab) => {
    setGameTab(nextTab);
    scrollTop();
  }, [setGameTab]);

  if (!hydrated) {
    return (
      <ToastProvider>
        <div className="app-wrapper">
          <div className="loading-screen">
            <div className="loading-logo">LUPI<span>APP</span></div>
            <div className="spinner-lg" />
          </div>
        </div>
      </ToastProvider>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <div className="app-wrapper">
          <ErrorBoundary>
            <AuthScreen onAuth={handleAuth} />
          </ErrorBoundary>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-wrapper">
        <ErrorBoundary>
          {showTour && <OnboardingTour onComplete={handleTourComplete} />}

          {appRoute === "home" && ( <header className="app-header"><AppHeader userId={user.id} /></header> )}

          {appRoute === "home" ? (
            <>
              {tab === "home" && (
                <HomeExperience
                  user={user}
                  onEnterGame={() => enterGame("game")}
                  onNavigate={handleNavigate}
                  onRewardClaimed={refreshPendingRewards}
                />
              )}
              {tab === "ticket" && (
                <TicketTab user={user} onPointsUpdate={handlePointsUpdate} />
              )}
              {tab === "ranking" && <LeaderboardTab user={user} />}
              {tab === "profile" && (
                <ProfileTab
                  user={user}
                  onLogout={handleLogout}
                  onRestartTour={handleRestartTour}
                />
              )}
              {tab === "benefits" && (
                <BenefitsTab user={user} onPointsUpdate={handlePointsUpdate} />
              )}
              {tab === "shop" && (
                <MarketplaceTab
                  user={user}
                  onCoinsUpdate={handleCoinsUpdate}
                  onRewardClaimed={refreshPendingRewards}
                />
              )}
            </>
          ) : (
            <GameHub
              user={user}
              gameTab={gameTab}
              setGameTab={handleGameTab}
              userCards={userCards}
              activeDeck={activeDeck}
              loadUserCards={loadUserCards}
              loadActiveDeck={loadActiveDeck}
              setActiveDeck={setActiveDeck}
              loadAlbumProgress={async () => undefined}
              onBackHome={goHome}
              onNavigate={(target) => { goHome(); handleNavigate(target); }}

            />
          )}

          {import.meta.env.DEV && (
            <DevTools
              userId={user.id}
              onCardReceived={() => {
                void loadUserCards();
                void loadActiveDeck();
              }}
            />
          )}

          {appRoute === "home" && (
            <BottomNav
              activeTab={tab}
              onTabChange={handleTabChange}
              onEnterGame={() => enterGame("game")}
              pendingRewards={pendingRewards}
            />
          )}
        </ErrorBoundary>
      </div>
    </ToastProvider>
  );
}
