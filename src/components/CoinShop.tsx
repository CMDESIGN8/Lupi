// src/components/CoinShop.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { designTokens } from '../styles/designTokens';

interface CoinShopProps {
  userId: string;
  coins: number;
  onPurchase: (cost: number, reward: string) => void;
  onCoinsUpdate: (newCoins: number) => void;
}

const SHOP_ITEMS = [
  { 
    id: 'refresh_challenges', 
    name: 'Renovar Desafíos', 
    icon: '🔄', 
    cost: 50, 
    reward: 'Desafíos frescos',
    description: 'Reiniciá tus desafíos diarios y ganá más XP',
    popular: true,
  },
  { 
    id: 'basic_pack', 
    name: 'Sobre Básico', 
    icon: '📦', 
    cost: 100, 
    reward: '1 carta aleatoria',
    description: 'Obtené una carta nueva para tu colección',
    popular: false,
  },
  { 
    id: 'xp_boost', 
    name: 'Poción de XP', 
    icon: '🧪', 
    cost: 75, 
    reward: '+50% XP próximo partido',
    description: 'Doblé tu ganancia de experiencia en el próximo partido',
    popular: true,
  },
  { 
    id: 'energy_drink', 
    name: 'Energía Extra', 
    icon: '⚡', 
    cost: 30, 
    reward: 'Jugás un partido extra',
    description: 'Recuperá una oportunidad de jugar',
    popular: false,
  },
];

export function CoinShop({ userId, coins, onPurchase, onCoinsUpdate }: CoinShopProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const handlePurchase = async (item: typeof SHOP_ITEMS[0]) => {
    if (coins < item.cost) return;
    
    setPurchasing(item.id);
    
    try {
      // Actualizar monedas en DB
      const newCoins = coins - item.cost;
      const { error } = await supabase
        .from('user_stats')
        .update({ coins: newCoins })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      onCoinsUpdate(newCoins);
      onPurchase(item.cost, item.reward);
      setShowSuccess(item.id);
      
      // Animación de vibración
      if ('vibrate' in navigator) {
        navigator.vibrate?.(100);
      }
      
      setTimeout(() => setShowSuccess(null), 2000);
    } catch (error) {
      console.error('Error purchasing:', error);
      alert('❌ Error al comprar, intentá de nuevo');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="coin-shop">
      <div className="shop-header">
        <div className="shop-title">
          <span className="shop-icon">🛒</span>
          <span>TIENDA DE MONEDAS</span>
        </div>
        <div className="user-coins">
          <span>🪙</span>
          <span className="coins-amount">{coins}</span>
        </div>
      </div>
      
      <div className="shop-items">
        {SHOP_ITEMS.map(item => (
          <div 
            key={item.id} 
            className={`shop-item ${showSuccess === item.id ? 'purchased' : ''} ${coins < item.cost ? 'insufficient' : ''}`}
          >
            <div className="item-icon">{item.icon}</div>
            <div className="item-info">
              <div className="item-name">
                {item.name}
                {item.popular && <span className="popular-badge">🔥 POPULAR</span>}
              </div>
              <div className="item-desc">{item.description}</div>
            </div>
            <button
              className="item-buy"
              onClick={() => handlePurchase(item)}
              disabled={coins < item.cost || purchasing === item.id}
              style={{
                background: coins >= item.cost ? designTokens.colors.victory.gradient : designTokens.colors.textMuted,
              }}
            >
              {purchasing === item.id ? (
                '🔄 ...'
              ) : (
                <>🪙 {item.cost}</>
              )}
            </button>
          </div>
        ))}
      </div>

      {showSuccess && (
        <div className="purchase-success">
          ✅ ¡Compra realizada con éxito!
        </div>
      )}

      <style>{`
        .coin-shop {
          background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
          border-radius: 24px;
          padding: 20px;
          margin-top: 20px;
          border: 1px solid ${designTokens.colors.border};
          backdrop-filter: blur(10px);
        }
        .shop-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid ${designTokens.colors.achievement.primary}40;
        }
        .shop-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: bold;
          font-size: 14px;
        }
        .shop-icon {
          font-size: 24px;
        }
        .user-coins {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${designTokens.colors.achievement.primary}20;
          padding: 8px 16px;
          border-radius: 40px;
          font-weight: bold;
        }
        .coins-amount {
          color: ${designTokens.colors.achievement.primary};
          font-size: 18px;
        }
        .shop-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .shop-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px;
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
          transition: all 0.3s ${designTokens.animations.springBounce};
        }
        .shop-item:hover:not(.insufficient) {
          transform: translateX(4px);
          background: rgba(255,255,255,0.08);
        }
        .shop-item.purchased {
          animation: purchaseFlash 0.5s ease;
        }
        @keyframes purchaseFlash {
          0%, 100% { background: rgba(255,215,0,0.1); }
          50% { background: rgba(255,215,0,0.3); transform: scale(1.02); }
        }
        .shop-item.insufficient {
          opacity: 0.5;
        }
        .item-icon {
          font-size: 40px;
        }
        .item-info {
          flex: 1;
        }
        .item-name {
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .popular-badge {
          font-size: 9px;
          background: ${designTokens.colors.danger.primary}40;
          padding: 2px 8px;
          border-radius: 20px;
          color: ${designTokens.colors.danger.primary};
        }
        .item-desc {
          font-size: 11px;
          color: ${designTokens.colors.textMuted};
          margin-top: 4px;
        }
        .item-buy {
          border: none;
          padding: 10px 20px;
          border-radius: 40px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          color: #0a0a0f;
          font-size: 13px;
        }
        .item-buy:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .purchase-success {
          margin-top: 16px;
          padding: 12px;
          background: ${designTokens.colors.victory.primary}20;
          border-radius: 12px;
          text-align: center;
          color: ${designTokens.colors.victory.primary};
          font-weight: bold;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}