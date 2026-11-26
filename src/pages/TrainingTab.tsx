import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AppUser } from "../lib/api";
import "./TrainingTab.css";

type ProgramId = "start-7" | "pro-21" | "elite-30";
type Session = { program_id: ProgramId; day_number: number; completed_at: string };
const PROGRAMS: { id: ProgramId; name: string; duration: number; level: string; description: string; focus: string[] }[] = [
  { id: "start-7", name: "START 07", duration: 7, level: "INICIACIÓN", description: "Activá tu cuerpo y construí una base de entrenamiento.", focus: ["Coordinación", "Movilidad", "Técnica"] },
  { id: "pro-21", name: "PRO 21", duration: 21, level: "DESARROLLO", description: "Un recorrido progresivo para mejorar tu rendimiento en cancha.", focus: ["Velocidad", "Agilidad", "Técnica"] },
  { id: "elite-30", name: "ELITE 30", duration: 30, level: "AVANZADO", description: "Más constancia, intensidad y control de tu evolución.", focus: ["Potencia", "Resistencia", "Control"] },
];
const FOCUS = [
  ["Movilidad y activación", "Prepará articulaciones y músculos antes de acelerar."],
  ["Coordinación de pies", "Trabajá apoyos cortos, ritmo y control corporal."],
  ["Técnica con pelota", "Sumá conducción, cambios de dirección y dominio."],
  ["Velocidad de reacción", "Respondé rápido a señales y cambios de estímulo."],
  ["Agilidad y frenadas", "Acelerá, frená y cambiá de dirección con control."],
  ["Control y precisión", "Priorizá calidad de movimiento y precisión técnica."],
  ["Recuperación activa", "Bajá la intensidad y recuperá movilidad."],
];
const sessionFor = (day: number) => FOCUS[(day - 1) % FOCUS.length];

export function TrainingTab({ user }: { user: AppUser }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<ProgramId>("start-7");
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("training_sessions")
      .select("program_id,day_number,completed_at")
      .eq("user_id", user.id);
    if (queryError) setError("No pudimos cargar tu progreso de entrenamiento. Revisá que esté aplicada la actualización de Training en Supabase.");
    else setSessions((data ?? []) as Session[]);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  const program = PROGRAMS.find((item) => item.id === selected)!;
  const completedDays = useMemo(() => new Set(sessions.filter((s) => s.program_id === selected).map((s) => s.day_number)), [sessions, selected]);
  const completedCount = completedDays.size;
  const progress = Math.round((completedCount / program.duration) * 100);
  const nextDay = Array.from({ length: program.duration }, (_, i) => i + 1).find((day) => !completedDays.has(day)) ?? null;

  const completeDay = async (day: number) => {
    if (savingDay !== null || completedDays.has(day)) return;
    setSavingDay(day);
    setError("");
    setNotice("");
    const { data, error: rpcError } = await supabase.rpc("complete_training_session", {
      p_program_id: selected,
      p_day_number: day,
    });
    if (rpcError) {
      setError("No se pudo guardar el desafío. Verificá que la migración de Training esté aplicada en Supabase.");
    } else {
      const result = Array.isArray(data) ? data[0] : data;
      if (result?.success) {
        setSessions((current) => [...current, { program_id: selected, day_number: day, completed_at: new Date().toISOString() }]);
        setNotice("¡Desafío completado! Sumaste 50 XP a tu jugador.");
        window.dispatchEvent(new Event("lupi:progression-updated"));
      } else {
        await load();
        setNotice("Este desafío ya estaba registrado. Tu recompensa no se duplicó.");
      }
    }
    setSavingDay(null);
  };

  return (
    <main className="main-content training-hub">
      <div className="training-shell">
        <header className="training-hero">
          <span className="training-kicker">LUPI WORLD / PLAYER DEVELOPMENT</span>
          <h1>TRAINING<span> HUB</span></h1>
          <p>Entrená, completá desafíos y llevá tu evolución a la cancha.</p>
          <div className="training-player-stats">
            <div><strong>{user.level ?? 1}</strong><small>NIVEL</small></div>
            <div><strong>{(user.exp ?? 0).toLocaleString("es-AR")}</strong><small>XP TOTAL</small></div>
            <div><strong>{sessions.length}</strong><small>DESAFÍOS</small></div>
          </div>
        </header>

        <section className="training-programs">
          <div className="training-section-title"><span>01 / ELEGÍ TU PROGRAMA</span><small>TU RITMO, TU EVOLUCIÓN</small></div>
          <div className="training-program-grid">
            {PROGRAMS.map((item) => {
              const count = sessions.filter((s) => s.program_id === item.id).length;
              return <button key={item.id} type="button" className={`training-program-card ${selected === item.id ? "is-selected" : ""}`} onClick={() => { setSelected(item.id); setNotice(""); }}>
                <span className="training-program-level">{item.level}</span>
                <strong>{item.name}</strong>
                <span className="training-program-duration">{item.duration} DÍAS · +{item.duration * 50} XP</span>
                <p>{item.description}</p>
                <div className="training-program-footer"><span>{count}/{item.duration} COMPLETADOS</span><b>{selected === item.id ? "SELECCIONADO ✓" : "VER PROGRAMA ↗"}</b></div>
              </button>;
            })}
          </div>
        </section>

        <section className="training-progress-card">
          <div className="training-progress-top"><div><span className="training-section-label">TU PLAYER EVOLUTION</span><h2>{program.name}</h2></div><strong>{progress}%</strong></div>
          <div className="training-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="training-progress-meta"><span>{completedCount} de {program.duration} desafíos</span><span>{completedCount * 50} / {program.duration * 50} XP</span></div>
          <div className="training-focus-tags">{program.focus.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </section>

        <section className="training-challenges">
          <div className="training-section-title"><span>02 / DESAFÍOS DEL PROGRAMA</span><small>+50 XP POR DÍA</small></div>
          {loading ? <div className="training-empty">Cargando tu evolución...</div> : <div className="training-day-list">
            {Array.from({ length: program.duration }, (_, index) => {
              const day = index + 1;
              const done = completedDays.has(day);
              const [title, description] = sessionFor(day);
              const locked = !done && day !== nextDay;
              return <article key={day} className={`training-day-card ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}`}>
                <div className="training-day-number">{String(day).padStart(2, "0")}</div>
                <div className="training-day-copy"><span>DÍA {day}</span><h3>{title}</h3><p>{description}</p></div>
                <div className="training-day-action">{done ? <b>✓ COMPLETADO</b> : locked ? <span>🔒</span> : <button type="button" disabled={savingDay !== null} onClick={() => void completeDay(day)}>{savingDay === day ? "GUARDANDO…" : "COMPLETAR +50 XP"}</button>}</div>
              </article>;
            })}
          </div>}
        </section>
        {error && <p className="training-feedback is-error" role="alert">{error}</p>}
        {notice && <p className="training-feedback" role="status">{notice}</p>}
        <p className="training-disclaimer">Entrená a tu ritmo. Adaptá la intensidad a tu condición física y priorizá la técnica. Si sentís dolor, detené el ejercicio.</p>
      </div>
    </main>
  );
}
