// src/styles/designTokens.ts
export const designTokens = {
  colors: {
    // Sistema de 3 tonos principal
    victory: {
      primary: '#3dffa0',
      secondary: '#2ecc71',
      glow: 'rgba(61, 255, 160, 0.3)',
      dark: '#1a6e3a',
      gradient: 'linear-gradient(135deg, #3dffa0, #2ecc71)',
    },
    danger: {
      primary: '#ff4d6d',
      secondary: '#ff7040',
      glow: 'rgba(255, 77, 109, 0.3)',
      dark: '#b91c1c',
      gradient: 'linear-gradient(135deg, #ff4d6d, #ff7040)',
    },
    achievement: {
      primary: '#ffd700',
      secondary: '#ffaa00',
      glow: 'rgba(255, 215, 0, 0.3)',
      dark: '#b8860b',
      gradient: 'linear-gradient(135deg, #ffd700, #ffaa00)',
    },
    // Rarezas de cartas
    rarity: {
      bronze: { primary: '#CD7F32', secondary: '#B87333', glow: 'rgba(205,127,50,0.3)' },
      silver: { primary: '#C0C0C0', secondary: '#A9A9A9', glow: 'rgba(192,192,192,0.3)' },
      gold: { primary: '#FFD700', secondary: '#DAA520', glow: 'rgba(255,215,0,0.3)' },
      legendary: { primary: '#9B59B6', secondary: '#7D3C98', glow: 'rgba(155,89,182,0.3)' },
    },
    // Neutrales
    surface: '#0f0f1a',
    surfaceLight: '#1a1a2e',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.1)',
  },
  animations: {
    springBounce: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
    smoothEase: 'cubic-bezier(0.2, 0.9, 0.4, 1.1)',
    fastEase: 'cubic-bezier(0.2, 0.8, 0.4, 1)',
    elasticOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  timing: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
} as const;

export type DesignTokens = typeof designTokens;