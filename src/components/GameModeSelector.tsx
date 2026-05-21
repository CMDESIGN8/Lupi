// src/components/GameModeSelector.tsx
import { useState } from 'react';

interface GameModeSelectorProps {
  onSelectMode: (mode: 'campaign' | 'quick') => void;
  currentMode: 'campaign' | 'quick';
}

export function GameModeSelector({ onSelectMode, currentMode }: GameModeSelectorProps) {
  return (
    <div className="game-mode-selector">
      <button
        className={`mode-btn ${currentMode === 'campaign' ? 'active' : ''}`}
        onClick={() => onSelectMode('campaign')}
      >
        <span>🏆</span>
        <span>MODO HISTORIA</span>
        <small>Gana ligas y desbloquea insignias</small>
      </button>
      <button
        className={`mode-btn ${currentMode === 'quick' ? 'active' : ''}`}
        onClick={() => onSelectMode('quick')}
      >
        <span>⚡</span>
        <span>PARTIDO RÁPIDO</span>
        <small>Enfrenta bots al azar</small>
      </button>

      <style>{`
        .game-mode-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          background: rgba(0,0,0,0.3);
          padding: 8px;
          border-radius: 60px;
        }
        .mode-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #fff;
        }
        .mode-btn span:first-child {
          font-size: 24px;
        }
        .mode-btn span:last-child {
          font-weight: bold;
          font-size: 13px;
        }
        .mode-btn small {
          font-size: 9px;
          color: rgba(255,255,255,0.4);
        }
        .mode-btn.active {
          background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,100,50,0.1));
          border-color: #ffd700;
          box-shadow: 0 0 20px rgba(255,215,0,0.2);
        }
        @media (max-width: 640px) {
          .mode-btn span:last-child { font-size: 11px; }
          .mode-btn small { display: none; }
        }
      `}</style>
    </div>
  );
}