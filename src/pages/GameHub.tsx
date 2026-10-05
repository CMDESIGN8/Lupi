// src/pages/GameHub.tsx
import { useMemo, useState } from "react";
import { AppUser } from "../lib/api";
import { UserCard, Deck } from "../types/cards";
import { CardBattle } from "../components/CardBattle";
import { CampaignMode } from "../components/CampaignMode";
import { DeckBuilder } from "../components/DeckBuilder";
import { CardAlbum } from "../components/CardAlbum";
import { PackModal } from "../components/PackModal";
import { useUserHeroData } from "../hooks/useUserHeroData";
import { useUserDivision } from "../hooks/useUserDivision";
import { usePacksCount } from "../hooks/usePacksCount";
import { useAuraInventory, type InventoryItem, type ItemSlot } from "../hooks/useAuraInventory";
import { useLobbyPresence, type LobbyLook, type LobbyPlayer } from "../hooks/useLobbyPresence";
import { LobbyChat } from "../components/LobbyChat";
import { LockerPreview } from "../components/LockerPreview";
import {
  useWorldEvents,
  type WorldEvent,
} from "../hooks/useWorldEvents";
import "./GameHub.css";
import "./GameHubLobby.css";
import {
  useLobbyChallenges,
  type Challenge,
  type ChallengeOutcome,
} from "../hooks/useLobbyChallenges";

import { useLobbyModeration } from "../hooks/useLobbyModeration";
import {
  PlayerCard,
  ChallengeToasts,
  DuelSummary,
} from "../components/PlayerCard";

type GameTab = "play" | "album" | "deck";
type BattleMode = "quick" | "campaign";

type Props = {
  user: AppUser;
  onNavigate: (t: string) => void;
  gameTab: GameTab;
  setGameTab: (tab: GameTab) => void;
  userCards: UserCard[];
  activeDeck: Deck;
  loadUserCards: () => void;
  loadActiveDeck: () => void;
  setActiveDeck: (deck: Deck) => void;
  loadAlbumProgress: () => void;
  onBackHome: () => void;
};

const TABS: { id: GameTab; icon: string; label: string }[] = [
  { id: "play", icon: "⚽", label: "Jugar" },
  { id: "deck", icon: "👕", label: "Equipo" },
  { id: "album", icon: "▦", label: "Álbum" },
];

const NEXT_LEAGUE: Record<string, string> = {
  rookie: "LIGA BRONCE",
  bronze: "LIGA PLATA",
  silver: "LIGA ORO",
  gold: "LIGA PLATINO",
  platinum: "LIGA LEYENDA",
  legend: "CAMPEÓN",
};

const SLOT_ORDER: ItemSlot[] = ["top", "bottom", "boots", "accessory"];

function getPlayerSkin(player: LobbyPlayer, catalog: InventoryItem[]) {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const equipped = SLOT_ORDER
    .map((slot) => {
      const id = player.look[slot];
      return id ? byId.get(id) : undefined;
    })
    .filter((item): item is InventoryItem => Boolean(item));

  return equipped.find((item) => item.slot === "top") ?? equipped[0] ?? null;
}



function WorldPlayer({
  player,
  index,
  isMe,
  catalog,
  onSelect,
}: {
  player: LobbyPlayer;
  index: number;
  isMe: boolean;
  catalog: InventoryItem[];
  onSelect: (player: LobbyPlayer) => void;
}) {
  const skin = getPlayerSkin(player, catalog);
  const skinClass = skin?.imageUrl ? "has-skin" : "no-skin";

  // El aura visual toma el color del item equipado.
  // Si no hay skin/item, usamos el verde default.
  const auraColor = skin?.color || "#00ff88";

  return (
    <button
  type="button"
  className={`gh-world-player gh-world-player--${index % 6} ${
    isMe ? "is-me" : ""
  }`}
  title={`${isMe ? "Vos" : player.username} · Nivel ${player.level}`}
  aria-label={`${isMe ? "Vos" : player.username}, nivel ${player.level}`}
  onClick={() => onSelect(player)}
  style={
    {
      "--aura-color": auraColor,
      "--aura-color-soft": hexToRgba(auraColor, 0.16),
      "--aura-color-medium": hexToRgba(auraColor, 0.42),
    } as React.CSSProperties
  }
>
      <span className={`gh-world-avatar ${skinClass}`}>
        {skin?.imageUrl ? (
          <img
            src={skin.imageUrl}
            alt=""
            draggable={false}
            loading="lazy"
          />
        ) : (
          <span aria-hidden>👤</span>
        )}

        <span className="gh-world-level">
          {player.level}
        </span>
      </span>

      <span className="gh-world-name">
        {isMe ? "Vos" : player.username}
      </span>

      <span className="gh-world-state">
        <i aria-hidden />
        {isMe ? "ESTÁS ACÁ" : "EN LÍNEA"}
      </span>
    </button>
  );
}

