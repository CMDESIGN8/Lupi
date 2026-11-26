import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AppUser } from "../lib/api";
import type { TrainingStat } from "../components/campaign/TrainingGames";
import "./TrainingTab.css";

type PlayerStat = TrainingStat | "aerobic" | "strength";
type PlayerStats = Record<PlayerStat, number>;

const STAT_LABELS: Record<PlayerStat, string> = {
  pace: "Velocidad", dribbling: "Gambeta", passing: "Pase",
  defending: "Defensa", finishing: "Remate", physical: "Físico", aerobic: "Aeróbico", strength: "Fuerza",
};

type SkillKey = "coordination" | "speed" | "agility" | "technique" | "aerobic" | "strength";
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
  ] },
  aerobic: { title: "AERÓBICO", description: "Construí resistencia para sostener la intensidad durante todo el partido.", image: "", drills: [
    { title: "CARRERA CONTINUA", reps: "8 minutos", description: "Trotá a ritmo cómodo y constante. Mantené una respiración controlada.", benefit: "Sostener el ritmo durante todo el encuentro." },
    { title: "INTERVALOS DE RESISTENCIA", reps: "6 ciclos · 30s/30s", description: "Alterná 30 segundos de trote activo con 30 segundos suaves.", benefit: "Recuperarte mejor entre esfuerzos intensos." },
    { title: "SHUTTLE RUN", reps: "6 pasadas de 20 m", description: "Corré entre dos marcas separadas por 10 metros, girando con control.", benefit: "Repetir piques y recuperarte más rápido." }
  ] },
  strength: { title: "FUERZA", description: "Desarrollá fuerza funcional para proteger la pelota, saltar y disputar cada duelo.", image: "", drills: [
    { title: "SENTADILLA", reps: "3 series · 10 repeticiones", description: "Bajá con control, espalda neutra y rodillas alineadas con los pies. Usá solo tu peso corporal.", benefit: "Fortalecer piernas para acelerar y proteger la pelota." },
    { title: "FLEXIONES", reps: "3 series · 8 repeticiones", description: "Mantené el cuerpo alineado y bajá hasta donde puedas conservar una técnica correcta. Adaptá apoyando rodillas.", benefit: "Mejorar fuerza del tren superior y estabilidad." },
    { title: "PUENTE DE GLÚTEOS + PLANCHA", reps: "3 series · 12 + 20s", description: "Combiná 12 puentes de glúteos con 20 segundos de plancha, descansando entre series.", benefit: "Fortalecer core y cadena posterior." }
  ] }
};

type DrillLevel = { name: string; tag: string; guidance: string };
const DRILL_LEVELS: DrillLevel[] = [
  { name: "INICIACIÓN", tag: "NIVEL 01", guidance: "Priorizá el control y la técnica. Encontrá un ritmo cómodo." },
  { name: "INTERMEDIO", tag: "NIVEL 02", guidance: "Sumá precisión y continuidad. Evitá perder la calidad del movimiento." },
  { name: "AVANZADO", tag: "NIVEL 03", guidance: "Buscá fluidez y velocidad sin sacrificar el control." },
];

