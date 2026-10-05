// src/components/LobbyChat.tsx
import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { checkMessage, MAX_LEN } from "../lib/chatFilter";
import { useNpcFeed, type NpcMessage } from "../hooks/useNpcFeed";
import type {
  PlayerSnapshot,
  WorldEvent,
  WorldEventType,
} from "../hooks/useWorldEvents";
import { emitNpcEvent } from "../lib/npcBus";
import { NPCS, type NpcContext, type NpcId } from "../lib/npcScenes";
import type { InventoryItem, ItemSlot } from "../hooks/useAuraInventory";
import type { LobbyPlayer, LobbyStatus } from "../hooks/useLobbyPresence";
import "./LobbyChat.css";
import { useNpcConversation } from "../hooks/useNpcConversation";
import {
  useNpcAmbient,
  type AmbientNpcMessage,
} from "../hooks/useNpcAmbient";

type ChatMessage = {
  id: string;
  authorId: string;
  author: string;
  text: string;
  at: number;
};

type Row = {
  id: string;
  user_id: string;
  author: string;
  text: string;
  created_at: string;
};

type Entry =
  | { kind: "player"; key: string; at: number; message: ChatMessage }
  | { kind: "npc"; key: string; at: number; message: NpcMessage }
  | { kind: "system"; key: string; at: number; message: WorldEvent };

type Props = {
  room: string;
  meId: string;
  meName: string;
  players: LobbyPlayer[];
  status: LobbyStatus;
  catalog: InventoryItem[];
  npcCtx: NpcContext;
  /** Cantidad de jugadores reales aparte de vos. */
  realOthers: number;
  /** Eventos del mundo (los genera useWorldEvents en GameHub, una sola vez). */
  events: WorldEvent[];
  /** Al tocar el avatar de un jugador conectado. */
  onSelectPlayer?: (userId: string) => void;
  /** Jugadores silenciados: sus mensajes no se muestran. */
  mutedIds?: Set<string>;
};

const MAX_MESSAGES = 60;
const MAX_NAME = 24;
const HISTORY_LIMIT = 50;
const STICK_THRESHOLD = 80;
const SLOT_ORDER: ItemSlot[] = ["top", "bottom", "boots", "accessory"];

const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
const RARITY_COLOR: Record<string, string> = {
  common: "#9aa4a0",
  rare: "#3b9bff",
  epic: "#b061ff",
  legendary: "#ffb629",
};

/** Eventos del mundo que se muestran como línea de sistema en el chat. */
const SYSTEM_ICON: Partial<Record<WorldEventType, string>> = {
  player_join: "👋",
  player_leave: "🚪",
  level_up: "⚡",
  aura_spotted: "✨",
};

function safeString(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Todo lo que viene de la base o de realtime se normaliza igual que antes. */
function fromRow(raw: Partial<Row> | null | undefined): ChatMessage | null {
  if (!raw) return null;
  const text = safeString(raw.text, MAX_LEN).trim();
  const author = safeString(raw.author, MAX_NAME).trim();
  const authorId = safeString(raw.user_id, 128).trim();
  const at = Date.parse(safeString(raw.created_at, 40));
  const id = safeString(raw.id, 100);
  if (!id || !text || !author || !authorId || !Number.isFinite(at)) return null;
  return { id, authorId, author, text, at };
}

/** Une listas sin duplicar por id, ordena por fecha y se queda con las últimas. */
function merge(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const m of [...a, ...b]) if (!map.has(m.id)) map.set(m.id, m);
  return [...map.values()].sort((x, y) => x.at - y.at).slice(-MAX_MESSAGES);
}

function PlayerAvatar({
  player,
  byId,
}: {
  player?: LobbyPlayer;
  byId: Map<string, InventoryItem>;
}) {
  if (!player) return <span className="lc-avatar__fallback" aria-hidden>👤</span>;

  const equipped = SLOT_ORDER
    .map((slot) => {
      const id = player.look[slot];
      return id ? byId.get(id) : undefined;
    })
    .filter((item): item is InventoryItem => Boolean(item));

  const main = equipped.find((item) => item.slot === "top") ?? equipped[0];
  if (!main) return <span className="lc-avatar__fallback" aria-hidden>👤</span>;

  return main.imageUrl ? (
    <img src={main.imageUrl} alt="" draggable={false} loading="lazy" />
  ) : (
    <span className="lc-avatar__fallback" aria-hidden>{main.icon || "👤"}</span>
  );
}

function formatTime(at: number) {
  try {
    return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(at);
  } catch {
    return "";
  }
}

