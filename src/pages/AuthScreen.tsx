// src/pages/AuthScreen.tsx
import { useState } from "react";
import { api, AppUser } from "../lib/api";
import { CLUBS } from "../lib/constants";
import { useToastContext } from "../components/ToastProvider";


function Alert({ type, msg }: { type: "error" | "success"; msg: string }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type} fade-up`}>
      {type === "error" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

export function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    club: "",
    referralCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToastContext();


  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email || !form.password) throw new Error("Completá todos los campos.");
        const user = await api.login({ email: form.email, password: form.password });
        onAuth(user);
      } else {
        if (!form.email || !form.password || !form.username || !form.club)
          throw new Error("Completá todos los campos.");
        if (form.password.length < 6)
          throw new Error("La contraseña debe tener al menos 6 caracteres.");

        const user = await api.register({
          email: form.email,
          password: form.password,
          username: form.username,
          club: form.club,
          referralCode: form.referralCode || undefined,
        });

        if (form.referralCode) {
  setTimeout(() => {
    showToast("🎉 ¡Bienvenido! Arrancás con 75 puntos (50 de bienvenida + 25 del código).", "success");
  }, 500);
} else {
  setTimeout(() => {
    showToast("🎉 ¡Bienvenido! Arrancás con 50 puntos de regalo.", "success");
  }, 500);
}
        onAuth(user);
      }
    } catch (e: any) {
      setError(e.message);
      console.error("Error en autenticación:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <section className="auth-hero-v2">
          <div className="auth-hero-copy">
            <span className="auth-kicker">LUPIAPP · TEMPORADA 1</span>
            <h1>
              Tu club.<br />
              <em>Tus cartas.</em>
            </h1>
            <p>Jugá partidos, conseguí jugadores y llevá a tu club a la cima.</p>

            <div className="auth-card-preview">
              <div className="auth-avatar">⚽</div>
              <div className="auth-card-info">
                <strong>BURRITO</strong>
                <small>BRONCE · OVR 10</small>
              </div>
              <div className="auth-ovr-badge">10</div>
            </div>
          </div>
          <div className="auth-hero-glow" />
          <div className="auth-hero-ball">⚽</div>
        </section>

        <section className="auth-card-v2">
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Iniciar sesión
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Crear cuenta
            </button>
          </div>

          <Alert type="error" msg={error} />

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Nombre de usuario</label>
              <input
                className="form-input"
                placeholder="@LupiApp"
                value={form.username}
                onChange={set("username")}
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="vos@ejemplo.com"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "register" && (
            <>
              <div className="form-group">
                <label className="form-label">Club de barrio</label>
                <select className="form-input" value={form.club} onChange={set("club")}>
                  <option value="">Seleccioná tu club</option>
                  {CLUBS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Código de referido (opcional)</label>
                <input
                  className="form-input"
                  placeholder="Ej: LUPIABCD12"
                  value={form.referralCode}
                  onChange={set("referralCode")}
                  style={{ textTransform: "uppercase" }}
                  autoComplete="off"
                />
                <small className="form-hint">
                  ¿Te invitaron? Ingresá su código y ganá 25 puntos extra
                </small>
              </div>
            </>
          )}

          <button
            className="btn btn-primary auth-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                {mode === "login" ? "Ingresando..." : "Registrando..."}
              </>
            ) : mode === "login" ? "ENTRAR" : "REGISTRARME"}
          </button>

          {mode === "register" && (
            <div className="auth-rewards">
              <div className="auth-reward-item"><span>🎁</span><div><strong>5 cartas</strong><small>iniciales</small></div></div>
              <div className="auth-reward-item"><span>⚡</span><div><strong>Pack diario</strong><small>gratis</small></div></div>
              <div className="auth-reward-item"><span>🏆</span><div><strong>Ranking</strong><small>de tu club</small></div></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}