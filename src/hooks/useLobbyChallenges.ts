// src/hooks/useLobbyChallenges.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export type ChallengeGame = "futsal" | "trivia" | "rps" | "truco" | "physical";

export type Challenge = {
  gameType: ChallengeGame;
  /** También sirve como id de la partida. */
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  /** Índice del bot rival del duelo (los dos juegan contra el mismo). */
  botIndex: number;
  at: number;
};

export type DuelResult = {
  fromId: string;
  userScore: number;
  rivalScore: number;
};

export type ChallengeOutcome = {
  kind: "declined" | "busy" | "expired";
  name: string;
};

type Options = {
  room: string;
  meId: string;
  meName: string;
  enabled?: boolean;
  /** false mientras estás en partido: los desafíos entrantes se responden "ocupado". */
  available: boolean;
  /** Los desafíos de gente silenciada se ignoran. */
  isMuted: (userId: string) => boolean;
  /**
   * Alguien aceptó. "host" = el que desafió, "guest" = el que aceptó.
   * Acá es donde GameHub arranca la partida (c.id es el id de la partida).
   */
  onAccepted: (challenge: Challenge, role: "host" | "guest") => void;
};

const INCOMING_TTL = 20_000;
const OUTGOING_TTL = 25_000;
const FROM_COOLDOWN = 10_000;
const OUTCOME_TTL = 4_000;

const MAX_BOT_INDEX = 2;

const score = (value: unknown) => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 99) : 0;
};

const str = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : "";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseChallenge(raw: any): Challenge | null {
  const id = str(raw?.id, 64);
  const fromId = str(raw?.fromId, 128);
  const fromName = str(raw?.fromName, 24).trim();
  const toId = str(raw?.toId, 128);
  if (!id || !fromId || !fromName || !toId) return null;
  const botRaw = Math.trunc(Number(raw?.botIndex));
  const botIndex = Number.isFinite(botRaw) ? Math.min(Math.max(botRaw, 0), MAX_BOT_INDEX) : 1;
  const allowed: ChallengeGame[] = ["futsal", "trivia", "rps", "truco", "physical"];
  const gameType: ChallengeGame = allowed.includes(raw?.gameType) ? raw.gameType : "futsal";
  return { id, fromId, fromName, toId, toName: str(raw?.toName, 24), botIndex, gameType, at: Date.now() };
}

