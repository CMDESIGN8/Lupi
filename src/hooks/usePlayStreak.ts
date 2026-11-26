import { useSyncExternalStore } from "react";
import { getPlayStreakSnapshot, subscribePlayStreak, type PlayStreakView } from "../lib/playStreak";

export function usePlayStreak(): PlayStreakView {
  return useSyncExternalStore(subscribePlayStreak, getPlayStreakSnapshot, getPlayStreakSnapshot);
}
