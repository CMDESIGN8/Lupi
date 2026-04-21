// src/components/CardAlbum.tsx - VERSIÓN COMPLETA CON EXPERIENCIA REAL

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// ==================== CONFIGURACIÓN DEL ÁLBUM ====================
interface AlbumPage {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  category: string;
  totalCards: number;
  color: string;
  gradient: string;
  description: string;
}

const ALBUM_PAGES: AlbumPage[] = [
  { id: '1era', title: '1ª DIVISIÓN', shortTitle: '1ª', icon: '🏆', category: '1era', totalCards: 25, color: '#FFD700', gradient: 'linear-gradient(135deg, #FFD70020, #B8860B20)', description: 'Los mejores jugadores del club' },
  { id: '3ra', title: '3ª DIVISIÓN', shortTitle: '3ª', icon: '⚡', category: '3ra', totalCards: 20, color: '#C0C0C0', gradient: 'linear-gradient(135deg, #C0C0C020, #80808020)', description: 'Jóvenes promesas' },
  { id: '4ta', title: '4ª DIVISIÓN', shortTitle: '4ª', icon: '🛡️', category: '4ta', totalCards: 20, color: '#CD7F32', gradient: 'linear-gradient(135deg, #CD7F3220, #8B451320)', description: 'Defensores sólidos' },
  { id: '5ta', title: '5ª DIVISIÓN', shortTitle: '5ª', icon: '🌟', category: '5ta', totalCards: 20, color: '#4CAF50', gradient: 'linear-gradient(135deg, #4CAF5020, #2E7D3220)', description: 'Equilibrio y talento' },
  { id: '6ta', title: '6ª DIVISIÓN', shortTitle: '6ª', icon: '💪', category: '6ta', totalCards: 20, color: '#2196F3', gradient: 'linear-gradient(135deg, #2196F320, #0D47A120)', description: 'Fuerza y resistencia' },
  { id: '7ma', title: '7ª DIVISIÓN', shortTitle: '7ª', icon: '🎯', category: '7ma', totalCards: 20, color: '#9C27B0', gradient: 'linear-gradient(135deg, #9C27B020, #4A148C20)', description: 'Precisión y técnica' },
  { id: '8va', title: '8ª DIVISIÓN', shortTitle: '8ª', icon: '🌱', category: '8va', totalCards: 15, color: '#FF9800', gradient: 'linear-gradient(135deg, #FF980020, #E6510020)', description: 'La cantera del club' },
  { id: 'femenino', title: 'FEMENINO', shortTitle: 'FEM', icon: '👩', category: 'femenino', totalCards: 40, color: '#E91E63', gradient: 'linear-gradient(135deg, #E91E6320, #880E4F20)', description: 'Las guerreras' },
  { id: 'promos', title: 'PROMOCIONALES', shortTitle: 'PROMO', icon: '✨', category: 'Promocionales', totalCards: 25, color: '#00BCD4', gradient: 'linear-gradient(135deg, #00BCD420, #00606420)', description: 'Ediciones especiales' },
];

const POSITION_ORDER = ['arquero', 'cierre', 'ala', 'pivot'];
const POSITION_ICONS: Record<string, { icon: string; name: string; color: string }> = {
  arquero: { icon: '🧤', name: 'ARQUERO', color: '#4a90d9' },
  cierre: { icon: '🛡️', name: 'CIERRE', color: '#e67e22' },
  ala: { icon: '⚡', name: 'ALA', color: '#2ecc71' },
  pivot: { icon: '🎯', name: 'PIVOT', color: '#e74c3c' },
};

const getRarityColor = (rating: number): string => {
  if (rating >= 90) return '#FFD700';
  if (rating >= 80) return '#9C27B0';
  if (rating >= 70) return '#2196F3';
  if (rating >= 60) return '#4CAF50';
  return '#888888';
};

