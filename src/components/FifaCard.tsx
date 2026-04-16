/**
 * FifaCard.tsx
 * Componente visual de carta estilo FIFA para Flores Futsal.
 *
 * INSTALACIÓN:
 *   Copiá este archivo a src/components/FifaCard.tsx
 *
 * USO:
 *   <FifaCard card={playerCard} size="md" />
 *   <FifaCard card={playerCard} size="lg" showFlip />   ← con flip al hacer click
 *   <FifaCard card={playerCard} size="sm" locked />     ← carta bloqueada (álbum)
 */

import { useState } from "react";
import { PlayerCard } from "../lib/api";

// ── Paleta por rareza ────────────────────────────────────────
const RARITY_THEME: Record<string, {
  bg: string;
  border: string;
  shine: string;
  badge: string;
  label: string;
  text: string;
  statColor: string;
}> = {
  bronze: {
    bg:        "linear-gradient(145deg, #2a1a0e 0%, #3d2510 50%, #1e1208 100%)",
    border:    "#8B5E3C",
    shine:     "rgba(180, 110, 60, 0.18)",
    badge:     "#8B5E3C",
    label:     "BRONCE",
    text:      "#d4915a",
    statColor: "#c97d46",
  },
  silver: {
    bg:        "linear-gradient(145deg, #1a1a22 0%, #2a2a38 50%, #111118 100%)",
    border:    "#8888aa",
    shine:     "rgba(170, 170, 210, 0.15)",
    badge:     "#8888aa",
    label:     "PLATA",
    text:      "#b0b0cc",
    statColor: "#9898ba",
  },
  gold: {
    bg:        "linear-gradient(145deg, #1a1500 0%, #2e2400 50%, #0f0c00 100%)",
    border:    "#c9a227",
    shine:     "rgba(220, 180, 40, 0.2)",
    badge:     "#c9a227",
    label:     "ORO",
    text:      "#f0c040",
    statColor: "#d4aa30",
  },
  special: {
    bg:        "linear-gradient(145deg, #0d0020 0%, #1a0035 50%, #06001a 100%)",
    border:    "#9b59ff",
    shine:     "rgba(155, 89, 255, 0.25)",
    badge:     "#9b59ff",
    label:     "ESPECIAL",
    text:      "#c084fc",
    statColor: "#a855f7",
  },
};

// ── CSS ──────────────────────────────────────────────────────
const CARD_CSS = `
.fifa-card-wrapper {
  perspective: 1000px;
  display: inline-block;
}

.fifa-card-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.fifa-card-wrapper.flipped .fifa-card-inner {
  transform: rotateY(180deg);
}

.fifa-card-front,
.fifa-card-back {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 14px;
}

.fifa-card-back {
  transform: rotateY(180deg);
}

/* Shine overlay */
.fifa-card-shine {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%);
  pointer-events: none;
}

/* Locked overlay */
.fifa-card-locked {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: rgba(0,0,0,0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  backdrop-filter: blur(2px);
}

/* Stat row */
.fifa-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.fifa-stat-bar-track {
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 100px;
  margin: 0 6px;
  overflow: hidden;
}

.fifa-stat-bar-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Sizes */
.fifa-card-sm  { width: 100px; height: 140px; }
.fifa-card-md  { width: 160px; height: 224px; }
.fifa-card-lg  { width: 220px; height: 308px; }

.fifa-card-inner.fifa-card-sm  { width: 100px; height: 140px; }
.fifa-card-inner.fifa-card-md  { width: 160px; height: 224px; }
.fifa-card-inner.fifa-card-lg  { width: 220px; height: 308px; }

@keyframes card-appear {
  from { transform: scale(0.6) rotateY(-30deg); opacity: 0; }
  to   { transform: scale(1) rotateY(0deg); opacity: 1; }
}

.fifa-card-animate {
  animation: card-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`;

// ── Tipos ─────────────────────────────────────────────────────
type CardSize = 'sm' | 'md' | 'lg';

interface FifaCardProps {
  card: PlayerCard;
  size?: CardSize;
  showFlip?: boolean;    // permite flip al hacer click
  locked?: boolean;      // carta no obtenida (álbum)
  animate?: boolean;     // animación de aparición
  onClick?: () => void;
}

const SIZE_SCALE: Record<CardSize, number> = { sm: 1, md: 1.6, lg: 2.2 };

const STAT_LABELS: { key: keyof PlayerCard; label: string }[] = [
  { key: 'pace',      label: 'RIT' },
  { key: 'dribbling', label: 'REG' },
  { key: 'passing',   label: 'PAS' },
  { key: 'defending', label: 'DEF' },
  { key: 'finishing', label: 'TIR' },
  { key: 'physical',  label: 'FIS' },
];

const POSITION_LABELS: Record<string, string> = {
  arquero: 'ARQ',
  cierre:  'CIE',
  ala:     'ALA',
  pivot:   'PIV',
};

