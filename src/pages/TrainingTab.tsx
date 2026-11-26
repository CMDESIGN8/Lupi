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
};
const EMPTY_BADGES: TrainingBadge[] = (Object.keys(BADGE_CONFIG) as BadgeKey[]).map(badge_key => ({ badge_key, progress: 0, unlocked_at: null }));

const todayArgentina = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

function AuraReactionChallenge({ onComplete }: { onComplete: (result: TrainingResult) => void }) {
  const [round, setRound] = useState(0);
  const [signal, setSignal] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [reaction, setReaction] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const completionRef = useRef(onComplete);
  useEffect(() => { completionRef.current = onComplete; }, [onComplete]);
  const rounds = 5;
  useEffect(() => {
    if (finished.current || reaction !== null || round >= rounds) return;
    setWaiting(true); setSignal(false);
    const timer = window.setTimeout(() => { startedAt.current = performance.now(); setSignal(true); setWaiting(false); }, 1000 + Math.random() * 1800);
    return () => window.clearTimeout(timer);
  }, [round, reaction]);
  useEffect(() => {
    if (reaction === null || finished.current) return;
    const timer = window.setTimeout(() => {
      const updated = [...times, reaction];
      setTimes(updated);
      if (updated.length >= rounds) {
        finished.current = true;
        const avg = updated.reduce((sum, ms) => sum + ms, 0) / updated.length;
        const grade: TrainingResult["grade"] = avg < 250 && falseStarts === 0 ? "S" : avg < 350 ? "A" : avg < 500 ? "B" : "C";
        const delta = grade === "S" ? 8 : grade === "A" ? 5 : grade === "B" ? 3 : 1;
        const xpBonus = grade === "S" ? 200 : grade === "A" ? 120 : grade === "B" ? 70 : 40;
        completionRef.current({ stat: "physical", grade, delta, xpBonus, message: `Media ${Math.round(avg)} ms · ${falseStarts} salida(s) anticipada(s)` });
      } else { setRound(updated.length); setReaction(null); }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [reaction, times, falseStarts]);
  const tap = () => {
    if (finished.current) return;
    if (!signal) { setFalseStarts(n => n + 1); setSignal(true); setWaiting(false); startedAt.current = performance.now(); return; }
    setSignal(false); setReaction(Math.round(performance.now() - startedAt.current));
  };
  const avg = times.length ? Math.round(times.reduce((s, ms) => s + ms, 0) / times.length) : 0;
  return <div className="aura-reaction-game">
    <div className="aura-reaction-head"><small>REACTION MODE · RONDA {Math.min(round + 1, rounds)} / {rounds}</small><strong>{avg ? avg + " ms" : "PREPARATE"}</strong></div>
    <div className="aura-reaction-progress">{Array.from({length: rounds}, (_,i)=><i key={i} className={i < times.length ? "is-done" : i === round ? "is-current" : ""}/>)}</div>
    <button type="button" onClick={tap} className={`aura-reaction-pad ${signal ? "is-signal" : waiting ? "is-waiting" : "is-result"}`}>
      <span>{signal ? "⚡" : waiting ? "◉" : reaction !== null ? "✓" : "●"}</span>
      <strong>{signal ? "¡AHORA!" : waiting ? "ESPERÁ LA SEÑAL" : reaction !== null ? reaction + " MS" : "PREPARADO"}</strong>
      <small>{signal ? "TOCÁ YA" : waiting ? "No anticipes" : reaction !== null ? "Siguiente ronda…" : "Esperá el cambio"}</small>
    </button>
    <div className="aura-reaction-stats"><span>RONDAS <b>{times.length}/{rounds}</b></span><span>FALSAS SALIDAS <b>{falseStarts}</b></span></div>
    <p className="aura-reaction-note">Respondé apenas aparezca la señal. Las salidas anticipadas se registran.</p>
  </div>;
}

function AuraBossChallenge({ onComplete, onExit }: { onComplete: (result: TrainingResult) => void; onExit: () => void }) {
 const [stage,setStage]=useState(0),[seconds,setSeconds]=useState(12),[combo,setCombo]=useState(0),[bestCombo,setBestCombo]=useState(0),[score,setScore]=useState(0),[hits,setHits]=useState(0),[finished,setFinished]=useState(false);
 const names=["REACTION BURST","CONTROL RUSH","FINAL OVERDRIVE"];
 useEffect(()=>{if(finished)return;const timer=window.setInterval(()=>setSeconds(s=>s>0?s-1:0),1000);return()=>window.clearInterval(timer)},[finished,stage]);
 useEffect(()=>{if(seconds!==0||finished)return;if(stage<2){setStage(s=>s+1);setSeconds(12);setCombo(0)}else setFinished(true)},[seconds,stage,finished]);
 const tap=()=>{if(finished||seconds<=0)return;const n=combo+1;setCombo(n);setBestCombo(b=>Math.max(b,n));setHits(h=>h+1);setScore(s=>s+10+Math.min(20,Math.floor(n/5)*5))};
 const claim=()=>{const grade:TrainingResult["grade"]=score>=900?"S":score>=650?"A":score>=400?"B":"C";const delta=grade==="S"?10:grade==="A"?7:grade==="B"?4:2;const xpBonus=grade==="S"?250:grade==="A"?180:grade==="B"?120:60;onComplete({stat:"physical",grade,delta,xpBonus,message:`Boss Score ${score} · ${hits} acciones · combo ${bestCombo}`})};
 return <div className="aura-boss-game"><div className="aura-boss-top"><small>BOSS CHALLENGE · FASE {stage+1}/3</small><strong>{seconds}s</strong></div><div className="aura-boss-stage"><span>FASE {stage+1}</span><h3>{names[stage]}</h3><p>¡Mantené el ritmo y encadená acciones para subir el combo!</p></div><button className="aura-boss-tap" type="button" disabled={finished||seconds<=0} onClick={tap}><span>⚡</span><strong>TOCÁ PARA ATACAR</strong><small>+ PUNTOS · + COMBO</small></button><div className="aura-boss-stats"><div><small>SCORE</small><strong>{score}</strong></div><div><small>COMBO</small><strong>×{combo}</strong></div><div><small>MEJOR COMBO</small><strong>×{bestCombo}</strong></div><div><small>ACCIONES</small><strong>{hits}</strong></div></div><div className="aura-boss-stage-progress">{names.map((n,i)=><i key={n} className={i<stage?"is-done":i===stage?"is-current":""}/>)}</div>{finished?<div className="aura-boss-finish"><small>ARENA COMPLETADA</small><strong>{score} PUNTOS</strong><p>Combo máximo ×{bestCombo} · {hits} acciones</p><button type="button" onClick={claim}>RECLAMAR RECOMPENSA</button></div>:<button type="button" className="aura-boss-exit" onClick={onExit}>ABANDONAR DESAFÍO</button>}</div>;
}

export function TrainingTab({ user }: { user: AppUser }) {
  const [stats, setStats] = useState<PlayerStats>({
    pace: 10, dribbling: 10, passing: 10, defending: 10, finishing: 10, physical: 10,
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
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [reactionChallenge, setReactionChallenge] = useState(false);
  const [bossChallenge, setBossChallenge] = useState(false);
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
      setError("Falta aplicar la migración 20261126_aura_training_reset.sql en Supabase para habilitar los desafíos AURA.");
    } else {
      const savedBadges = (badgesResult.data ?? []) as TrainingBadge[];
      setBadges(EMPTY_BADGES.map(base => savedBadges.find(item => item.badge_key === base.badge_key) ?? base));
      setDrills((drillsResult.data ?? []) as DrillRecord[]);
    }
    setLoading(false);
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
    let statKey: TrainingStat | undefined;
    let statBefore = 0;
    let statAfter = 0;
    let statLabel = "ATRIBUTO";
    let statGain = 0;

    if (row?.success) {
      setTrainingXp(Number(row.user_card_exp ?? trainingXp));
      setCardLevel(Number(row.user_card_level ?? cardLevel));
      statKey = row.stat_key as TrainingStat | undefined;
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
    const confirmed = window.confirm("¿Reiniciar AURA Training? Los 12 ejercicios volverán a estar pendientes. Tu carta, XP, atributos y badges ganadas se conservan. Las recompensas de carta no se entregan nuevamente.");
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

  const handleGameResult = useCallback(async (result: TrainingResult, gameIdOverride?: GameId) => {
    const gameId = gameIdOverride ?? selectedGame;
    if (!gameId || resultSubmitted.current || saving) return;
    resultSubmitted.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    const before = stats[result.stat];
    const { data, error: rpcError } = await supabase.rpc("complete_personal_training", {
      p_game_id: gameId,
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
          game_id: gameId, stat: result.stat, grade: result.grade, delta: Number(row.xp_awarded ?? result.xpBonus), created_at: new Date().toISOString(),
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
          <div className="training-section-title"><span>00 / TU PLAYER CARD</span><small>ATRIBUTOS PERSONALES · MÁX. 99</small></div>
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



        <section className="training-aura-program">
          <div className="training-section-title"><span>01 / TRAINING LAB</span><small>ENTRENÁ · DESARROLLÁ SKILLS · DESBLOQUEÁ BADGES</small></div>
          <p className="training-unified-intro">Elegí una disciplina, completá sus 3 ejercicios progresivos y desbloqueá su insignia. Cada ejercicio suma progreso a tu jugador.</p>
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
                <div className={`training-inline-badge ${unlocked ? "is-unlocked" : ""}`}>
                  <img src={BADGE_CONFIG[skillKey].image} alt="" />
                  <div><small>BADGE DE DISCIPLINA</small><strong>{BADGE_CONFIG[skillKey].title}</strong><span>{unlocked ? "DESBLOQUEADA ✓" : `${done}/3 ejercicios · ${3-done} para desbloquear`}</span></div>
                  <b>{unlocked ? "✦" : "🔒"}</b>
                </div>
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

        <section className="training-challenge-arena training-unified-arena">
          <div className="training-section-title"><span>02 / CHALLENGE ARENA</span><small>COMPETÍ · SUMÁ XP · MEJORÁ TU CARTA</small></div>
          <p className="training-unified-intro">Los ejercicios desarrollan tus fundamentos. En la Arena los ponés a prueba con minijuegos y desafíos de rendimiento.</p>
          <div className="training-arena-map">
            <div className="training-arena-map-head"><span>MODOS DE JUEGO</span><strong>{Math.max(0,5-gamesPlayed)} / 5 ENERGÍA</strong></div>
            {bossChallenge ? <div className="training-game-stage"><div className="training-game-top"><div><span>BOSS ACTIVO</span><h2>CHALLENGE ARENA</h2></div><button type="button" onClick={() => setBossChallenge(false)} disabled={saving}>SALIR</button></div><AuraBossChallenge onExit={() => setBossChallenge(false)} onComplete={result => { setBossChallenge(false); void handleGameResult(result, "physical"); }} /></div> : reactionChallenge ? <div className="training-game-stage"><div className="training-game-top"><div><span>MINIJUEGO ACTIVO</span><h2>REACTION MODE</h2></div><button type="button" onClick={() => setReactionChallenge(false)} disabled={saving}>SALIR</button></div><AuraReactionChallenge onComplete={result => { setReactionChallenge(false); void handleGameResult(result, "physical"); }} /></div> : loading ? <div className="training-empty">Cargando tu carta...</div> : selectedGame ? <div className="training-game-stage"><div className="training-game-top"><div><span>MINIJUEGO ACTIVO</span><h2>{GAME_CONFIG[selectedGame].label}</h2></div><button type="button" onClick={() => { setSelectedGame(null); resultSubmitted.current = false; }} disabled={saving}>SALIR</button></div><TrainingGame key={selectedGame} gameId={selectedGame} stat={GAME_CONFIG[selectedGame].stat} onComplete={handleGameResult} difficulty="normal" />{saving && <p className="training-feedback">Guardando la evolución de tu carta...</p>}</div> : <>
              <div className="training-arena-stage-grid">
                <button type="button" className="training-arena-stage is-open" onClick={() => setReactionChallenge(true)} disabled={!canTrain}><span className="training-arena-stage-number">01</span><span className="training-arena-stage-icon">⚡</span><strong>REACTION</strong><small>REFLEJOS · FÍSICO</small><b>JUGAR ↗</b></button>
                <button type="button" className="training-arena-stage" onClick={() => startGame("dribbling")} disabled={!canTrain}><span className="training-arena-stage-number">02</span><span className="training-arena-stage-icon">◈</span><strong>CONTROL</strong><small>DOMINIO · GAMBETA</small><b>JUGAR ↗</b></button>
                <button type="button" className="training-arena-stage" onClick={() => startGame("pace")} disabled={!canTrain}><span className="training-arena-stage-number">03</span><span className="training-arena-stage-icon">➤</span><strong>SPEED</strong><small>EXPLOSIVIDAD · VELOCIDAD</small><b>JUGAR ↗</b></button>
                <button type="button" className="training-arena-stage" onClick={() => startGame("physical")} disabled={!canTrain}><span className="training-arena-stage-number">04</span><span className="training-arena-stage-icon">⌁</span><strong>AGILITY</strong><small>GIROS · FÍSICO</small><b>JUGAR ↗</b></button>
                <button type="button" className="training-arena-stage is-boss-open" onClick={() => setBossChallenge(true)} disabled={!canTrain}><span className="training-arena-stage-number">05</span><span className="training-arena-stage-icon">✦</span><strong>BOSS CHALLENGE</strong><small>3 FASES · SCORE · COMBO</small><b>ENFRENTAR ↗</b></button>
              </div>
              <div className="training-arena-map-foot"><span>ENERGÍA DIARIA DISPONIBLE</span><strong>{Math.max(0,5-gamesPlayed)} / 5</strong><i><b style={{width:`${Math.max(0,5-gamesPlayed)/5*100}%`}}/></i><small>{canTrain ? "Cada desafío mejora un atributo de tu carta." : "Completaste tus 5 desafíos de hoy. Volvé mañana."}</small></div>
              <div className="training-unified-selector"><strong>OTROS MINIJUEGOS</strong><p>Elegí una habilidad específica para practicar.</p><TrainingGameSelector onSelectGame={startGame} /></div>
            </>}
          </div>
        </section>

        {attempts.length > 0 && <section className="training-history">
          <div className="training-section-title"><span>03 / TU RENDIMIENTO</span><small>PROGRESO GUARDADO</small></div>
          <div className="training-history-list">{attempts.map((attempt, index) => (
            <article key={`${attempt.game_id}-${index}`}>
              <span>{STAT_LABELS[attempt.stat]}</span><strong>CALIFICACIÓN {attempt.grade}</strong><b>+{attempt.delta}</b>
            </article>
          ))}</div>
        </section>}

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