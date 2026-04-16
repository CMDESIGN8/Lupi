/**
 * CardsTab.tsx
 * Tab principal del sistema de cartas de Flores Futsal.
 * Incluye: Mi Carta, Caja Misteriosa, Álbum y Juego.
 *
 * INSTALACIÓN:
 *   1. Copiá este archivo a src/components/CardsTab.tsx
 *   2. En App.tsx agregá la tab "cards" al sistema de navegación (ver abajo)
 *
 * INTEGRACIÓN EN App.tsx:
 *   // Agregar al tipo Tab:
 *   type Tab = "home" | "ticket" | "ranking" | "profile" | "cards";
 *
 *   // Agregar al render:
 *   {tab === "cards" && <CardsTab user={user} />}
 *
 *   // Agregar al nav:
 *   { id: "cards", icon: "🃏", label: "Cartas" }
 */

import { useState, useEffect, useCallback } from "react";
import { AppUser } from "../lib/api";
import {
  cardApi,
  PlayerCard,
  UserCard,
  MatchResult,
  MatchEvent,
  calcOVR,
} from "../lib/api";
import { FifaCard } from "./FifaCard";
import { MysteryBox } from "./MysteryBox";

// ── CSS ──────────────────────────────────────────────────────
const CARDS_CSS = `
/* Sub-tabs */
.ct-tabs {
  display: flex;
  background: var(--surface2);
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 20px;
  gap: 4px;
}

.ct-tab {
  flex: 1;
  padding: 10px 4px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text2);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.ct-tab.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Album grid */
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

/* Filter chips */
.filter-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.filter-chips::-webkit-scrollbar { display: none; }

.filter-chip {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text2);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip.active {
  background: var(--accent);
  color: #0a0a0f;
  border-color: var(--accent);
}

/* My card section */
.my-card-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
}

.my-card-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.my-stat-chip {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

.my-stat-val {
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 1px;
  line-height: 1;
  margin-bottom: 3px;
}

.my-stat-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text2);
}

/* Match simulation */
.match-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 16px;
}

.match-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.match-scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-family: var(--font-display);
  font-size: 48px;
  letter-spacing: 2px;
  margin: 8px 0;
}

.match-team-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text2);
}

.match-vs {
  font-size: 20px;
  color: var(--text2);
}

.match-events {
  padding: 16px 20px;
  max-height: 240px;
  overflow-y: auto;
}

.match-event {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(42,42,58,0.4);
  font-size: 13px;
  animation: slide-in 0.3s ease;
}

.match-event:last-child {
  border-bottom: none;
}

@keyframes slide-in {
  from { transform: translateX(-10px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

.match-minute {
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  min-width: 28px;
}

.match-event-icon {
  font-size: 18px;
  min-width: 24px;
}

.match-result-banner {
  padding: 20px;
  text-align: center;
  border-top: 1px solid var(--border);
}

.match-result-win {
  color: var(--success);
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: 2px;
}

.match-result-lose {
  color: var(--text2);
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: 2px;
}

/* Deck selector */
.deck-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.deck-slot {
  aspect-ratio: 5/7;
  border: 1.5px dashed var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--surface2);
}

.deck-slot:hover {
  border-color: var(--accent);
  background: rgba(24,157,245,0.06);
}

.deck-slot.filled {
  border-style: solid;
  border-color: var(--border);
  padding: 0;
  overflow: hidden;
}

/* Stat gain toast */
@keyframes stat-toast-in {
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.stat-gain-toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5000;
  background: var(--surface);
  border: 1px solid var(--success);
  border-radius: 100px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  color: var(--success);
  white-space: nowrap;
  animation: stat-toast-in 0.3s ease;
  box-shadow: 0 4px 20px rgba(61,255,160,0.2);
}
`;

// ── Tipos ────────────────────────────────────────────────────
type SubTab = 'mi-carta' | 'caja' | 'album' | 'juego';

interface CardsTabProps {
  user: AppUser & {
    user_card_level?: number;
    user_card_exp?: number;
    user_card_rarity?: string;
    user_card_pace?: number;
    user_card_dribbling?: number;
    user_card_passing?: number;
    user_card_defending?: number;
    user_card_finishing?: number;
    user_card_physical?: number;
    total_daily_cards?: number;
    total_battles_lifetime?: number;
    total_wins_lifetime?: number;
  };
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  save: '🧤',
  miss: '💨',
};

