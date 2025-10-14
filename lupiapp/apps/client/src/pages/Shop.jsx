import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import AvatarShop from '../components/shop/AvatarShop';
import Inventory from '../components/shop/Inventory';
import Loading from '../components/common/Loading';

const Shop = () => {
  const [activeTab, setActiveTab] = useState('avatars');
  const { data: avatars, loading, error, refetch } = useApi(() => apiService.getAvatars());

  const handlePurchase = async (avatarId) => {
    try {
      await apiService.purchaseAvatar(avatarId);
      refetch(); // Recargar los avatares
      alert('¡Avatar comprado exitosamente!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEquip = async (avatarId) => {
    try {
      await apiService.equipAvatar(avatarId);
      refetch();
      alert('¡Avatar equipado!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="shop-page">
      <div className="page-header">
        <h1>🛍️ Tienda</h1>
        <p>Personaliza tu experiencia con nuevos avatares y items</p>
      </div>

      <div className="shop-tabs">
        <button 
          className={`tab ${activeTab === 'avatars' ? 'active' : ''}`}
          onClick={() => setActiveTab('avatars')}
        >
          Avatares
        </button>
        <button 
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Mi Inventario
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'avatars' && (
          <AvatarShop 
            avatars={avatars}
            onPurchase={handlePurchase}
            onEquip={handleEquip}
          />
        )}
        {activeTab === 'inventory' && (
          <Inventory onEquip={handleEquip} />
        )}
      </div>
    </div>
  );
};

export default Shop;