// components/PackModal.tsx
import { DailyCardReward } from './DailyCardReward';
import { UnifiedCard } from '../types/cards';

interface PackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCardReceived: (card: UnifiedCard) => void;
}

export function PackModal({ isOpen, onClose, userId, onCardReceived }: PackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="pack-modal-overlay" onClick={onClose}>
      <div className="pack-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="pack-modal-close" onClick={onClose}>✕</button>
        <DailyCardReward 
          userId={userId} 
          onCardReceived={(card) => {
            onCardReceived(card);
            // No cerramos el modal automáticamente para que vea la carta
          }} 
        />
      </div>
      <style>{`
        .pack-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .pack-modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 24px;
          animation: packModalSlideIn 0.3s ease-out;
        }

        .pack-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 18px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .pack-modal-close:hover {
          background: rgba(255, 77, 109, 0.8);
          transform: scale(1.05);
        }

        @keyframes packModalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 480px) {
          .pack-modal-content {
            max-width: 95vw;
          }
        }
      `}</style>
    </div>
  );
}