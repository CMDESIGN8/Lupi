import { useState, useEffect, useCallback } from "react";
import { api, AppUser, Ticket, LeaderEntry } from "./lib/api";
import { CLUBS } from "./lib/constants";
import { Notifications } from './components/Notifications';
import { ReferralPanel } from './components/ReferralPanel';
import { TicketScanner } from './components/TicketScanner';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { ShareButton } from './components/ShareButton';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { CountdownTimer } from './components/CountdownTimer';
import { getNextThursday20h } from './lib/dateUtils';
import { OnboardingTour } from './components/OnboardingTour';
import { StreakBadge } from './components/StreakBadge';
import { ClickEffect } from './components/ClickEffect';
import { NotificationPermission } from './components/NotificationPermission';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useVisualEffects } from './hooks/useVisualEffects';






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
  .ticket-info-box { background: rgba(245,197,24,0.06); border: 1px solid rgba(245,197,24,0.2); border-radius: var(--radius); padding: 14px; margin-bottom: 20px; font-size: 13px; color: var(--text); line-height: 1.6; }
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

/* Estilos para Toast */
.toast-message {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border-radius: 100px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  z-index: 2000;
  animation: slideUp 0.3s ease;
  max-width: 90%;
}

.toast-success {
  border-left: 3px solid var(--success);
}

.toast-error {
  border-left: 3px solid var(--accent2);
}

.toast-info {
  border-left: 3px solid var(--accent);
}

.toast-icon {
  font-size: 18px;
}

.toast-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.toast-close {
  background: none;
  border: none;
  color: var(--text2);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast-close:hover {
  background: var(--surface2);
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
  /* Estilos para el componente de compartir */

  /* Modal de compartir */
.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

.share-modal-content {
  background: var(--surface);
  border-radius: 24px;
  max-width: 400px;
  width: 100%;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.share-modal-header h3 {
  font-family: var(--font-display);
  font-size: 20px;
  margin: 0;
  color: var(--text);
}

.share-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text2);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-modal-close:hover {
  background: var(--surface2);
}

.share-modal-body {
  padding: 20px;
}

.share-modal-desc {
  color: var(--text2);
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.social-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.social-btn:hover {
  transform: translateX(4px);
  border-color: var(--accent);
}

.social-icon {
  font-size: 24px;
  width: 32px;
  text-align: center;
}

.social-badge {
  margin-left: auto;
  background: var(--accent);
  color: #0a0a0f;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: bold;
}

.social-btn.native {
  background: linear-gradient(135deg, var(--accent), #0f6bc0);
  border-color: transparent;
  color: #0a0a0f;
}

.social-btn.whatsapp:hover {
  border-color: #25D366;
}
.social-btn.instagram:hover {
  border-color: #E4405F;
}
.social-btn.tiktok:hover {
  border-color: #000000;
}
.social-btn.facebook:hover {
  border-color: #1877F2;
}
.social-btn.twitter:hover {
  border-color: #1DA1F2;
}
.social-btn.telegram:hover {
  border-color: #26A5E4;
}

.share-modal-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  color: var(--text2);
  font-size: 11px;
}

.share-card {
  background: linear-gradient(135deg, var(--surface), var(--surface2));
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  margin: 20px 0;
}

.share-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--success));
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.share-icon {
  font-size: 32px;
}

.share-title {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text);
  flex: 1;
  margin-left: 12px;
}

.share-cooldown {
  font-size: 12px;
  background: rgba(61, 255, 160, 0.1);
  padding: 4px 8px;
  border-radius: 100px;
  color: var(--success);
}

.share-reward {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(24, 157, 245, 0.1);
  padding: 8px 16px;
  border-radius: 100px;
  margin-bottom: 16px;
}

/* Agregar a los estilos existentes en App.tsx */

/* Puntos flotantes */
@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.5);
    opacity: 0;
  }
}

