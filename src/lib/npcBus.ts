// src/lib/npcBus.ts
// Canal por el que el juego le cuenta a los NPC lo que hace la persona.
// Cualquier pantalla puede llamar a emitNpcEvent(); el vestuario escucha cuando está en pantalla.

export type NpcEvent =
  | { type: "pack-opened"; card?: string }
  | { type: "battle-finished"; won?: boolean; draw?: boolean; xp?: number }
  | { type: "level-up"; level: number }
  | { type: "deck-complete" }
  | { type: "skin-changed"; item: string }
  | { type: "chat"; text: string; author: string; mine: boolean }
  | { type: "player-joined"; name: string };

type Listener = (event: NpcEvent) => void;



const listeners = new Set<Listener>();

// Si el vestuario no está en pantalla (por ejemplo, estás en un partido), lo que hacés se guarda
// un rato y te lo comentan al volver al lobby.
const PENDING_TTL_MS = 5 * 60_000;
const PENDING_MAX = 4;
let pending: { event: NpcEvent; at: number }[] = [];

export function emitNpcEvent(event: NpcEvent) {
  if (listeners.size === 0) {
    if (event.type !== "chat" && event.type !== "player-joined") {
      pending = [...pending, { event, at: Date.now() }].slice(-PENDING_MAX);
    }
    return;
  }
  listeners.forEach((listener) => listener(event));
}

export function subscribeNpcEvents(listener: Listener): () => void {
  listeners.add(listener);

  const now = Date.now();
  const due = pending.filter((p) => now - p.at < PENDING_TTL_MS);
  pending = [];
  due.forEach((p) => listener(p.event));

  return () => {
    listeners.delete(listener);
  };
}

export function resetNpcBus() {
  listeners.clear();
  pending = [];
}