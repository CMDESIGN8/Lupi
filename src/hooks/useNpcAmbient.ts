import { useCallback, useEffect, useRef } from "react";
import { NPCS, type NpcId } from "../lib/npcScenes";

export type AmbientNpcMessage = {
  key: number;
  who: NpcId;
  text: string;
  at: number;
};

type AmbientLine = {
  npc: NpcId;
  text: string;
};

type AmbientScene = {
  lines: AmbientLine[];
};

const SCENES: AmbientScene[] = [
  {
    lines: [
      {
        npc: "luis",
        text: "¿Jugamos una?",
      },
      {
        npc: "martin",
        text: "Yo estoy esperando rival 👀",
      },
      {
        npc: "dt",
        text: "Si somos 5, sale partido.",
      },
    ],
  },

  {
    lines: [
      {
        npc: "juan",
        text: "Hoy necesito farmear XP.",
      },
      {
        npc: "javi",
        text: "Entonces no podés dormirte 😎",
      },
    ],
  },

  {
    lines: [
      {
        npc: "martin",
        text: "Che, ¿vieron el inventario nuevo?",
      },
      {
        npc: "luis",
        text: "Hay una skin que está tremenda.",
      },
      {
        npc: "juan",
        text: "Yo quiero desbloquearla.",
      },
    ],
  },

  {
    lines: [
      {
        npc: "javi",
        text: "Está bastante tranquilo esto.",
      },
      {
        npc: "martin",
        text: "Por ahora...",
      },
      {
        npc: "dt",
        text: "Nunca sabés cuándo arranca el partido.",
      },
    ],
  },

  {
    lines: [
      {
        npc: "luis",
        text: "¿Quién se anima a un desafío?",
      },
      {
        npc: "javi",
        text: "Yo, pero que no sea fácil.",
      },
    ],
  },

  {
    lines: [
      {
        npc: "juan",
        text: "Necesito subir de nivel.",
      },
      {
        npc: "martin",
        text: "Farmear, farmear y farmear.",
      },
    ],
  },

  {
    lines: [
      {
        npc: "dt",
        text: "Equipo listo.",
      },
      {
        npc: "juan",
        text: "Arquero presente 🧤",
      },
      {
        npc: "luis",
        text: "Entonces falta uno.",
      },
    ],
  },
];

const random = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)];

export function useNpcAmbient({
  enabled = true,
  onMessage,
}: {
  enabled?: boolean;
  onMessage: (message: AmbientNpcMessage) => void;
}) {
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const emitScene = useCallback(
    (scene: AmbientScene) => {
      if (!enabled || runningRef.current) return;

      runningRef.current = true;

      scene.lines.forEach((line, index) => {
        const delay = index * (2200 + Math.floor(Math.random() * 1000));

        window.setTimeout(() => {
          if (!enabled) return;

          if (!NPCS[line.npc]) return;

          onMessage({
            key:
              Date.now() +
              index +
              Math.floor(Math.random() * 1000),
            who: line.npc,
            text: line.text,
            at: Date.now(),
          });

          if (index === scene.lines.length - 1) {
            runningRef.current = false;
          }
        }, delay);
      });
    },
    [enabled, onMessage]
  );

  useEffect(() => {
    if (!enabled) return;

    const scheduleNext = () => {
      const delay =
        15000 + Math.floor(Math.random() * 20000);

      timerRef.current = window.setTimeout(() => {
        const scene = random(SCENES);

        emitScene(scene);

        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [enabled, emitScene]);

  return {
    startScene: emitScene,
  };
}