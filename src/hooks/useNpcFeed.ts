// src/hooks/useNpcFeed.ts
import { useEffect, useRef, useState } from "react";
import {
  NPCS,
  fillName,
  pickScene,
  reactionFor,
  type Line,
  type NpcContext,
  type NpcId,
  type SeenMap,
} from "../lib/npcScenes";
import { subscribeNpcEvents } from "../lib/npcBus";

export type NpcMessage = {
  key: number;
  who: NpcId;
  text: string;
  /** Momento real en que el NPC dijo la línea (no el del render). */
  at: number;
};

/**
 * A partir de esta cantidad de jugadores reales, los NPC dejan de intervenir.
 */
export const NPC_RETIRE_AT = 12;

const SEEN_KEY = "lupi:npc-seen";
const MAX_MESSAGES = 30;

const FIRST_DELAY_MS = 1800;
const LINE_GAP_MS = 600;
const SCENE_GAP_MS: [number, number] = [18_000, 32_000];

const MAX_PENDING_REACTIONS = 3;
const REACTION_COOLDOWN_MS = 8_000;

let history: NpcMessage[] = [];
let counter = 0;
let sessionPlayed = new Set<string>();
let sessionOwner: string | null = null;

export function resetNpcFeedSession() {
  history = [];
  counter = 0;
  sessionPlayed = new Set();
  sessionOwner = null;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const typingMs = (text: string) =>
  Math.min(Math.max(text.length * 28, 700), 2200);

function loadSeen(): SeenMap {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

function markSeen(id: string) {
  try {
    const seen = loadSeen();
    seen[id] = (seen[id] ?? 0) + 1;
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // El feed sigue funcionando aunque localStorage no esté disponible.
  }
}

function waitVisible(): Promise<void> {
  if (!document.hidden) return Promise.resolve();

  return new Promise((resolve) => {
    const onChange = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", onChange);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

type Params = {
  ctx: NpcContext;
  realOthers: number;
  enabled?: boolean;
};

export function useNpcFeed({ ctx, realOthers, enabled = true }: Params) {
  // Si cambia el usuario, empezamos una sesión nueva.
  if (sessionOwner !== ctx.name) {
    resetNpcFeedSession();
    sessionOwner = ctx.name;
  }

  const [messages, setMessages] = useState<NpcMessage[]>(() => history);
  const [typing, setTyping] = useState<NpcId | null>(null);

  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  /** Reacciones en espera: se reproducen entre línea y línea de la escena en curso. */
  const reactionsRef = useRef<Line[][]>([]);

  const retired = realOthers >= NPC_RETIRE_AT;
  const active = enabled && !retired;

  // Escucha lo que hace la persona (npcBus) y lo convierte en reacciones.
  useEffect(() => {
    if (!active) return;

    let lastThrottledAt = 0;

    return subscribeNpcEvents((event) => {
      const throttled = event.type === "chat" || event.type === "player-joined";
      const now = Date.now();
      if (throttled && now - lastThrottledAt < REACTION_COOLDOWN_MS) return;

      const lines = reactionFor(event, ctxRef.current);
      if (!lines) return;

      if (throttled) lastThrottledAt = now;
      reactionsRef.current = [...reactionsRef.current, lines].slice(
        -MAX_PENDING_REACTIONS
      );
    });
  }, [active]);

  useEffect(() => {
    if (!active) {
      setTyping(null);
      return;
    }

    let cancelled = false;
    const timers = new Set<number>();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, ms);
        timers.add(timer);
      });

    const say = async (line: Line) => {
      await waitVisible();
      if (cancelled) return;

      setTyping(line.who);
      await wait(typingMs(line.text));
      if (cancelled) return;
      setTyping(null);

      const message: NpcMessage = {
        key: ++counter,
        who: line.who,
        text: fillName(line.text, ctxRef.current.name),
        at: Date.now(),
      };

      history = [...history, message].slice(-MAX_MESSAGES);
      setMessages(history);

      await wait(LINE_GAP_MS);
    };

    const drainReactions = async () => {
      while (!cancelled && reactionsRef.current.length > 0) {
        const [next, ...rest] = reactionsRef.current;
        reactionsRef.current = rest;
        for (const line of next) {
          if (cancelled) return;
          await say(line);
        }
      }
    };

    let lastId: string | null = null;

    const run = async () => {
      await wait(FIRST_DELAY_MS);

      while (!cancelled) {
        const seen = loadSeen();

        // Evitamos repetir escenas durante esta sesión.
        sessionPlayed.forEach((id) => {
          seen[id] = Infinity;
        });

        let scene = pickScene(ctxRef.current, seen, lastId);

        // Si ya consumimos todas las escenas, reiniciamos el ciclo (no dejar el lobby mudo).
        if (!scene) {
          sessionPlayed = new Set();
          scene = pickScene(ctxRef.current, {}, lastId);

          if (!scene) {
            await wait(8_000);
            continue;
          }
        }

        lastId = scene.id;
        sessionPlayed.add(scene.id);
        markSeen(scene.id);

        for (const line of scene.lines) {
          if (cancelled) return;
          await drainReactions(); // las reacciones se cuelan entre líneas
          if (cancelled) return;
          await say(line);
        }

        // Pausa entre escenas, en ticks de 1s para poder reaccionar mientras esperamos.
        const until = Date.now() + rand(SCENE_GAP_MS[0], SCENE_GAP_MS[1]);
        while (!cancelled && Date.now() < until) {
          await drainReactions();
          await wait(1000);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      setTyping(null);
    };
  }, [active]);

  return {
    messages,
    typing,
    active,
    retired,
    npcs: NPCS,
  };
}