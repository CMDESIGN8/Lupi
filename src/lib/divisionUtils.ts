// lib/divisionUtils.ts
export function calculateDivision(points: number): {
  name: string;
  icon: string;
  color: string;
  nextRequired: number;
} {
  if (points >= 3000) {
    return { name: 'LEYENDA', icon: '🏆', color: '#ff4444', nextRequired: 4000 };
  }
  if (points >= 2000) {
    return { name: 'ORO', icon: '🥇', color: '#ffd700', nextRequired: 3000 };
  }
  if (points >= 1000) {
    return { name: 'PLATA', icon: '🥈', color: '#c0c0c0', nextRequired: 2000 };
  }
  if (points >= 500) {
    return { name: 'BRONCE', icon: '🥉', color: '#cd7f32', nextRequired: 1000 };
  }
  return { name: 'PRINCIPIANTE', icon: '⭐', color: '#888', nextRequired: 500 };
}

export function getNextDivision(currentPoints: number): string {
  if (currentPoints < 500) return 'BRONCE';
  if (currentPoints < 1000) return 'PLATA';
  if (currentPoints < 2000) return 'ORO';
  if (currentPoints < 3000) return 'LEYENDA';
  return 'CAMPEÓN';
}