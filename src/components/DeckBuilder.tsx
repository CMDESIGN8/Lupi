// src/components/DeckBuilder.tsx - VERSIÓN MEJORADA (niños 8+ y adultos)
// Mejoras: onboarding, progreso por pasos, celebración al completar,
// filtro automático por posición, tooltips, lenguaje simple, badges animados

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserCard, Deck } from '../types/cards';
import { calculateChemistry } from '../utils/chemistryEngine';
import { ChemistrySuggestion } from '../utils/chemistryEngine';

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
  if (ovr >= 85) return '#9B59B6';
  if (ovr >= 75) return '#FFD700';
  if (ovr >= 65) return '#C0C0C0';
  return '#CD7F32';
}

function getRarityGradient(ovr: number): string {
  if (ovr >= 85) return 'linear-gradient(135deg, #9B59B6, #7D3C98)';
  if (ovr >= 75) return 'linear-gradient(135deg, #FFD700, #DAA520)';
  if (ovr >= 65) return 'linear-gradient(135deg, #C0C0C0, #A9A9A9)';
  return 'linear-gradient(135deg, #CD7F32, #B87333)';
}

function getRarityLabel(ovr: number): string {
  if (ovr >= 85) return '👑 LEGENDARIO';
  if (ovr >= 75) return '⭐ DORADO';
  if (ovr >= 65) return '🥈 PLATEADO';
  return '🥉 BRONCE';
}

// Nombres simples de posición para niños
const POSITION_NAMES: Record<number, { short: string; long: string; kid: string; icon: string; color: string }> = {
  1: { short: 'ARQ', long: 'ARQUERO', kid: 'El que ataja', icon: '🧤', color: '#4a90d9' },
  2: { short: 'CIE', long: 'CIERRE', kid: 'El defensor', icon: '🛡️', color: '#e67e22' },
  3: { short: 'ALA IZQ', long: 'ALA IZQUIERDO', kid: 'Corre por la izquierda', icon: '⚡', color: '#2ecc71' },
  4: { short: 'ALA DER', long: 'ALA DERECHO', kid: 'Corre por la derecha', icon: '⚡', color: '#2ecc71' },
  5: { short: 'PIV', long: 'PIVOT', kid: 'El goleador', icon: '🎯', color: '#e74c3c' },
};

function findBestMoves(deck: UserCard[], allCards: UserCard[]) {
  const moves: ChemistrySuggestion[] = [];
  for (const benchCard of allCards) {
    for (const slot of [1, 2, 3, 4, 5]) {
      const newDeck = deck.map(c =>
        c.position === slot ? { ...benchCard, position: slot } : c
      );
      const newChem = calculateChemistry(newDeck).totalBonus;
      const currentChem = calculateChemistry(deck).totalBonus;
      const diff = newChem - currentChem;
      if (diff > 2) {
        const data = getCardData(benchCard);
        moves.push({
          type: 'swap',
          description: `Ponés a ${data?.name || 'este jugador'} de ${POSITION_NAMES[slot]?.long} y tu equipo mejora`,
          bonus: diff,
          action: { cardIn: benchCard, position: slot }
        });
      }
    }
  }
  return moves.sort((a, b) => b.bonus - a.bonus).slice(0, 3);
}

