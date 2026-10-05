// src/hooks/useLobbyPresence.ts
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { ItemSlot } from "./useAuraInventory";

/** slot -> id del item que tiene puesto. Solo ids: la imagen la resuelve cada cliente con su catálogo. */
export type LobbyLook = Partial<Record<ItemSlot, string>>;

/** lobby = disponible · in-match = jugando · idle = ausente (sin input o pestaña oculta) */
export type LobbyActivity = "lobby" | "in-match" | "idle";

export type LobbyPlayer = {
  userId: string;
  username: string;
  club: string | null;
  level: number;
  look: LobbyLook;
  activity: LobbyActivity;
  joinedAt: number;
};

export type LobbyStatus = "connecting" | "online" | "offline";

type Options = {
  /** "global" por ahora; más adelante `club:${clubId}` para la sala de cada club */
  room: string;
  me: Omit<LobbyPlayer, "joinedAt" | "activity">;
  /** Lo que sabe el juego: pasá "in-match" mientras la persona juega. "idle" se detecta solo. */
  activity?: "lobby" | "in-match";
  enabled?: boolean;
};

const SLOTS: ItemSlot[] = ["top", "bottom", "boots", "accessory"];
const ACTIVITIES: LobbyActivity[] = ["lobby", "in-match", "idle"];
const IDLE_MS = 2 * 60_000;

/**
 * Todo lo que llega por presence lo manda otro cliente, o sea que NO es de fiar.
 * Se normaliza acá: tipos, largos y rangos. Los ids de items se validan después
 * contra el catálogo (si no existen, simplemente no se dibujan).
 */
function sanitize(raw: any): LobbyPlayer | null {
  if (!raw || typeof raw.userId !== "string" || typeof raw.username !== "string") return null;

  const look: LobbyLook = {};
  for (const slot of SLOTS) {
    const id = raw.look?.[slot];
    if (typeof id === "string" && id.length <= 64) look[slot] = id;
  }

  const level = Number(raw.level);

  return {
    userId: raw.userId,
    username: raw.username.slice(0, 24),
    club: typeof raw.club === "string" ? raw.club.slice(0, 40) : null,
    level: Number.isFinite(level) ? Math.min(Math.max(Math.trunc(level), 1), 999) : 1,
    look,
    activity: ACTIVITIES.includes(raw.activity) ? raw.activity : "lobby",
    joinedAt: Number(raw.joinedAt) || 0,
  };
}

/** true cuando no hubo input durante IDLE_MS o la pestaña está oculta. */
function useIdle(enabled: boolean) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIdle(false);
      return;
    }

    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    const wake = () => {
      setIdle(false);
      arm();
    };
    const onVisibility = () => (document.hidden ? setIdle(true) : wake());

    const events = ["pointerdown", "keydown", "touchstart", "wheel"];
    events.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    arm();

    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, wake));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return idle;
}

export function useLobbyPresence({ room, me, activity = "lobby", enabled = true }: Options) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [status, setStatus] = useState<LobbyStatus>("connecting");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinedAt = useRef(Date.now());

  const idle = useIdle(enabled);
  const effectiveActivity: LobbyActivity =
    activity === "in-match" ? "in-match" : idle ? "idle" : "lobby";

  // Siempre el último "me", sin tener que reconectar el canal cuando cambia.
  const meRef = useRef({ ...me, activity: effectiveActivity });
  meRef.current = { ...me, activity: effectiveActivity };

  // Cambia solo si cambia el contenido (no la referencia del objeto).
  const payloadKey = JSON.stringify([
    me.userId,
    me.username,
    me.club,
    me.level,
    me.look,
    effectiveActivity,
  ]);

  useEffect(() => {
    if (!enabled || !me.userId) return;

    setStatus("connecting");

    const channel = supabase.channel(`lobby:${room}`, {
      config: { presence: { key: me.userId } },
    });
    channelRef.current = channel;

    const sync = () => {
      const state = channel.presenceState();
      const list: LobbyPlayer[] = [];

      for (const key of Object.keys(state)) {
        // Un usuario con varias pestañas tiene varias entradas bajo la misma key: usamos la primera.
        const player = sanitize(state[key]?.[0]);
        if (player) list.push(player);
      }

      list.sort((a, b) => a.joinedAt - b.joinedAt);
      setPlayers(list);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          setStatus("online");
          await channel.track({ ...meRef.current, joinedAt: joinedAt.current });
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("offline");
        }
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel); // también hace untrack: el resto te ve salir
    };
  }, [room, me.userId, enabled]);

  // Si te cambiás de skin, subís de nivel o cambia tu actividad, se actualiza para todos sin reconectar.
  useEffect(() => {
    const channel = channelRef.current;
    if (channel && status === "online") {
      channel.track({ ...meRef.current, joinedAt: joinedAt.current });
    }
  }, [payloadKey, status]);

  return { players, status, count: players.length };
}