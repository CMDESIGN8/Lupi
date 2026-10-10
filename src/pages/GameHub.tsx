    // src/pages/GameHub.tsx
    import { useEffect, useMemo, useRef, useState } from "react";
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
import { ChallengeGameSelector } from "../components/ChallengeGameSelector";
import { RockPaperScissors } from "../components/RockPaperScissors";
import { DuelVersus } from "../components/DuelVersus";
    import { LockerPreview } from "../components/LockerPreview";
    import {
      useWorldEvents,
      type WorldEvent,
    } from "../hooks/useWorldEvents";
    import "./GameHub.css";
    import "./GameHubLobby.css";
    import "./LupiWorld_Theme.css";
    import {
      useLobbyChallenges,
      type Challenge,
      type ChallengeOutcome,
  type ChallengeGame,
    } from "../hooks/useLobbyChallenges";

    import { useLobbyModeration } from "../hooks/useLobbyModeration";
    import {
      PlayerCard,
      DuelSummary,
    } from "../components/PlayerCard";
    import { LobbyDailyMission } from "../components/LobbyDailyMission";
    import { useDailyMissions } from "../hooks/useDailyMissions";
    import { processUserAction } from "../services/progressionService";
    import {
  ChallengeToasts,
  type DailyChallengeToast,
} from "../components/PlayerCard";
import { AchievementsModal } from "../components/AchievementsModal";
import { useAchievements } from "../hooks/useAchievements";

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
      className={`gh-world-player ${isMe ? "is-me" : ""}`}
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
      const [dailyChallengeToasts, setDailyChallengeToasts] = useState<DailyChallengeToast[]>([]);
  const [challengeTarget, setChallengeTarget] = useState<LobbyPlayer | null>(null);
  const [activeRps, setActiveRps] = useState<Challenge | null>(null);
  const [versusChallenge, setVersusChallenge] = useState<Challenge | null>(null);
  const versusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (versusTimerRef.current) clearTimeout(versusTimerRef.current);
  }, []);

      const { data: heroData } = useUserHeroData(user.id);
      const [showAchievements, setShowAchievements] = useState(false);
      const { data: userDivision, loading: divisionLoading } = useUserDivision(user.id);
      const { count: packCount } = usePacksCount(user.id);
      const {
  currentDay,
  lobbyMission,
  claimReward,
  startMission,
  updateMissionProgress,
} = useDailyMissions(user.id);

