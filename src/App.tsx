import { useState, useEffect, useCallback } from "react";
import { api, AppUser, Ticket, LeaderEntry } from "./lib/api";
import { CLUBS } from "./lib/constants";
import { Notifications } from './components/Notifications';
import { ReferralPanel } from './components/ReferralPanel';
import { TicketScanner } from './components/TicketScanner';



// ============================================================
// HELPERS
// ============================================================
function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// DESIGN SYSTEM (estilos completos)
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,400;0,600;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1c1c28;
    --border: #2a2a3a;
    --accent: #189df5;
    --accent2: #ff4d6d;
    --text: #f0f0f8;
    --text2: #8888aa;
    --success: #3dffa0;
    --radius: 12px;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'Barlow', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; overflow-x: hidden; }

  .app-wrapper { min-height: 100vh; position: relative; }
  .app-wrapper::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,197,24,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none; z-index: 0;
  }

  .container { max-width: 480px; margin: 0 auto; padding: 0 16px; position: relative; z-index: 1; }

  .auth-screen { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
  .auth-logo { text-align: center; margin-bottom: 32px; }
  .logo-badge { display: inline-flex; align-items: center; gap: 10px; }
  .logo-icon { width: 52px; height: 52px; background: var(--accent); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; transform: rotate(-4deg); box-shadow: 0 4px 20px rgba(245,197,24,0.3); }
  .logo-text { font-family: var(--font-display); font-size: 42px; letter-spacing: 2px; color: var(--text); line-height: 1; }
  .logo-text span { color: var(--accent); }
  .auth-tagline { text-align: center; color: var(--text2); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; }

  .auth-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px 28px; position: relative; overflow: hidden; }
  .auth-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
  .auth-title { font-family: var(--font-display); font-size: 28px; letter-spacing: 1px; margin-bottom: 24px; }

  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text2); margin-bottom: 6px; }
  .form-input { width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 13px 16px; color: var(--text); font-family: var(--font-body); font-size: 15px; transition: border-color 0.2s, box-shadow 0.2s; outline: none; appearance: none; }
  .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(245,197,24,0.12); }
  .form-input::placeholder { color: var(--text2); }
  select.form-input { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238888aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

  .btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 20px; border: none; border-radius: var(--radius); font-family: var(--font-display); font-size: 18px; letter-spacing: 1.5px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #0a0a0f; }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(245,197,24,0.35); }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-ghost { background: transparent; color: var(--text2); border: 1.5px solid var(--border); font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 0; }
  .btn-ghost:hover:not(:disabled) { border-color: var(--text2); color: var(--text); }
  .btn-danger { background: transparent; color: var(--accent2); border: 1.5px solid var(--accent2); font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 0; }

  .auth-switch { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text2); }
  .auth-switch button { background: none; border: none; color: var(--accent); font-family: var(--font-body); font-size: 14px; font-weight: 700; cursor: pointer; padding: 0 4px; text-decoration: underline; text-underline-offset: 2px; }

  .alert { padding: 12px 16px; border-radius: var(--radius); font-size: 14px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .alert-error { background: rgba(255,77,109,0.12); border: 1px solid rgba(255,77,109,0.3); color: var(--accent2); }
  .alert-success { background: rgba(61,255,160,0.1); border: 1px solid rgba(61,255,160,0.25); color: var(--success); }

  .app-header { position: sticky; top: 0; z-index: 100; background: rgba(10,10,15,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 14px 0; }
  .header-inner { display: flex; align-items: center; justify-content: space-between; }
  .header-logo { font-family: var(--font-display); font-size: 28px; letter-spacing: 2px; color: var(--text); }
  .header-logo span { color: var(--accent); }
  .header-right { display: flex; align-items: center; gap: 10px; }
  .points-pill { display: flex; align-items: center; gap: 6px; background: rgba(245,197,24,0.12); border: 1px solid rgba(245,197,24,0.25); border-radius: 100px; padding: 6px 14px; font-family: var(--font-display); font-size: 16px; color: var(--accent); letter-spacing: 0.5px; }

  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: rgba(18,18,26,0.97); backdrop-filter: blur(12px); border-top: 1px solid var(--border); display: flex; }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 0; background: none; border: none; cursor: pointer; color: var(--text2); font-family: var(--font-body); font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; transition: color 0.2s; gap: 4px; }
  .nav-item.active { color: var(--accent); }
  .nav-item .nav-icon { font-size: 22px; }

  .main-content { padding: 24px 0 100px; }

  .welcome-banner { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1px solid var(--border); border-radius: 20px; padding: 24px; margin-bottom: 20px; position: relative; overflow: hidden; }
  .welcome-banner::after { content: '🏟️'; position: absolute; right: 16px; bottom: -8px; font-size: 72px; opacity: 0.12; }
  .welcome-name { font-family: var(--font-display); font-size: 32px; letter-spacing: 1px; line-height: 1.1; margin-bottom: 4px; }
  .welcome-club { font-size: 13px; color: var(--accent); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .welcome-club-flores { font-size: 13px; color: #03b129; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; text-align: center; }
  .stat-number { font-family: var(--font-display); font-size: 36px; letter-spacing: 1px; color: var(--accent); line-height: 1; margin-bottom: 4px; }
  .stat-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text2); }

  .section-title { font-family: var(--font-display); font-size: 22px; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }

  .ticket-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; margin-bottom: 20px; }
  .ticket-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--accent2), var(--accent)); }
  .ticket-info-box { background: rgba(245,197,24,0.06); border: 1px solid rgba(245,197,24,0.2); border-radius: var(--radius); padding: 14px; margin-bottom: 20px; font-size: 13px; color: var(--text2); line-height: 1.6; }
  .ticket-info-box strong { color: var(--accent); }

  .ticket-item { display: flex; align-items: center; justify-content: space-between; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 10px; }
  .ticket-number { font-family: var(--font-display); font-size: 20px; letter-spacing: 2px; color: var(--accent); }
  .ticket-meta { font-size: 12px; color: var(--text2); margin-top: 2px; }
  .ticket-badge { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
  .badge-pendiente { background: rgba(245,197,24,0.12); color: var(--accent); border: 1px solid rgba(245,197,24,0.25); }
  .badge-ganador { 
  background: rgba(61,255,160,0.2); 
  color: #3dffa0;
  animation: pulse 1s infinite;
}
.badge-invalido { 
  background: rgba(255,77,109,0.2); 
  color: #ff4d6d;
}
  /* Nuevos estilos para badges */
.badge-participando { 
  background: rgba(24, 157, 245, 0.12); 
  color: #189df5; 
  border: 1px solid rgba(24, 157, 245, 0.25);
  animation: pulse-sorteo 2s infinite;
}

.badge-ganador { 
  background: rgba(61,255,160,0.2); 
  color: #3dffa0;
  border: 1px solid rgba(61,255,160,0.4);
  animation: pulse-gold 1s infinite;
  font-weight: bold;
}

@keyframes pulse-sorteo {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; box-shadow: 0 0 8px rgba(24, 157, 245, 0.5); }
}

