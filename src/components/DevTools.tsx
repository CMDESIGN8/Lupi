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

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // ==================== SOBRES ====================
  
  // Abrir sobre instantáneo (1 carta aleatoria) - CORREGIDO
  const openInstantPack = async () => {
  setLoading(true);
  try {
    // Obtener NPCs
    const { data: npcs, error: npcsError } = await supabase
      .from('players')
      .select('*')
      .eq('can_be_replaced', true)
      .eq('is_replaced', false);
    
    if (npcsError) throw npcsError;
    
    // Obtener Socios (perfiles activos)
    const { data: socios, error: sociosError } = await supabase
      .from('profiles')
      .select('id, username, position, category');
    
    if (sociosError) throw sociosError;
    
    // Unificar ambos arrays
    const allCards = [
      ...(npcs || []).map(npc => ({ 
        ...npc, 
        source_type: 'npc',
        npc_id: npc.id,
        socio_id: null,
        name: npc.name 
      })),
      ...(socios || []).map(socio => ({ 
        id: socio.id,
        npc_id: null,
        socio_id: socio.id,
        name: socio.username,
        position: socio.position || 'ala',
        category: socio.category || 'socios',
        source_type: 'socio'
      }))
    ];
    
    if (allCards.length === 0) {
      showMessage('❌ No hay jugadores ni socios disponibles', 'error');
      return;
    }

    // Obtener cartas que ya tiene el usuario
    const { data: ownedCards } = await supabase
      .from('user_cards')
      .select('player_id, socio_id, card_type')
      .eq('user_id', userId);

    const ownedIds = new Set();
    ownedCards?.forEach(card => {
      if (card.card_type === 'npc' && card.player_id) {
        ownedIds.add(`npc:${card.player_id}`);
      } else if (card.card_type === 'socio' && card.socio_id) {
        ownedIds.add(`socio:${card.socio_id}`);
      }
    });
    
    // Filtrar jugadores que NO tiene
    const availableCards = allCards.filter(c => 
      !ownedIds.has(`${c.source_type}:${c.source_type === 'npc' ? c.npc_id : c.socio_id}`)
    );
    
    let selectedCard;
    let isNewCard = true;

    if (availableCards.length === 0) {
      selectedCard = allCards[Math.floor(Math.random() * allCards.length)];
      isNewCard = false;
      showMessage(`📦 Álbum completo! Carta repetida de ${selectedCard.name}`, 'success');
    } else {
      selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      showMessage(`🎉 ¡Nueva carta! ${selectedCard.name}`, 'success');
    }
    
    // Insertar carta usando la columna correcta según el tipo
    const insertData: any = {
      user_id: userId,
      card_type: selectedCard.source_type,
      level: 1,
      experience: 0
    };
    
    if (selectedCard.source_type === 'npc') {
      insertData.player_id = selectedCard.npc_id;
      insertData.socio_id = null;
    } else {
      insertData.player_id = null;
      insertData.socio_id = selectedCard.socio_id;
    }
    
    const { data: userCard, error: insertError } = await supabase
      .from('user_cards')
      .insert(insertData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Subir nivel si es repetida
    if (!isNewCard && userCard) {
      let newExp = (userCard.experience || 0) + 50;
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
        showMessage(`⬆️ ¡${selectedCard.name} subió a nivel ${newLevel}!`, 'success');
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

  // Abrir sobre múltiple (5 cartas) - CORREGIDO
  // Abrir sobre múltiple (5 cartas)
const openMultiPack = async () => {
  setLoading(true);
  let successCount = 0;
  
  for (let i = 0; i < 5; i++) {
    try {
      // Obtener NPCs y socios
      const { data: npcs } = await supabase
        .from('players')
        .select('id, name')
        .eq('can_be_replaced', true)
        .eq('is_replaced', false);
      
      const { data: socios } = await supabase
        .from('profiles')
        .select('id, username');
      
      const allCards = [
        ...(npcs || []).map(npc => ({ 
          source_type: 'npc',
          player_id: npc.id,
          socio_id: null,
          name: npc.name 
        })),
        ...(socios || []).map(socio => ({ 
          source_type: 'socio',
          player_id: null,
          socio_id: socio.id,
          name: socio.username 
        }))
      ];
      
      if (allCards.length === 0) continue;
      
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      
      const insertData: any = {
        user_id: userId,
        card_type: randomCard.source_type,
        level: 1,
        experience: 0
      };
      
      if (randomCard.source_type === 'npc') {
        insertData.player_id = randomCard.player_id;
        insertData.socio_id = null;
      } else {
        insertData.player_id = null;
        insertData.socio_id = randomCard.socio_id;
      }
      
      await supabase.from('user_cards').insert(insertData);
      
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(err);
    }
  }
  
  showMessage(`📦 ¡${successCount} cartas añadidas!`, 'success');
  setLoading(false);
  if (onCardReceived) onCardReceived({} as UserCard);
};

// Completar TODO el álbum
const completeAlbum = async () => {
  if (!confirm('⚠️ ¿Estás seguro? Esto te dará TODAS las cartas disponibles (NPCs + Socios).')) return;
  
  setLoading(true);
  try {
    // Obtener NPCs
    const { data: npcs, error: npcsError } = await supabase
      .from('players')
      .select('id, name')
      .eq('can_be_replaced', true)
      .eq('is_replaced', false);
    
    if (npcsError) throw npcsError;
    
    // Obtener Socios
    const { data: socios, error: sociosError } = await supabase
      .from('profiles')
      .select('id, username');
    
    if (sociosError) throw sociosError;
    
    // Obtener cartas existentes
    const { data: existingCards } = await supabase
      .from('user_cards')
      .select('player_id, socio_id, card_type')
      .eq('user_id', userId);
    
    const existingKeySet = new Set();
    existingCards?.forEach(card => {
      if (card.card_type === 'npc' && card.player_id) {
        existingKeySet.add(`npc:${card.player_id}`);
      } else if (card.card_type === 'socio' && card.socio_id) {
        existingKeySet.add(`socio:${card.socio_id}`);
      }
    });
    
    // Preparar nuevas cartas
    const newCards = [];
    
    for (const npc of (npcs || [])) {
      const key = `npc:${npc.id}`;
      if (!existingKeySet.has(key)) {
        newCards.push({
          user_id: userId,
          player_id: npc.id,
          socio_id: null,
          card_type: 'npc',
          level: 1,
          experience: 0
        });
      }
    }
    
    for (const socio of (socios || [])) {
      const key = `socio:${socio.id}`;
      if (!existingKeySet.has(key)) {
        newCards.push({
          user_id: userId,
          player_id: null,
          socio_id: socio.id,
          card_type: 'socio',
          level: 1,
          experience: 0
        });
      }
    }
    
    if (newCards.length === 0) {
      showMessage('✨ ¡Ya tienes todas las cartas disponibles!', 'success');
      setLoading(false);
      return;
    }
    
    // Insertar en batches
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < newCards.length; i += BATCH_SIZE) {
      const batch = newCards.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert(batch);
      
      if (insertError) throw insertError;
      insertedCount += batch.length;
      showMessage(`📦 Generando... ${insertedCount}/${newCards.length}`, 'success');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    showMessage(`✅ ¡Álbum completado! Se añadieron ${insertedCount} cartas nuevas`, 'success');
    if (onCardReceived) onCardReceived({} as UserCard);
    setTimeout(() => window.location.reload(), 1500);
    
  } catch (error) {
    console.error('Error completing album:', error);
    showMessage('❌ Error al completar el álbum', 'error');
  } finally {
    setLoading(false);
  }
};

// Solo cartas de socios
const completeSociosCards = async () => {
  if (!confirm('⚠️ Esto te dará TODAS las cartas de SOCIOS disponibles. ¿Continuar?')) return;
  
  setLoading(true);
  try {
    // Obtener socios
    const { data: socios, error: sociosError } = await supabase
      .from('profiles')
      .select('id, username');
    
    if (sociosError) throw sociosError;
    
    // Obtener cartas de socios que ya tiene
    const { data: existingSocioCards } = await supabase
      .from('user_cards')
      .select('socio_id')
      .eq('user_id', userId)
      .eq('card_type', 'socio');
    
    const existingIds = new Set(existingSocioCards?.map(c => c.socio_id) || []);
    const newSocios = (socios || []).filter(s => !existingIds.has(s.id));
    
    if (newSocios.length === 0) {
      showMessage('✨ ¡Ya tienes todos los socios!', 'success');
      setLoading(false);
      return;
    }
    
    // Insertar en batches
    const newCards = newSocios.map(socio => ({
      user_id: userId,
      player_id: null,
      socio_id: socio.id,
      card_type: 'socio',
      level: 1,
      experience: 0
    }));
    
    for (let i = 0; i < newCards.length; i += 50) {
      const batch = newCards.slice(i, i + 50);
      const { error } = await supabase.from('user_cards').insert(batch);
      if (error) throw error;
    }
    
    showMessage(`✅ Se añadieron ${newSocios.length} cartas de socios`, 'success');
    if (onCardReceived) onCardReceived({} as UserCard);
    
  } catch (error) {
    console.error(error);
    showMessage('❌ Error al generar cartas de socios', 'error');
  } finally {
    setLoading(false);
  }
};

  // ==================== ÁLBUM COMPLETO ====================
  

  // Resetear y regenerar - NUEVO
  const resetAndRegenerate = async () => {
    if (!confirm('⚠️⚠️⚠️ ¡PELIGRO! Esto ELIMINARÁ todas tus cartas y luego te dará TODAS disponibles. ¿Estás 100% seguro?')) return;
    
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      await completeAlbum();
      showMessage('🔄 Álbum regenerado completamente', 'success');
      
    } catch (error) {
      console.error(error);
      showMessage('❌ Error en regeneración', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== MEJORAS ====================
  
  // Dar EXP masiva
  const giveMassiveExp = async () => {
    setLoading(true);
    try {
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

  // ==================== PELIGROSO ====================
  
  // Resetear progreso
  const resetProgress = async () => {
    if (!confirm('⚠️ ¿ESTÁS SEGURO? Esto eliminará TODAS tus cartas y progreso.')) return;
    
    setLoading(true);
    try {
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
      
      await supabase.from('user_cards').delete().eq('user_id', userId);
      
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

  // ==================== UI ====================
  
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
          <h4>🏆 Álbum Completo</h4>
          <button onClick={completeAlbum} disabled={loading} className="dev-btn complete">
            📖 Completar Todo el Álbum
          </button>
          <button onClick={completeSociosCards} disabled={loading} className="dev-btn socios">
            👥 Solo Cartas de Socios
          </button>
          <button onClick={resetAndRegenerate} disabled={loading} className="dev-btn danger">
            🔄 Resetear y Regenerar
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
            🗑️ Resetear Progreso
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
        
        .dev-btn.complete {
          background: linear-gradient(135deg, #fbbf24, #d97706);
          color: #0a0a0f;
          font-weight: bold;
        }
        
        .dev-btn.socios {
          background: linear-gradient(135deg, #ec4899, #be185d);
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