import { useState, type FormEvent, type ChangeEvent } from "react";
import { api, type AppUser } from "../lib/api";
import { CLUBS } from "../lib/constants";
import { useToastContext } from "../components/ToastProvider";
import "./Auth.css";

type Mode = "login" | "register";
type FormData = { email: string; password: string; username: string; club: string; referralCode: string };

export function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormData>({ email: "", password: "", username: "", club: "", referralCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToastContext();

  const set = (key: keyof FormData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const changeMode = (next: Mode) => {
    if (loading) return;
    setMode(next);
    setError("");
  };

  const handleGoogleLogin = async () => {
  if (loading) return;

  setError("");
  setLoading(true);

  try {
    await api.signInWithGoogle();
  } catch (err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : "No pudimos conectar con Google."
    );
    setLoading(false);
  }
};

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email.trim() || !form.password) throw new Error("Completá todos los campos.");
        const user = await api.login({ email: form.email.trim(), password: form.password });
        onAuth(user);
      } else {
        if (!form.email.trim() || !form.password || !form.username.trim() || !form.club)
          throw new Error("Completá todos los campos.");
        if (form.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        const referralCode = form.referralCode.trim().toUpperCase();
        const user = await api.register({
          email: form.email.trim(), password: form.password,
          username: form.username.trim(), club: form.club,
          referralCode: referralCode || undefined,
        });
        // Mantenemos el mensaje de bienvenida; los puntos los asigna el backend.
        showToast(
          referralCode
            ? "🎉 ¡Bienvenido! Arrancás con 75 puntos (50 de bienvenida + 25 del código)."
            : "🎉 ¡Bienvenido! Arrancás con 50 puntos de regalo.",
          "success"
        );
        onAuth(user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error. Intentá nuevamente.");
      console.error("Error en autenticación:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`auth-screen auth-screen--${mode}`}>
      <div className="auth-stage" aria-hidden="true">
        <div className="auth-stage__scene" />
        <div className="auth-stage__shade" />
        <div className="auth-stage__spot auth-stage__spot--left" />
        <div className="auth-stage__spot auth-stage__spot--right" />
        <div className="auth-stage__fog" />
        <div className="auth-stage__particles" />
        <div className="auth-stage__light-sweep" />
        <div className="auth-stage__vignette" />
        <div className="auth-stage__grain" />
      </div>

      <div className="auth-shell">
        <header className="auth-intro">
          <span className="auth-kicker"><span className="auth-live-dot" /> LUPI WORLD · TEMPORADA 1</span>
          <div className="auth-intro__spacer" aria-hidden="true" />
          <h1>TU CLUB. TU MUNDO.<br /><em>TU HISTORIA.</em></h1>
          <p>Jugá, desafiá a otros y ganá recompensas por cada victoria, dentro y fuera de la cancha.</p>
          <div className="auth-pillars" aria-label="Qué podés hacer en Lupi World">
            <div className="auth-pillar"><span aria-hidden="true">🎮</span><strong>COMPETÍ</strong><small>Partidos y desafíos</small></div>
            <div className="auth-pillar"><span aria-hidden="true">👥</span><strong>CONECTÁ</strong><small>Tu comunidad</small></div>
            <div className="auth-pillar"><span aria-hidden="true">🏆</span><strong>PROGRESÁ</strong><small>XP, cartas y premios</small></div>
          </div>
        </header>

        <section className="auth-card-v2" aria-label="Acceso a Lupi World">
          <div className="auth-card-heading">
            <span className="auth-card-eyebrow">PLAYER ACCESS · S01</span>
            <h2>{mode === "login" ? "VOLVÉ A LA CANCHA" : "CREÁ TU JUGADOR"}</h2>
            <p>{mode === "login" ? "Tu equipo te está esperando." : "Tu historia en Lupi World empieza acá."}</p>
          </div>

          <div className="auth-tabs" role="group" aria-label="Modo de acceso">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")} disabled={loading} aria-pressed={mode === "login"}>Iniciar sesión</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")} disabled={loading} aria-pressed={mode === "register"}>Crear cuenta</button>
          </div>

          <div className="auth-google-section">


  <button
    type="button"
    className="auth-google-button"
    onClick={handleGoogleLogin}
    disabled={loading}
  >
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.79 7.18l7.73 6C44.39 38.03 46.98 31.89 46.98 24.55z"/>
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.2A23.88 23.88 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>

    {loading ? "CONECTANDO..." : "CONTINUAR CON GOOGLE"}
  </button>
</div>

          {error && <div className="auth-error" role="alert">⚠️ {error}</div>}
           <div className="auth-divider">
    <span>O CONTINUÁ CON</span>
  </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-group"><label className="form-label" htmlFor="auth-username">NOMBRE DE USUARIO</label><input id="auth-username" className="form-input" placeholder="@TuJugador" value={form.username} onChange={set("username")} autoComplete="username" required /></div>
            )}
            <div className="form-group"><label className="form-label" htmlFor="auth-email">EMAIL</label><input id="auth-email" className="form-input" type="email" placeholder="vos@ejemplo.com" value={form.email} onChange={set("email")} autoComplete="email" required /></div>
            <div className="form-group"><label className="form-label" htmlFor="auth-password">CONTRASEÑA</label><input id="auth-password" className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 6 : undefined} required /></div>
            {mode === "register" && (
              <>
                <div className="form-group"><label className="form-label" htmlFor="auth-club">CLUB DE BARRIO</label><select id="auth-club" className="form-input" value={form.club} onChange={set("club")} required><option value="">Seleccioná tu club</option>{CLUBS.map((club) => <option key={club} value={club}>{club}</option>)}</select></div>
                <div className="form-group"><label className="form-label" htmlFor="auth-referral">CÓDIGO DE REFERIDO (OPCIONAL)</label><input id="auth-referral" className="form-input" placeholder="Ej: LUPIABCD12" value={form.referralCode} onChange={set("referralCode")} style={{ textTransform: "uppercase" }} autoComplete="off" /><small className="form-hint">¿Te invitaron? Ingresá su código y ganá 25 puntos extra.</small></div>
              </>
            )}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (mode === "login" ? "INGRESANDO AL CLUB…" : "CREANDO TU JUGADOR…") : (mode === "login" ? "ENTRAR AL WORLD" : "CREAR MI JUGADOR")}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          

          {mode === "register" && (
            <div className="auth-rewards">
              <div className="auth-reward-item"><span>🎁</span><div><strong>5 cartas</strong><small>iniciales</small></div></div>
              <div className="auth-reward-item"><span>⚡</span><div><strong>Pack diario</strong><small>gratis</small></div></div>
              <div className="auth-reward-item"><span>🏆</span><div><strong>Ranking</strong><small>de tu club</small></div></div>
            </div>
          )}
          <div className="auth-card-footer">LUPI WORLD <span>✦</span> SEASON 01</div>
        </section>
      </div>
    </main>
  );
}