@keyframes pulse-gold {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); background: rgba(61,255,160,0.3); }
}
  .leader-item { display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 10px; transition: border-color 0.2s; }
  .leader-item.me { border-color: var(--accent); background: rgba(245,197,24,0.05); }
  .leader-rank { font-family: var(--font-display); font-size: 22px; color: var(--text2); width: 28px; text-align: center; }
  .leader-rank.top { color: var(--accent); }
  .leader-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 16px; color: var(--text2); flex-shrink: 0; }
  .leader-info { flex: 1; min-width: 0; }
  .leader-name { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .leader-club { font-size: 12px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .leader-points { font-family: var(--font-display); font-size: 22px; color: var(--accent); letter-spacing: 0.5px; }

  .empty-state { text-align: center; padding: 40px 20px; color: var(--text2); }
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-text { font-size: 15px; }

  .spinner { width: 20px; height: 20px; border: 2px solid rgba(10,10,15,0.3); border-top-color: #0a0a0f; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.35s ease forwards; }

  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,197,24,0.3); } 50% { box-shadow: 0 0 0 8px rgba(245,197,24,0); } }
  .pulse { animation: pulse-glow 2s infinite; }

  .profile-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; margin-bottom: 16px; text-align: center; }
  .profile-avatar { width: 72px; height: 72px; background: var(--surface2); border: 3px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 32px; margin: 0 auto 12px; color: var(--accent); }
  .profile-username { font-family: var(--font-display); font-size: 28px; letter-spacing: 1px; margin-bottom: 4px; }
  .profile-email { font-size: 13px; color: var(--text2); margin-bottom: 8px; }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .loading-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
  .loading-logo { font-family: var(--font-display); font-size: 48px; letter-spacing: 4px; }
  .loading-logo span { color: var(--accent); }
  .spinner-lg { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
 /* Estilos para el scanner OCR */
.scanner-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
  padding: 16px;
}