type AuraVisualScene = { route: string; points: [number, number][]; ball: [number, number]; caption: string };
const AURA_VISUALS: Record<SkillKey, AuraVisualScene[]> = {
  coordination: [
    { route: "M22 52 L48 52 L74 52 L100 52 L126 52 L152 52", points: [[22,52],[48,52],[74,52],[100,52],[126,52],[152,52]], ball: [48,52], caption: "APOYOS ALTERNADOS" },
    { route: "M20 70 L48 24 L76 70 L104 24 L132 70 L160 24", points: [[48,24],[76,70],[104,24],[132,70]], ball: [20,70], caption: "ZIGZAG CON PELOTA" },
    { route: "M24 70 L74 70 L74 28 L144 28", points: [[24,70],[74,70],[74,28],[144,28]], ball: [24,70], caption: "CONTROL Y ACELERACIÓN" },
  ],
  speed: [
    { route: "M20 52 L158 52", points: [[20,52],[158,52]], ball: [20,52], caption: "ACELERACIÓN EN 5 METROS" },
    { route: "M24 68 L80 26 L148 68", points: [[24,68],[80,26],[148,68]], ball: [24,68], caption: "REACCIÓN A LA SEÑAL" },
    { route: "M20 52 L112 52 L148 52", points: [[20,52],[112,52],[148,52]], ball: [20,52], caption: "SPRINT + FRENO CONTROLADO" },
  ],
  agility: [
    { route: "M20 68 L48 26 L76 68 L104 26 L132 68 L160 26", points: [[48,26],[76,68],[104,26],[132,68]], ball: [20,68], caption: "CAMBIO DE DIRECCIÓN" },
    { route: "M24 52 L76 52 L76 22 L140 22", points: [[24,52],[76,52],[76,22],[140,22]], ball: [24,52], caption: "FRENÁ, GIRÁ Y SALÍ" },
    { route: "M38 25 L138 25 L138 75 L38 75 Z", points: [[38,25],[138,25],[138,75],[38,75]], ball: [38,25], caption: "RECORRIDO EN CUADRADO" },
  ],
  technique: [
    { route: "M24 52 L82 52 L142 25", points: [[24,52],[82,52],[142,25]], ball: [24,52], caption: "PRIMER TOQUE ORIENTADO" },
    { route: "M22 52 L150 52", points: [[22,52],[150,52]], ball: [22,52], caption: "PASE Y DEVOLUCIÓN" },
    { route: "M20 70 L66 25 L112 70 L158 25", points: [[66,25],[112,70],[158,25]], ball: [20,70], caption: "CONDUCCIÓN + CAMBIO" },
  ],
  aerobic: [
    { route: "M20 52 L160 52", points: [[20,52],[55,52],[90,52],[125,52],[160,52]], ball: [20,52], caption: "CARRERA CONTINUA" },
    { route: "M20 70 L55 25 L90 70 L125 25 L160 70", points: [[55,25],[90,70],[125,25],[160,70]], ball: [20,70], caption: "INTERVALOS DE RESISTENCIA" },
    { route: "M25 25 L155 25 L155 75 L25 75 Z", points: [[25,25],[155,25],[155,75],[25,75]], ball: [25,25], caption: "SHUTTLE RUN" },
  ],
  strength: [
    { route: "M30 25 L150 25 M45 25 L45 75 M135 25 L135 75", points: [[45,25],[135,25]], ball: [90,52], caption: "SENTADILLA · FUERZA DE PIERNAS" },
    { route: "M30 52 L150 52", points: [[30,52],[150,52]], ball: [90,52], caption: "FLEXIONES · TREN SUPERIOR" },
    { route: "M30 70 L150 70", points: [[30,70],[150,70]], ball: [90,70], caption: "CORE · ESTABILIDAD" },
  ],
};

