// src/pages/TicketTab.tsx
import { useState, useEffect, useCallback } from "react";
import { api, AppUser, Ticket } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import { TicketScanner } from "../components/TicketScanner";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { SpinWheel, SpinResult } from "../components/SpinWheel";
import { useToast } from "../hooks/useToast";
import { useVisualEffects } from "../hooks/useVisualEffects";
import { useAchievements, AchievementContext } from "../components/Achievements";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function Alert({ type, msg }: { type: "error" | "success"; msg: string }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type} fade-up`}>
      {type === "error" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

export function TicketTab({
  user,
  onPointsUpdate,
}: {
  user: AppUser;
  onPointsUpdate: (p: number) => void;
}) {
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
  const [detectedNumber, setDetectedNumber] = useState("");
  const [detectedText, setDetectedText] = useState("");
  const [streakReward, setStreakReward] = useState<{ points: number; message: string } | null>(null);
  const { showFloatingPoints, showStreakBonus } = useVisualEffects();
  const [showSpin, setShowSpin] = useState(false);
  const { checkAndUnlock } = useAchievements(user);
  const [scannedNumbers, setScannedNumbers] = useState<string[]>([]);
  const { showToast } = useToast();

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

  const handleSubmit = async (number?: string) => {
    const ticketToSubmit = number || ticketNumber;

    setError("");
    setSuccess("");

    if (!ticketToSubmit.trim()) {
      setError("Ingresá o escaneá el número de tu entrada.");
      return;
    }

    const cleanNumber = ticketToSubmit.replace(/[^0-9]/g, "");

    if (cleanNumber.length < 6 || cleanNumber.length > 12) {
      setError("El número de entrada debe tener entre 6 y 12 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const isValid = await api.isTicketValid(cleanNumber);
      if (!isValid) {
        setError("Este número de entrada ya fue utilizado en una semana anterior.");
        setLoading(false);
        return;
      }

      const res = await api.submitTicket({ ticketNumber: cleanNumber });

      if (res.statUpgraded) {
        const statIcons: Record<string, string> = {
          pace: "⚡", dribbling: "✨", passing: "⚽",
          defending: "🛡️", finishing: "🎯", physical: "💪",
        };
        const statNames: Record<string, string> = {
          pace: "Velocidad", dribbling: "Regate", passing: "Pase",
          defending: "Defensa", finishing: "Remate", physical: "Físico",
        };
        const icon = statIcons[res.statUpgraded.stat] || "⬆️";
        const name = statNames[res.statUpgraded.stat] || res.statUpgraded.stat;
        const diff = res.statUpgraded.newValue - res.statUpgraded.oldValue;

        showToast(`${icon} ${name} +${diff} → ${res.statUpgraded.newValue}`, "info");

        const notificationDiv = document.createElement("div");
        notificationDiv.className = "stat-upgrade-floating";
        notificationDiv.innerHTML = `
          <div class="stat-upgrade-content">
            <span class="stat-upgrade-icon">${icon}</span>
            <span class="stat-upgrade-text">${name} +${diff} → ${res.statUpgraded.newValue}</span>
          </div>
        `;
        document.body.appendChild(notificationDiv);
        setTimeout(() => notificationDiv.remove(), 3000);
      }

      if (res.leveledUp) {
        showToast(`🎉 ¡SUBISTE A NIVEL ${res.newLevel}!`, "info");
      }

      let successMessage = `🎟️ ¡Entrada cargada! +10 puntos`;
      if (res.statUpgraded) {
        const statName = { pace: "Velocidad" }[res.statUpgraded.stat] || res.statUpgraded.stat;
        successMessage = `🎟️ +10 puntos | ⚡ +1 ${statName} | +10 EXP`;
      }

      if (res.streakReward) {
        successMessage = `🔥 ${res.streakReward.message} Ahora tenés ${res.newPoints} puntos totales.`;
        setStreakReward(res.streakReward);
        setTimeout(() => setStreakReward(null), 5000);
      }

      setSuccess(successMessage);
      setTicketNumber("");

      const isFirstThisWeek = tickets.length === 0;
      if (isFirstThisWeek) {
        setTimeout(() => setShowSpin(true), 800);
      }

      await loadTickets();
      await loadTicketHistory();
      onPointsUpdate(res.newPoints);

      const ctx: AchievementContext = {
        user: { ...user, points: res.newPoints },
        totalTickets: tickets.length + 1,
        completedMissions: 0,
        rank: 0,
        jackpotWon: localStorage.getItem("jackpot_won") === "true",
      };
      checkAndUnlock(ctx);

      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      setShowScanner(false);
    } catch (e: any) {
      console.error("Error submitting ticket:", e);
      setError(e.message || "Error al cargar la entrada. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpinResult = async (result: SpinResult) => {
    if (result.extraPoints > 0) {
      if (result.prize.id === "p50") {
        localStorage.setItem("jackpot_won", "true");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from("profiles")
          .update({ points: user.points + result.extraPoints })
          .eq("id", session.user.id);
        onPointsUpdate(user.points + result.extraPoints);
      }
    }
    if (result.streakDouble) {
      const expires = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("streak_double_until", expires.toString());
    }
  };

  const handleScan = (scannedNumber: string, originalText: string) => {
    setDetectedNumber(scannedNumber);
    setDetectedText(originalText);
    setShowConfirmation(true);
  };

  const handleConfirmNumber = async (number: string) => {
    setShowConfirmation(false);
    const cleanNumber = number.replace(/[^0-9]/g, "");
    setTicketNumber(cleanNumber);
    setScannedNumbers((prev) => [...prev, cleanNumber]);
    setSuccess(`✅ Número verificado: ${cleanNumber}`);
    setTimeout(() => setSuccess(""), 3000);
    setTimeout(() => handleSubmit(cleanNumber), 500);
  };

  const handleCancelScan = () => {
    setShowConfirmation(false);
    setDetectedNumber("");
    setDetectedText("");
  };

  const activeWinners = tickets.filter((t) => t.status === "ganador").length;
  const activeTickets = tickets.filter((t) => t.status !== "ganador").length;

  return (
    <div className="main-content">
      <div className="container">
        {showScanner && (
          <TicketScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
            existingTickets={[...tickets.map((t) => t.ticketNumber), ...scannedNumbers]}
          />
        )}

        {showSpin && (
          <SpinWheel onClose={() => setShowSpin(false)} onResult={handleSpinResult} />
        )}

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

        {activeWinners > 0 && (
          <div
            className="fade-up"
            style={{
              background: "linear-gradient(135deg, rgba(61,255,160,0.2), rgba(61,255,160,0.05))",
              border: "1px solid rgba(61,255,160,0.4)",
              borderRadius: 16,
              padding: 12,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 20, marginRight: 8 }}>🏆</span>
            ¡Tenés {activeWinners} {activeWinners === 1 ? "entrada ganadora" : "entradas ganadoras"}!
            Contactá al administrador para reclamar tu premio.
          </div>
        )}

        <div className="ticket-card fade-up">
          <div className="ticket-info-box">
            Escaneá el <strong>código número de tu entrada</strong> o ingresalo manualmente.
            Cada entrada suma <strong>+10 puntos</strong>.<br />
            <small style={{ color: "var(--text2)", fontSize: 11, display: "block", marginTop: 8 }}>
              📅 Solo las entradas cargadas esta semana participan del sorteo
            </small>
          </div>

          <Alert type="error" msg={error} />
          <Alert type="success" msg={success} />

          <button
            className="btn btn-primary"
            onClick={() => setShowScanner(true)}
            style={{ marginBottom: 16 }}
          >
            📷 ESCANEAR ENTRADA
          </button>

          <div
            style={{
              textAlign: "center",
              margin: "16px 0",
              position: "relative",
              color: "var(--text2)",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            <span style={{ background: "var(--surface)", padding: "0 12px" }}>
              O INGRESÁ MANUALMENTE
            </span>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: 1,
                background: "var(--border)",
                zIndex: -1,
              }}
            />
          </div>

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
                textTransform: "uppercase",
              }}
            />
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => handleSubmit()}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Verificando...
              </>
            ) : (
              "REGISTRAR ENTRADA MANUAL"
            )}
          </button>
        </div>

        <div
          className="fade-up"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "var(--text2)",
              marginBottom: 12,
            }}
          >
            ¿Cómo funciona?
          </div>
          <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>
            🎟️ Cargá el número de tu entrada del partido<br />
            ⭐ Sumás <strong style={{ color: "var(--accent)" }}>10 puntos</strong> por cada entrada registrada<br />
            🏆 Los 3 mejores del ranking ganan entradas gratis<br />
            🔄 El ranking se resetea cada temporada<br />
            🎁 Invitá amigos con tu código y ganá <strong style={{ color: "var(--accent)" }}>50 puntos extra</strong><br />
            📤 Compartí LupiApp y ganá <strong style={{ color: "var(--accent)" }}>50 puntos extra</strong> por día
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16, marginTop: 24 }}>
          <button
            onClick={() => setShowHistory(false)}
            className="btn-ghost"
            style={{
              flex: 1, padding: "10px",
              background: !showHistory ? "var(--accent)" : "transparent",
              color: !showHistory ? "#0a0a0f" : "var(--text2)",
              border: !showHistory ? "none" : "1px solid var(--border)",
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
            }}
          >
            🎯 Activas ({activeTickets})
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost"
            style={{
              flex: 1, padding: "10px",
              background: showHistory ? "var(--accent)" : "transparent",
              color: showHistory ? "#0a0a0f" : "var(--text2)",
              border: showHistory ? "none" : "1px solid var(--border)",
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
            }}
          >
            📜 Historial ({ticketHistory.length})
          </button>
        </div>

        {!showHistory ? (
          <>
            <div className="section-title fade-up">🎯 Entradas activas ({activeTickets})</div>
            {loadingTickets ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
              </div>
            ) : activeTickets === 0 ? (
              <div className="empty-state fade-up">
                <div className="empty-icon">🎟️✨</div>
                <div className="empty-text">¡Escaneá tu primera entrada!</div>
              </div>
            ) : (
              tickets
                .filter((t) => t.status !== "ganador")
                .map((t) => (
                  <div key={t.id} className="ticket-item fade-up">
                    <div>
                      <div className="ticket-number"># {t.ticketNumber}</div>
                      <div className="ticket-meta">{formatDate(t.createdAt)}</div>
                    </div>
                    <div>
                      <span className={`ticket-badge badge-${t.status}`}>
                        {t.status === "pendiente" && "⏳ Pendiente de validación"}
                        {t.status === "participando" && "🎯 ¡Participando en sorteo!"}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </>
        ) : (
          <>
            <div className="section-title fade-up">📜 Historial de entradas ({ticketHistory.length})</div>
            {loadingHistory ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
              </div>
            ) : ticketHistory.length === 0 ? (
              <div className="empty-state fade-up">
                <div className="empty-icon">📭</div>
                <div className="empty-text">No hay entradas en el historial.</div>
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
                      {t.status === "ganador" && "🏆 ¡ENTRADA GANADORA!"}
                      {t.status === "invalido" && "⏰ Sorteo finalizado"}
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