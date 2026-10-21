import { useCallback, useEffect, useState } from "react";
import {
  api,
  needsPlayerOnboarding,
  type AppUser,
} from "./lib/api";
import { ToastProvider } from "./components/ToastProvider";
import { usePendingRewards } from "./hooks/usePendingRewards";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useStreak } from "./hooks/useStreak";
import { useUserCards } from "./hooks/useUserCards";
import { useActiveDeck } from "./hooks/useActiveDeck";
import { useAppNavigation } from "./hooks/useAppNavigation";
import { PlayerOnboarding } from "./pages/PlayerOnboarding";
import { SigningWelcome } from "./components/SigningWelcome";
import { supabase } from "./lib/supabaseClient";
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
  const [hasPlayedMatch, setHasPlayedMatch] = useState<boolean | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showSigningWelcome, setShowSigningWelcome] = useState(false);
  const [, setTourKey] = useState(0);

  useEffect(() => {
    if (!user?.id) { setHasPlayedMatch(null); return; }
    let active = true;
    setHasPlayedMatch(null);
    void supabase.from("matches").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).then(({ count, error }) => {
        if (!active) return;
        if (error) { console.error("No se pudo consultar el debut:", error); setHasPlayedMatch(true); }
        else setHasPlayedMatch((count ?? 0) > 0);
      });
    return () => { active = false; };
  }, [user?.id]);

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
  let mounted = true;

  const refreshSession = async () => {
    try {
      const sessionUser = await api.getSession();

      if (mounted) {
        setUser(sessionUser);
      }
    } catch (error) {
      console.error("Error recuperando sesión:", error);
    } finally {
      if (mounted) {
        setHydrated(true);
      }
    }
  };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (
      event === "SIGNED_IN" ||
      event === "SIGNED_OUT" ||
      event === "INITIAL_SESSION"
    ) {
      // Evitamos consultar Supabase de forma síncrona
      // dentro del callback de autenticación.
      setTimeout(() => {
        if (mounted) {
          void refreshSession();
        }
      }, 0);
    }
  });

  void refreshSession();

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  const handleAuth = useCallback((authenticatedUser: AppUser) => {
    setUser(authenticatedUser);
    // El tutorial se presenta luego del fichaje, cuando corresponda.
    if (!localStorage.getItem("tour_completed")) {
      setShowTour(true);
    }
  }, []);

  const handleOnboardingComplete = useCallback((completedUser: AppUser) => {
    setUser(completedUser);
    setShowTour(false);
    setShowSigningWelcome(true);
  }, []);

  const handleSigningWelcomeContinue = useCallback(() => {
    setShowSigningWelcome(false);
    enterGame("game");
  }, [enterGame]);

  const handleLogout = useCallback(() => {
    setShowSigningWelcome(false);
    setShowTour(false);
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

  // Unificar actualización de XP, puntos y monedas después de cualquier recompensa.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const refresh = async () => {
      try {
        const fresh = await api.getSession();
        if (active && fresh?.id === user.id) setUser(fresh);
      } catch (error) { console.warn("No se pudo refrescar la progresión", error); }
    };
    window.addEventListener("lupi:progression-updated", refresh);
    return () => { active = false; window.removeEventListener("lupi:progression-updated", refresh); };
  }, [user?.id]);

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
          <div className="loading-screen lupi-cinematic-loading" role="status" aria-live="polite" aria-label="Cargando Lupi World">
            <div className="lupi-cinematic-content">
              <svg className="lupi-loading-crown" viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M12 26 23 46 31 20 40 43 49 20 57 46 68 26 61 58H19L12 26Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/><path d="M20 63H60M22 69H58" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/><circle cx="12" cy="22" r="3" fill="currentColor"/><circle cx="31" cy="16" r="3" fill="currentColor"/><circle cx="49" cy="16" r="3" fill="currentColor"/><circle cx="68" cy="22" r="3" fill="currentColor"/></svg>
              <div className="lupi-cinematic-wordmark">LUPI <span>WORLD</span></div>
              <div className="lupi-cinematic-tagline">LA CANCHA TE ESPERA</div>
              <div className="lupi-cinematic-lightline" aria-hidden="true" />
              <span className="lupi-loading-sr-only">Cargando aplicación…</span>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }
if (user && needsPlayerOnboarding(user)) {
  return (
    <ToastProvider>
      <div className="app-wrapper">
        <ErrorBoundary>
          <PlayerOnboarding onComplete={handleOnboardingComplete} />
        </ErrorBoundary>
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

  if (showSigningWelcome) {
    return (
      <ToastProvider>
        <div className="app-wrapper signing-welcome-screen">
          <ErrorBoundary>
            <SigningWelcome user={user} onContinue={handleSigningWelcomeContinue} />
          </ErrorBoundary>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-wrapper">
        <ErrorBoundary>
          {showTour && (
            <OnboardingTour onComplete={handleTourComplete} />
          )}

          {appRoute === "home" && ( <header className="app-header"><AppHeader userId={user.id} /></header> )}

          {appRoute === "home" ? (
            <>
              {tab === "home" && (
                <HomeExperience
                  user={user}
                  onEnterGame={() => enterGame("game")}
                  hasPlayedMatch={hasPlayedMatch}
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
               debutRequested={false}
               onMatchRecorded={() => setHasPlayedMatch(true)}
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