const {
  unlockedAchievements,
  allAchievements,
  getProgress,
} = useAchievements(user);

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
        console.log("DUEL ACCEPTED", { challengeData, role });
        if (versusTimerRef.current) clearTimeout(versusTimerRef.current);
        setVersusChallenge(challengeData);
        versusTimerRef.current = setTimeout(() => {
          setVersusChallenge(null);
          versusTimerRef.current = null;
          setGameTab("play");
          if (challengeData.gameType === "rps") {
            setView("lobby");
            setActiveRps(challengeData);
          } else if (challengeData.gameType === "futsal") {
            setBattleMode("quick");
            setView("match");
            window.scrollTo({ top: 0 });
          }
        }, 2200);
      },
    });

    const handleLobbyChallenge = (
  target: { userId: string; username: string },
  botIndex = 1,
  gameType: ChallengeGame = "futsal"
) => {
  const sent = challenge(target, botIndex, gameType);

  if (!sent) {
    return;
  }

  // La misión cuenta cuando el desafío fue enviado correctamente.
  updateMissionProgress("challenge");
};

      const realOthers = lobbyPlayers.filter((p) => p.userId !== user.id).length;
      const [showPlayersSheet, setShowPlayersSheet] = useState(false);
    
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

      const handleDailyChallengesUpdated = (
  challenges: {
    challenge_id: string;
    progress: number;
    requirement: number;
    completed: boolean;
  }[]
) => {
  console.log("🏆 GAMEHUB RECIBIÓ:", challenges);

  const completed = challenges.filter(
    (challenge) => challenge.completed
  );

  console.log("🏆 COMPLETADOS:", completed);

  if (completed.length === 0) {
    console.log("🏆 NO HAY COMPLETADOS");
    return;
  }

  const titles: Record<string, string> = {
    win3: "3 VICTORIAS",
    score5: "5 GOLES",
    beat_legend: "VENCER A LA LEYENDA",
  };

  const newToasts: DailyChallengeToast[] =
    completed.map((challenge) => ({
      id: `${challenge.challenge_id}-${Date.now()}`,
      title:
        titles[challenge.challenge_id] ??
        challenge.challenge_id,
      progress: challenge.progress,
      requirement: challenge.requirement,
      rewardXp: 50,
    }));

  console.log("🏆 CREANDO TOASTS:", newToasts);

  setDailyChallengeToasts(newToasts);
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

      const handleLobbyMissionStart = async (mission: Parameters<typeof startMission>[0]) => {
  switch (mission.type) {
    case "play_match":
      openMatch("quick");
      break;

    case "open_pack":
      setShowPackModal(true);
      break;

    default:
      await startMission(mission);
      break;
  }
};

const handleLobbyMissionClaim = async (missionId: string) => {
  const mission = lobbyMission?.id === missionId
    ? lobbyMission
    : null;

  if (!mission) return;

  try {
    const result = await processUserAction({
      userId: user.id,
      actionType: "mission",
      actionValue: mission.reward.xp,
      referenceId: mission.id,
      metadata: {
        missionId: mission.id,
        missionTitle: mission.title,
        xp: mission.reward.xp,
        coins: mission.reward.coins ?? 0,
        points: mission.reward.points ?? 0,
      },
    });

    console.log("🎁 RECOMPENSA ACREDITADA", {
  result,
  mission: {
    id: mission.id,
    title: mission.title,
    xp: mission.reward.xp,
    coins: mission.reward.coins ?? 0,
    points: mission.reward.points ?? 0,
  },
});

    await claimReward(missionId);

  } catch (error) {
    console.error(
      "❌ Error acreditando recompensa:",
      error
    );
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
  <button className="gh-back" onClick={onBackHome} aria-label="Volver">
    <span aria-hidden>‹</span> LUPI WORLD
  </button>

  <div className="gh-brand">
    <strong>LOBBY PRINCIPAL</strong>
    <span className="gh-brand__player">
      {user.username || "Jugador"}
    </span>
  </div>

  <div className="gh-hud__right">
    {/* Puntos */}
    <div className="gh-wallet">
      <span className="gh-wallet__icon" aria-hidden>⭐</span>
      <strong>{user.points ?? 0}</strong>
    </div>

    {/* Monedas */}
    <div className="gh-wallet gh-wallet--coins">
      <span className="gh-wallet__icon" aria-hidden>💰</span>
      <strong>{user.coins ?? 0}</strong>
    </div>

    {/* Nivel con XP circular */}
    <div
      className="gh-level"
      style={{ ["--xp" as string]: xpPct }}
      title={`Nivel ${level} · ${exp}/${expNeeded} XP`}
    >
      <div className="gh-level__core">{level}</div>
    </div>
  </div>
</header>

            

            <div className="gh-scene" key={sceneKey}>
              {challengeTarget && (
  <ChallengeGameSelector
    player={challengeTarget}
    onClose={() => setChallengeTarget(null)}
    onSelect={(game) => {
      handleLobbyChallenge(challengeTarget, 1, game);
      setChallengeTarget(null);
    }}
  />
)}

  <ChallengeToasts
    incoming={incoming}
    outgoing={outgoing}
    outcome={outcome}
    respond={respond}
    cancel={cancel}
    dailyChallenges={dailyChallengeToasts}
  />
              {gameTab === "play" && view === "lobby" && (
                <div className="gh-world">
                  {latestWorldEvent && (
      <WorldEventToast event={latestWorldEvent} />
    )}


    
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
  setSelectedWorldPlayer(null);
  setChallengeTarget(player);
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
                
                    {lobbyPlayers.filter(p => p.userId !== user.id).length === 0 && (
  <div className="gh-world__empty-player">
    <span>+</span>
    <strong>ESPERANDO JUGADORES</strong>
    <small>El próximo jugador aparecerá acá.</small>
  </div>
)}
                  </div>

                  {showPlayersSheet && (
      <div
        className="gh-world__players-sheet"
        onClick={() => setShowPlayersSheet(false)}
      >
        <div
          className="gh-world__players-sheet-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Jugadores en línea"
        >
          <header className="gh-world__players-sheet-head">
            <div>
              <span className="gh-world__players-sheet-kicker">
                LUPI WORLD
              </span>
              <strong>JUGADORES EN LÍNEA</strong>
            </div>
            <button
              type="button"
              className="gh-world__players-sheet-close"
              onClick={() => setShowPlayersSheet(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </header>

          <div className="gh-world__players-sheet-list">
            {lobbyPlayers
              .filter((p) => p.userId !== user.id)
              .map((player, index) => {
                const skin = getPlayerSkin(player, auraItems);
                const auraColor = skin?.color || "#00ff88";

                return (
                  <button
                    key={player.userId}
                    type="button"
                    className="gh-world__players-sheet-item"
                    onClick={() => {
                      setSelectedWorldPlayer(player);
                      setShowPlayersSheet(false);
                    }}
                    style={
                      {
                        "--aura-color": auraColor,
                        "--aura-color-soft": hexToRgba(auraColor, 0.16),
                        "--aura-color-medium": hexToRgba(auraColor, 0.42),
                      } as React.CSSProperties
                    }
                  >
                    <span className="gh-world__players-sheet-avatar">
                      {skin?.imageUrl ? (
                        <img src={skin.imageUrl} alt="" draggable={false} />
                      ) : (
                        <span aria-hidden>👤</span>
                      )}
                      <i className="gh-world__players-sheet-level">
                        {player.level}
                      </i>
                    </span>

                    <span className="gh-world__players-sheet-info">
                      <strong>{player.username}</strong>
                      <small>
                        <i aria-hidden />
                        {skin?.name || "Sin skin equipada"}
                      </small>
                    </span>

                    <span className="gh-world__players-sheet-arrow">→</span>
                  </button>
                );
              })}

            {lobbyPlayers.filter((p) => p.userId !== user.id).length === 0 && (
              <div className="gh-world__players-sheet-empty">
                <span>+</span>
                <strong>ESPERANDO JUGADORES</strong>
                <small>El próximo jugador aparecerá acá.</small>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

                  <button
      type="button"
      className="gh-world__players-toggle"
      onClick={() => setShowPlayersSheet(true)}
      aria-label="Ver jugadores en línea"
    >
      <span aria-hidden>👥</span>
      <em>{lobbyPlayers.filter(p => p.userId !== user.id).length}</em>
    </button>

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
  onSelectPlayer={(userId) => {
    const player = lobbyPlayers.find(
      (item) => item.userId === userId
    );

    if (player) {
      setSelectedWorldPlayer(player);
    }
  }}
  mutedIds={muted}
  onMessageSent={() => {
    updateMissionProgress("chat");
  }}
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

                  <LobbyDailyMission
  mission={lobbyMission}
  currentDay={currentDay}
  onClaimReward={handleLobbyMissionClaim}
  onStartMission={handleLobbyMissionStart}
/>

                  <button className="gh-world__play" type="button" onClick={() => handleGameNavigate("campaign")}>
                    <span className="gh-world__play-icon" aria-hidden>⚡</span>
                    <span>
                      <small>LISTO PARA JUGAR</small>
                      <strong>JUGAR PARTIDO</strong>
                    </span>
                    <span className="gh-world__play-arrow" aria-hidden>→</span>
                  </button>

                  <div className="gh-world__actions" aria-label="Acciones rápidas">

                        <button
                          type="button"
                          
                          onClick={() => setShowAchievements(true)}
                        >
                          <span>🏆</span>

                          <strong>
                            LOGROS
                          </strong>

                          {unlockedAchievements.length > 0 && (
                            <span className="gh-hud-achievements-count">
                              {unlockedAchievements.length}
                            </span>
                          )}
                        </button> 
                                            
                        <button
                          type="button"
                          onClick={() => {
                            setShowPackModal(true);
                            updateMissionProgress("open_pack");
                          }}
                        >
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
                      onClick={() => setShowAchievements(true)}
                    >
                      <span>🏆</span>
                      <strong>LOGROS</strong>
                      {unlockedAchievements.length > 0 && (
                        <em>{unlockedAchievements.length}</em>
                      )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          setShowPackModal(true);
                          updateMissionProgress("open_pack");
                        }}
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
                      <CardBattle
  userCards={userCards}
  userDeck={activeDeck}
  userId={user.id}
  onBattleComplete={onBattleComplete}
  onNavigateToDeck={() => setGameTab("deck")}
  onDailyChallengesUpdated={handleDailyChallengesUpdated}
  isCampaignMode={true}
  forcedOpponent={{
    name: "Bot Novato",
    overall_rating: 55,
    category: "8va",
    level: 1,
    avatar: "🥉",
    color: "#7a7a9a",
    xpBase: 10,
    reqWins: 0,
  }}
  onCampaignMatchComplete={() => {
    updateMissionProgress("play_match");
    setView("lobby");
  }}
/>
                    ) : (
                      <CampaignMode
  userCards={userCards}
  userDeck={activeDeck}
  userId={user.id}
  onBattleComplete={onBattleComplete}
  onNavigateToDeck={() => setGameTab("deck")}
  onDailyChallengesUpdated={
    handleDailyChallengesUpdated
  }
/>
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
          {activeRps && (
            <div className="rps-screen-overlay">
              <RockPaperScissors
                challenge={activeRps}
                meId={user.id}
                onExit={() => setActiveRps(null)}
              />
            </div>
          )}
          {versusChallenge && (
            <DuelVersus challenge={versusChallenge} meId={user.id} />
          )}
          {showAchievements && (
  <AchievementsModal
    unlocked={unlockedAchievements}
    allAchievements={allAchievements}
    getProgress={getProgress}
    onClose={() => setShowAchievements(false)}
  />
)}
        </div>
      );
    }