interface UnifiedPlayer {
  id: string;
  name: string;
  position: string;
  category: string;
  overall_rating: number;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  source_type: 'npc' | 'socio';
  is_owned: boolean;
  user_card_level?: number;
  user_card_id?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
export function CardAlbum({ userId }: { userId: string }) {
  // Estados
  const [allPlayers, setAllPlayers] = useState<UnifiedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [newlyAcquiredId, setNewlyAcquiredId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPageComplete, setShowPageComplete] = useState(false);
  const [completedPage, setCompletedPage] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOwnedCountRef = useRef<number>(0);
  const prevPageCompleteRef = useRef<boolean>(false);
  const audioEnabledRef = useRef(false);
  
  // ==================== SONIDOS ====================
  const playSound = useCallback((soundName: 'pageFlip' | 'stickerPeel' | 'completePage' | 'albumComplete') => {
    if (!audioEnabledRef.current) return;
    
    const sounds: Record<string, string> = {
      pageFlip: 'data:audio/wav;base64,U3RlYWx0aCBzb3VuZA==', // Placeholder - reemplazar con URLs reales
      stickerPeel: 'data:audio/wav;base64,U3RlYWx0aCBzb3VuZA==',
      completePage: 'data:audio/wav;base64,U3RlYWx0aCBzb3VuZA==',
      albumComplete: 'data:audio/wav;base64,U3RlYWx0aCBzb3VuZA=='
    };
    
    try {
      const audio = new Audio(sounds[soundName]);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {}
  }, []);
  
  // Habilitar audio después de la primera interacción del usuario
  const enableAudio = useCallback(() => {
    if (!audioEnabledRef.current) {
      audioEnabledRef.current = true;
      // Reproducir un sonido silencioso para habilitar audio en algunos navegadores
      const silentAudio = new Audio('data:audio/wav;base64,U3RlYWx0aCBzb3VuZA==');
      silentAudio.play().catch(() => {});
    }
  }, []);
  
  // ==================== CARGA DE DATOS ====================
  const loadData = async () => {
    setLoading(true);
    
    try {
      const { data: userCards, error: userCardsError } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId);
      
      if (userCardsError) throw userCardsError;
      
      const ownedCardsMap = new Map();
      userCards?.forEach(card => {
        if (card.card_type === 'npc' && card.player_id) {
          ownedCardsMap.set(card.player_id, { level: card.level, card_id: card.id });
        } else if (card.card_type === 'socio' && card.socio_id) {
          ownedCardsMap.set(card.socio_id, { level: card.level, card_id: card.id });
        }
      });
      
      const { data: npcs, error: npcsError } = await supabase
        .from('players')
        .select('*')
        .eq('can_be_replaced', true)
        .eq('is_replaced', false);
      
      if (npcsError) throw npcsError;
      
      const { data: socios, error: sociosError } = await supabase
        .from('profiles')
        .select('id, username, position, category, user_card_pace, user_card_dribbling, user_card_passing, user_card_defending, user_card_finishing, user_card_physical');
      
      if (sociosError) throw sociosError;
      
      const unifiedPlayers: UnifiedPlayer[] = [];
      
      npcs?.forEach(npc => {
        const owned = ownedCardsMap.get(npc.id);
        unifiedPlayers.push({
          id: npc.id,
          name: npc.name,
          position: npc.position,
          category: npc.category,
          overall_rating: npc.overall_rating,
          pace: npc.pace,
          dribbling: npc.dribbling,
          passing: npc.passing,
          defending: npc.defending,
          finishing: npc.finishing,
          physical: npc.physical,
          source_type: 'npc',
          is_owned: !!owned,
          user_card_level: owned?.level,
          user_card_id: owned?.card_id,
        });
      });
      
      socios?.forEach(socio => {
        if (socio.id === userId) return;
        
        const owned = ownedCardsMap.get(socio.id);
        const overall = Math.floor(
          (socio.user_card_pace + socio.user_card_dribbling + 
           socio.user_card_passing + socio.user_card_defending + 
           socio.user_card_finishing + socio.user_card_physical) / 6
        );
        
        unifiedPlayers.push({
          id: socio.id,
          name: socio.username,
          position: socio.position || 'ala',
          category: socio.category || '1era',
          overall_rating: overall,
          pace: socio.user_card_pace || 40,
          dribbling: socio.user_card_dribbling || 40,
          passing: socio.user_card_passing || 40,
          defending: socio.user_card_defending || 40,
          finishing: socio.user_card_finishing || 40,
          physical: socio.user_card_physical || 40,
          source_type: 'socio',
          is_owned: !!owned,
          user_card_level: owned?.level,
          user_card_id: owned?.card_id,
        });
      });
      
      // Detectar nuevas cartas
      const newOwnedCount = unifiedPlayers.filter(p => p.is_owned).length;
      if (newOwnedCount > prevOwnedCountRef.current) {
        const newlyOwned = unifiedPlayers.find(p => p.is_owned && !allPlayers.find(prev => prev.id === p.id && prev.is_owned));
        if (newlyOwned) {
          setNewlyAcquiredId(newlyOwned.id);
          playSound('stickerPeel');
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => setNewlyAcquiredId(null), 1500);
        }
      }
      prevOwnedCountRef.current = newOwnedCount;
      
      setAllPlayers(unifiedPlayers);
    } catch (error) {
      console.error('Error loading album data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, [userId]);
  
  // Detectar página completada
  const currentPage = ALBUM_PAGES[currentPageIndex];
  const categoryPlayers = allPlayers.filter(p => p.category === currentPage.category);
  const ownedInPage = categoryPlayers.filter(p => p.is_owned).length;
  const pageProgress = (ownedInPage / currentPage.totalCards) * 100;
  
  useEffect(() => {
    const isNowComplete = ownedInPage === currentPage.totalCards;
    if (!prevPageCompleteRef.current && isNowComplete && currentPage.totalCards > 0) {
      setShowPageComplete(true);
      setCompletedPage(currentPage.title);
      playSound('completePage');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setTimeout(() => setShowPageComplete(false), 3000);
    }
    prevPageCompleteRef.current = isNowComplete;
  }, [ownedInPage, currentPage]);
  
  // Estadísticas globales
  const totalCards = allPlayers.filter(p => p.is_owned).length;
  const totalPossible = 150;
  const globalProgress = (totalCards / totalPossible) * 100;
  
  // Detectar álbum completado
  useEffect(() => {
    if (totalCards === totalPossible && totalCards > 0) {
      playSound('albumComplete');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [totalCards]);
  
  // ==================== NAVEGACIÓN CON EFECTOS ====================
  const goToPreviousPage = () => {
    if (currentPageIndex > 0 && !isTransitioning) {
      enableAudio();
      setFlipDirection('prev');
      setIsTransitioning(true);
      playSound('pageFlip');
      
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex - 1);
        setTimeout(() => {
          setIsTransitioning(false);
          setFlipDirection(null);
        }, 400);
      }, 200);
    }
  };
  
  const goToNextPage = () => {
    if (currentPageIndex < ALBUM_PAGES.length - 1 && !isTransitioning) {
      enableAudio();
      setFlipDirection('next');
      setIsTransitioning(true);
      playSound('pageFlip');
      
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex + 1);
        setTimeout(() => {
          setIsTransitioning(false);
          setFlipDirection(null);
        }, 400);
      }, 200);
    }
  };
  
  const goToPage = (index: number) => {
    if (!isTransitioning && index !== currentPageIndex) {
      enableAudio();
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPageIndex(index);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 150);
    }
  };
  
  // ==================== MANEJADORES TÁCTILES ====================
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    }
    setTouchStart(null);
  };
  
  // ==================== RENDER DE CARTA ====================
  const renderCard = (player: UnifiedPlayer) => {
    const posInfo = POSITION_ICONS[player.position] || { icon: '⚽', name: 'JUG', color: '#888' };
    const isNewlyAcquired = newlyAcquiredId === player.id;
    
    if (player.is_owned) {
      return (
        <div 
          key={player.id}
          className={`album-card owned level-${Math.min(player.user_card_level || 1, 5)} ${isNewlyAcquired ? 'newly-acquired' : ''}`}
          onClick={() => {
            enableAudio();
            setSelectedCard(player);
          }}
          style={{ animationDelay: isNewlyAcquired ? '0s' : '0s' }}
        >
          <div className="card-shine" />
          <div className="card-gloss" />
          <div className="card-rarity" style={{ background: getRarityColor(player.overall_rating) }}>
            {player.overall_rating}
          </div>
          <div className="card-position-badge" style={{ background: posInfo.color }}>
            {posInfo.icon}
          </div>
          <div className="card-name">{player.name}</div>
          <div className="card-level">⭐ {player.user_card_level || 1}</div>
          <div className="card-stats">
            <span>⚡{player.pace}</span>
            <span>✨{player.dribbling}</span>
            <span>🎯{player.finishing}</span>
          </div>
          {player.source_type === 'socio' && (
            <div className="real-badge" title="¡Jugador real! Sus stats mejoran cuando juega">🔴 REAL</div>
          )}
          
          <div className="card-texture" />
        </div>
      );
    } else {
      return (
        <div 
          key={player.id} 
          className="album-card missing"
          onClick={() => {
            enableAudio();
            // Feedback de que falta la figurita
            if (navigator.vibrate) navigator.vibrate(50);
          }}
        >
          <div className="missing-overlay">
            <div className="missing-question">?</div>
            <div className="missing-name">{player.name}</div>
            <div className="missing-position" style={{ background: posInfo.color + '40' }}>
              {posInfo.icon}
            </div>
          </div>
          <div className="missing-text">FALTA</div>
          <div className="missing-shine" />
        </div>
      );
    }
  };
  
  // ==================== CONFETTI ====================
  const ConfettiEffect = () => {
    useEffect(() => {
      if (showConfetti && typeof window !== 'undefined') {
        const colors = ['#00ff88', '#FFD700', '#E91E63', '#2196F3', '#FF9800'];
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const confettiScript = document.createElement('script');
            confettiScript.innerHTML = `
              if (typeof confetti === 'function') {
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ${JSON.stringify(colors)},
                  startVelocity: 20,
                  decay: 0.9
                });
              }
            `;
            document.body.appendChild(confettiScript);
            setTimeout(() => confettiScript.remove(), 100);
          }, i * 200);
        }
      }
    }, [showConfetti]);
    
    return null;
  };
  
  // ==================== RENDER PRINCIPAL ====================
  return (
    <div 
      className="card-album" 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
      onClick={enableAudio}
    >
      <ConfettiEffect />
      
      {/* Notificación de página completada */}
      {showPageComplete && (
        <div className="page-complete-notification">
          <div className="notification-content">
            <span className="notification-icon">🎉</span>
            <h3>¡PÁGINA COMPLETADA!</h3>
            <p>{completedPage} - {currentPage.totalCards}/{currentPage.totalCards}</p>
            <div className="notification-sparkles">✨ ✨ ✨</div>
          </div>
        </div>
      )}
      
      {/* Título del álbum */}
      <div className="album-title">
        <h1>📖 MI ÁLBUM DE FIGURITAS</h1>
        <p>FLORES FUTSAL - Temporada 2026</p>
      </div>
      
      {/* Progreso total */}
      <div className="total-progress-card">
        <div className="total-progress-header">
          <span>⚡ PROGRESO DEL ÁLBUM</span>
          <span className="total-count">{totalCards} / {totalPossible}</span>
        </div>
        <div className="total-progress-bar">
          <div className="total-progress-fill" style={{ width: `${globalProgress}%` }} />
          <div className="progress-glow" style={{ left: `${globalProgress}%` }} />
        </div>
        <div className="total-progress-stats">
          <div className="stat-bubble">
            <span className="stat-number">{Math.round(globalProgress)}%</span>
            <span className="stat-label">🎯 Completadas</span>
          </div>
          <div className="stat-bubble">
            <span className="stat-number">{totalPossible - totalCards}</span>
            <span className="stat-label">🔥 Te faltan</span>
          </div>
        </div>
      </div>
      
      {/* Navegación de páginas estilo libro */}
      <div className="album-book">
        <button 
          className={`page-nav prev ${currentPageIndex === 0 ? 'disabled' : ''}`}
          onClick={goToPreviousPage}
          disabled={currentPageIndex === 0}
        >
          ◀
        </button>
        
        <div 
          className={`current-page ${isTransitioning ? `flipping-${flipDirection}` : ''}`}
        >
          <div className="page-cover" style={{ background: currentPage.gradient, borderBottomColor: currentPage.color }}>
            <div className="page-icon-large">{currentPage.icon}</div>
            <h2>{currentPage.title}</h2>
            <p className="page-description">{currentPage.description}</p>
            <div className="page-stats">
              <div className="page-progress-ring">
                <svg viewBox="0 0 36 36" className="progress-ring">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <circle 
                    cx="18" cy="18" r="16" fill="none" 
                    stroke={currentPage.color} 
                    strokeWidth="3"
                    strokeDasharray={`${(pageProgress / 100) * 100} 100`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="progress-ring-text">
                  <span className="progress-count">{ownedInPage}</span>
                  <span className="progress-total">/{currentPage.totalCards}</span>
                </div>
              </div>
            </div>
            {ownedInPage === currentPage.totalCards && currentPage.totalCards > 0 && (
              <div className="page-complete-badge">✓ COMPLETA</div>
            )}
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Abriendo tu álbum...</p>
              <div className="loading-stickers">🏃 ⚽ 🧤 🏆</div>
            </div>
          ) : (
            <div className="stickers-grid">
              {categoryPlayers.map(player => renderCard(player))}
            </div>
          )}
        </div>
        
        <button 
          className={`page-nav next ${currentPageIndex === ALBUM_PAGES.length - 1 ? 'disabled' : ''}`}
          onClick={goToNextPage}
          disabled={currentPageIndex === ALBUM_PAGES.length - 1}
        >
          ▶
        </button>
      </div>
      
      {/* Miniaturas de páginas */}
      <div className="page-thumbnails">
        {ALBUM_PAGES.map((page, idx) => {
          const ownedCount = allPlayers.filter(p => p.category === page.category && p.is_owned).length;
          const isActive = idx === currentPageIndex;
          const isComplete = ownedCount === page.totalCards && page.totalCards > 0;
          return (
            <button
              key={page.id}
              className={`thumbnail ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              onClick={() => goToPage(idx)}
              style={{ '--thumb-color': page.color } as React.CSSProperties}
            >
              <span className="thumb-icon">{page.icon}</span>
              <span className="thumb-title">{page.shortTitle}</span>
              <div className="thumb-progress">
                <div className="thumb-progress-fill" style={{ width: `${(ownedCount / page.totalCards) * 100}%`, background: page.color }} />
              </div>
              {isComplete && <span className="thumb-check">✓</span>}
            </button>
          );
        })}
      </div>
      
      {/* Leyenda */}
      <div className="album-legend">
        <div className="legend-item">
          <div className="legend-box owned"></div>
          <span>✓ Tengo esta figurita</span>
        </div>
        <div className="legend-item">
          <div className="legend-box missing"></div>
          <span>❓ Me falta esta figurita</span>
        </div>
        <div className="legend-item">
          <div className="legend-box real"></div>
          <span>🔴 Jugador real (stats dinámicos)</span>
        </div>
        <div className="legend-item">
          <div className="legend-box complete"></div>
          <span>🏆 Página completa</span>
        </div>
      </div>
      
      {/* Modal de carta detallada */}
      {selectedCard && (
        <div className="card-modal" onClick={() => setSelectedCard(null)}>
          <div className="card-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCard(null)}>✕</button>
            <div className="modal-card" style={{ borderColor: getRarityColor(selectedCard.overall_rating) }}>
              <div className="modal-card-gloss" />
              <div className="modal-card-texture" />
              <div className="modal-rarity" style={{ background: getRarityColor(selectedCard.overall_rating) }}>
                {selectedCard.overall_rating}
              </div>
              <h3 className="modal-name">{selectedCard.name}</h3>
              <p className="modal-category">{selectedCard.category}</p>
              {selectedCard.source_type === 'socio' && (
                <p className="modal-real-badge">🔴 JUGADOR REAL - Stats en vivo</p>
              )}
              <div className="modal-stats">
                <div className="stat-row"><span>⚡ Ritmo</span><strong>{selectedCard.pace}</strong></div>
                <div className="stat-row"><span>✨ Regate</span><strong>{selectedCard.dribbling}</strong></div>
                <div className="stat-row"><span>⚽ Pase</span><strong>{selectedCard.passing}</strong></div>
                <div className="stat-row"><span>🎯 Tiro</span><strong>{selectedCard.finishing}</strong></div>
                <div className="stat-row"><span>🛡️ Defensa</span><strong>{selectedCard.defending}</strong></div>
                <div className="stat-row"><span>💪 Físico</span><strong>{selectedCard.physical}</strong></div>
              </div>
              <div className="modal-footer">
                <span>⭐ Nivel {selectedCard.user_card_level || 1}</span>
                <span className="modal-number">#{selectedCard.id.slice(0, 6)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ==================== ESTILOS COMPLETOS ==================== */}
      <style>{`
        * {
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .card-album {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          background: radial-gradient(ellipse at 20% 30%, rgba(0,255,136,0.03) 0%, transparent 70%);
        }
        
        /* Título */
        .album-title {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .album-title h1 {
          font-family: var(--font-display);
          font-size: 28px;
          margin-bottom: 4px;
          color: #ffffff;
          text-shadow: 0 0 6px rgba(0, 230, 219, 0.53);
          letter-spacing: 1px;
        }
        
        .album-title p {
          font-size: 12px;
          letter-spacing: 2px;
          font-weight: 600;
          color: #00ff88;
          text-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88;
          animation: neonPulse 2s infinite alternate;
        }
        
        @keyframes neonPulse {
          from { text-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88; }
          to { text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00c853; }
        }
        
        /* Progreso total */
        .total-progress-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 16px 20px;
          margin-bottom: 24px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .total-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
          color: rgba(255,255,255,0.7);
        }
        
        .total-count {
          color: #00ff88;
          font-size: 16px;
        }
        
        .total-progress-bar {
          background: rgba(255,255,255,0.08);
          border-radius: 20px;
          height: 14px;
          overflow: hidden;
          margin-bottom: 12px;
          position: relative;
        }
        
        .total-progress-fill {
          background: linear-gradient(90deg, #00e676, #00c853, #69f0ae);
          height: 100%;
          border-radius: 20px;
          transition: width 0.6s ease;
          position: relative;
        }
        
        .progress-glow {
          position: absolute;
          top: -2px;
          width: 4px;
          height: 18px;
          background: white;
          border-radius: 2px;
          box-shadow: 0 0 8px white;
          transition: left 0.6s ease;
        }
        
        .total-progress-stats {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 10px;
        }
        
        .stat-bubble {
          background: linear-gradient(145deg, rgba(0,255,136,0.08), rgba(255,255,255,0.02));
          border-radius: 16px;
          padding: 12px;
          flex: 1;
          text-align: center;
          border: 1px solid rgba(0,255,136,0.15);
          transition: transform 0.2s;
        }
        
        .stat-bubble:hover {
          transform: translateY(-3px) scale(1.03);
        }
        
        .stat-number {
          display: block;
          font-size: 26px;
          font-weight: 800;
          color: #00ff88;
          text-shadow: 0 0 6px rgba(0,255,136,0.4);
        }
        
        .stat-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
        }
        
        .completion-stars {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }
        
        .star {
          font-size: 20px;
          color: rgba(255,215,0,0.3);
          transition: all 0.3s;
        }
        
        .star.filled {
          color: #FFD700;
          text-shadow: 0 0 8px #FFD700;
          animation: starPop 0.5s ease;
        }
        
        @keyframes starPop {
          0% { transform: scale(0); }
          80% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        
        /* Navegación libro */
        .album-book {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .page-nav {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 2px solid #00ff88;
          color: #00ff88;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .page-nav:hover:not(.disabled) {
          background: #00ff88;
          color: #0a0a0f;
          transform: scale(1.1);
          box-shadow: 0 0 15px #00ff88;
        }
        
        .page-nav.disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .current-page {
          flex: 1;
          background: rgba(10,10,15,0.9);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .current-page.flipping-next {
          transform: rotateY(-15deg) scale(0.95);
          transform-origin: left center;
        }
        
        .current-page.flipping-prev {
          transform: rotateY(15deg) scale(0.95);
          transform-origin: right center;
        }
        
        .page-cover {
          padding: 20px;
          text-align: center;
          border-bottom: 2px solid;
          position: relative;
        }
        
        .page-icon-large {
          font-size: 48px;
          display: block;
          margin-bottom: 8px;
          animation: floatIcon 3s ease-in-out infinite;
        }
        
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .page-cover h2 {
          font-family: var(--font-display);
          font-size: 24px;
          margin: 0 0 4px;
          color: white;
        }
        
        .page-description {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 16px;
        }
        
        .page-complete-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
          animation: badgePop 0.5s ease;
        }
        
        @keyframes badgePop {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .page-progress-ring {
          position: relative;
          width: 70px;
          height: 70px;
          margin: 0 auto;
        }
        
        .progress-ring {
          width: 70px;
          height: 70px;
        }
        
        .progress-ring-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .progress-count {
          font-size: 20px;
          font-weight: 700;
          color: #00ff88;
        }
        
        .progress-total {
          font-size: 10px;
          color: rgba(255,255,255,0.5);
        }
        
        /* Grid de figuritas */
        .stickers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 12px;
          padding: 20px;
        }
        
        .album-card {
          aspect-ratio: 3/4;
          border-radius: 16px;
          position: relative;
          transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
          cursor: pointer;
          overflow: hidden;
        }
        
        /* Carta obtenida */
        .album-card.owned {
  background: linear-gradient(rgba(10, 10, 20, 0.81), rgba(10, 10, 20, 0.81)), url('/images/logo.png');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid;
  animation: cardAppear 0.4s ease;
}
        
        @keyframes cardAppear {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .album-card.owned.newly-acquired {
          animation: stickerPeel 0.6s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        
        @keyframes stickerPeel {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; filter: blur(4px); }
          40% { transform: scale(1.1) rotate(2deg); }
          60% { transform: scale(0.98); }
          100% { transform: scale(1) rotate(0); opacity: 1; filter: blur(0); }
        }
        
        .album-card.owned.newly-acquired::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: shimmerFlash 0.8s ease;
        }
        
        @keyframes shimmerFlash {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        
        .album-card.owned.level-1 { border-color: #888; }
        .album-card.owned.level-2 { border-color: #4CAF50; }
        .album-card.owned.level-3 { border-color: #2196F3; }
        .album-card.owned.level-4 { border-color: #9C27B0; }
        .album-card.owned.level-5 { border-color: #FFD700; }
        
        .album-card.owned:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        
        .card-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .card-gloss {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }
        
        .card-texture {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 8px);
          pointer-events: none;
        }
        
        .card-rarity {
          position: absolute;
          top: 8px;
          left: 8px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #0a0a0f;
          z-index: 2;
        }
        
        .card-position-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          background: rgba(0,0,0,0.5);
          z-index: 2;
        }
        
        .card-name {
          text-align: center;
          font-weight: 700;
          font-size: 12px;
          margin-top: 45px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 8px;
          color: white;
        }
        
        .card-level {
          text-align: center;
          font-size: 12px;
          color: rgb(255, 255, 255);
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        .card-stats {
          display: flex;
          justify-content: center;
          gap: 12px;
          font-size: 12px;
          position: absolute;
          bottom: 10px;
          left: 0;
          right: 0;
          color: rgba(255,255,255,0.8);
        }
        
        .real-badge {
          position: absolute;
          top: -1px;
          right: 35px;
          background: #E91E63;
          color: white;
          font-size: 8px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          z-index: 2;
        }
        
        /* Carta faltante */
        .album-card.missing {
          background: rgba(255,255,255,0.05);
          border: 2px dashed rgba(255,255,255,0.2);
          position: relative;
        }
        
        .album-card.missing:hover {
          background: rgba(255,255,255,0.08);
          transform: scale(1.02);
        }
        
        .missing-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          opacity: 0.5;
        }
        
        .missing-question {
          font-size: 32px;
          font-weight: bold;
          color: rgba(255,255,255,0.5);
        }
        
        .missing-name {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          margin: 4px 0;
        }
        
        .missing-position {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        
        .missing-text {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          color: rgba(255,100,100,0.8);
          text-transform: uppercase;
        }
        
        .missing-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: missingShimmer 3s infinite;
        }
        
        @keyframes missingShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        
        /* Miniaturas */
        .page-thumbnails {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 20px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 60px;
        }
        
        .thumbnail {
          background: transparent;
          border: none;
          padding: 6px 12px;
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }
        
        .thumbnail.active {
          background: var(--thumb-color);
          transform: scale(1.05);
        }
        
        .thumbnail.complete {
          background: rgba(76,175,80,0.3);
          border: 1px solid #4CAF50;
        }
        
        .thumb-icon {
          font-size: 14px;
        }
        
        .thumb-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
        }
        
        .thumbnail.active .thumb-title {
          color: #0a0a0f;
        }
        
        .thumb-progress {
          width: 40px;
          height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .thumb-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }
        
        .thumb-check {
          font-size: 10px;
          color: #4CAF50;
          margin-left: 4px;
        }
        
        /* Leyenda */
        .album-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 20px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 60px;
          flex-wrap: wrap;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }
        
        .legend-box {
          width: 20px;
          height: 20px;
          border-radius: 6px;
        }
        
        .legend-box.owned {
          background: linear-gradient(135deg, #1e3a3a, #0f2a2a);
          border: 1px solid #4CAF50;
        }
        
        .legend-box.missing {
          background: rgba(255,255,255,0.05);
          border: 1px dashed rgba(255,255,255,0.3);
        }
        
        .legend-box.real {
          background: #E91E63;
          border: 1px solid #E91E63;
        }
        
        .legend-box.complete {
          background: #4CAF50;
          border: 1px solid #4CAF50;
        }
        
        /* Notificación página completada */
        .page-complete-notification {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1500;
          animation: notificationSlide 0.5s ease, notificationFade 0.5s ease 2.5s forwards;
        }
        
        @keyframes notificationSlide {
          from { top: 0; opacity: 0; }
          to { top: 20%; opacity: 1; }
        }
        
        @keyframes notificationFade {
          to { opacity: 0; visibility: hidden; }
        }
        
        .notification-content {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          border-radius: 20px;
          padding: 20px 40px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          border: 2px solid #FFD700;
        }
        
        .notification-icon {
          font-size: 48px;
          display: block;
          animation: bounce 0.5s ease;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .notification-content h3 {
          margin: 10px 0 5px;
          color: white;
        }
        
        .notification-content p {
          margin: 0;
          color: rgba(255,255,255,0.9);
        }
        
        .notification-sparkles {
          font-size: 20px;
          margin-top: 10px;
          animation: sparkle 0.5s infinite;
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Modal */
        .card-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
        }
        
        .card-modal-inner {
          max-width: 320px;
          width: 90%;
          position: relative;
        }
        
        .modal-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 28px;
          cursor: pointer;
          z-index: 2001;
        }
        
        /* ============================================
   TARJETA PRINCIPAL - ESTRUCTURA FIJA
   ============================================ */
.modal-card {
  background: linear-gradient(135deg, rgba(2, 53, 2, 0.88), rgba(1, 35, 3, 0.92)), url('/images/logo.png');
  background-size: 180px;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 24px;
  padding: 20px 24px 24px;
  text-align: center;
  border: 3px solid rgba(255, 215, 0, 0.85);
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  animation: modalPop 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  max-width: 380px;
  margin: 0 auto;
}

/* Brillo diagonal tipo foil */
.modal-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    115deg,
    transparent 35%,
    rgba(255, 255, 255, 0.3) 48%,
    rgba(255, 255, 255, 0.15) 52%,
    transparent 65%
  );
  transform: rotate(28deg);
  animation: shine 3.5s infinite linear;
  pointer-events: none;
  z-index: 1;
}

@keyframes shine {
  0% { transform: translateX(-35%) rotate(28deg); }
  100% { transform: translateX(35%) rotate(28deg); }
}

/* Borde interno estilo tarjeta FUT */
.modal-card::after {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 215, 0, 0.4);
  pointer-events: none;
  z-index: 2;
}

/* Capa de brillo superior */
.modal-card-gloss {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 24px 24px 0 0;
  pointer-events: none;
  z-index: 2;
}

/* Textura de patrón */
.modal-card-texture {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 10px);
  pointer-events: none;
  z-index: 1;
}

/* Animación de entrada */
@keyframes modalPop {
  from {
    transform: scale(0.75) translateY(30px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* ============================================
   ELEMENTOS INTERNOS - DISPOSICIÓN CONSISTENTE
   ============================================ */

/* Categoría (arriba del todo) */
.modal-category {
  font-size: 14px;
  color: #ffec3e;
  margin-bottom: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 6px rgba(255, 236, 62, 0.5);
  border-bottom: 1px solid rgba(255, 236, 62, 0.4);
  padding-bottom: 6px;
  display: inline-block;
  position: relative;
  z-index: 5;
}

/* Badge real / autenticidad */
.modal-real-badge {
  font-size: 10px;
  color: #ff6b9d;
  margin-bottom: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(0, 0, 0, 0.4);
  display: inline-block;
  padding: 2px 12px;
  border-radius: 30px;
  backdrop-filter: blur(2px);
  position: relative;
  z-index: 5;
}

/* Rareza */
.modal-rarity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 40px;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: #fff;
  background: linear-gradient(135deg, #fef9e0, #ffea9e);
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 215, 0, 0.7);
  margin-bottom: 12px;
  position: relative;
  z-index: 5;
  transition: all 0.2s ease;
}

.modal-rarity:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffffff, #ffec8a);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

/* Nombre */
.modal-name {
  font-family: 'Montserrat', 'Poppins', 'Impact', sans-serif;
  font-size: 26px;
  font-weight: 700;
  margin: 6px 0 4px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  background: linear-gradient(135deg, #f5f5f5 20%, #f3f0e5 50%, #e0e0e0 80%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: none;
  display: block;
  position: relative;
  z-index: 5;
  padding: 0 4px;
}

/* Stats grid */
.modal-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 16px 0 0;
  position: relative;
  z-index: 5;
}

/* Fila de cada stat */
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.15));
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 800;
  color: #f5f5f5;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 215, 0, 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.stat-row:hover {
  transform: translateX(3px);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(0, 0, 0, 0.2));
  border-color: rgba(255, 215, 0, 0.9);
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 900;
  color: #ffdf6e;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
  font-size: 11px;
}

.stat-value {
  font-family: 'Montserrat', monospace;
  font-weight: 900;
  font-size: 13px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.65);
  padding: 2px 8px;
  border-radius: 30px;
  letter-spacing: 0.5px;
}

/* Footer de la carta */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 18px;
  border-top: 1.5px solid rgba(255, 215, 0, 0.5);
  padding-top: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.1));
  position: relative;
  z-index: 5;
}

/* Número serial */
.modal-number {
  font-family: 'Courier New', 'SF Mono', monospace;
  font-weight: 900;
  font-size: 11px;
  color: #ffd966;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 10px;
  border-radius: 30px;
  letter-spacing: 1px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* ============================================
   VARIANTES ESPECIALES (opcionales)
   ============================================ */
.stat-row.special {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.35), rgba(0, 0, 0, 0.25));
  border: 1px solid #ffd966;
}

