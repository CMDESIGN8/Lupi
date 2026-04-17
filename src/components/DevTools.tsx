// src/components/DevTools.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Player, UserCard } from '../types/cards';
import { generateCardStats } from '../utils/cardGenerator';

interface DevToolsProps {
  userId: string;
  onCardReceived?: (card: UserCard) => void;
}

export function DevTools({ userId, onCardReceived }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Solo mostrar en desarrollo o con click secreto
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Abrir sobre instantáneo (1 carta aleatoria)
  const openInstantPack = async () => {
    setLoading(true);
    try {
      // Obtener todos los jugadores
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*');
      
      if (playersError) throw playersError;
      if (!players || players.length === 0) {
        showMessage('❌ No hay jugadores en la base de datos', 'error');
        return;
      }

      // Obtener cartas que ya tiene el usuario
      const { data: ownedCards } = await supabase
        .from('user_cards')
        .select('player_id')
        .eq('user_id', userId);

      const ownedIds = new Set(ownedCards?.map(c => c.player_id) || []);
      
      // Filtrar jugadores que NO tiene
      const availablePlayers = players.filter(p => !ownedIds.has(p.id));
      
      let selectedPlayer: Player;
      let isNewCard = true;

      if (availablePlayers.length === 0) {
        // Si ya tiene todas, dar una carta repetida (para subir nivel)
        selectedPlayer = players[Math.floor(Math.random() * players.length)];
        isNewCard = false;
        showMessage(`📦 Álbum completo! Carta repetida de ${selectedPlayer.name}`, 'success');
      } else {
        // Dar una carta nueva
        selectedPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        showMessage(`🎉 ¡Nueva carta! ${selectedPlayer.name}`, 'success');
      }
      
      // Insertar carta
      const { data: userCard, error: insertError } = await supabase
        .from('user_cards')
        .insert({
          user_id: userId,
          player_id: selectedPlayer.id,
          level: 1,
          experience: 0
        })
        .select('*, player:players(*)')
        .single();

      if (insertError) throw insertError;

      // Si es carta repetida, dar EXP extra para subir nivel
      if (!isNewCard && userCard) {
        let newExp = (userCard.experience || 0) + 50;  // <-- usar let en lugar de const
let newLevel = userCard.level;
let leveledUp = false;
        
        while (newExp >= newLevel * 100) {
          newExp -= newLevel * 100;
          newLevel++;
          leveledUp = true;
        }
        
        await supabase
          .from('user_cards')
          .update({ level: newLevel, experience: newExp })
          .eq('id', userCard.id);
        
        if (leveledUp) {
          showMessage(`⬆️ ¡${selectedPlayer.name} subió a nivel ${newLevel}!`, 'success');
        }
      }

      if (onCardReceived) onCardReceived(userCard);
      
    } catch (error) {
      console.error('Error opening pack:', error);
      showMessage('❌ Error al abrir el sobre', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir sobre múltiple (5 cartas)
  const openMultiPack = async () => {
    setLoading(true);
    let successCount = 0;
    
    for (let i = 0; i < 5; i++) {
      try {
        const { data: players } = await supabase.from('players').select('*');
        if (!players || players.length === 0) continue;
        
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const stats = generateCardStats(randomPlayer.category); // o generateCardStats(randomPlayer.position)

        
        await supabase
          .from('user_cards')
          .insert({
            user_id: userId,
            player_id: randomPlayer.id,
            level: 1,
            experience: 0
          });
        
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
      } catch (err) {
        console.error(err);
      }
    }
    
    showMessage(`📦 ¡${successCount} cartas añadidas!`, 'success');
    setLoading(false);
    if (onCardReceived) onCardReceived({} as UserCard);
  };

  // Dar EXP masiva para subir nivel rápido
  const giveMassiveExp = async () => {
    setLoading(true);
    try {
      // Obtener todas las cartas del usuario
      const { data: userCards } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId);
      
      if (!userCards || userCards.length === 0) {
        showMessage('❌ No tienes cartas para mejorar', 'error');
        return;
      }

      let leveledUpCount = 0;
      
      for (const card of userCards) {
        let newExp = (card.experience || 0) + 200;
        let newLevel = card.level;
        let leveled = false;
        
        while (newExp >= newLevel * 100) {
          newExp -= newLevel * 100;
          newLevel++;
          leveled = true;
        }
        
        if (leveled) {
          leveledUpCount++;
          await supabase
            .from('user_cards')
            .update({ level: newLevel, experience: newExp })
            .eq('id', card.id);
        }
      }
      
      showMessage(`✨ ${leveledUpCount} cartas subieron de nivel!`, 'success');
    } catch (error) {
      console.error(error);
      showMessage('❌ Error al dar EXP', 'error');
    } finally {
      setLoading(false);
      if (onCardReceived) onCardReceived({} as UserCard);
    }
  };

  // Resetear progreso (peligroso, solo para pruebas)
  const resetProgress = async () => {
    if (!confirm('⚠️ ¿ESTÁS SEGURO? Esto eliminará TODAS tus cartas y progreso. Esta acción NO se puede deshacer.')) return;
    
    setLoading(true);
    try {
      // Eliminar cartas del mazo
      const { data: decks } = await supabase
        .from('decks')
        .select('id')
        .eq('user_id', userId);
      
      if (decks && decks.length > 0) {
        for (const deck of decks) {
          await supabase.from('deck_cards').delete().eq('deck_id', deck.id);
        }
        await supabase.from('decks').delete().eq('user_id', userId);
      }
      
      // Eliminar cartas del usuario
      await supabase.from('user_cards').delete().eq('user_id', userId);
      
      // Resetear estadísticas del perfil
      await supabase
        .from('profiles')
        .update({
          total_tickets_lifetime: 0,
          total_battles_lifetime: 0,
          total_wins_lifetime: 0,
          total_shares_lifetime: 0,
          total_referrals_lifetime: 0,
          total_daily_cards: 0
        })
        .eq('id', userId);
      
      showMessage('🗑️ Progreso resetado correctamente', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error(error);
      showMessage('❌ Error al resetear progreso', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Botón flotante para abrir panel
  if (!isOpen) {
    return (
      <>
        <button
          className="dev-fab"
          onClick={() => setIsOpen(true)}
          title="Herramientas de desarrollo (solo pruebas)"
        >
          🛠️
        </button>
        <style>{`
          .dev-fab {
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6c5ce7, #4834d4);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: transform 0.2s;
          }
          .dev-fab:hover {
            transform: scale(1.1);
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <h3>🛠️ Panel de Desarrollo</h3>
        <button className="dev-close" onClick={() => setIsOpen(false)}>✕</button>
      </div>
      
      <div className="dev-panel-body">
        {message && (
          <div className={`dev-message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="dev-section">
          <h4>📦 Sobres</h4>
          <button onClick={openInstantPack} disabled={loading} className="dev-btn instant">
            🎴 Abrir Sobre (1 carta)
          </button>
          <button onClick={openMultiPack} disabled={loading} className="dev-btn multi">
            📦 Abrir Sobre Múltiple (5 cartas)
          </button>
        </div>
        
        <div className="dev-section">
          <h4>✨ Mejoras</h4>
          <button onClick={giveMassiveExp} disabled={loading} className="dev-btn exp">
            ⭐ Dar +200 EXP a todas las cartas
          </button>
        </div>
        
        <div className="dev-section">
          <h4>⚠️ Peligroso</h4>
          <button onClick={resetProgress} disabled={loading} className="dev-btn danger">
            🗑️ Resetear Progreso (Todas las cartas)
          </button>
        </div>
        
        <div className="dev-note">
          ℹ️ Estas herramientas son solo para pruebas. Los usuarios normales no ven este panel.
        </div>
      </div>
      
      <style>{`
        .dev-panel {
          position: fixed;
          bottom: 140px;
          right: 16px;
          width: 280px;
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 10000;
          overflow: hidden;
        }
        
        .dev-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #6c5ce7, #4834d4);
          color: white;
        }
        
        .dev-panel-header h3 {
          margin: 0;
          font-size: 14px;
        }
        
        .dev-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
        }
        
        .dev-panel-body {
          padding: 16px;
        }
        
        .dev-section {
          margin-bottom: 16px;
        }
        
        .dev-section h4 {
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 8px;
        }
        
        .dev-btn {
          width: 100%;
          padding: 10px;
          margin-bottom: 8px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .dev-btn.instant {
          background: linear-gradient(135deg, #ffd700, #ff8c00);
          color: #0a0a0f;
        }
        
        .dev-btn.multi {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: white;
        }
        
        .dev-btn.exp {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .dev-btn.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
        
        .dev-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .dev-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        .dev-message {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 12px;
          text-align: center;
        }
        
        .dev-message.success {
          background: rgba(61, 255, 160, 0.1);
          border: 1px solid var(--success);
          color: var(--success);
        }
        
        .dev-message.error {
          background: rgba(255, 77, 109, 0.1);
          border: 1px solid var(--accent2);
          color: var(--accent2);
        }
        
        .dev-note {
          font-size: 10px;
          color: var(--text2);
          text-align: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
