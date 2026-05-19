// utils/passSystem.ts
export interface PassTrajectory {
  from: { x: number; y: number };
  to: { x: number; y: number };
  current: { x: number; y: number };
  progress: number;
  duration: number;
  arcHeight: number;
}

export function createPass(
  fromX: number, 
  fromY: number, 
  toX: number, 
  toY: number,
  duration: number = 0.4
): PassTrajectory {
  const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  const arcHeight = Math.min(15, distance * 0.25); // Altura del arco basada en distancia
  
  return {
    from: { x: fromX, y: fromY },
    to: { x: toX, y: toY },
    current: { x: fromX, y: fromY },
    progress: 0,
    duration,
    arcHeight
  };
}

export function updatePassTrajectory(
  pass: PassTrajectory,
  deltaTime: number
): PassTrajectory | null {
  const newProgress = pass.progress + (deltaTime / pass.duration);
  
  if (newProgress >= 1) {
    return null; // Pase completado
  }
  
  // Curva parabólica: y = altura máxima en el medio
  const t = newProgress;
  const parabolaFactor = 4 * t * (1 - t); // Parábola que vale 0 en t=0 y t=1, máximo 1 en t=0.5
  
  const x = pass.from.x + (pass.to.x - pass.from.x) * t;
  const y = pass.from.y + (pass.to.y - pass.from.y) * t - parabolaFactor * pass.arcHeight;
  
  return {
    ...pass,
    current: { x, y },
    progress: newProgress
  };
}