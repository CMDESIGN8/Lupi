// src/components/CardAlbum.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserCard } from '../types/cards';
import { POSITION_ICONS } from '../utils/cardGenerator';

export function CardAlbum({ userId }: { userId: string }) {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  
  const categories = ['all', '1era', '3ra', '4ta', '5ta', '6ta', '7ma', '8va', 'Promocionales'];
  
  useEffect(() => {
    loadCards();
  }, [userId]);
  
  const loadCards = async () => {
    const { data, error } = await supabase
      .from('user_cards')
      .select('*, player:players(*)')
      .eq('user_id', userId)
      .order('obtained_at', { ascending: false });
    
    if (error) console.error(error);
    else setCards(data || []);
    setLoading(false);
  };
  
  const filteredCards = selectedCategory === 'all' 
    ? cards 
    : cards.filter(c => c.player.category === selectedCategory);
  
  const categoryProgress = cards.reduce((acc, card) => {
    const cat = card.player.category;
    if (!acc[cat]) acc[cat] = new Set();
    acc[cat].add(card.player_id);
    return acc;
  }, {} as Record<string, Set<string>>);
  
  const totalPlayersPerCategory: Record<string, number> = {
    '1era': 25, '3ra': 20, '4ta': 20, '5ta': 20, '6ta': 20, '7ma': 20, '8va': 15, 'Promocionales': 10
  };
  
  return (
    <div className="card-album">
      <div className="album-header">
        <h2>📖 MI ÁLBUM</h2>
        <p>{cards.length} / 150 cartas</p>
      </div>
      
      <div className="album-progress">
        <div className="progress-bar" style={{ width: `${(cards.length / 150) * 100}%` }} />
        <span>{Math.round((cards.length / 150) * 100)}%</span>
      </div>
      
      <div className="category-progress">
        {categories.filter(c => c !== 'all').map(cat => {
          const collected = categoryProgress[cat]?.size || 0;
          const total = totalPlayersPerCategory[cat] || 0;
          return (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span className="cat-name">{cat}</span>
              <span className="cat-progress">{collected}/{total}</span>
            </button>
          );
        })}
      </div>
      
      {loading ? (
        <div className="loading-grid"><div className="spinner-lg" /></div>
      ) : (
        <div className="cards-grid">
          {filteredCards.map(card => {
            const posInfo = POSITION_ICONS[card.player.position];
            return (
              <div key={card.id} className={`card-item level-${Math.min(card.level, 5)}`} onClick={() => setSelectedCard(card)}>
                <div className="card-rating">{card.player.overall_rating}</div>
                <div className="card-position" style={{ background: posInfo?.color || '#888' }}>
                  {posInfo?.icon} {posInfo?.name}
                </div>
                <div className="card-name">{card.player.name}</div>
                <div className="card-category">{card.player.category}</div>
                <div className="card-level">⭐ Nv.{card.level}</div>
                <div className="card-stats">
                  <div className="stat" title="Velocidad">⚡{card.player.pace}</div>
                  <div className="stat" title="Regate">🪄{card.player.dribbling}</div>
                  <div className="stat" title="Definición">🎯{card.player.finishing}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {selectedCard && (
        <div className="card-modal" onClick={() => setSelectedCard(null)}>
          <div className="card-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCard(null)}>✕</button>
            <div className="modal-card-header">
              <div className="modal-rating">{selectedCard.player.overall_rating}</div>
              <div className="modal-name">{selectedCard.player.name}</div>
            </div>
            <div className="modal-stats-grid">
              <div className="stat-item"><span>⚡ Ritmo</span><strong>{selectedCard.player.pace}</strong></div>
              <div className="stat-item"><span>🪄 Regate</span><strong>{selectedCard.player.dribbling}</strong></div>
              <div className="stat-item"><span>🎯 Pase</span><strong>{selectedCard.player.passing}</strong></div>
              <div className="stat-item"><span>🎯 Definición</span><strong>{selectedCard.player.finishing}</strong></div>
              <div className="stat-item"><span>🛡️ Defensa</span><strong>{selectedCard.player.defending}</strong></div>
              <div className="stat-item"><span>💪 Físico</span><strong>{selectedCard.player.physical}</strong></div>
            </div>
            <div className="modal-footer">
              <div>Nivel {selectedCard.level}</div>
              <div>Exp: {selectedCard.experience}/{selectedCard.level * 100}</div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .card-album { padding: 16px; }
        .album-header { text-align: center; margin-bottom: 20px; }
        .album-header h2 { font-family: var(--font-display); font-size: 24px; color: var(--accent); }
        .album-progress { background: var(--surface2); border-radius: 20px; height: 24px; position: relative; overflow: hidden; margin-bottom: 20px; }
        .album-progress .progress-bar { background: linear-gradient(90deg, var(--accent), #ffd700); height: 100%; transition: width 0.3s; }
        .album-progress span { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: bold; color: #0a0a0f; }
        .category-progress { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .category-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
        .category-btn.active { background: var(--accent); color: #0a0a0f; border-color: transparent; }
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .card-item { background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; transition: transform 0.2s; border: 1px solid rgba(255,215,0,0.3); position: relative; }
        .card-item:hover { transform: translateY(-4px); }
        .card-item.level-1 { border-color: #888; }
        .card-item.level-2 { border-color: #4CAF50; }
        .card-item.level-3 { border-color: #2196F3; }
        .card-item.level-4 { border-color: #9C27B0; }
        .card-item.level-5 { border-color: #FFD700; }
        .card-rating { position: absolute; top: 8px; left: 8px; background: #ffd700; color: #0a0a0f; font-weight: bold; padding: 2px 6px; border-radius: 8px; font-size: 12px; }
        .card-position { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin-bottom: 8px; }
        .card-name { font-weight: bold; font-size: 14px; margin: 8px 0 4px; }
        .card-category { font-size: 10px; color: var(--text2); margin-bottom: 4px; }
        .card-level { font-size: 10px; margin: 4px 0; }
        .card-stats { display: flex; justify-content: space-around; font-size: 10px; margin-top: 8px; }
        .card-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .card-modal-content { background: linear-gradient(135deg, #1a1a2e, #0f0f1a); border-radius: 24px; padding: 24px; max-width: 320px; width: 90%; border: 2px solid #ffd700; position: relative; }
        .modal-close { position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--text2); font-size: 20px; cursor: pointer; }
        .modal-card-header { text-align: center; margin-bottom: 20px; }
        .modal-rating { background: #ffd700; display: inline-block; padding: 4px 12px; border-radius: 20px; color: #0a0a0f; font-weight: bold; margin-bottom: 8px; }
        .modal-name { font-family: var(--font-display); font-size: 24px; }
        .modal-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-item { display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; }
        .modal-footer { text-align: center; font-size: 12px; color: var(--text2); display: flex; justify-content: space-between; }
      `}</style>
    </div>
  );
}