import { useCallback, useEffect, useState } from "react";
import { scrollTop } from "../lib/scroll";
import type { Tab, GameTab } from "../types/nav";

const tabs: readonly string[] = ["home", "character", "shop", "ticket", "ranking", "profile", "benefits"];
const gameTabs: readonly string[] = ["play", "album", "deck"];
function readRoute() {
 const params = new URLSearchParams(window.location.search);
 const requested = params.get("tab") || "home";
 const game = params.get("view") || "play";
 return { tab: (tabs.includes(requested) ? requested : "home") as Tab,
  gameTab: (gameTabs.includes(game) ? game : "play") as GameTab,
  appRoute: window.location.pathname === "/game" ? "game" as const : "home" as const };
}
function pushRoute(path: string) {
 if (window.location.pathname + window.location.search !== path) window.history.pushState({}, "", path);
}
export function useAppNavigation() {
 const [tab,setTab] = useState<Tab>(()=>readRoute().tab);
 const [gameTab,setGameTabState] = useState<GameTab>(()=>readRoute().gameTab);
 const [appRoute,setAppRoute] = useState<"home"|"game">(()=>readRoute().appRoute);
 const goHome = useCallback(()=>{pushRoute("/");setAppRoute("home");setTab("home");scrollTop();},[]);
 const enterGame = useCallback((target: "game"|"battle"|"deck"|"album" = "game")=>{
  const view = target === "deck" || target === "album" ? target : "play";
  pushRoute(view === "play" ? "/game" : `/game?view=${view}`);
  setGameTabState(view);setAppRoute("game");scrollTop();
 },[]);
 const setGameTab = useCallback((view:GameTab)=>{if(!gameTabs.includes(view))return;pushRoute(view === "play" ? "/game" : `/game?view=${view}`);setGameTabState(view);setAppRoute("game");scrollTop();},[]);
 const handleTabChange = useCallback((next:Tab)=>{
  if(!tabs.includes(next))return;
  pushRoute(next === "home" ? "/" : `/?tab=${next}`);setTab(next);setAppRoute("home");scrollTop();
 },[]);
 const handleNavigate = useCallback((target:string)=>{
  if(target.startsWith("mission-start:")){pushRoute(`/game?start=match&mission=${encodeURIComponent(target.slice(14))}`);setGameTabState("play");setAppRoute("game");scrollTop();return;}
  if(target.startsWith("mission:")){pushRoute(`/game?mission=${encodeURIComponent(target.slice(8))}`);setGameTabState("play");setAppRoute("game");scrollTop();return;}
  if(target === "futsal"){window.location.assign("/futsal");return;}
  if(["game","battle","deck","album"].includes(target)){enterGame(target as "game"|"battle"|"deck"|"album");return;}
  if(tabs.includes(target))handleTabChange(target as Tab);
 },[enterGame,handleTabChange]);
 useEffect(()=>{const sync=()=>{const route=readRoute();setTab(route.tab);setGameTabState(route.gameTab);setAppRoute(route.appRoute);scrollTop();};window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync);},[]);
 return {appRoute,tab,gameTab,setGameTab,handleTabChange,handleNavigate,enterGame,goHome};
}
