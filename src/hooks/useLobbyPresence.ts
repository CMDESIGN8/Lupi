// src/hooks/useLobbyPresence.ts
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { ItemSlot } from "./useAuraInventory";
import { sanitizeAppearance, type AvatarAppearance } from "../lib/avatarAppearance";

/** slot -> id del item que tiene puesto. Solo ids: la imagen la resuelve cada cliente con su catálogo. */
export type LobbyLook = Partial<Record<ItemSlot, string>>;

/** lobby = conectado en lobby · in-match = jugando · idle = compatibilidad con clientes antiguos */
export type LobbyActivity = "lobby" | "in-match" | "idle";

export type LobbyPlayer = {
  userId: string;
  username: string;
  club: string | null;
  level: number;
  look: LobbyLook;
  appearance?: AvatarAppearance;
  activity: LobbyActivity;
  joinedAt: number;
};

export type LobbyStatus = "connecting" | "online" | "offline";

type Options = {
  /** "global" por ahora; más adelante `club:${clubId}` para la sala de cada club */
  room: string;
  me: Omit<LobbyPlayer, "joinedAt" | "activity">;
  /** Estado explícito: en lobby o jugando. No se infiere ausencia por inactividad. */
  activity?: "lobby" | "in-match";
  enabled?: boolean;
};

const SLOTS: ItemSlot[] = ["top", "bottom", "boots", "accessory"];
const ACTIVITIES: LobbyActivity[] = ["lobby", "in-match", "idle"];

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
    appearance: raw.appearance ? sanitizeAppearance(raw.appearance) : undefined,
    activity: raw.activity === "in-match" ? "in-match" : "lobby",
    joinedAt: Number(raw.joinedAt) || 0,
  };
}

// La presencia indica conexión real al canal. No inferimos "ausente" por inactividad
// o pestaña oculta: el usuario no dispone de un modo ausente manual.

export function useLobbyPresence({ room, me, activity = "lobby", enabled = true }: Options) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [status, setStatus] = useState<LobbyStatus>("connecting");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinedAt = useRef(Date.now());

  const effectiveActivity: LobbyActivity = activity === "in-match" ? "in-match" : "lobby";

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
    me.appearance,
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
        const entries = state[key] ?? [];
        const player = entries.map(sanitize).filter((p): p is LobbyPlayer => p !== null).at(-1) ?? null;
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