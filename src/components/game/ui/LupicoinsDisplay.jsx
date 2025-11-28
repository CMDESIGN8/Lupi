// src/components/game/ui/LupicoinsDisplay.jsx
import React, { useState, useEffect } from 'react';
import { gameService } from '../../../services/gameService';
import '../../../styles/LupicoinsDisplay.css';

export const LupicoinsDisplay = ({ userId, characterId, showFull = false }) => {
  const [lupicoins, setLupicoins] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (characterId) {
      loadWallet();
    }
  }, [characterId]);

  const loadWallet = async () => {
    try {
      // Asegúrate de que characterId sea el correcto
      if (!characterId || !isValidUUID(characterId)) {
        console.error('❌ characterId inválido en LupicoinsDisplay:', characterId);
        return;
      }
      
      const wallet = await gameService.getWallet(characterId);
      if (wallet) {
        setLupicoins(wallet.lupicoins || 0);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  // Helper para validar UUID
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const updateLupicoins = async (amount) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newWallet = await gameService.updateLupicoins(userId, amount);
      if (newWallet) {
        setLupicoins(newWallet.lupicoins);
      }
    } catch (error) {
      console.error('Error updating lupicoins:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const addLupicoins = (amount) => {
    updateLupicoins(lupicoins + amount);
  };

  const subtractLupicoins = (amount) => {
    if (lupicoins >= amount) {
      updateLupicoins(lupicoins - amount);
    }
  };

  if (showFull) {
    return (
      <div className="lupicoins-display-full">
        <div className="lupicoins-header">
          <h3>💎 Lupicoins</h3>
          <div className="lupicoins-amount-large">{lupicoins}</div>
        </div>
        <div className="lupicoins-actions">
          <button 
            onClick={() => addLupicoins(10)} 
            disabled={isUpdating}
            className="lupicoins-btn add"
          >
            +10
          </button>
          <button 
            onClick={() => subtractLupicoins(10)} 
            disabled={isUpdating || lupicoins < 10}
            className="lupicoins-btn subtract"
          >
            -10
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lupicoins-display-compact">
      <div className="lupicoins-icon">💎</div>
      <div className="lupicoins-info">
        <span className="lupicoins-label">Lupicoins</span>
        <span className="lupicoins-value">{lupicoins}</span>
      </div>
    </div>
  );
};