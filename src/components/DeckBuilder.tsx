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
            <h3>BONIFICACIONES</h3>
          </div>
          
          <div className="bonus-list-fifa">
            <div className={`bonus-row ${isComplete ? 'active' : ''}`}>
              <span className="bonus-check">{isComplete ? '✅' : '⬜'}</span>
              <span className="bonus-name">5 jugadores en cancha</span>
              <span className="bonus-percent">+10%</span>
            </div>
            
            <div className={`bonus-row ${hasAllPositions ? 'active' : ''}`}>
              <span className="bonus-check">{hasAllPositions ? '✅' : '⬜'}</span>
              <span className="bonus-name">Una posición por número</span>
              <span className="bonus-percent">+8%</span>
            </div>
            
            <div className={`bonus-row ${hasRealPlayers ? 'active' : ''}`}>
              <span className="bonus-check">{hasRealPlayers ? '✅' : '⬜'}</span>
              <span className="bonus-name">3+ jugadores reales</span>
              <span className="bonus-percent">+10%</span>
            </div>
            
            <div className={`bonus-row ${hasMixedTeam ? 'active' : ''}`}>
              <span className="bonus-check">{hasMixedTeam ? '✅' : '⬜'}</span>
              <span className="bonus-name">2+ jugadoras mujeres</span>
              <span className="bonus-percent">+6%</span>
            </div>
            
            <div className={`bonus-row ${hasPromo ? 'active' : ''}`}>
              <span className="bonus-check">{hasPromo ? '✅' : '⬜'}</span>
              <span className="bonus-name">1 carta Promocional</span>
              <span className="bonus-percent">+5%</span>
            </div>
            
            <div className={`bonus-row ${duoBonus > 0 ? 'active' : ''}`}>
              <span className="bonus-check">{duoBonus > 0 ? '✅' : '⬜'}</span>
              <span className="bonus-name">Parejas misma categoría</span>
              <span className="bonus-percent">+{duoBonus}%</span>
            </div>
          </div>
          
          <div className="bonus-total-fifa">
            <div className="total-label">TOTAL BONO</div>
            <div className="total-value">{totalBonusPercent}%</div>
            <div className="total-max">(máximo 35%)</div>
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
    🔥 MEJORES QUÍMICAS
  </div>

  {bestMoves.map((move, i) => (
    <div key={i} className="chem-rec-card">
      
      <div className="chem-rec-left">
        <div className="chem-rec-bonus">
          +{move.bonus}
        </div>

        <div className="chem-rec-text">
          {move.description}
        </div>
      </div>

      <button
        className="chem-rec-action"
        onClick={() => {
          if (!move.action) return

          applyMove(move.action.cardIn!, move.action.position!)
        }}
      >
        Aplicar
      </button>
    </div>
  ))}
