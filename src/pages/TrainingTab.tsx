import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AppUser } from "../lib/api";
import { TrainingGame, TrainingGameSelector, type TrainingResult, type TrainingStat } from "../components/campaign/TrainingGames";
import "./TrainingTab.css";

type GameId = "shooting" | "dribbling" | "defending" | "passing" | "physical" | "pace";
type PlayerStats = Record<TrainingStat, number>;
type Attempt = { game_id: GameId; stat: TrainingStat; grade: string; delta: number; created_at: string };

const GAME_CONFIG: Record<GameId, { stat: TrainingStat; label: string }> = {
  shooting: { stat: "finishing", label: "Remate" },
  dribbling: { stat: "dribbling", label: "Gambeta" },
  defending: { stat: "defending", label: "Defensa" },
  passing: { stat: "passing", label: "Pase" },
  physical: { stat: "physical", label: "Físico" },
  pace: { stat: "pace", label: "Velocidad" },
};

const STAT_LABELS: Record<TrainingStat, string> = {
  pace: "Velocidad", dribbling: "Gambeta", passing: "Pase",
  defending: "Defensa", finishing: "Remate", physical: "Físico",
};

type SkillKey = "coordination" | "speed" | "agility" | "technique";
type DrillRecord = { skill_key: SkillKey; exercise_index: number; completed_at: string };
const AURA_SKILLS: Record<SkillKey, { title: string; description: string; image: string; drills: { title: string; reps: string; description: string; benefit: string }[] }> = {
  coordination: { title: "COORDINACIÓN", description: "Dominá tu cuerpo y cada apoyo.", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/coordinacion.png", drills: [
    { title: "TOQUES EN ESCALERA", reps: "3 pasadas", description: "Entrá y salí de cada cuadro con ambos pies. Mantené la cabeza arriba y el ritmo constante.", benefit: "Llegar mejor perfilado para recibir." },
    { title: "SLALOM ENTRE CONOS", reps: "4 recorridos", description: "Conducí la pelota en zigzag, tocándola con ambos perfiles sin perder el control.", benefit: "Esquivar una marca sin que se te escape la pelota." },
    { title: "RECIBIR + SALIR", reps: "10 repeticiones", description: "Simulá una recepción, orientá el primer toque hacia un lado y acelerá 3 pasos.", benefit: "Ganar tiempo después de controlar." }
  ] },
  speed: { title: "VELOCIDAD", description: "Acelerá y reaccioná más rápido.", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/velocidad.png", drills: [
    { title: "SALIDAS CORTAS", reps: "6 repeticiones", description: "Desde parado, acelerá 5 metros con decisión. Volvé caminando.", benefit: "Picar primero hacia un pase o espacio libre." },
    { title: "REACCIÓN A SEÑAL", reps: "8 repeticiones", description: "Usá una señal visual o sonora y arrancá lo más rápido que puedas.", benefit: "Anticiparte a una pelota dividida." },
    { title: "SPRINT + FRENO", reps: "5 repeticiones", description: "Acelerá 5 metros y frená en una zona marcada, con control.", benefit: "Llegar rápido y quedar listo para jugar." }
  ] },
  agility: { title: "AGILIDAD", description: "Frená, girá y cambiá de dirección.", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/agilidad.png", drills: [
    { title: "ZIGZAG ENTRE CONOS", reps: "4 pasadas", description: "Desplazate de lado a lado, bajá el centro de gravedad y acelerá al salir.", benefit: "Superar a un rival en el uno contra uno." },
    { title: "FRENAR + GIRAR", reps: "6 repeticiones por lado", description: "Llegá a una marca, frená, girá y salí hacia el lado opuesto.", benefit: "Cambiar de dirección sin perder equilibrio." },
    { title: "CUADRADO DE MOVIMIENTO", reps: "4 vueltas", description: "Avanzá, desplazate lateral, retrocedé y cambiá de lado sin cruzar los pies.", benefit: "Marcar y cubrir espacios en defensa." }
  ] },
  technique: { title: "TÉCNICA", description: "Mejorá tu dominio de pelota.", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/tecnica.png", drills: [
    { title: "CONTROL ORIENTADO", reps: "10 por perfil", description: "Recibí y llevá el primer toque hacia el espacio libre.", benefit: "Salir de la presión con el primer toque." },
    { title: "PASE CONTRA PARED", reps: "20 pases", description: "Alterná pie derecho e izquierdo. Prepará el cuerpo antes de recibir.", benefit: "Dar pases más precisos con ambos perfiles." },
    { title: "CONDUCCIÓN + CAMBIO", reps: "5 recorridos", description: "Conducí, cambiá de dirección y salí con un toque más largo.", benefit: "Cambiar el ritmo para dejar atrás al rival." }
  ] }
};
type BadgeKey = SkillKey;
type TrainingBadge = { badge_key: BadgeKey; progress: number; unlocked_at: string | null };
const BADGE_CONFIG: Record<BadgeKey, { title: string; skill: string; image: string; description: string }> = {
  coordination: { title: "CONTROL CORE", skill: "Coordinación", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/coordinacion.png", description: "Dominá tu cuerpo, tus apoyos y el control de pelota." },
  speed: { title: "FIRST STRIKE", skill: "Velocidad", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/velocidad.png", description: "Reaccioná antes y ganá ventaja en los primeros metros." },
  agility: { title: "BREAKPOINT", skill: "Agilidad", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/agilidad.png", description: "Frená, girá y cambiá de dirección con control." },
  technique: { title: "TOUCH MASTER", skill: "Técnica", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/tecnica.png", description: "Controlá, pasá y resolvé con más recursos." },
};
const EMPTY_BADGES: TrainingBadge[] = (Object.keys(BADGE_CONFIG) as BadgeKey[]).map(badge_key => ({ badge_key, progress: 0, unlocked_at: null }));

const todayArgentina = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

export function TrainingTab({ user }: { user: AppUser }) {
  const [stats, setStats] = useState<PlayerStats>({
    pace: 10, dribbling: 10, passing: 10, defending: 10, finishing: 10, physical: 10,
  });
  const [cardLevel, setCardLevel] = useState(1);
  const [trainingXp, setTrainingXp] = useState(0);
  const [badges, setBadges] = useState<TrainingBadge[]>(EMPTY_BADGES);
  const [drills, setDrills] = useState<DrillRecord[]>([]);
  const [drillSaving, setDrillSaving] = useState<string | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeKey | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpgrade, setLastUpgrade] = useState<{ stat: TrainingStat; before: number; after: number; ovr: number } | null>(null);
  const resultSubmitted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [profileResult, attemptsResult, badgesResult, drillsResult] = await Promise.all([
      supabase.from("profiles").select("user_card_level,user_card_exp,user_card_pace,user_card_dribbling,user_card_passing,user_card_defending,user_card_finishing,user_card_physical")
        .eq("id", user.id).single(),
      supabase.from("personal_training_attempts").select("game_id,stat,grade,delta,created_at")
        .eq("user_id", user.id).eq("training_date", todayArgentina()).order("created_at", { ascending: false }),
      supabase.from("personal_training_badges").select("badge_key,progress,unlocked_at").eq("user_id", user.id),
      supabase.from("personal_training_drills").select("skill_key,exercise_index,completed_at").eq("user_id", user.id),
    ]);
    if (profileResult.error) {
      setError("No pudimos cargar tu carta personal. Revisá los permisos de profiles.");
    } else {
      const p = profileResult.data;
      setStats({
        pace: p.user_card_pace ?? 10, dribbling: p.user_card_dribbling ?? 10,
        passing: p.user_card_passing ?? 10, defending: p.user_card_defending ?? 10,
        finishing: p.user_card_finishing ?? 10, physical: p.user_card_physical ?? 10,
      });
      setCardLevel(p.user_card_level ?? 1);
      setTrainingXp(p.user_card_exp ?? 0);
    }
    if (attemptsResult.error) {
      setError("Falta aplicar la migración personal_card_training en Supabase para habilitar los minijuegos y guardar mejoras.");
    } else {
      setAttempts((attemptsResult.data ?? []) as Attempt[]);
    }
    if (badgesResult.error || drillsResult.error) {
      setError("Falta aplicar la migración 20261126_aura_training_badges.sql en Supabase para habilitar los desafíos AURA y sus badges.");
    } else {
      const savedBadges = (badgesResult.data ?? []) as TrainingBadge[];
      setBadges(EMPTY_BADGES.map(base => savedBadges.find(item => item.badge_key === base.badge_key) ?? base));
      setDrills((drillsResult.data ?? []) as DrillRecord[]);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  const overall = useMemo(() => Math.floor(
    (stats.pace + stats.dribbling + stats.passing + stats.defending + stats.finishing + stats.physical) / 6
  ), [stats]);
  const gamesPlayed = attempts.length;
  const canTrain = gamesPlayed < 5;

  const completeDrill = useCallback(async (skillKey: SkillKey, exerciseIndex: number) => {
    const token = `${skillKey}-${exerciseIndex}`;
    if (drillSaving || drills.some(item => item.skill_key === skillKey && item.exercise_index === exerciseIndex)) return;
    setDrillSaving(token);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("complete_personal_training_drill", {
      p_skill_key: skillKey,
      p_exercise_index: exerciseIndex,
    });
    if (rpcError) {
      setError("No se pudo guardar el ejercicio. Aplicá la migración 20261126_aura_training_badges.sql en Supabase.");
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.success) {
        setDrills(current => [...current, { skill_key: skillKey, exercise_index: exerciseIndex, completed_at: new Date().toISOString() }]);
        setTrainingXp(Number(row.user_card_exp ?? trainingXp));
        setCardLevel(Number(row.user_card_level ?? cardLevel));
        const { data: badgeRows } = await supabase.from("personal_training_badges").select("badge_key,progress,unlocked_at").eq("user_id", user.id);
        if (badgeRows) {
          const savedBadges = badgeRows as TrainingBadge[];
          const nextBadges = EMPTY_BADGES.map(base => savedBadges.find(item => item.badge_key === base.badge_key) ?? base);
          const previous = badges.find(item => item.badge_key === skillKey);
          const next = nextBadges.find(item => item.badge_key === skillKey);
          setBadges(nextBadges);
          if (next?.unlocked_at && !previous?.unlocked_at) setUnlockedBadge(skillKey);
        }
        if (Number(row.xp_awarded) > 0) {
          setNotice(`¡${AURA_SKILLS[skillKey].title} COMPLETADA! +50 XP · ${AURA_SKILLS[skillKey].title} BADGE DESBLOQUEADA.`);
          window.dispatchEvent(new CustomEvent("lupi:progression-updated", { detail: { userId: user.id } }));
        } else {
          setNotice(`Ejercicio guardado: ${AURA_SKILLS[skillKey].drills[exerciseIndex].title}.`);
        }
      }
    }
    setDrillSaving(null);
  }, [drillSaving, drills, trainingXp, cardLevel, badges, user.id]);

  const handleGameResult = useCallback(async (result: TrainingResult) => {
    if (!selectedGame || resultSubmitted.current || saving) return;
    resultSubmitted.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    const before = stats[result.stat];
    const { data, error: rpcError } = await supabase.rpc("complete_personal_training", {
      p_game_id: selectedGame,
      p_stat: result.stat,
      p_grade: result.grade,
      p_delta: result.delta,
      p_xp_bonus: result.xpBonus,
    });
    if (rpcError) {
      setError("No se pudo guardar la mejora. Aplicá la migración 20261126_personal_card_training.sql en Supabase y esperá unos segundos a que se actualice el esquema.");
      resultSubmitted.current = false;
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.success) {
        const after = Number(row.stat_value ?? before);
        setStats(current => ({ ...current, [result.stat]: after }));
        setCardLevel(Number(row.card_level ?? cardLevel));
        setTrainingXp(current => current + Number(row.xp_awarded ?? result.xpBonus));
        setLastUpgrade({ stat: result.stat, before, after, ovr: Number(row.overall_rating ?? overall) });
        const { data: badgeRows, error: badgeError } = await supabase.from("personal_training_badges").select("badge_key,progress,unlocked_at").eq("user_id", user.id);
        if (!badgeError) {
          const savedBadges = (badgeRows ?? []) as TrainingBadge[];
          const nextBadges = EMPTY_BADGES.map(base => savedBadges.find(item => item.badge_key === base.badge_key) ?? base);
          const justUnlocked = nextBadges.find(item => item.unlocked_at && !badges.find(old => old.badge_key === item.badge_key)?.unlocked_at);
          setBadges(nextBadges);
          if (justUnlocked) setUnlockedBadge(justUnlocked.badge_key);
        }
        setAttempts(current => [{
          game_id: selectedGame, stat: result.stat, grade: result.grade, delta: Number(row.xp_awarded ?? result.xpBonus), created_at: new Date().toISOString(),
        }, ...current]);
        setNotice(`¡${result.grade}! Tu carta mejoró ${STAT_LABELS[result.stat]}: ${before} → ${after}.`);
        window.dispatchEvent(new CustomEvent("lupi:progression-updated", { detail: { userId: user.id } }));
      } else {
        await load();
        setNotice("Ya entrenaste este minijuego hoy o alcanzaste el límite diario de 5 desafíos.");
      }
      setSelectedGame(null);
    }
    setSaving(false);
  }, [selectedGame, saving, stats, cardLevel, overall, user.id, load, badges]);

  const startGame = (gameId: string) => {
    if (!canTrain) return;
    resultSubmitted.current = false;
    setNotice("");
    setLastUpgrade(null);
    setSelectedGame(gameId as GameId);
  };

  return (
    <main className="main-content training-hub">
      <div className="training-shell">
        <header className="training-hero">
          <span className="training-kicker">LUPI WORLD / PLAYER DEVELOPMENT</span>
          <h1>TRAINING<span> ARENA</span></h1>
          <p>No completás tareas: jugás minijuegos y mejorás tu propia carta.</p>
          <div className="training-player-stats">
            <div><strong>{overall}</strong><small>OVR DE TU CARTA</small></div>
            <div><strong>{cardLevel}</strong><small>NIVEL DE CARTA</small></div>
            <div><strong>{gamesPlayed}/5</strong><small>DESAFÍOS HOY</small></div>
          </div>
        </header>

        <section className="training-card-evolution">
          <div className="training-section-title"><span>01 / TU CARTA EVOLUCIONA</span><small>ATRIBUTOS PERSONALES · MÁX. 99</small></div>
          <div className="training-stat-grid">
            {(Object.keys(STAT_LABELS) as TrainingStat[]).map(stat => (
              <div className="training-stat" key={stat}>
                <div><span>{STAT_LABELS[stat]}</span><strong>{stats[stat]}</strong></div>
                <div className="training-stat-track"><i style={{ width: `${Math.min(99, stats[stat]) / 99 * 100}%` }} /></div>
              </div>
            ))}
          </div>
          {lastUpgrade && <div className="training-upgrade-pop" role="status">
            <span>¡CARTA MEJORADA!</span><strong>{STAT_LABELS[lastUpgrade.stat]} +{lastUpgrade.after - lastUpgrade.before}</strong>
            <small>OVR ACTUALIZADO · {lastUpgrade.ovr}</small>
          </div>}
        </section>



        <section className="training-aura-program">
          <div className="training-section-title"><span>02 / AURA TRAINING SYSTEM</span><small>4 DISCIPLINAS · 12 EJERCICIOS</small></div>
          <p className="training-arena-intro">Completá los tres ejercicios de cada disciplina para desbloquear su badge y ganar 50 XP en tu carta.</p>
          <div className="training-aura-skills">
            {(Object.keys(AURA_SKILLS) as SkillKey[]).map(skillKey => {
              const skill = AURA_SKILLS[skillKey];
              const done = drills.filter(item => item.skill_key === skillKey).length;
              const unlocked = done === 3;
              return <article className={`training-aura-skill ${unlocked ? "is-complete" : ""}`} key={skillKey}>
                <div className="training-aura-skill-head">
                  <img src={skill.image} alt="" loading="lazy" />
                  <div><small>{String(done).padStart(2,"0")} / 03 EJERCICIOS</small><h3>{skill.title}</h3><p>{skill.description}</p></div>
                  <strong>{Math.round(done / 3 * 100)}%</strong>
                </div>
                <div className="training-aura-skill-track"><i style={{width:`${done/3*100}%`}} /></div>
                <div className="training-aura-drills">
                  {skill.drills.map((drill,index) => {
                    const completed = drills.some(item => item.skill_key === skillKey && item.exercise_index === index);
                    const token = `${skillKey}-${index}`;
                    return <div className={`training-aura-drill ${completed ? "is-done" : ""}`} key={token}>
                      <div className="training-aura-drill-copy"><small>{drill.reps}</small><strong>{drill.title}</strong><p>{drill.description}</p><em>EN CANCHA · {drill.benefit}</em></div>
                      <button type="button" disabled={completed || drillSaving !== null} onClick={() => void completeDrill(skillKey,index)}>{completed ? "COMPLETADO ✓" : drillSaving === token ? "GUARDANDO…" : "MARCAR LISTO"}</button>
                    </div>;
                  })}
                </div>
                {unlocked && <div className="training-aura-skill-reward">✦ BADGE DESBLOQUEADA · +50 XP</div>}
              </article>;
            })}
          </div>
        </section>

        <section className="training-badges">
          <div className="training-section-title"><span>03 / AURA SKILL BADGES</span><small>3 ENTRENAMIENTOS PARA DESBLOQUEAR</small></div>
          <div className="training-badge-grid">
            {badges.map(badge => {
              const config = BADGE_CONFIG[badge.badge_key];
              const unlocked = Boolean(badge.unlocked_at);
              return <article className={`training-badge ${unlocked ? "is-unlocked" : ""}`} key={badge.badge_key}>
                <div className="training-badge-art"><img src={config.image} alt={config.title} loading="lazy" /></div>
                <div className="training-badge-copy"><small>{config.skill.toUpperCase()}</small><strong>{config.title}</strong><p>{config.description}</p>
                  <div className="training-badge-progress"><i style={{ width: `${Math.min(3, badge.progress) / 3 * 100}%` }} /></div>
                  <span>{unlocked ? "BADGE DESBLOQUEADA ✓" : `${Math.min(3, badge.progress)} / 3 ENTRENAMIENTOS`}</span>
                </div>
              </article>;
            })}
          </div>
          <div className="training-xp-evolution">
            <div><small>AURA PLAYER EVOLUTION</small><strong>{trainingXp.toLocaleString("es-AR")} XP</strong></div>
            <div className="training-xp-track"><i style={{ width: `${Math.min(100, trainingXp / 1000 * 100)}%` }} /></div>
            <div className="training-xp-milestones"><span className={trainingXp >= 500 ? "is-earned" : ""}>{trainingXp >= 500 ? "✓ " : ""}500 XP · GAME CHANGER</span><span className={trainingXp >= 1000 ? "is-earned" : ""}>{trainingXp >= 1000 ? "✓ " : ""}1.000 XP · LEGEND STATUS</span></div>
          </div>
        </section>

        <section className="training-arena">
          <div className="training-section-title"><span>04 / ELEGÍ TU DESAFÍO</span><small>MEJORÁ UNA HABILIDAD</small></div>
          {loading ? <div className="training-empty">Cargando tu carta...</div> : selectedGame ? (
            <div className="training-game-stage">
              <div className="training-game-top">
                <div><span>MINIJUEGO ACTIVO</span><h2>{GAME_CONFIG[selectedGame].label}</h2></div>
                <button type="button" onClick={() => { setSelectedGame(null); resultSubmitted.current = false; }} disabled={saving}>SALIR</button>
              </div>
              <TrainingGame
                key={selectedGame}
                gameId={selectedGame}
                stat={GAME_CONFIG[selectedGame].stat}
                onComplete={handleGameResult}
                difficulty="normal"
              />
              {saving && <p className="training-feedback">Guardando la evolución de tu carta...</p>}
            </div>
          ) : (
            <>
              <p className="training-arena-intro">{canTrain ? "Elegí una disciplina. Tu resultado define cuánto mejora el atributo correspondiente." : "Completaste tus 5 desafíos de hoy. Volvé mañana para seguir evolucionando."}</p>
              <div className="training-remaining"><span>ENERGÍA DE ENTRENAMIENTO</span><strong>{Math.max(0, 5 - gamesPlayed)} / 5</strong></div>
              <TrainingGameSelector onSelectGame={startGame} />
            </>
          )}
        </section>

        {attempts.length > 0 && <section className="training-history">
          <div className="training-section-title"><span>05 / RESULTADOS DE HOY</span><small>PROGRESO GUARDADO</small></div>
          <div className="training-history-list">{attempts.map((attempt, index) => (
            <article key={`${attempt.game_id}-${index}`}>
              <span>{STAT_LABELS[attempt.stat]}</span><strong>CALIFICACIÓN {attempt.grade}</strong><b>+{attempt.delta}</b>
            </article>
          ))}</div>
        </section>}

        {error && <p className="training-feedback is-error" role="alert">{error}</p>}
        {notice && <p className="training-feedback" role="status">{notice}</p>}

        {unlockedBadge && <div className="training-badge-modal" role="dialog" aria-modal="true" aria-labelledby="training-badge-modal-title">
          <div className="training-badge-modal-card">
            <button type="button" className="training-badge-modal-close" aria-label="Cerrar" onClick={() => setUnlockedBadge(null)}>×</button>
            <small>✦ AURA SKILL BADGE DESBLOQUEADA ✦</small>
            <img src={BADGE_CONFIG[unlockedBadge].image} alt={BADGE_CONFIG[unlockedBadge].title} />
            <span>{BADGE_CONFIG[unlockedBadge].skill.toUpperCase()}</span>
            <h2 id="training-badge-modal-title">{BADGE_CONFIG[unlockedBadge].title}</h2>
            <p>{BADGE_CONFIG[unlockedBadge].description}</p>
            <button type="button" onClick={() => setUnlockedBadge(null)}>RECLAMAR BADGE</button>
          </div>
        </div>}

        <p className="training-disclaimer">Hasta 5 minijuegos por día. Cada resultado mejora solamente tu carta personal; los atributos no superan 99. Adaptá la intensidad y priorizá la técnica.</p>
      </div>
    </main>
  );
}
