// src/hooks/useNpcConversation.ts

import { useCallback, useEffect, useRef } from "react";
import { NPCS, type NpcId } from "../lib/npcScenes";

export type NpcConversationMessage = {
  who: NpcId;
  text: string;
  at: number;
};

type ConversationResponse = {
  npc: NpcId;
  text: string;
  delay: number;
};

const random = <T,>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
console.log("🔥 NUEVO useNpcConversation cargado");
function getResponse(
  message: string,
  playerName: string
): ConversationResponse | null {
  const text = normalize(message);

  // -----------------------------
  // SALUDO
  // -----------------------------
  if (/\b(hola|buenas|hey|hi|holi|holis)\b/.test(text)) {
    return {
      npc: random<NpcId>(["luis", "martin", "juan"]),
      text: random([
        `👋 Buenas ${playerName}!`,
        `Ey ${playerName}, bienvenido al vestuario.`,
        `Qué onda ${playerName}?`,
        `👀 Llegó alguien nuevo.`,
      ]),
      delay: 900 + Math.random() * 900,
    };
  }

  // -----------------------------
  // PARTIDO / JUGAR
  // -----------------------------
  if (
    /\b(jugar|jugamos|juguemos|partido|partida|duelo|rival|revancha)\b/.test(
      text
    )
  ) {
    return {
      npc: random<NpcId>(["dt", "martin", "luis"]),
      text: random([
        `⚔️ Yo estoy listo. ¿Te animás ${playerName}?`,
        `A la cancha entonces.`,
        `Estoy buscando rival hace rato 👀`,
        `Eso, ${playerName}. Menos charla y más cancha.`,
      ]),
      delay: 1100 + Math.random() * 900,
    };
  }

  // -----------------------------
  // NIVEL
  // -----------------------------
  if (/\b(nivel|level|lvl|nv)\b/.test(text)) {
    return {
      npc: random<NpcId>(["dt", "luis", "martin"]),
      text: random([
        `🔥 El nivel se demuestra jugando.`,
        `Seguí jugando y ese nivel va a subir.`,
        `No mires tanto el número... mirá la racha 👀`,
      ]),
      delay: 1000 + Math.random() * 800,
    };
  }

  // -----------------------------
  // ABURRIMIENTO
  // -----------------------------
  if (
    /aburrid|que hago|qué hago|que se puede hacer|qué se puede hacer|hay algo|nada para hacer/.test(
      text
    )
  ) {
    return {
      npc: random<NpcId>(["martin", "javi", "dt"]),
      text: random([
        `¿Aburrido? Todavía no viste todo lo que pasa acá... 👀`,
        `Podés explorar, armar tu equipo o buscarte un rival.`,
        `Esperá un rato. El lobby cambia cuando menos lo esperás.`,
        `Hay cosas que todavía no descubriste...`,
      ]),
      delay: 1400 + Math.random() * 1000,
    };
  }

  // -----------------------------
  // XP
  // -----------------------------
  if (/\b(xp|experiencia|farmear|farm)\b/.test(text)) {
    return {
      npc: random<NpcId>(["luis", "martin", "dt"]),
      text: random([
        `🔥 Si querés XP, tenés que moverte.`,
        `Farmear sin parar... esa es la actitud.`,
        `Guardate los mejores boosts para cuando aparezca un evento 👀`,
      ]),
      delay: 1000 + Math.random() * 900,
    };
  }

  // -----------------------------
  // SKINS / AURA
  // -----------------------------
  if (/\b(skin|skins|ropa|aura|item|items)\b/.test(text)) {
    return {
      npc: random<NpcId>(["luis", "martin", "javi"]),
      text: random([
        `👀 Vi algunas skins bastante raras por acá.`,
        `Tu aura dice mucho de cómo jugás.`,
        `Los mejores items no aparecen todos los días.`,
        `Ahora quiero ver cómo entrás a la cancha.`,
      ]),
      delay: 1200 + Math.random() * 900,
    };
  }

  // -----------------------------
  // RISAS
  // -----------------------------
  if (/jaj|jeje|xd|😂|🤣/.test(text)) {
    return {
      npc: random<NpcId>(["luis", "javi", "martin"]),
      text: random([
        `😂 sabía que alguien iba a decir eso.`,
        `JAJAJA`,
        `💀`,
        `No te rías tanto que todavía falta el partido.`,
      ]),
      delay: 700 + Math.random() * 500,
    };
  }

  // -----------------------------
  // AYUDA
  // -----------------------------
  if (
    /\b(ayuda|ayudame|ayúdame|como hago|cómo hago|no entiendo|que hago)\b/.test(
      text
    )
  ) {
    return {
      npc: "dt",
      text: `${playerName}, preguntá nomás. El DT está para eso 🧢`,
      delay: 900 + Math.random() * 700,
    };
  }

  return null;
}

type Options = {
  enabled?: boolean;
  meId: string;
  meName: string;
  onNpcMessage: (message: {
    npc: NpcId;
    text: string;
  }) => void;
};

export function useNpcConversation({
  enabled = true,
  meId: _meId,
  meName,
  onNpcMessage,
}: Options) {
  const cooldownRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  const respondToMessage = useCallback(
    (message: string) => {
      if (!enabled) return;
console.log("🔥 RESPONDER CON NUEVO SISTEMA:", message);
      const now = Date.now();

      // Evita que el lobby se convierta en un bot-chat.
      if (now < cooldownRef.current) return;

      const response = getResponse(message, meName);

      if (!response) return;

      // Un NPC como máximo cada 8 segundos.
      cooldownRef.current = now + 8000;

      const timer = window.setTimeout(() => {
        // Seguridad extra por si el NPC fue eliminado/cambiado.
        if (!NPCS[response.npc]) return;

        onNpcMessage({
          npc: response.npc,
          text: response.text,
        });
      }, response.delay);

      timersRef.current.push(timer);
    },
    [enabled, meName, onNpcMessage]
  );

  return {
    respondToMessage,
  };
}