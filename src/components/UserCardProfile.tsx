import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useHeroDataCached } from "../hooks/useHeroData";
import "./UserCardProfile.css";
import { Player3D } from "./Player3D";
import { AuraInventory } from "./AuraInventory";
import { AuraDressingRoom } from "./AuraDressingRoom";

type AuraWorld = "URBAN" | "GAMER" | "SPORT";

type UserProfile = {
  username: string | null;
};

type AuraSkin = {
  id: string;
  name: string;
  world: AuraWorld;
  drop: string;
  requiredLevel: number;
  unlocked: boolean;
};

type UserCardProfileProps = {
  userId: string;
  onLevelUp?: (newLevel: number, newRarity: string) => void;
};

const WORLD_CONFIG: Record<
  AuraWorld,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  URBAN: {
    label: "URBAN",
    icon: "🟢",
    description: "Street · Style · City",
  },

  GAMER: {
    label: "GAMER",
    icon: "🔵",
    description: "Digital · Cyber · Gaming",
  },

  SPORT: {
    label: "SPORT",
    icon: "🟣",
    description: "Football · Training · Performance",
  },
};

/**
 * Define en qué mundo se encuentra el jugador.
 *
 * Por ahora usamos bloques de 5 niveles:
 *
 * LVL 1-5   → URBAN
 * LVL 6-10  → GAMER
 * LVL 11-15 → SPORT
 *
 * Después podemos convertir esto en una configuración
 * proveniente de la DB / colección AURA XP.
 */
const getAuraWorld = (level: number): AuraWorld => {
  if (level <= 5) return "URBAN";
  if (level <= 10) return "GAMER";

  return "SPORT";
};

/**
 * Skin actual según el mundo del jugador.
 *
 * Esto es todavía frontend/prototipo.
 * Más adelante vendrá de aura_skins.
 */
const getSkinForLevel = (level: number): AuraSkin => {
  const world = getAuraWorld(level);

  const skins: Record<
    AuraWorld,
    {
      id: string;
      name: string;
      drop: string;
      requiredLevel: number;
    }
  > = {
    URBAN: {
      id: "urban-drop-001",
      name: "URBAN GRIND",
      drop: "DROP 001",
      requiredLevel: 1,
    },

    GAMER: {
      id: "gamer-drop-001",
      name: "CYBER AURA",
      drop: "DROP 001",
      requiredLevel: 6,
    },

    SPORT: {
      id: "sport-drop-001",
      name: "SPORT AURA",
      drop: "DROP 001",
      requiredLevel: 11,
    },
  };

  const skin = skins[world];

  return {
    ...skin,
    world,
    unlocked: level >= skin.requiredLevel,
  };
};

