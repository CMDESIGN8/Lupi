// src/components/DeckBuilder.tsx - Versión ESTILO FIFA

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserCard, Deck } from '../types/cards';
import { calculateChemistry } from '../utils/chemistryEngine'
import { ChemistrySuggestion } from '../utils/chemistryEngine'

interface DeckBuilderProps {
  userId: string;
  userCards: UserCard[];
  activeDeck: Deck;
  onDeckUpdate: (deck: Deck) => void;
}

function getCardData(card: UserCard): any {
  if (!card) return null;
  return card.card || (card as any).player;
}

function getRarityColor(ovr: number): string {
  if (ovr >= 85) return '#9B59B6'; // Legendario
  if (ovr >= 75) return '#FFD700'; // Dorado
  if (ovr >= 65) return '#C0C0C0'; // Plateado
  return '#CD7F32'; // Bronce
}

function getRarityGradient(ovr: number): string {
  if (ovr >= 85) return 'linear-gradient(135deg, #9B59B6, #7D3C98)';
  if (ovr >= 75) return 'linear-gradient(135deg, #FFD700, #DAA520)';
  if (ovr >= 65) return 'linear-gradient(135deg, #C0C0C0, #A9A9A9)';
  return 'linear-gradient(135deg, #CD7F32, #B87333)';
}

function findBestMoves(deck: UserCard[], allCards: UserCard[]) {
  const moves: ChemistrySuggestion[] = []

  for (const benchCard of allCards) {
    for (const slot of [1,2,3,4,5]) {

      const newDeck = deck.map(c =>
        c.position === slot ? { ...benchCard, position: slot } : c
      )

      const newChem = calculateChemistry(newDeck).totalBonus
      const currentChem = calculateChemistry(deck).totalBonus

      const diff = newChem - currentChem

      if (diff > 2) {
  const data = getCardData(benchCard)

  moves.push({
    type: 'swap',
    description: `Reemplazar ${data?.name || 'jugador'} en posicion ${slot} mejora química →  (+${diff})`,
    bonus: diff,
    action: {
      cardIn: benchCard,
      position: slot
    }
  })
}
    }
  }

  return moves.sort((a,b) => b.bonus - a.bonus).slice(0,3)
}

export function DeckBuilder({ userId, userCards, activeDeck, onDeckUpdate }: DeckBuilderProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showCards, setShowCards] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localDeck, setLocalDeck] = useState<Deck>(activeDeck);
  const [autoBuilding, setAutoBuilding] = useState(false);

  useEffect(() => {
    setLocalDeck(activeDeck);
  }, [activeDeck]);

  // ===== CALCULAR BONIFICACIONES =====
  const cardsData = localDeck.cards.map(c => getCardData(c)).filter(Boolean);
  const positions = cardsData.map(c => c.position);
  const categories = cardsData.map(c => c.category);
  const isRealPlayer = cardsData.map(c => c.is_real === true || c.card_type === 'socio');
  
  const isComplete = localDeck.cards.length === 5;
  const hasAllPositions = positions.includes('arquero') && positions.includes('cierre') && 
                          positions.includes('ala') && positions.includes('pivot');
  const realPlayersCount = isRealPlayer.filter(r => r === true).length;
  const hasRealPlayers = realPlayersCount >= 3;
  
  const categoryCount: Record<string, number> = {};
  categories.forEach(cat => { categoryCount[cat] = (categoryCount[cat] || 0) + 1; });
  const hasSameCategory = Object.values(categoryCount).some(count => count === 5);
  
  const femaleCount = categories.filter(c => c === 'femenino').length;
  const hasMixedTeam = femaleCount >= 2;
  const promoCount = categories.filter(c => c === 'Promocionales').length;
  const hasPromo = promoCount >= 1;
  
  let duoBonus = 0;
  for (const count of Object.values(categoryCount)) {
    if (count >= 2) {
      duoBonus += Math.min(2, Math.floor(count / 2)) * 3;
    }
  }
  
  const totalPower = localDeck.cards.reduce((sum, card) => {
    const data = getCardData(card);
    return sum + (data?.overall_rating || 0);
  }, 0);
  
  let totalBonusPercent = 0;
  if (isComplete) totalBonusPercent += 10;
  if (hasAllPositions) totalBonusPercent += 8;
  if (hasRealPlayers) totalBonusPercent += 10;
  if (hasSameCategory) totalBonusPercent += 15;
  if (hasMixedTeam) totalBonusPercent += 6;
  if (hasPromo) totalBonusPercent += 5;
  totalBonusPercent += duoBonus;
  if (totalBonusPercent > 35) totalBonusPercent = 35;
  
  const bonusPoints = Math.floor(totalPower * totalBonusPercent / 100);
  const totalWithBonus = totalPower + bonusPoints;
  const chemistry = calculateChemistry(localDeck.cards)
  const bestMoves = useMemo(() => 
  findBestMoves(localDeck.cards, userCards),
  [localDeck.cards, userCards]
)

const applyMove = (card: UserCard, position: number) => {
  const newCards = [...localDeck.cards]

  const existingIndex = newCards.findIndex(c => c.position === position)

  if (existingIndex >= 0) {
    newCards[existingIndex] = { ...card, position }
  } else {
    newCards.push({ ...card, position })
  }

  setLocalDeck({ ...localDeck, cards: newCards })
}