.floating-points {
  animation: floatUp 1s ease-out forwards;
  filter: drop-shadow(0 0 5px currentColor);
}

.floating-points.bonus {
  filter: drop-shadow(0 0 10px #ffd700);
  animation: floatUp 1.2s ease-out forwards;
}

/* Combo text */
@keyframes comboPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.combo-text {
  animation: comboPulse 0.5s ease-out;
}

/* Level Up */
@keyframes levelUpPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  70% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.level-up-text {
  animation: levelUpPulse 1s ease-out;
}

/* Achievement popup */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.achievement-popup {
  animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 2.7s forwards;
}

/* Streak bonus */
@keyframes streakBonusPop {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.streak-bonus {
  animation: streakBonusPop 0.5s ease-out;
}

/* Efecto de brillo al pasar el mouse en botones */
.btn-primary, .btn-ghost {
  position: relative;
  overflow: hidden;
}

.btn-primary::after, .btn-ghost::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.btn-primary:active::after, .btn-ghost:active::after {
  width: 200%;
  height: 200%;
}

.reward-badge {
  background: var(--accent);
  color: #0a0a0f;
  padding: 4px 12px;
  border-radius: 100px;
  font-weight: bold;
  font-size: 14px;
}

.reward-text {
  color: var(--text2);
  font-size: 13px;
}

.share-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--surface2);
  border-radius: 12px;
}

.share-stats .stat {
  flex: 1;
  text-align: center;
}

.share-stats .stat-value {
  display: block;
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--accent);
}

.share-stats .stat-label {
  font-size: 10px;
  color: var(--text2);
  text-transform: uppercase;
}

.share-description {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.5;
  margin-bottom: 20px;
}

.share-description strong {
  color: var(--accent);
}