</div>

        </div>
      </div>

      

      {/* BANCO DE SUPLENTES */}
      {sortedAvailableCards.length > 0 && (
        <div className="bench-fifa">
          <div className="bench-header-fifa">
            <span>🔄</span>
            <span>MIS CARTAS</span>
            <span className="bench-count">{sortedAvailableCards.length} jugadores</span>
          </div>
          
          <div className="bench-groups-fifa">
            {cardsByPos.arquero.length > 0 && (
              <div className="bench-group-fifa">
                <div className="group-title">🧤 ARQUEROS</div>
                <div className="bench-cards-fifa">
                  {cardsByPos.arquero.map(card => {
                    const data = getCardData(card);
                    return (
                      <div key={card.id} className="bench-card-fifa" onClick={() => selectCard(card)}>
                        <div className="bench-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>
                          {data?.overall_rating}
                        </div>
                        <div className="bench-card-name">{data?.name}</div>
                        <div className="bench-card-level">⭐{card.level}</div>
                        <div className="bench-card-stats">
                          <span>⚡{data?.pace}</span>
                          <span>🛡️{data?.defending}</span>
                        </div>
                        <div className="bench-use-btn">USAR</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cardsByPos.cierre.length > 0 && (
              <div className="bench-group-fifa">
                <div className="group-title">🛡️ CIERRES</div>
                <div className="bench-cards-fifa">
                  {cardsByPos.cierre.map(card => {
                    const data = getCardData(card);
                    return (
                      <div key={card.id} className="bench-card-fifa" onClick={() => selectCard(card)}>
                        <div className="bench-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>
                          {data?.overall_rating}
                        </div>
                        <div className="bench-card-name">{data?.name}</div>
                        <div className="bench-card-level">⭐{card.level}</div>
                        <div className="bench-card-stats">
                          <span>⚡{data?.pace}</span>
                          <span>🛡️{data?.defending}</span>
                        </div>
                        <div className="bench-use-btn">USAR</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cardsByPos.ala.length > 0 && (
              <div className="bench-group-fifa">
                <div className="group-title">⚡ ALAS</div>
                <div className="bench-cards-fifa">
                  {cardsByPos.ala.map(card => {
                    const data = getCardData(card);
                    return (
                      <div key={card.id} className="bench-card-fifa" onClick={() => selectCard(card)}>
                        <div className="bench-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>
                          {data?.overall_rating}
                        </div>
                        <div className="bench-card-name">{data?.name}</div>
                        <div className="bench-card-level">⭐{card.level}</div>
                        <div className="bench-card-stats">
                          <span>⚡{data?.pace}</span>
                          <span>✨{data?.dribbling}</span>
                        </div>
                        <div className="bench-use-btn">USAR</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cardsByPos.pivot.length > 0 && (
              <div className="bench-group-fifa">
                <div className="group-title">🎯 PIVOTS</div>
                <div className="bench-cards-fifa">
                  {cardsByPos.pivot.map(card => {
                    const data = getCardData(card);
                    return (
                      <div key={card.id} className="bench-card-fifa" onClick={() => selectCard(card)}>
                        <div className="bench-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>
                          {data?.overall_rating}
                        </div>
                        <div className="bench-card-name">{data?.name}</div>
                        <div className="bench-card-level">⭐{card.level}</div>
                        <div className="bench-card-stats">
                          <span>🎯{data?.finishing}</span>
                          <span>💪{data?.physical}</span>
                        </div>
                        <div className="bench-use-btn">USAR</div>
                      </div>
                    );
                  })}
                </div>
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

      {/* MODAL */}
      {showCards && (
        <div className="modal-fifa" onClick={() => setShowCards(false)}>
          <div className="modal-fifa-content" onClick={e => e.stopPropagation()}>
            <div className="modal-fifa-header">
              <h3>Elegí jugador para posición {selectedSlot}</h3>
              <button className="modal-fifa-close" onClick={() => setShowCards(false)}>✕</button>
            </div>
            <div className="modal-fifa-cards">
              {sortedAvailableCards.map(card => {
                const data = getCardData(card);
                const posIcon: Record<string, string> = {
                  arquero: '🧤', cierre: '🛡️', ala: '⚡', pivot: '🎯'
                };
                return (
                  <div key={card.id} className="modal-fifa-card" onClick={() => selectCard(card)}>
                    <div className="modal-card-icon">{posIcon[data?.position] || '⚽'}</div>
                    <div className="modal-card-info">
                      <div className="modal-card-name">{data?.name}</div>
                      <div className="modal-card-position">{data?.position}</div>
                    </div>
                    <div className="modal-card-stats">
                      <span>⭐{card.level}</span>
                      <span>⚡{data?.pace}</span>
                      <span>🎯{data?.finishing}</span>
                    </div>
                    <div className="modal-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>
                      {data?.overall_rating}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
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
  bottom: 810px; /* 👈 px real (no %) */
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
        .bonus-header-fifa h3 {
          margin: 0;
          font-size: 16px;
        }
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
          padding: 6px 8px;
          border-radius: 10px;
          font-size: 11px;
        }
        .bonus-row.active {
          background: rgba(61, 255, 160, 0.1);
        }
        .bonus-check {
          width: 22px;
        }
        .bonus-name {
          flex: 1;
        }
        .bonus-percent {
          font-weight: bold;
          color: #4ade80;
        }
        .bonus-total-fifa {
          background: linear-gradient(135deg, #ffd70022, #ffd70011);
          border-radius: 12px;
          padding: 10px;
          text-align: center;
          border: 1px solid #ffd70044;
        }
        .total-label {
          font-size: 9px;
          text-transform: uppercase;
        }
        .total-value {
          font-size: 28px;
          font-weight: bold;
          color: #ffd700;
        }
        .total-max {
          font-size: 8px;
          opacity: 0.7;
        }

        /* BOTONES */
        .action-buttons-fifa {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .auto-btn {
          flex: 1;
          background: rgba(156, 39, 176, 0.2);
          border: 1px solid #9C27B0;
          border-radius: 40px;
          padding: 10px;
          font-weight: bold;
          color: #9C27B0;
          cursor: pointer;
        }
        .save-btn-fifa {
          flex: 1;
          padding: 10px;
          border-radius: 40px;
          border: none;
          font-weight: bold;
          cursor: pointer;
        }
        .save-btn-fifa.ready {
          background: linear-gradient(90deg, var(--accent), #0f6bc0);
          color: white;
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
  margin-top: 20px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f172a, #020617);
  border: 1px solid rgba(255,255,255,0.08);
}

.chemistry-rec-title {
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 14px;
}

.chem-rec-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  margin-bottom: 8px;
}

.chem-rec-bonus {
  font-size: 18px;
  font-weight: bold;
  color: #4ade80;
}

.chem-rec-text {
  font-size: 11px;
  opacity: 0.8;
}

.chem-rec-action {
  background: #22c55e;
  border: none;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
}
      `}</style>
    </div>
  );
}