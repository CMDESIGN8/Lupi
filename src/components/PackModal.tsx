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
      <div
        className="pack-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Recompensa diaria de cartas"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar sobre"
          className="pack-modal-close"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
        <DailyCardReward userId={userId} onCardReceived={onCardReceived} />
      </div>

      <style>{`
        .pack-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          box-sizing: border-box;
          padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 35%, rgba(19, 64, 87, .5), transparent 58%), rgba(1, 7, 13, .82);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }

        .pack-modal-content {
          position: relative;
          width: min(440px, 100%);
          max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 28px);
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          border: 1px solid rgba(111, 220, 237, .2);
          border-radius: 28px;
          background: #071522;
          box-shadow: 0 30px 100px rgba(0, 0, 0, .68), 0 0 50px rgba(43, 189, 211, .09);
          scrollbar-width: thin;
          scrollbar-color: #285667 #07131f;
          animation: lupiPackModalIn .34s cubic-bezier(.2,.8,.2,1) both;
        }

        .pack-modal-content .daily-card-reward {
          min-height: 0;
          padding: 0;
          background: transparent;
        }

        .pack-modal-content .daily-card-reward::before,
        .pack-modal-content .daily-card-reward::after {
          content: none;
        }

        .pack-modal-content .daily-card-reward .pack-wrapper { width: 100%; }
        .pack-modal-content .daily-card-reward .pack {
          min-height: 580px;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }
        .pack-modal-content .daily-card-reward .pack-content { min-height: 580px; }
        .pack-modal-content .daily-card-reward .pack.completed { min-height: 450px; }
        .pack-modal-content .daily-card-reward .pack.completed .pack-content { min-height: 450px; }
        @media (max-width: 480px) {
          .pack-modal-content .daily-card-reward .pack.completed,
          .pack-modal-content .daily-card-reward .pack.completed .pack-content { min-height: 430px; }
        }

        /* Dejar que el reveal fijo use todo el viewport y no quede recortado por el panel scrollable. */
        .pack-modal-content:has(.card-obtained-overlay) {
          width: 100vw !important;
          max-width: none !important;
          height: 100dvh !important;
          max-height: none !important;
          overflow: visible !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          animation: none !important;
          transform: none !important;
        }

        .pack-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 20;
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(196, 236, 244, .2);
          border-radius: 50%;
          background: rgba(5, 24, 37, .78);
          color: #f4fbff;
          font: 400 26px/1 system-ui, sans-serif;
          cursor: pointer;
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          transition: background .2s ease, transform .2s ease;
        }
        .pack-modal-close:hover { transform: rotate(90deg); background: rgba(31, 86, 108, .9); }
        .pack-modal-content button:focus-visible { outline: 3px solid #a6efff; outline-offset: 3px; }

        @keyframes lupiPackModalIn {
          from { opacity: 0; transform: translateY(14px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
          .pack-modal-overlay { padding-left: 10px; padding-right: 10px; }
          .pack-modal-content { width: min(410px, 100%); border-radius: 24px; }
          .pack-modal-content .daily-card-reward .pack,
          .pack-modal-content .daily-card-reward .pack-content { min-height: 560px; }
          .pack-modal-close { top: 10px; right: 10px; width: 40px; height: 40px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pack-modal-content { animation: none; }
        }
      `}</style>
    </div>
  );
}
