// src/hooks/useWorldEvents.ts
import { useEffect, useRef, useState } from "react";

export type WorldEventType =
  | "player_join"
  | "player_leave"
  | "player_count"
  | "self_enter"
  | "level_up"
  | "aura_spotted";

export type WorldEvent = {
  id: string;
  type: WorldEventType;
  createdAt: number;
  username?: string;
  level?: number;
  playerCount?: number;
  auraColor?: string;
  message: string;
};

export type PlayerSnapshot = {
  userId: string;
  username: string;
  level: number;
  hasSkin?: boolean;
  skinName?: string;
  rarity?: string;
  auraColor?: string;
};

type UseWorldEventsParams = {
  meId: string;
  meName: string;
  meLevel: number;
  players: PlayerSnapshot[];
  auraColor?: string;
  /** Pasá true recién cuando presence esté online y vos ya aparezcas en la lista. */
  enabled?: boolean;
};

/** Mismo tipo + mismo jugador dentro de esta ventana = se descarta (anti-flapping). */
const EVENT_COOLDOWN = 3500;

/**
 * Tiempo que esperamos tras activarse para tomar la "foto inicial" de la sala.
 * Evita que los que ya estaban cuenten como "acaban de entrar" si el primer sync llega tarde.
 */
const SETTLE_MS = 1500;

const RARITY_LABEL: Record<string, string> = {
  legendary: "LEGENDARIA",
  epic: "ÉPICA",
  rare: "RARA",
};

export function useWorldEvents({
  meId,
  meName,
  meLevel,
  players,
  auraColor,
  enabled = true,
}: UseWorldEventsParams) {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [ready, setReady] = useState(false);

  const playersRef = useRef(players);
  playersRef.current = players;

  const meRef = useRef({ meName, meLevel, auraColor });
  meRef.current = { meName, meLevel, auraColor };

  const previousPlayersRef = useRef<PlayerSnapshot[]>([]);
  const previousLevelRef = useRef(meLevel);
  const lastEventAtRef = useRef<Record<string, number>>({});

  const emit = (
    type: WorldEventType,
    data: Omit<WorldEvent, "id" | "type" | "createdAt">
  ) => {
    const now = Date.now();
    // Cooldown por tipo + jugador: si entran 3 a la vez, se ven los 3.
    const key = `${type}:${data.username ?? data.playerCount ?? ""}`;
    if (now - (lastEventAtRef.current[key] ?? 0) < EVENT_COOLDOWN) return;
    lastEventAtRef.current[key] = now;

    const event: WorldEvent = {
      id: `${type}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      createdAt: now,
      ...data,
    };
    setEvents((current) => [...current.slice(-19), event]);
  };

  /*
   * Foto inicial: se toma SETTLE_MS después de activarse.
   */
  useEffect(() => {
    if (!enabled || !meId) {
      setReady(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const others = playersRef.current.filter((p) => p.userId !== meId);
      previousPlayersRef.current = others;
      previousLevelRef.current = meRef.current.meLevel;

      emit("self_enter", {
        username: meRef.current.meName,
        level: meRef.current.meLevel,
        auraColor: meRef.current.auraColor,
        message:
          others.length > 0
            ? `${meRef.current.meName} entró al World.`
            : `${meRef.current.meName} entró al World. El estadio está tranquilo...`,
      });
      setReady(true);
    }, SETTLE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, meId]);

  /*
   * Entradas y salidas
   */
  useEffect(() => {
    if (!ready) return;

    const currentPlayers = players.filter((p) => p.userId !== meId);
    const previousPlayers = previousPlayersRef.current;

    const joined = currentPlayers.filter(
      (p) => !previousPlayers.some((prev) => prev.userId === p.userId)
    );
    const left = previousPlayers.filter(
      (prev) => !currentPlayers.some((p) => p.userId === prev.userId)
    );

    joined.forEach((player) => {
      emit("player_join", {
        username: player.username,
        level: player.level,
        message: `${player.username} acaba de entrar al World.`,
      });

      if (player.hasSkin) {
        const label = RARITY_LABEL[player.rarity ?? ""] ?? "ACTIVA";
        emit("aura_spotted", {
          username: player.username,
          level: player.level,
          auraColor: player.auraColor,
          message: `${player.username} apareció con AURA ${label}.`,
        });
      }
    });

    left.forEach((player) => {
      emit("player_leave", {
        username: player.username,
        level: player.level,
        message: `${player.username} salió del World.`,
      });
    });

    previousPlayersRef.current = currentPlayers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, meId, ready]);

  /*
   * Level up propio. Mientras no estemos "ready" solo actualizamos la base,
   * así el nivel que llega con el primer sync no cuenta como subida.
   */
  useEffect(() => {
    if (!ready) {
      previousLevelRef.current = meLevel;
      return;
    }

    if (meLevel > previousLevelRef.current) {
      emit("level_up", {
        username: meName,
        level: meLevel,
        message: `${meName} subió al nivel ${meLevel}.`,
      });
    }
    previousLevelRef.current = meLevel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLevel, meName, ready]);

  /*
   * Evento de cantidad (ocasional)
   */
  useEffect(() => {
    if (!ready) return;
    const count = players.length;
    if (count >= 2 && count % 3 === 0) {
      emit("player_count", {
        playerCount: count,
        message: `El World tiene ${count} jugadores conectados.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length, ready]);

  return {
    events,
    latestEvent: events.length > 0 ? events[events.length - 1] : null,
    clearEvents: () => setEvents([]),
  };
}