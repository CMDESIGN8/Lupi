// src/styles/theme.ts
// ─── SISTEMA DE DISEÑO UNIFICADO ────────────────────────────────────────────
// Importar en cualquier componente que necesite consistencia visual.
// Usar con CSS variables inyectadas en el root o con los helpers de abajo.

export const COLORS = {
  // Fondos
  bg: '#07100d',
  bgCard: '#0f1c16',
  bgSurface: '#12201a',
  bgOverlay: 'rgba(0,0,0,0.85)',

  // Acentos primarios
  green: '#3dffa0',       // usuario / victoria / positivo
  greenDim: 'rgba(61,255,160,0.15)',
  greenBorder: 'rgba(61,255,160,0.35)',

  orange: '#ff6e3c',      // rival / peligro
  orangeDim: 'rgba(255,110,60,0.15)',
  orangeBorder: 'rgba(255,110,60,0.35)',

  gold: '#ffd700',        // XP / logros / legendario
  goldDim: 'rgba(255,215,0,0.15)',
  goldBorder: 'rgba(255,215,0,0.35)',

  blue: '#6496ff',        // defensa / PvP
  blueDim: 'rgba(100,150,255,0.15)',
  blueBorder: 'rgba(100,150,255,0.35)',

  purple: '#b06aff',      // legendario / especial
  purpleDim: 'rgba(176,106,255,0.15)',

  // Rareza de cartas (consistente en ambos componentes)
  rarityLegendary: '#b06aff',
  rarityGold: '#ffd700',
  raritySilver: '#c0c0c0',
  rarityBronze: '#cd7f32',

  // Texto
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.3)',

  // Bordes
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',
} as const;

export const RADII = {
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  pill: '9999px',
} as const;

export const SHADOWS = {
  card: '0 4px 16px rgba(0,0,0,0.4)',
  cardHover: '0 8px 24px rgba(0,0,0,0.5)',
  glow: (color: string) => `0 0 16px ${color}`,
  glowStrong: (color: string) => `0 0 32px ${color}, 0 0 8px ${color}`,
} as const;

export const TRANSITIONS = {
  fast: 'all 0.15s ease',
  normal: 'all 0.25s ease',
  bounce: 'all 0.35s cubic-bezier(0.34,1.2,0.64,1)',
  slow: 'all 0.5s ease',
} as const;

export const EASINGS = {
  bounce: 'cubic-bezier(0.34,1.2,0.64,1)',
  snappy: 'cubic-bezier(0.2,0.9,0.4,1.1)',
  smooth: 'cubic-bezier(0.4,0,0.2,1)',
} as const;

// ── Helpers de rareza ──────────────────────────────────────────────────────
export function getRarityColor(ovr: number): string {
  if (ovr >= 85) return COLORS.rarityLegendary;
  if (ovr >= 75) return COLORS.rarityGold;
  if (ovr >= 65) return COLORS.raritySilver;
  return COLORS.rarityBronze;
}

export function getRarityGradient(ovr: number): string {
  if (ovr >= 85) return `linear-gradient(135deg, #b06aff, #7D3C98)`;
  if (ovr >= 75) return `linear-gradient(135deg, #ffd700, #DAA520)`;
  if (ovr >= 65) return `linear-gradient(135deg, #c0c0c0, #A9A9A9)`;
  return `linear-gradient(135deg, #cd7f32, #B87333)`;
}

export function getRarityLabel(ovr: number): string {
  if (ovr >= 85) return '👑 LEGENDARIO';
  if (ovr >= 75) return '⭐ DORADO';
  if (ovr >= 65) return '🥈 PLATEADO';
  return '🥉 BRONCE';
}

export function getRarityClass(ovr: number): string {
  if (ovr >= 85) return 'legendary';
  if (ovr >= 75) return 'gold';
  if (ovr >= 65) return 'silver';
  return 'bronze';
}

// ── Posiciones (consistente en ambos componentes) ───────────────────────────
export const POSITION_META: Record<number, {
  short: string; long: string; kid: string; icon: string; color: string;
}> = {
  1: { short: 'ARQ', long: 'ARQUERO',      kid: 'El que ataja',          icon: '🧤', color: '#4a90d9' },
  2: { short: 'CIE', long: 'CIERRE',       kid: 'El defensor',           icon: '🛡️', color: '#e67e22' },
  3: { short: 'ALA IZQ', long: 'ALA IZQ',  kid: 'Corre por la izquierda',icon: '⚡', color: '#2ecc71' },
  4: { short: 'ALA DER', long: 'ALA DER',  kid: 'Corre por la derecha',  icon: '⚡', color: '#2ecc71' },
  5: { short: 'PIV', long: 'PIVOT',        kid: 'El goleador',           icon: '🎯', color: '#e74c3c' },
};

// ── CSS variables root (inyectar en el componente raíz) ─────────────────────
export const CSS_VARS = `
  :root {
    --bg: ${COLORS.bg};
    --bg-card: ${COLORS.bgCard};
    --bg-surface: ${COLORS.bgSurface};
    --green: ${COLORS.green};
    --green-dim: ${COLORS.greenDim};
    --green-border: ${COLORS.greenBorder};
    --orange: ${COLORS.orange};
    --orange-dim: ${COLORS.orangeDim};
    --orange-border: ${COLORS.orangeBorder};
    --gold: ${COLORS.gold};
    --gold-dim: ${COLORS.goldDim};
    --gold-border: ${COLORS.goldBorder};
    --blue: ${COLORS.blue};
    --blue-dim: ${COLORS.blueDim};
    --blue-border: ${COLORS.blueBorder};
    --purple: ${COLORS.purple};
    --purple-dim: ${COLORS.purpleDim};
    --text: ${COLORS.textPrimary};
    --text2: ${COLORS.textSecondary};
    --text3: ${COLORS.textMuted};
    --border: ${COLORS.border};
    --border-strong: ${COLORS.borderStrong};
    --radius-sm: ${RADII.sm};
    --radius-md: ${RADII.md};
    --radius-lg: ${RADII.lg};
    --radius-xl: ${RADII.xl};
    --shadow-card: ${SHADOWS.card};
    --transition: ${TRANSITIONS.normal};
    --bounce: ${TRANSITIONS.bounce};
  }
`;