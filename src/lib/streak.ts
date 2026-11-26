/** Reglas de fecha de la racha. La persistencia de la racha sigue siendo responsabilidad del backend. */

export function dateKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
<<<<<<< HEAD
=======
  // Las columnas `date` del servidor llegan como "YYYY-MM-DD": ya son un día calendario. Parsearlas con new Date() las toma como
  // medianoche UTC y en Argentina (UTC-3) caen en el día ANTERIOR, por eso la racha figuraba siempre "en riesgo".
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
>>>>>>> 5a26a2f4 (version final 1)
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  // Importante: la racha es por día calendario local de Argentina/app.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayKey(): string {
  return dateKey(new Date())!;
}

export function isStreakActive(lastActivity: string | null | undefined): boolean {
  return !!lastActivity && dateKey(lastActivity) === todayKey();
}

export function isStreakAtRisk(
  streak: number,
  lastActivity: string | null | undefined,
): boolean {
  return streak > 0 && !isStreakActive(lastActivity);
}
