// src/lib/dateUtils.ts
export function getNextThursday20h(): Date {
  const now = new Date();
  const target = new Date(now);
  
  // Calcular próximo jueves
  const currentDay = now.getDay(); // 0=domingo, 1=lunes, ..., 4=jueves
  const daysUntilThursday = currentDay <= 4 ? 4 - currentDay : 11 - currentDay;
  
  target.setDate(now.getDate() + daysUntilThursday);
  target.setHours(20, 0, 0, 0); // 20:00 horas
  
  // Si hoy es jueves después de las 20:00, ir al próximo jueves
  if (currentDay === 4 && now.getHours() >= 20) {
    target.setDate(now.getDate() + 7);
  }
  
  return target;
}