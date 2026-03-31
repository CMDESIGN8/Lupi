// components/ShareButton.tsx - Versión corregida
import { useState } from 'react';
import { useShareReward } from '../hooks/useShareReward';
import { useToast } from '../hooks/useToast';

interface ShareButtonProps {
  userId: string;
  user: {
    username: string;
    points: number;
    rank: number;
    club: string;
  };
  onShareSuccess?: (newPoints: number) => void;
  variant?: 'full' | 'compact';
}

export function ShareButton({ userId, user, onShareSuccess, variant = 'full' }: ShareButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSocialOptions, setShowSocialOptions] = useState(false);
  const { registerShareAndGetPoints, canShare, isSharing, shareStats, formatNextShareTime } = useShareReward(userId);
  const { showToast } = useToast();

  const shareText = `🎉 ¡${user.username} tiene ${user.points} puntos en LupiApp! 
🏆 Posición #${user.rank} en el ranking de ${user.club}. 
🎟️ Cargá tus entradas y ganá premios increíbles.

Descargá LupiApp: ${window.location.origin}`;

  const shareData = {
    title: 'Mi progreso en LupiApp',
    text: shareText,
    url: window.location.origin
  };

  // Compartir con la API nativa
  const shareWithNative = async () => {
    // Verificar si la Web Share API está disponible
    const isShareAvailable = typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function';
    
    if (isShareAvailable) {
      try {
        await navigator.share(shareData);
        // Si el usuario completó el compartido, registrar puntos
        const result = await registerShareAndGetPoints();
        if (result.success) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          if (onShareSuccess && result.newPoints) {
            onShareSuccess(result.newPoints);
          }
          showToast(result.message, 'success');
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          showToast('Compartido cancelado', 'info');
        } else {
          console.error('Share error:', error);
          showToast('No se pudo compartir', 'error');
        }
      }
    } else {
      // Fallback para desktop o navegadores sin soporte
      try {
        await navigator.clipboard.writeText(shareText);
        const result = await registerShareAndGetPoints();
        if (result.success) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          if (onShareSuccess && result.newPoints) {
            onShareSuccess(result.newPoints);
          }
          showToast('📋 Enlace copiado! +50 puntos', 'success');
        }
      } catch (err) {
        showToast('No se pudo copiar el enlace', 'error');
      }
    }
    setShowSocialOptions(false);
  };

  // Compartir directamente a una red social específica (alternativa)
  const shareToSocial = (platform: string) => {
    let url = '';
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.origin);
    
    switch(platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'instagram':
      // Abrir Instagram directamente si está instalada
      const instagramUrl = `instagram://library?AssetPath=${encodeURIComponent(shareText)}`;
      const instagramWebUrl = 'https://www.instagram.com';
      
      // Intentar abrir la app primero
      window.location.href = instagramUrl;
      
      // Si no abre la app después de 500ms, mostrar mensaje
      setTimeout(async () => {
        await navigator.clipboard.writeText(shareText);
        showToast('📱 Copiado al portapapeles. Abrí Instagram y pegá el texto.', 'info');
        
        // Mostrar modal con instrucciones
        
      }, 500);
      
      setShowSocialOptions(false);
      return;
      
    case 'tiktok':
      // TikTok tiene URL scheme similar
      const tiktokUrl = `tiktok://`;
      const tiktokWebUrl = 'https://www.tiktok.com';
      
      window.location.href = tiktokUrl;
      
      setTimeout(async () => {
        await navigator.clipboard.writeText(shareText);
        showToast('📱 Copiado al portapapeles. Abrí TikTok y pegá el texto.', 'info');
        
        // Mostrar modal con instrucciones
        
      }, 500);
      
      setShowSocialOptions(false);
      return;
      
    default:
      setShowSocialOptions(false);
      return;
  }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    // Registrar puntos después de compartir
    setTimeout(async () => {
      const result = await registerShareAndGetPoints();
      if (result.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        if (onShareSuccess && result.newPoints) {
          onShareSuccess(result.newPoints);
        }
        showToast(result.message, 'success');
      }
    }, 500);
    
    setShowSocialOptions(false);
  };

  const handleShare = () => {
    if (!canShare) {
      showToast(`Ya compartiste hoy. Volvé ${formatNextShareTime()} para más puntos.`, 'info');
      return;
    }
    
    // Mostrar opciones de compartir
    setShowSocialOptions(true);
  };

  if (variant === 'compact') {
    return (
      <div className="share-compact">
        <button
          className={`share-btn-compact ${!canShare ? 'disabled' : ''}`}
          onClick={handleShare}
          disabled={!canShare || isSharing}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {isSharing ? '⏳' : canShare ? '📤 +50' : '✓'}
          {showTooltip && (
            <span className="share-tooltip">
              {canShare 
                ? 'Compartí y ganá 50 puntos' 
                : `Próxima recompensa en ${formatNextShareTime()}`}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {showConfetti && <ConfettiEffect />}
      
      {/* Modal de opciones de compartir */}
      {showSocialOptions && (
        <div className="share-modal" onClick={() => setShowSocialOptions(false)}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>📤 Compartir y ganar +50 pts</h3>
              <button className="share-modal-close" onClick={() => setShowSocialOptions(false)}>✕</button>
            </div>
            <div className="share-modal-body">
              <p className="share-modal-desc">Elegí cómo querés compartir:</p>
              <div className="social-buttons">
                {/* Verificar si Web Share API está disponible */}
                {typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function' && (
                  <button className="social-btn native" onClick={shareWithNative}>
                    <span className="social-icon">📱</span>
                    <span>Compartir con...</span>
                    <span className="social-badge">Recomendado</span>
                  </button>
                )}
                <button className="social-btn whatsapp" onClick={() => shareToSocial('whatsapp')}>
                  <span className="social-icon">💚</span>
                  <span>WhatsApp</span>
                </button>
                <button className="social-btn instagram" onClick={() => shareToSocial('instagram')}>
                  <span className="social-icon">📸</span>
                  <span>Instagram</span>
                </button>
                <button className="social-btn tiktok" onClick={() => shareToSocial('tiktok')}>
                  <span className="social-icon">🎵</span>
                  <span>TikTok</span>
                </button>
                <button className="social-btn facebook" onClick={() => shareToSocial('facebook')}>
                  <span className="social-icon">👍</span>
                  <span>Facebook</span>
                </button>
                <button className="social-btn twitter" onClick={() => shareToSocial('twitter')}>
                  <span className="social-icon">🐦</span>
                  <span>Twitter/X</span>
                </button>
                <button className="social-btn telegram" onClick={() => shareToSocial('telegram')}>
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
            <div className="share-cooldown">
              ⏰ {formatNextShareTime()}
            </div>
          )}
        </div>
        
        <div className="share-reward">
          <span className="reward-badge">+50 PUNTOS</span>
          <span className="reward-text">por compartir</span>
        </div>
        
        <div className="share-stats">
          <div className="stat">
            <span className="stat-value">{shareStats.totalShares}</span>
            <span className="stat-label">veces compartido</span>
          </div>
          <div className="stat">
            <span className="stat-value">{shareStats.totalPointsFromShares}</span>
            <span className="stat-label">puntos ganados</span>
          </div>
        </div>
        
        <div className="share-description">
          Compartí tu progreso en tus redes favoritas
          <br />
          <small>✓ 1 vez por día • +50 puntos • Seleccioná tu red social favorita</small>
        </div>
        
        <button
          className={`share-button ${!canShare ? 'disabled' : ''}`}
          onClick={handleShare}
          disabled={!canShare || isSharing}
        >
          {isSharing ? (
            <>
              <div className="spinner-small" />
              Compartiendo...
            </>
          ) : (
            <>
              📤 {canShare ? 'Compartir +50 pts' : 'Ya compartiste hoy'}
            </>
          )}
        </button>
        
        {!canShare && (
          <div className="share-timer">
            🎯 Volvé mañana para más puntos
          </div>
        )}
      </div>
    </>
  );
}

// Componente de confetti
function ConfettiEffect() {
  // Implementación de confetti
  return null;
}