const [activePositionTab, setActivePositionTab] = useState<'arquero' | 'cierre' | 'ala' | 'pivot'>('arquero');
const [showOnlySocios, setShowOnlySocios] = useState(false);
const [sortByRating, setSortByRating] = useState(false);
const [filterCategory, setFilterCategory] = useState<string>('all');
const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  
  // ===== ARMADO AUTOMÁTICO =====
  const autoBuildTeam = () => {
    setAutoBuilding(true);
    
    const sortedCards = [...userCards].sort((a, b) => {
      const aData = getCardData(a);
      const bData = getCardData(b);
      return (bData?.overall_rating || 0) - (aData?.overall_rating || 0);
    });
    
    const newCards: UserCard[] = [];
    const usedCardIds = new Set();
    
    const findBestCardForPosition = (position: string, slot: number) => {
      const bestCard = sortedCards.find(c => {
        if (usedCardIds.has(c.id)) return false;
        const data = getCardData(c);
        return data?.position === position;
      });
      
      if (bestCard) {
        usedCardIds.add(bestCard.id);
        newCards.push({ ...bestCard, position: slot });
        return true;
      }
      return false;
    };
    
    findBestCardForPosition('arquero', 1);
    findBestCardForPosition('cierre', 2);
    findBestCardForPosition('ala', 3);
    
    const secondAla = sortedCards.find(c => {
      if (usedCardIds.has(c.id)) return false;
      const data = getCardData(c);
      return data?.position === 'ala';
    });
    if (secondAla) {
      usedCardIds.add(secondAla.id);
      newCards.push({ ...secondAla, position: 4 });
    }
    
    findBestCardForPosition('pivot', 5);
    
    for (let slot = 1; slot <= 5; slot++) {
      if (!newCards.find(c => c.position === slot)) {
        const bestAvailable = sortedCards.find(c => !usedCardIds.has(c.id));
        if (bestAvailable) {
          usedCardIds.add(bestAvailable.id);
          newCards.push({ ...bestAvailable, position: slot });
        }
      }
    }
    
    setLocalDeck({ ...localDeck, cards: newCards });
    setTimeout(() => setAutoBuilding(false), 500);
  };

  

  const saveDeck = async () => {
    setSaving(true);
    try {
      await supabase.from('deck_cards').delete().eq('deck_id', localDeck.id);
      for (const card of localDeck.cards) {
        await supabase.from('deck_cards').insert({
          deck_id: localDeck.id,
          user_card_id: card.id,
          position: card.position
        });
      }
      onDeckUpdate(localDeck);
      alert('✅ ¡Equipo guardado!');
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('❌ Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const ChemistryLines = ({ deck }: { deck: Deck }) => {
  const getCard = (pos: number) => deck.cards.find(c => c.position === pos)

  const links = [
    [1, 2],
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 5],
  ]

  const getChemistryColor = (a: any, b: any) => {
    if (!a || !b) return 'transparent'

    if (a.category === b.category) return '#4ade80' // verde
    if (a.club === b.club) return '#facc15' // amarillo
    return '#ef4444' // rojo
  }

  return (
    <svg className="chemistry-lines">
      {links.map(([from, to], i) => {
  const cardA = getCard(from)
  const cardB = getCard(to)

  if (!cardA || !cardB) return null

  const elA = document.querySelector(`.slot-${from}`)
  const elB = document.querySelector(`.slot-${to}`)

  if (!elA || !elB) return null

  const parent = elA.closest('.futsal-pitch-fifa')
  if (!parent) return null

  const rectA = elA.getBoundingClientRect()
  const rectB = elB.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()

  const x1 = rectA.left + rectA.width / 2 - parentRect.left
  const y1 = rectA.top + rectA.height / 2 - parentRect.top

  const x2 = rectB.left + rectB.width / 2 - parentRect.left
  const y2 = rectB.top + rectB.height / 2 - parentRect.top

  const dataA = getCardData(cardA)
  const dataB = getCardData(cardB)

  const color = getChemistryColor(dataA, dataB)

  // 🧠 CURVA (punto de control)
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2 - 40 // 👈 altura de la curva (ajustable)

  const path = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`

  return (
    <path
      key={i}
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={color === '#4ade80' ? 4 : color === '#facc15' ? 3 : 2}
      strokeLinecap="round"
      className="chem-line"
    />
  )
})}
    </svg>
  )
}

  const openCardSelector = (slot: number) => {
    setSelectedSlot(slot);
    setShowCards(true);
  };

  const selectCard = (card: UserCard) => {
    if (!selectedSlot) return;
    const newCards = [...localDeck.cards];
    const existingIndex = newCards.findIndex(c => c.position === selectedSlot);
    if (existingIndex >= 0) {
      newCards[existingIndex] = { ...card, position: selectedSlot };
    } else {
      newCards.push({ ...card, position: selectedSlot });
    }
    setLocalDeck({ ...localDeck, cards: newCards });
    setShowCards(false);
    setSelectedSlot(null);
  };

  const removeCard = (slot: number) => {
    setLocalDeck({
      ...localDeck,
      cards: localDeck.cards.filter(c => c.position !== slot)
    });
  };

  const getCardInSlot = (slot: number) => {
    return localDeck.cards.find(c => c.position === slot);
  };

  const sortedAvailableCards = [...userCards].sort((a, b) => {
    const aData = getCardData(a);
    const bData = getCardData(b);
    return (bData?.overall_rating || 0) - (aData?.overall_rating || 0);
  }).filter(card => !localDeck.cards.some(deckCard => deckCard.id === card.id));

  const cardsByPos = {
    arquero: sortedAvailableCards.filter(c => getCardData(c)?.position === 'arquero'),
    cierre: sortedAvailableCards.filter(c => getCardData(c)?.position === 'cierre'),
    ala: sortedAvailableCards.filter(c => getCardData(c)?.position === 'ala'),
    pivot: sortedAvailableCards.filter(c => getCardData(c)?.position === 'pivot'),
  };

  const [showCardSelector, setShowCardSelector] = useState(false);
  const [filterPosition, setFilterPosition] = useState<'all' | 'arquero' | 'cierre' | 'ala' | 'pivot'>('all');
const [sortBy, setSortBy] = useState<'rating' | 'level' | 'name'>('rating');

// Función para obtener nombre de posición
const getPositionName = (slot: number | null): string => {
  if (slot === 1) return 'arquero';
  if (slot === 2) return 'cierre';
  if (slot === 3 || slot === 4) return 'ala';
  if (slot === 5) return 'pivot';
  return '';
};

// Obtener categorías únicas (DEFINIR ANTES de filteredCards)
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    sortedAvailableCards.forEach(card => {
      const data = getCardData(card);
      if (data?.category) categories.add(data.category);
    });
    return Array.from(categories).sort();
  }, [sortedAvailableCards]);

  // Filtrar y ordenar cartas (USA availableCategories indirectamente, pero no depende de él)
  const filteredCards = useMemo(() => {
    let filtered = [...sortedAvailableCards];
    
    // Filtrar por posición
    if (filterPosition !== 'all') {
      filtered = filtered.filter(card => {
        const data = getCardData(card);
        return data?.position === filterPosition;
      });
    }
    
    // Filtrar por categoría
    if (filterCategory !== 'all') {
      filtered = filtered.filter(card => {
        const data = getCardData(card);
        return data?.category === filterCategory;
      });
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      const aData = getCardData(a);
      const bData = getCardData(b);
      
      if (sortBy === 'rating') {
        return (bData?.overall_rating || 0) - (aData?.overall_rating || 0);
      }
      if (sortBy === 'level') {
        return (b.level || 0) - (a.level || 0);
      }
      if (sortBy === 'name') {
        return (aData?.name || '').localeCompare(bData?.name || '');
      }
      return 0;
    });
    
    return filtered;
  }, [sortedAvailableCards, filterPosition, filterCategory, sortBy]);

  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="tooltip-container" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className="tooltip-content">{text}</div>}
    </div>
  );
};
  

  const benchCards = useMemo(() => {
  const usedIds = new Set(localDeck.cards.map(c => c.id))

  const available = userCards
    .filter(c => !usedIds.has(c.id))
    .sort((a, b) => {
      const aData = getCardData(a)
      const bData = getCardData(b)
      return (bData?.overall_rating || 0) - (aData?.overall_rating || 0)
    })

  const pickBest = (pos: string, count = 1) => {
    return available
      .filter(c => getCardData(c)?.position === pos)
      .slice(0, count)
  }

  return [
    ...pickBest('arquero', 1),
    ...pickBest('cierre', 1),
    ...pickBest('ala', 2),
    ...pickBest('pivot', 1),
  ].slice(0, 5)
}, [userCards, localDeck.cards])

  // Componente de Carta estilo FIFA
  const FiFACard = ({ card, slot, onClick, onRemove }: { card?: UserCard; slot?: number; onClick?: () => void; onRemove?: () => void }) => {
    if (!card) {
      return (
        <div className="fifa-card empty" onClick={onClick}>
          <div className="card-content">
            <div className="card-plus">+</div>
            <div className="card-add-text">AGREGAR</div>
          </div>
        </div>
      );
    }
    
    const data = getCardData(card);
    const gradient = getRarityGradient(data?.overall_rating);
    const positionIcon: Record<string, string> = {
      arquero: '🧤', cierre: '🛡️', ala: '⚡', pivot: '🎯'
    };
    // Función para obtener nombre de posición desde slot
const getPositionName = (slot: number | null): string => {
  if (slot === 1) return 'arquero';
  if (slot === 2) return 'cierre';
  if (slot === 3 || slot === 4) return 'ala';
  if (slot === 5) return 'pivot';
  return '';
};
    
    return (
      <div className="fifa-card" onClick={onClick} style={{ background: gradient }}>
        <div className="card-pattern"></div>
        <div className="card-header">
          <span className="card-position-icon">{positionIcon[data?.position] || '⚽'}</span>
          <span className="card-rating">{data?.overall_rating}</span>
        </div>
        <div className="card-body">
          <div className="card-name">{data?.name || 'Sin nombre'}</div>
          <div className="card-badge">
            <span className="badge-level">⭐ NIVEL {card.level}</span>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">PAC</span>
            <span className="stat-value">{data?.pace || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">DEF</span>
            <span className="stat-value">{data?.defending || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">FIN</span>
            <span className="stat-value">{data?.finishing || 0}</span>
          </div>
        </div>
        {onRemove && (
          <button className="card-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            ✕
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="deck-builder-fifa">
      {/* HEADER con poder total */}
      <div className="fifa-header">
        <div className="team-info">
          <span className="team-icon">⚽</span>
          <span className="team-name">MI EQUIPO FUTSAL</span>
        </div>
        <div className="team-power">
          <span className="power-label">PODER</span>
          <span className="power-value">{totalWithBonus}</span>
          {totalBonusPercent > 0 && (
            <span className="power-bonus">+{totalBonusPercent}%</span>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: CANCHA + BONIFICACIONES */}
      <div className="fifa-layout">
        {/* CANCHA DE FUTSAL */}
        <div className="futsal-pitch-fifa">
          <ChemistryLines deck={localDeck} />
          <div className="pitch-background"></div>
          <div className="center-circle"></div>
        <div className="sideline-deco"></div>
        <div className="corner-mark corner-tl"></div>
        <div className="corner-mark corner-tr"></div>
        <div className="corner-mark corner-bl"></div>
        <div className="corner-mark corner-br"></div>

         
        <div className="semicircle-area semicircle-left"></div>
        <div className="semicircle-area semicircle-right"></div>
        
        
        <div className="penalty-spot penalty-left"></div>
        <div className="penalty-spot penalty-right"></div>
        
        
        <div className="goal-area goal-area-left"></div>
        <div className="goal-area goal-area-right"></div>
          
          {/* ARQUERO */}
          <div className="pitch-slot slot-1">
            <div className="slot-label">
              <span className="slot-number">1</span>
              <span className="slot-icon">🧤</span>
              <span className="slot-name">ARQUERO</span>
            </div>
            <FiFACard 
              card={getCardInSlot(1)} 
              onClick={() => openCardSelector(1)}
              onRemove={() => removeCard(1)}
            />
          </div>

          {/* CIERRE */}
          <div className="pitch-slot slot-2">
            <div className="slot-label">
              <span className="slot-number">2</span>
              <span className="slot-icon">🛡️</span>
              <span className="slot-name">CIERRE</span>
            </div>
            <FiFACard 
              card={getCardInSlot(2)} 
              onClick={() => openCardSelector(2)}
              onRemove={() => removeCard(2)}
            />
          </div>

          {/* ALAS - Fila doble */}
          <div className="pitch-wings">
            <div className="pitch-slot slot-3">
              <div className="slot-label">
                <span className="slot-number">3</span>
                <span className="slot-icon">⚡</span>
                <span className="slot-name">ALA IZQ</span>
              </div>
              <FiFACard 
                card={getCardInSlot(3)} 
                onClick={() => openCardSelector(3)}
                onRemove={() => removeCard(3)}
              />
            </div>
            <div className="pitch-slot slot-4">
              <div className="slot-label">
                <span className="slot-number">4</span>
                <span className="slot-icon">⚡</span>
                <span className="slot-name">ALA DER</span>
              </div>
              <FiFACard 
                card={getCardInSlot(4)} 
                onClick={() => openCardSelector(4)}
                onRemove={() => removeCard(4)}
              />
            </div>
          </div>

          {/* PIVOT */}
          <div className="pitch-slot slot-5">
            <div className="slot-label">
              <span className="slot-number">5</span>
              <span className="slot-icon">🎯</span>
              <span className="slot-name">PIVOT</span>
            </div>
            <FiFACard 
              card={getCardInSlot(5)} 
              onClick={() => openCardSelector(5)}
              onRemove={() => removeCard(5)}
            />
          </div>
        </div>
        
           
        
        {/* PANEL DE BONIFICACIONES */}
        <div className="bonus-panel-fifa">
          <div className="bonus-header-fifa">
            <span>🏆</span>
            <h3>¡LOGROS DE EQUIPO!</h3>
            <Tooltip text="¡Cumplí estos logros para mejorar tu poder!">
              <span className="bonus-help">❔</span>
            </Tooltip>
          </div>
          
           <div className="bonus-list-fifa">
            <div className={`bonus-row ${isComplete ? 'active' : ''}`}>
              <span className="bonus-check">{isComplete ? '🏆' : '⬜'}</span>
              <span className="bonus-name">5 jugadores en cancha</span>
              <Tooltip text="¡Tu equipo completo! +10% poder">
                <span className="bonus-info">ⓘ</span>
              </Tooltip>
              <span className="bonus-percent">+10%</span>
              <span className="bonus-points">(+{Math.floor(totalPower * 0.10)} pts)</span>
            </div>
            
            <div className={`bonus-row ${hasAllPositions ? 'active' : ''}`}>
              <span className="bonus-check">{hasAllPositions ? '🥅' : '⬜'}</span>
              <span className="bonus-name">Todas las posiciones</span>
              <Tooltip text="¡Un jugador en cada posición! +8% poder">
                <span className="bonus-info">ⓘ</span>
              </Tooltip>
              <span className="bonus-percent">+8%</span>
              <span className="bonus-points">(+{Math.floor(totalPower * 0.08)} pts)</span>
            </div>
            
            <div className={`bonus-row ${hasRealPlayers ? 'active' : ''}`}>
              <span className="bonus-check">{hasRealPlayers ? '🌟' : '⬜'}</span>
              <span className="bonus-name">3+ jugadores reales</span>
              <Tooltip text="¡Jugadores de verdad en tu equipo! +10% poder">
                <span className="bonus-info">ⓘ</span>
              </Tooltip>
              <span className="bonus-percent">+10%</span>
              <span className="bonus-points">(+{Math.floor(totalPower * 0.10)} pts)</span>
            </div>
            
            <div className={`bonus-row ${hasMixedTeam ? 'active' : ''}`}>
              <span className="bonus-check">{hasMixedTeam ? '👩⚽' : '⬜'}</span>
              <span className="bonus-name">Jugadoras mujeres</span>
              <Tooltip text="¡Equipo mixto! +6% poder">
                <span className="bonus-info">ⓘ</span>
              </Tooltip>
              <span className="bonus-percent">+6%</span>
              <span className="bonus-points">(+{Math.floor(totalPower * 0.06)} pts)</span>
            </div>
            
            <div className={`bonus-row ${hasPromo ? 'active' : ''}`}>
              <span className="bonus-check">{hasPromo ? '⭐' : '⬜'}</span>
              <span className="bonus-name">Carta Promocional</span>
              <Tooltip text="¡Carta especial! +5% poder">
                <span className="bonus-info">ⓘ</span>
              </Tooltip>
              <span className="bonus-percent">+5%</span>
              <span className="bonus-points">(+{Math.floor(totalPower * 0.05)} pts)</span>
            </div>
            
            <div className={`bonus-row ${duoBonus > 0 ? 'active' : ''}`}>
              <span className="bonus-check">{duoBonus > 0 ? '👥' : '⬜'}</span>
              <span className="bonus-name">Misma categoría</span>
              <Tooltip text="¡Jugadores del mismo grupo! Hacen mejor química">
                <span className="bonus-info">ⓘ</span>
              </Tooltip>
              <span className="bonus-percent">+{duoBonus}%</span>
              <span className="bonus-points">(+{Math.floor(totalPower * (duoBonus / 100))} pts)</span>
            </div>
          </div>
          
          <div className="bonus-total-fifa">
            <div className="total-label">🎁 ¡BONO TOTAL!</div>
            <div className="total-value">{totalBonusPercent}%</div>
            <div className="total-max">(máximo 35%)</div>
            <div className="total-points">
              ¡Ganás <strong>{bonusPoints}</strong> puntos extras!
            </div>
          </div>
           <br></br>
            <br></br>
             
          {/* BOTONES DE ACCIÓN */}
      <div className="action-buttons-fifa">
        <button 
          className="auto-btn" 
          onClick={autoBuildTeam}
          disabled={autoBuilding || userCards.length === 0}
        >
          {autoBuilding ? '🔄 ARMANDO...' : '🤖 ARMADO AUTOMÁTICO'}
        </button>
        <button
          className={`save-btn-fifa ${localDeck.cards.length === 5 ? 'ready' : 'disabled'}`}
          onClick={saveDeck}
          disabled={saving || localDeck.cards.length !== 5}
        >
          {saving ? '💾 GUARDANDO...' : localDeck.cards.length === 5 ? '✅ GUARDAR EQUIPO' : `🔒 FALTAN ${5 - localDeck.cards.length}`}
        </button>
      </div>

<div className="bench-fifa-banco">
  <div className="bench-header-fifa-banco">
    <span>🔄</span>
    <span>BANCO DE SUPLENTES</span>
    <span className="bench-count-banco">Top 5</span>
  </div>

  <div className="bench-row-fifa">
    {benchCards.map(card => {
      const data = getCardData(card)

      return (
        <div key={card.id} className="bench-card-fifa-banco" onClick={() => selectCard(card)}>
          <div className="bench-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>
            {data?.overall_rating}
          </div>

          <div className="bench-card-name-banco">{data?.name}</div>
          <div className="bench-card-level-banco">⭐{card.level}</div>

          <div className="bench-card-position-banco">
            {data?.position?.toUpperCase()}
          </div>
        </div>
      )
    })}
  </div>
</div>

<div className="chemistry-recommendations">
        <div className="chemistry-rec-title">
          💡 ¡CONSEJOS PARA MEJORAR TU EQUIPO!
        </div>
        {bestMoves.map((move, i) => {
          const cardData = move.action?.cardIn ? getCardData(move.action.cardIn) : null;
          return (
            <div key={i} className="chem-rec-card">
              <div className="chem-rec-left">
                <div className="chem-rec-bonus">
                  +{move.bonus}
                </div>
                <div className="chem-rec-text">
                  {move.description}
                </div>
                {cardData && (
                  <div className="chem-rec-player">
                    ⭐ {cardData.name} (Nivel {move.action?.cardIn?.level})
                  </div>
                )}
              </div>
              <button
                className="chem-rec-action"
                onClick={() => {
                  if (!move.action) return;
                  applyMove(move.action.cardIn!, move.action.position!);
                }}
              >
                👆 PONERLO
              </button>
            </div>
          );
        })}
        {bestMoves.length === 0 && (
          <div className="chem-rec-empty">
            🎉 ¡Tu equipo ya está muy bien armado!
          </div>
        )}
      </div>

        </div>
      </div>

      

      {/* BANCO DE SUPLENTES */}
      {sortedAvailableCards.length > 0 && (
  <div className="bench-fifa-enhanced">
    {/* HEADER MEJORADO */}
    <div className="bench-header-enhanced">
      <div className="header-left">
        <span className="header-icon">📚</span>
        <span className="header-title">MI COLECCIÓN</span>
      </div>
      <div className="header-stats">
        <span className="stat-badge">
          <span className="stat-icon">⭐</span>
          {sortedAvailableCards.length}
        </span>
        <span className="stat-badge">
          <span className="stat-icon">🏆</span>
          {sortedAvailableCards.filter(c => getCardData(c)?.overall_rating >= 80).length}
        </span>
      </div>
    </div>

    {/* TABS POR POSICIÓN (más compacto) */}
    <div className="position-tabs">
      {[
        { key: 'arquero', icon: '🧤', label: 'ARQ', color: '#4a90d9' },
        { key: 'cierre', icon: '🛡️', label: 'CIE', color: '#e67e22' },
        { key: 'ala', icon: '⚡', label: 'ALA', color: '#2ecc71' },
        { key: 'pivot', icon: '🎯', label: 'PIV', color: '#e74c3c' }
      ].map(pos => (
        <button
          key={pos.key}
          className={`position-tab ${activePositionTab === pos.key ? 'active' : ''}`}
          onClick={() => setActivePositionTab(pos.key as keyof typeof cardsByPos)}
          style={{ '--tab-color': pos.color } as React.CSSProperties}
        >
          <span className="tab-icon">{pos.icon}</span>
          <span className="tab-label">{pos.label}</span>
          <span className="tab-count">{cardsByPos[pos.key as keyof typeof cardsByPos]?.length || 0}</span>
        </button>
      ))}
    </div>

    {/* GRID DE CARTAS MEJORADO */}
    <div className="cards-grid-enhanced">
      {cardsByPos[activePositionTab]?.map(card => {
        const data = getCardData(card);
        const isSocio = card.card_type === 'socio';
        const rarity = getRarityColor(data?.overall_rating);
        
        return (
          <div 
            key={card.id} 
            className={`enhanced-card ${isSocio ? 'socio-card' : ''}`}
            onClick={() => selectCard(card)}
          >
            {/* Badge de rareza */}
            <div className="card-rarity-badge" style={{ background: rarity }}>
              {data?.overall_rating}
            </div>
            
            {/* Badge de tipo */}
            {isSocio && (
              <div className="card-type-badge" title="Jugador real - Stats dinámicos">
                🔴 REAL
              </div>
            )}
            
            {/* Icono de posición grande */}
            <div className="card-position-icon">
              {activePositionTab === 'arquero' && '🧤'}
              {activePositionTab === 'cierre' && '🛡️'}
              {activePositionTab === 'ala' && '⚡'}
              {activePositionTab === 'pivot' && '🎯'}
            </div>
            
            {/* Nombre */}
            <div className="card-name-enhanced" title={data?.name}>
              {data?.name?.length > 12 ? data?.name?.slice(0, 10) + '...' : data?.name}
            </div>
            
            {/* Nivel */}
            <div className="card-level-enhanced">
              <span className="level-icon">⭐</span>
              <span className="level-value">{card.level}</span>
            </div>
            
            {/* Stats principales según posición */}
            <div className="card-stats-enhanced">
              {activePositionTab === 'arquero' && (
                <>
                  <span>🧤 {data?.defending}</span>
                  <span>💪 {data?.physical}</span>
                </>
              )}
              {activePositionTab === 'cierre' && (
                <>
                  <span>🛡️ {data?.defending}</span>
                  <span>💪 {data?.physical}</span>
                </>
              )}
              {activePositionTab === 'ala' && (
                <>
                  <span>⚡ {data?.pace}</span>
                  <span>✨ {data?.dribbling}</span>
                </>
              )}
              {activePositionTab === 'pivot' && (
                <>
                  <span>🎯 {data?.finishing}</span>
                  <span>💪 {data?.physical}</span>
                </>
              )}
            </div>
            
            {/* Botón de acción */}
            <div className="card-action-btn">
              <span>➕ SELECCIONAR</span>
            </div>
            
            {/* Efecto de brillo */}
            <div className="card-shine-effect"></div>
          </div>
        );
      })}
      
      {/* Empty state si no hay cartas en esta categoría */}
      {cardsByPos[activePositionTab]?.length === 0 && (
        <div className="empty-category">
          <span>📭</span>
          <p>No tienes cartas de esta posición</p>
          <small>Abre sobres para conseguir más</small>
        </div>
      )}
    </div>
  </div>
)}
      {sortedAvailableCards.length === 0 && (
        <div className="no-cards-fifa">
          <span>📭</span>
          <p>¡No tenés cartas!</p>
          <small>🎁 Abrí la Caja Misteriosa para conseguir jugadores</small>
        </div>
      )}

      {/* MODAL MEJORADO - ESTILO FIFA ULTIMATE TEAM */}
{/* MODAL MEJORADO */}
{showCards && (
  <div className="modal-enhanced" onClick={() => setShowCards(false)}>
    <div className="modal-enhanced-content" onClick={e => e.stopPropagation()}>
      
      {/* HEADER */}
      <div className="modal-enhanced-header">
        <div className="position-badge" style={{ 
          background: selectedSlot ? 
            (selectedSlot === 1 ? '#4a90d9' :
             selectedSlot === 2 ? '#e67e22' :
             selectedSlot === 3 || selectedSlot === 4 ? '#2ecc71' : '#e74c3c') 
            : '#888' 
        }}>
          <span className="position-icon">
            {selectedSlot === 1 && '🧤'}
            {selectedSlot === 2 && '🛡️'}
            {selectedSlot === 3 && '⚡'}
            {selectedSlot === 4 && '⚡'}
            {selectedSlot === 5 && '🎯'}
          </span>
          <span className="position-name">
            {selectedSlot === 1 && 'ARQUERO'}
            {selectedSlot === 2 && 'CIERRE'}
            {selectedSlot === 3 && 'ALA IZQUIERDO'}
            {selectedSlot === 4 && 'ALA DERECHO'}
            {selectedSlot === 5 && 'PIVOT'}
          </span>
        </div>
        <button className="modal-enhanced-close" onClick={() => setShowCards(false)}>
          ✕
        </button>
      </div>

      {/* FILTROS */}
      <div className="modal-filters">
        {/* Filtro de posición */}
        <div className="filter-section">
          <label className="filter-label">Posición</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterPosition === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPosition('all')}
            >
              📋 Todas
            </button>
            <button 
              className={`filter-btn ${filterPosition === 'arquero' ? 'active' : ''}`}
              onClick={() => setFilterPosition('arquero')}
            >
              🧤 ARQ
            </button>
            <button 
              className={`filter-btn ${filterPosition === 'cierre' ? 'active' : ''}`}
              onClick={() => setFilterPosition('cierre')}
            >
              🛡️ CIE
            </button>
            <button 
              className={`filter-btn ${filterPosition === 'ala' ? 'active' : ''}`}
              onClick={() => setFilterPosition('ala')}
            >
              ⚡ ALA
            </button>
            <button 
              className={`filter-btn ${filterPosition === 'pivot' ? 'active' : ''}`}
              onClick={() => setFilterPosition('pivot')}
            >
              🎯 PIV
            </button>
          </div>
        </div>

        {/* Filtro de categoría */}
        {availableCategories.length > 0 && (
          <div className="filter-section">
            <label className="filter-label">Categoría</label>
            <div className="filter-buttons category-buttons">
              <button 
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                🏆 Todas
              </button>
              {availableCategories.map(cat => (
                <button 
                  key={cat}
                  className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat === 'femenino' && '👩'}
                  {cat === 'Promocionales' && '⭐'}
                  {cat === 'socios' && '🔴'}
                  {!['femenino', 'Promocionales', 'socios'].includes(cat) && '🏆'}
                  {' '}{cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ordenamiento */}
        <div className="filter-section">
          <label className="filter-label">Ordenar por</label>
          <div className="filter-buttons sort-buttons">
            <button 
              className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
              onClick={() => setSortBy('rating')}
            >
              ⭐ Rating
            </button>
            <button 
              className={`sort-btn ${sortBy === 'level' ? 'active' : ''}`}
              onClick={() => setSortBy('level')}
            >
              📈 Nivel
            </button>
            <button 
              className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => setSortBy('name')}
            >
              🔤 Nombre
            </button>
          </div>
        </div>
      </div>

      {/* CONTADOR DE RESULTADOS */}
      <div className="modal-results-count">
        <span>📚 {filteredCards.length} jugadores encontrados</span>
        {(filterPosition !== 'all' || filterCategory !== 'all') && (
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setFilterPosition('all');
              setFilterCategory('all');
            }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* GRID DE CARTAS */}
      <div className="modal-cards-grid">
        {filteredCards.map(card => {
          const data = getCardData(card);
          const isSocio = card.card_type === 'socio';
          const isSamePosition = data?.position === getPositionName(selectedSlot);
          
          return (
            <div 
              key={card.id} 
              className={`modal-card-enhanced ${isSocio ? 'socio' : ''}`}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(50);
                selectCard(card);
              }}
            >
              <div className="card-rarity" style={{ background: getRarityColor(data?.overall_rating) }}>
                {data?.overall_rating}
              </div>
              
              {isSamePosition && (
                <div className="card-recommended">✓ RECOMENDADA</div>
              )}
              
              <div className="card-position-large">
                {data?.position === 'arquero' && '🧤'}
                {data?.position === 'cierre' && '🛡️'}
                {data?.position === 'ala' && '⚡'}
                {data?.position === 'pivot' && '🎯'}
              </div>
              
              <div className="card-info">
                <div className="card-name">{data?.name}</div>
                <div className="card-category">
                  {data?.category === 'femenino' && '👩 Femenino'}
                  {data?.category === 'Promocionales' && '⭐ Promocional'}
                  {data?.category === 'socios' && '🔴 Socio Real'}
                  {!['femenino', 'Promocionales', 'socios'].includes(data?.category || '') && `🏆 ${data?.category}`}
                </div>
              </div>
              
              <div className="card-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">NIVEL</span>
                  <span className="stat-value">⭐{card.level}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">POSICIÓN</span>
                  <span className="stat-value">{data?.position?.toUpperCase()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">RITMO</span>
                  <span className="stat-value">⚡{data?.pace}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">TIRO</span>
                  <span className="stat-value">🎯{data?.finishing}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">DEFENSA</span>
                  <span className="stat-value">🛡️{data?.defending}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">FÍSICO</span>
                  <span className="stat-value">💪{data?.physical}</span>
                </div>
              </div>
              
              <div className="card-select-btn">
                <span>➕ SELECCIONAR</span>
              </div>
              
              <div className="card-shine"></div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredCards.length === 0 && (
        <div className="modal-empty">
          <span>📭</span>
          <p>No hay jugadores que coincidan con los filtros</p>
          <button 
            className="clear-all-btn"
            onClick={() => {
              setFilterPosition('all');
              setFilterCategory('all');
              setSortBy('rating');
            }}
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}

      {/* BOTÓN FLOTANTE MÓVIL */}
      <button className="modal-fab-close" onClick={() => setShowCards(false)}>
        ✕ CERRAR
      </button>
    </div>
  </div>
)}  

      <style>{`
      /* FILTROS */
.modal-filters {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-section {
  margin-bottom: 12px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #3dffa0;
  color: #0a0a0f;
  border-color: #3dffa0;
}

.sort-btn {
  padding: 6px 12px;
  border-radius: 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  cursor: pointer;
}

.sort-btn.active {
  background: #3dffa0;
  color: #0a0a0f;
}

.modal-results-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  font-size: 11px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.clear-filters-btn {
  background: rgba(255, 77, 109, 0.2);
  border: none;
  padding: 4px 12px;
  border-radius: 20px;
  color: #ff4d6d;
  font-size: 10px;
  cursor: pointer;
}

.clear-all-btn {
  background: #3dffa0;
  border: none;
  padding: 10px 20px;
  border-radius: 30px;
  color: #0a0a0f;
  font-weight: bold;
  margin-top: 16px;
  cursor: pointer;
}

.card-category {
  font-size: 9px;
  color: #ffd700;
  margin-top: 4px;
}
        .deck-builder-fifa {
          background: var(--surface);
          border-radius: 24px;
          padding: 20px;
          margin: 16px 0;
        }

        /* HEADER FIFA */
        .fifa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 16px;
        }
        .team-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .team-icon {
          font-size: 24px;
        }
        .team-name {
          font-weight: bold;
          font-size: 14px;
        }
        .team-power {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,0,0,0.5);
          padding: 6px 16px;
          border-radius: 40px;
        }
        .power-label {
          font-size: 10px;
          text-transform: uppercase;
        }
        .power-value {
          font-size: 24px;
          font-weight: bold;
          font-family: monospace;
        }
        .power-bonus {
          font-size: 11px;
          color: #4ade80;
        }

        /* LAYOUT */
        .fifa-layout {
          display: grid;
          grid-template-columns: 1fr 500px;
          background: radial-gradient(circle at 20% 30%, #1f3d2c, #0c2b1a);
          border-radius: 48px;
          padding: 20px;
            box-shadow: 0 25px 45px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1);
          gap: 20px;
          margin-bottom: 24px;
        }

        /* CANCHA FIFA */
          .futsal-pitch-fifa {
            background: linear-gradient(135deg, #1a6b3c, #0d4525);
            border-radius: 32px;
            padding: 20px;
            position: relative;
            min-height: 700px;
            height: auto;
            border: 3px solid #ffd70099;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: inset 0 0 0 2px rgba(255,215,0,0.3), 0 15px 25px rgba(0,0,0,0.3);
            transition: all 0.2s;
            overflow: hidden;
        }

        /* Fondo central (línea media) */
        .pitch-background {
            position: absolute;
            top: 55%;
            left: 0;
            right: 0;
            height: 2px;
            background: rgba(255,255,255,0.4);
            transform: translateY(-50%);
            pointer-events: none;
            box-shadow: 0 0 3px rgba(255,215,0,0.5);
            
        }

        /* Círculo central */
        .center-circle {
            position: absolute;
            top: 55%;
            left: 50%;
            width: 100px;
            height: 100px;
            border: 2px solid rgba(255,255,255,0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 70%);
        }

        /* Áreas laterales decorativas (líneas de banda) */
        

        /* marcas de esquina */
        .corner-tl { top: 18px; left: 18px; border-right: none; border-bottom: none; }
        .corner-tr { top: 18px; right: 18px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 18px; left: 18px; border-right: none; border-top: none; }
        .corner-br { bottom: 18px; right: 18px; border-left: none; border-top: none; }

        /* Área de los equipos (layout flexible) */
        .teams-layout {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            position: relative;
            z-index: 5;
            flex-wrap: wrap;
        }

         /* Área semicircular profesional (zona de penalti) */
        /* ===== ÁREA SEMICÍRCULO (centrada real) ===== */
.semicircle-area {
  position: absolute;
  bottom: 950px; /* 👈 px real (no %) */
  left: 50%;
  transform: translateX(-50%);

  width: 260px;
  height: 120px;

  border: 2px solid rgba(255,255,220,0.8);
  border-top: none;
  border-radius: 0 0 140px 140px;
  background: radial-gradient(
    ellipse at 50% 0%, 
    rgba(255,215,0,0.15), 
    transparent
  );

  box-shadow: 0 -2px 8px rgba(255,215,0,0.4);
}


/* ===== ÁREA CHICA ===== */
.goal-area {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);

  width: 160px;
  height: 70px;

  border: 2px solid rgba(255,250,180,0.7);
  border-top: none;

  z-index: 9;

  background: linear-gradient(
    to top,
    rgba(255,255,200,0.08),
    transparent
  );
}

.goal-area-left,
.goal-area-right {
  display: none;
}

.semicircle-area::before {
  content: "";
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: rgba(255,255,255,0.4);
}

        
        .pitch-slot {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center; /* 👈 CLAVE */
}
  .fifa-card,
.fifa-card.empty {
  width: 110px;
  height: 150px;
}
          .slot-1 { top: 15%; left: 50%; }   /* ARQ */
.slot-2 { top: 43%; left: 50%; }   /* CIERRE */

.slot-3 { top: 65%; left: 18%; }   /* ALA IZQ */
.slot-4 { top: 65%; left: 83%; }   /* ALA DER */

.slot-5 { top: 84%; left: 50%; }   /* PIVOT */
        .slot-label {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.6);
          padding: 4px 10px;
          border-radius: 20px;
          width: fit-content;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: bold;
        }
        .slot-number {
          background: #ffd700;
          color: #0a0a0f;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .pitch-wings {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        /* CARTA ESTILO FIFA */
        .fifa-card {
           width: 110px;
  height: 150px;
  box-sizing: border-box;
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
            border: 2px solid transparent;

          overflow: hidden;
        }
          .fifa-card:not(.empty) {
  border-color: rgba(255,255,255,0.15);
}
        .fifa-card:hover {
          transform: scale(1.06);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .fifa-card.empty {
          background: rgba(0,0,0,0.5);
          border: 2px dashed rgba(255,255,255,0.2);
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 2px,
            transparent 2px,
            transparent 8px
          );
          pointer-events: none;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .card-position-icon {
          font-size: 24px;
        }
        .card-rating {
          background: rgba(0,0,0,0.6);
          padding: 4px 8px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          color: #ffd700;
        }
        .card-body {
          text-align: center;
          margin: 8px 0;
        }
        .card-name {
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-badge {
          margin-top: 4px;
        }
        .badge-level {
          font-size: 9px;
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 12px;
        }
        .card-stats {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          margin-top: 8px;
        }
        .stat {
          flex: 1;
          text-align: center;
          background: rgba(0,0,0,0.4);
          padding: 4px;
          border-radius: 8px;
        }
        .stat-label {
          font-size: 8px;
          text-transform: uppercase;
          display: block;
          opacity: 0.7;
        }
        .stat-value {
          font-size: 12px;
          font-weight: bold;
        }
        .card-remove {
          position: absolute;
          bottom: 125px;
          right: 81px;
          background: rgba(255,77,109,0.9);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-plus {
          font-size: 32px;
          color: var(--accent);
        }
        .card-add-text {
          font-size: 10px;
          color: var(--text2);
          margin-top: 4px;
        }

        /* PANEL DE BONIFICACIONES */
        .bonus-panel-fifa {
          background: rgba(0,0,0,0.4);
          border-radius: 20px;
          padding: 16px;
          border: 1px solid var(--border);
        }
        .bonus-header-fifa {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--accent);
        }
        
        .bonus-header-fifa h3 { margin: 0; font-size: 16px; }
        
        .bonus-list-fifa {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .bonus-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .bonus-row:hover { background: rgba(255,255,255,0.05); }
        .bonus-row.active { background: rgba(61, 255, 160, 0.1); border-left: 3px solid #3dffa0; }
        
        .bonus-check { width: 28px; font-size: 18px; }
        .bonus-name { flex: 1; }
        .bonus-percent { font-weight: bold; color: #4ade80; }
        .bonus-points { font-size: 9px; color: #ffd700; }
        .bonus-info {
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          cursor: help;
        }
        
        .bonus-total-fifa {
          background: linear-gradient(135deg, #ffd70022, #ffd70011);
          border-radius: 16px;
          padding: 12px;
          text-align: center;
          border: 1px solid #ffd70044;
        }
        .total-label { font-size: 10px; text-transform: uppercase; }
        .total-value { font-size: 32px; font-weight: bold; color: #ffd700; }
        .total-max { font-size: 9px; opacity: 0.7; }
        .total-points { font-size: 12px; margin-top: 8px; color: #3dffa0; }

        /* Botones de acción */
        .action-buttons-fifa {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .auto-btn, .save-btn-fifa {
          flex: 1;
          padding: 14px 12px;
          border-radius: 60px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          min-height: 48px;
          transition: all 0.2s;
        }
        
        .auto-btn {
          background: rgba(156, 39, 176, 0.2);
          border: 2px solid #9C27B0;
          color: #9C27B0;
        }
        
        .auto-btn:active { transform: scale(0.98); }
        
        .save-btn-fifa.ready {
          background: linear-gradient(90deg, #3dffa0, #0f6bc0);
          color: white;
          border: none;
        }
        
        .save-btn-fifa.disabled {
          background: var(--surface2);
          color: var(--text2);
          cursor: not-allowed;
        }

        /* BANCO DE SUPLENTES */
        .bench-fifa {
          border-top: 2px solid var(--border);
          padding-top: 20px;
        }
        .bench-header-fifa {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-weight: bold;
        }
        .bench-count {
          font-size: 11px;
          color: var(--text2);
        }
        .bench-groups-fifa {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bench-group-fifa {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 12px;
        }
        .group-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
          padding-left: 4px;
        }
        .bench-cards-fifa {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .bench-card-fifa {
          flex-shrink: 0;
          width: 100px;
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          position: relative;
          border: 1px solid var(--border);
          transition: all 0.2s;
          text-align: center;
        }
        .bench-card-fifa:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
        }
        .bench-card-rating {
          position: absolute;
          top: 6px;
          left: 6px;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          color: #0a0a0f;
        }
        .bench-card-name {
          font-size: 10px;
          font-weight: bold;
          margin: 20px 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bench-card-level {
          font-size: 8px;
          color: var(--text2);
        }
        .bench-card-stats {
          display: flex;
          justify-content: center;
          gap: 6px;
          font-size: 8px;
          margin: 6px 0;
        }
        .bench-use-btn {
          background: var(--accent);
          color: #0a0a0f;
          padding: 3px 6px;
          border-radius: 16px;
          font-size: 9px;
          font-weight: bold;
          margin-top: 6px;
        }

        .no-cards-fifa {
          text-align: center;
          padding: 40px;
        }

        /* MODAL */
        .modal-fifa {
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
          padding: 16px;
        }
        .modal-fifa-content {
          background: var(--surface);
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .modal-fifa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        .modal-fifa-header h3 {
          margin: 0;
          font-size: 16px;
        }
        .modal-fifa-cards {
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .modal-fifa-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          cursor: pointer;
        }
        .modal-fifa-card:hover {
          background: rgba(255,255,255,0.1);
        }
        .modal-card-icon {
          font-size: 28px;
          width: 45px;
          text-align: center;
        }
        .modal-card-info {
          flex: 1;
        }
        .modal-card-name {
          font-weight: bold;
          font-size: 13px;
        }
        .modal-card-position {
          font-size: 10px;
          color: var(--text2);
        }
        .modal-card-stats {
          display: flex;
          gap: 8px;
          font-size: 10px;
        }
        .modal-card-rating {
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: bold;
          color: #0a0a0f;
        }
        .modal-fifa-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .fifa-layout {
            grid-template-columns: 1fr;
          }
          .pitch-wings {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .fifa-card {
            max-width: 100%;
          }
          .bench-card-fifa {
            width: 85px;
          }
        }
            /* CONTENEDOR */
  .bench-fifa-banco {
    margin-top: 20px;
    padding: 16px;
    border-radius: 20px;
    background: linear-gradient(135deg, #141420, #0f0f1a);
    border: 1px solid rgba(255,255,255,0.06);
    width: 100%;
    box-sizing: border-box;
  }

/* HEADER */
.bench-header-fifa-banco {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 14px;
}

.bench-count-banco {
  font-size: 11px;
  color: var(--text2);
}

/* GRID (5 cartas SIEMPRE visibles) */
.bench-row-fifa {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)); /* 👈 clave */
  gap: 10px;
  width: 100%;
}

/* CARTA */
.bench-card-fifa-banco {
  width: 100%;
  aspect-ratio: 2 / 3;
  background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
  border-radius: 12px;
  padding: 8px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08);

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  transition: all 0.2s ease;
}

.bench-card-fifa-banco:hover {
  transform: translateY(-4px) scale(1.03);
  border-color: var(--accent);
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
}

/* RATING */
.bench-card-rating {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  color: #0a0a0f;
}

/* TEXTO */
.bench-card-name-banco {
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  margin-top: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bench-card-level-banco {
  font-size: 9px;
  color: var(--text2);
}

.bench-card-position-banco {
  font-size: 9px;
  margin-top: 4px;
  opacity: 0.8;
}

/* 📱 MOBILE */
@media (max-width: 768px) {
  .bench-row-fifa {
    gap: 6px;
  }

  .bench-card-fifa-banco {
    padding: 6px;
  }

  .bench-card-name-banco {
    font-size: 9px;
  }

  .bench-card-level-banco,
  .bench-card-position-banco {
    font-size: 8px;
  }
}
  /* CONTENEDOR SVG */
  .chemistry-lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: none;
  }

  /* LÍNEAS */
  .chem-line {
    opacity: 0.9;
    fill: none;

    /* efecto FIFA */
    stroke-dasharray: 6 6;
    animation: chemMove 3s linear infinite;

    transition: all 0.3s ease;
  }

  @keyframes chemMove {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: 20;
    }
  }

  /* glow por color */
  .chem-line[stroke="#4ade80"] {
    filter: drop-shadow(0 0 8px #4ade80);
  }

  .chem-line[stroke="#facc15"] {
    filter: drop-shadow(0 0 8px #facc15);
  }

  .chem-line[stroke="#ef4444"] {
    filter: drop-shadow(0 0 8px #ef4444);
  }

  @keyframes chemMove {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: 20;
    }
  }

  /* GLOW SEGÚN COLOR */
  .chem-line[stroke="#4ade80"] {
    filter: drop-shadow(0 0 8px #4ade80);
  }

  .chem-line[stroke="#facc15"] {
    filter: drop-shadow(0 0 8px #facc15);
  }

  .chem-line[stroke="#ef4444"] {
    filter: drop-shadow(0 0 8px #ef4444);
  }
    .chemistry-recommendations {
          margin: 20px 0;
          padding: 20px;
          border-radius: 20px;
          background: linear-gradient(135deg, #0f172a, #020617);
          border: 1px solid rgba(61, 255, 160, 0.2);
        }
        
        .chemistry-rec-title {
          font-weight: bold;
          margin-bottom: 16px;
          font-size: 16px;
          color: #ffd700;
        }
        
        .chem-rec-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          margin-bottom: 10px;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .chem-rec-left { flex: 1; }
        .chem-rec-bonus { font-size: 18px; font-weight: bold; color: #4ade80; }
        .chem-rec-text { font-size: 12px; opacity: 0.9; margin: 4px 0; }
        .chem-rec-player { font-size: 10px; color: #ffd700; }
        
        .chem-rec-action {
          background: #22c55e;
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          min-height: 44px;
        }
        
        .chem-rec-empty {
          text-align: center;
          padding: 30px;
          color: #4ade80;
        }
          
  /* BIBLIOTECA DE CARTAS MEJORADA */
.bench-fifa-enhanced {
  background: linear-gradient(135deg, rgba(15, 25, 35, 0.95), rgba(10, 15, 25, 0.98));
  border-radius: 24px;
  padding: 20px;
  margin-top: 24px;
  border: 1px solid rgba(61, 255, 160, 0.2);
  backdrop-filter: blur(10px);
}

/* HEADER */
.bench-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(61, 255, 160, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 24px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(135deg, #fff, #3dffa0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.stat-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* TABS */
.position-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px;
  border-radius: 60px;
}

.position-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 40px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
}

.position-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.position-tab.active {
  background: var(--tab-color);
  color: #0a0a0f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.position-tab.active .tab-icon {
  transform: scale(1.1);
}

.tab-icon {
  font-size: 16px;
  transition: transform 0.2s;
}

.tab-label {
  font-size: 11px;
  font-weight: bold;
}

.tab-count {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
}

/* GRID DE CARTAS */
.cards-grid-enhanced {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  max-height: 500px;
  overflow-y: auto;
  padding: 4px;
}

/* SCROLL PERSONALIZADO */
.cards-grid-enhanced::-webkit-scrollbar {
  width: 6px;
}

.cards-grid-enhanced::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.cards-grid-enhanced::-webkit-scrollbar-thumb {
  background: #3dffa0;
  border-radius: 10px;
}

/* CARTA MEJORADA */
.enhanced-card {
  background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
  border-radius: 16px;
  padding: 16px 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  overflow: hidden;
}

.enhanced-card:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: #3dffa0;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.enhanced-card.socio-card {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(136, 14, 79, 0.05));
  border-left: 3px solid #e91e63;
  border-right: 3px solid #e91e63;
}

/* Badge de rareza */
.card-rarity-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #0a0a0f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Badge de tipo */
.card-type-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  background: #e91e63;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Icono de posición */
.card-position-icon {
  font-size: 48px;
  margin: 20px 0 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* Nombre */
.card-name-enhanced {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
}

/* Nivel */
.card-level-enhanced {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 11px;
  color: #ffd700;
}

/* Stats */
.card-stats-enhanced {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 12px 0;
  font-size: 11px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

/* Botón de acción */
.card-action-btn {
  background: linear-gradient(90deg, #3dffa0, #2ecc71);
  padding: 8px;
  border-radius: 30px;
  font-size: 10px;
  font-weight: bold;
  color: #0a0a0f;
  margin-top: 8px;
  transition: all 0.2s;
}

.enhanced-card:hover .card-action-btn {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(61, 255, 160, 0.4);
}

/* Efecto de brillo */
.card-shine-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
  pointer-events: none;
}

.enhanced-card:hover .card-shine-effect {
  left: 100%;
}

/* Empty state */
.empty-category {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-category span {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-category p {
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-category small {
  font-size: 11px;
}

/* Filtros rápidos */
.quick-filters {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.filter-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.7);
}

.filter-chip:hover {
  background: rgba(61, 255, 160, 0.1);
  border-color: #3dffa0;
}

.filter-chip.active {
  background: #3dffa0;
  color: #0a0a0f;
  border-color: #3dffa0;
}

/* Responsive */
@media (max-width: 768px) {
  .cards-grid-enhanced {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
  }
  
  .card-position-icon {
    font-size: 36px;
    margin: 12px 0 8px;
  }
  
  .card-name-enhanced {
    font-size: 11px;
  }
  
  .card-stats-enhanced {
    font-size: 9px;
    gap: 8px;
  }
  
  .position-tab {
    padding: 6px 12px;
  }
  
  .tab-label {
    display: none;
  }
  
  .tab-count {
    font-size: 9px;
  }
}
  /* MODAL MEJORADO */
.modal-enhanced {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: modalFadeIn 0.2s ease;
}

@keyframes modalFadeIn {
  from { opacity: 0; backdrop-filter: blur(0); }
  to { opacity: 1; backdrop-filter: blur(12px); }
}

.modal-enhanced-content {
  background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
  border-radius: 32px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(61, 255, 160, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* HEADER */
.modal-enhanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.position-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  border-radius: 60px;
  font-weight: bold;
}

.position-icon {
  font-size: 24px;
}

.position-name {
  font-size: 16px;
  letter-spacing: 1px;
}

.modal-enhanced-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-enhanced-close:hover {
  background: rgba(255, 77, 109, 0.8);
  transform: scale(1.05);
}

/* TABS */
.modal-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  overflow-x: auto;
  scrollbar-width: thin;
}

.modal-tab {
  padding: 8px 16px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.modal-tab.active {
  background: #3dffa0;
  color: #0a0a0f;
  border-color: #3dffa0;
}

/* CONTROLES */
.modal-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  flex-wrap: wrap;
  gap: 12px;
}

.cards-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: rgba(61, 255, 160, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
}

.sort-options {
  display: flex;
  gap: 8px;
}

.sort-btn {
  padding: 6px 12px;
  border-radius: 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn.active {
  background: #3dffa0;
  color: #0a0a0f;
  border-color: #3dffa0;
}

/* GRID DE CARTAS */
.modal-cards-grid {
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-height: 60vh;
}

/* SCROLL PERSONALIZADO */
.modal-cards-grid::-webkit-scrollbar {
  width: 6px;
}

.modal-cards-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.modal-cards-grid::-webkit-scrollbar-thumb {
  background: #3dffa0;
  border-radius: 10px;
}

/* CARTA MEJORADA */
.modal-card-enhanced {
  background: linear-gradient(145deg, #1a3a1a 0%, #0d2a0d 30%, #2a1a0a 70%, #1a0f05 100%);
  border-radius: 20px;
  padding: 16px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.08);
}
  .modal-card-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.6) 0%,
    rgba(255, 215, 0, 0.2) 50%,
    rgba(255, 215, 0, 0.6) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.modal-card-enhanced:hover::before {
  opacity: 1;
}

/* Efecto holográfico FIFA */
.modal-card-enhanced::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transform: skewX(-25deg);
  transition: left 0.5s ease;
  pointer-events: none;
  z-index: 10;
}

.modal-card-enhanced:hover::after {
  left: 150%;
}

.modal-card-enhanced:active {
  transform: scale(0.98);
}

.modal-card-enhanced.socio {
  background: linear-gradient(135deg, #2a1a2e, #1a0f1f);
  border-left: 4px solid #e91e63;
}

.modal-card-enhanced.out-position {
  opacity: 0.85;
  border-color: rgba(255, 100, 100, 0.3);
}

.tooltip-container {
          position: relative;
          display: inline-flex;
          cursor: help;
        }
        
        .tooltip-content {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e;
          color: #ffd700;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 11px;
          white-space: nowrap;
          z-index: 1000;
          border: 1px solid #3dffa0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          margin-bottom: 8px;
        }
        
        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #1a1a2e transparent transparent transparent;
        }

/* Badges */
.card-rarity {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #0a0a0f;
  z-index: 2;
}

.card-recommended {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #4ade80;
  color: #0a0a0f;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: bold;
  z-index: 2;
}

.card-warning {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ff9800;
  color: #0a0a0f;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: bold;
  z-index: 2;
}

/* Icono posición */
.card-position-large {
  text-align: center;
  font-size: 48px;
  margin: 20px 0 12px;
}

/* Info carta */
.card-info {
  text-align: center;
  margin-bottom: 16px;
}

.card-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
}

.socio-badge {
  font-size: 10px;
  color: #e91e63;
  background: rgba(233, 30, 99, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.npc-badge {
  font-size: 10px;
  color: #888;
}

/* Stats grid */
.card-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px;
  border-radius: 10px;
}

.stat-label {
  display: block;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
}

.stat-value {
  font-size: 12px;
  font-weight: bold;
}

/* Botón de selección */
.card-select-btn {
  background: linear-gradient(90deg, #3dffa0, #2ecc71);
  padding: 10px;
  border-radius: 30px;
  text-align: center;
  font-size: 11px;
  font-weight: bold;
  color: #0a0a0f;
  transition: all 0.2s;
}

.modal-card-enhanced:hover .card-select-btn {
  transform: scale(1.02);
  box-shadow: 0 2px 12px rgba(61, 255, 160, 0.4);
}

/* Shine effect */
.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.3s;
  pointer-events: none;
}

.modal-card-enhanced:active .card-shine {
  left: 100%;
}

/* Empty state */
.modal-empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.modal-empty span {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

/* FAB para cerrar en móvil */
.modal-fab-close {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ff4d6d;
  border: none;
  padding: 14px 24px;
  border-radius: 40px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2001;
}

/* Responsive mobile */
@media (max-width: 768px) {
  .modal-enhanced {
    padding: 0;
  }
  
  .modal-enhanced-content {
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .modal-cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }
  
  .modal-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .modal-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .sort-options {
    justify-content: center;
  }
  
  .modal-fab-close {
    display: block;
  }
  
  .modal-enhanced-close {
    display: none;
  }
}
      `}</style>
    </div>
  );
}