.scanner-container {
  width: 100%;
  max-width: 500px;
  height: 90vh;
  max-height: 700px;
  background: var(--surface);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

/* Botón secundario */
.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border);
  border-color: var(--text2);
}

/* Overlay de procesamiento */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  z-index: 10;
}

.processing-overlay .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.scanner-header h3 {
  font-family: var(--font-display);
  font-size: 20px;
  margin: 0;
  color: var(--text);
}

.scanner-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text2);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.scanner-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Vista de cámara */
.camera-view {
  position: relative;
  background: #000;
  min-height: 300px;
  width: 100%;
}

.camera-preview {
  width: 100%;
  height: auto;
  min-height: 300px;
  object-fit: cover;
}

.camera-guide {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.guide-frame {
  width: 80%;
  height: 40%;
  border: 2px solid var(--accent);
  border-radius: 12px;
  animation: pulse-border 1.5s infinite;
}

.guide-text {
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 14px;
  margin-top: 16px;
  text-align: center;
  backdrop-filter: blur(4px);
}

.guide-text small {
  font-size: 11px;
  opacity: 0.8;
}

/* Vista previa */
.preview-view {
  position: relative;
  min-height: 300px;
  background: #000;
}

.image-preview {
  width: 100%;
  height: auto;
  min-height: 300px;
  object-fit: contain;
  background: #000;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
}

/* Ejemplo de entrada */
.example-ticket {
  background: rgba(24, 157, 245, 0.1);
  border: 1px solid rgba(24, 157, 245, 0.2);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin: 12px 0;
}

.example-number {
  font-family: monospace;
  font-size: 24px;
  font-weight: bold;
  color: var(--accent);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.example-label {
  font-size: 12px;
  color: var(--text2);
}

.scanner-instructions {
  padding: 20px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.instruction-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 12px;
  text-align: center;
}

.instruction-note {
  background: rgba(24, 157, 245, 0.1);
  border: 1px solid rgba(24, 157, 245, 0.2);
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  color: var(--accent);
  text-align: center;
  margin-top: 12px;
}

/* Footer con botones */
.scanner-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.scanner-footer .btn {
  flex: 1;
  padding: 12px 8px;
  font-size: 14px;
}

.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--border);
}

