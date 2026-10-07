// src/components/CampaignMode.tsx

import {
  useState,
  useEffect,
  type CSSProperties,
} from "react";

import { UserCard, Deck } from "../types/cards";
import { CardBattle } from "./CardBattle";

import { LEAGUES } from "../data/campaignData";
import {
  League,
  BotConfig,
  CampaignProgress,
} from "../types/campaign";

import { supabase } from "../lib/supabaseClient";

import {
  getCardData,
  calcGroupValue,
} from "../utils/battleEngine";

import {
  LEAGUE_STORIES,
  MatchStory,
} from "../data/campaignStories";

import CampaignMatchComponent from "./CampaignMatch";
import StoryCinematic from "./StoryCinematic";

import { DailyMissionsPanel } from "./DailyMissionsPanel";

import { CampaignDay, DailyMission, StoryChapter } from "../types/campaignStory";

import TutorialCoach from "./campaign/TutorialCoach";

import { useProgressiveStory } from "../hooks/useProgressiveStory";

import { CoachButton } from "./campaign/CoachButton";
import { CoachPanel } from "./campaign/CoachPanel";
import ContextualHelp from "./campaign/ContextualHelp";

import { useTrainingSystem } from "../hooks/useTrainingSystem";

import { TrainingModal } from "./campaign/TrainingModal";
import { TrainingCenter } from "./campaign/TrainingCenter";

import { DailyMissionPreview } from "../components/campaign/DailyMissionPreview";

import { useDailyMissions } from "../hooks/useDailyMissions";


// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CampaignModeProps {
  userCards: UserCard[];
  userDeck: Deck;
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
  onNavigateToDeck?: () => void;
}


// ─────────────────────────────────────────────────────────────────────────────
// FUENTE RUSSO ONE
// ─────────────────────────────────────────────────────────────────────────────

const RUSSO = "'Russo One', sans-serif";

if (
  typeof document !== "undefined" &&
  !document.getElementById("russo-one-font")
) {
  const link = document.createElement("link");

  link.id = "russo-one-font";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Russo+One&display=swap";

  document.head.appendChild(link);
}


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function calculateOverall(cards: UserCard[]): number {
  if (!cards.length) return 0;

  const total = cards.reduce((sum, card) => {
    const cardData = getCardData(card);

    return (
      sum +
      (cardData.overall_rating || 50)
    );
  }, 0);

  return Math.round(total / cards.length);
}