// ── Componente ────────────────────────────────────────────────
export function FifaCard({
  card,
  size = 'md',
  showFlip = false,
  locked = false,
  animate = false,
  onClick,
}: FifaCardProps) {
  const [flipped, setFlipped] = useState(false);
  const theme = RARITY_THEME[card.rarity] ?? RARITY_THEME.bronze;
  const scale = SIZE_SCALE[size];

  const handleClick = () => {
    if (showFlip) setFlipped(f => !f);
    onClick?.();
  };

  const fontSize = {
    ovr:      Math.round(28 * scale),
    pos:      Math.round(10 * scale),
    name:     Math.round(11 * scale),
    statVal:  Math.round(9 * scale),
    statLbl:  Math.round(8 * scale),
    badge:    Math.round(7 * scale),
  };

  const pad = Math.round(10 * scale);

  return (
    <>
      <style>{CARD_CSS}</style>
      <div
        className={`fifa-card-wrapper${flipped ? ' flipped' : ''}`}
        style={{ userSelect: 'none' }}
      >
        <div
          className={`fifa-card-inner fifa-card-${size}${animate ? ' fifa-card-animate' : ''}`}
          onClick={handleClick}
        >
          {/* ── FRENTE ── */}
          <div
            className="fifa-card-front"
            style={{
              background: theme.bg,
              border: `1.5px solid ${theme.border}`,
              boxShadow: `0 0 18px ${theme.shine}, inset 0 0 30px rgba(0,0,0,0.4)`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Shine */}
            <div className="fifa-card-shine" />

            {/* Header: OVR + posición + badge rareza */}
            <div style={{
              padding: `${pad}px ${pad}px ${Math.round(4*scale)}px`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: fontSize.ovr,
                  color: theme.text,
                  lineHeight: 1,
                  letterSpacing: 1,
                }}>
                  {card.overall_rating}
                </div>
                <div style={{
                  fontSize: fontSize.pos,
                  fontWeight: 700,
                  color: theme.text,
                  letterSpacing: 1,
                  opacity: 0.85,
                }}>
                  {POSITION_LABELS[card.position] ?? 'JUG'}
                </div>
              </div>

              {/* Badge rareza */}
              <div style={{
                fontSize: fontSize.badge,
                fontWeight: 700,
                letterSpacing: 1,
                color: theme.badge,
                border: `1px solid ${theme.border}`,
                borderRadius: 4,
                padding: '2px 4px',
                opacity: 0.9,
              }}>
                {theme.label}
              </div>
            </div>

            {/* Foto / Avatar */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `0 ${pad}px`,
            }}>
              {card.photo_url ? (
                <img
                  src={card.photo_url}
                  alt={card.name}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: `1px solid ${theme.border}40`,
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 8,
                  background: `${theme.border}18`,
                  border: `1px solid ${theme.border}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.round(32 * scale),
                }}>
                  ⚽
                </div>
              )}
            </div>

            {/* Nombre */}
            <div style={{
              textAlign: 'center',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: fontSize.name,
              letterSpacing: 1.5,
              color: theme.text,
              padding: `${Math.round(4*scale)}px ${pad}px`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {card.name.toUpperCase()}
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              margin: `0 ${pad}px`,
              background: `${theme.border}40`,
            }} />

            {/* Stats */}
            <div style={{ padding: `${Math.round(6*scale)}px ${pad}px ${pad}px` }}>
              {STAT_LABELS.map(({ key, label }) => {
                const val = card[key] as number;
                return (
                  <div key={key} className="fifa-stat-row">
                    <span style={{
                      fontSize: fontSize.statLbl,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      color: theme.statColor,
                      minWidth: Math.round(18 * scale),
                      opacity: 0.8,
                    }}>
                      {label}
                    </span>
                    <div className="fifa-stat-bar-track">
                      <div
                        className="fifa-stat-bar-fill"
                        style={{
                          width: `${val}%`,
                          background: theme.statColor,
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: fontSize.statVal,
                      fontWeight: 700,
                      color: theme.text,
                      minWidth: Math.round(16 * scale),
                      textAlign: 'right',
                    }}>
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Logo Flores */}
            <div style={{
              textAlign: 'center',
              fontSize: fontSize.badge,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: `${theme.badge}88`,
              paddingBottom: Math.round(6 * scale),
            }}>
              FLORES FUTSAL
            </div>

            {/* Locked overlay */}
            {locked && (
              <div className="fifa-card-locked">🔒</div>
            )}
          </div>

          {/* ── DORSO ── */}
          {showFlip && (
            <div
              className="fifa-card-back"
              style={{
                background: theme.bg,
                border: `1.5px solid ${theme.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: pad,
                gap: Math.round(8 * scale),
              }}
            >
              <div className="fifa-card-shine" />
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: Math.round(14 * scale),
                color: theme.text,
                letterSpacing: 2,
                textAlign: 'center',
              }}>
                FLORES FUTSAL
              </div>
              <div style={{ fontSize: Math.round(28 * scale) }}>⚽</div>
              <div style={{
                fontSize: fontSize.badge,
                color: theme.statColor,
                letterSpacing: 1,
                textAlign: 'center',
              }}>
                {card.category?.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default FifaCard;