export function useLobbyChallenges({
  room,
  meId,
  meName,
  enabled = true,
  available,
  isMuted,
  onAccepted,
}: Options) {
  const [incoming, setIncomingState] = useState<Challenge | null>(null);
  const [outgoing, setOutgoingState] = useState<Challenge | null>(null);
  const [outcome, setOutcome] = useState<ChallengeOutcome | null>(null);
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState<Record<string, DuelResult>>({});

  const channelRef = useRef<RealtimeChannel | null>(null);
  const incomingRef = useRef<Challenge | null>(null);
  const outgoingRef = useRef<Challenge | null>(null);
  const inTimer = useRef(0);
  const outTimer = useRef(0);
  const lastFrom = useRef(new Map<string, number>());

  // Siempre los últimos callbacks, sin reconectar el canal.
  const availableRef = useRef(available);
  const isMutedRef = useRef(isMuted);
  const onAcceptedRef = useRef(onAccepted);
  availableRef.current = available;
  isMutedRef.current = isMuted;
  onAcceptedRef.current = onAccepted;

  const setIncoming = useCallback((c: Challenge | null) => {
    incomingRef.current = c;
    setIncomingState(c);
  }, []);

  const setOutgoing = useCallback((c: Challenge | null) => {
    outgoingRef.current = c;
    setOutgoingState(c);
  }, []);

  useEffect(() => {
    if (!enabled || !meId) return;

    const channel = supabase.channel(`lobby-challenge:${room}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "challenge" }, ({ payload }) => {
        const c = parseChallenge(payload);
        if (!c || c.toId !== meId || c.fromId === meId) return;
        if (isMutedRef.current(c.fromId)) return;

        // Anti-spam: una invitación cada FROM_COOLDOWN por persona.
        const now = Date.now();
        if (now - (lastFrom.current.get(c.fromId) ?? 0) < FROM_COOLDOWN) return;
        lastFrom.current.set(c.fromId, now);

        if (!availableRef.current || incomingRef.current) {
          void channel.send({
            type: "broadcast",
            event: "reply",
            payload: { id: c.id, fromId: meId, toId: c.fromId, accept: false, busy: true },
          });
          return;
        }

        setIncoming(c);
        window.clearTimeout(inTimer.current);
        inTimer.current = window.setTimeout(() => setIncoming(null), INCOMING_TTL);
      })
      .on("broadcast", { event: "reply" }, ({ payload }) => {
        const out = outgoingRef.current;
        if (!out) return;
        if (str(payload?.id, 64) !== out.id) return;
        if (str(payload?.fromId, 128) !== out.toId) return;
        if (str(payload?.toId, 128) !== meId) return;

        window.clearTimeout(outTimer.current);
        setOutgoing(null);

        if (payload?.accept === true) {
          onAcceptedRef.current(out, "host");
        } else {
          setOutcome({ kind: payload?.busy === true ? "busy" : "declined", name: out.toName });
        }
      })
      .on("broadcast", { event: "duel-result" }, ({ payload }) => {
        const id = str(payload?.id, 64);
        const fromId = str(payload?.fromId, 128);
        if (!id || !fromId || str(payload?.toId, 128) !== meId) return;
        setResults((current) => ({
          ...current,
          [id]: { fromId, userScore: score(payload?.userScore), rivalScore: score(payload?.rivalScore) },
        }));
      })
      .subscribe((state) => setReady(state === "SUBSCRIBED"));

    return () => {
      window.clearTimeout(inTimer.current);
      window.clearTimeout(outTimer.current);
      channelRef.current = null;
      setReady(false);
      setIncoming(null);
      setOutgoing(null);
      setResults({});
      supabase.removeChannel(channel);
    };
  }, [room, meId, enabled, setIncoming, setOutgoing]);

  // El aviso de resultado se borra solo.
  useEffect(() => {
    if (!outcome) return;
    const timer = window.setTimeout(() => setOutcome(null), OUTCOME_TTL);
    return () => window.clearTimeout(timer);
  }, [outcome]);

  /** Devuelve true si el desafío salió. */
  const challenge = useCallback(
    (target: { userId: string; username: string }, botIndex = 1, gameType: ChallengeGame = "futsal") => {
      const channel = channelRef.current;
      if (!channel || !ready || outgoingRef.current || target.userId === meId) return false;

      const c: Challenge = {
        id: makeId(),
        fromId: meId,
        fromName: meName.slice(0, 24) || "Jugador",
        toId: target.userId,
        toName: target.username.slice(0, 24),
        botIndex: Math.min(Math.max(Math.trunc(botIndex), 0), MAX_BOT_INDEX),
        gameType,
        at: Date.now(),
      };

      setOutcome(null);
      setOutgoing(c);
      void channel.send({ type: "broadcast", event: "challenge", payload: c });

      window.clearTimeout(outTimer.current);
      outTimer.current = window.setTimeout(() => {
        if (outgoingRef.current?.id === c.id) {
          setOutgoing(null);
          setOutcome({ kind: "expired", name: c.toName });
        }
      }, OUTGOING_TTL);

      return true;
    },
    [ready, meId, meName, setOutgoing]
  );

  const respond = useCallback(
    (accept: boolean) => {
      const c = incomingRef.current;
      if (!c) return;

      window.clearTimeout(inTimer.current);
      setIncoming(null);

      void channelRef.current?.send({
        type: "broadcast",
        event: "reply",
        payload: { id: c.id, fromId: meId, toId: c.fromId, accept },
      });

      if (accept) onAcceptedRef.current(c, "guest");
    },
    [meId, setIncoming]
  );

  /** Le cuenta al rival cómo te fue en el duelo. */
  const sendResult = useCallback(
    (duelId: string, opponentId: string, userScore: number, rivalScore: number) => {
      void channelRef.current?.send({
        type: "broadcast",
        event: "duel-result",
        payload: { id: duelId, fromId: meId, toId: opponentId, userScore, rivalScore },
      });
    },
    [meId]
  );

  const cancel = useCallback(() => {
    window.clearTimeout(outTimer.current);
    setOutgoing(null);
  }, [setOutgoing]);

  return { incoming, outgoing, outcome, ready, results, challenge, respond, cancel, sendResult };
}