function AuraDrillVisual({ skillKey, exerciseIndex, compact = false }: { skillKey: SkillKey; exerciseIndex: number; compact?: boolean }) {
  const scene = AURA_VISUALS[skillKey][exerciseIndex];
  return <div className={`aura-drill-visual ${compact ? "is-compact" : ""}`} role="img" aria-label={scene.caption}>
    <svg viewBox="0 0 180 100" aria-hidden="true">
      <defs><marker id={`aura-arrow-${skillKey}-${exerciseIndex}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" /></marker></defs>
      <rect x="5" y="5" width="170" height="90" rx="9" className="aura-visual-field" />
      <path d={scene.route} className="aura-visual-route" markerEnd={`url(#aura-arrow-${skillKey}-${exerciseIndex})`} />
      {scene.points.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="4.5" className="aura-visual-cone" />)}
      <circle cx={scene.ball[0]} cy={scene.ball[1]} r="7" className="aura-visual-ball" />
      <path d={`M${scene.ball[0]-3} ${scene.ball[1]} l3 -3 3 3 -3 3z`} className="aura-visual-ball-mark" />
    </svg>
    <span>{scene.caption}</span>
  </div>;
}
type BadgeKey = SkillKey;
type TrainingBadge = { badge_key: BadgeKey; progress: number; unlocked_at: string | null };
const BADGE_CONFIG: Record<BadgeKey, { title: string; skill: string; image: string; description: string }> = {
  coordination: { title: "CONTROL CORE", skill: "Coordinación", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/coordinacion.png", description: "Dominá tu cuerpo, tus apoyos y el control de pelota." },
  speed: { title: "FIRST STRIKE", skill: "Velocidad", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/velocidad.png", description: "Reaccioná antes y ganá ventaja en los primeros metros." },
  agility: { title: "BREAKPOINT", skill: "Agilidad", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/agilidad.png", description: "Frená, girá y cambiá de dirección con control." },
  technique: { title: "TOUCH MASTER", skill: "Técnica", image: "https://raw.githubusercontent.com/CMDESIGN8/AURAXPARG/main/assets/tecnica.png", description: "Controlá, pasá y resolvé con más recursos." },
  aerobic: { title: "ENDURANCE ENGINE", skill: "Aeróbico", image: "", description: "Construí resistencia para sostener la intensidad hasta el último minuto." },
  strength: { title: "POWER BUILDER", skill: "Fuerza", image: "", description: "Desarrollá fuerza funcional para cada duelo y movimiento en cancha." },
};
const EMPTY_BADGES: TrainingBadge[] = (Object.keys(BADGE_CONFIG) as BadgeKey[]).map(badge_key => ({ badge_key, progress: 0, unlocked_at: null }));

export function TrainingTab({ user, onBackToProfile }: { user: AppUser; onBackToProfile: () => void }) {
  const [stats, setStats] = useState<PlayerStats>({
    pace: 10, dribbling: 10, passing: 10, defending: 10, finishing: 10, physical: 10, aerobic: 10, strength: 10,
  });
  const [cardLevel, setCardLevel] = useState(1);
  const [trainingXp, setTrainingXp] = useState(0);
  const [badges, setBadges] = useState<TrainingBadge[]>(EMPTY_BADGES);
  const [drills, setDrills] = useState<DrillRecord[]>([]);
  const [resettingTraining, setResettingTraining] = useState(false);
  const [drillSaving, setDrillSaving] = useState<string | null>(null);
  const [activeDrill, setActiveDrill] = useState<{ skillKey: SkillKey; exerciseIndex: number } | null>(null);
  const [resting, setResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(30);
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeKey | null>(null);
  const [drillFeedback, setDrillFeedback] = useState<{ skillKey: SkillKey; exerciseIndex: number; progress: number; xpAwarded: number; statLabel: string; statGain: number } | null>(null);
  const [levelUpReward, setLevelUpReward] = useState<{ previous: number; current: number; skillKey: SkillKey; statLabel: string; statGain: number } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpgrade, setLastUpgrade] = useState<{ stat: PlayerStat; before: number; after: number; ovr: number } | null>(null);

  const load = useCallback(async () => {
    setError("");
    const [profileResult, badgesResult, drillsResult] = await Promise.all([
      supabase.from("profiles").select("user_card_level,user_card_exp,user_card_pace,user_card_dribbling,user_card_passing,user_card_defending,user_card_finishing,user_card_physical,user_card_aerobic,user_card_strength")
        .eq("id", user.id).single(),
      supabase.from("personal_training_badges").select("badge_key,progress,unlocked_at").eq("user_id", user.id),
      supabase.from("personal_training_cycle_drills").select("skill_key,exercise_index,completed_at").eq("user_id", user.id),
    ]);
    if (profileResult.error) {
      setError("No pudimos cargar tu carta personal. Revisá los permisos de profiles.");
    } else {
      const p = profileResult.data;
      setStats({
        pace: p.user_card_pace ?? 10, dribbling: p.user_card_dribbling ?? 10,
        passing: p.user_card_passing ?? 10, defending: p.user_card_defending ?? 10,
        finishing: p.user_card_finishing ?? 10, physical: p.user_card_physical ?? 10,
        aerobic: p.user_card_aerobic ?? 10, strength: p.user_card_strength ?? 10,
      });
      setCardLevel(p.user_card_level ?? 1);
      setTrainingXp(p.user_card_exp ?? 0);
    }
    if (badgesResult.error || drillsResult.error) {
      setError("Falta aplicar las migraciones de AURA Training en Supabase para cargar las disciplinas y sus badges.");
    } else {
      const savedBadges = (badgesResult.data ?? []) as TrainingBadge[];
      setBadges(EMPTY_BADGES.map(base => savedBadges.find(item => item.badge_key === base.badge_key) ?? base));
      setDrills((drillsResult.data ?? []) as DrillRecord[]);
    }
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!resting) return;
    const timer = window.setInterval(() => {
      setRestSeconds(current => current > 0 ? current - 1 : 0);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resting]);

  useEffect(() => {
    if (resting && restSeconds === 0) setResting(false);
  }, [resting, restSeconds]);

  const overall = useMemo(() => Math.floor(
    (stats.pace + stats.dribbling + stats.passing + stats.defending + stats.finishing + stats.physical + stats.aerobic + stats.strength) / 8
  ), [stats]);

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
      setError("No se pudo guardar el ejercicio. Revisá las funciones de entrenamiento en Supabase.");
      setDrillSaving(null);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    const { data: cycleData, error: cycleError } = await supabase.rpc("record_personal_training_cycle_drill", {
      p_skill_key: skillKey,
      p_exercise_index: exerciseIndex,
    });
    if (cycleError) {
      setError("El ejercicio se guardó, pero no pudimos actualizar el progreso del ciclo. Volvé a cargar la sección.");
      setDrillSaving(null);
      return;
    }

    const cycleRow = Array.isArray(cycleData) ? cycleData[0] : cycleData;
    const nextProgress = Number(cycleRow?.progress ?? drills.filter(item => item.skill_key === skillKey).length + 1);
    setDrills(current => [...current, { skill_key: skillKey, exercise_index: exerciseIndex, completed_at: new Date().toISOString() }]);

    const xpAwarded = row?.success ? Number(row.xp_awarded ?? 0) : 0;
    let statKey: PlayerStat | undefined;
    let statBefore = 0;
    let statAfter = 0;
    let statLabel = "ATRIBUTO";
    let statGain = 0;

    if (row?.success) {
      setTrainingXp(Number(row.user_card_exp ?? trainingXp));
      setCardLevel(Number(row.user_card_level ?? cardLevel));
      statKey = row.stat_key as PlayerStat | undefined;
      statBefore = statKey ? stats[statKey] : 0;
      statAfter = Number(row.stat_value ?? statBefore);
      if (statKey && statAfter > statBefore) {
        setStats(current => ({ ...current, [statKey!]: statAfter }));
        setLastUpgrade({ stat: statKey, before: statBefore, after: statAfter, ovr: Number(row.overall_rating ?? overall) });
      }
      statLabel = statKey ? STAT_LABELS[statKey] : "ATRIBUTO";
      statGain = Math.max(0, statAfter - statBefore);
      window.dispatchEvent(new CustomEvent("lupi:progression-updated", { detail: { userId: user.id } }));
    }

    const { data: badgeRows } = await supabase.from("personal_training_badges").select("badge_key,progress,unlocked_at").eq("user_id", user.id);
    if (badgeRows) {
      const savedBadges = badgeRows as TrainingBadge[];
      setBadges(EMPTY_BADGES.map(base => savedBadges.find(item => item.badge_key === base.badge_key) ?? base));
    }

    setDrillFeedback({ skillKey, exerciseIndex, progress: nextProgress, xpAwarded, statLabel, statGain });
    if (nextProgress === 3) {
      setNotice(xpAwarded > 0
        ? `¡${AURA_SKILLS[skillKey].title} COMPLETADA! ${statLabel} +${statGain} · +50 XP · BADGE DESBLOQUEADA.`
        : `¡${AURA_SKILLS[skillKey].title} COMPLETADA! Tu recompensa de carta ya había sido obtenida en un ciclo anterior.`);
      if (xpAwarded > 0 && Number(row.user_card_level ?? cardLevel) > cardLevel) {
        setUnlockedBadge(null);
        setLevelUpReward({ previous: cardLevel, current: Number(row.user_card_level), skillKey, statLabel, statGain });
      }
    } else {
      setNotice(`¡EJERCICIO REGISTRADO! ${AURA_SKILLS[skillKey].drills[exerciseIndex].title} · ${nextProgress}/3 en ${AURA_SKILLS[skillKey].title}.`);
    }
    setDrillSaving(null);
  }, [drillSaving, drills, trainingXp, cardLevel, user.id, stats, overall]);

  const resetAuraTraining = useCallback(async () => {
    if (resettingTraining || drillSaving) return;
    const confirmed = window.confirm("¿Reiniciar AURA Training? Los 18 ejercicios volverán a estar pendientes. Tu carta, XP, atributos y badges ganadas se conservan. Las recompensas de carta no se entregan nuevamente.");
    if (!confirmed) return;
    setResettingTraining(true);
    setError("");
    const { error: resetError } = await supabase.rpc("reset_personal_training_cycle");
    if (resetError) {
      setError("No se pudo reiniciar el entrenamiento. Revisá la migración de reinicio en Supabase.");
    } else {
      setDrills([]);
      setDrillFeedback(null);
      setNotice("AURA TRAINING REINICIADO. Tu evolución como jugador permanece intacta.");
    }
    setResettingTraining(false);
  }, [resettingTraining, drillSaving]);

  return (
    <main className="main-content training-hub">
      <div className="training-shell">
        <section className="training-character-hud" aria-label="Lupi World player development">
        <header className="training-hero training-hud-hero">
          <div className="training-hud-topline"><span className="training-kicker">LUPI WORLD / CLUB PERFORMANCE</span><div className="training-hud-actions"><button type="button" className="training-back-profile" onClick={onBackToProfile}>← VOLVER AL PERFIL</button><span className="training-hud-live"><i /> PLAYER ONLINE</span></div></div>
          <h1>CLUB<span> TRAINING CENTER</span></h1>
          <p>Preparación física de futsal. Entrená con método, progresá y llevá tu evolución a la cancha.</p>
          <div className="training-player-stats training-hud-metrics">
            <div><strong>{overall}</strong><small>OVR DE TU CARTA</small></div>
            <div><strong>{cardLevel}</strong><small>NIVEL DE CARTA</small></div>
            <div><strong>06</strong><small>DISCIPLINAS</small></div>
          </div>
        </header>

          <div className="training-xp-evolution training-hud-xp">
            <div className="training-xp-level-head">
              <div><small>AURA PLAYER EVOLUTION</small><strong>LVL {cardLevel}</strong></div>
              <b>{trainingXp.toLocaleString("es-AR")} XP</b>
            </div>
            <div className="training-xp-track"><i style={{ width: `${trainingXp % 100}%` }} /></div>
            <div className="training-xp-level-foot"><span>{trainingXp % 100} / 100 XP</span><strong>{100 - (trainingXp % 100)} XP PARA LVL {cardLevel + 1}</strong></div>
          </div>

        <section className="training-card-evolution">
          <div className="training-section-title"><span>01 / TU CARTA EVOLUCIONA</span><small>ATRIBUTOS PERSONALES · MÁX. 99</small></div>
          <div className="training-stat-grid">
            {(Object.keys(STAT_LABELS) as TrainingStat[]).map(stat => (
              <div className={`training-stat ${lastUpgrade?.stat === stat ? "is-upgraded" : ""}`} key={stat}>
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



        <section className="training-badges training-hud-badges">
          <div className="training-section-title"><span>03 / AURA SKILL BADGES</span><small>3 EJERCICIOS POR DISCIPLINA</small></div>
          <div className="training-hud-badge-grid">
            {(Object.keys(BADGE_CONFIG) as BadgeKey[]).map(key => {
              const config = BADGE_CONFIG[key];
              const badge = badges.find(item => item.badge_key === key) ?? EMPTY_BADGES.find(item => item.badge_key === key)!;
              const progress = Math.min(3, badge.progress);
              const unlocked = Boolean(badge.unlocked_at);
              return <article className={`training-hud-badge ${unlocked ? "is-unlocked" : ""}`} key={key}>
                <div className={`training-hud-badge-art ${config.image ? "" : "is-gym-icon"}`}>{config.image ? <img src={config.image} alt={config.title} loading="lazy" /> : <span aria-hidden="true">{key === "aerobic" ? "♥" : "✚"}</span>}</div>
                <div className="training-hud-badge-copy">
                  <small>{config.skill.toUpperCase()}</small>
                  <h3>{config.title}</h3>
                  <p>{config.description}</p>
                  <div className="training-hud-badge-progress"><i style={{ width: `${progress / 3 * 100}%` }} /></div>
                  <strong>{unlocked ? "BADGE DESBLOQUEADA ✓" : `${progress} / 3 ENTRENAMIENTOS`}</strong>
                </div>
                <span className="training-hud-badge-state">{unlocked ? "✦" : "LOCKED"}</span>
              </article>;
            })}
          </div>
        </section>

        </section>

        <section className="training-aura-program training-club-gym">
          <div className="training-section-title"><span>02 / CLUB TRAINING FLOOR</span><small>PREPARACIÓN FÍSICA · FUTSAL PERFORMANCE</small></div>
          <p className="training-unified-intro">Seis estaciones de preparación física del club. Completá los tres niveles de cada disciplina para desbloquear su badge y fortalecer tu perfil.</p>
          <div className="training-aura-toolbar"><p className="training-arena-intro">Completá los tres ejercicios de cada disciplina para desbloquear su badge y ganar 50 XP en tu carta.</p><button type="button" className="training-reset-button" onClick={() => void resetAuraTraining()} disabled={resettingTraining || drillSaving !== null || drills.length === 0}>{resettingTraining ? "REINICIANDO…" : "↻ REINICIAR ENTRENAMIENTO"}</button></div>
        {drillFeedback && <section className={`training-drill-feedback ${drillFeedback.xpAwarded > 0 ? "is-reward" : ""}`} role="status">
          <div className="training-drill-feedback-icon">{drillFeedback.xpAwarded > 0 ? "✦" : "✓"}</div>
          <div className="training-drill-feedback-copy">
            <small>{drillFeedback.xpAwarded > 0 ? "DISCIPLINA COMPLETADA" : "PROGRESO GUARDADO"}</small>
            <strong>{AURA_SKILLS[drillFeedback.skillKey].drills[drillFeedback.exerciseIndex].title}</strong>
            <span>{AURA_SKILLS[drillFeedback.skillKey].title} · {drillFeedback.progress}/3 ejercicios</span>
          </div>
          {drillFeedback.xpAwarded > 0 ? <div className="training-drill-feedback-reward"><b>+50 XP</b><span>{drillFeedback.statLabel} +{drillFeedback.statGain}</span></div> : <div className="training-drill-feedback-progress">{drillFeedback.progress}/3</div>}
        </section>}
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
                    const nextExercise = skill.drills.findIndex((_, drillIndex) => !drills.some(item => item.skill_key === skillKey && item.exercise_index === drillIndex));
                    const available = index === nextExercise;
                    const level = DRILL_LEVELS[index];
                    const token = `${skillKey}-${index}`;
                    return <div className={`training-aura-drill ${completed ? "is-done" : ""} ${!completed && !available ? "is-locked" : ""}`} key={token}>
                      <AuraDrillVisual skillKey={skillKey} exerciseIndex={index} compact />
                      <div className="training-aura-drill-copy"><small>{level.tag} · {drill.reps}</small><strong>{drill.title}</strong><p>{drill.description}</p><em>{completed ? "EJERCICIO REGISTRADO" : level.name + " · " + level.guidance}</em></div>
                      <button type="button" disabled={completed || !available || drillSaving !== null} onClick={() => { setActiveDrill({ skillKey, exerciseIndex: index }); setResting(false); setRestSeconds(30); }}>{completed ? "COMPLETADO ✓" : available ? "INICIAR ENTRENAMIENTO" : "BLOQUEADO"}</button>
                    </div>;
                  })}
                </div>
                {unlocked && <div className="training-aura-skill-reward">✦ DISCIPLINA COMPLETADA · {badges.find(item => item.badge_key === skillKey)?.unlocked_at ? "BADGE CONSERVADA" : "BADGE DESBLOQUEADA"}</div>}
              </article>;
            })}
          </div>
        </section>

        {activeDrill && (() => {
          const skill = AURA_SKILLS[activeDrill.skillKey];
          const drill = skill.drills[activeDrill.exerciseIndex];
          const token = `${activeDrill.skillKey}-${activeDrill.exerciseIndex}`;
          return <div className="training-guided-overlay" role="dialog" aria-modal="true" aria-labelledby="training-guided-title">
            <section className="training-guided-card">
              <button type="button" className="training-guided-close" aria-label="Cerrar sesión" onClick={() => { setActiveDrill(null); setResting(false); }}>×</button>
              <div className="training-guided-kicker">AURA TRAINING / SESIÓN GUIADA</div>
              <div className="training-guided-discipline"><img src={skill.image} alt="" /><span>{skill.title}</span><b>{DRILL_LEVELS[activeDrill.exerciseIndex].tag}</b></div>
              <h2 id="training-guided-title">{drill.title}</h2>
              <AuraDrillVisual skillKey={activeDrill.skillKey} exerciseIndex={activeDrill.exerciseIndex} />
              <div className="training-guided-level"><small>DIFICULTAD PROGRESIVA</small><strong>{DRILL_LEVELS[activeDrill.exerciseIndex].name}</strong><p>{DRILL_LEVELS[activeDrill.exerciseIndex].guidance}</p></div>
              <div className="training-guided-dose"><small>OBJETIVO DE ESTA SESIÓN</small><strong>{drill.reps}</strong></div>
              <div className="training-guided-step"><span>01</span><div><strong>PREPARÁ EL ESPACIO</strong><p>Buscá un lugar despejado, prepará los elementos que necesites y empezá a un ritmo que puedas controlar.</p></div></div>
              <div className="training-guided-step"><span>02</span><div><strong>EJECUTÁ EL EJERCICIO</strong><p>{drill.description}</p></div></div>
              <div className="training-guided-benefit"><small>TRANSFERENCIA AL JUEGO</small><p>{drill.benefit}</p></div>
              {!resting ? <div className="training-guided-rest-ready">
                <strong>¿TERMINASTE LA DOSIS?</strong>
                <p>Cuando completes las repeticiones o recorridos indicados, iniciá una pausa de recuperación de 30 segundos.</p>
                <button type="button" onClick={() => { setRestSeconds(30); setResting(true); }}>INICIAR PAUSA · 00:30</button>
              </div> : <div className="training-guided-timer">
                <small>PAUSA DE RECUPERACIÓN</small><strong>00:{String(restSeconds).padStart(2,"0")}</strong>
                <button type="button" onClick={() => setResting(false)}>TERMINAR PAUSA</button>
              </div>}
              <div className="training-guided-actions">
                <button type="button" className="training-guided-secondary" onClick={() => { setActiveDrill(null); setResting(false); }}>SALIR SIN GUARDAR</button>
                <button type="button" className="training-guided-complete" disabled={resting || drillSaving !== null} onClick={() => { setActiveDrill(null); setResting(false); void completeDrill(activeDrill.skillKey, activeDrill.exerciseIndex); }}>{drillSaving === token ? "GUARDANDO…" : "FINALIZAR Y GUARDAR"}</button>
              </div>
              <p className="training-guided-note">El progreso se registra únicamente al finalizar. Adaptá la intensidad y detenete si sentís molestias.</p>
            </section>
          </div>;
        })()}

        {error && <p className="training-feedback is-error" role="alert">{error}</p>}
        {notice && <p className="training-feedback" role="status">{notice}</p>}

        {levelUpReward && <div className="training-levelup-overlay" role="dialog" aria-modal="true" aria-labelledby="training-levelup-title">
          <div className="training-levelup-card">
            <div className="training-levelup-orbit" aria-hidden="true">✦</div>
            <small>AURA PLAYER EVOLUTION</small>
            <h2 id="training-levelup-title">LEVEL UP</h2>
            <div className="training-levelup-level">LVL {levelUpReward.current}</div>
            <p>Tu carta acaba de evolucionar.</p>
            <div className="training-levelup-reward">
              <span>+50 XP</span>
              <strong>{levelUpReward.statLabel} +{levelUpReward.statGain}</strong>
            </div>
            <div className="training-levelup-from">NIVEL {levelUpReward.previous} <span>→</span> NIVEL {levelUpReward.current}</div>
            <button type="button" onClick={() => setLevelUpReward(null)}>SEGUIR EVOLUCIONANDO</button>
          </div>
        </div>}

        {unlockedBadge && <div className="training-badge-modal" role="dialog" aria-modal="true" aria-labelledby="training-badge-modal-title">
          <div className="training-badge-modal-card">
            <button type="button" className="training-badge-modal-close" aria-label="Cerrar" onClick={() => setUnlockedBadge(null)}>×</button>
            <small>✦ AURA SKILL BADGE DESBLOQUEADA ✦</small>
            {BADGE_CONFIG[unlockedBadge].image ? <img src={BADGE_CONFIG[unlockedBadge].image} alt={BADGE_CONFIG[unlockedBadge].title} /> : <div className="training-badge-modal-gym-icon" aria-hidden="true">{unlockedBadge === "aerobic" ? "♥" : "✚"}</div>}
            <span>{BADGE_CONFIG[unlockedBadge].skill.toUpperCase()}</span>
            <h2 id="training-badge-modal-title">{BADGE_CONFIG[unlockedBadge].title}</h2>
            <p>{BADGE_CONFIG[unlockedBadge].description}</p>
            <button type="button" onClick={() => setUnlockedBadge(null)}>RECLAMAR BADGE</button>
          </div>
        </div>}

        <p className="training-disclaimer">Entrená con una carga adecuada a tu edad y condición. Priorizá la técnica, descansá entre series y detenete ante cualquier dolor. Los ejercicios de fuerza se realizan con peso corporal y supervisión adulta cuando corresponda.</p>
      </div>
    </main>
  );
}