.share-button {
  width: 100%;
  background: linear-gradient(135deg, var(--accent), #0f6bc0);
  border: none;
  border-radius: 12px;
  padding: 14px;
  color: #0a0a0f;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.share-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 157, 245, 0.3);
}

.share-button.disabled {
  background: var(--surface2);
  color: var(--text2);
  cursor: not-allowed;
}

.share-timer {
  text-align: center;
  font-size: 11px;
  color: var(--text2);
  margin-top: 12px;
}

/* Versión compacta */
.share-compact {
  display: inline-block;
}

.share-btn-compact {
  position: relative;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn-compact:not(.disabled):hover {
  border-color: var(--accent);
  background: var(--surface);
  transform: scale(1.05);
}

.share-btn-compact.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(10, 10, 15, 0.3);
  border-top-color: #0a0a0f;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  margin-right: 8px;
}
/* Estilos para confirmación */
.confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

.confirmation-container {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease;
}

/* Agregar a los estilos existentes */
.tour-floating-button {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.confirmation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.confirmation-header h3 {
  font-family: var(--font-display);
  font-size: 20px;
  margin: 0;
  color: var(--text);
}

.confirmation-close {
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

.confirmation-close:hover {
  background: var(--surface2);
  color: var(--text);
}

.confirmation-content {
  padding: 20px;
}

.detected-number-box {
  background: rgba(24, 157, 245, 0.1);
  border: 1px solid rgba(24, 157, 245, 0.2);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}

.detected-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text2);
  margin-bottom: 12px;
}

.detected-number {
  font-family: monospace;
  font-size: 32px;
  font-weight: bold;
  color: var(--accent);
  letter-spacing: 2px;
  word-break: break-all;
}

.edit-input {
  width: 100%;
  background: var(--surface2);
  border: 1.5px solid var(--accent);
  border-radius: 12px;
  padding: 12px;
  color: var(--text);
  font-family: monospace;
  font-size: 24px;
  text-align: center;
  letter-spacing: 2px;
  outline: none;
}

.original-text-box {
  background: var(--surface2);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.original-text-box details {
  cursor: pointer;
}

.original-text-box summary {
  color: var(--text2);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 0;
}

.original-text {
  margin-top: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  font-size: 11px;
  font-family: monospace;
  color: var(--text2);
  line-height: 1.5;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.confirmation-warning {
  background: rgba(255, 77, 109, 0.1);
  border-left: 3px solid var(--accent2);
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--accent2);
  margin-bottom: 20px;
}

.confirmation-buttons {
  display: flex;
  gap: 12px;
}

.confirmation-buttons .btn {
  flex: 1;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  /* Estilos para el sistema de rachas */
.streak-card {
  border-radius: 16px;
  padding: 16px;
  margin: 12px 0;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.streak-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streak-icon {
  font-size: 32px;
}

.streak-current {
  font-size: 18px;
}

.streak-current strong {
  font-size: 28px;
  margin-right: 4px;
}

.streak-best {
  font-size: 12px;
  opacity: 0.8;
}

.streak-reward {
  margin-top: 12px;
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  animation: pulse-glow 1s infinite;
}

.streak-next-milestone {
  margin-top: 12px;
  font-size: 12px;
  text-align: center;
  opacity: 0.9;
}

.streak-progress {
  margin-top: 12px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.streak-progress-bar {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}

/* Modal de recompensa */
.streak-reward-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.streak-reward-content {
  background: linear-gradient(135deg, var(--accent), #ff4d6d);
  border-radius: 32px;
  padding: 32px;
  text-align: center;
  max-width: 300px;
  animation: bounce 0.5s ease;
}

.streak-reward-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.streak-reward-title {
  font-family: var(--font-display);
  font-size: 28px;
  margin-bottom: 12px;
}

.streak-reward-message {
  font-size: 16px;
  margin-bottom: 16px;
}

.streak-reward-points {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 24px;
}

@keyframes bounce {
  0%, 100% { transform: scale(0.9); }
  50% { transform: scale(1.05); }
}

/* Versión compacta */
.streak-compact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 14px;
  border: 1px solid;
}
  /* Agregar a los estilos existentes */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.countdown-timer {
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
  /* Agregar a los estilos existentes */
.tour-highlight {
  position: relative;
  z-index: 10002;
  animation: pulse-highlight 1s ease-in-out 3;
  box-shadow: 0 0 0 4px var(--accent);
  border-radius: 8px;
}

@keyframes pulse-highlight {
  0%, 100% {
    box-shadow: 0 0 0 4px var(--accent);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(24, 157, 245, 0.5);
  }
}
  /* Animación de confeti casero */
@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

.confetti-particle {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  animation: confettiFall linear forwards;
}

/* Puntos flotantes */
@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.5);
    opacity: 0;
  }
}

.floating-points {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  font-weight: bold;
  white-space: nowrap;
  animation: floatUp 1s ease-out forwards;
}

.floating-points.bonus {
  font-size: 32px;
  color: #ffd700;
  text-shadow: 0 0 10px #ffd700;
  animation: floatUp 1.2s ease-out forwards;
}

/* Combo text */
@keyframes comboPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.combo-text {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  font-size: 48px;
  font-weight: bold;
  color: #ff4d6d;
  text-shadow: 0 0 20px #ff4d6d;
  white-space: nowrap;
  pointer-events: none;
  animation: comboPulse 0.5s ease-out;
}

/* Level up text */
@keyframes levelUpPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  70% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.level-up-text {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  font-size: 48px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 30px #ffd700;
  white-space: nowrap;
  pointer-events: none;
  animation: levelUpPulse 1s ease-out;
}

/* Achievement popup */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.achievement-popup {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  background: linear-gradient(135deg, #2a2a3a, #1c1c28);
  border-left: 4px solid #ffd700;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* Streak bonus */
@keyframes streakBonusPop {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.streak-bonus {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  background: linear-gradient(135deg, #ff4d6d, #ff6b4a);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 0 50px rgba(255, 77, 109, 0.5);
  pointer-events: none;
  animation: streakBonusPop 0.5s ease-out;
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
      
      // Mostrar mensaje de éxito con recompensa por referido si aplica
      if (form.referralCode) {
        setTimeout(() => {
          alert("🎉 ¡Bienvenido! Si usaste un código de referido, ganaste 25 puntos extra.");
        }, 500);
      }
      
      onAuth(user);
    }
  } catch (e: any) {
    setError(e.message);
    console.error('Error en autenticación:', e);
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
  const [raffleCompleted, setRaffleCompleted] = useState(false);

  // Define loadTickets function
  const loadTickets = useCallback(async () => {
    try {
      const t = await api.getUserTickets(user.id);
      setTickets(t);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  }, [user.id]);

  // Define loadLeaderboard function
  const loadLeaderboard = useCallback(async () => {
    try {
      const l = await api.getLeaderboard();
      setLeaderboard(l);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadLeaderboard();
  }, [loadTickets, loadLeaderboard]);

  const myRank = leaderboard.findIndex((u) => u.id === user.id) + 1;
  
  const handleRaffleComplete = () => {
    setRaffleCompleted(true);
    // Recargar datos del sorteo
    loadLeaderboard();
    loadTickets();
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="welcome-banner fade-up">
          <div className="welcome-name">¡Hola, {user.username}! 👋</div>
          <div className="welcome-club-flores">🏟️ {user.club}</div>
           {/* Agregar el badge de racha */}
          <div style={{ marginTop: 12 }}>
            <StreakBadge userId={user.id} variant="full" />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text)" }}>
            Cargá el número de tu entrada y acumulá puntos para ganar entradas gratis.
          </div>
        </div>

        {/* Contador regresivo */}
        <CountdownTimer 
          targetDate={getNextThursday20h()}
          onComplete={handleRaffleComplete}
        />

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

    return (
    <div className="main-content">
      <div className="container">
        <div className="welcome-banner fade-up">
          <div className="welcome-name">¡Hola, {user.username}! 👋</div>
          <div className="welcome-club-flores">🏟️ {user.club}</div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text)" }}>
            Cargá el número de tu entrada y acumulá puntos para ganar entradas gratis.
          </div>
        </div>

        {/* Contador regresivo */}
        <CountdownTimer 
          targetDate={getNextThursday20h()}
          onComplete={handleRaffleComplete}
        />

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
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [detectedNumber, setDetectedNumber] = useState('');
  const [detectedText, setDetectedText] = useState('');
  const [streakReward, setStreakReward] = useState<{ points: number; message: string } | null>(null);
    const { celebrate, showFloatingPoints, showStreakBonus } = useVisualEffects();


  // Cargar tickets activos de la semana actual
  const loadTickets = useCallback(async () => {
    try {
      const t = await api.getCurrentWeekTickets(user.id);
      setTickets(t);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  }, [user.id]);

  // Cargar historial de tickets
  const loadTicketHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const history = await api.getTicketHistory(user.id);
      setTicketHistory(history);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user.id]);

  useEffect(() => { 
    loadTickets(); 
    loadTicketHistory();
  }, [loadTickets, loadTicketHistory]);

  // En TicketTab, actualizar handleSubmit
const handleSubmit = async (number?: string) => {
  const ticketToSubmit = number || ticketNumber;
  
  setError(""); 
  setSuccess("");
  
  if (!ticketToSubmit.trim()) { 
    setError("Ingresá o escaneá el número de tu entrada."); 
    return; 
  }
  
  // Limpiar el número (solo dígitos)
  const cleanNumber = ticketToSubmit.replace(/[^0-9]/g, '');
  
  if (cleanNumber.length < 6 || cleanNumber.length > 12) {
    setError("El número de entrada debe tener entre 6 y 12 dígitos.");
    return;
  }
  
  setLoading(true);
  
  try {
    // Verificar si el ticket ya fue usado
    const isValid = await api.isTicketValid(cleanNumber);
    if (!isValid) {
      setError("Este número de entrada ya fue utilizado en una semana anterior y ya no es válido para el sorteo actual.");
      setLoading(false);
      return;
    }
    
    // Enviar el ticket
    const res = await api.submitTicket({ ticketNumber: cleanNumber });
    
    // Mostrar mensaje de éxito
    let successMessage = `🎟️ ¡Entrada cargada! Sumaste 10 puntos. Total: ${res.newPoints} pts`;
    
    // Si hay recompensa de racha, mostrarla
    if (res.streakReward) {
      successMessage = `🔥 ${res.streakReward.message} Ahora tenés ${res.newPoints} puntos totales.`;
      setStreakReward(res.streakReward);
      setTimeout(() => setStreakReward(null), 5000);
    }
    
    setSuccess(successMessage);
    setTicketNumber("");
    
    // Recargar tickets y actualizar puntos
    await loadTickets();
    await loadTicketHistory();
    onPointsUpdate(res.newPoints);
    
    // Feedback háptico
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Cerrar scanner si estaba abierto
    setShowScanner(false);
    
  } catch (e: any) {
    console.error('Error submitting ticket:', e);
    setError(e.message || "Error al cargar la entrada. Intentá nuevamente.");
  } finally {
    setLoading(false);
  }
};

  const handleScan = (scannedNumber: string, originalText: string) => {
    console.log('🎫 Número escaneado:', scannedNumber);
    console.log('📄 Texto original:', originalText);
    
    setDetectedNumber(scannedNumber);
    setDetectedText(originalText);
    setShowConfirmation(true);
  };

  const handleConfirmNumber = async (number: string) => {
    setShowConfirmation(false);
    
    const cleanNumber = number.replace(/[^0-9]/g, '');
    setTicketNumber(cleanNumber);
    
    // Mostrar feedback
    const successMsg = `✅ Número verificado: ${cleanNumber}`;
    setSuccess(successMsg);
    setTimeout(() => setSuccess(''), 3000);
    
    // Auto-enviar
    setTimeout(() => handleSubmit(cleanNumber), 500);
  };

  const handleCancelScan = () => {
    setShowConfirmation(false);
    setDetectedNumber('');
    setDetectedText('');
  };

  // Contar tickets ganadores activos
  const activeWinners = tickets.filter(t => t.status === 'ganador').length;
  const activeTickets = tickets.filter(t => t.status !== 'ganador').length;

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

        {/* Diálogo de confirmación */}
        {showConfirmation && (
          <ConfirmationDialog
            detectedNumber={detectedNumber}
            originalText={detectedText}
            onConfirm={handleConfirmNumber}
            onCancel={handleCancelScan}
            onEdit={() => {}}
          />
        )}

        <div className="section-title fade-up">🎟️ Cargar entrada</div>

        {/* Banner de tickets ganadores activos */}
        {activeWinners > 0 && (
          <div className="fade-up" style={{
            background: "linear-gradient(135deg, rgba(61,255,160,0.2), rgba(61,255,160,0.05))",
            border: "1px solid rgba(61,255,160,0.4)",
            borderRadius: 16,
            padding: 12,
            marginBottom: 20,
            textAlign: "center"
          }}>
            <span style={{ fontSize: 20, marginRight: 8 }}>🏆</span>
            ¡Tenés {activeWinners} {activeWinners === 1 ? 'entrada ganadora' : 'entradas ganadoras'}!
            Contactá al administrador para reclamar tu premio.
          </div>
        )}

        <div className="ticket-card fade-up">
          <div className="ticket-info-box">
            Escaneá el <strong>código número de tu entrada</strong> o ingresalo  manualmente. 
            Cada entrada suma <strong>+10 puntos</strong>.<br />
            <small style={{ color: "var(--text2)", fontSize: 11, display: "block", marginTop: 8 }}>
              📅 Solo las entradas cargadas esta semana participan del sorteo
            </small>
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

        {/* Selector de vista */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, marginTop: 24 }}>
          <button
            onClick={() => setShowHistory(false)}
            className="btn-ghost"
            style={{
              flex: 1,
              padding: "10px",
              background: !showHistory ? "var(--accent)" : "transparent",
              color: !showHistory ? "#0a0a0f" : "var(--text2)",
              border: !showHistory ? "none" : "1px solid var(--border)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            🎯 Activas ({activeTickets})
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost"
            style={{
              flex: 1,
              padding: "10px",
              background: showHistory ? "var(--accent)" : "transparent",
              color: showHistory ? "#0a0a0f" : "var(--text2)",
              border: showHistory ? "none" : "1px solid var(--border)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            📜 Historial ({ticketHistory.length})
          </button>
        </div>

        {/* Contenido según selección */}
        {!showHistory ? (
          // Entradas activas de la semana
          <>
            <div className="section-title fade-up">
              🎯 Entradas activas ({activeTickets})
            </div>
            {loadingTickets ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
              </div>
            ) : activeTickets === 0 ? (
              <div className="empty-state fade-up">
                <div className="empty-icon">🎟️✨</div>
                <div className="empty-text">¡Escaneá tu primera entrada!</div>
                <div className="empty-subtext" style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>
                  Usá la cámara para escanear el código QR<br />
                  y comenzá a sumar puntos para el sorteo semanal
                </div>
              </div>
            ) : (
              tickets.filter(t => t.status !== 'ganador').map((t) => (
                <div key={t.id} className="ticket-item fade-up">
                  <div>
                    <div className="ticket-number"># {t.ticketNumber}</div>
                    <div className="ticket-meta">{formatDate(t.createdAt)}</div>
                  </div>
                  <div>
                    <span className={`ticket-badge badge-${t.status}`}>
                      {t.status === 'pendiente' && '⏳ Pendiente de validación'}
                      {t.status === 'participando' && '🎯 ¡Participando en sorteo!'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          // Historial de tickets antiguos
          <>
            <div className="section-title fade-up">
              📜 Historial de entradas ({ticketHistory.length})
            </div>
            {loadingHistory ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
              </div>
            ) : ticketHistory.length === 0 ? (
              <div className="empty-state fade-up">
                <div className="empty-icon">📭</div>
                <div className="empty-text">No hay entradas en el historial.</div>
                <div className="empty-subtext" style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>
                  Las entradas anteriores se archivarán automáticamente después del sorteo semanal.
                </div>
              </div>
            ) : (
              ticketHistory.map((t) => (
                <div key={t.id} className="ticket-item fade-up" style={{ opacity: 0.8 }}>
                  <div>
                    <div className="ticket-number" style={{ fontSize: 16 }}># {t.ticketNumber}</div>
                    <div className="ticket-meta">{formatDate(t.createdAt)}</div>
                  </div>
                  <div>
                    <span className={`ticket-badge badge-${t.status}`}>
                      {t.status === 'ganador' && '🏆 ¡ENTRADA GANADORA!'}
                      {t.status === 'invalido' && '⏰ Sorteo finalizado'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
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
// ProfileTab actualizado con onRestartTour
function ProfileTab({ user, onLogout, onRestartTour }: { 
  user: AppUser; 
  onLogout: () => void;
  onRestartTour: () => void;  // <-- AGREGAR ESTA LÍNEA
}) {
  const [loading, setLoading] = useState(false);
  const [rank, setRank] = useState(0);
  const [points, setPoints] = useState(user.points);
  const { toasts, hideToast } = useToast();

  useEffect(() => {
    // Obtener el ranking actual del usuario
    api.getLeaderboard().then(leaders => {
      const userRank = leaders.findIndex(l => l.id === user.id) + 1;
      setRank(userRank);
    }).catch(console.error);
  }, [user.id]);

  const handleLogout = async () => {
    setLoading(true);
    await api.logout();
    onLogout();
  };

  const handlePointsUpdate = (newPoints: number) => {
    setPoints(newPoints);
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

        {/* Botón de compartir con recompensa */}
        <ShareButton
          userId={user.id}
          user={{
            username: user.username,
            points: points,
            rank: rank,
            club: user.club
          }}
          onShareSuccess={handlePointsUpdate}
          variant="full"
        />

        {/* Panel de referidos */}
        <ReferralPanel userId={user.id} />

        {/* Estadísticas */}
        <div className="stats-grid fade-up">
          <div className="stat-card">
            <div className="stat-number">{points}</div>
            <div className="stat-label">Puntos totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.floor(points / 10)}</div>
            <div className="stat-label">Entradas cargadas</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">#{rank || '—'}</div>
            <div className="stat-label">Posición</div>
          </div>
        </div>

        {/* Botón para ver tutorial - AGREGAR ESTE BOTÓN */}
        <button 
          onClick={onRestartTour}
          className="btn-ghost fade-up"
          style={{
            width: '100%',
            marginBottom: '16px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(24, 157, 245, 0.1)',
            border: '1px solid rgba(24, 157, 245, 0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <span style={{ fontSize: '18px' }}>🎓</span>
          Ver tutorial nuevamente
        </button>

        <div className="toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => hideToast(toast.id)}
            />
          ))}
        </div>

        {/* Información de cómo funciona */}
        <div className="fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text2)", marginBottom: 12 }}>¿Cómo funciona?</div>
          <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>
            🎟️ Cargá el número de tu entrada del partido<br />
            ⭐ Sumás <strong style={{ color: "var(--accent)" }}>10 puntos</strong> por cada entrada registrada<br />
            🏆 Los 3 mejores del ranking ganan entradas gratis<br />
            🔄 El ranking se resetea cada temporada<br />
            🎁 Invitá amigos con tu código y ganá <strong style={{ color: "var(--accent)" }}>50 puntos extra</strong><br />
            📤 Compartí LupiApp y ganá <strong style={{ color: "var(--accent)" }}>50 puntos extra</strong> por día
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
  const [showTour, setShowTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const { notifyStreakAtRisk, notifyNewRecord, notifyReward } = usePushNotifications(user?.id);

// Efecto para verificar racha y enviar notificaciones
  useEffect(() => {
    if (user && user.streak > 0) {
      // Notificar racha en peligro si no cargó hoy
      const lastTicketDate = user.last_ticket_date;
      const today = new Date().toDateString();
      
      if (lastTicketDate !== today) {
        notifyStreakAtRisk(user.streak);
      }
    }
  }, [user, notifyStreakAtRisk]);
  

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

  const handleAuth = (u: AppUser) => {
    setUser(u);
    // Mostrar tour después de login exitoso
    setTimeout(() => {
      setShowTour(true);
    }, 500);
  };
   const handleTourComplete = () => {
    setShowTour(false);
  };
  const handleLogout = () => { setUser(null); setTab("home"); };
  const handlePointsUpdate = useCallback((newPoints: number) => {
    setUser((u) => u ? { ...u, points: newPoints } : u);
    
    // Verificar si es nuevo récord de racha
    if (user && user.streak > (user.best_streak || 0)) {
      notifyNewRecord(user.streak);
    }
  }, [user, notifyNewRecord]);
  const handleRestartTour = () => {
  // Limpiar localStorage para que el tour se muestre de nuevo
  localStorage.removeItem('tour_completed');
  // Forzar reinicio del componente
  setTourKey(prev => prev + 1);
  setShowTour(true);
};

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
          {/* Tour interactivo */}
            {showTour && <OnboardingTour onComplete={handleTourComplete} />}
             {/* Componente de solicitud de notificaciones */}
            <NotificationPermission userId={user.id} />
            <ClickEffect>
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
            {tab === "profile" && <ProfileTab user={user} onLogout={handleLogout} onRestartTour={handleRestartTour} />}
            

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
            </ClickEffect>
          </>
        )}
      </div>
    </>
  );
}