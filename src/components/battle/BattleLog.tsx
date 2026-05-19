// src/components/battle/BattleLog.tsx
import { useEffect, useRef } from 'react';
import { designTokens } from '../../styles/designTokens';

export interface BattleLogLine {
  text: string;
  type: 'neutral' | 'good' | 'bad' | 'event';
  icon?: string;
}

interface BattleLogProps {
  lines: BattleLogLine[];
  isActive: boolean;
}

const TYPE_CONFIG = {
  good: { 
    icon: '⚽', 
    color: designTokens.colors.victory.primary, 
    bg: 'rgba(61,255,160,0.1)',
    label: '¡GOOOOL!'
  },
  bad: { 
    icon: '💔', 
    color: designTokens.colors.danger.primary, 
    bg: 'rgba(255,77,109,0.1)',
    label: '¡GOL DEL RIVAL!'
  },
  event: { 
    icon: '📢', 
    color: designTokens.colors.achievement.primary, 
    bg: 'rgba(255,215,0,0.1)',
    label: 'EVENTO'
  },
  neutral: { 
    icon: '⚡', 
    color: designTokens.colors.textMuted, 
    bg: 'rgba(255,255,255,0.03)',
    label: 'JUGADA'
  },
};

export function BattleLog({ lines, isActive }: BattleLogProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const lastLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && isActive && lastLineRef.current) {
      lastLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [lines, isActive]);

  // Efecto de vibración en móvil para goles
  useEffect(() => {
    if (lines.length > 0 && 'vibrate' in navigator) {
      const lastLine = lines[lines.length - 1];
      if (lastLine.type === 'good') {
        navigator.vibrate?.(100);
      } else if (lastLine.type === 'bad') {
        navigator.vibrate?.(50);
      }
    }
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="battle-log-empty">
        <div className="pulse-animation">⚽</div>
        <p>¡El partido está por comenzar!</p>
        <span className="wait-text">Esperando el silbatazo inicial...</span>
        <style>{`
          .battle-log-empty {
            text-align: center;
            padding: 48px 24px;
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
          }
          .pulse-animation {
            font-size: 56px;
            animation: pulseGoal 1.2s ease-in-out infinite;
            display: inline-block;
            margin-bottom: 12px;
          }
          .wait-text {
            display: block;
            font-size: 11px;
            color: ${designTokens.colors.textMuted};
            margin-top: 8px;
          }
          @keyframes pulseGoal {
            0%, 100% { transform: scale(1); opacity: 0.6; text-shadow: 0 0 0px ${designTokens.colors.victory.glow}; }
            50% { transform: scale(1.15); opacity: 1; text-shadow: 0 0 20px ${designTokens.colors.victory.primary}; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="battle-log-enhanced" ref={logRef}>
      <div className="log-header">
        <span>📋 CRÓNICA DEL PARTIDO</span>
        <span className="log-count">{lines.length} jugadas</span>
      </div>
      <div className="log-container">
        {lines.map((line, i) => {
          const config = TYPE_CONFIG[line.type];
          const isLast = i === lines.length - 1;
          return (
            <div
              key={i}
              ref={isLast ? lastLineRef : null}
              className={`log-entry log-${line.type}`}
              style={{
                animationDelay: `${Math.min(i * 0.02, 0.5)}s`,
                borderLeftColor: config.color,
              }}
            >
              <div className="log-icon" style={{ background: config.bg }}>
                <span>{line.icon || config.icon}</span>
                {line.type !== 'neutral' && (
                  <span className="log-icon-label" style={{ color: config.color }}>
                    {config.label}
                  </span>
                )}
              </div>
              <div className="log-content">
                <span className="log-text">{line.text}</span>
                {line.type === 'good' && (
                  <span className="log-fire">🔥</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .battle-log-enhanced {
          background: rgba(0,0,0,0.5);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(4px);
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0,0,0,0.4);
          border-bottom: 1px solid ${designTokens.colors.border};
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .log-count {
          color: ${designTokens.colors.textMuted};
          font-size: 10px;
        }
        .log-container {
          padding: 16px;
          height: 220px;
          overflow-y: auto;
          scroll-behavior: smooth;
        }
        .log-container::-webkit-scrollbar {
          width: 4px;
        }
        .log-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .log-container::-webkit-scrollbar-thumb {
          background: ${designTokens.colors.victory.primary};
          border-radius: 4px;
        }
        .log-entry {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border-left: 3px solid;
          animation: slideInLog 0.3s ${designTokens.animations.springBounce} both;
          transition: all 0.2s ease;
        }
        .log-entry:hover {
          transform: translateX(4px);
          background: rgba(255,255,255,0.06);
        }
        @keyframes slideInLog {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .log-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex-shrink: 0;
          font-size: 24px;
        }
        .log-icon-label {
          font-size: 8px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .log-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .log-text {
          font-size: 13px;
          line-height: 1.4;
          font-weight: 500;
        }
        .log-fire {
          font-size: 16px;
          animation: fireFlicker 0.5s ease-in-out infinite;
          margin-left: 8px;
        }
        @keyframes fireFlicker {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .log-good .log-text { color: ${designTokens.colors.victory.primary}; }
        .log-bad .log-text { color: ${designTokens.colors.danger.primary}; }
        .log-event .log-text { color: ${designTokens.colors.achievement.primary}; }
        .log-neutral .log-text { color: ${designTokens.colors.textMuted}; }
      `}</style>
    </div>
  );
}