.stat-row.special .stat-value {
  background: #ffd700;
  color: #1a1a1a;
  text-shadow: none;
}

/* ============================================
   RESPONSIVE (misma estructura)
   ============================================ */
@media (max-width: 480px) {
  .modal-card {
    padding: 16px 18px 20px;
    max-width: 320px;
  }

  .modal-name {
    font-size: 22px;
    letter-spacing: 1px;
  }

  .modal-stats {
    gap: 6px;
    margin-top: 12px;
  }

  .stat-row {
    padding: 6px 10px;
    font-size: 10px;
  }

  .stat-value {
    font-size: 11px;
    padding: 2px 6px;
  }

  .modal-footer {
    font-size: 9px;
    margin-top: 14px;
  }
}
        
        /* Loading */
        .loading-state {
          text-align: center;
          padding: 60px;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #00ff88;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading-stickers {
          font-size: 24px;
          margin-top: 16px;
          animation: runningStickers 1s infinite;
        }
        
        @keyframes runningStickers {
          0% { transform: translateX(-20px); }
          100% { transform: translateX(20px); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .card-album { padding: 12px; }
          .stickers-grid { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 8px; padding: 12px; }
          .card-name { font-size: 10px; margin-top: 35px; }
          .card-stats { gap: 6px; font-size: 8px; }
          .page-nav { width: 36px; height: 36px; font-size: 16px; }
          .page-cover h2 { font-size: 18px; }
          .page-icon-large { font-size: 32px; }
          .thumbnail { padding: 4px 8px; }
          .thumb-title { font-size: 9px; }
          .album-legend { gap: 12px; }
          .legend-item { font-size: 9px; }
        }
      `}</style>
    </div>
  );
}