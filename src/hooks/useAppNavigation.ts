import { useCallback, useEffect, useState } from "react";
import { scrollTop } from "../lib/scroll";
import type { Tab } from "../types/nav";

type AppRoute = "home" | "game";
type GameTab = "play" | "album" | "deck";

export function useAppNavigation() {
  const [tab, setTab] = useState<Tab>("home");
  const [gameTab, setGameTab] = useState<GameTab>("play");
  const [appRoute, setAppRoute] = useState<AppRoute>(() =>
    window.location.pathname === "/game" ? "game" : "home",
  );

  const goHome = useCallback(() => {
    window.history.pushState({}, "", "/");
    setAppRoute("home");
    setTab("home");
    scrollTop();
  }, []);

  const enterGame = useCallback((target: "game" | "battle" | "deck" | "album" = "game") => {
    if (target === "deck") setGameTab("deck");
    else if (target === "album") setGameTab("album");
    else setGameTab("play");

    window.history.pushState({}, "", "/game");
    setAppRoute("game");
    scrollTop();
  }, []);

  const handleTabChange = useCallback((nextTab: Tab) => {
    setTab(nextTab);
    scrollTop();
  }, []);

  const handleNavigate = useCallback((target: string) => {
    if (["game", "battle", "deck", "album"].includes(target)) {
      enterGame(target as "game" | "battle" | "deck" | "album");
      return;
    }
    handleTabChange(target as Tab);
  }, [enterGame, handleTabChange]);

  useEffect(() => {
    const onPopState = () => {
      setAppRoute(window.location.pathname === "/game" ? "game" : "home");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return {
    appRoute,
    tab,
    gameTab,
    setGameTab,
    handleTabChange,
    handleNavigate,
    enterGame,
    goHome,
  };
}