@keyframes pulse-border {
  0%, 100% {
    border-color: var(--accent);
    transform: scale(1);
  }
  50% {
    border-color: var(--accent2);
    transform: scale(1.02);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

// ============================================================
// COMPONENTS
// ============================================================

function Alert({ type, msg }: { type: "error" | "success"; msg: string }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type} fade-up`}>
      {type === "error" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

// ============================================================
// AUTH SCREEN
// ============================================================
function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", username: "", club: "",referralCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState('');


  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
        if (form.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        
        console.log('📝 Registrando con código:', form.referralCode);
        
        const user = await api.register({ 
          email: form.email,
          password: form.password,
          username: form.username,
          club: form.club,
          referralCode: form.referralCode || undefined
        });
        onAuth(user);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="auth-screen">
      <div className="container">
        <div className="auth-logo">
          <div className="logo-badge">
            <div className="logo-icon">🏆</div>
            <div className="logo-text">LUPI<span>APP</span></div>
          </div>
          <div className="auth-tagline">Tu club, tus puntos, tus premios</div>
        </div>

        <div className="auth-card fade-up">
          <div className="auth-title">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</div>
          <Alert type="error" msg={error} />

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Nombre de usuario</label>
              <input className="form-input" placeholder="@tupapito10" value={form.username} onChange={set("username")} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="vos@ejemplo.com" value={form.email} onChange={set("email")} />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Club de barrio</label>
              <select className="form-input" value={form.club} onChange={set("club")}>
                <option value="">Seleccioná tu club</option>
                {CLUBS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="form-label">Código de referido (opcional)</label>
       <input 
                  className="form-input" 
                  name="referralCode"
                  placeholder="Ej: LUPIABCD12" 
                  value={form.referralCode}
                  onChange={set("referralCode")}
                  style={{ textTransform: 'uppercase' }}
                />
      <small style={{ color: 'var(--text2)', fontSize: '11px' }}>
        ¿Te invitaron? Ingresá su código y ganá 25 puntos extra
      </small>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-primary pulse" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><div className="spinner" />{mode === "login" ? "Ingresando..." : "Registrando..."}</>
                : mode === "login" ? "ENTRAR" : "REGISTRARME"}
            </button>
          </div>

          <div className="auth-switch">
            {mode === "login"
              ? <>¿No tenés cuenta? <button onClick={() => { setMode("register"); setError(""); }}>Registrate gratis</button></>
              : <>¿Ya tenés cuenta? <button onClick={() => { setMode("login"); setError(""); }}>Iniciá sesión</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD TAB
// ============================================================
function DashboardTab({ user, onNavigate }: { user: AppUser; onNavigate: (t: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    api.getUserTickets(user.id).then(setTickets).catch(console.error);
    api.getLeaderboard().then(setLeaderboard).catch(console.error);
  }, [user.id, user.points]);

  const myRank = leaderboard.findIndex((u) => u.id === user.id) + 1;

  return (
    <div className="main-content">
      <div className="container">
        <div className="welcome-banner fade-up">
          <div className="welcome-name">¡Hola, {user.username}! 👋</div>
          <div className="welcome-club-flores">🏟️ {user.club}</div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text2)" }}>
            Cargá el número de tu entrada y acumulá puntos para ganar entradas gratis.
          </div>
        </div>

        <div className="stats-grid fade-up">
          <div className="stat-card"><div className="stat-number">{user.points}</div><div className="stat-label">Puntos</div></div>
          <div className="stat-card"><div className="stat-number">{myRank || "—"}</div><div className="stat-label">Posición</div></div>
          <div className="stat-card"><div className="stat-number">{tickets.length}</div><div className="stat-label">Entradas</div></div>
          <div className="stat-card"><div className="stat-number">+10</div><div className="stat-label">Pts x entrada</div></div>
        </div>

        <div className="section-title fade-up">🏅 Top 5 del momento</div>
        {leaderboard.slice(0, 5).map((u, i) => (
          <div key={u.id} className={`leader-item fade-up${u.id === user.id ? " me" : ""}`}>
            <div className={`leader-rank${i < 3 ? " top" : ""}`}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
            <div className="leader-avatar">{u.username[0].toUpperCase()}</div>
            <div className="leader-info">
              <div className="leader-name">{u.username}{u.id === user.id ? " (vos)" : ""}</div>
              <div className="leader-club">{u.club}</div>
            </div>
            <div className="leader-points">{u.points}</div>
          </div>
        ))}

        <div style={{ marginTop: 24 }} className="fade-up">
          <button className="btn btn-primary" onClick={() => onNavigate("ticket")}>🎟️ CARGAR ENTRADA</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TICKET TAB
// ============================================================
function TicketTab({ user, onPointsUpdate }: { user: AppUser; onPointsUpdate: (p: number) => void }) {
  const [ticketNumber, setTicketNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showScanner, setShowScanner] = useState(false); // Nuevo estado
  

  const loadTickets = useCallback(async () => {
    try {
      const t = await api.getUserTickets(user.id);
      setTickets(t);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  }, [user.id]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleSubmit = async (number?: string) => {
    const ticketToSubmit = number || ticketNumber;
    
    setError(""); 
    setSuccess("");
    
    if (!ticketToSubmit.trim()) { 
      setError("Ingresá o escaneá el número de tu entrada."); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await api.submitTicket({ ticketNumber: ticketToSubmit });
      setSuccess(`¡Entrada cargada! Sumaste 10 puntos. Total: ${res.newPoints} pts 🎉`);
      setTicketNumber("");
      loadTickets();
      onPointsUpdate(res.newPoints);
      
      // Feedback háptico
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setShowScanner(false); // Cerrar scanner si estaba abierto
    }
  };

  // En TicketTab, modificar handleScan
const handleScan = (scannedNumber: string) => {
  // Asegurar que solo números
  const cleanNumber = scannedNumber.replace(/[^0-9]/g, '');
  
  console.log('✅ Número escaneado:', cleanNumber);
  
  setTicketNumber(cleanNumber);
  setShowScanner(false);
  
  // Mostrar feedback
  const successMsg = `✅ Número encontrado: ${cleanNumber}`;
  setSuccess(successMsg);
  setTimeout(() => setSuccess(''), 3000);
  
  // Auto-enviar
  setTimeout(() => handleSubmit(cleanNumber), 500);
};

  return (
    <div className="main-content">
      <div className="container">
        {/* Scanner Modal */}
        {showScanner && (
          <TicketScanner 
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        <div className="section-title fade-up">🎟️ Cargar entrada</div>

        <div className="ticket-card fade-up">
          <div className="ticket-info-box">
            Escaneá el <strong>código QR de tu entrada</strong> o ingresá el número manualmente. 
            Cada entrada suma <strong>+10 puntos</strong>.
          </div>
          
          <Alert type="error" msg={error} />
          <Alert type="success" msg={success} />
          
          {/* Botón de escanear - Principal */}
          <button 
            className="btn btn-primary" 
            onClick={() => setShowScanner(true)}
            style={{ 
              marginBottom: 16,
              background: 'linear-gradient(135deg, var(--accent), #0f6bc0)'
            }}
          >
            📷 ESCANEAR QR
          </button>
          
          {/* Divider con texto */}
          <div style={{ 
            textAlign: 'center', 
            margin: '16px 0', 
            position: 'relative',
            color: 'var(--text2)',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            <span style={{ background: 'var(--surface)', padding: '0 12px' }}>O INGRESÁ MANUALMENTE</span>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: 0, 
              right: 0, 
              height: 1, 
              background: 'var(--border)',
              zIndex: -1
            }} />
          </div>
          
          {/* Input manual */}
          <div className="form-group">
            <label className="form-label">Número de entrada</label>
            <input
              className="form-input"
              placeholder="Ej: 00123456"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              maxLength={12}
              style={{ 
                fontSize: 22, 
                fontFamily: "var(--font-display)", 
                letterSpacing: 4, 
                textAlign: "center",
                textTransform: 'uppercase'
              }}
            />
          </div>
          
          <button 
            className="btn btn-ghost" 
            onClick={() => handleSubmit()} 
            disabled={loading} 
            style={{ marginTop: 8 }}
          >
            {loading ? <><div className="spinner" />Verificando...</> : "REGISTRAR ENTRADA MANUAL"}
          </button>
        </div>

        {/* Resto del componente igual... */}
        <div className="section-title fade-up">📋 Mis entradas ({tickets.length})</div>
        {loadingTickets ? (
          <div className="empty-state"><div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="empty-icon">🎟️✨</div>
            <div className="empty-text">¡Escaneá tu primera entrada!</div>
            <div className="empty-subtext" style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>
              Usá la cámara para escanear el código QR<br />
              y comenzá a sumar puntos
            </div>
          </div>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="ticket-item fade-up">
              <div>
                <div className="ticket-number"># {t.ticketNumber}</div>
                <div className="ticket-meta">{formatDate(t.createdAt)}</div>
              </div>
              <div>
                <span className={`ticket-badge badge-${t.status}`}>
                  {t.status === 'pendiente' && '⏳ Pendiente'}
                  {t.status === 'participando' && '🎯 ¡En sorteo!'}
                  {t.status === 'ganador' && '🏆 ¡GANADORA!'}
                  {t.status === 'invalido' && '❌ Inválida'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// ============================================================
// LEADERBOARD TAB
// ============================================================
function LeaderboardTab({ user }: { user: AppUser }) {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then((l) => { setLeaders(l); setLoading(false); }).catch(console.error);
  }, []);

  return (
    <div className="main-content">
      <div className="container">
        <div className="section-title fade-up">🏆 Ranking general</div>
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} /></div>
        ) : leaders.length === 0 ? (
          <div className="empty-state fade-up"><div className="empty-icon">🏟️</div><div className="empty-text">Nadie cargó entradas todavía. ¡Sé el primero!</div></div>
        ) : (
          leaders.map((u, i) => (
            <div key={u.id} className={`leader-item fade-up${u.id === user.id ? " me" : ""}`}>
              <div className={`leader-rank${i < 3 ? " top" : ""}`}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
              <div className="leader-avatar">{u.username[0].toUpperCase()}</div>
              <div className="leader-info">
                <div className="leader-name">{u.username}{u.id === user.id ? " (vos)" : ""}</div>
                <div className="leader-club">{u.club}</div>
              </div>
              <div className="leader-points">{u.points} pts</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================
// ProfileTab actualizado
function ProfileTab({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await api.logout();
    onLogout();
  };

  return (
    <div className="main-content">
      <div className="container">
        {/* Perfil del usuario */}
        <div className="profile-card fade-up">
          <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
          <div className="profile-username">{user.username}</div>
          <div className="profile-email">{user.email}</div>
          <div style={{ display: "inline-block", background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.25)", borderRadius: 100, padding: "4px 16px", fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>
            🏟️ {user.club}
          </div>
        </div>

        {/* Panel de referidos */}
        <ReferralPanel userId={user.id} />

        {/* Estadísticas */}
        <div className="stats-grid fade-up">
          <div className="stat-card">
            <div className="stat-number">{user.points}</div>
            <div className="stat-label">Puntos totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.floor(user.points / 10)}</div>
            <div className="stat-label">Entradas cargadas</div>
          </div>
        </div>

        {/* Información de cómo funciona */}
        <div className="fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text2)", marginBottom: 12 }}>¿Cómo funciona?</div>
          <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>
            🎟️ Cargá el número de tu entrada del partido<br />
            ⭐ Sumás <strong style={{ color: "var(--accent)" }}>10 puntos</strong> por cada entrada registrada<br />
            🏆 Los 3 mejores del ranking ganan entradas gratis<br />
            🔄 El ranking se resetea cada temporada<br />
            🎁 Invitá amigos con tu código y ganá <strong style={{ color: "var(--accent)" }}>50 puntos extra</strong>
          </div>
        </div>

        <div className="divider" />

        <button className="btn btn-danger fade-up" onClick={handleLogout} disabled={loading}>
          {loading
            ? <><div className="spinner" style={{ borderTopColor: "var(--accent2)", borderColor: "rgba(255,77,109,0.2)" }} />Cerrando sesión...</>
            : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
type Tab = "home" | "ticket" | "ranking" | "profile";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [hydrated, setHydrated] = useState(false);

  // Create a wrapper function to handle navigation from DashboardTab
  const handleNavigate = useCallback((tabName: string) => {
    setTab(tabName as Tab);
  }, []);

  // Restaurar sesión al iniciar
  useEffect(() => {
    api.getSession().then((u) => {
      if (u) setUser(u);
      setHydrated(true);
    });
  }, []);

  const handleAuth = (u: AppUser) => setUser(u);
  const handleLogout = () => { setUser(null); setTab("home"); };
  const handlePointsUpdate = (newPoints: number) => setUser((u) => u ? { ...u, points: newPoints } : u);

  if (!hydrated) {
    return (
      <>
        <style>{styles}</style>
        <div className="app-wrapper">
          <div className="loading-screen">
            <div className="loading-logo">LUPI<span>APP</span></div>
            <div className="spinner-lg" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app-wrapper">
        {!user ? (
          <AuthScreen onAuth={handleAuth} />
        ) : (
          <>
            <header className="app-header">
              <div className="container">
                <div className="header-inner">
                  <div className="header-logo">LUPI<span>APP</span></div>
                  <div className="header-right">
                    <Notifications userId={user.id} />
                    <div className="points-pill">⭐ {user.points}</div>
                  </div>
                </div>
              </div>
            </header>

            {tab === "home"    && <DashboardTab user={user} onNavigate={handleNavigate} />}
            {tab === "ticket"  && <TicketTab user={user} onPointsUpdate={handlePointsUpdate} />}
            {tab === "ranking" && <LeaderboardTab user={user} />}
            {tab === "profile" && <ProfileTab user={user} onLogout={handleLogout} />}
            

            <nav className="bottom-nav">
              {([
                { id: "home",    icon: "🏠", label: "Inicio"  },
                { id: "ticket",  icon: "🎟️", label: "Entrada" },
                { id: "ranking", icon: "🏆", label: "Ranking" },
                { id: "profile", icon: "👤", label: "Perfil"  },
              ] as { id: Tab; icon: string; label: string }[]).map((n) => (
                <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </>
  );
}