// src/components/DeckBuilder.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserCard, Deck } from '../types/cards';
import { POSITION_ICONS, calculateTeamBonus } from '../utils/cardGenerator';

interface DeckBuilderProps {
  userId: string;
  userCards: UserCard[];
  activeDeck: Deck;
  onDeckUpdate: (deck: Deck) => void;
}

export function DeckBuilder({ userId, userCards, activeDeck, onDeckUpdate }: DeckBuilderProps) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localDeck, setLocalDeck] = useState<Deck>(activeDeck);

  useEffect(() => {
    setLocalDeck(activeDeck);
  }, [activeDeck]);

  // Calcular poder total del mazo
  const totalPower = localDeck.cards.reduce((sum, card) => {
    return sum + (card.player.overall_rating * (1 + (card.level - 1) * 0.05));
  }, 0);

  const teamBonus = calculateTeamBonus(localDeck.cards);
  const finalPower = Math.floor(totalPower * (1 + teamBonus.bonus / 100));

  // Guardar mazo en la base de datos
  const saveDeck = async () => {
    setSaving(true);
    try {
      // Eliminar cartas actuales del mazo
      await supabase
        .from('deck_cards')
        .delete()
        .eq('deck_id', localDeck.id);

      // Insertar nuevas cartas
      for (const card of localDeck.cards) {
        await supabase
          .from('deck_cards')
          .insert({
            deck_id: localDeck.id,
            user_card_id: card.id,
            position: card.position
          });
      }

      onDeckUpdate(localDeck);
      alert('✅ ¡Mazo guardado con éxito!');
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('❌ Error al guardar el mazo');
    } finally {
      setSaving(false);
    }
  };

  // Abrir selector de cartas para una posición
  const openCardSelector = (position: number) => {
    setSelectedPosition(position);
    setShowCardSelector(true);
  };

  // Seleccionar una carta para una posición
  const selectCard = (card: UserCard) => {
    if (!selectedPosition) return;

    const newCards = [...localDeck.cards];
    const existingIndex = newCards.findIndex(c => c.position === selectedPosition);
    
    if (existingIndex >= 0) {
      newCards[existingIndex] = { ...card, position: selectedPosition };
    } else {
      newCards.push({ ...card, position: selectedPosition });
    }

    setLocalDeck({ ...localDeck, cards: newCards });
    setShowCardSelector(false);
    setSelectedPosition(null);
  };

  // Remover carta de una posición
  const removeCard = (position: number) => {
    setLocalDeck({
      ...localDeck,
      cards: localDeck.cards.filter(c => c.position !== position)
    });
  };

  // Cartas disponibles (las que no están en el mazo)
  const availableCards = userCards.filter(
    userCard => !localDeck.cards.some(deckCard => deckCard.id === userCard.id)
  );

  return (
    <div className="deck-builder">
      <div className="deck-header">
        <h3>⚔️ MI MAZO</h3>
        <div className="deck-stats">
          <span className="deck-power">💪 Poder: {finalPower}</span>
          {teamBonus.bonus > 0 && (
            <span className="deck-bonus">✨ Bonus: +{teamBonus.bonus}%</span>
          )}
        </div>
      </div>

      <div className="deck-grid">
        {[1, 2, 3, 4, 5].map(position => {
          const card = localDeck.cards.find(c => c.position === position);
          const posInfo = card ? POSITION_ICONS[card.player.position] : null;
          
          return (
            <div
              key={position}
              className={`deck-slot ${card ? 'filled' : 'empty'}`}
              onClick={() => openCardSelector(position)}
            >
              {card ? (
                <>
                  <div className="deck-card">
                    <div className="deck-card-rarity" style={{ background: getRarityColor(card.player.overall_rating) }}>
                      {card.player.overall_rating}
                    </div>
                    <div className="deck-card-position" style={{ background: posInfo?.color }}>
                      {posInfo?.icon} {posInfo?.name}
                    </div>
                    <div className="deck-card-name">{card.player.name}</div>
                    <div className="deck-card-level">⭐ Nv.{card.level}</div>
                    <div className="deck-card-stats">
                      <span>⚡{card.player.pace}</span>
                      <span>🪄{card.player.dribbling}</span>
                      <span>🎯{card.player.finishing}</span>
                    </div>
                    <button
                      className="deck-card-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCard(position);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <div className="deck-empty-slot">
                  <span className="empty-icon">➕</span>
                  <span className="empty-text">Posición {position}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="deck-actions">
        <button
          className="btn-primary"
          onClick={saveDeck}
          disabled={saving || localDeck.cards.length !== 5}
        >
          {saving ? '💾 Guardando...' : '💾 GUARDAR MAZO'}
        </button>
        {localDeck.cards.length !== 5 && (
          <div className="deck-warning">
            ⚠️ Necesitas {5 - localDeck.cards.length} carta(s) más para completar el mazo
          </div>
        )}
      </div>

      {/* Modal selector de cartas */}
      {showCardSelector && (
        <div className="card-selector-modal" onClick={() => setShowCardSelector(false)}>
          <div className="card-selector-content" onClick={e => e.stopPropagation()}>
            <div className="card-selector-header">
              <h4>Seleccionar carta para posición {selectedPosition}</h4>
              <button className="close-btn" onClick={() => setShowCardSelector(false)}>✕</button>
            </div>
            <div className="card-selector-grid">
              {availableCards.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No tienes más cartas disponibles</p>
                  <p>Abre sobres diarios para conseguir más cartas</p>
                </div>
              ) : (
                availableCards.map(card => {
                  const posInfo = POSITION_ICONS[card.player.position];
                  return (
                    <div
                      key={card.id}
                      className="selector-card"
                      onClick={() => selectCard(card)}
                    >
                      <div className="selector-card-rating" style={{ background: getRarityColor(card.player.overall_rating) }}>
                        {card.player.overall_rating}
                      </div>
                      <div className="selector-card-position" style={{ background: posInfo?.color }}>
                        {posInfo?.icon} {posInfo?.name}
                      </div>
                      <div className="selector-card-name">{card.player.name}</div>
                      <div className="selector-card-level">Nv.{card.level}</div>
                      <div className="selector-card-stats">
                        <span>⚡{card.player.pace}</span>
                        <span>🪄{card.player.dribbling}</span>
                        <span>🎯{card.player.finishing}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .deck-builder {
          background: var(--surface);
          border-radius: 24px;
          padding: 20px;
          margin: 16px 0;
        }

        .deck-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .deck-header h3 {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--accent);
        }

        .deck-stats {
          display: flex;
          gap: 12px;
        }

        .deck-power {
          background: rgba(24, 157, 245, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
        }

        .deck-bonus {
          background: rgba(61, 255, 160, 0.1);
          color: var(--success);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
        }

        .deck-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .deck-slot {
          cursor: pointer;
          transition: transform 0.2s;
        }

        .deck-slot:hover {
          transform: translateY(-4px);
        }

        .deck-card {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 16px;
          padding: 12px;
          position: relative;
          border: 1px solid rgba(255,215,0,0.3);
          text-align: center;
        }

        .deck-card-rarity {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #ffd700;
          color: #0a0a0f;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 12px;
        }

        .deck-card-position {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          margin: 8px 0;
        }

        .deck-card-name {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .deck-card-level {
          font-size: 10px;
          color: var(--text2);
          margin-bottom: 8px;
        }

        .deck-card-stats {
          display: flex;
          justify-content: space-around;
          font-size: 11px;
        }

        .deck-card-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255,77,109,0.8);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .deck-card-remove:hover {
          background: var(--accent2);
          transform: scale(1.1);
        }

        .deck-empty-slot {
          background: rgba(255,255,255,0.03);
          border: 2px dashed var(--border);
          border-radius: 16px;
          padding: 30px 12px;
          text-align: center;
          transition: all 0.2s;
        }

        .deck-empty-slot:hover {
          border-color: var(--accent);
          background: rgba(24,157,245,0.05);
        }

        .empty-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 12px;
          color: var(--text2);
        }

        .deck-actions {
          text-align: center;
        }

        .deck-actions .btn-primary {
          width: auto;
          padding: 12px 32px;
          display: inline-flex;
        }

        .deck-warning {
          margin-top: 12px;
          font-size: 12px;
          color: var(--accent2);
        }

        /* Modal selector */
        .card-selector-modal {
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

        .card-selector-content {
          background: var(--surface);
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .card-selector-header h4 {
          font-family: var(--font-display);
          font-size: 18px;
        }

        .card-selector-grid {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          overflow-y: auto;
        }

        .selector-card {
          background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          transition: transform 0.2s;
          text-align: center;
          position: relative;
        }

        .selector-card:hover {
          transform: translateY(-4px);
          border: 1px solid var(--accent);
        }

        .selector-card-rating {
          position: absolute;
          top: 6px;
          left: 6px;
          background: #ffd700;
          color: #0a0a0f;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
        }

        .selector-card-position {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 16px;
          font-size: 10px;
          font-weight: bold;
          margin: 8px 0 4px;
        }

        .selector-card-name {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .selector-card-level {
          font-size: 9px;
          color: var(--text2);
        }

        .selector-card-stats {
          display: flex;
          justify-content: space-around;
          font-size: 9px;
          margin-top: 6px;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text2);
          font-size: 20px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function getRarityColor(ovr: number): string {
  if (ovr >= 85) return '#9B59B6';
  if (ovr >= 75) return '#FFD700';
  if (ovr >= 65) return '#C0C0C0';
  return '#CD7F32';
}