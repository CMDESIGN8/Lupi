import { useCallback, useEffect, useMemo, useState } from "react";
import type { DailyMission, CampaignDay } from "../types/campaignStory";
import { CLUB_STORY } from "../data/campaignStoryData";

const MISSIONS_VERSION = 2;

const STORAGE_KEY = (userId: string) =>
  `campaign_days_${userId}_v${MISSIONS_VERSION}`;

const DATE_KEY = (userId: string) =>
  `last_played_${userId}`;

const EVENT_NAME = "lupi:daily-missions-updated";


type MissionUpdateDetail = {
  userId: string;
  days: CampaignDay[];
};

export function useDailyMissions(userId: string) {
  const [campaignDays, setCampaignDays] =
    useState<CampaignDay[]>(CLUB_STORY);

  const [currentDay, setCurrentDay] = useState(1);
  const [lastPlayedDate, setLastPlayedDate] = useState<string | null>(null);

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const saveCampaignDays = useCallback(
    (days: CampaignDay[]) => {
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(days));

      window.dispatchEvent(
        new CustomEvent<MissionUpdateDetail>(EVENT_NAME, {
          detail: {
            userId,
            days,
          },
        })
      );
    },
    [userId]
  );

  // --------------------------------------------------
  // LOAD
  // --------------------------------------------------

  const loadCampaignDays = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY(userId));

    if (!saved) {
      setCampaignDays(CLUB_STORY);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as CampaignDay[];

      if (Array.isArray(parsed)) {
        setCampaignDays(parsed);
      } else {
        setCampaignDays(CLUB_STORY);
      }
    } catch (error) {
      console.error("Error loading campaign days:", error);
      setCampaignDays(CLUB_STORY);
    }
  }, [userId]);

  // --------------------------------------------------
  // DAILY RESET
  // --------------------------------------------------

  const resetDailyMissions = useCallback(() => {
    setCampaignDays((previousDays) => {
      const updatedDays = previousDays.map((day) => ({
        ...day,
        dailyMissions: day.dailyMissions.map((mission) => ({
          ...mission,
          currentProgress: 0,
          isCompleted: false,
          isClaimed: false,
        })),
      }));

      saveCampaignDays(updatedDays);

      return updatedDays;
    });
  }, [saveCampaignDays]);

  const checkDailyReset = useCallback(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(DATE_KEY(userId));

    // Primera vez: no reseteamos nada.
    // Simplemente establecemos la fecha.
    if (!storedDate) {
      localStorage.setItem(DATE_KEY(userId), today);
      setLastPlayedDate(today);
      return;
    }

    // Mismo día: no hacemos nada.
    if (storedDate === today) {
      setLastPlayedDate(today);
      return;
    }

    // Nuevo día.
    resetDailyMissions();

    localStorage.setItem(DATE_KEY(userId), today);
    setLastPlayedDate(today);
  }, [userId, resetDailyMissions]);

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadCampaignDays();
    checkDailyReset();
  }, [loadCampaignDays, checkDailyReset]);

  // --------------------------------------------------
  // SYNC BETWEEN COMPONENTS
  // --------------------------------------------------

  useEffect(() => {
    const handleMissionUpdate = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<MissionUpdateDetail>;

      if (!customEvent.detail) return;

      if (customEvent.detail.userId !== userId) return;

      setCampaignDays(customEvent.detail.days);
    };

    window.addEventListener(
      EVENT_NAME,
      handleMissionUpdate
    );

    return () => {
      window.removeEventListener(
        EVENT_NAME,
        handleMissionUpdate
      );
    };
  }, [userId]);

  // --------------------------------------------------
  // CROSS-TAB SYNC
  // --------------------------------------------------

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY(userId)) return;

      loadCampaignDays();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [userId, loadCampaignDays]);

  // --------------------------------------------------
  // CURRENT MISSIONS
  // --------------------------------------------------

  const currentMissions = useMemo(
    () =>
      campaignDays[currentDay - 1]?.dailyMissions ?? [],
    [campaignDays, currentDay]
  );

  // --------------------------------------------------
  // NEXT MISSION
  // --------------------------------------------------

  const nextMission = useMemo(() => {
    return (
      currentMissions.find(
        (mission) =>
          !mission.isCompleted ||
          !mission.isClaimed
      ) ??
      currentMissions[0] ??
      null
    );
  }, [currentMissions]);

  // --------------------------------------------------
  // LOBBY MISSION
  // --------------------------------------------------

  const lobbyMission = useMemo(() => {
  // 1. Si hay una recompensa pendiente de reclamar,
  //    mostrarla primero.
  const rewardReady = currentMissions.find(
    (mission) =>
      mission.isCompleted &&
      !mission.isClaimed
  );

  if (rewardReady) {
    return rewardReady;
  }

  // 2. Si no hay recompensa pendiente,
  //    mostrar la siguiente misión.
  const nextPending = currentMissions.find(
    (mission) => !mission.isCompleted
  );

  if (nextPending) {
    return nextPending;
  }

  // 3. Todas las misiones completadas y reclamadas.
  return currentMissions[0] ?? null;
}, [currentMissions]);

  // --------------------------------------------------
  // PROGRESS
  // --------------------------------------------------

  const updateMissionProgress = useCallback(
    (
      missionType: string,
      amount = 1
    ) => {
      setCampaignDays((previousDays) => {
        const updatedDays = previousDays.map(
          (day) => ({
            ...day,
            dailyMissions:
              day.dailyMissions.map(
                (mission) => ({
                  ...mission,
                })
              ),
          })
        );

        const currentDayData =
          updatedDays[currentDay - 1];

        if (!currentDayData) {
          return previousDays;
        }

        const mission =
          currentDayData.dailyMissions.find(
            (item) =>
              item.type === missionType
          );

        if (!mission) {
          return previousDays;
        }

        if (mission.isCompleted) {
          return previousDays;
        }

        mission.currentProgress = Math.min(
          mission.requirement,
          mission.currentProgress + amount
        );

        if (
          mission.currentProgress >=
          mission.requirement
        ) {
          mission.isCompleted = true;
        }

        saveCampaignDays(updatedDays);

        return updatedDays;
      });
    },
    [
      currentDay,
      saveCampaignDays,
    ]
  );

  // --------------------------------------------------
  // CLAIM
  // --------------------------------------------------

  const claimReward = useCallback(
  async (missionId: string): Promise<DailyMission | null> => {
    const currentDayData = campaignDays[currentDay - 1];

    if (!currentDayData) {
      return null;
    }

    const mission = currentDayData.dailyMissions.find(
      (item) => item.id === missionId
    );

    if (!mission) {
      return null;
    }

    if (!mission.isCompleted || mission.isClaimed) {
      return null;
    }

    const updatedDays = campaignDays.map((day) => ({
      ...day,
      dailyMissions: day.dailyMissions.map((item) => ({
        ...item,
      })),
    }));

    const updatedCurrentDay = updatedDays[currentDay - 1];

    if (!updatedCurrentDay) {
      return null;
    }

    const updatedMission = updatedCurrentDay.dailyMissions.find(
      (item) => item.id === missionId
    );

    if (!updatedMission) {
      return null;
    }

    updatedMission.isClaimed = true;

    saveCampaignDays(updatedDays);
    setCampaignDays(updatedDays);

    return updatedMission;
  },
  [campaignDays, currentDay, saveCampaignDays]
);

  // --------------------------------------------------
  // START MISSION
  // --------------------------------------------------

  const startMission = useCallback(
    async (mission: DailyMission) => {
      switch (mission.type) {
        case "open_pack":
          updateMissionProgress("open_pack");
          break;

        case "watch_ad":
          updateMissionProgress("watch_ad");
          break;

        default:
          // Las misiones sociales,
          // partidos, presencia, etc.
          // no se completan desde el botón.
          break;
      }
    },
    [updateMissionProgress]
  );

  return {
    campaignDays,
    setCampaignDays,

    currentDay,
    setCurrentDay,

    currentMissions,
    nextMission,
    lobbyMission,

    lastPlayedDate,

    updateMissionProgress,
    claimReward,
    startMission,

    saveCampaignDays,
    loadCampaignDays,
    resetDailyMissions,
  };
}