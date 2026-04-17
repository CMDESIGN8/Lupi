// src/components/CardAlbum.tsx - Versión CORREGIDA

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserCard, UnifiedCard, getRarityColor } from '../types/cards';

// Configuración de las páginas del álbum
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

export function CardAlbum({ userId }: { userId: string }) {
  const [allPlayers, setAllPlayers] = useState<UnifiedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [userId]);
  
  const loadData = async () => {
    setLoading(true);
    
    try {
      // 1. Obtener las cartas que el usuario tiene
      const { data: userCards, error: userCardsError } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId);
      
      if (userCardsError) throw userCardsError;
      
      console.log('📊 User cards:', userCards);
      
      // Crear mapa de cartas poseídas
      const ownedCardsMap = new Map();
      userCards?.forEach(card => {
        if (card.card_type === 'npc' && card.player_id) {
          ownedCardsMap.set(card.player_id, { level: card.level, card_id: card.id });
        } else if (card.card_type === 'socio' && card.socio_id) {
          ownedCardsMap.set(card.socio_id, { level: card.level, card_id: card.id });
        }
      });
      
      // 2. Obtener todos los NPCs (players)
      const { data: npcs, error: npcsError } = await supabase
        .from('players')
        .select('*')
        .eq('can_be_replaced', true)
        .eq('is_replaced', false);
      
      if (npcsError) throw npcsError;
      
      // 3. Obtener todos los socios reales (profiles)
      const { data: socios, error: sociosError } = await supabase
        .from('profiles')
        .select('id, username, position, category, user_card_pace, user_card_dribbling, user_card_passing, user_card_defending, user_card_finishing, user_card_physical, total_wins_lifetime, total_battles_lifetime');
      
      if (sociosError) throw sociosError;
      
      console.log('👥 Socios encontrados:', socios?.length);
      console.log('🎴 NPCs encontrados:', npcs?.length);
      
      // 4. Unificar NPCs y Socios en una sola lista
      const unifiedPlayers: UnifiedPlayer[] = [];
      
      // Agregar NPCs
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
      
      // Agregar Socios reales
      socios?.forEach(socio => {
        // Excluir al usuario actual de su propio álbum (no puede coleccionarse a sí mismo)
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
      
      console.log('📋 Jugadores unificados:', unifiedPlayers.length);
      console.log('✅ Jugadores obtenidos:', unifiedPlayers.filter(p => p.is_owned).length);
      
      setAllPlayers(unifiedPlayers);
    } catch (error) {
      console.error('Error loading album data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const currentPage = ALBUM_PAGES[currentPageIndex];
  
  // Filtrar jugadores por categoría
  const categoryPlayers = allPlayers.filter(p => p.category === currentPage.category);
  const ownedInPage = categoryPlayers.filter(p => p.is_owned).length;
  const pageProgress = (ownedInPage / currentPage.totalCards) * 100;
  
  // Estadísticas globales
  const totalCards = allPlayers.filter(p => p.is_owned).length;
  const totalPossible = 150;
  const globalProgress = (totalCards / totalPossible) * 100;
  
  const goToPreviousPage = () => {
    if (currentPageIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      setCurrentPageIndex(currentPageIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };
  
  const goToNextPage = () => {
    if (currentPageIndex < ALBUM_PAGES.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPageIndex(currentPageIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };
  
  const goToPage = (index: number) => {
    if (!isTransitioning && index !== currentPageIndex) {
      setIsTransitioning(true);
      setCurrentPageIndex(index);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };
  
  const renderCard = (player: UnifiedPlayer) => {
    const posInfo = POSITION_ICONS[player.position] || { icon: '⚽', name: 'JUG', color: '#888' };
    
    if (player.is_owned) {
      return (
        <div 
          key={player.id}
          className={`album-card owned level-${Math.min(player.user_card_level || 1, 5)}`}
          onClick={() => setSelectedCard(player)}
        >
          <div className="card-shine" />
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
            <span>🪄{player.dribbling}</span>
            <span>🎯{player.finishing}</span>
          </div>
          {player.source_type === 'socio' && (
            <div className="real-badge" title="¡Jugador real! Sus stats mejoran cuando juega">🔴 REAL</div>
          )}
          <div className="owned-stamp">✓</div>
        </div>
      );
    } else {
      return (
        <div key={player.id} className="album-card missing">
          <div className="missing-overlay">
            <div className="missing-question">?</div>
            <div className="missing-name">{player.name}</div>
            <div className="missing-position" style={{ background: posInfo.color + '40' }}>
              {posInfo.icon}
            </div>
          </div>
          <div className="missing-text">FALTA</div>
        </div>
      );
    }
  };
  
  return (
    <div className="card-album">
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
      
      {/* Navegación de páginas */}
      <div className="album-book">
        <button 
          className={`page-nav prev ${currentPageIndex === 0 ? 'disabled' : ''}`}
          onClick={goToPreviousPage}
          disabled={currentPageIndex === 0}
        >
          ◀
        </button>
        
        <div className={`current-page ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
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
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Cargando tus figuritas...</p>
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
      
      {/* Miniaturas */}
      <div className="page-thumbnails">
        {ALBUM_PAGES.map((page, idx) => {
          const ownedCount = allPlayers.filter(p => p.category === page.category && p.is_owned).length;
          const isActive = idx === currentPageIndex;
          return (
            <button
              key={page.id}
              className={`thumbnail ${isActive ? 'active' : ''}`}
              onClick={() => goToPage(idx)}
              style={{ '--thumb-color': page.color } as React.CSSProperties}
            >
              <span className="thumb-icon">{page.icon}</span>
              <span className="thumb-title">{page.shortTitle}</span>
              <div className="thumb-progress">
                <div className="thumb-progress-fill" style={{ width: `${(ownedCount / page.totalCards) * 100}%`, background: page.color }} />
              </div>
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
      </div>
      
      {/* Modal de carta */}
      {selectedCard && (
        <div className="card-modal" onClick={() => setSelectedCard(null)}>
          <div className="card-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCard(null)}>✕</button>
            <div className="modal-card" style={{ borderColor: getRarityColor(selectedCard.overall_rating) }}>
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
                <div className="stat-row"><span>🪄 Regate</span><strong>{selectedCard.dribbling}</strong></div>
                <div className="stat-row"><span>🎯 Pase</span><strong>{selectedCard.passing}</strong></div>
                <div className="stat-row"><span>🎯 Tiro</span><strong>{selectedCard.finishing}</strong></div>
                <div className="stat-row"><span>🛡️ Defensa</span><strong>{selectedCard.defending}</strong></div>
                <div className="stat-row"><span>💪 Físico</span><strong>{selectedCard.physical}</strong></div>
              </div>
              <div className="modal-footer">
                <span>⭐ Nivel {selectedCard.user_card_level || 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
      .real-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #E91E63;
          color: white;
          font-size: 8px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          z-index: 2;
        }
        
        .modal-real-badge {
          font-size: 11px;
          color: #E91E63;
          margin-bottom: 12px;
          font-weight: bold;
        }
        
        .legend-box.real {
          background: #E91E63;
          border: 1px solid #E91E63;
        }
        .card-album {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
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

  /* Verde Lupi sólido (base limpia) */
  color: #ffffff;

  /* Glow MUY sutil (clave) */
  text-shadow: 0 0 6px rgba(0, 230, 219, 0.53);

  letter-spacing: 1px;
}
        
        .album-title p {
  font-size: 12px;
  letter-spacing: 2px;
  font-weight: 600;

  /* Verde neón base */
  color: #00ff88;

  /* Glow potente */
  text-shadow:
    0 0 5px #00ff88,
    0 0 10px #00ff88,
    0 0 20px #00c853,
    0 0 40px rgba(0, 255, 136, 0.6);

  /* Animación tipo cartel LED */
  animation: neonPulse 2s infinite alternate;

  transition: all 0.3s ease;
}

/* Animación respiración neón */
@keyframes neonPulse {
  from {
    text-shadow:
      0 0 5px #00ff88,
      0 0 10px #00ff88,
      0 0 20px #00c853,
      0 0 30px rgba(0, 255, 136, 0.5);
  }
  to {
    text-shadow:
      0 0 10px #00ff88,
      0 0 20px #00ff88,
      0 0 40px #00c853,
      0 0 60px rgba(0, 255, 136, 0.9);
  }
}

/* Interacción hover */
.album-title p:hover {
  transform: scale(1.08);
  color: #69f0ae;
}
        
        /* Progreso total */
        .total-progress-card {
          background: var(--surface2);
          border-radius: 20px;
          padding: 16px 20px;
          margin-bottom: 24px;
        }
        
        .total-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--text2);
        }
        
        .total-count {
          color: var(--accent);
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

/* Progreso con efecto vivo */
.total-progress-fill {
  background: linear-gradient(90deg, #00e676, #00c853, #69f0ae);
  height: 100%;
  border-radius: 20px;
  transition: width 0.6s ease;

  /* Glow leve */
  box-shadow: 0 0 10px rgba(0, 230, 118, 0.5);
  animation: popProgress 0.6s ease;
}

@keyframes popProgress {
  0% { transform: scaleX(0.95); }
  50% { transform: scaleX(1.02); }
  100% { transform: scaleX(1); }
}

/* Brillito animado (MUY clave para chicos) */
.total-progress-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to {
    left: 120%;
  }
}
        
        .total-progress-stats {
          display: flex;
          justify-content: space-between;
          gap: 16px;
  margin-top: 10px;
        }
        
        .stat-bubble {
  background: linear-gradient(
    145deg,
    rgba(0, 255, 136, 0.08),
    rgba(255, 255, 255, 0.02)
  );
  
  border-radius: 16px;
  padding: 12px;
  flex: 1;
  text-align: center;

  /* borde mucho más sutil */
  border: 1px solid rgba(0, 255, 136, 0.15);

  backdrop-filter: blur(6px);
}

.stat-bubble:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 6px 20px rgba(0,255,136,0.2);
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
  margin-left: 6px;

  color: #a7ffeb;
}
        
        /* Navegación de páginas tipo libro */
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
          background: var(--surface);
          border: 2px solid var(--accent);
          color: var(--accent);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .page-nav:hover:not(.disabled) {
          background: var(--accent);
          color: #0a0a0f;
          transform: scale(1.1);
        }
        
        .page-nav.disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .current-page {
         url("https://www.transparenttextures.com/patterns/paper-fibers.png"),
          var(--surface);
          flex: 1;
          background: var(--surface);
          border-radius: 24px;
          overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }
        
        .current-page.flip {
  transform: rotateY(180deg);
}
        
        /* Portada de la página */
        .page-cover {
          background: linear-gradient(180deg, #fdfdfd, #ececec);
          padding: 20px;
          text-align: center;
          border-bottom: 2px solid #ccc;
          color: #fff;
        }
        
        .page-icon-large {
          font-size: 48px;
          display: block;
          margin-bottom: 8px;
        }
        
        .page-cover h2 {
          font-family: var(--font-display);
          font-size: 24px;
          margin: 0 0 4px;
        }
        
        .page-description {
          font-size: 11px;
          color: var(--text2);
          margin-bottom: 16px;
        }
        
        .page-stats {
          display: flex;
          justify-content: center;
        }
        
        .page-progress-ring {
          position: relative;
          width: 70px;
          height: 70px;
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
          white-space: nowrap;
        }
        
        .progress-count {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--accent);
        }
        
        .progress-total {
          font-size: 10px;
          color: var(--text2);
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
          transition: all 0.2s;
          cursor: pointer;
          background: #f5f5f5; /* papel */
  padding: 4px;
  border-radius: 6px;
        }
  
        
        /* Carta obtenida */
        .album-card.owned {
          background: linear-gradient(135deg, #1e3a3a, #0f2a2a);
          border-radius: 10px;
          border: 2px solid;
          animation: pop 0.4s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2),
          0 4px 10px rgba(0,0,0,0.3);
        }
        
        .album-card.owned.level-1 { border-color: #888; box-shadow: 0 4px 12px rgba(136,136,136,0.3); }
        .album-card.owned.level-2 { border-color: #4CAF50; box-shadow: 0 4px 12px rgba(76,175,80,0.3); }
        .album-card.owned.level-3 { border-color: #2196F3; box-shadow: 0 4px 12px rgba(33,150,243,0.3); }
        .album-card.owned.level-4 { border-color: #9C27B0; box-shadow: 0 4px 12px rgba(156,39,176,0.3); }
        .album-card.owned.level-5 { border-color: #FFD700; box-shadow: 0 4px 15px rgba(255,215,0,0.4); }
        
        .album-card.owned:hover {
          transform: translateY(-6px) scale(1.02);
        }
        
        .card-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          border-radius: 14px;
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
        }
        
        .card-name {
          text-align: center;
          font-weight: 700;
          font-size: 12px;
          margin-top: 35px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .card-level {
          text-align: center;
          font-size: 10px;
          color: var(--text2);
          margin-bottom: 8px;
        }
        
        .card-stats {
          display: flex;
          justify-content: center;
          gap: 12px;
          font-size: 10px;
          position: absolute;
          bottom: 10px;
          left: 0;
          right: 0;
        }
        
        .owned-stamp {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: #4CAF50;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }
        
        /* Carta faltante */
        .album-card.missing {
  background: #e0e0e0;
  border: 2px dashed #bdbdbd;
  position: relative;
}

/* numerito tipo álbum */
.album-card.missing::after {
  content: attr(data-number);
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  color: #888;
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
          color: var(--text2);
        }
        
        .missing-name {
          font-size: 10px;
          color: var(--text2);
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
          font-weigth: bold;
          color: rgb(255, 7, 7);
          text-transform: uppercase;
        }
        
        /* Espacio vacío */
        .album-card.empty {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          cursor: default;
        }
        
        .empty-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 28px;
          opacity: 0.2;
        }
        
        /* Miniaturas de páginas */
        .page-thumbnails {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 20px;
          padding: 12px;
          background: var(--surface2);
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
        }
        
        .thumbnail.active {
          background: var(--thumb-color);
          transform: scale(1.05);
        }
        
        .thumbnail.active .thumb-title {
          color: #0a0a0f;
        }
        
        .thumb-icon {
          font-size: 14px;
        }
        
        .thumb-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text2);
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
        }
        
        /* Leyenda */
        .album-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 20px;
          padding: 12px;
          background: var(--surface2);
          border-radius: 60px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text2);
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
        
        .legend-box.empty {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Loading */
        .loading-state {
          text-align: center;
          padding: 60px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--surface2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
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
        }
        
        .card-modal-inner {
          max-width: 320px;
          width: 90%;
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
        }
        
        .modal-card {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          border: 3px solid;
          animation: pop 0.3s ease;
        }
        
        .modal-rarity {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          color: #0a0a0f;
          margin-bottom: 12px;
        }
        
        .modal-name {
          font-family: var(--font-display);
          font-size: 24px;
          margin: 0 0 4px;
        }
        
        .modal-category {
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 20px;
        }
        
        .modal-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
        }
        
        .modal-footer {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text2);
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .card-album { padding: 12px; }
          .stickers-grid { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 8px; padding: 12px; }
          .card-name { font-size: 10px; margin-top: 30px; }
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