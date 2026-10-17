// src/components/ShareButton.tsx
import { useState } from "react";
import { useShareReward } from "../hooks/useShareReward";
import { useToast } from "../hooks/useToast";

interface ShareButtonProps {
  userId: string;
  user: {
    username: string;
    points: number;
    rank: number;
    club: string;
  };
  onShareSuccess?: (newPoints: number) => void;
  variant?: "full" | "compact";
}

export function ShareButton({
  userId,
  user,
  onShareSuccess,
  variant = "full",
}: ShareButtonProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSocialOptions, setShowSocialOptions] = useState(false);
  const {
    registerShareAndGetPoints,
    canShare,
    isSharing,
    shareStats,
    formatNextShareTime,
  } = useShareReward(userId);
  const { showToast } = useToast();

  const shareText = `🎉 ¡${user.username} tiene ${user.points} puntos en LupiApp! 
🏆 Posición #${user.rank} en el ranking de ${user.club}. 
🎟️ Cargá tus entradas y ganá premios increíbles.

Descargá LupiApp: ${window.location.origin}`;

  const shareData = {
    title: "Mi progreso en LupiApp",
    text: shareText,
    url: window.location.origin,
  };

  const shareWithNative = async () => {
    const isShareAvailable =
      typeof navigator !== "undefined" &&
      navigator.share &&
      typeof navigator.share === "function";

    if (isShareAvailable) {
      try {
        await navigator.share(shareData);
        const result = await registerShareAndGetPoints();
        if (result.success) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          if (onShareSuccess && result.newPoints) onShareSuccess(result.newPoints);
          showToast(result.message, "success");
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          showToast("Compartido cancelado", "info");
        } else {
          showToast("No se pudo compartir", "error");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        const result = await registerShareAndGetPoints();
        if (result.success) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          if (onShareSuccess && result.newPoints) onShareSuccess(result.newPoints);
          showToast("📋 Enlace copiado! +50 puntos", "success");
        }
      } catch {
        showToast("No se pudo copiar el enlace", "error");
      }
    }
    setShowSocialOptions(false);
  };

  const shareToSocial = (platform: string) => {
    let url = "";
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.origin);

    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "instagram":
        showToast("📱 Abrí Instagram y pegá el texto que copiamos", "info");
        navigator.clipboard.writeText(shareText);
        setShowSocialOptions(false);
        return;
      case "tiktok":
        showToast("📱 Abrí TikTok y pegá el texto que copiamos", "info");
        navigator.clipboard.writeText(shareText);
        setShowSocialOptions(false);
        return;
      default:
        setShowSocialOptions(false);
        return;
    }

    if (url) window.open(url, "_blank", "noopener,noreferrer");

    setTimeout(async () => {
      const result = await registerShareAndGetPoints();
      if (result.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        if (onShareSuccess && result.newPoints) onShareSuccess(result.newPoints);
        showToast(result.message, "success");
      }
    }, 500);

    setShowSocialOptions(false);
  };

  const handleShare = () => {
    if (!canShare) {
      showToast(
        `Ya compartiste hoy. Volvé ${formatNextShareTime()} para más puntos.`,
        "info"
      );
      return;
    }
    setShowSocialOptions(true);
  };

  if (variant === "compact") {
    return (
      <button
        className={`share-btn-compact ${!canShare ? "disabled" : ""}`}
        onClick={handleShare}
        disabled={!canShare || isSharing}
      >
        {isSharing ? "⏳" : canShare ? "📤 +50" : "✓"}
      </button>
    );
  }

  return (
    <>
      {showConfetti && <ConfettiEffect />}

      {showSocialOptions && (
        <div className="share-modal" onClick={() => setShowSocialOptions(false)}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>📤 Compartir y ganar +50 pts</h3>
              <button
                className="share-modal-close"
                onClick={() => setShowSocialOptions(false)}
              >
                ✕
              </button>
            </div>
            <div className="share-modal-body">
              <p className="share-modal-desc">Elegí cómo querés compartir:</p>
              <div className="social-buttons">
                {typeof navigator !== "undefined" &&
                  navigator.share &&
                  typeof navigator.share === "function" && (
                    <button className="social-btn native" onClick={shareWithNative}>
                      <span className="social-icon">📱</span>
                      <span>Compartir con...</span>
                      <span className="social-badge">Recomendado</span>
                    </button>
                  )}
                <button className="social-btn whatsapp" onClick={() => shareToSocial("whatsapp")}>
                  <span className="social-icon">💚</span>
                  <span>WhatsApp</span>
                </button>
                <button className="social-btn instagram" onClick={() => shareToSocial("instagram")}>
                  <span className="social-icon">📸</span>
                  <span>Instagram</span>
                </button>
                <button className="social-btn tiktok" onClick={() => shareToSocial("tiktok")}>
                  <span className="social-icon">🎵</span>
                  <span>TikTok</span>
                </button>
                <button className="social-btn facebook" onClick={() => shareToSocial("facebook")}>
                  <span className="social-icon">👍</span>
                  <span>Facebook</span>
                </button>
                <button className="social-btn twitter" onClick={() => shareToSocial("twitter")}>
                  <span className="social-icon">🐦</span>
                  <span>Twitter/X</span>
                </button>
                <button className="social-btn telegram" onClick={() => shareToSocial("telegram")}>
                  <span className="social-icon">✈️</span>
                  <span>Telegram</span>
                </button>
                <button className="social-btn copy" onClick={shareWithNative}>
                  <span className="social-icon">📋</span>
                  <span>Copiar enlace</span>
                </button>
              </div>
              <div className="share-modal-footer">
                <small>✨ Al compartir, ganás 50 puntos extra (1 vez por día)</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="share-card">
        <div className="share-header">
          <div className="share-icon">🎁</div>
          <div className="share-title">¡Compartí y ganá!</div>
          {!canShare && (
            <div className="share-cooldown">⏰ {formatNextShareTime()}</div>
          )}
        </div>

        <div className="share-reward">
          <span className="reward-badge">+50 PUNTOS</span>
          <span className="reward-text">por compartir</span>
        </div>

        <div className="share-stats">
          <div className="share-stat">
            <span className="share-stat-value">{shareStats.totalShares}</span>
            <span className="share-stat-label">Veces compartido</span>
          </div>
          <div className="share-stat">
            <span className="share-stat-value">{shareStats.totalPointsFromShares}</span>
            <span className="share-stat-label">Puntos ganados</span>
          </div>
        </div>

        <div className="share-description">
          Compartí tu progreso en tus redes favoritas.
          <br />
          <small>✓ 1 vez por día · +50 puntos</small>
        </div>

        <button
          className={`share-main-button ${!canShare ? "disabled" : ""}`}
          onClick={handleShare}
          disabled={!canShare || isSharing}
        >
          {isSharing ? (
            <>
              <div className="spinner-small" />
              Compartiendo...
            </>
          ) : canShare ? (
            <>📤 Compartir +50 pts</>
          ) : (
            <>✓ Ya compartiste hoy</>
          )}
        </button>

        {!canShare && (
          <div className="share-timer">🎯 Volvé mañana para más puntos</div>
        )}
      </div>
    </>
  );
}

function ConfettiEffect() {
  return null;
}