// ── Componente principal ──────────────────────────────────────
export function CardsTab({ user }: CardsTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('caja');
  const [myCard, setMyCard] = useState<PlayerCard | null>(null);
  const [collection, setCollection] = useState<UserCard[]>([]);
  const [albumProgress, setAlbumProgress] = useState({ owned: 0, total: 150 });
  const [allPlayers, setAllPlayers] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Deck & match state
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [deckCards, setDeckCards] = useState<UserCard[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState<MatchEvent[]>([]);
  const [statGainMsg, setStatGainMsg] = useState('');

  // Album filter
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      cardApi.getMyCard(user.id),
      cardApi.getMyCollection(user.id),
      cardApi.getAlbumProgress(user.id),
      cardApi.getActiveDeck(user.id),
    ]).then(([card, col, prog, deck]) => {
      setMyCard(card);
      setCollection(col);
      setAlbumProgress(prog);
      setActiveDeckId(deck.deck_id);
      setDeckCards(deck.cards);
      setLoading(false);
    });
  }, [user.id]);

  // Cargar todos los jugadores cuando se entra al álbum
  useEffect(() => {
    if (subTab === 'album' && allPlayers.length === 0) {
      cardApi.getAllPlayers().then(setAllPlayers);
    }
  }, [subTab, allPlayers.length]);

  // Animar eventos del partido uno a uno
  useEffect(() => {
    if (!matchResult) return;
    setVisibleEvents([]);
    matchResult.events.forEach((evt, i) => {
      setTimeout(() => {
        setVisibleEvents(prev => [...prev, evt]);
      }, i * 400 + 300);
    });
    // Si ganó, mostrar toast de mejora de stats
    if (matchResult.won) {
      setTimeout(() => {
        setStatGainMsg('⬆ Tus stats mejoraron por ganar!');
        setTimeout(() => setStatGainMsg(''), 3000);
      }, matchResult.events.length * 400 + 800);
    }
  }, [matchResult]);

  const handleCardObtained = useCallback((card: PlayerCard) => {
    setAlbumProgress(prev => ({ ...prev, owned: prev.owned + 1 }));
    // Refrescar colección
    cardApi.getMyCollection(user.id).then(setCollection);
  }, [user.id]);

  const handleSimulateMatch = async () => {
    if (!activeDeckId || matchLoading) return;
    setMatchLoading(true);
    setMatchResult(null);
    try {
      const result = await cardApi.simulateMatch(user.id, activeDeckId, 'bot');
      setMatchResult(result);
      // Refrescar mi carta (stats pueden haber subido)
      if (result.won) {
        cardApi.getMyCard(user.id).then(setMyCard);
      }
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setMatchLoading(false);
    }
  };

  // Construir mi carta desde los datos del user si no se cargó aún
  const displayCard: PlayerCard | null = myCard ?? (user.user_card_pace ? {
    id: user.id,
    name: user.username,
    position: 'pivot',
    category: 'Jugador',
    photo_url: null,
    overall_rating: calcOVR({
      pace:      user.user_card_pace ?? 40,
      dribbling: user.user_card_dribbling ?? 40,
      passing:   user.user_card_passing ?? 40,
      defending: user.user_card_defending ?? 40,
      finishing: user.user_card_finishing ?? 40,
      physical:  user.user_card_physical ?? 40,
    }),
    pace:      user.user_card_pace ?? 40,
    dribbling: user.user_card_dribbling ?? 40,
    passing:   user.user_card_passing ?? 40,
    defending: user.user_card_defending ?? 40,
    finishing: user.user_card_finishing ?? 40,
    physical:  user.user_card_physical ?? 40,
    rarity:    (user.user_card_rarity as PlayerCard['rarity']) ?? 'bronze',
  } : null);

  // Filtrar álbum
  const ownedIds = new Set(collection.map(uc => uc.player.id));
  const filteredPlayers = allPlayers.filter(p =>
    rarityFilter === 'all' || p.rarity === rarityFilter
  );

  if (loading) {
    return (
      <div className="main-content">
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div className="spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CARDS_CSS}</style>

      {statGainMsg && (
        <div className="stat-gain-toast">{statGainMsg}</div>
      )}

      <div className="main-content">
        <div className="container">

          {/* Sub-tabs */}
          <div className="ct-tabs">
            {([
              { id: 'mi-carta', label: '🃏 Mi carta' },
              { id: 'caja',     label: '🎁 Caja'     },
              { id: 'album',    label: '📚 Álbum'    },
              { id: 'juego',    label: '⚽ Jugar'    },
            ] as { id: SubTab; label: string }[]).map(t => (
              <button
                key={t.id}
                className={`ct-tab${subTab === t.id ? ' active' : ''}`}
                onClick={() => setSubTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── MI CARTA ── */}
          {subTab === 'mi-carta' && (
            <div className="my-card-section">
              {displayCard ? (
                <>
                  <FifaCard card={displayCard} size="lg" showFlip />

                  <div style={{ width: '100%' }}>
                    <div className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                      📊 Tus atributos
                    </div>
                    <div className="my-card-stats-grid">
                      {[
                        { label: 'Ritmo',   val: displayCard.pace      },
                        { label: 'Regate',  val: displayCard.dribbling },
                        { label: 'Pase',    val: displayCard.passing   },
                        { label: 'Defensa', val: displayCard.defending },
                        { label: 'Tiro',    val: displayCard.finishing },
                        { label: 'Físico',  val: displayCard.physical  },
                      ].map(({ label, val }) => (
                        <div key={label} className="my-stat-chip">
                          <div className="my-stat-val" style={{
                            color: val >= 75 ? 'var(--accent)' : val >= 65 ? 'var(--text)' : 'var(--text2)',
                          }}>
                            {val}
                          </div>
                          <div className="my-stat-lbl">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    fontSize: 13,
                    color: 'var(--text2)',
                    lineHeight: 1.7,
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                      💡 ¿Cómo mejorar tu carta?
                    </div>
                    Ganando partidos en la sección <strong style={{ color: 'var(--accent)' }}>Jugar</strong> tus stats suben de a poco. Al superar OVR 65 tu carta pasa a Plata, 75 a Oro y 85 a Especial.
                  </div>

                  <div className="stats-grid" style={{ width: '100%' }}>
                    <div className="stat-card">
                      <div className="stat-number">{user.total_battles_lifetime ?? 0}</div>
                      <div className="stat-label">Partidos</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{user.total_wins_lifetime ?? 0}</div>
                      <div className="stat-label">Victorias</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>
                  Cargando tu carta...
                </div>
              )}
            </div>
          )}

          {/* ── CAJA MISTERIOSA ── */}
          {subTab === 'caja' && (
            <MysteryBox
              userId={user.id}
              albumProgress={albumProgress}
              onCardObtained={handleCardObtained}
            />
          )}

          {/* ── ÁLBUM ── */}
          {subTab === 'album' && (
            <>
              {/* Progreso */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 1 }}>
                    📚 Mi álbum
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)' }}>
                    {albumProgress.owned}/{albumProgress.total}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(albumProgress.owned / albumProgress.total) * 100}%`,

                    background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                    borderRadius: 100,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6, fontWeight: 700, letterSpacing: 0.5 }}>
                  {Math.round((albumProgress.owned / albumProgress.total) * 100)}% completado

                </div>
              </div>

              {/* Filtros por rareza */}
              <div className="filter-chips">
                {[
                  { id: 'all',     label: 'Todos' },
                  { id: 'special', label: '🟣 Especial' },
                  { id: 'gold',    label: '🟡 Oro' },
                  { id: 'silver',  label: '⚪ Plata' },
                  { id: 'bronze',  label: '🟤 Bronce' },
                ].map(f => (
                  <button
                    key={f.id}
                    className={`filter-chip${rarityFilter === f.id ? ' active' : ''}`}
                    onClick={() => setRarityFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {allPlayers.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>
                  Cargando jugadores...
                </div>
              ) : (
                <div className="album-grid">
                  {filteredPlayers.map(player => {
                    const owned = ownedIds.has(player.id);
                    return (
                      <div key={player.id} style={{ display: 'flex', justifyContent: 'center' }}>
                        <FifaCard
                          card={player}
                          size="sm"
                          locked={!owned}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── JUEGO ── */}
          {subTab === 'juego' && (
            <>
              {/* Mi equipo (mazo) */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '20px',
                marginBottom: 16,
              }}>
                <div className="section-title" style={{ fontSize: 18 }}>
                  ⚔️ Mi equipo (5 cartas)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
                  Las cartas de tu colección que van a jugar el partido.
                </div>

                {/* 5 slots del mazo */}
                <div className="deck-grid">
                  {Array.from({ length: 5 }, (_, i) => {
                    const card = deckCards[i];
                    return (
                      <div key={i} className={`deck-slot${card ? ' filled' : ''}`}>
                        {card ? (
                          <FifaCard card={card.player} size="sm" />
                        ) : (
                          <span style={{ color: 'var(--text2)', fontSize: 20 }}>+</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Cartas disponibles para agregar */}
                {deckCards.length < 5 && collection.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Tus cartas disponibles
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {collection
                        .filter(uc => !deckCards.some(dc => dc.id === uc.id))
                        .slice(0, 10)
                        .map(uc => (
                          <div
                            key={uc.id}
                            style={{ flexShrink: 0, cursor: 'pointer' }}
                            onClick={async () => {
                              const nextPos = deckCards.length + 1;
                              if (nextPos > 5) return;
                              try {
                                await cardApi.updateDeckCard(activeDeckId, nextPos, uc.id);
                                setDeckCards(prev => [...prev, uc]);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            <FifaCard card={uc.player} size="sm" />
                          </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
                      Tocá una carta para agregarla al equipo
                    </div>
                  </div>
                )}

                {collection.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', padding: '10px 0' }}>
                    Primero conseguí cartas desde la Caja Misteriosa 🎁
                  </div>
                )}
              </div>

              {/* Botón jugar */}
              <button
                className="btn btn-primary"
                onClick={handleSimulateMatch}
                disabled={matchLoading || deckCards.length === 0}
                style={{ marginBottom: 16 }}
              >
                {matchLoading ? 'Simulando partido...' : deckCards.length === 0 ? 'Necesitás cartas para jugar' : '▶ Simular partido vs Bot'}
              </button>

              {/* Resultado del partido */}
              {matchResult && (
                <div className="match-container">
                  {/* Scoreboard */}
                  <div className="match-header">
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 8 }}>
                      <div className="match-team-label">{user.username}</div>
                      <div className="match-team-label">BOT</div>
                    </div>
                    <div className="match-scoreboard">
                      <span style={{ color: matchResult.won ? 'var(--success)' : 'var(--text)' }}>
                        {matchResult.user_score}
                      </span>
                      <span className="match-vs">—</span>
                      <span style={{ color: !matchResult.won ? 'var(--accent2)' : 'var(--text)' }}>
                        {matchResult.opponent_score}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700 }}>
                      +{matchResult.experience_gained} EXP
                    </div>
                  </div>

                  {/* Eventos */}
                  <div className="match-events">
                    {visibleEvents.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                        Recreando el partido...
                      </div>
                    )}
                    {visibleEvents.map((evt, i) => (
                      <div key={i} className="match-event">
                        <span className="match-minute">{evt.minute}'</span>
                        <span className="match-event-icon">{EVENT_ICONS[evt.type] ?? '⚽'}</span>
                        <span style={{
                          fontSize: 13,
                          color: evt.team === 'user' ? 'var(--text)' : 'var(--text2)',
                          fontWeight: evt.type === 'goal' ? 700 : 400,
                        }}>
                          {evt.description}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Banner resultado */}
                  {visibleEvents.length === matchResult.events.length && (
                    <div className="match-result-banner">
                      <div className={matchResult.won ? 'match-result-win' : 'match-result-lose'}>
                        {matchResult.won ? '🏆 VICTORIA' : matchResult.user_score === matchResult.opponent_score ? '🤝 EMPATE' : '💪 DERROTA'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
                        {matchResult.won
                          ? 'Tus stats mejoraron. ¡Seguí ganando!'
                          : 'Mejorar tu mazo te dará más chances.'}
                      </div>
                      <button
                        className="btn btn-ghost"
                        onClick={() => { setMatchResult(null); setVisibleEvents([]); }}
                        style={{ marginTop: 12 }}
                      >
                        Jugar de nuevo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Info partidos */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 20px',
                fontSize: 13,
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  ⚽ Sistema de simulación
                </div>
                El partido es un futsal de 20 minutos. El OVR promedio de tu equipo versus el del bot determina las probabilidades de gol. Ganando partidos tu propia carta mejora sus stats de a poco.
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default CardsTab;