function calculateTeamStats(deckCards: UserCard[]) {
  if (!deckCards || deckCards.length === 0) {
    return {
      overall: 0,
      attack: 0,
      defense: 0,
      technique: 0,
      cardsCount: 0,
    };
  }

  const stats = deckCards.reduce(
    (acc, card) => {
      const cardData = getCardData(card);

      return {
        overall:
          acc.overall +
          cardData.overall_rating,

        attack:
          acc.attack +
          calcGroupValue(
            card,
            "attack"
          ),

        defense:
          acc.defense +
          calcGroupValue(
            card,
            "defense"
          ),

        technique:
          acc.technique +
          calcGroupValue(
            card,
            "technique"
          ),
      };
    },
    {
      overall: 0,
      attack: 0,
      defense: 0,
      technique: 0,
    }
  );

  const count = deckCards.length;

  return {
    overall: Math.round(
      stats.overall / count
    ),

    attack: Math.round(
      stats.attack / count
    ),

    defense: Math.round(
      stats.defense / count
    ),

    technique: Math.round(
      stats.technique / count
    ),

    cardsCount: count,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export function CampaignMode({
  userCards,
  userDeck,
  userId,
  onBattleComplete,
  onNavigateToDeck,
}: CampaignModeProps) {

  // ─────────────────────────────────────────────
  // CAMPAIGN STATE
  // ─────────────────────────────────────────────

  const [progress, setProgress] =
    useState<CampaignProgress | null>(null);

  const [isBattleActive, setIsBattleActive] =
    useState(false);

  const [selectedOpponent, setSelectedOpponent] =
    useState<BotConfig | null>(null);

  const [showRewards, setShowRewards] =
    useState(false);

  const [lastReward, setLastReward] =
    useState<{
      type: string;
      value: string | number;
    } | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [currentMatch, setCurrentMatch] =
    useState<{
      opponent: BotConfig;
      matchNumber: number;
      story: MatchStory;
    } | null>(null);

  const [matchProgress, setMatchProgress] =
    useState<Map<string, boolean>>(
      new Map()
    );


  // ─────────────────────────────────────────────
  // DAILY MISSIONS
  // ─────────────────────────────────────────────

  const {
    campaignDays,
    setCampaignDays,
    currentDay,
    setCurrentDay,
    currentMissions,
    nextMission,
    updateMissionProgress,
    claimReward,
    startMission,
  } = useDailyMissions(userId);


  // ─────────────────────────────────────────────
  // STORY
  // ─────────────────────────────────────────────

  const [activeCinematic, setActiveCinematic] =
    useState<StoryChapter | null>(null);

  const {
    checkStoryProgress,
    showStoryNotification,
    notificationMessage,
  } = useProgressiveStory(userId);


  // ─────────────────────────────────────────────
  // TUTORIAL / COACH
  // ─────────────────────────────────────────────

  const [showTutorial, setShowTutorial] =
    useState(true);

  const [tutorialComplete, setTutorialComplete] =
    useState(false);

  const [showCoachPanel, setShowCoachPanel] =
    useState(false);

  const [unreadTips, setUnreadTips] =
    useState(0);

  const [showContextualHelp, setShowContextualHelp] =
    useState(false);


  // ─────────────────────────────────────────────
  // TRAINING
  // ─────────────────────────────────────────────

  const {
    dailyLoop,
    applyTraining,
    canTrain,
    history,
  } = useTrainingSystem(
    userId,
    userCards
  );

  const [showTrainingModal, setShowTrainingModal] =
    useState(false);

  const deckCardIds =
    userDeck?.cards?.map(
      (card) => card.id
    ) || [];

  const [showTrainingCenter, setShowTrainingCenter] =
    useState(false);


  // ─────────────────────────────────────────────
  // GUIDE / MISSIONS
  // ─────────────────────────────────────────────

  const [showGuideModal, setShowGuideModal] =
    useState(false);

  const [showMissions, setShowMissions] =
    useState(false);


  // ─────────────────────────────────────────────
  // DEV MODE
  // ─────────────────────────────────────────────

  const isDevMode =
    typeof window !== "undefined" &&
    (
      window.location.search.includes(
        "dev=true"
      ) ||
      window.location.hash.includes(
        "dev"
      ) ||
      localStorage.getItem(
        "dev_mode"
      ) === "true"
    );


  // ─────────────────────────────────────────────
  // TUTORIAL
  // ─────────────────────────────────────────────

  const restartTutorial = () => {
    localStorage.removeItem(
      `tutorial_seen_${userId}`
    );

    localStorage.removeItem(
      `coach_read_tips_${userId}`
    );

    setShowTutorial(true);
    setTutorialComplete(false);
    setUnreadTips(6);

    setLastReward({
      type: "mission_reward",
      value: "Tutorial reiniciado",
    });

    setShowRewards(true);

    setTimeout(() => {
      setShowRewards(false);
    }, 3000);
  };


  // ─────────────────────────────────────────────
  // MISSION STATUS
  // ─────────────────────────────────────────────

  const hasUnreadMissions =
    currentMissions.some(
      (mission) =>
        !mission.isCompleted
    );


  // ─────────────────────────────────────────────
  // TEAM UPGRADE
  // ─────────────────────────────────────────────

  const canUpgradeTeam =
    userCards.length < 10;


  // ─────────────────────────────────────────────
  // COACH TIPS
  // ─────────────────────────────────────────────

  const countUnreadTips = () => {
    const saved = localStorage.getItem(
      `coach_read_tips_${userId}`
    );

    let readTips: unknown[] = [];

    try {
      readTips = saved
        ? JSON.parse(saved)
        : [];
    } catch {
      readTips = [];
    }

    const totalTips = 6;

    const unread =
      totalTips -
      readTips.length;

    setUnreadTips(
      unread > 0
        ? unread
        : 0
    );
  };


  // ─────────────────────────────────────────────
  // OPEN PACK
  // ─────────────────────────────────────────────

  const handleOpenPack = async () => {

    setLastReward({
      type: "pack_opened",
      value: "¡Sobre legendario!",
    });

    setShowRewards(true);

    setTimeout(() => {
      setShowRewards(false);
    }, 3000);

    updateMissionProgress(
      "open_pack"
    );
  };


  // ─────────────────────────────────────────────
  // REWARDED AD
  // ─────────────────────────────────────────────

  const showRewardedAd = async () => {

    return new Promise<void>(
      (resolve) => {

        setTimeout(() => {

          updateMissionProgress(
            "watch_ad"
          );

          setLastReward({
            type: "ad_watched",
            value: "+40 XP",
          });

          setShowRewards(true);

          setTimeout(() => {
            setShowRewards(false);
          }, 2000);

          resolve();

        }, 2000);

      }
    );
  };


  // ─────────────────────────────────────────────
  // CLAIM MISSION REWARD
  // ─────────────────────────────────────────────

  const handleClaimReward = async (
    missionId: string
  ) => {

    const mission =
      await claimReward(
        missionId
      );

    if (!mission) {
      return;
    }

    setLastReward({
      type: "mission_reward",

      value:
        `${mission.reward.xp} XP` +
        (
          mission.reward.coins
            ? ` + ${mission.reward.coins} monedas`
            : ""
        ),
    });

    setShowRewards(true);

    setTimeout(() => {
      setShowRewards(false);
    }, 3000);
  };


  // ─────────────────────────────────────────────
  // STREAK
  // ─────────────────────────────────────────────

  const getStreak = (): number => {

    const streak =
      localStorage.getItem(
        `daily_streak_${userId}`
      );

    return streak
      ? parseInt(streak, 10)
      : 0;
  };


  const isConsecutiveDay = (
    lastDate: string,
    today: string
  ): boolean => {

    const last =
      new Date(lastDate);

    const now =
      new Date(today);

    const diffDays =
      (
        now.getTime() -
        last.getTime()
      ) /
      (1000 * 3600 * 24);

    return diffDays === 1;
  };


  // ─────────────────────────────────────────────
  // UNLOCK NEXT STORY DAY
  // ─────────────────────────────────────────────

  const unlockNextDay = () => {

    const updatedDays =
      campaignDays.map(
        (day) => ({
          ...day,

          storyChapters:
            day.storyChapters.map(
              (chapter) => ({
                ...chapter,
              })
            ),
        })
      );

    if (
      currentDay <
      updatedDays.length
    ) {

      const nextDay =
        updatedDays[currentDay];

      nextDay.canAdvance =
        true;

      if (
        nextDay.storyChapters.length >
        0
      ) {
        nextDay.storyChapters[0]
          .isUnlocked = true;
      }

      setCampaignDays(
        updatedDays
      );
    }
  };


  // ─────────────────────────────────────────────
  // START STORY CHAPTER
  // ─────────────────────────────────────────────

  const startStoryChapter = (
    chapter: StoryChapter
  ) => {
    setActiveCinematic(
      chapter
    );
  };


  // ─────────────────────────────────────────────
  // START MISSION
  // ─────────────────────────────────────────────

  const handleStartMission = async (
    mission: DailyMission
  ) => {

    switch (mission.type) {

      case "play_match":
        // El progreso se completa
        // cuando termina realmente
        // el partido.
        break;

      case "share":
        await handleSocialShare();
        break;

      case "open_pack":
        await handleOpenPack();
        break;

      case "watch_ad":
        await showRewardedAd();
        break;

      default:
        await startMission(
          mission
        );
        break;
    }
  };


  // ─────────────────────────────────────────────
  // SOCIAL SHARE
  // ─────────────────────────────────────────────

  const handleSocialShare = async () => {

    const shareData = {
      title:
        "Mi equipo en Dream League",

      text:
        "¡Veni a jugar Dream League! Estoy en la campaña y necesito tu apoyo",

      url:
        window.location.href,
    };


    if (
      navigator.share
    ) {

      await navigator.share(
        shareData
      );

      updateMissionProgress(
        "share"
      );

    } else {

      await navigator.clipboard.writeText(
        shareData.text
      );

      alert(
        "¡Link copiado! Compartilo con tus amigos"
      );

      updateMissionProgress(
        "share"
      );
    }
  };


  // ─────────────────────────────────────────────
  // INITIAL EFFECT
  // ─────────────────────────────────────────────

  useEffect(() => {

    const tutorialSeen =
      localStorage.getItem(
        `tutorial_seen_${userId}`
      );

    if (
      tutorialSeen === "true"
    ) {

      setShowTutorial(false);
      setTutorialComplete(true);
    }

    countUnreadTips();

    loadCampaignProgress();

    loadMatchProgress();

  }, [userId]);


  // ─────────────────────────────────────────────
  // STORY PROGRESS
  // ─────────────────────────────────────────────

  useEffect(() => {

    if (!progress) {
      return;
    }

    checkStoryProgress(
      totalWins,
      progress.currentLeagueId,
      progress.completedLeagueIds,
      []
    );

  }, [
    progress,
    matchProgress,
  ]);


  // ─────────────────────────────────────────────
  // LOAD CAMPAIGN PROGRESS
  // ─────────────────────────────────────────────

  async function loadCampaignProgress() {

    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("campaign_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {

      console.error(
        "Error loading campaign progress:",
        error
      );
    }

    if (data) {

      setProgress({
        currentLeagueId:
          data.current_league_id,

        completedLeagueIds:
          data.completed_league_ids ||
          [],

        starsEarned:
          data.stars_earned ||
          0,

        unlockedBadges:
          data.unlocked_badges ||
          [],

        currentStreak:
          data.current_streak ||
          0,

        bestStreak:
          data.best_streak ||
          0,
      });

    } else {

      const initialProgress:
        CampaignProgress = {

        currentLeagueId:
          "rookie",

        completedLeagueIds:
          [],

        starsEarned:
          0,

        unlockedBadges:
          [],

        currentStreak:
          0,

        bestStreak:
          0,
      };

      setProgress(
        initialProgress
      );

      await supabase
        .from(
          "campaign_progress"
        )
        .insert({
          user_id: userId,

          current_league_id:
            "rookie",

          completed_league_ids:
            [],

          stars_earned:
            0,

          unlocked_badges:
            [],

          current_streak:
            0,

          best_streak:
            0,
        });
    }

    setLoading(false);
  }


  // ─────────────────────────────────────────────
  // LOAD MATCH PROGRESS
  // ─────────────────────────────────────────────

  async function loadMatchProgress() {

    const saved =
      localStorage.getItem(
        `campaign_matches_${userId}`
      );

    if (!saved) {
      return;
    }

    try {

      const parsed =
        JSON.parse(saved);

      setMatchProgress(
        new Map(parsed)
      );

    } catch (error) {

      console.error(
        "Error loading match progress:",
        error
      );
    }
  }


  // ─────────────────────────────────────────────
  // SAVE MATCH PROGRESS
  // ─────────────────────────────────────────────

  async function saveMatchProgress(
    updated: Map<string, boolean>
  ) {

    localStorage.setItem(
      `campaign_matches_${userId}`,

      JSON.stringify(
        Array.from(
          updated.entries()
        )
      )
    );

    setMatchProgress(
      updated
    );
  }


  // ─────────────────────────────────────────────
  // SAVE CAMPAIGN PROGRESS
  // ─────────────────────────────────────────────

  async function saveCampaignProgress(
    updated: CampaignProgress
  ) {

    const {
      error,
    } = await supabase
      .from("campaign_progress")
      .update({
        current_league_id:
          updated.currentLeagueId,

        completed_league_ids:
          updated.completedLeagueIds,

        stars_earned:
          updated.starsEarned,

        unlocked_badges:
          updated.unlockedBadges,

        current_streak:
          updated.currentStreak,

        best_streak:
          updated.bestStreak,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "user_id",
        userId
      );

    if (error) {

      console.error(
        "Error saving campaign progress:",
        error
      );
    }

    setProgress(
      updated
    );
  }


  // ─────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────

  const currentLeague =
    LEAGUES.find(
      (league) =>
        league.id ===
        progress?.currentLeagueId
    ) ||
    LEAGUES[0];

  const completedCount =
    progress?.completedLeagueIds
      .length || 0;

  const totalLeagues =
    LEAGUES.length;

  const overallRating =
    calculateOverall(
      userCards
    );

  const teamStats =
    calculateTeamStats(
      userDeck?.cards || []
    );

  const totalWins =
    (
      progress
        ?.completedLeagueIds
        .length || 0
    ) *
      3 +
    Array.from(
      matchProgress.values()
    ).filter(
      (value) =>
        value === true
    ).length;


  // ─────────────────────────────────────────────
  // START MATCH
  // ─────────────────────────────────────────────

  function startMatch(
    opponent: BotConfig
  ) {

    setSelectedOpponent(
      opponent
    );

    setIsBattleActive(
      true
    );
  }


  // ─────────────────────────────────────────────
  // COMPLETE MATCH
  // ─────────────────────────────────────────────

  async function completeMatch(
    leagueId: string,
    matchIndex: number,
    won: boolean
  ) {

    // Si perdió no avanzamos
    if (!won) {
      return;
    }


    // ─────────────────────────────
    // MATCH PROGRESS
    // ─────────────────────────────

    const matchKey =
      `${leagueId}_${matchIndex}`;

    const newProgress =
      new Map(
        matchProgress
      );

    newProgress.set(
      matchKey,
      true
    );

    await saveMatchProgress(
      newProgress
    );


    // ─────────────────────────────
    // DAILY MISSION
    // ─────────────────────────────

    updateMissionProgress(
      "play_match"
    );


    const league =
      LEAGUES.find(
        (item) =>
          item.id ===
          leagueId
      );


    // ─────────────────────────────
    // USER XP / POINTS
    // ─────────────────────────────

    if (
      won &&
      selectedOpponent
    ) {

      try {

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "points, exp, level"
          )
          .eq(
            "id",
            userId
          )
          .single();


        if (profileError) {

          console.error(
            "Error fetching profile:",
            profileError
          );

        } else {

          const currentPoints =
            profile?.points ||
            0;

          const currentExp =
            profile?.exp ||
            0;

          const currentLevel =
            profile?.level ||
            1;


          // PUNTOS
          const newPoints =
            currentPoints +
            selectedOpponent.xpBase;


          // XP
          let newExp =
            currentExp +
            selectedOpponent.xpBase;

          let newLevel =
            currentLevel;


          const expNeeded =
            currentLevel *
            100;


          if (
            newExp >=
            expNeeded
          ) {

            newLevel++;

            newExp -=
              expNeeded;
          }


          const {
            error:
              updateError,
          } = await supabase
            .from("profiles")
            .update({
              points:
                newPoints,

              exp:
                newExp,

              level:
                newLevel,
            })
            .eq(
              "id",
              userId
            );


          if (updateError) {

            console.error(
              "Error updating profile:",
              updateError
            );

          } else {

            console.log(
              `✅ Usuario actualizado: +${selectedOpponent.xpBase}pts, nivel ${newLevel}`
            );
          }
        }

      } catch (error) {

        console.error(
          "Error updating user progress:",
          error
        );
      }
    }


    // ─────────────────────────────
    // LEAGUE COMPLETE
    // ─────────────────────────────

    if (
      league &&
      progress
    ) {

      const allMatchesCompleted =
        league.bots.every(
          (_, idx) =>
            newProgress.get(
              `${leagueId}_${idx}`
            ) === true
        );


      if (
        allMatchesCompleted &&
        !progress.completedLeagueIds.includes(
          leagueId
        )
      ) {

        const newCompleted = [
          ...progress.completedLeagueIds,
          leagueId,
        ];


        const nextLeagueIndex =
          LEAGUES.findIndex(
            (item) =>
              item.id ===
              leagueId
          ) + 1;


        const nextLeague =
          nextLeagueIndex <
          LEAGUES.length
            ? LEAGUES[
                nextLeagueIndex
              ].id
            : leagueId;


        const updatedProgress = {
          ...progress,

          completedLeagueIds:
            newCompleted,

          currentLeagueId:
            nextLeague,

          starsEarned:
            progress.starsEarned +
            3,

          currentStreak:
            progress.currentStreak +
            1,

          bestStreak:
            Math.max(
              progress.bestStreak,
              progress.currentStreak +
                1
            ),
        };


        await saveCampaignProgress(
          updatedProgress
        );


        setLastReward({
          type:
            "league_complete",

          value:
            league.rewardXp,
        });


        setShowRewards(
          true
        );


        setTimeout(() => {
          setShowRewards(
            false
          );
        }, 4000);
      }
    }
  }


  // ─────────────────────────────────────────────
  // BATTLE COMPLETE
  // ─────────────────────────────────────────────

  function handleBattleComplete(
    updatedCards: UserCard[]
  ) {

    onBattleComplete(
      updatedCards
    );


    setIsBattleActive(
      false
    );


    if (
      selectedOpponent &&
      currentMatch
    ) {

      completeMatch(
        currentLeague.id,

        currentMatch.matchNumber -
          1,

        true
      );
    }


    if (
      selectedOpponent
    ) {

      setLastReward({
        type: "win",

        value:
          selectedOpponent.xpBase,
      });

      setShowRewards(
        true
      );

      setTimeout(() => {
        setShowRewards(
          false
        );
      }, 3000);
    }


    setSelectedOpponent(
      null
    );

    setCurrentMatch(
      null
    );


    loadCampaignProgress();
    loadMatchProgress();
  }


  // ─────────────────────────────────────────────
  // START MATCH WITH STORY
  // ─────────────────────────────────────────────

  function startMatchWithStory(
    league: League,
    matchIndex: number
  ) {

    const opponent =
      league.bots[
        matchIndex
      ];


    const stories =
      LEAGUE_STORIES[
        league.id as keyof typeof LEAGUE_STORIES
      ];


    const story =
      stories?.[matchIndex] ||
      {
        id: "default",

        title:
          "¡PARTIDO IMPORTANTE!",

        intro:
          "Llegó el momento de demostrar quién sos. El rival te espera. ¿Estás listo para la gloria?",

        opponentQuotes: {
          before:
            '"Que gane el mejor" - Capitán rival',

          after:
            "Buen partido. Nos vemos en la revancha.",
        },

        cinematics: {},

        rivalSpecial:
          "Juegan en equipo. Necesitás estar concentrado.",

        rewardMessage:
          "¡Gran victoria! Seguí así.",
      };


    setCurrentMatch({
      opponent,

      matchNumber:
        matchIndex + 1,

      story,
    });
  }


  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (loading) {

    return (
      <div style={s.loadingScreen}>

        <style>
          {keyframesAnime}
        </style>

        <div
          style={s.spinner}
        />

        <p
          style={{
            color:
              "rgba(255,255,255,0.6)",

            marginTop: 16,

            fontFamily: RUSSO,
          }}
        >
          Cargando tu aventura...
        </p>

      </div>
    );
  }


  // ─────────────────────────────────────────────
  // BATTLE ACTIVE
  // ─────────────────────────────────────────────

  if (
    isBattleActive &&
    selectedOpponent
  ) {

    const difficultyToLevel: Record<
      string,
      number
    > = {
      easy: 1,
      medium: 2,
      hard: 3,
    };


    const difficultyToColor: Record<
      string,
      string
    > = {
      easy: "#4ade80",
      medium: "#ffd700",
      hard: "#ff6b6b",
    };


    const forcedOpponent = {

      name:
        selectedOpponent.name,

      overall_rating:
        selectedOpponent.overall,

      category:
        selectedOpponent.difficulty,

      level:
        selectedOpponent.level ??
        difficultyToLevel[
          selectedOpponent.difficulty
        ],

      avatar:
        selectedOpponent.avatar,

      color:
        selectedOpponent.color ??
        difficultyToColor[
          selectedOpponent.difficulty
        ],

      xpBase:
        selectedOpponent.xpBase,

      reqWins: 0,
    };


    return (
      <CardBattle
        userCards={
          userCards
        }

        userDeck={
          userDeck
        }

        userId={
          userId
        }

        onBattleComplete={
          handleBattleComplete
        }

        onNavigateToDeck={
          onNavigateToDeck
        }

        forcedOpponent={
          forcedOpponent
        }

        isCampaignMode={
          true
        }

        onCampaignMatchComplete={(
          won,
          _bot
        ) => {

          if (
            currentMatch
          ) {

            completeMatch(
              currentLeague.id,

              currentMatch.matchNumber -
                1,

              won
            );
          }
        }}
      />
    );
  }


  // ─────────────────────────────────────────────
  // STORY / MATCH SCREEN
  // ─────────────────────────────────────────────

  if (currentMatch) {

    return (
      <CampaignMatchComponent
        opponent={
          currentMatch.opponent
        }

        matchNumber={
          currentMatch.matchNumber
        }

        totalMatches={
          3
        }

        leagueName={
          currentLeague.name
        }

        leagueIcon={
          currentLeague.icon
        }

        story={
          currentMatch.story
        }

        onStartMatch={() =>
          startMatch(
            currentMatch.opponent
          )
        }

        onBack={() =>
          setCurrentMatch(
            null
          )
        }

        userTeamStats={
          teamStats
        }

        userTeamName="MI EQUIPO"

        userAvatar="⚡"
      />
    );
  }


  // ─────────────────────────────────────────────
  // MAIN SCREEN
  // ─────────────────────────────────────────────

  return (

    <div
      style={s.container}
    >

      <div
        style={s.energyBg1}
      />

      <div
        style={s.energyBg2}
      />

      <div
        style={s.gridOverlay}
      />


      {/* ───────────────── COACH BUTTON ───────────────── */}

      <CoachButton
        userId={
          userId
        }

        onOpenCoach={() =>
          setShowCoachPanel(
            true
          )
        }

        onOpenContextualHelp={() =>
          setShowContextualHelp(
            true
          )
        }

        onRestartTutorial={
          restartTutorial
        }

        unreadTips={
          unreadTips
        }
      />


      {/* ───────────────── CONTEXTUAL HELP ───────────────── */}

      {showContextualHelp && (

        <ContextualHelp
          userId={
            userId
          }

          currentLeague={
            currentLeague?.name ||
            "Rookie"
          }

          completedWins={
            totalWins % 3
          }

          currentDay={
            currentDay
          }

          hasUnreadMissions={
            hasUnreadMissions
          }

          canUpgradeTeam={
            canUpgradeTeam
          }

          onRestartTutorial={
            restartTutorial
          }

          onClose={() =>
            setShowContextualHelp(
              false
            )
          }
        />
      )}


      {/* ───────────────── COACH PANEL ───────────────── */}

      {showCoachPanel && (

        <CoachPanel

          onClose={() => {
            setShowCoachPanel(
              false
            );

            countUnreadTips();
          }}

          userId={
            userId
          }

          currentLeague={
            currentLeague?.name ||
            "Rookie"
          }

          completedWins={
            totalWins
          }

          onMarkTipRead={() =>
            countUnreadTips()
          }
        />
      )}


      {/* ───────────────── TUTORIAL ───────────────── */}

      {showTutorial &&
        !tutorialComplete && (

          <TutorialCoach

            onComplete={() => {
              setShowTutorial(
                false
              );

              setTutorialComplete(
                true
              );
            }}

            onStartMatch={() => {

              if (
                currentLeague &&
                currentLeague.bots[0]
              ) {

                startMatchWithStory(
                  currentLeague,
                  0
                );
              }
            }}

            userId={
              userId
            }
          />
        )}


      {/* ───────────────── STORY NOTIFICATION ───────────────── */}

      {showStoryNotification && (

        <div
          style={
            s.storyNotification
          }
        >

          <div
            style={
              s.storyNotificationContent
            }
          >

            {notificationMessage
              .split("\n")
              .map(
                (
                  line,
                  i
                ) => (
                  <p
                    key={i}
                  >
                    {line}
                  </p>
                )
              )}

          </div>

        </div>
      )}


      <style>
        {keyframesAnime}
      </style>


      {/* ───────────────── HEADER ───────────────── */}

      <div
        style={
          s.headerAnime
        }
      >

        <div
          style={
            s.headerGlow
          }
        />

        <div
          style={
            s.headerLines
          }
        />


        <div
          style={
            s.titleGroupAnime
          }
        >

          <div
            style={
              s.logoCircle
            }
          >
            ⚽
          </div>


          <div>

            <div
              style={
                s.storyBadge
              }
            >
              STORY MODE
            </div>


            <h1
              style={
                s.mainTitleAnime
              }
            >
              HISTORIA
            </h1>


            <p
              style={
                s.mainSubAnime
              }
            >
              EL CAMINO HACIA LA GLORIA
            </p>

          </div>

        </div>


        <div
          style={
            s.statsPanel
          }
        >

          <div
            style={
              s.statCardBlue
            }
          >

            <div
              style={
                s.statTop
              }
            >
              ⭐
            </div>

            <div
              style={
                s.statNumber
              }
            >
              {
                progress?.starsEarned ||
                0
              }
            </div>

            <div
              style={
                s.statText
              }
            >
              STARS
            </div>

          </div>


          <div
            style={
              s.statCardFire
            }
          >

            <div
              style={
                s.statTop
              }
            >
              🔥
            </div>

            <div
              style={
                s.statNumber
              }
            >
              {
                progress?.currentStreak ||
                0
              }
            </div>

            <div
              style={
                s.statText
              }
            >
              STREAK
            </div>

          </div>

        </div>

      </div>


      {/* ───────────────── POWER BAR ───────────────── */}

      <div
        style={
          s.powerWrapper
        }
      >

        <div
          style={
            s.powerHeader
          }
        >

          <span>
            ⚡ PODER DE CAMPEÓN
          </span>

          <span>
            {completedCount}/
            {totalLeagues} LIGAS
          </span>

        </div>


        <div
          style={
            s.powerTrackAnime
          }
        >

          <div
            style={{
              ...s.powerFillAnime,

              width:
                `${(
                  completedCount /
                  totalLeagues
                ) * 100}%`,
            }}
          />

          <div
            style={
              s.powerShine
            }
          />

        </div>

      </div>


      {/* ───────────────── MANUAL ───────────────── */}

      <div
        style={
          s.manualCard
        }
      >

        <div
          style={
            s.manualGlow
          }
        />

        <div
          style={
            s.manualLeft
          }
        >

          <div
            style={
              s.manualIcon
            }
          >
            📘
          </div>

          <div>

            <div
              style={
                s.manualTitle
              }
            >
              MANUAL DEL JUEGO
            </div>

            <div
              style={
                s.manualDesc
              }
            >
              Aprendé a convertirte en campeón
            </div>

          </div>

        </div>


        <button
          style={
            s.manualButton
          }

          onClick={() =>
            setShowGuideModal(
              true
            )
          }
        >
          VER
        </button>

      </div>


      {/* ───────────────── TRAINING CENTER ───────────────── */}

      <button
        onClick={() =>
          setShowTrainingCenter(
            true
          )
        }

        style={
          s.trainingCenterButton
        }
      >
        🏋️ CENTRO DE ENTRENAMIENTO
      </button>


      {/* ───────────────── TRAINING MODAL ───────────────── */}

      <TrainingModal

        isOpen={
          showTrainingModal
        }

        onClose={() =>
          setShowTrainingModal(
            false
          )
        }

        onTrain={async (
          result,
          cardIds
        ) => {

          const cardsToTrain =
            userDeck?.cards?.filter(
              (card) =>
                cardIds.includes(
                  card.id
                )
            ) || [];


          await applyTraining(
            result,
            cardsToTrain
          );


          setLastReward({
            type:
              "mission_reward",

            value:
              `+${result.delta} ${result.stat.toUpperCase()} · Calificación ${result.grade}`,
          });


          setShowRewards(
            true
          );


          setTimeout(() => {
            setShowRewards(
              false
            );
          }, 2000);


          updateMissionProgress(
            "training"
          );
        }}

        deckCardIds={
          deckCardIds
        }
      />


      {/* ───────────────── STORY CINEMATIC ───────────────── */}

      {activeCinematic && (

        <StoryCinematic

          chapter={
            activeCinematic
          }

          onComplete={() => {

            setActiveCinematic(
              null
            );

            unlockNextDay();
          }}

          dayNumber={
            currentDay
          }
        />
      )}


      {/* ───────────────── DAILY MISSION PREVIEW ───────────────── */}

      <DailyMissionPreview

        mission={
          nextMission
        }

        onOpenAll={() =>
          setShowMissions(
            true
          )
        }

        onStartMission={
          handleStartMission
        }

        onClaimReward={
          handleClaimReward
        }

        streak={
          getStreak()
        }
      />


      {/* ───────────────── STREAK ───────────────── */}

      <div
        style={
          s.streakIndicator
        }
      >

        <div>
          🔥 RACHA:{" "}
          {getStreak()} días seguidos
        </div>

        <div>
          🎯 PRÓXIMA RECOMPENSA EN{" "}
          {3 -
            (
              getStreak() %
              3
            )}{" "}
          días
        </div>

      </div>


      {/* ───────────────── STORY OF THE DAY ───────────────── */}

      {!activeCinematic &&
        campaignDays[
          currentDay - 1
        ]?.storyChapters[0] && (

          <div
            style={
              s.storyButtonContainer
            }
          >

            <button
              style={
                s.storyButton
              }

              onClick={() =>
                startStoryChapter(
                  campaignDays[
                    currentDay - 1
                  ]
                    .storyChapters[0]
                )
              }
            >
              📖 VER HISTORIA DEL DÍA{" "}
              {currentDay} 📖
            </button>

          </div>
        )}


      {/* ───────────────── WORLD MAP ───────────────── */}

      <div
        style={
          s.worldMap
        }
      >

        {LEAGUES.map(
          (
            league,
            idx
          ) => {

            const isCompleted =
              progress?.completedLeagueIds.includes(
                league.id
              );

            const isCurrent =
              progress?.currentLeagueId ===
              league.id;

            const isLocked =
              !isCompleted &&
              !isCurrent &&
              idx >
                (
                  progress
                    ?.completedLeagueIds
                    .length ||
                  0
                );

            const meetsRequirement =
              overallRating >=
              league.requiredOverall;


            let cardStyle = {
              ...s.leagueCardAnime,
            };


            if (
              isCompleted
            ) {

              cardStyle = {
                ...cardStyle,
                ...s.leagueCompletedAnime,
              };
            }


            if (
              isCurrent
            ) {

              cardStyle = {
                ...cardStyle,
                ...s.leagueCurrentAnime,
              };
            }


            if (
              isLocked
            ) {

              cardStyle = {
                ...cardStyle,
                ...s.leagueLockedAnime,
              };
            }


            return (

              <div
                key={
                  league.id
                }

                style={
                  s.leagueNode
                }
              >

                {idx > 0 && (
                  <div
                    style={
                      s.pathConnector
                    }
                  />
                )}


                <div
                  style={
                    cardStyle
                  }
                >

                  <div
                    style={
                      s.leagueHeaderAnime
                    }
                  >

                    <div
                      style={
                        s.leagueIconAnime
                      }
                    >
                      {league.icon}
                    </div>


                    <div
                      style={
                        s.leagueNameAnime
                      }
                    >
                      {league.name}
                    </div>


                    {isCurrent && (

                      <div
                        style={
                          s.currentFlagAnime
                        }
                      >
                        ⚡ EN CURSO ⚡
                      </div>
                    )}


                    {isCompleted && (

                      <div
                        style={
                          s.completedFlagAnime
                        }
                      >
                        🏆 VENCIDA 🏆
                      </div>
                    )}

                  </div>


                  <div
                    style={
                      s.leagueReqsAnime
                    }
                  >

                    <div
                      style={
                        s.speedLines
                      }
                    />

                    {meetsRequirement ? (

                      <div
                        style={
                          s.reqMetAnime
                        }
                      >
                        ✅ REQUISITO OVR{" "}
                        {
                          league.requiredOverall
                        }{" "}
                        ✅
                      </div>

                    ) : (

                      <div
                        style={
                          s.reqMissingAnime
                        }
                      >
                        🔒 NECESITAS OVR{" "}
                        {
                          league.requiredOverall
                        }{" "}
                        🔒
                      </div>
                    )}

                  </div>


                  <div
                    style={
                      s.rewardsAnime
                    }
                  >

                    <div
                      style={
                        s.rewardChipAnime
                      }
                    >
                      ✨ +{
                        league.rewardXp
                      }{" "}
                      EXPERIENCIA
                    </div>

                    <div
                      style={
                        s.rewardChipAnime
                      }
                    >
                      💰 +{
                        league.rewardPoints
                      }{" "}
                      PUNTOS
                    </div>

                    {league.rewardTitle && (

                      <div
                        style={
                          s.rewardChipAnimeSpecial
                        }
                      >
                        🏷️{" "}
                        {
                          league.rewardTitle
                        }
                      </div>
                    )}

                  </div>


                  {/* MATCHES */}

                  {isCurrent && (

                    <div
                      style={
                        s.matchesListAnime
                      }
                    >

                      <div
                        style={
                          s.matchesHeaderAnime
                        }
                      >

                        <span>
                          ⚔️ COMBATES DE LA LIGA ⚔️
                        </span>

                        <span
                          style={
                            s.matchesHint
                          }
                        >
                          ¡Gana los 3 para el título!
                        </span>

                      </div>


                      {league.bots.map(
                        (
                          bot,
                          matchIdx
                        ) => {

                          const isMatchCompleted =
                            matchProgress.get(
                              `${league.id}_${matchIdx}`
                            ) === true;


                          const previousCompleted =
                            matchIdx === 0
                              ? true
                              : matchProgress.get(
                                  `${league.id}_${matchIdx - 1}`
                                ) === true;


                          const isUnlocked =
                            previousCompleted ||
                            isMatchCompleted;


                          const isCurrentMatch =
                            !isMatchCompleted &&
                            isUnlocked;


                          let matchCardStyle =
                            {
                              ...s.matchCardAnime,
                            };


                          if (
                            isCurrentMatch
                          ) {

                            matchCardStyle =
                              {
                                ...matchCardStyle,
                                ...s.matchCurrentAnime,
                              };
                          }


                          if (
                            isMatchCompleted
                          ) {

                            matchCardStyle =
                              {
                                ...matchCardStyle,
                                ...s.matchCompletedAnime,
                              };
                          }


                          const difficultyIcon =
                            bot.difficulty ===
                            "easy"
                              ? "⭐"
                              : bot.difficulty ===
                                "medium"
                              ? "⚡"
                              : "🔥";


                          const difficultyName =
                            bot.difficulty ===
                            "easy"
                              ? "PRINCIPIANTE"
                              : bot.difficulty ===
                                "medium"
                              ? "DESAFÍO"
                              : "LEYENDA";


                          const difficultyColor =
                            bot.difficulty ===
                            "easy"
                              ? "#4ade80"
                              : bot.difficulty ===
                                "medium"
                              ? "#fbbf24"
                              : "#ff4444";


                          return (

                            <div
                              key={
                                matchIdx
                              }

                              style={
                                matchCardStyle
                              }
                            >

                              <div
                                style={
                                  s.matchNumberAnime
                                }
                              >
                                {
                                  isMatchCompleted
                                    ? "🏆"
                                    : matchIdx + 1
                                }
                              </div>


                              <div
                                style={
                                  s.matchInfoAnime
                                }
                              >

                                <div
                                  style={
                                    s.opponentAnime
                                  }
                                >

                                  <span
                                    style={
                                      s.avatarAnime
                                    }
                                  >
                                    {
                                      bot.avatar
                                    }
                                  </span>


                                  <div>

                                    <div
                                      style={
                                        s.opponentNameAnime
                                      }
                                    >
                                      {
                                        bot.name
                                      }
                                    </div>


                                    <div
                                      style={{
                                        ...s.difficultyAnime,
                                        color:
                                          difficultyColor,
                                      }}
                                    >
                                      {
                                        difficultyIcon
                                      }{" "}
                                      {
                                        difficultyName
                                      }
                                    </div>

                                  </div>

                                </div>


                                <div
                                  style={
                                    s.rewardXpAnime
                                  }
                                >
                                  +{
                                    bot.xpBase
                                  }{" "}
                                  XP
                                </div>

                              </div>


                              {isCurrentMatch &&
                                !isMatchCompleted && (

                                  <button
                                    style={
                                      s.playButtonAnime
                                    }

                                    onClick={() =>
                                      startMatchWithStory(
                                        league,
                                        matchIdx
                                      )
                                    }
                                  >
                                    ⚽ JUGAR ⚽
                                  </button>
                              )}


                              {isMatchCompleted && (

                                <div
                                  style={
                                    s.victoryMarkAnime
                                  }
                                >
                                  ✨ VICTORIA ✨
                                </div>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                </div>
              </div>
            );
          }
        )}

      </div>


      {/* ───────────────── DAILY MISSIONS MODAL ───────────────── */}

      {showMissions && (

        <div
          style={
            s.missionsOverlay
          }

          onClick={() =>
            setShowMissions(
              false
            )
          }
        >

          <div
            style={
              s.missionsModal
            }

            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              style={
                s.missionsModalHeader
              }
            >

              <div>
                ⚔️ MISIONES DIARIAS
              </div>


              <button
                style={
                  s.closeButton
                }

                onClick={() =>
                  setShowMissions(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>


            <DailyMissionsPanel
              missions={
                currentMissions
              }

              onClaimReward={
                handleClaimReward
              }

              onStartMission={
                handleStartMission
              }

              currentDay={
                currentDay
              }
            />

          </div>

        </div>
      )}


      {/* ───────────────── TRAINING CENTER ───────────────── */}

      {showTrainingCenter && (

        <TrainingCenter

          userId={
            userId
          }

          userCards={
            userCards
          }

          deckCards={
            userDeck?.cards ||
            []
          }

          onCardsUpdated={(
            updatedCards
          ) =>
            onBattleComplete(
              updatedCards
            )
          }

          onClose={() =>
            setShowTrainingCenter(
              false
            )
          }

          isDevMode={
            isDevMode
          }
        />
      )}


      {/* ───────────────── GUIDE MODAL ───────────────── */}

      {showGuideModal && (

        <div
          style={
            s.guideOverlay
          }
        >

          <div
            style={
              s.guideModal
            }
          >

            <div
              style={
                s.guideHeader
              }
            >

              <div>

                <div
                  style={
                    s.guideMini
                  }
                >
                  STORY GUIDE
                </div>

                <div
                  style={
                    s.guideTitle
                  }
                >
                  📘 MANUAL DEL JUEGO
                </div>

              </div>


              <button
                style={
                  s.closeGuide
                }

                onClick={() =>
                  setShowGuideModal(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>


            <div
              style={
                s.guideSteps
              }
            >

              {[
                {
                  step: "01",
                  icon: "🎮",
                  title: "ELEGÍ UN RIVAL",
                  desc: "Seleccioná un partido para comenzar tu camino.",
                },
                {
                  step: "02",
                  icon: "⚽",
                  title: "GANÁ PARTIDOS",
                  desc: "Usá tus cartas y derrotá a tus oponentes.",
                },
                {
                  step: "03",
                  icon: "⭐",
                  title: "SUBÍ DE LIGA",
                  desc: "Conseguí estrellas y desbloqueá nuevos desafíos.",
                },
                {
                  step: "04",
                  icon: "🏆",
                  title: "CONVERTITE EN LEYENDA",
                  desc: "Dominá todas las ligas y convertite en campeón.",
                },
              ].map(
                (
                  item
                ) => (

                  <div
                    key={
                      item.step
                    }

                    style={
                      s.guideStepCard
                    }
                  >

                    <div
                      style={
                        s.guideStepTop
                      }
                    >

                      <div
                        style={
                          s.guideStepBadge
                        }
                      >
                        {
                          item.step
                        }
                      </div>


                      <div
                        style={
                          s.guideStepIcon
                        }
                      >
                        {
                          item.icon
                        }
                      </div>

                    </div>


                    <div
                      style={
                        s.guideStepTitle
                      }
                    >
                      {
                        item.title
                      }
                    </div>


                    <div
                      style={
                        s.guideStepDesc
                      }
                    >
                      {
                        item.desc
                      }
                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>
      )}


      {/* ───────────────── REWARD POPUP ───────────────── */}

      {showRewards &&
        lastReward && (

          <div
            style={
              s.rewardPopupAnime
            }
          >

            <div
              style={
                s.rewardContentAnime
              }
            >

              <div
                style={
                  s.rewardExplosionAnime
                }
              >
                💥
              </div>


              <div
                style={
                  s.rewardTextAnime
                }
              >

                {
                  lastReward.type ===
                  "league_complete"

                    ? "🏆 ¡LIGA CONQUISTADA! 🏆"

                    : lastReward.type ===
                      "mission_reward"

                    ? "🎁 ¡RECOMPENSA! 🎁"

                    : lastReward.type ===
                      "pack_opened"

                    ? "📦 ¡SOBRE LEGENDARIO! 📦"

                    : "🎉 ¡PARTIDAZO! 🎉"
                }


                <div
                  style={
                    s.rewardAmountAnime
                  }
                >
                  +{
                    lastReward.value
                  }
                </div>

              </div>


              <div
                style={
                  s.rewardGlintAnime
                }
              >
                ✨
              </div>

            </div>

          </div>
        )}

    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// KEYFRAMES
// ─────────────────────────────────────────────────────────────────────────────

const keyframesAnime = `
  @keyframes animePulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
    }

    70% {
      transform: scale(1.02);
      box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
    }

    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
    }
  }

  @keyframes fireText {
    0% {
      text-shadow:
        0 0 2px #00ffff,
        0 0 4px #0088ff;
    }

    100% {
      text-shadow:
        0 0 8px #00ccff,
        0 0 16px #0066ff;
    }
  }

  @keyframes sparkMove {
    0% {
      left: 0%;
      opacity: 1;
    }

    100% {
      left: 100%;
      opacity: 0;
    }
  }

  @keyframes floatReward {
    0% {
      transform:
        translateY(0px)
        scale(1);

      opacity: 0;
    }

    20% {
      transform:
        translateY(-20px)
        scale(1.2);

      opacity: 1;
    }

    80% {
      transform:
        translateY(-10px)
        scale(1);

      opacity: 1;
    }

    100% {
      transform:
        translateY(20px)
        scale(.8);

      opacity: 0;
    }
  }

  @keyframes cmSpin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes shineMove {
    0% {
      left: -120px;
    }

    100% {
      left: 100%;
    }
  }
`;


// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s: Record<
  string,
  CSSProperties
> = {

  // ───────────────── LOADING ─────────────────

  loadingScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",

    minHeight: "100vh",

    background:
      `
      radial-gradient(
        circle at top,
        rgba(0,180,255,0.15),
        transparent 30%
      ),

      linear-gradient(
        180deg,
        #050816 0%,
        #091224 40%,
        #050816 100%
      )
      `,

    textAlign: "center",

    overflow: "hidden",

    fontFamily: RUSSO,
  },


  spinner: {
    width: 70,
    height: 70,

    border:
      "5px solid rgba(255,255,255,0.08)",

    borderTop:
      "5px solid #00d9ff",

    borderRadius: "50%",

    boxShadow:
      `
      0 0 20px rgba(0,217,255,.5),
      inset 0 0 15px rgba(0,217,255,.2)
      `,

    animation:
      "cmSpin 1s linear infinite",
  },


  // ───────────────── CONTAINER ─────────────────

  container: {
    position: "relative",

    minHeight: "100vh",

    overflow: "hidden",

    padding:
      "16px 14px 120px",

    background:
      `
      radial-gradient(
        circle at top,
        rgba(0,180,255,0.16),
        transparent 30%
      ),

      linear-gradient(
        180deg,
        #040816 0%,
        #07101f 40%,
        #03060f 100%
      )
      `,

    fontFamily: RUSSO,

    color: "#fff",
  },


  // ───────────────── BACKGROUND ─────────────────

  energyBg1: {
    position: "absolute",

    top: -180,
    left: -120,

    width: 500,
    height: 500,

    borderRadius: "50%",

    background:
      "rgba(0,170,255,0.18)",

    filter:
      "blur(120px)",

    zIndex: 0,
  },


  energyBg2: {
    position: "absolute",

    bottom: -240,
    right: -100,

    width: 450,
    height: 450,

    borderRadius: "50%",

    background:
      "rgba(255,170,0,0.14)",

    filter:
      "blur(120px)",

    zIndex: 0,
  },


  gridOverlay: {
    position: "absolute",

    inset: 0,

    background:
      `
      linear-gradient(
        rgba(255,255,255,0.025) 1px,
        transparent 1px
      ),

      linear-gradient(
        90deg,
        rgba(255,255,255,0.025) 1px,
        transparent 1px
      )
      `,

    backgroundSize:
      "42px 42px",

    opacity: 0.25,

    pointerEvents: "none",
  },


  // ───────────────── HEADER ─────────────────

  headerAnime: {
    position: "relative",

    zIndex: 2,

    overflow: "hidden",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: 18,

    padding: 20,

    borderRadius: 28,

    background:
      `
      linear-gradient(
        180deg,
        rgba(10,25,55,.98),
        rgba(5,10,22,.98)
      )
      `,

    border:
      "2px solid rgba(0,210,255,.35)",

    boxShadow:
      `
      0 10px 40px rgba(0,0,0,.45),
      0 0 30px rgba(0,180,255,.18),
      inset 0 1px 0 rgba(255,255,255,.06)
      `,

    marginBottom: 18,
  },


  headerGlow: {
    position: "absolute",

    top: -100,
    right: -80,

    width: 260,
    height: 260,

    borderRadius: "50%",

    background:
      "rgba(0,180,255,.22)",

    filter:
      "blur(90px)",
  },


  headerLines: {
    position: "absolute",

    inset: 0,

    background:
      `
      repeating-linear-gradient(
        135deg,
        transparent 0px,
        transparent 12px,
        rgba(255,255,255,.03) 13px
      )
      `,

    opacity: 0.4,
  },


  titleGroupAnime: {
    display: "flex",

    alignItems: "center",

    gap: 16,

    zIndex: 2,
  },


  logoCircle: {
    width: 76,
    height: 76,

    borderRadius: "50%",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: 38,

    background:
      "linear-gradient(135deg,#00c6ff,#0047ff)",

    border:
      "3px solid rgba(255,255,255,.8)",

    boxShadow:
      `
      0 0 25px rgba(0,200,255,.65),
      inset 0 0 20px rgba(255,255,255,.2)
      `,

    animation:
      "animePulse 2s infinite",
  },


  storyBadge: {
    display: "inline-block",

    padding:
      "5px 12px",

    borderRadius: 999,

    background: "#00d9ff",

    color: "#001018",

    fontSize: 10,

    fontWeight: 900,

    letterSpacing: 1.5,

    marginBottom: 8,

    boxShadow:
      "0 0 18px rgba(0,217,255,.45)",
  },


  mainTitleAnime: {
    margin: 0,

    fontSize: 38,

    lineHeight: 1,

    fontWeight: 900,

    letterSpacing: 3,

    color: "#fff",

    textShadow:
      `
      0 0 10px #00c3ff,
      0 0 30px rgba(0,195,255,.6)
      `,
  },


  mainSubAnime: {
    marginTop: 8,

    fontSize: 11,

    letterSpacing: 2,

    color: "#d9f7ff",

    opacity: 0.9,
  },


  // ───────────────── STATS ─────────────────

  statsPanel: {
    display: "flex",

    gap: 10,

    zIndex: 2,
  },


  statCardBlue: {
    minWidth: 92,

    padding:
      "12px 14px",

    borderRadius: 22,

    background:
      `
      linear-gradient(
        180deg,
        rgba(0,180,255,.2),
        rgba(0,70,255,.16)
      )
      `,

    border:
      "2px solid rgba(0,220,255,.35)",

    textAlign: "center",

    boxShadow:
      "0 0 18px rgba(0,180,255,.18)",
  },


  statCardFire: {
    minWidth: 92,

    padding:
      "12px 14px",

    borderRadius: 22,

    background:
      `
      linear-gradient(
        180deg,
        rgba(255,140,0,.22),
        rgba(255,50,0,.14)
      )
      `,

    border:
      "2px solid rgba(255,140,0,.35)",

    textAlign: "center",

    boxShadow:
      "0 0 18px rgba(255,120,0,.2)",
  },


  statTop: {
    fontSize: 22,

    marginBottom: 6,
  },


  statNumber: {
    fontSize: 28,

    fontWeight: 900,
  },


  statText: {
    marginTop: 5,

    fontSize: 9,

    letterSpacing: 2,

    color: "#d7f7ff",
  },


  // ───────────────── POWER BAR ─────────────────

  powerWrapper: {
    position: "relative",

    zIndex: 2,

    marginBottom: 20,
  },


  powerHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    marginBottom: 8,

    fontSize: 11,

    fontWeight: 900,

    letterSpacing: 1.5,

    color: "#8cefff",
  },


  powerTrackAnime: {
    position: "relative",

    overflow: "hidden",

    height: 20,

    borderRadius: 999,

    background: "#071120",

    border:
      "2px solid rgba(0,220,255,.3)",

    boxShadow:
      `
      inset 0 0 15px rgba(0,0,0,.8),
      0 0 15px rgba(0,180,255,.15)
      `,
  },


  powerFillAnime: {
    height: "100%",

    borderRadius: 999,

    background:
      `
      linear-gradient(
        90deg,
        #00c6ff,
        #0072ff,
        #00e1ff
      )
      `,

    boxShadow:
      "0 0 20px rgba(0,200,255,.8)",

    transition:
      "width .6s ease",
  },


  powerShine: {
    position: "absolute",

    top: 0,

    left: -120,

    width: 120,

    height: "100%",

    background:
      `
      linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.45),
        transparent
      )
      `,

    transform:
      "skewX(-20deg)",

    animation:
      "shineMove 2s infinite",
  },


  // ───────────────── TRAINING BUTTON ─────────────────

  trainingCenterButton: {
    position: "relative",

    overflow: "hidden",

    zIndex: 2,

    width: "100%",

    border: "none",

    borderRadius: 999,

    padding:
      "16px 20px",

    background:
      "linear-gradient(180deg,#00c6ff,#006dff)",

    color: "#fff",

    fontSize: 14,

    fontWeight: 900,

    letterSpacing: 2,

    cursor: "pointer",

    fontFamily: RUSSO,

    marginBottom: 16,

    boxShadow:
      `
      0 6px 0 #003e9c,
      0 0 25px rgba(0,180,255,.35)
      `,

    textTransform:
      "uppercase",

    transition: ".15s",
  },


  // ───────────────── STORY BUTTON ─────────────────

  storyButtonContainer: {
    marginBottom: 18,

    textAlign: "center",

    zIndex: 2,

    position: "relative",
  },


  storyButton: {
    position: "relative",

    overflow: "hidden",

    border: "none",

    padding:
      "14px 24px",

    borderRadius: 999,

    background:
      "linear-gradient(180deg,#8f5cff,#5b36ff)",

    color: "#fff",

    fontWeight: 900,

    fontSize: 13,

    letterSpacing: 1.5,

    cursor: "pointer",

    fontFamily: RUSSO,

    boxShadow:
      `
      0 5px 0 #3f1fbd,
      0 0 20px rgba(120,80,255,.35)
      `,
  },


  // ───────────────── DAILY MISSIONS ─────────────────

  streakIndicator: {
    position: "relative",

    overflow: "hidden",

    zIndex: 2,

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: 10,

    padding:
      "14px 18px",

    borderRadius: 24,

    background:
      `
      linear-gradient(
        180deg,
        rgba(255,140,0,.22),
        rgba(255,60,0,.16)
      )
      `,

    border:
      "2px solid rgba(255,150,0,.3)",

    fontSize: 12,

    fontWeight: 900,

    margin:
      "18px 0",

    boxShadow:
      "0 0 22px rgba(255,120,0,.18)",
  },


  // ───────────────── WORLD MAP ─────────────────

  worldMap: {
    display: "flex",

    flexDirection:
      "column",

    gap: 22,

    position: "relative",

    zIndex: 2,
  },


  leagueNode: {
    position: "relative",
  },


  pathConnector: {
    width: 4,

    height: 34,

    margin:
      "0 auto",

    borderRadius: 999,

    background:
      "linear-gradient(180deg,#00d9ff,transparent)",

    boxShadow:
      "0 0 12px rgba(0,217,255,.55)",
  },


  // ───────────────── LEAGUE CARD ─────────────────

  leagueCardAnime: {
    position: "relative",

    overflow: "hidden",

    background:
      `
      linear-gradient(
        180deg,
        rgba(10,18,38,.98),
        rgba(3,7,16,.98)
      )
      `,

    borderRadius: 28,

    padding: 20,

    border:
      "2px solid rgba(0,180,255,.14)",

    boxShadow:
      `
      0 12px 30px rgba(0,0,0,.5),
      0 0 25px rgba(0,180,255,.08),
      inset 0 1px 0 rgba(255,255,255,.05)
      `,

    backdropFilter:
      "blur(10px)",

    transition:
      "all .25s ease",
  },


  speedLines: {
    position: "absolute",

    inset: 0,

    background:
      `
      repeating-linear-gradient(
        135deg,
        transparent 0px,
        transparent 12px,
        rgba(255,255,255,.025) 13px
      )
      `,

    opacity: 0.4,

    pointerEvents: "none",
  },


  leagueCompletedAnime: {
    border:
      "2px solid #00ff9d",

    boxShadow:
      `
      0 0 25px rgba(0,255,157,.25),
      0 10px 25px rgba(0,0,0,.45)
      `,
  },


  leagueCurrentAnime: {
    border:
      "2px solid #00d9ff",

    boxShadow:
      `
      0 0 30px rgba(0,217,255,.35),
      0 0 60px rgba(0,217,255,.16)
      `,

    animation:
      "animePulse 2s infinite",
  },


  leagueLockedAnime: {
    opacity: 0.45,

    filter:
      "grayscale(.8)",
  },


  leagueHeaderAnime: {
    display: "flex",

    alignItems: "center",

    gap: 14,

    marginBottom: 16,

    position: "relative",

    zIndex: 2,
  },


  leagueIconAnime: {
    fontSize: 52,

    filter:
      "drop-shadow(0 0 10px rgba(255,255,255,.3))",
  },


  leagueNameAnime: {
    fontSize: 24,

    fontWeight: 900,

    letterSpacing: 1.5,
  },


  currentFlagAnime: {
    padding:
      "5px 12px",

    borderRadius: 999,

    background:
      "linear-gradient(90deg,#00d9ff,#006dff)",

    color: "#fff",

    fontSize: 9,

    fontWeight: 900,

    letterSpacing: 1.5,

    boxShadow:
      "0 0 15px rgba(0,217,255,.45)",
  },


  completedFlagAnime: {
    padding:
      "5px 12px",

    borderRadius: 999,

    background:
      "linear-gradient(90deg,#00ff9d,#00d67f)",

    color: "#00170e",

    fontSize: 9,

    fontWeight: 900,

    letterSpacing: 1.5,

    boxShadow:
      "0 0 15px rgba(0,255,157,.45)",
  },


  // ───────────────── REQUIREMENTS ─────────────────

  leagueReqsAnime: {
    position: "relative",

    marginBottom: 14,

    padding: 10,

    borderRadius: 14,

    background:
      "rgba(255,255,255,.03)",
  },


  reqMetAnime: {
    color: "#00ff9d",

    fontSize: 11,

    fontWeight: 900,
  },


  reqMissingAnime: {
    color: "#ff7070",

    fontSize: 11,

    fontWeight: 900,
  },


  // ───────────────── REWARDS ─────────────────

  rewardsAnime: {
    display: "flex",

    flexWrap: "wrap",

    gap: 8,

    marginBottom: 10,
  },


  rewardChipAnime: {
    padding:
      "7px 10px",

    borderRadius: 999,

    background:
      "rgba(0,217,255,.08)",

    border:
      "1px solid rgba(0,217,255,.18)",

    color: "#8cefff",

    fontSize: 9,

    fontWeight: 900,
  },


  rewardChipAnimeSpecial: {
    padding:
      "7px 10px",

    borderRadius: 999,

    background:
      "rgba(255,215,0,.1)",

    border:
      "1px solid rgba(255,215,0,.25)",

    color: "#ffd93d",

    fontSize: 9,

    fontWeight: 900,
  },


  // ───────────────── MATCHES ─────────────────

  matchesListAnime: {
    marginTop: 18,

    borderTop:
      "1px solid rgba(255,255,255,.08)",

    paddingTop: 18,
  },


  matchesHeaderAnime: {
    display: "flex",

    justifyContent:
      "space-between",

    marginBottom: 12,

    fontSize: 11,

    color: "#8cefff",
  },


  matchesHint: {
    color:
      "rgba(255,255,255,.45)",

    fontSize: 9,
  },


  matchCardAnime: {
    position: "relative",

    overflow: "hidden",

    display: "flex",

    alignItems: "center",

    gap: 12,

    padding: 14,

    borderRadius: 24,

    marginBottom: 12,

    background:
      `
      linear-gradient(
        180deg,
        rgba(255,255,255,.03),
        rgba(255,255,255,.01)
      )
      `,

    border:
      "1px solid rgba(255,255,255,.06)",

    transition: ".2s",
  },


  matchCurrentAnime: {
    border:
      "2px solid #ffd93d",

    boxShadow:
      "0 0 20px rgba(255,210,0,.28)",
  },


  matchCompletedAnime: {
    opacity: 0.72,
  },


  matchNumberAnime: {
    width: 48,

    height: 48,

    borderRadius: "50%",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background:
      "linear-gradient(180deg,#00c6ff,#0047ff)",

    boxShadow:
      "0 0 18px rgba(0,180,255,.3)",

    fontWeight: 900,
  },


  matchInfoAnime: {
    flex: 1,

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",
  },


  opponentAnime: {
    display: "flex",

    alignItems: "center",

    gap: 12,
  },


  avatarAnime: {
    fontSize: 34,
  },


  opponentNameAnime: {
    fontWeight: 900,

    fontSize: 14,
  },


  difficultyAnime: {
    fontSize: 10,

    marginTop: 3,
  },


  rewardXpAnime: {
    color: "#ffd93d",

    fontSize: 12,

    fontWeight: 900,
  },


  playButtonAnime: {
    position: "relative",

    overflow: "hidden",

    background:
      "linear-gradient(180deg,#ffd93d,#ff9800)",

    border: "none",

    padding:
      "10px 22px",

    borderRadius: 999,

    fontWeight: 900,

    color: "#111",

    fontFamily: RUSSO,

    cursor: "pointer",

    letterSpacing: 1.5,

    boxShadow:
      `
      0 4px 0 #b96a00,
      0 0 18px rgba(255,180,0,.45)
      `,

    transform:
      "translateY(-2px)",

    transition: ".15s",
  },


  victoryMarkAnime: {
    fontSize: 11,

    color: "#00ff9d",

    fontWeight: 900,

    letterSpacing: 1,
  },


  // ───────────────── MANUAL ─────────────────

  manualCard: {
    position: "relative",

    overflow: "hidden",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    padding:
      "18px 20px",

    borderRadius: 28,

    marginTop: 20,

    background:
      `
      linear-gradient(
        135deg,
        rgba(0,18,40,.95),
        rgba(0,6,20,.98)
      )
      `,

    border:
      "2px solid rgba(0,220,255,.15)",

    boxShadow:
      `
      0 0 30px rgba(0,180,255,.10),
      inset 0 0 20px rgba(255,255,255,.03)
      `,
  },


  manualGlow: {
    position: "absolute",

    top: -40,

    right: -40,

    width: 120,

    height: 120,

    borderRadius: "50%",

    background:
      "rgba(0,180,255,.18)",

    filter:
      "blur(40px)",
  },


  manualLeft: {
    display: "flex",

    alignItems: "center",

    gap: 16,

    zIndex: 2,
  },


  manualIcon: {
    width: 60,

    height: 60,

    borderRadius: 20,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: 30,

    background:
      "linear-gradient(180deg,#00c6ff,#0047ff)",

    boxShadow:
      "0 0 20px rgba(0,180,255,.4)",
  },


  manualTitle: {
    fontSize: 15,

    fontWeight: 900,

    letterSpacing: 1.5,

    color: "#fff",
  },


  manualDesc: {
    marginTop: 4,

    fontSize: 11,

    color:
      "rgba(255,255,255,.65)",
  },


  manualButton: {
    position: "relative",

    zIndex: 2,

    border: "none",

    padding:
      "12px 22px",

    borderRadius: 999,

    fontWeight: 900,

    letterSpacing: 1,

    color: "#001018",

    cursor: "pointer",

    background:
      "linear-gradient(180deg,#00e1ff,#00a2ff)",

    boxShadow:
      "0 0 18px rgba(0,220,255,.45)",
  },


  // ───────────────── GUIDE ─────────────────

  guideOverlay: {
    position: "fixed",

    inset: 0,

    zIndex: 99999,

    background:
      "rgba(0,0,0,.75)",

    backdropFilter:
      "blur(10px)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: 20,
  },


  guideModal: {
    width: "100%",

    maxWidth: 520,

    maxHeight: "90vh",

    overflowY: "auto",

    borderRadius: 36,

    padding: 24,

    background:
      `
      linear-gradient(
        180deg,
        #07111d,
        #02060c
      )
      `,

    border:
      "2px solid rgba(0,220,255,.15)",

    boxShadow:
      "0 0 50px rgba(0,180,255,.18)",
  },


  guideHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    marginBottom: 24,
  },


  guideMini: {
    fontSize: 10,

    letterSpacing: 2,

    color: "#00d2ff",

    marginBottom: 6,
  },


  guideTitle: {
    fontSize: 26,

    fontWeight: 900,

    color: "#fff",
  },


  closeGuide: {
    width: 44,

    height: 44,

    borderRadius: "50%",

    border: "none",

    cursor: "pointer",

    fontSize: 18,

    color: "#fff",

    background:
      "rgba(255,255,255,.08)",
  },


  guideSteps: {
    display: "flex",

    flexDirection:
      "column",

    gap: 16,
  },


  guideStepCard: {
    padding: 18,

    borderRadius: 24,

    background:
      `
      linear-gradient(
        180deg,
        rgba(255,255,255,.05),
        rgba(255,255,255,.02)
      )
      `,

    border:
      "1px solid rgba(255,255,255,.08)",
  },


  guideStepTop: {
    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginBottom: 16,
  },


  guideStepBadge: {
    padding:
      "6px 12px",

    borderRadius: 999,

    fontSize: 12,

    fontWeight: 900,

    background:
      "linear-gradient(180deg,#00c6ff,#0047ff)",
  },


  guideStepIcon: {
    fontSize: 34,
  },


  guideStepTitle: {
    fontSize: 15,

    fontWeight: 900,

    color: "#fff",
  },


  guideStepDesc: {
    marginTop: 6,

    fontSize: 12,

    lineHeight: 1.5,

    color:
      "rgba(255,255,255,.65)",
  },


  // ───────────────── REWARD ─────────────────

  rewardPopupAnime: {
    position: "fixed",

    inset: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    zIndex: 9999,

    pointerEvents: "none",
  },


  rewardContentAnime: {
    position: "relative",

    overflow: "hidden",

    padding:
      "24px 40px",

    borderRadius: 32,

    display: "flex",

    alignItems: "center",

    gap: 20,

    background:
      `
      linear-gradient(
        135deg,
        rgba(0,20,60,.95),
        rgba(0,0,0,.96)
      )
      `,

    border:
      "3px solid #00d9ff",

    boxShadow:
      `
      0 0 40px rgba(0,217,255,.4),
      0 0 120px rgba(0,217,255,.12)
      `,

    animation:
      "floatReward 2s ease-out forwards",
  },


  rewardExplosionAnime: {
    fontSize: 46,
  },


  rewardTextAnime: {
    textAlign: "center",

    fontSize: 22,

    fontWeight: 900,
  },


  rewardAmountAnime: {
    marginTop: 8,

    fontSize: 34,

    color: "#ffd93d",

    textShadow:
      "0 0 18px rgba(255,217,61,.6)",
  },


  rewardGlintAnime: {
    fontSize: 38,
  },


  // ───────────────── MISSIONS MODAL ─────────────────

  missionsOverlay: {
    position: "fixed",

    inset: 0,

    background:
      "rgba(0,0,0,.82)",

    backdropFilter:
      "blur(8px)",

    zIndex: 9999,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: 18,
  },


  missionsModal: {
    width: "100%",

    maxWidth: 520,

    maxHeight: "90vh",

    overflowY: "auto",

    borderRadius: 34,

    background:
      "linear-gradient(180deg,#07111d,#04070f)",

    border:
      "1px solid rgba(0,220,255,.25)",

    padding: 18,

    boxShadow:
      "0 0 50px rgba(0,180,255,.25)",
  },


  missionsModalHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    marginBottom: 16,

    color: "#fff",

    fontWeight: 900,

    fontSize: 22,
  },


  closeButton: {
    width: 42,

    height: 42,

    borderRadius: "50%",

    border: "none",

    cursor: "pointer",

    background:
      "linear-gradient(135deg,#ff4d4d,#ff0055)",

    color: "#fff",

    fontSize: 18,

    fontWeight: 900,
  },


  // ───────────────── STORY NOTIFICATION ─────────────────

  storyNotification: {
    position: "fixed",

    top: 24,

    left: "50%",

    transform:
      "translateX(-50%)",

    zIndex: 9998,

    width: "min(92vw, 520px)",

    padding: 16,

    borderRadius: 20,

    background:
      "rgba(0,12,28,.96)",

    border:
      "1px solid rgba(0,217,255,.3)",

    boxShadow:
      "0 0 30px rgba(0,180,255,.2)",

    pointerEvents: "none",
  },


  storyNotificationContent: {
    color: "#fff",

    fontSize: 12,

    lineHeight: 1.5,

    textAlign: "center",
  },
};