import { AvatarEditor } from "../components/AvatarEditor";
import { useAvatarAppearance } from "../hooks/useAvatarAppearance";
    // src/pages/GameHub.tsx
    import { useEffect, useMemo, useRef, useState } from "react";
    import { AppUser } from "../lib/api";
    import { UserCard, Deck } from "../types/cards";
    import { CardBattle } from "../components/CardBattle";
    // Campaña pausada: import retirado temporalmente.
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
    import "./LupiFirstWelcome.css";
     import "./LupiFirstWelcomeAAA.css";
     import "./LupiFirstWelcomeHost.css";
     import "./LupiFirstWelcomeAnime.css";
import "./LupiRewardAnime.css";
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
import { useLupiRecommendation, type LupiAction } from "../hooks/useLupiRecommendation";
import { useFirstAdventure, type AdventureStep } from "../hooks/useFirstAdventure";
    import { processUserAction } from "../services/progressionService";
import { FIRST_REWARDS, getClaimedFirstRewards, claimFirstReward, type RewardKey } from "../services/firstAdventureRewards";
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
      debutRequested?: boolean;
      onMatchRecorded?: () => void;
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
      debutRequested = false,
      onMatchRecorded,
    }: Props) {
      const [view, setView] = useState<"lobby" | "match">("lobby");
      const [debutWaiting, setDebutWaiting] = useState(false);
      const [battleMode, setBattleMode] = useState<BattleMode>("quick");
      // Sprint 06: nunca iniciar automáticamente un partido para cuentas nuevas.
      // El partido se habilita como objetivo 7, después del equipo.
      const [showPackModal, setShowPackModal] = useState(false);
      const [equipGuideRequest, setEquipGuideRequest] = useState(0);
      const [selectedWorldPlayer, setSelectedWorldPlayer] =
      useState<LobbyPlayer | null>(null);
      const [dailyChallengeToasts, setDailyChallengeToasts] = useState<DailyChallengeToast[]>([]);
      // Los logros se muestran una sola vez por sesión y desaparecen automáticamente.
      const announcedChallengesRef = useRef<Set<string>>(new Set());
      useEffect(() => {
        if (dailyChallengeToasts.length === 0) return;
        const timer = window.setTimeout(() => setDailyChallengeToasts([]), 4200);
        return () => window.clearTimeout(timer);
      }, [dailyChallengeToasts]);
  const [challengeTarget, setChallengeTarget] = useState<LobbyPlayer | null>(null);
  const [activeRps, setActiveRps] = useState<Challenge | null>(null);
  const [versusChallenge, setVersusChallenge] = useState<Challenge | null>(null);
  const versusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (versusTimerRef.current) clearTimeout(versusTimerRef.current);
  }, []);

      const { data: heroData, refetch: refreshHeroData } = useUserHeroData(user.id);
      const [showAchievements, setShowAchievements] = useState(false);
      const { data: userDivision, loading: divisionLoading } = useUserDivision(user.id);
      const { count: packCount, refresh: refreshPackCount } = usePacksCount(user.id);
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
      const previousLevelRef = useRef<{ userId: string; level: number } | null>(null);
      const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null);
      useEffect(() => {
        if (!heroData) return;
        const previous = previousLevelRef.current;
        if (previous?.userId === user.id && level > previous.level) {
          setLevelUp({ from: previous.level, to: level });
        }
        previousLevelRef.current = { userId: user.id, level };
      }, [heroData, level, user.id]);


      const { items: auraItems } = useAuraInventory(user.id, level);
      const { appearance: myAppearance } = useAvatarAppearance(user.id);
      const [showAvatarEditor, setShowAvatarEditor] = useState(false);
      const { recommendation: lupiRecommendation, track: trackLupiActivity, dismiss: dismissLupiRecommendation, recordMatchCompleted: recordLupiMatchCompleted } = useLupiRecommendation(user.id, {
        rewardPending: Boolean(lobbyMission?.isCompleted && !lobbyMission?.isClaimed),
        packsAvailable: packCount ?? 0,
        hasDeck: (activeDeck.cards?.length ?? 0) > 0,
        hasEquipped: auraItems.some(item => item.equipped),
      });

      const adventure = useFirstAdventure(user.id);
      const adventureComplete = adventure.complete;
      const [claimedFirst, setClaimedFirst] = useState<RewardKey[]>([]);
      const [rewardBusy, setRewardBusy] = useState(false);
      const [rewardModalPhase, setRewardModalPhase] = useState<"idle" | "open" | "closing">("idle");
      const [rewardModalKey, setRewardModalKey] = useState<RewardKey | null>(null);
      const [highlightNext, setHighlightNext] = useState(false);
      const rewardCardRef = useRef<HTMLElement | null>(null);
      const rewardModalRef = useRef<HTMLDivElement | null>(null);
      const [rewardFlight, setRewardFlight] = useState<React.CSSProperties>({});
      useEffect(() => {
        const refresh = () => refreshHeroData();
        window.addEventListener("lupi:progression-updated", refresh);
        return () => window.removeEventListener("lupi:progression-updated", refresh);
      }, [refreshHeroData]);
      const [rewardError, setRewardError] = useState("");
      const [rewardsLoaded, setRewardsLoaded] = useState(false);
      useEffect(() => {
        let active=true;
        setRewardsLoaded(false);
        getClaimedFirstRewards(user.id).then(keys=>{if(active){setClaimedFirst(keys);setRewardsLoaded(true);}})
          .catch(()=>{if(active){setRewardError("No pudimos consultar tus premios. Reintentá.");setRewardsLoaded(true);}});
        return ()=>{active=false};
      },[user.id]);
      // Bienvenida visual de primer ingreso. No acredita premios ni modifica misiones.
      const [welcomeExiting, setWelcomeExiting] = useState(false);
      const [lupiDialogueStep, setLupiDialogueStep] = useState(0);
      const [lupiDialogueChars, setLupiDialogueChars] = useState(0);
      const lupiDialogueTexts = [
        `¡Por fin llegaste! Soy Lupi. ¡Bienvenido a mi mundo!`,
        `Esos cinco son tu primer quinteto. Capaz hoy no sean leyendas… ¡pero eso lo vamos a cambiar juntos!`,
        `Acá vas a jugar, mejorar y conocer a tu banda. ¿Estás listo para empezar tu historia?`,
      ];
      const lupiDialogueText = lupiDialogueTexts[lupiDialogueStep] ?? lupiDialogueTexts[0];
      const lupiDialogueFinished = lupiDialogueChars >= lupiDialogueText.length;

       const welcomeExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
       useEffect(() => () => { if (welcomeExitTimer.current) clearTimeout(welcomeExitTimer.current); }, []);
       const [welcomeDismissed, setWelcomeDismissed] = useState(() =>
        typeof window !== "undefined" && localStorage.getItem(`lupi_world_intro_v1_${user.id}`) === "1"
      );
      const showFirstWelcome = adventure.ready && rewardsLoaded && !welcomeDismissed &&
        !claimedFirst.includes("welcome") && gameTab === "play" && view === "lobby";
      useEffect(() => {
        setLupiDialogueChars(0);
        if (!showFirstWelcome) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setLupiDialogueChars(lupiDialogueText.length);
          return;
        }
        const interval = window.setInterval(() => {
          setLupiDialogueChars(n => Math.min(n + 2, lupiDialogueText.length));
        }, 34);
        return () => window.clearInterval(interval);
      }, [lupiDialogueStep, showFirstWelcome]);
      const dismissFirstWelcome = () => {
        if (welcomeExiting) return;
        setWelcomeExiting(true);
        if (welcomeExitTimer.current) clearTimeout(welcomeExitTimer.current);
        welcomeExitTimer.current = setTimeout(() => {
          localStorage.setItem(`lupi_world_intro_v1_${user.id}`, "1");
          setWelcomeDismissed(true);
          setWelcomeExiting(false);
          welcomeExitTimer.current = null;
        }, 650);
      };
      const pendingFirstReward:RewardKey|null = !adventure.ready || !rewardsLoaded ? null :
        !claimedFirst.includes("welcome") ? "welcome" :
        (["equip_avatar","social","open_pack"] as const).find(k=>adventure.progress.completed.includes(k) && !claimedFirst.includes(k)) ?? null;
      const autoOpenedRewardRef = useRef<string | null>(null);
      useEffect(() => {
        if (!pendingFirstReward || rewardModalPhase !== "idle" || levelUp || showFirstWelcome) return;
        const identity = `${user.id}:${pendingFirstReward}`;
        if (autoOpenedRewardRef.current === identity) return;
        autoOpenedRewardRef.current = identity;
        setRewardModalKey(pendingFirstReward);
        setRewardFlight({});
        setRewardModalPhase("open");
      }, [pendingFirstReward, rewardModalPhase, levelUp, user.id, showFirstWelcome]);
      const claimAdventureReward = async () => {
        if(!pendingFirstReward || rewardBusy)return;
        setRewardBusy(true);setRewardError("");
        try {
          await claimFirstReward(pendingFirstReward);
          setClaimedFirst(prev=>prev.includes(pendingFirstReward)?prev:[...prev,pendingFirstReward]);
          refreshHeroData();
          const from = rewardModalRef.current?.getBoundingClientRect();
          const to = rewardCardRef.current?.getBoundingClientRect();
          if (from && to) {
            setRewardFlight({
              "--reward-dx": `${to.left + to.width/2 - (from.left + from.width/2)}px`,
              "--reward-dy": `${to.top + to.height/2 - (from.top + from.height/2)}px`,
              "--reward-scale": String(Math.min(.7, to.width/from.width))
            } as React.CSSProperties);
          }
          setRewardModalPhase("closing");
          window.setTimeout(() => { setRewardModalPhase("idle");setRewardModalKey(null);setHighlightNext(true);window.setTimeout(()=>setHighlightNext(false),1100); }, 620);
        } catch(e) {setRewardError(e instanceof Error?e.message:"No pudimos acreditar la recompensa.");}
        finally {setRewardBusy(false);}
      };

      useEffect(() => {
        if (!adventure.ready) return;
        // El perfil creado se reconoce por nombre existente; no se asignan recompensas.
        if (user.username?.trim()) adventureComplete("create_avatar");
        adventureComplete("enter_world");
      }, [adventure.ready, adventureComplete, user.username]);
      useEffect(() => {
        if (adventure.ready && auraItems.some(item => item.equipped)) adventureComplete("equip_avatar");
      }, [adventure.ready, auraItems, adventureComplete]);
      useEffect(() => {
        if (adventure.ready && (activeDeck.cards?.length ?? 0) >= 5) adventureComplete("build_team");
      }, [adventure.ready, activeDeck.cards, adventureComplete]);
      // LockerPreview mantiene otra instancia de useAuraInventory: sincronizar por evento.
      useEffect(() => {
        const onInventoryUpdated = (event: Event) => {
          const detail = (event as CustomEvent<{userId?: string; equipped?: boolean}>).detail;
          if (detail?.userId !== user.id) return;
          if (detail.equipped && adventure.ready) adventureComplete("equip_avatar");
        };
        window.addEventListener("lupi:inventory-updated", onInventoryUpdated);
        return () => window.removeEventListener("lupi:inventory-updated", onInventoryUpdated);
      }, [user.id, adventure.ready, adventureComplete]);
      // Los pasos de pack, chat y partido se confirman en sus callbacks de éxito.
      const adventureCopy: Record<AdventureStep, { title: string; description: string; button: string }> = {
        create_avatar: {title:"Creá tu identidad",description:"Elegí cómo te van a conocer en el mundo.",button:"VER PERFIL"},
        enter_world: {title:"Entrá a tu mundo",description:"Conocé el vestuario y a Lupi.",button:"EXPLORAR"},
        equip_avatar: {title:"Dale estilo a tu personaje",description:"Tocá PERSONALIZAR, elegí una prenda y presioná EQUIPAR.",button:"PERSONALIZAR"},
        social: {title:"Saludá a la comunidad",description:"Mandá tu primer saludo en el chat para completar el desafío.",button:"VER SOCIAL"},
        open_pack: {title:"Descubrí tus primeras cartas",description:"Abrí un pack disponible en tu cuenta.",button:"ABRIR PACK"},
        build_team: {title:"Armá tu equipo",description:"Prepará cinco jugadores para tu primer partido.",button:"VER EQUIPO"},
        first_match: {title:"Tu primer partido",description:"Jugá un encuentro rápido y descubrí la Arena.",button:"JUGAR"},
        explore: {title:"Descubrí Lupi World",description:"Explorá las experiencias de tu mundo.",button:"EXPLORAR"}
      };
      const adventureAction = (step: AdventureStep) => {
        switch(step) {
          case "create_avatar": onNavigate("profile"); break;
          case "enter_world": adventureComplete("enter_world"); break;
          case "equip_avatar": {
            setEquipGuideRequest(n => n + 1);
            break;
          }
          case "social": {
            setShowSocialChat(true);
            window.setTimeout(() => document.querySelector<HTMLInputElement>(".gh-world__chat .lc-composer input")?.focus(), 80);
            break;
          }
          case "open_pack": setShowPackModal(true); break;
          case "build_team": handleGameNavigate("deck"); break;
          case "first_match": handleGameNavigate("battle"); break;
          case "explore": setShowExploreWorld(true); adventureComplete("explore"); break;
        }
      };
      const look = useMemo(() => {
        const l: LobbyLook = {};
        auraItems.forEach((i) => {
          if (i.equipped) l[i.slot] = i.id;
        });
        return l;
      }, [auraItems]);

      const { players: lobbyPlayers, status: lobbyStatus } = useLobbyPresence({
      room: "global",
      activity: view === "match" ? "in-match" : "lobby",
      me: {
        userId: user.id,
        username: user.username,
        club: user.club ?? null,
        level,
        look,
        appearance: myAppearance,
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
      // Priorizar jugadores disponibles sin alterar la presencia ni el flujo de desafíos.
      const otherOnlinePlayers = lobbyPlayers
        .filter((player) => player.userId !== user.id)
        .sort((a, b) => Number(b.activity === "lobby") - Number(a.activity === "lobby"));
      const [showPlayersSheet, setShowPlayersSheet] = useState(false);
      const [showSocialChat, setShowSocialChat] = useState(false);
      const [showExploreWorld, setShowExploreWorld] = useState(false);
    
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
  const completed = challenges.filter((challenge) => challenge.completed);
  const titles: Record<string, string> = {
    win3: "3 VICTORIAS",
    score5: "5 GOLES",
    beat_legend: "VENCER A LA LEYENDA",
  };
  const newToasts: DailyChallengeToast[] = completed
    .filter((challenge) => !announcedChallengesRef.current.has(challenge.challenge_id))
    .map((challenge) => {
      announcedChallengesRef.current.add(challenge.challenge_id);
      return {
        id: challenge.challenge_id,
        title: titles[challenge.challenge_id] ?? challenge.challenge_id,
        progress: challenge.progress,
        requirement: challenge.requirement,
        rewardXp: 50,
      };
    });
  if (newToasts.length > 0) setDailyChallengeToasts(newToasts);
};

      const openMatch = (mode: BattleMode) => {
        trackLupiActivity("play");
        setBattleMode(mode);
        if (gameTab !== "play") setGameTab("play");
        setView("match");
        window.scrollTo({ top: 0 });
      };
      


      const handleGameNavigate = (target: string) => {
        switch (target) {
          case "campaign":
            openMatch("quick"); // campaña en pausa
            break;
          case "battle":
          case "play":
            openMatch("quick");
            break;
          case "deck":
            trackLupiActivity("deck");
            setGameTab("deck");
            break;
          case "album":
            trackLupiActivity("album");
            setGameTab("album");
            break;
          default:
            onNavigate(target);
        }
      };

      const runLupiRecommendation = (action: LupiAction) => {
        switch (action) {
          case "claim":
            if (lobbyMission?.isCompleted && !lobbyMission.isClaimed) {
              void handleLobbyMissionClaim(lobbyMission.id);
            }
            break;
          case "play": handleGameNavigate("battle"); break;
          case "deck": handleGameNavigate("deck"); break;
          case "album": handleGameNavigate("album"); break;
          case "pack": trackLupiActivity("pack"); setShowPackModal(true); break;
          case "achievements": trackLupiActivity("achievements"); setShowAchievements(true); break;
          case "social": trackLupiActivity("social"); setShowExploreWorld(true); break;
          case "explore": trackLupiActivity("explore"); setShowExploreWorld(true); break;
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
        <>
        {showAvatarEditor && <AvatarEditor userId={user.id} onClose={() => setShowAvatarEditor(false)} />}
        <div className={`main-content gh-root ${gameTab === "play" && view === "match" ? "gh-root--playing" : ""}`}>
          {showFirstWelcome && (
            <div className={`lupi-first-welcome lupi-anime-intro${welcomeExiting ? " is-exiting" : ""}`} role="presentation">
              <section className="lupi-anime-intro__scene" role="dialog" aria-modal="true" aria-labelledby="lupi-anime-title">
                <div className="lupi-anime-intro__art" aria-hidden="true">
                  <div className="lupi-anime-intro__speedlines" />
                  <img src="/images/lupi-welcome.png" alt="" draggable={false} />
                </div>
                <div className="lupi-anime-intro__hud" aria-hidden="true">
                  <span>EPISODIO 01</span><strong>EL COMIENZO DE TU HISTORIA</strong>
                </div>
                <div className="lupi-anime-intro__dialogue" key={lupiDialogueStep}>
                  <div className="lupi-anime-intro__speaker">LUPI <span>✦</span></div>
                  <div className="lupi-anime-intro__lines" aria-live="polite">
                    {lupiDialogueStep === 0 && <><h2 id="lupi-anime-title">¡EY, {user.username || "CRACK"}!</h2></>}
                    {lupiDialogueStep === 1 && <><h2 id="lupi-anime-title">¡YA TENÉS TU EQUIPO!</h2></>}
                    {lupiDialogueStep === 2 && <><h2 id="lupi-anime-title">¡LA CANCHA NOS ESPERA!</h2></>}
                    <p className="lupi-anime-intro__typed">{lupiDialogueText.slice(0, lupiDialogueChars)}<span className="lupi-anime-intro__cursor" aria-hidden="true">▍</span></p>
                  </div>
                  <div className="lupi-anime-intro__bottom">
                    <span className="lupi-anime-intro__progress">{lupiDialogueStep + 1} / 3</span>
                    <button type="button" autoFocus disabled={welcomeExiting} onClick={() => { if (!lupiDialogueFinished) { setLupiDialogueChars(lupiDialogueText.length); return; } lupiDialogueStep < 2 ? setLupiDialogueStep((step) => step + 1) : dismissFirstWelcome(); }}>
                      {!lupiDialogueFinished ? "CONTINUAR" : lupiDialogueStep < 2 ? "SIGUIENTE" : "¡VAMOS, LUPI!"} <span aria-hidden="true">▶</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
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

          <div className={`gh-shell ${(gameTab === "play" && view === "lobby") || gameTab === "deck" ? "gh-shell--wide" : ""} ${gameTab === "deck" || view === "match" ? "gh-shell--compact-hud" : ""}`}>
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
    onDismissDaily={(id) => setDailyChallengeToasts((prev) => prev.filter((item) => item.id !== id))}
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
onChallengeGame={(player, game) => {
  handleLobbyChallenge(player, 1, game);
  setSelectedWorldPlayer(null);
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

                  {showSocialChat && <div className="gh-world__tutorial-backdrop" onClick={() => setShowSocialChat(false)} aria-hidden="true" />}
                  <div className={`gh-world__chat ${showSocialChat ? "gh-world__chat--tutorial-open" : ""}`}>
                    {showSocialChat && adventure.next === "social" && <div className="gh-world__chat-coach" role="status"><span>✦ MISIÓN 4 DE 8</span><strong>Tu primera conexión</strong><p>Escribí un saludo y tocá enviar. Por ejemplo: «¡Hola! Soy nuevo por acá 👋».</p><small>Al enviarlo, completás este paso de la aventura.</small></div>}
                    {showSocialChat && <button type="button" className="gh-world__chat-tutorial-close" aria-label="Cerrar chat" onClick={() => setShowSocialChat(false)}>✕ CERRAR</button>}
                    <LobbyChat
  tutorialOpen={showSocialChat}
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
    adventureComplete("social");
    setShowSocialChat(false);
  }}
/>
                  </div>
                  <div className="gh-locker-zone">
        <button type="button" onClick={() => setShowAvatarEditor(true)} className="gh-avatar-customize-trigger" style={{width:"100%",marginBottom:8,background:"#173e30",color:"#e4cf72",border:"1px solid #8d793c",borderRadius:8,padding:"9px",cursor:"pointer",fontWeight:800}}>✦ PERSONALIZAR MI PERSONAJE</button>
        <LockerPreview
          userId={user.id}
          level={level}
          onboardingEquipRequest={equipGuideRequest}
          onboardingActive={adventure.ready && adventure.next === "equip_avatar"}
          onOpenInventory={() => {
            setGameTab("deck");
          }}
        />
      </div>

                  {levelUp && (
                    <div className="gh-world__levelup-overlay" role="presentation">
                      <div className="gh-world__levelup-dialog" role="dialog" aria-modal="true" aria-labelledby="lupi-levelup-title">
                        <span>✦ LUPI WORLD · PROGRESIÓN ✦</span>
                        <div className="gh-world__levelup-crown">👑</div>
                        <h2 id="lupi-levelup-title">¡LEVEL UP!</h2>
                        <div className="gh-world__levelup-numbers"><b>{levelUp.from}</b><strong>➜</strong><b>{levelUp.to}</b></div>
                        <h3>¡SUBISTE DE NIVEL!</h3>
                        <p>Tu jugador sigue creciendo. ¡Seguí sumando XP!</p>
                        <button type="button" autoFocus onClick={() => setLevelUp(null)}>CONTINUAR →</button>
                      </div>
                    </div>
                  )}
                  {rewardModalPhase !== "idle" && rewardModalKey && (
                    <div className={`gh-world__reward-overlay ${rewardModalPhase === "closing" ? "gh-world__reward-overlay--closing" : ""}`} role="presentation">
                      <div ref={rewardModalRef} style={rewardFlight} className="gh-world__reward-dialog lupi-reward-anime" role="dialog" aria-modal="true" aria-labelledby="lupi-reward-title">
                        <div className="lupi-reward-anime__chapter">EPISODIO 01 <span>✦</span> TU PRIMERA RECOMPENSA</div>
                        <img className="lupi-reward-anime__mascot" src="/images/lupi-welcome.png" alt="Lupi te entrega tu recompensa" draggable={false} />
                        <div className="lupi-reward-anime__body">
                          <div className="lupi-reward-anime__speaker">LUPI <span>✦</span></div>
                          <h2 id="lupi-reward-title">{rewardModalKey === "welcome" ? "¡ESTO RECIÉN EMPIEZA!" : FIRST_REWARDS[rewardModalKey].title}</h2>
                          <p>{rewardModalKey === "welcome" ? "¡Bien ahí, crack! Todo jugador necesita un primer impulso. Te traje algo para arrancar tu aventura." : "¡Otra misión superada! Tu esfuerzo merece una recompensa. ¡Seguí así!"}</p>
                          <div className="lupi-reward-anime__loot" aria-label="Premios disponibles">
                            <span><i aria-hidden="true">🪙</i><b>+{FIRST_REWARDS[rewardModalKey].coins}</b><small>LUPI COINS</small></span>
                            <span><i aria-hidden="true">✦</i><b>+{FIRST_REWARDS[rewardModalKey].xp}</b><small>EXPERIENCIA</small></span>
                          </div>
                          {rewardError && <p className="lupi-reward-anime__error" role="alert">{rewardError}</p>}
                          <button type="button" autoFocus disabled={rewardBusy || rewardModalPhase === "closing"} onClick={() => void claimAdventureReward()}>{rewardBusy ? "ACREDITANDO…" : "¡RECIBIR MI RECOMPENSA!"} <span aria-hidden="true">▶</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                  <aside className="gh-world__left-rail" aria-label="Lupi y comunidad">
                  <section ref={rewardCardRef} className={`gh-world__next ${highlightNext ? "gh-world__next--highlight" : ""}`} aria-label="Recomendación personalizada de Lupi">
                    {pendingFirstReward ? (
                      <>
                        <span className="gh-world__next-kicker">✦ LUPI WORLD · PREMIO DESBLOQUEADO</span>
                        <strong>{FIRST_REWARDS[pendingFirstReward].title}</strong>
                        <p>💰 +{FIRST_REWARDS[pendingFirstReward].coins} Lupi Coins · ✨ +{FIRST_REWARDS[pendingFirstReward].xp} XP</p>
                        <button type="button" disabled={rewardBusy} onClick={() => {setRewardModalKey(pendingFirstReward);setRewardModalPhase("open");}}>
                          {rewardBusy ? "ACREDITANDO…" : "🎁 RECLAMAR RECOMPENSA →"}
                        </button>
                        {rewardError && <small role="alert">{rewardError}</small>}
                      </>
                    ) : lobbyMission?.isCompleted && !lobbyMission?.isClaimed ? (
                      <>
                        <span className="gh-world__next-kicker">✦ LUPI TE ACOMPAÑA · RECOMPENSA PENDIENTE</span>
                        <strong>¡Tu recompensa está lista!</strong>
                        <p>Completaste un desafío. Reclamá tu premio antes de continuar tu aventura.</p>
                        <button type="button" onClick={() => void handleLobbyMissionClaim(lobbyMission.id)}>⚡ RECLAMAR →</button>
                      </>
                    ) : adventure.ready && !adventure.finished && adventure.next ? (
                      <>
                        <span className="gh-world__next-kicker">✦ TU PRIMERA AVENTURA · {adventure.progress.completed.length}/8</span>
                        <strong>{adventureCopy[adventure.next].title}</strong>
                        <p>{adventureCopy[adventure.next].description}</p>
                        <button type="button" onClick={() => adventureAction(adventure.next!)}>
                          ⚡ {adventureCopy[adventure.next].button} →
                        </button>
                        {adventure.next === "social" && <button className="gh-world__next-secondary" type="button" onClick={adventure.skipSocial}>Ahora no · Continuar aventura</button>}
                        {adventure.next === "open_pack" && (packCount ?? 0) === 0 && <small>Si no tenés packs, comprobá tu carta diaria. No se duplican recompensas.</small>}
                      </>
                    ) : (
                      <>
                        <span className="gh-world__next-kicker">✦ LUPI TE ACOMPAÑA · {lupiRecommendation.reason}</span>
                        <strong>{lupiRecommendation.title}</strong>
                        <p>{lupiRecommendation.description}</p>
                        <button type="button" onClick={() => runLupiRecommendation(lupiRecommendation.action)}>
                          ⚡ {lupiRecommendation.button} →
                        </button>
                      </>
                    )}
                    <button className="gh-world__next-secondary" type="button" onClick={() => runLupiRecommendation("explore")}>
                      Prefiero explorar ↗
                    </button>
                    {(adventure.finished || !adventure.ready) && <button className="gh-world__next-secondary" type="button" onClick={() => dismissLupiRecommendation(lupiRecommendation.action)}>
                      Ahora no · Cambiar sugerencia
                    </button>}
                  </section>

                  <section className="gh-world__players gh-online" aria-label="Jugadores conectados">
                    <div className="gh-online__header">
                      <span className="gh-online__title"><i aria-hidden="true" /> JUGADORES EN LÍNEA</span>
                      <span className="gh-online__count">{lobbyStatus === "offline" ? "SIN CONEXIÓN" : `${lobbyPlayers.length} CONECTADOS`}</span>
                    </div>
                    <div className="gh-online__list">
                      <div className="gh-online__self">
                        <span className="gh-online__self-dot" aria-hidden="true" />
                        <span>{lobbyStatus === "online" ? "Vos estás en el lobby" : lobbyStatus === "connecting" ? "Conectando al lobby…" : "Conexión interrumpida"}</span>
                        <span className="gh-online__self-tag">TÚ</span>
                      </div>
                      {otherOnlinePlayers.slice(0, 4).map((player) => {
                        const skin = getPlayerSkin(player, auraItems);
                        const activityLabel = player.activity === "in-match" ? "EN PARTIDA" : "EN LOBBY";
                        return (
                          <button type="button" key={player.userId} className="gh-online__player"
                            onClick={() => setSelectedWorldPlayer(player)}
                            title={player.activity === "lobby" ? `Ver perfil y desafiar a ${player.username}` : `Ver perfil de ${player.username}`}
                            aria-label={`Ver perfil de ${player.username}, nivel ${player.level}, ${activityLabel}`}>
                            <span className="gh-online__avatar">
                              {skin?.imageUrl ? <img src={skin.imageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">👤</span>}
                            </span>
                            <span className="gh-online__details">
                              <strong>{player.username}</strong>
                              <small><i className={`gh-online__activity gh-online__activity--${player.activity}`} aria-hidden="true" /> {activityLabel} · NIV. {player.level}</small>
                            </span>
                            <span className="gh-online__action" aria-hidden="true">{player.activity === "lobby" ? "⚔" : "›"}</span>
                          </button>
                        );
                      })}
                      {otherOnlinePlayers.length === 0 && (
                        <p className="gh-online__empty">Todavía no hay otros jugadores. Cuando alguien entre, aparecerá acá.</p>
                      )}
                      {otherOnlinePlayers.length > 4 && (
                        <button type="button" className="gh-online__more" onClick={() => setShowPlayersSheet(true)}>
                          Ver todos los jugadores →
                        </button>
                      )}
                    </div>
                  </section>

                  </aside>
                  <button className="gh-world__play" type="button" onClick={() => handleGameNavigate("battle")}>
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

                  <div className="gh-world__discover" aria-label="Exploración y comunidad">
                    <button type="button" onClick={() => setShowExploreWorld(true)}>◇ EXPLORAR</button>
                    <button type="button" onClick={() => setShowPlayersSheet(true)}>♧ SOCIAL</button>
                  </div>
                  {showExploreWorld && (
                    <div className="gh-world__explore-overlay" role="presentation" onClick={() => setShowExploreWorld(false)}>
                      <section className="gh-world__explore-panel" role="dialog" aria-modal="true" aria-label="Explorar Lupi World" onClick={event => event.stopPropagation()}>
                        <button type="button" className="gh-world__explore-close" onClick={() => setShowExploreWorld(false)} aria-label="Cerrar exploración">×</button>
                        <span className="gh-world__next-kicker">LUPI WORLD</span>
                        <h2>Elegí tu aventura</h2>
                        <p>Jugá, personalizá tu personaje o descubrí tus logros.</p>
                        <div className="gh-world__explore-options">
                          <button type="button" onClick={() => {setShowExploreWorld(false);handleGameNavigate("battle");}}>⚡ <strong>Partida rápida</strong><small>Entrá a jugar</small></button>
                          <button type="button" onClick={() => {setShowExploreWorld(false);handleGameNavigate("deck");}}>👕 <strong>Mi equipo</strong><small>Personalizá tu equipo</small></button>
                          <button type="button" onClick={() => {setShowExploreWorld(false);handleGameNavigate("album");}}>▦ <strong>Álbum</strong><small>Explorá tus cartas</small></button>
                          <button type="button" onClick={() => {setShowExploreWorld(false);setShowAchievements(true);}}>🏆 <strong>Mis logros</strong><small>Revisá tu progreso</small></button>
                        </div>
                        <span className="gh-world__explore-soon">Próximamente: Academy y nuevas habilidades.</span>
                      </section>
                    </div>
                  )}

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

              {debutWaiting && gameTab === "play" && (
                <section className="gh-panel" role="status" style={{ textAlign: "center", padding: 32 }}>
                  <h2>⚽ PREPARANDO TU QUINTETO</h2>
                  <p>{activeDeck.cards?.length ?? 0}/5 jugadores listos</p>
                  <button type="button" onClick={() => { loadUserCards(); loadActiveDeck(); }}>
                    REINTENTAR SINCRONIZACIÓN
                  </button>
                </section>
              )}
              {!debutWaiting && gameTab === "play" && view === "match" && (
                <section className="gh-match">
                  <div className="gh-match__bar">
                    <button className="gh-ghost" onClick={() => setView("lobby")}><span aria-hidden>‹</span> Lobby</button>
                    <span style={{fontSize:12,opacity:.8}}>⚽ Partido rápido · Tomá decisiones para ganar XP</span>

                  </div>

                  <div className="gh-panel">
                    {(
                      <CardBattle
  userCards={userCards}
  userDeck={activeDeck}
  userId={user.id}
  onBattleComplete={onBattleComplete}
  onNavigateToDeck={() => setGameTab("deck")}
  onDailyChallengesUpdated={handleDailyChallengesUpdated}
  onMatchRecorded={() => { recordLupiMatchCompleted(); adventureComplete("first_match"); onMatchRecorded?.(); }}
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
    void updateMissionProgress("play_match");
  }}
  onResultClosed={() => setView("lobby")}
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
            onClose={() => { setShowPackModal(false); void refreshPackCount(); }}
            userId={user.id}
            onCardReceived={() => {
              loadUserCards();
              loadActiveDeck();
              adventureComplete("open_pack");
              void refreshPackCount();
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
        </>
      );
    }
