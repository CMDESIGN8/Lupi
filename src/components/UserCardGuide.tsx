// src/components/UserCardGuide.tsx
import { useState } from 'react';

export function UserCardGuide() {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="guide-container">
      <div className="guide-header" onClick={() => setExpanded(!expanded)}>
        <span className="guide-icon">📈</span>
        <span className="guide-title">¿Cómo mejorar tu carta?</span>
        <span className="guide-arrow">{expanded ? '▲' : '▼'}</span>
      </div>
      
      {expanded && (
        <div className="guide-content">
          <div className="guide-section">
  <h4>⚡ Velocidad</h4>
  <p>Cargá entradas. Cada entrada = +1 Velocidad</p>
  <div className="tip">💡 Cada entrada = +10 EXP, +1 ⚡</div>
</div>

<div className="guide-section">
  <h4>✨ Regate</h4>
  <p>Abrí el sobre diario. Cada día = +1 Regate</p>
  <div className="tip">💡 Abrir sobre = +25 EXP, +1 ✨</div>
</div>

<div className="guide-section">
  <h4>🎯 Remate</h4>
  <p>Ganá batallas. Cada victoria = +1 Remate</p>
  <div className="tip">💡 Victoria = +15 EXP, +1 🎯</div>
</div>

<div className="guide-section">
  <h4>🛡️ Defensa</h4>
  <p>Perdé batallas (aprendé de la derrota). Cada derrota = +1 Defensa</p>
  <div className="tip">💡 Derrota = +5 EXP, +1 🛡️</div>
</div>

<div className="guide-section">
  <h4>⚽ Pase</h4>
  <p>Compartí la app y completá misiones</p>
  <div className="tip">💡 Compartir = +30 EXP, +1 ⚽ | Misión = +50 EXP, +1 🎯</div>
</div>
        
<div className="guide-section">
  <h4>💪 Físico</h4>
  <p>Referí amigos. Cada referido = +2 Físico</p>
  <div className="tip">💡 Referir = +100 EXP, +2 💪</div>
</div>
          
          <div className="guide-footer">
            <div className="rarity-info">
              <span>🟤 Bronce (1-19)</span>
              <span>⚪ Plata (20-39)</span>
              <span>🟡 Oro (40-59)</span>
              <span>💎 Zafiro (60-79)</span>
              <span>🔥 Rubí (80-99)</span>
              <span>👑 Élite (100)</span>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .guide-container {
          background: var(--surface);
          border-radius: 20px;
          margin: 16px 0;
          overflow: hidden;
        }
        .guide-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .guide-header:hover { background: rgba(255,255,255,0.03); }
        .guide-icon { font-size: 24px; }
        .guide-title {
          flex: 1;
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--accent);
        }
        .guide-arrow { color: var(--text2); font-size: 12px; }
        .guide-content { padding: 0 20px 20px 20px; }
        .guide-section {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }
        .guide-section h4 { margin-bottom: 4px; font-size: 14px; }
        .guide-section p { font-size: 13px; color: var(--text2); margin: 0; }
        .tip {
          font-size: 11px;
          color: var(--accent);
          margin-top: 6px;
          padding-left: 12px;
          border-left: 2px solid var(--accent);
        }
        .guide-footer {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .rarity-info {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          font-size: 11px;
          color: var(--text2);
        }
      `}</style>
    </div>
  );
}