function WorldEventToast({
  event,
}: {
  event: WorldEvent;
}) {
  return (
    <div
  key={event.id}
  className={`gh-world-event gh-world-event--${event.type}`}
  style={
    event.auraColor
      ? ({
          "--event-aura": event.auraColor,
          "--event-aura-soft": hexToRgba(event.auraColor, 0.18),
          "--event-aura-medium": hexToRgba(event.auraColor, 0.42),
        } as React.CSSProperties)
      : undefined
  }
>
      <div className="gh-world-event__icon">
        {event.type === "player_join" && "👤"}
        {event.type === "player_leave" && "↗"}
        {event.type === "self_enter" && "🌎"}
        {event.type === "player_count" && "⚡"}
        {event.type === "level_up" && "⬆"}
        {event.type === "aura_spotted" && "✦"}
      </div>

      <div className="gh-world-event__content">
        <span className="gh-world-event__label">
          WORLD EVENT
        </span>

        <strong>{event.message}</strong>
      </div>
    </div>
  );
}

function WorldPlayerProfile({
  player,
  catalog,
  onClose,
  isMe,
}: {
  player: LobbyPlayer;
  catalog: InventoryItem[];
  onClose: () => void;
  isMe: boolean;
}) {
  const skin = getPlayerSkin(player, catalog);
  const auraColor = skin?.color || "#00ff88";

  const rarityLabel =
    skin?.rarity === "legendary"
      ? "LEGENDARY"
      : skin?.rarity === "epic"
        ? "EPIC"
        : skin?.rarity === "rare"
          ? "RARE"
          : "COMMON";

  return (
    <div
      className="gh-world-profile-backdrop"
      onClick={onClose}
    >
      <section
        className="gh-world-profile"
        style={
          {
            "--profile-aura": auraColor,
            "--profile-aura-soft": hexToRgba(auraColor, 0.16),
            "--profile-aura-medium": hexToRgba(auraColor, 0.42),
          } as React.CSSProperties
        }
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${player.username}`}
      >
        <button
          type="button"
          className="gh-world-profile__close"
          onClick={onClose}
          aria-label="Cerrar perfil"
        >
          ×
        </button>

        <div className="gh-world-profile__aura" />

        <div className="gh-world-profile__avatar">
          {skin?.imageUrl ? (
            <img
              src={skin.imageUrl}
              alt=""
              draggable={false}
            />
          ) : (
            <span aria-hidden>👤</span>
          )}

          <span className="gh-world-profile__level">
            {player.level}
          </span>
        </div>

        <div className="gh-world-profile__identity">
          <span className="gh-world-profile__eyebrow">
            {isMe ? "TU PERFIL" : "JUGADOR EN EL WORLD"}
          </span>

          <h2>{player.username}</h2>

          <span className="gh-world-profile__online">
            <i />
            EN LÍNEA
          </span>
        </div>

        <div className="gh-world-profile__stats">
          <div>
            <small>NIVEL</small>
            <strong>{player.level}</strong>
          </div>

          <div>
            <small>AURA</small>
            <strong style={{ color: auraColor }}>
              {rarityLabel}
            </strong>
          </div>

          <div>
            <small>CLUB</small>
            <strong>
              {player.club || "LUPI"}
            </strong>
          </div>
        </div>

        {skin && (
          <div className="gh-world-profile__skin">
            <div>
              <span>SKIN EQUIPADA</span>
              <strong>{skin.name}</strong>
            </div>

            <span
              className="gh-world-profile__rarity"
              style={{
                color: auraColor,
                borderColor: hexToRgba(auraColor, 0.42),
                background: hexToRgba(auraColor, 0.10),
              }}
            >
              {rarityLabel}
            </span>
          </div>
        )}

        {!isMe && (
          <div className="gh-world-profile__actions">
            <button
              type="button"
              className="gh-world-profile__action gh-world-profile__action--primary"
            >
              ⚡ INVITAR A PARTIDO
            </button>

            <button
              type="button"
              className="gh-world-profile__action"
            >
              VER PERFIL
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");

  if (clean.length !== 6) {
    return `rgba(0,255,136,${alpha})`;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

export function GameHub({
  user,
  onNavigate,
  gameTab,
  setGameTab,
  userCards,
  activeDeck,
  loadUserCards,
  loadActiveDeck,
  setActiveDeck,
  loadAlbumProgress,
  onBackHome,
}: Props) {
  const [view, setView] = useState<"lobby" | "match">("lobby");
  const [battleMode, setBattleMode] = useState<BattleMode>("quick");
  const [showPackModal, setShowPackModal] = useState(false);
  const [selectedWorldPlayer, setSelectedWorldPlayer] =
  useState<LobbyPlayer | null>(null);

  const { data: heroData } = useUserHeroData(user.id);
  const { data: userDivision, loading: divisionLoading } = useUserDivision(user.id);
  const { count: packCount } = usePacksCount(user.id);

  const level = heroData?.level || 1;
  const exp = heroData?.exp || 0;
  const expNeeded = heroData?.expNeeded || 100;
  const xpPct = Math.min(100, Math.round((exp / expNeeded) * 100));

  const { items: auraItems } = useAuraInventory(user.id, level);
  const look = useMemo(() => {
    const l: LobbyLook = {};
    auraItems.forEach((i) => {
      if (i.equipped) l[i.slot] = i.id;
    });
    return l;
  }, [auraItems]);

  const { players: lobbyPlayers, status: lobbyStatus } = useLobbyPresence({
  room: "global",
  me: {
    userId: user.id,
    username: user.username,
    club: user.club ?? null,
    level,
    look,
  },
});

const {
  muted,
  isMuted,
  toggleMute,
  report,
} = useLobbyModeration(user.id);

const {
  incoming,
  outgoing,
  outcome,
  results,
  challenge,
  respond,
  cancel,
  sendResult,
} = useLobbyChallenges({
  room: "global",
  meId: user.id,
  meName: user.username || "Jugador",
  available: view === "lobby",
  isMuted,
  onAccepted: (challengeData, role) => {
    console.log("DUEL ACCEPTED", {
      challenge: challengeData,
      role,
    });

    setBattleMode("quick");
    if (gameTab !== "play") setGameTab("play");
    setView("match");
    window.scrollTo({ top: 0 });
  },
});

  const realOthers = lobbyPlayers.filter((p) => p.userId !== user.id).length;
 
  const worldPlayers = lobbyPlayers.map((player) => {
  const skin = getPlayerSkin(player, auraItems);

  return {
    ...player,
    hasSkin: Boolean(skin),
    skinName: skin?.name,
    rarity: skin?.rarity,
    auraColor: skin?.color,
  };
});

  const mySkin = getPlayerSkin(
  {
    userId: user.id,
    username: user.username || "Jugador",
    club: null,
    level,
    look,
    activity: "lobby",
    joinedAt: Date.now(),
  },
  auraItems
);

const myAuraColor = mySkin?.color || "#00ff88";

const {
  events,
  latestEvent: latestWorldEvent,
} = useWorldEvents({
  meId: user.id,
  meName: user.username || "Jugador",
  meLevel: level,
  players: worldPlayers,
  auraColor: myAuraColor,
});
  
  const npcCtx = {
  name: user.username || "crack",
  deckSize: activeDeck?.cards?.length ?? 0,
  packCount: packCount ?? 0,
  isThursday: new Date().getDay() === 4,

  level,

  division: userDivision?.campaignLeagueId || "rookie",

  realOthers,

  hasSkin: Object.keys(look).length > 0,
};

  const nextLeague = divisionLoading
    ? "CARGANDO..."
    : NEXT_LEAGUE[userDivision?.campaignLeagueId || "rookie"] || "LIGA BRONCE";

  const onBattleComplete = () => {
    loadUserCards();
    loadActiveDeck();
    loadAlbumProgress();
  };

  const openMatch = (mode: BattleMode) => {
    setBattleMode(mode);
    if (gameTab !== "play") setGameTab("play");
    setView("match");
    window.scrollTo({ top: 0 });
  };


  const handleGameNavigate = (target: string) => {
    switch (target) {
      case "campaign":
        openMatch("campaign");
        break;
      case "battle":
      case "play":
        openMatch("quick");
        break;
      case "deck":
        setGameTab("deck");
        break;
      case "album":
        setGameTab("album");
        break;
      default:
        onNavigate(target);
    }
  };

  const handleTab = (id: GameTab) => {
    if (id === "play" && gameTab === "play") setView("lobby");
    setGameTab(id);
  };
  

  const activeIndex = TABS.findIndex((t) => t.id === gameTab);
  const sceneKey = gameTab === "play" ? `play-${view}` : gameTab;

  return (
    <div className="main-content gh-root">
      <div className="gh-light gh-light--l" aria-hidden>
        <span className="gh-light__beam" />
        <span className="gh-light__bloom" />
        <span className="gh-light__flare" />
      </div>
      <div className="gh-light gh-light--r" aria-hidden>
        <span className="gh-light__beam" />
        <span className="gh-light__bloom" />
        <span className="gh-light__flare" />
      </div>

      <div className={`gh-shell ${(gameTab === "play" && view === "lobby") || gameTab === "deck" ? "gh-shell--wide" : ""}`}>
        <header className="gh-hud">
          <button className="gh-back" onClick={onBackHome} aria-label="Volver a la jornada">
            <span aria-hidden>‹</span> LUPI WORLD
          </button>

          <div className="gh-brand">
            
            <strong>LOBBY PRINCIPAL</strong>
          </div>

          <div className="gh-hud__right">
            <div className="gh-wallet" title="Tus puntos">
              <span className="gh-wallet__coin" aria-hidden>●</span>
              {user.points || 0}
            </div>
            <div className="gh-level" style={{ ["--xp" as string]: xpPct }} title={`Nivel ${level} · ${exp}/${expNeeded} XP`}>
              <div className="gh-level__core">{level}</div>
            </div>
          </div>
        </header>

        

        <div className="gh-scene" key={sceneKey}>
          {gameTab === "play" && view === "lobby" && (
            <div className="gh-world">
              {latestWorldEvent && (
  <WorldEventToast event={latestWorldEvent} />
)}


<ChallengeToasts
  incoming={incoming}
  outgoing={outgoing}
  outcome={outcome}
  respond={respond}
  cancel={cancel}
/>
{selectedWorldPlayer && (
  <PlayerCard
    player={selectedWorldPlayer}
    meId={user.id}
    catalog={auraItems}
    muted={isMuted(selectedWorldPlayer.userId)}
    challengePending={
      outgoing?.toId === selectedWorldPlayer.userId
    }
    onClose={() => setSelectedWorldPlayer(null)}
    onChallenge={(player) => {
      challenge(player);
    }}
    onToggleMute={toggleMute}
    onReport={report}
  />
)}

              <div className="gh-world__atmosphere" aria-hidden>
                <span className="gh-world__mist gh-world__mist--1" />
                <span className="gh-world__mist gh-world__mist--2" />
                <span className="gh-world__spot gh-world__spot--1" />
                <span className="gh-world__spot gh-world__spot--2" />
                <span className="gh-world__grain" />
              </div>

              <div className="gh-world__lights" aria-hidden="true">

  <div className="gh-world__light gh-world__light--left">
    <div className="gh-world__light-bloom" />
    <div className="gh-world__light-flare" />
    <div className="gh-world__light-beam" />
  </div>

  <div className="gh-world__light gh-world__light--right">
    <div className="gh-world__light-bloom" />
    <div className="gh-world__light-flare" />
    <div className="gh-world__light-beam" />
  </div>

</div>

              

              <div className="gh-world__players" aria-label="Jugadores conectados">
                <span className="gh-world__players-label">
    <i aria-hidden />
    JUGADORES EN LÍNEA · {lobbyPlayers.filter(p => p.userId !== user.id).length}
  </span>

                {lobbyPlayers
  .filter((player) => player.userId !== user.id)
  .slice(0, 6)
  .map((player, index) => (
    <WorldPlayer
      key={player.userId}
      player={player}
      index={index}
      isMe={false}
      catalog={auraItems}
      onSelect={setSelectedWorldPlayer}
    />
  ))}

                {lobbyPlayers.length === 0 && (
                  <div className="gh-world__empty-player">
                    <span>+</span>
                    <strong>ESPERANDO JUGADORES</strong>
                    <small>El próximo jugador aparecerá acá.</small>
                  </div>
                )}
              </div>

              <div className="gh-world__chat">
                <LobbyChat
  room="global"
  meId={user.id}
  meName={user.username || "Jugador"}
  players={lobbyPlayers}
  status={lobbyStatus}
  catalog={auraItems}
  npcCtx={npcCtx}
  realOthers={realOthers}
  events={events}
  mutedIds={muted}
/>
              </div>
               <div className="gh-locker-zone">
    <LockerPreview
      userId={user.id}
      level={level}
      onOpenInventory={() => {
        setGameTab("deck");
      }}
    />
  </div>

              <div className="gh-world__mission">
                <span className="gh-world__mission-kicker">PRÓXIMO OBJETIVO</span>
                <strong>¡A POR LA VICTORIA!</strong>
                <span>Ganando partidos llegás a {nextLeague}.</span>
              </div>

              <button className="gh-world__play" type="button" onClick={() => handleGameNavigate("campaign")}>
                <span className="gh-world__play-icon" aria-hidden>⚡</span>
                <span>
                  <small>LISTO PARA JUGAR</small>
                  <strong>JUGAR PARTIDO</strong>
                </span>
                <span className="gh-world__play-arrow" aria-hidden>→</span>
              </button>

              <div className="gh-world__actions" aria-label="Acciones rápidas">
                <button type="button" onClick={() => setShowPackModal(true)}>
                  <span>🧧</span>
                  <strong>PACK</strong>
                  {packCount > 0 && <em>{packCount}</em>}
                </button>
                <button type="button" onClick={() => handleGameNavigate("deck")}>
                  <span>👕</span>
                  <strong>EQUIPO</strong>
                </button>
                <button type="button" onClick={() => handleGameNavigate("album")}>
                  <span>▦</span>
                  <strong>ÁLBUM</strong>
                </button>
              </div>

              <div className="gh-world__hint">
                <span>TIP</span>
                <p>Hablá con otros jugadores. Los NPC también pueden ayudarte a descubrir el juego.</p>
              </div>

              <div className="gh-world__dock">
                <button className="is-active" type="button" onClick={() => setView("lobby")}>
                  <span>⚽</span><strong>LOBBY</strong>
                </button>
                <button
    type="button"
    onClick={() => setShowPackModal(true)}
  >
    <span>🎁</span>
    <strong>PACK</strong>

    {packCount > 0 && (
      <em>{packCount}</em>
    )}
  </button>
                <button type="button" onClick={() => handleGameNavigate("deck")}>
                  <span>👕</span><strong>EQUIPO</strong>
                </button>
                <button type="button" onClick={() => handleGameNavigate("album")}>
                  <span>▦</span><strong>ÁLBUM</strong>
                </button>
              </div>
            </div>
          )}

          {gameTab === "play" && view === "match" && (
            <section className="gh-match">
              <div className="gh-match__bar">
                <button className="gh-ghost" onClick={() => setView("lobby")}><span aria-hidden>‹</span> Lobby</button>
                <div className="gh-seg" role="radiogroup" aria-label="Modo de partido">
                  <button role="radio" aria-checked={battleMode === "quick"} className={battleMode === "quick" ? "is-active" : ""} onClick={() => setBattleMode("quick")}>
                    <span aria-hidden>⚡</span> Partido rápido
                  </button>
                  <button role="radio" aria-checked={battleMode === "campaign"} className={battleMode === "campaign" ? "is-active" : ""} onClick={() => setBattleMode("campaign")}>
                    <span aria-hidden>🏆</span> Modo historia
                  </button>
                </div>
              </div>

              <div className="gh-panel">
                {battleMode === "quick" ? (
                  <CardBattle userCards={userCards} userDeck={activeDeck} userId={user.id} onBattleComplete={onBattleComplete} onNavigateToDeck={() => setGameTab("deck")} />
                ) : (
                  <CampaignMode userCards={userCards} userDeck={activeDeck} userId={user.id} onBattleComplete={onBattleComplete} onNavigateToDeck={() => setGameTab("deck")} />
                )}
              </div>
            </section>
          )}

          {gameTab === "deck" && (
            <section className="gh-panel gh-panel--bare">
              <DeckBuilder userId={user.id} userCards={userCards} activeDeck={activeDeck} onDeckUpdate={setActiveDeck} />
            </section>
          )}

          {gameTab === "album" && (
            <section className="gh-panel">
              <CardAlbum userId={user.id} />
            </section>
          )}
        </div>
      </div>

      <PackModal
        isOpen={showPackModal}
        onClose={() => setShowPackModal(false)}
        userId={user.id}
        onCardReceived={() => {
          loadUserCards();
          loadActiveDeck();
        }}
      />
    </div>
  );
}