export function LobbyChat({
  room,
  meId,
  meName,
  players,
  status,
  catalog,
  npcCtx,
  realOthers,
  events,
  onSelectPlayer,
  mutedIds,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mutedNpc, setMutedNpc] = useState(false);
  const [chatStatus, setChatStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [unread, setUnread] = useState(0);
  const [conversationMessages, setConversationMessages] = useState<NpcMessage[]>([]);

  const logWrapRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const prevLastKeyRef = useRef<string | undefined>(undefined);
  const lastJoinRef = useRef<string | null>(null);

  const { messages: npcMessages, typing: npcTyping } = useNpcFeed({
    ctx: npcCtx,
    realOthers,
    enabled: !mutedNpc,
  });
  
  const handleAmbientNpcMessage = useCallback(
  (message: AmbientNpcMessage) => {
    if (mutedNpc) return;

    const npcMessage: NpcMessage = {
      key: message.key,
      who: message.who,
      text: message.text,
      at: message.at,
    };

    setConversationMessages((current) => [
      ...current.slice(-19),
      npcMessage,
    ]);
  },
  [mutedNpc]
);
  
  const handleNpcConversation = ({
  npc,
  text,
}: {
  npc: NpcId;
  text: string;
}) => {
  if (mutedNpc) return;

  const message: NpcMessage = {
    key: Date.now() + Math.floor(Math.random() * 1000),
    who: npc,
    text,
    at: Date.now(),
  };

  setConversationMessages((current) => [
    ...current.slice(-19),
    message,
  ]);
};

const { respondToMessage } = useNpcConversation({
  enabled: !mutedNpc,
  meId,
  meName,
  onNpcMessage: handleNpcConversation,
});

useNpcAmbient({
  enabled: !mutedNpc,
  onMessage: handleAmbientNpcMessage,
});

  const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const playerById = useMemo(() => new Map(players.map((p) => [p.userId, p])), [players]);

  /*
   * Foto de cada jugador para useWorldEvents: LobbyPlayer solo trae ids de items,
   * acá los resolvemos contra el catálogo (así aura_spotted sí dispara).
   */
  const snapshots = useMemo<PlayerSnapshot[]>(
    () =>
      players.map((p) => {
        const worn: InventoryItem[] = [];
        for (const slot of SLOT_ORDER) {
          const id = p.look[slot];
          const item = id ? byId.get(id) : undefined;
          if (item && item.slot === slot) worn.push(item);
        }
        const best = worn.reduce<InventoryItem | undefined>(
          (acc, item) =>
            !acc || (RARITY_RANK[item.rarity] ?? 0) > (RARITY_RANK[acc.rarity] ?? 0) ? item : acc,
          undefined
        );
        return {
          userId: p.userId,
          username: p.username,
          level: p.level,
          hasSkin: worn.length > 0,
          rarity: best?.rarity,
          auraColor: best?.color,
        };
      }),
    [players, byId]
  );

  const rarityById = useMemo(
    () => new Map(snapshots.map((s) => [s.userId, s.rarity])),
    [snapshots]
  );

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  // Cuando entra alguien real, los NPC lo reciben (con cooldown dentro de useNpcFeed).
  useEffect(() => {
    if (!latestEvent || latestEvent.type !== "player_join") return;
    if (latestEvent.id === lastJoinRef.current) return;
    lastJoinRef.current = latestEvent.id;
    if (latestEvent.username) emitNpcEvent({ type: "player-joined", name: latestEvent.username });
  }, [latestEvent]);

  /*
   * Mensajes: historial desde Supabase + INSERTs en vivo (postgres_changes).
   * El id lo genera el cliente, así el eco de realtime de tu propio mensaje se deduplica.
   */
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setChatStatus("connecting");

    const channel: RealtimeChannel = supabase
      .channel(`lobby-chat-db:${room}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lobby_messages", filter: `room=eq.${room}` },
        (payload) => {
          const incoming = fromRow(payload.new as Partial<Row>);
          if (incoming) setMessages((current) => merge(current, [incoming]));
        }
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setChatStatus("online");
        if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setChatStatus("offline");
        }
      });

    (async () => {
      const { data, error: loadError } = await supabase
        .from("lobby_messages")
        .select("id, user_id, author, text, created_at")
        .eq("room", room)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      if (cancelled || loadError || !data) return;

      const history = (data as Row[])
        .map(fromRow)
        .filter((m): m is ChatMessage => m !== null);
      setMessages((current) => merge(history, current));
    })();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [room]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const currentText = typeof text === "string" ? text : "";
    const textLength = typeof text === "string" ? text.length : 0;
    const checked = checkMessage(text);
    if (!checked.ok) {
      setError(checked.reason);
      return;
    }

    if (chatStatus !== "online") {
      setError("El chat todavía se está conectando.");
      return;
    }

    const message: ChatMessage = {
      id: makeId(),
      authorId: meId,
      author: meName.slice(0, MAX_NAME) || "Jugador",
      text: checked.text,
      at: Date.now(),
    };

    // Optimistic UI: el jugador ve su mensaje inmediatamente y siempre baja al final.
    stickRef.current = true;
    setMessages((current) => merge(current, [message]));
    setText("");
    emitNpcEvent({ type: "chat", text: message.text, author: message.author, mine: true });
    respondToMessage(message.text);

    // user_id lo pone la base (auth.uid()) y la RLS lo verifica: no se puede firmar como otro.
    const { error: insertError } = await supabase.from("lobby_messages").insert({
      id: message.id,
      room,
      author: message.author,
      text: message.text,
    });

    if (insertError) {
      setMessages((current) => current.filter((m) => m.id !== message.id));
      setText(message.text);
      setError(
        insertError.message.includes("rate_limited")
          ? "Vas muy rápido. Esperá un segundo."
          : "No se pudo enviar el mensaje. Probá de nuevo."
      );
    }
  };

  const totalOnline = players.length;

  const displayMessages = useMemo<Entry[]>(() => {
    const entries: Entry[] = [
      ...messages
        .filter((m) => !mutedIds?.has(m.authorId))
        .map((m): Entry => ({ kind: "player", key: `p-${m.id}`, at: m.at, message: m })),
      ...events
        .filter((e) => SYSTEM_ICON[e.type])
        .map((e): Entry => ({ kind: "system", key: `s-${e.id}`, at: e.createdAt, message: e })),
    ];

    if (!mutedNpc) {
  for (const m of npcMessages) {
    entries.push({
      kind: "npc",
      key: `n-${m.key}`,
      at: m.at,
      message: m,
    });
  }

  for (const m of conversationMessages) {
    entries.push({
      kind: "npc",
      key: `c-${m.key}`,
      at: m.at,
      message: m,
    });
  }
}

    return entries.sort((a, b) => a.at - b.at);
  }, [
  messages,
  events,
  npcMessages,
  conversationMessages,
  mutedNpc,
  mutedIds,
]);

  const typingNpcData = npcTyping ? NPCS[npcTyping as NpcId] : null;

  /*
   * AUTOSCROLL "stick to bottom": solo te baja si ya estabas abajo.
   * Si estás leyendo arriba, aparece el pill de mensajes nuevos.
   */
  const onScroll = () => {
    const el = logWrapRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
    if (stickRef.current) setUnread(0);
  };

  const lastKey = displayMessages.length
    ? displayMessages[displayMessages.length - 1].key
    : undefined;

  useEffect(() => {
    const el = logWrapRef.current;
    if (!el) return;

    const isNew = lastKey !== prevLastKeyRef.current;
    prevLastKeyRef.current = lastKey;

    if (stickRef.current) {
      const frame = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return () => cancelAnimationFrame(frame);
    }

    if (isNew) setUnread((n) => n + 1);
  }, [lastKey, npcTyping]);

  const jumpToBottom = () => {
    const el = logWrapRef.current;
    if (!el) return;
    stickRef.current = true;
    setUnread(0);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <section className="lc" aria-label="Chat del lobby">
      <header className="lc-head">
        <div>
          <div className="lc-kicker">LUPI WORLD</div>
          <h2 className="lc-title">Chat del lobby</h2>
        </div>

        <div className="lc-head-right">
          <span className={`lc-status lc-status--${status === "online" && chatStatus === "online" ? "online" : "offline"}`}>
            <i aria-hidden />
            {totalOnline} {totalOnline === 1 ? "jugador" : "jugadores"}
          </span>
          <button
            type="button"
            className={`lc-npc-toggle ${mutedNpc ? "is-muted" : ""}`}
            onClick={() => setMutedNpc((value) => !value)}
            aria-pressed={mutedNpc}
          >
            {mutedNpc ? "NPC OFF" : "NPC ON"}
          </button>
        </div>
      </header>

      <div className="lc-body">
        <div className="lc-log-wrap" ref={logWrapRef} onScroll={onScroll}>
          <ol className="lc-log" role="log" aria-live="polite">
            {displayMessages.length === 0 && !typingNpcData && (
              <li className="lc-empty">
                <span className="lc-empty__icon">💬</span>
                <strong>La sala está tranquila...</strong>
                <span>Escribí algo o esperá a que llegue otro jugador.</span>
              </li>
            )}

            {displayMessages.map((entry) => {
              if (entry.kind === "system") {
                return (
                  <li key={entry.key} className={`lc-system lc-system--${entry.message.type}`}>
                    <span>
                      {SYSTEM_ICON[entry.message.type]} {entry.message.message}
                    </span>
                  </li>
                );
              }

              if (entry.kind === "npc") {
  const npc = NPCS[entry.message.who];

  if (!npc) {
    return (
      <li
        key={entry.key}
        className="lc-message lc-message--npc"
      >
        <div className="lc-avatar lc-avatar--npc" aria-hidden>
          🤖
        </div>

        <div className="lc-bubble-wrap">
          <div className="lc-meta">
            <strong>NPC</strong>
            <span className="lc-badge lc-badge--npc">
              LUPI WORLD
            </span>
          </div>

          <div className="lc-bubble">
            {entry.message.text}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      key={entry.key}
      className="lc-message lc-message--npc"
      style={
        {
          "--lc-color": npc.color,
        } as CSSProperties
      }
    >
      <div className="lc-avatar lc-avatar--npc" aria-hidden>
        {npc.emoji}
      </div>

      <div className="lc-bubble-wrap">
        <div className="lc-meta">
          <strong>{npc.name}</strong>

          <span className="lc-badge lc-badge--npc">
            NPC · {npc.tag}
          </span>
        </div>

        <div className="lc-bubble">
          {entry.message.text}
        </div>
      </div>
    </li>
  );
}

              const m = entry.message;
              const player = playerById.get(m.authorId);
              const isMe = m.authorId === meId;
              // Si el autor está conectado usamos su nombre de presence (no el que viene escrito en el mensaje).
              const name = isMe ? "Vos" : player?.username ?? m.author;
              const rarity = rarityById.get(m.authorId);
              const avatarStyle = rarity
                ? ({ "--lc-rarity": RARITY_COLOR[rarity] ?? RARITY_COLOR.common } as CSSProperties)
                : undefined;

              return (
                <li key={entry.key} className={`lc-message lc-message--player ${isMe ? "is-me" : ""}`}>
                  {player ? (
                    <button
                      type="button"
                      className={`lc-avatar lc-avatar--btn ${rarity ? "lc-avatar--rarity" : ""}`}
                      style={avatarStyle}
                      onClick={() => onSelectPlayer?.(m.authorId)}
                      aria-label={`Ver perfil de ${name}`}
                    >
                      <PlayerAvatar player={player} byId={byId} />
                      <span className="lc-level">{player.level}</span>
                    </button>
                  ) : (
                    <div className="lc-avatar" aria-hidden>
                      <PlayerAvatar player={player} byId={byId} />
                    </div>
                  )}
                  <div className="lc-bubble-wrap">
                    <div className="lc-meta">
                      <strong>{name}</strong>
                      {player?.club && <span className="lc-club">{player.club}</span>}
                      <span className="lc-time">{formatTime(m.at)}</span>
                    </div>
                    <div className="lc-bubble">{m.text}</div>
                  </div>
                </li>
              );
            })}

            {typingNpcData && !mutedNpc && (
              <li className="lc-message lc-message--npc lc-message--typing" style={{ "--lc-color": typingNpcData.color } as CSSProperties}>
                <div className="lc-avatar lc-avatar--npc" aria-hidden>{typingNpcData.emoji}</div>
                <div className="lc-bubble-wrap">
                  <div className="lc-meta"><strong>{typingNpcData.name}</strong><span className="lc-badge lc-badge--npc">NPC</span></div>
                  <div className="lc-bubble lc-bubble--typing"><i /><i /><i /></div>
                </div>
              </li>
            )}
          </ol>
        </div>

        {unread > 0 && (
          <button type="button" className="lc-unread" onClick={jumpToBottom}>
            ↓ {unread} {unread === 1 ? "mensaje nuevo" : "mensajes nuevos"}
          </button>
        )}
      </div>

      <form className="lc-composer" onSubmit={send}>
        <div className="lc-input-shell">
          <input
              value={text}
              onChange={(event) => {
                const value = event.target.value;
                setText(value);
                if (error) setError(null);
              }}
            maxLength={MAX_LEN}
            placeholder={chatStatus === "online" ? "Escribí al lobby..." : "Conectando al chat..."}
            disabled={chatStatus !== "online"}
            aria-label="Mensaje del chat"
          />
          <span className={`lc-counter ${text.length > MAX_LEN - 20 ? "is-warning" : ""}`}>
            {text.length}/{MAX_LEN}
          </span>
        </div>
        <button type="submit" className="lc-send" disabled={!text.trim() || chatStatus !== "online"} aria-label="Enviar mensaje">
          <span>➤</span>
        </button>
      </form>

      {error && <p className="lc-error" role="alert">{error}</p>}

      <footer className="lc-foot">
        <span>Jugadores reales y NPCs comparten la misma conversación.</span>
        <span className="lc-foot__dot" aria-hidden />
        <span>Tratémonos bien.</span>
      </footer>
    </section>
  );
}