// ===== COMPONENTE PRINCIPAL =====
export function DeckBuilder({ userId, userCards, activeDeck, onDeckUpdate }: DeckBuilderProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showCards, setShowCards] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localDeck, setLocalDeck] = useState<Deck>(activeDeck);
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [activePositionTab, setActivePositionTab] = useState<'arquero' | 'cierre' | 'ala' | 'pivot'>('arquero');
  const [filterPosition, setFilterPosition] = useState<'all' | 'arquero' | 'cierre' | 'ala' | 'pivot'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'level' | 'name'>('rating');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [autoSummary, setAutoSummary] = useState<string | null>(null);
  const prevCardCount = useRef(localDeck.cards.length);

  useEffect(() => { setLocalDeck(activeDeck); }, [activeDeck]);

  // Mostrar onboarding la primera vez
  useEffect(() => {
    const seen = localStorage.getItem('deckbuilder_onboarding_seen');
    if (!seen) setShowOnboarding(true);
  }, []);

  // Detectar equipo completo y celebrar
  useEffect(() => {
    if (localDeck.cards.length === 5 && prevCardCount.current < 5 && !celebrationShown) {
      setShowCelebration(true);
      setCelebrationShown(true);
      setTimeout(() => setShowCelebration(false), 3500);
    }
    prevCardCount.current = localDeck.cards.length;
  }, [localDeck.cards.length]);

  // ===== CÁLCULO DE BONIFICACIONES =====
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
    if (count >= 2) duoBonus += Math.min(2, Math.floor(count / 2)) * 3;
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
  const chemistry = calculateChemistry(localDeck.cards);

  const bestMoves = useMemo(() =>
    findBestMoves(localDeck.cards, userCards),
    [localDeck.cards, userCards]
  );

  // Próximo slot vacío (para guiar al usuario)
  const nextEmptySlot = [1, 2, 3, 4, 5].find(slot => !localDeck.cards.find(c => c.position === slot));
  const missingPositions = [1, 2, 3, 4, 5]
    .filter(slot => !localDeck.cards.find(c => c.position === slot))
    .map(slot => POSITION_NAMES[slot].long);

  // Cards disponibles
  const sortedAvailableCards = [...userCards]
    .sort((a, b) => (getCardData(b)?.overall_rating || 0) - (getCardData(a)?.overall_rating || 0))
    .filter(card => !localDeck.cards.some(deckCard => deckCard.id === card.id));

  const cardsByPos = {
    arquero: sortedAvailableCards.filter(c => getCardData(c)?.position === 'arquero'),
    cierre: sortedAvailableCards.filter(c => getCardData(c)?.position === 'cierre'),
    ala: sortedAvailableCards.filter(c => getCardData(c)?.position === 'ala'),
    pivot: sortedAvailableCards.filter(c => getCardData(c)?.position === 'pivot'),
  };

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    sortedAvailableCards.forEach(card => {
      const data = getCardData(card);
      if (data?.category) cats.add(data.category);
    });
    return Array.from(cats).sort();
  }, [sortedAvailableCards]);

  const filteredCards = useMemo(() => {
    let filtered = [...sortedAvailableCards];
    if (filterPosition !== 'all') filtered = filtered.filter(c => getCardData(c)?.position === filterPosition);
    if (filterCategory !== 'all') filtered = filtered.filter(c => getCardData(c)?.category === filterCategory);
    filtered.sort((a, b) => {
      const aData = getCardData(a); const bData = getCardData(b);
      if (sortBy === 'rating') return (bData?.overall_rating || 0) - (aData?.overall_rating || 0);
      if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
      if (sortBy === 'name') return (aData?.name || '').localeCompare(bData?.name || '');
      return 0;
    });
    // Primero las recomendadas para la posición seleccionada
    if (selectedSlot) {
      const posName = getPositionNameFromSlot(selectedSlot);
      filtered.sort((a, b) => {
        const aMatch = getCardData(a)?.position === posName ? -1 : 1;
        const bMatch = getCardData(b)?.position === posName ? -1 : 1;
        return aMatch - bMatch;
      });
    }
    return filtered;
  }, [sortedAvailableCards, filterPosition, filterCategory, sortBy, selectedSlot]);

  const benchCards = useMemo(() => {
    const usedIds = new Set(localDeck.cards.map(c => c.id));
    const available = userCards.filter(c => !usedIds.has(c.id))
      .sort((a, b) => (getCardData(b)?.overall_rating || 0) - (getCardData(a)?.overall_rating || 0));
    const pickBest = (pos: string, count = 1) =>
      available.filter(c => getCardData(c)?.position === pos).slice(0, count);
    return [...pickBest('arquero', 1), ...pickBest('cierre', 1), ...pickBest('ala', 2), ...pickBest('pivot', 1)].slice(0, 5);
  }, [userCards, localDeck.cards]);

  function getPositionNameFromSlot(slot: number | null): string {
    if (slot === 1) return 'arquero';
    if (slot === 2) return 'cierre';
    if (slot === 3 || slot === 4) return 'ala';
    if (slot === 5) return 'pivot';
    return '';
  }

  const applyMove = (card: UserCard, position: number) => {
    const newCards = [...localDeck.cards];
    const existingIndex = newCards.findIndex(c => c.position === position);
    if (existingIndex >= 0) newCards[existingIndex] = { ...card, position };
    else newCards.push({ ...card, position });
    setLocalDeck({ ...localDeck, cards: newCards });
  };

  const openCardSelector = (slot: number) => {
    setSelectedSlot(slot);
    const posName = getPositionNameFromSlot(slot) as any;
    setFilterPosition(posName || 'all');
    setShowCards(true);
  };

  const selectCard = (card: UserCard) => {
    if (!selectedSlot) return;
    const newCards = [...localDeck.cards];
    const existingIndex = newCards.findIndex(c => c.position === selectedSlot);
    if (existingIndex >= 0) newCards[existingIndex] = { ...card, position: selectedSlot };
    else newCards.push({ ...card, position: selectedSlot });
    setLocalDeck({ ...localDeck, cards: newCards });
    setShowCards(false);
    setSelectedSlot(null);
    if (navigator.vibrate) navigator.vibrate(60);
  };

  const removeCard = (slot: number) => {
    setLocalDeck({ ...localDeck, cards: localDeck.cards.filter(c => c.position !== slot) });
    setCelebrationShown(false);
  };

  const getCardInSlot = (slot: number) => localDeck.cards.find(c => c.position === slot);

  const autoBuildTeam = () => {
    setAutoBuilding(true);
    const sorted = [...userCards].sort((a, b) =>
      (getCardData(b)?.overall_rating || 0) - (getCardData(a)?.overall_rating || 0)
    );
    const newCards: UserCard[] = [];
    const usedIds = new Set<string>();
    const findBest = (pos: string, slot: number) => {
      const best = sorted.find(c => !usedIds.has(c.id) && getCardData(c)?.position === pos);
      if (best) { usedIds.add(best.id); newCards.push({ ...best, position: slot }); return true; }
      return false;
    };
    findBest('arquero', 1); findBest('cierre', 2); findBest('ala', 3);
    const secondAla = sorted.find(c => !usedIds.has(c.id) && getCardData(c)?.position === 'ala');
    if (secondAla) { usedIds.add(secondAla.id); newCards.push({ ...secondAla, position: 4 }); }
    findBest('pivot', 5);
    for (let slot = 1; slot <= 5; slot++) {
      if (!newCards.find(c => c.position === slot)) {
        const best = sorted.find(c => !usedIds.has(c.id));
        if (best) { usedIds.add(best.id); newCards.push({ ...best, position: slot }); }
      }
    }
    setLocalDeck({ ...localDeck, cards: newCards });
    setAutoSummary('Elegí los jugadores con los ratings más altos para cada posición 🤖✨');
    setTimeout(() => { setAutoBuilding(false); setTimeout(() => setAutoSummary(null), 4000); }, 600);
  };

  const saveDeck = async () => {
    setSaving(true);
    try {
      await supabase.from('deck_cards').delete().eq('deck_id', localDeck.id);
      for (const card of localDeck.cards) {
        await supabase.from('deck_cards').insert({ deck_id: localDeck.id, user_card_id: card.id, position: card.position });
      }
      onDeckUpdate(localDeck);
      alert('✅ ¡Equipo guardado!');
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('❌ Error al guardar');
    } finally { setSaving(false); }
  };

  // ===== LÍNEAS DE QUÍMICA =====
  const ChemistryLines = ({ deck }: { deck: Deck }) => {
    const links = [[1, 2], [2, 3], [2, 4], [3, 5], [4, 5]];
    const getChemColor = (a: any, b: any) => {
      if (!a || !b) return 'transparent';
      if (a.category === b.category) return '#4ade80';
      if (a.club === b.club) return '#facc15';
      return '#ef4444';
    };
    return (
      <svg className="chemistry-lines">
        {links.map(([from, to], i) => {
          const cardA = deck.cards.find(c => c.position === from);
          const cardB = deck.cards.find(c => c.position === to);
          if (!cardA || !cardB) return null;
          const elA = document.querySelector(`.slot-${from}`);
          const elB = document.querySelector(`.slot-${to}`);
          if (!elA || !elB) return null;
          const parent = elA.closest('.futsal-pitch-fifa');
          if (!parent) return null;
          const rectA = elA.getBoundingClientRect();
          const rectB = elB.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          const x1 = rectA.left + rectA.width / 2 - parentRect.left;
          const y1 = rectA.top + rectA.height / 2 - parentRect.top;
          const x2 = rectB.left + rectB.width / 2 - parentRect.left;
          const y2 = rectB.top + rectB.height / 2 - parentRect.top;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 - 40;
          const color = getChemColor(getCardData(cardA), getCardData(cardB));
          return (
            <path key={i} d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none" stroke={color}
              strokeWidth={color === '#4ade80' ? 4 : color === '#facc15' ? 3 : 2}
              strokeLinecap="round" className="chem-line" />
          );
        })}
      </svg>
    );
  };

  // ===== CARTA FIFA =====
  const FiFACard = ({ card, slot, onClick, onRemove }: { card?: UserCard; slot?: number; onClick?: () => void; onRemove?: () => void }) => {
    const isNextSlot = slot === nextEmptySlot;
    if (!card) {
      return (
        <div className={`fifa-card empty ${isNextSlot ? 'pulse-slot' : ''}`} onClick={onClick}>
          <div className="card-content">
            <div className="empty-pos-icon">{slot ? POSITION_NAMES[slot].icon : '+'}</div>
            <div className="card-plus">+</div>
            <div className="card-add-text">AGREGAR</div>
            {isNextSlot && <div className="next-indicator">¡Agregá aquí!</div>}
          </div>
        </div>
      );
    }
    const data = getCardData(card);
    const gradient = getRarityGradient(data?.overall_rating);
    return (
      <div className="fifa-card" onClick={onClick} style={{ background: gradient }}>
        <div className="card-pattern"></div>
        <div className="card-header">
          <span className="card-position-icon">{POSITION_NAMES[slot || 1]?.icon || '⚽'}</span>
          <span className="card-rating">{data?.overall_rating}</span>
        </div>
        <div className="card-body">
          <div className="card-name">{data?.name || 'Sin nombre'}</div>
          <div className="card-badge">
            <span className="badge-level">⭐ NIVEL {card.level}</span>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat"><span className="stat-label">VEL</span><span className="stat-value">{data?.pace || 0}</span></div>
          <div className="stat"><span className="stat-label">DEF</span><span className="stat-value">{data?.defending || 0}</span></div>
          <div className="stat"><span className="stat-label">GOL</span><span className="stat-value">{data?.finishing || 0}</span></div>
        </div>
        {onRemove && (
          <button className="card-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Quitar jugador">✕</button>
        )}
      </div>
    );
  };

  // ===== ONBOARDING =====
  const onboardingSteps = [
    { icon: '⚽', title: '¡Armá tu equipo!', text: 'Necesitás 5 jugadores para completar tu equipo de futsal. Tocá cada lugar vacío en la cancha para agregar un jugador.' },
    { icon: '🎯', title: 'Cada posición importa', text: 'Necesitás: 1 Arquero 🧤, 1 Cierre 🛡️, 2 Alas ⚡ y 1 Pivot 🎯. Cada jugador tiene su posición ideal.' },
    { icon: '🏆', title: '¡Sumá bonificaciones!', text: 'Si ponés jugadores del mismo equipo o categoría, ganás puntos extra. ¡Intentá completar todos los logros!' },
  ];

  const BONUS_INFO = [
    { key: 'complete', active: isComplete, icon: '👥', label: '5 jugadores en cancha', tip: 'Necesitás tener los 5 lugares llenos', percent: '+10%', points: Math.floor(totalPower * 10 / 100) },
    { key: 'positions', active: hasAllPositions, icon: '🗂️', label: 'Una posición por número', tip: 'Cada jugador en su posición correcta', percent: '+8%', points: Math.floor(totalPower * 8 / 100) },
    { key: 'real', active: hasRealPlayers, icon: '🔴', label: '3+ jugadores reales', tip: 'Tener 3 o más jugadores reales (socios)', percent: '+10%', points: Math.floor(totalPower * 10 / 100) },
    { key: 'mixed', active: hasMixedTeam, icon: '👩', label: '2+ jugadoras mujeres', tip: 'Incluir al menos 2 jugadoras femeninas', percent: '+6%', points: Math.floor(totalPower * 6 / 100) },
    { key: 'promo', active: hasPromo, icon: '⭐', label: '1 carta Promocional', tip: 'Tener al menos una carta especial promocional', percent: '+5%', points: Math.floor(totalPower * 5 / 100) },
    { key: 'duo', active: duoBonus > 0, icon: '🤝', label: 'Parejas misma categoría', tip: 'Dos o más jugadores del mismo grupo/categoría', percent: `+${duoBonus}%`, points: Math.floor(totalPower * duoBonus / 100) },
  ];

  return (
    <div className="deck-builder-fifa">

      {/* ===== ONBOARDING OVERLAY ===== */}
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-card">
            <div className="onboarding-step-indicator">
              {onboardingSteps.map((_, i) => (
                <div key={i} className={`step-dot ${i === onboardingStep ? 'active' : i < onboardingStep ? 'done' : ''}`} />
              ))}
            </div>
            <div className="onboarding-icon">{onboardingSteps[onboardingStep].icon}</div>
            <h2 className="onboarding-title">{onboardingSteps[onboardingStep].title}</h2>
            <p className="onboarding-text">{onboardingSteps[onboardingStep].text}</p>
            <div className="onboarding-buttons">
              {onboardingStep < onboardingSteps.length - 1 ? (
                <button className="onboarding-next" onClick={() => setOnboardingStep(s => s + 1)}>
                  Siguiente →
                </button>
              ) : (
                <button className="onboarding-next" onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem('deckbuilder_onboarding_seen', '1');
                }}>
                  ¡Empezar! 🚀
                </button>
              )}
              <button className="onboarding-skip" onClick={() => {
                setShowOnboarding(false);
                localStorage.setItem('deckbuilder_onboarding_seen', '1');
              }}>Saltar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CELEBRACIÓN ===== */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <div className="celebration-emoji">🎉</div>
            <h2>¡Equipo completo!</h2>
            <p>Ahora podés guardar tu equipo y jugar</p>
            <div className="confetti-container">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`confetti-piece c${i % 5}`} style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 0.5}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="fifa-header">
        <div className="team-info">
          <span className="team-icon">⚽</span>
          <span className="team-name">MI EQUIPO FUTSAL</span>
        </div>
        <div className="team-power">
          <span className="power-label">PODER</span>
          <span className="power-value">{totalWithBonus}</span>
          {totalBonusPercent > 0 && <span className="power-bonus">+{totalBonusPercent}%</span>}
        </div>
        <button className="help-btn" onClick={() => { setOnboardingStep(0); setShowOnboarding(true); }} title="Ayuda">❓</button>
      </div>

      {/* ===== BARRA DE PROGRESO ===== */}
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${(localDeck.cards.length / 5) * 100}%` }} />
        </div>
        <div className="progress-steps">
          {[1, 2, 3, 4, 5].map(slot => {
            const filled = !!getCardInSlot(slot);
            const pos = POSITION_NAMES[slot];
            return (
              <div key={slot} className={`progress-step ${filled ? 'done' : slot === nextEmptySlot ? 'next' : ''}`}>
                <div className="step-circle">{filled ? '✓' : pos.icon}</div>
                <div className="step-label">{pos.short}</div>
              </div>
            );
          })}
        </div>
        {!isComplete && nextEmptySlot && (
          <div className="progress-hint">
            👇 Paso {localDeck.cards.length + 1} de 5: Elegí tu <strong>{POSITION_NAMES[nextEmptySlot].long}</strong> — {POSITION_NAMES[nextEmptySlot].kid}
          </div>
        )}
        {isComplete && <div className="progress-hint complete">✅ ¡Equipo completo! Ya podés guardar.</div>}
      </div>

      {/* ===== LAYOUT PRINCIPAL ===== */}
      <div className="fifa-layout">
        {/* CANCHA */}
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

          {/* LEYENDA DE QUÍMICA */}
          <div className="chem-legend">
            <span className="chem-dot green"></span><span>Misma Categoria</span>
            <span className="chem-dot yellow"></span><span>Mismo club</span>
            <span className="chem-dot red"></span><span>Sin conexión</span>
          </div>

          {[1, 2, 3, 4, 5].map(slot => {
            const pos = POSITION_NAMES[slot];
            return (
              <div key={slot} className={`pitch-slot slot-${slot}`}>
                <div className="slot-label">
                  <span className="slot-number">{slot}</span>
                  <span className="slot-icon">{pos.icon}</span>
                  <span className="slot-name">{pos.long}</span>
                </div>
                <FiFACard
                  card={getCardInSlot(slot)}
                  slot={slot}
                  onClick={() => openCardSelector(slot)}
                  onRemove={getCardInSlot(slot) ? () => removeCard(slot) : undefined}
                />
              </div>
            );
          })}
        </div>

        {/* PANEL LATERAL */}
        <div className="bonus-panel-fifa">

          {/* BONIFICACIONES */}
          <div className="bonus-header-fifa">
            <span>🏆</span>
            <h3>LOGROS Y BONIFICACIONES</h3>
          </div>

          <div className="bonus-list-fifa">
            {BONUS_INFO.map(b => (
              <div key={b.key} className={`bonus-row ${b.active ? 'active' : ''}`}
                onMouseEnter={() => setShowTooltip(b.key)}
                onMouseLeave={() => setShowTooltip(null)}
                onClick={() => setShowTooltip(showTooltip === b.key ? null : b.key)}
              >
                <span className="bonus-check">{b.active ? '✅' : '⬜'}</span>
                <span className="bonus-icon">{b.icon}</span>
                <span className="bonus-name">{b.label}</span>
                <span className="bonus-percent">{b.percent}</span>
                {b.active && <span className="bonus-pts">+{b.points}pts</span>}
                <span className="bonus-help-icon">?</span>
                {showTooltip === b.key && (
                  <div className="bonus-tooltip">{b.tip}</div>
                )}
              </div>
            ))}
          </div>

          <div className="bonus-total-fifa">
            <div className="total-label">TOTAL BONO</div>
            <div className="total-value">{totalBonusPercent}%</div>
            <div className="total-pts">+{bonusPoints} puntos extra</div>
            <div className="total-max">(máximo 35%)</div>
          </div>

          {/* BOTONES */}
          <div className="action-buttons-fifa">
            <button className="auto-btn" onClick={autoBuildTeam} disabled={autoBuilding || userCards.length === 0}>
              {autoBuilding ? '🔄 ARMANDO...' : '🤖 ARMADO AUTOMÁTICO'}
            </button>
            <button
              className={`save-btn-fifa ${isComplete ? 'ready' : 'disabled'}`}
              onClick={saveDeck}
              disabled={saving || !isComplete}
              title={!isComplete ? `Faltan: ${missingPositions.join(', ')}` : 'Guardar equipo'}
            >
              {saving ? '💾 GUARDANDO...' : isComplete ? '✅ GUARDAR EQUIPO' : `🔒 FALTA: ${missingPositions[0] || '...'}`}
            </button>
          </div>

          {/* RESUMEN AUTO BUILD */}
          {autoSummary && (
            <div className="auto-summary">{autoSummary}</div>
          )}

          {/* BANCO DE SUPLENTES */}
          <div className="bench-fifa-banco">
            <div className="bench-header-fifa-banco">
              <span>🔄</span><span>BANCO DE SUPLENTES</span><span className="bench-count-banco">Top 5</span>
            </div>
            <div className="bench-row-fifa">
              {benchCards.map(card => {
                const data = getCardData(card);
                return (
                  <div key={card.id} className="bench-card-fifa-banco" onClick={() => selectCard(card)} title={`Usar a ${data?.name}`}>
                    <div className="bench-card-rating" style={{ background: getRarityColor(data?.overall_rating) }}>{data?.overall_rating}</div>
                    <div className="bench-card-pos-icon">{POSITION_NAMES[data?.position === 'arquero' ? 1 : data?.position === 'cierre' ? 2 : data?.position === 'ala' ? 3 : 5]?.icon}</div>
                    <div className="bench-card-name-banco">{data?.name}</div>
                    <div className="bench-card-level-banco">⭐{card.level}</div>
                    <div className="bench-card-position-banco">{data?.position?.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUGERENCIAS DE QUÍMICA */}
          {bestMoves.length > 0 && (
            <div className="chemistry-recommendations">
              <div className="chemistry-rec-title">💡 SUGERENCIAS PARA MEJORAR</div>
              {bestMoves.map((move, i) => (
                <div key={i} className="chem-rec-card">
                  <div className="chem-rec-left">
                    <div className="chem-rec-bonus">+{move.bonus}</div>
                    <div className="chem-rec-text">{move.description}</div>
                  </div>
                  <button className="chem-rec-action" onClick={() => { if (move.action) applyMove(move.action.cardIn!, move.action.position!); }}>
                    Aplicar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== COLECCIÓN ===== */}
      {sortedAvailableCards.length > 0 && (
        <div className="bench-fifa-enhanced">
          <div className="bench-header-enhanced">
            <div className="header-left">
              <span className="header-icon">📚</span>
              <span className="header-title">MI COLECCIÓN</span>
            </div>
            <div className="header-stats">
              <span className="stat-badge"><span className="stat-icon">⭐</span>{sortedAvailableCards.length} cartas</span>
              <span className="stat-badge"><span className="stat-icon">🏆</span>{sortedAvailableCards.filter(c => getCardData(c)?.overall_rating >= 80).length} top</span>
            </div>
          </div>
          <div className="position-tabs">
            {[
              { key: 'arquero', icon: '🧤', label: 'ARQ', color: '#4a90d9', desc: 'El que ataja' },
              { key: 'cierre', icon: '🛡️', label: 'CIE', color: '#e67e22', desc: 'El defensor' },
              { key: 'ala', icon: '⚡', label: 'ALA', color: '#2ecc71', desc: 'Los veloces' },
              { key: 'pivot', icon: '🎯', label: 'PIV', color: '#e74c3c', desc: 'El goleador' }
            ].map(pos => (
              <button key={pos.key}
                className={`position-tab ${activePositionTab === pos.key ? 'active' : ''}`}
                onClick={() => setActivePositionTab(pos.key as any)}
                style={{ '--tab-color': pos.color } as React.CSSProperties}
                title={pos.desc}
              >
                <span className="tab-icon">{pos.icon}</span>
                <span className="tab-label">{pos.label}</span>
                <span className="tab-sublabel">{pos.desc}</span>
                <span className="tab-count">{cardsByPos[pos.key as keyof typeof cardsByPos]?.length || 0}</span>
              </button>
            ))}
          </div>
          <div className="cards-grid-enhanced">
            {cardsByPos[activePositionTab]?.map(card => {
              const data = getCardData(card);
              const isSocio = card.card_type === 'socio';
              const rarity = getRarityColor(data?.overall_rating);
              return (
                <div key={card.id} className={`enhanced-card ${isSocio ? 'socio-card' : ''}`} onClick={() => selectCard(card)}>
                  <div className="card-rarity-badge" style={{ background: rarity }}>{data?.overall_rating}</div>
                  {isSocio && <div className="card-type-badge">🔴 REAL</div>}
                  <div className="card-rarity-label">{getRarityLabel(data?.overall_rating)}</div>
                  <div className="card-position-icon">
                    {activePositionTab === 'arquero' && '🧤'}
                    {activePositionTab === 'cierre' && '🛡️'}
                    {activePositionTab === 'ala' && '⚡'}
                    {activePositionTab === 'pivot' && '🎯'}
                  </div>
                  <div className="card-name-enhanced" title={data?.name}>
                    {data?.name?.length > 12 ? data?.name?.slice(0, 10) + '...' : data?.name}
                  </div>
                  <div className="card-level-enhanced"><span className="level-icon">⭐</span><span className="level-value">{card.level}</span></div>
                  <div className="card-stats-enhanced">
                    {activePositionTab === 'arquero' && (<><span>🧤 {data?.defending}</span><span>💪 {data?.physical}</span></>)}
                    {activePositionTab === 'cierre' && (<><span>🛡️ {data?.defending}</span><span>💪 {data?.physical}</span></>)}
                    {activePositionTab === 'ala' && (<><span>⚡ {data?.pace}</span><span>✨ {data?.dribbling}</span></>)}
                    {activePositionTab === 'pivot' && (<><span>🎯 {data?.finishing}</span><span>💪 {data?.physical}</span></>)}
                  </div>
                  <div className="card-action-btn"><span>➕ SELECCIONAR</span></div>
                  <div className="card-shine-effect"></div>
                </div>
              );
            })}
            {cardsByPos[activePositionTab]?.length === 0 && (
              <div className="empty-category">
                <span>📭</span>
                <p>No tenés cartas de esta posición</p>
                <small>Abrí sobres para conseguir más</small>
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

      {/* ===== MODAL MEJORADO ===== */}
      {showCards && (
        <div className="modal-enhanced" onClick={() => setShowCards(false)}>
          <div className="modal-enhanced-content" onClick={e => e.stopPropagation()}>
            <div className="modal-enhanced-header">
              <div className="position-badge" style={{
                background: selectedSlot ?
                  (selectedSlot === 1 ? '#4a90d9' : selectedSlot === 2 ? '#e67e22' :
                    selectedSlot === 3 || selectedSlot === 4 ? '#2ecc71' : '#e74c3c') : '#888'
              }}>
                <span className="position-icon">{selectedSlot ? POSITION_NAMES[selectedSlot].icon : '⚽'}</span>
                <div>
                  <span className="position-name">{selectedSlot ? POSITION_NAMES[selectedSlot].long : ''}</span>
                  <span className="position-kid-desc">{selectedSlot ? POSITION_NAMES[selectedSlot].kid : ''}</span>
                </div>
              </div>
              <button className="modal-enhanced-close" onClick={() => setShowCards(false)}>✕</button>
            </div>

            {/* FILTROS */}
            <div className="modal-filters">
              <div className="filter-section">
                <label className="filter-label">Filtrar por posición</label>
                <div className="filter-buttons">
                  {[
                    { val: 'all', label: '📋 Todas' },
                    { val: 'arquero', label: '🧤 ARQ' },
                    { val: 'cierre', label: '🛡️ CIE' },
                    { val: 'ala', label: '⚡ ALA' },
                    { val: 'pivot', label: '🎯 PIV' },
                  ].map(f => (
                    <button key={f.val} className={`filter-btn ${filterPosition === f.val ? 'active' : ''}`}
                      onClick={() => setFilterPosition(f.val as any)}>{f.label}</button>
                  ))}
                </div>
              </div>
              {availableCategories.length > 0 && (
                <div className="filter-section">
                  <label className="filter-label">Filtrar por categoría</label>
                  <div className="filter-buttons category-buttons">
                    <button className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`} onClick={() => setFilterCategory('all')}>🏆 Todas</button>
                    {availableCategories.map(cat => (
                      <button key={cat} className={`filter-btn ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>
                        {cat === 'femenino' ? '👩' : cat === 'Promocionales' ? '⭐' : cat === 'socios' ? '🔴' : '🏆'} {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="filter-section">
                <label className="filter-label">Ordenar por</label>
                <div className="filter-buttons sort-buttons">
                  {[{ val: 'rating', label: '⭐ Rating' }, { val: 'level', label: '📈 Nivel' }, { val: 'name', label: '🔤 Nombre' }].map(s => (
                    <button key={s.val} className={`sort-btn ${sortBy === s.val ? 'active' : ''}`} onClick={() => setSortBy(s.val as any)}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-results-count">
              <span>📚 {filteredCards.length} jugadores encontrados</span>
              {(filterPosition !== 'all' || filterCategory !== 'all') && (
                <button className="clear-filters-btn" onClick={() => { setFilterPosition('all'); setFilterCategory('all'); }}>✕ Limpiar filtros</button>
              )}
            </div>

            <div className="modal-cards-grid">
              {filteredCards.map(card => {
                const data = getCardData(card);
                const isSocio = card.card_type === 'socio';
                const isSamePosition = data?.position === getPositionNameFromSlot(selectedSlot);
                return (
                  <div key={card.id} className={`modal-card-enhanced ${isSocio ? 'socio' : ''}`}
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(50); selectCard(card); }}>
                    <div className="card-rarity" style={{ background: getRarityColor(data?.overall_rating) }}>{data?.overall_rating}</div>
                    {isSamePosition && <div className="card-recommended">⭐ MEJOR OPCIÓN</div>}
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
                      <div className="stat-item"><span className="stat-label">NIVEL</span><span className="stat-value">⭐{card.level}</span></div>
                      <div className="stat-item"><span className="stat-label">POSICIÓN</span><span className="stat-value">{data?.position?.toUpperCase()}</span></div>
                      <div className="stat-item"><span className="stat-label">VELOCIDAD</span><span className="stat-value">⚡{data?.pace}</span></div>
                      <div className="stat-item"><span className="stat-label">GOL</span><span className="stat-value">🎯{data?.finishing}</span></div>
                      <div className="stat-item"><span className="stat-label">DEFENSA</span><span className="stat-value">🛡️{data?.defending}</span></div>
                      <div className="stat-item"><span className="stat-label">FÍSICO</span><span className="stat-value">💪{data?.physical}</span></div>
                    </div>
                    <div className="card-select-btn"><span>➕ SELECCIONAR</span></div>
                    <div className="card-shine"></div>
                  </div>
                );
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="modal-empty">
                <span>📭</span>
                <p>No hay jugadores que coincidan</p>
                <button className="clear-all-btn" onClick={() => { setFilterPosition('all'); setFilterCategory('all'); setSortBy('rating'); }}>Limpiar filtros</button>
              </div>
            )}
            <button className="modal-fab-close" onClick={() => setShowCards(false)}>✕ CERRAR</button>
          </div>
        </div>
      )}

      <style>{`
        /* ============================================================
           DECK BUILDER — ESTILOS COMPLETOS MEJORADOS
        ============================================================ */

        /* BASE */
        .deck-builder-fifa {
          background: var(--surface);
          border-radius: 24px;
          padding: 20px;
          margin: 16px 0;
          position: relative;
        }

        /* ===== ONBOARDING ===== */
        .onboarding-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(6px);
          animation: fadeIn 0.3s ease;
        }
        .onboarding-card {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 28px;
          padding: 40px 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          border: 2px solid rgba(61,255,160,0.4);
          box-shadow: 0 0 60px rgba(61,255,160,0.15);
          animation: slideUp 0.4s ease;
        }
        .onboarding-step-indicator {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .step-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: all 0.3s;
        }
        .step-dot.active { background: #3dffa0; transform: scale(1.3); }
        .step-dot.done { background: rgba(61,255,160,0.5); }
        .onboarding-icon { font-size: 64px; margin-bottom: 16px; display: block; }
        .onboarding-title { font-size: 22px; font-weight: bold; margin: 0 0 12px; color: #fff; }
        .onboarding-text { font-size: 15px; color: rgba(255,255,255,0.75); line-height: 1.6; margin-bottom: 28px; }
        .onboarding-buttons { display: flex; flex-direction: column; gap: 12px; }
        .onboarding-next {
          background: linear-gradient(90deg, #3dffa0, #2ecc71);
          color: #0a0a0f; border: none;
          padding: 14px 28px; border-radius: 40px;
          font-size: 16px; font-weight: bold; cursor: pointer;
          transition: transform 0.2s;
        }
        .onboarding-next:hover { transform: scale(1.04); }
        .onboarding-skip {
          background: none; border: none;
          color: rgba(255,255,255,0.4); font-size: 13px; cursor: pointer;
        }

        /* ===== CELEBRACIÓN ===== */
        .celebration-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 8000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
          pointer-events: none;
        }
        .celebration-card {
          background: linear-gradient(135deg, #1a3a1a, #0d2a0d);
          border-radius: 28px;
          padding: 48px 40px;
          text-align: center;
          border: 3px solid #4ade80;
          box-shadow: 0 0 80px rgba(74,222,128,0.3);
          animation: celebrationPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .celebration-emoji { font-size: 80px; display: block; margin-bottom: 16px; animation: bounce 0.5s ease infinite alternate; }
        .celebration-card h2 { font-size: 28px; color: #4ade80; margin: 0 0 8px; }
        .celebration-card p { color: rgba(255,255,255,0.7); margin: 0; }
        .confetti-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .confetti-piece {
          position: absolute;
          width: 10px; height: 10px;
          border-radius: 2px;
          animation: confettiFall 2s ease-out forwards;
          top: -20px;
        }
        .c0 { background: #ff6b6b; }
        .c1 { background: #ffd700; }
        .c2 { background: #4ade80; }
        .c3 { background: #60a5fa; }
        .c4 { background: #f472b6; }

        @keyframes confettiFall {
          to { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        @keyframes celebrationPop {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }

        /* ===== HEADER ===== */
        .fifa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 16px;
        }
        .team-info { display: flex; align-items: center; gap: 10px; }
        .team-icon { font-size: 24px; }
        .team-name { font-weight: bold; font-size: 14px; }
        .team-power { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.5); padding: 6px 16px; border-radius: 40px; }
        .power-label { font-size: 10px; text-transform: uppercase; }
        .power-value { font-size: 24px; font-weight: bold; font-family: monospace; }
        .power-bonus { font-size: 11px; color: #4ade80; }
        .help-btn {
          background: rgba(255,255,255,0.1); border: none;
          width: 36px; height: 36px; border-radius: 50%;
          font-size: 16px; cursor: pointer;
          transition: background 0.2s;
        }
        .help-btn:hover { background: rgba(255,255,255,0.2); }

        /* ===== BARRA DE PROGRESO ===== */
        .progress-bar-container {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .progress-bar-track {
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3dffa0, #2ecc71);
          border-radius: 10px;
          transition: width 0.4s ease;
        }
        .progress-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .step-circle {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          transition: all 0.3s;
        }
        .progress-step.done .step-circle {
          background: #4ade80; color: #0a0a0f;
          border-color: #4ade80;
          font-weight: bold;
        }
        .progress-step.next .step-circle {
          border-color: #ffd700;
          animation: stepPulse 1.2s ease-in-out infinite;
        }
        @keyframes stepPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255,215,0,0); }
        }
        .step-label { font-size: 9px; color: rgba(255,255,255,0.5); text-align: center; }
        .progress-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          text-align: center;
          padding: 6px 12px;
          background: rgba(255,215,0,0.08);
          border-radius: 10px;
          border: 1px solid rgba(255,215,0,0.2);
        }
        .progress-hint strong { color: #ffd700; }
        .progress-hint.complete {
          background: rgba(61,255,160,0.08);
          border-color: rgba(61,255,160,0.3);
          color: #4ade80;
        }

        /* ===== LAYOUT ===== */
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

        /* ===== CANCHA ===== */
        .futsal-pitch-fifa {
          background: linear-gradient(135deg, #1b1a6b, #0d1c45);
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
          overflow: hidden;
        }
        .pitch-background { position: absolute; top: 55%; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.4); transform: translateY(-50%); pointer-events: none; }
        .center-circle { position: absolute; top: 55%; left: 50%; width: 100px; height: 100px; border: 2px solid rgba(255,255,255,0.5); border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .corner-mark { position: absolute; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.5); pointer-events: none; }
        .corner-tl { top: 18px; left: 18px; border-right: none; border-bottom: none; }
        .corner-tr { top: 18px; right: 18px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 18px; left: 18px; border-right: none; border-top: none; }
        .corner-br { bottom: 18px; right: 18px; border-left: none; border-top: none; }
        .semicircle-area { position: absolute; bottom: 810px; left: 50%; transform: translateX(-50%); width: 260px; height: 120px; border: 2px solid rgba(255,255,220,0.8); border-top: none; border-radius: 0 0 140px 140px; }
        .goal-area { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 160px; height: 70px; border: 2px solid rgba(255,250,180,0.7); border-top: none; z-index: 9; }
        .goal-area-left, .goal-area-right { display: none; }

        /* LEYENDA QUÍMICA */
        .chem-legend {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0,0,0,0.6);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 10px;
          z-index: 10;
          white-space: nowrap;
        }
        .chem-dot {
          width: 10px; height: 10px;
          border-radius: 50%; display: inline-block;
        }
        .chem-dot.green { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
        .chem-dot.yellow { background: #facc15; box-shadow: 0 0 6px #facc15; }
        .chem-dot.red { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

        /* SLOTS */
        .pitch-slot { position: absolute; transform: translate(-50%, -50%); z-index: 1; display: flex; flex-direction: column; align-items: center; }
        .slot-1 { top: 15%; left: 50%; }
        .slot-2 { top: 43%; left: 50%; }
        .slot-3 { top: 65%; left: 18%; }
        .slot-4 { top: 65%; left: 83%; }
        .slot-5 { top: 84%; left: 50%; }
        .slot-label { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 20px; width: fit-content; margin-bottom: 8px; font-size: 11px; font-weight: bold; }
        .slot-number { background: #ffd700; color: #0a0a0f; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; }

        /* ===== CARTA FIFA ===== */
        .fifa-card {
          width: 110px; height: 150px;
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 12px; padding: 12px;
          cursor: pointer; position: relative;
          transition: all 0.2s;
          border: 2px solid transparent;
          overflow: hidden;
          box-sizing: border-box;
        }
        .fifa-card:not(.empty) { border-color: rgba(255,255,255,0.15); }
        .fifa-card:hover { transform: scale(1.06); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
        .fifa-card.empty {
          background: rgba(0,0,0,0.5);
          border: 2px dashed rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
        }

        /* Slot pulsante (próximo a llenar) */
        .pulse-slot {
          animation: slotPulse 1.5s ease-in-out infinite;
        }
        @keyframes slotPulse {
          0%, 100% { border-color: rgba(255,215,0,0.4); box-shadow: 0 0 0 0 rgba(255,215,0,0.3); }
          50% { border-color: rgba(255,215,0,0.9); box-shadow: 0 0 0 8px rgba(255,215,0,0); }
        }
        .empty-pos-icon { font-size: 28px; margin-bottom: 4px; }
        .next-indicator {
          position: absolute;
          bottom: -2px; left: 0; right: 0;
          background: #ffd700;
          color: #0a0a0f;
          font-size: 8px; font-weight: bold;
          text-align: center; padding: 2px;
          border-radius: 0 0 10px 10px;
        }

        .card-pattern { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px); pointer-events: none; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .card-position-icon { font-size: 24px; }
        .card-rating { background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 20px; font-weight: bold; font-size: 14px; color: #ffd700; }
        .card-body { text-align: center; margin: 8px 0; }
        .card-name { font-weight: bold; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-badge { margin-top: 4px; }
        .badge-level { font-size: 9px; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; }
        .card-stats { display: flex; justify-content: space-between; gap: 4px; margin-top: 8px; }
        .stat { flex: 1; text-align: center; background: rgba(0,0,0,0.4); padding: 3px; border-radius: 6px; }
        .stat-label { font-size: 7px; text-transform: uppercase; display: block; opacity: 0.7; }
        .stat-value { font-size: 11px; font-weight: bold; }
        .card-remove { position: absolute; bottom: 125px; right: 81px; background: rgba(255,77,109,0.9); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
        .card-plus { font-size: 32px; color: var(--accent); }
        .card-add-text { font-size: 10px; color: var(--text2); margin-top: 4px; }
        .card-content { display: flex; flex-direction: column; align-items: center; }

        /* ===== PANEL BONUS ===== */
        .bonus-panel-fifa { background: rgba(0,0,0,0.4); border-radius: 20px; padding: 16px; border: 1px solid var(--border); }
        .bonus-header-fifa { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid var(--accent); }
        .bonus-header-fifa h3 { margin: 0; font-size: 14px; }
        .bonus-list-fifa { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .bonus-row {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 10px; border-radius: 10px; font-size: 11px;
          cursor: pointer; position: relative;
          transition: background 0.2s;
        }
        .bonus-row:hover { background: rgba(255,255,255,0.05); }
        .bonus-row.active { background: rgba(61,255,160,0.1); }
        .bonus-check { width: 20px; flex-shrink: 0; }
        .bonus-icon { flex-shrink: 0; }
        .bonus-name { flex: 1; }
        .bonus-percent { font-weight: bold; color: #4ade80; flex-shrink: 0; }
        .bonus-pts { font-size: 9px; color: #ffd700; flex-shrink: 0; background: rgba(255,215,0,0.1); padding: 1px 5px; border-radius: 8px; }
        .bonus-help-icon { font-size: 9px; color: rgba(255,255,255,0.3); cursor: help; }
        .bonus-tooltip {
          position: absolute;
          left: 0; right: 0; bottom: calc(100% + 6px);
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 11px;
          z-index: 100;
          color: rgba(255,255,255,0.85);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          pointer-events: none;
        }
        .bonus-total-fifa { background: linear-gradient(135deg, #ffd70022, #ffd70011); border-radius: 12px; padding: 10px; text-align: center; border: 1px solid #ffd70044; }
        .total-label { font-size: 9px; text-transform: uppercase; }
        .total-value { font-size: 28px; font-weight: bold; color: #ffd700; }
        .total-pts { font-size: 11px; color: #4ade80; }
        .total-max { font-size: 8px; opacity: 0.7; }

        /* ===== BOTONES ACCIÓN ===== */
        .action-buttons-fifa { display: flex; gap: 12px; margin: 16px 0; }
        .auto-btn { flex: 1; background: rgba(156,39,176,0.2); border: 1px solid #9C27B0; border-radius: 40px; padding: 12px; font-weight: bold; color: #ce93d8; cursor: pointer; font-size: 12px; min-height: 48px; }
        .auto-btn:hover:not(:disabled) { background: rgba(156,39,176,0.35); }
        .save-btn-fifa { flex: 1; padding: 12px; border-radius: 40px; border: none; font-weight: bold; cursor: pointer; font-size: 12px; min-height: 48px; transition: all 0.2s; }
        .save-btn-fifa.ready { background: linear-gradient(90deg, var(--accent), #0f6bc0); color: white; }
        .save-btn-fifa.ready:hover { transform: scale(1.02); }
        .save-btn-fifa.disabled { background: var(--surface2); color: var(--text2); cursor: not-allowed; }
        .auto-summary { background: rgba(156,39,176,0.15); border: 1px solid rgba(156,39,176,0.3); border-radius: 12px; padding: 10px 14px; font-size: 12px; margin-bottom: 12px; color: #ce93d8; animation: fadeIn 0.3s ease; }

        /* ===== BANCO SUPLENTES ===== */
        .bench-fifa-banco { margin-top: 16px; padding: 14px; border-radius: 20px; background: linear-gradient(135deg, #141420, #0f0f1a); border: 1px solid rgba(255,255,255,0.06); width: 100%; box-sizing: border-box; }
        .bench-header-fifa-banco { display: flex; align-items: center; justify-content: space-between; font-weight: bold; font-size: 12px; margin-bottom: 12px; }
        .bench-count-banco { font-size: 10px; color: var(--text2); }
        .bench-row-fifa { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; width: 100%; }
        .bench-card-fifa-banco { width: 100%; aspect-ratio: 2/3; background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border-radius: 12px; padding: 8px; box-sizing: border-box; position: relative; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; justify-content: center; align-items: center; transition: all 0.2s ease; }
        .bench-card-fifa-banco:hover { transform: translateY(-4px) scale(1.03); border-color: var(--accent); box-shadow: 0 6px 18px rgba(0,0,0,0.3); }
        .bench-card-rating { position: absolute; top: 6px; left: 6px; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px; color: #0a0a0f; }
        .bench-card-pos-icon { font-size: 18px; margin-top: 14px; }
        .bench-card-name-banco { font-size: 9px; font-weight: bold; text-align: center; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
        .bench-card-level-banco { font-size: 8px; color: var(--text2); }
        .bench-card-position-banco { font-size: 8px; margin-top: 2px; opacity: 0.8; }

        /* ===== LÍNEAS QUÍMICA ===== */
        .chemistry-lines { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
        .chem-line { opacity: 0.9; fill: none; stroke-dasharray: 6 6; animation: chemMove 3s linear infinite; transition: all 0.3s ease; }
        @keyframes chemMove { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 20; } }
        .chem-line[stroke="#4ade80"] { filter: drop-shadow(0 0 8px #4ade80); }
        .chem-line[stroke="#facc15"] { filter: drop-shadow(0 0 8px #facc15); }
        .chem-line[stroke="#ef4444"] { filter: drop-shadow(0 0 8px #ef4444); }

        /* ===== SUGERENCIAS QUÍMICA ===== */
        .chemistry-recommendations { margin-top: 16px; padding: 14px; border-radius: 16px; background: linear-gradient(135deg, #0f172a, #020617); border: 1px solid rgba(255,255,255,0.08); }
        .chemistry-rec-title { font-weight: bold; margin-bottom: 12px; font-size: 13px; }
        .chem-rec-card { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.04); margin-bottom: 8px; gap: 8px; }
        .chem-rec-left { flex: 1; }
        .chem-rec-bonus { font-size: 18px; font-weight: bold; color: #4ade80; }
        .chem-rec-text { font-size: 11px; opacity: 0.8; line-height: 1.4; }
        .chem-rec-action { background: #22c55e; border: none; padding: 8px 12px; border-radius: 10px; font-size: 11px; cursor: pointer; font-weight: bold; white-space: nowrap; }

        /* ===== COLECCIÓN ===== */
        .bench-fifa-enhanced { background: linear-gradient(135deg, rgba(15,25,35,0.95), rgba(10,15,25,0.98)); border-radius: 24px; padding: 20px; margin-top: 24px; border: 1px solid rgba(61,255,160,0.2); backdrop-filter: blur(10px); }
        .bench-header-enhanced { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid rgba(61,255,160,0.3); }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .header-icon { font-size: 24px; }
        .header-title { font-size: 18px; font-weight: bold; }
        .header-stats { display: flex; gap: 12px; }
        .stat-badge { background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .position-tabs { display: flex; gap: 8px; margin-bottom: 20px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 60px; }
        .position-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 10px 8px; border-radius: 40px; background: transparent; border: none; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s ease; font-weight: bold; }
        .position-tab:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .position-tab.active { background: var(--tab-color); color: #0a0a0f; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .tab-icon { font-size: 16px; }
        .tab-label { font-size: 11px; font-weight: bold; }
        .tab-sublabel { font-size: 9px; opacity: 0.7; }
        .tab-count { background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 20px; font-size: 10px; }

        /* GRID COLECCIÓN */
        .cards-grid-enhanced { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; margin-bottom: 20px; max-height: 500px; overflow-y: auto; padding: 4px; }
        .cards-grid-enhanced::-webkit-scrollbar { width: 6px; }
        .cards-grid-enhanced::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .cards-grid-enhanced::-webkit-scrollbar-thumb { background: #3dffa0; border-radius: 10px; }

        .enhanced-card { background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border-radius: 16px; padding: 16px 12px; position: relative; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.2,0.64,1); border: 1px solid rgba(255,255,255,0.1); text-align: center; overflow: hidden; }
        .enhanced-card:hover { transform: translateY(-6px) scale(1.02); border-color: #3dffa0; box-shadow: 0 12px 24px rgba(0,0,0,0.4); }
        .enhanced-card.socio-card { background: linear-gradient(135deg, rgba(233,30,99,0.1), rgba(136,14,79,0.05)); border-left: 3px solid #e91e63; border-right: 3px solid #e91e63; }
        .card-rarity-badge { position: absolute; top: 10px; left: 10px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #0a0a0f; }
        .card-rarity-label { font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 28px; margin-bottom: 4px; }
        .card-type-badge { position: absolute; top: 10px; right: 10px; font-size: 10px; background: #e91e63; padding: 3px 8px; border-radius: 20px; font-weight: bold; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        .card-name-enhanced { font-size: 13px; font-weight: bold; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white; }
        .card-level-enhanced { display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 10px; font-size: 11px; color: #ffd700; }
        .card-stats-enhanced { display: flex; justify-content: center; gap: 12px; margin: 10px 0; font-size: 11px; font-weight: bold; color: rgba(255,255,255,0.8); }
        .card-action-btn { background: linear-gradient(90deg, #3dffa0, #2ecc71); padding: 8px; border-radius: 30px; font-size: 10px; font-weight: bold; color: #0a0a0f; margin-top: 8px; transition: all 0.2s; }
        .enhanced-card:hover .card-action-btn { transform: scale(1.05); box-shadow: 0 2px 8px rgba(61,255,160,0.4); }
        .card-shine-effect { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transition: left 0.5s; pointer-events: none; }
        .enhanced-card:hover .card-shine-effect { left: 100%; }
        .empty-category { grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.4); }
        .empty-category span { font-size: 48px; display: block; margin-bottom: 12px; }

        .no-cards-fifa { text-align: center; padding: 40px; }

        /* ===== FILTROS MODAL ===== */
        .modal-filters { padding: 16px 20px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .filter-section { margin-bottom: 12px; }
        .filter-section:last-child { margin-bottom: 0; }
        .filter-label { display: block; font-size: 10px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 8px; letter-spacing: 1px; }
        .filter-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
        .filter-btn { padding: 8px 14px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 12px; cursor: pointer; transition: all 0.2s; min-height: 36px; }
        .filter-btn.active { background: #3dffa0; color: #0a0a0f; border-color: #3dffa0; }
        .sort-btn { padding: 8px 14px; border-radius: 20px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); font-size: 12px; cursor: pointer; min-height: 36px; }
        .sort-btn.active { background: #3dffa0; color: #0a0a0f; }
        .modal-results-count { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: rgba(0,0,0,0.2); font-size: 11px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .clear-filters-btn { background: rgba(255,77,109,0.2); border: none; padding: 6px 14px; border-radius: 20px; color: #ff4d6d; font-size: 11px; cursor: pointer; }
        .clear-all-btn { background: #3dffa0; border: none; padding: 10px 20px; border-radius: 30px; color: #0a0a0f; font-weight: bold; margin-top: 16px; cursor: pointer; }
        .card-category { font-size: 9px; color: #ffd700; margin-top: 4px; }

        /* ===== MODAL ===== */
        .modal-enhanced { position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(12px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: modalFadeIn 0.2s ease; }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-enhanced-content { background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border-radius: 32px; max-width: 800px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(61,255,160,0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: modalSlideUp 0.3s ease; }
        @keyframes modalSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-enhanced-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .position-badge { display: flex; align-items: center; gap: 12px; padding: 8px 20px; border-radius: 60px; font-weight: bold; }
        .position-icon { font-size: 24px; }
        .position-name { font-size: 16px; letter-spacing: 1px; display: block; }
        .position-kid-desc { font-size: 11px; opacity: 0.7; font-weight: normal; }
        .modal-enhanced-close { background: rgba(255,255,255,0.1); border: none; width: 44px; height: 44px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; transition: all 0.2s; }
        .modal-enhanced-close:hover { background: rgba(255,77,109,0.8); }

        /* MODAL GRID */
        .modal-cards-grid { padding: 20px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; max-height: 60vh; }
        .modal-cards-grid::-webkit-scrollbar { width: 6px; }
        .modal-cards-grid::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .modal-cards-grid::-webkit-scrollbar-thumb { background: #3dffa0; border-radius: 10px; }
        .modal-card-enhanced { background: linear-gradient(145deg, #1a3a1a 0%, #0d2a0d 30%, #2a1a0a 70%, #1a0f05 100%); border-radius: 20px; padding: 16px; position: relative; cursor: pointer; transition: all 0.2s; border: 2px solid rgba(255,255,255,0.08); overflow: hidden; }
        .modal-card-enhanced:hover { transform: translateY(-3px); border-color: rgba(255,215,0,0.5); }
        .modal-card-enhanced.socio { background: linear-gradient(135deg, #2a1a2e, #1a0f1f); border-left: 4px solid #e91e63; }
        .card-rarity { position: absolute; top: 12px; left: 12px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #0a0a0f; z-index: 2; }
        .card-recommended { position: absolute; top: 12px; right: 12px; background: #4ade80; color: #0a0a0f; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; z-index: 2; }
        .card-position-large { text-align: center; font-size: 48px; margin: 20px 0 12px; }
        .card-info { text-align: center; margin-bottom: 16px; }
        .card-name { font-size: 14px; font-weight: bold; margin-bottom: 6px; }
        .card-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
        .stat-item { text-align: center; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 10px; }
        .stat-label { display: block; font-size: 8px; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
        .stat-value { font-size: 12px; font-weight: bold; }
        .card-select-btn { background: linear-gradient(90deg, #3dffa0, #2ecc71); padding: 10px; border-radius: 30px; text-align: center; font-size: 11px; font-weight: bold; color: #0a0a0f; transition: all 0.2s; }
        .modal-card-enhanced:hover .card-select-btn { transform: scale(1.02); box-shadow: 0 2px 12px rgba(61,255,160,0.4); }
        .card-shine { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transition: left 0.3s; pointer-events: none; }
        .modal-card-enhanced:active .card-shine { left: 100%; }
        .modal-empty { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.4); }
        .modal-empty span { font-size: 64px; display: block; margin-bottom: 16px; }
        .modal-fab-close { display: none; position: fixed; bottom: 20px; right: 20px; background: #ff4d6d; border: none; padding: 14px 24px; border-radius: 40px; color: white; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2001; }

        /* ===== UTILS ===== */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .fifa-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .cards-grid-enhanced { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
          .modal-enhanced { padding: 0; }
          .modal-enhanced-content { max-width: 100%; height: 100%; max-height: 100%; border-radius: 0; }
          .modal-cards-grid { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
          .modal-fab-close { display: block; }
          .modal-enhanced-close { display: none; }
          .tab-label { display: none; }
          .tab-sublabel { display: none; }
          .position-tab { padding: 8px 6px; }
          .bench-row-fifa { gap: 4px; }
          .bench-card-name-banco { font-size: 8px; }
          .slot-1 { top: 12%; }
          .slot-5 { top: 87%; }
        }
      `}</style>
    </div>
  );
}