export function UserCardProfile({
  userId,
  onLevelUp,
}: UserCardProfileProps) {
  const {
    data: heroData,
    loading: heroLoading,
    refetch,
  } = useHeroDataCached(userId);

  const [profile, setProfile] = useState<UserProfile>({
    username: null,
  });

  const [previousLevel, setPreviousLevel] =
    useState<number | null>(null);

  const [showLevelUp, setShowLevelUp] =
    useState(false);

  /**
   * Cargar identidad básica del usuario.
   */
  const loadProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(
        "Error cargando perfil:",
        error
      );
      return;
    }

    setProfile({
      username: data?.username ?? null,
    });
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  /**
   * Escuchar cualquier acción que actualice
   * XP / nivel / progresión.
   */
  useEffect(() => {
    if (!userId) return;

    const handleProgressionUpdate = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent;

      if (
        customEvent.detail?.userId !== userId
      ) {
        return;
      }

      refetch();
    };

    window.addEventListener(
      "lupi:progression-updated",
      handleProgressionUpdate
    );

    return () => {
      window.removeEventListener(
        "lupi:progression-updated",
        handleProgressionUpdate
      );
    };
  }, [userId, refetch]);

  /**
   * Detectar LEVEL UP.
   */
  useEffect(() => {
    if (!heroData?.level) return;

    const currentLevel = heroData.level;

    if (
      previousLevel !== null &&
      currentLevel > previousLevel
    ) {
      setShowLevelUp(true);

      onLevelUp?.(
        currentLevel,
        heroData.rarity ?? "bronze"
      );

      const timer = window.setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);

      return () =>
        window.clearTimeout(timer);
    }

    setPreviousLevel(currentLevel);
  }, [
    heroData?.level,
    heroData?.rarity,
    onLevelUp,
    previousLevel,
  ]);

  /**
   * HERO DATA
   */
  const level = heroData?.level ?? 1;
  const exp = heroData?.exp ?? 0;
  const expNeeded =
    heroData?.expNeeded ?? 100;

  const points = heroData?.points ?? 0;
  const coins = heroData?.coins ?? 0;
  const streak = heroData?.streak ?? 0;

  /**
   * XP %
   */
  const xpPercentage = Math.min(
    (exp / Math.max(expNeeded, 1)) * 100,
    100
  );

  /**
   * WORLD
   */
  const world = useMemo(
    () => getAuraWorld(level),
    [level]
  );

  const worldConfig =
    WORLD_CONFIG[world];

  /**
   * SKIN
   */
  const skin = useMemo(
    () => getSkinForLevel(level),
    [level]
  );

  const nextLevel = level + 1;

  const xpRemaining = Math.max(
    expNeeded - exp,
    0
  );

  /**
   * Loading
   */
  if (heroLoading && !heroData) {
    return (
      <section className="user-card-profile">
        <div className="user-card-loading">
          Cargando tu identidad...
        </div>
      </section>
    );
  }

  return (
    <section
      className={`user-card-profile aura-card aura-${world.toLowerCase()}`}
    >
      {/* =====================================================
          LEVEL UP
      ====================================================== */}

      {showLevelUp && (
        <div className="aura-level-up">
          <div className="aura-level-up-title">
            LEVEL UP
          </div>

          <div className="aura-level-up-level">
            LVL {level}
          </div>

          <div className="aura-level-up-subtitle">
            Nueva identidad desbloqueada
          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="aura-card-header">

        {/* WORLD */}

        <div className="aura-world">
          <span className="aura-world-label">
            {worldConfig.icon}{" "}
            {worldConfig.label}
          </span>

          <span className="aura-world-description">
            {worldConfig.description}
          </span>
        </div>
        <h2>
            {profile.username || "PLAYER"}
          </h2>

        {/* LEVEL */}

        <div className="aura-level">
          <span>LVL</span>

          <strong>{level}</strong>
        </div>
        
      </header>
{/* =====================================================
          XP
      ====================================================== */}

      <div className="aura-progress">

        <div className="aura-progress-header">

          <span>AURA</span>

          <span>
            {exp} / {expNeeded}
          </span>

        </div>

        <div className="aura-progress-bar">

          <div
            className="aura-progress-fill"
            style={{
              width: `${xpPercentage}%`,
            }}
          />

        </div>

        <div className="aura-next-level">
          {xpRemaining} AURA para LVL{" "}
          {nextLevel}
        </div>

      </div>
      <div className="aura-identity">

        </div>
      {/* =====================================================
          AURA / CHARACTER
      ====================================================== */}

      <div className="aura-character-section">

        <AuraDressingRoom userId={userId} level={level} />

      </div>

      


      {/* =====================================================
          AURA XP SKIN
      ====================================================== */}

      <div className="aura-skin">

        <div className="aura-skin-top">

          <div>

            <span className="aura-small-label">
              AURA XP
            </span>

            <h3>
              {skin.name}
            </h3>

            <span className="aura-drop">
              {skin.drop}
            </span>

          </div>

          <div className="aura-skin-level">
            LVL {skin.requiredLevel}+
          </div>

        </div>

        <div className="aura-skin-description">

          {skin.unlocked
            ? "Este skin forma parte de tu identidad digital."
            : `Alcanzá el nivel ${skin.requiredLevel} para desbloquearlo.`}

        </div>

        <div className="aura-skin-actions">

          {skin.unlocked ? (
            <button
              type="button"
              className="aura-button aura-button-primary"
              onClick={() => {
                console.log(
                  "Ver producto real:",
                  skin.id
                );
              }}
            >
              CONSEGUIR EN LA TIENDA
            </button>
          ) : (
            <button
              type="button"
              className="aura-button aura-button-locked"
              disabled
            >
              🔒 DESBLOQUEADO EN LVL{" "}
              {skin.requiredLevel}
            </button>
          )}

        </div>
      </div>

      

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="aura-card-footer">

        <span>
          LUPIAPP × AURA XP
        </span>

        <span>
          DROP COLLECTION
        </span>

      </footer>

    </section>
  );
}