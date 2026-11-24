/**
 * Evento o sesión sin hora de fin: la app siempre guarda una fecha de fin (así sabe cuándo un evento ya pasó), y cuando el
 * organizador no la pone se usa el final del día de inicio en hora de Bogotá (UTC-5, sin horario de verano).
 */
const OFFSET_MS = 5 * 3_600_000
const DAY_MS = 86_400_000

/** 11:59:59.999 pm (Bogotá) del día en que empieza `start`. */
export function endOfBogotaDay(start: Date | string | number): Date {
  const t = new Date(start).getTime()
  return new Date(Math.floor((t - OFFSET_MS) / DAY_MS) * DAY_MS + OFFSET_MS + DAY_MS - 1)
}

/** El fin que se guarda: el elegido, o el final del día de inicio si falta. */
export function resolveEnd(start: Date | string, end?: Date | string | null): Date {
  return end ? new Date(end) : endOfBogotaDay(start)
}

/** ¿Es un evento sin hora de fin? (su fin es justo el final del día de inicio: no se muestra un rango de horas). */
export function isOpenEnded(start: Date | string | number, end: Date | string | number): boolean {
  const limit = endOfBogotaDay(start).getTime()
  const t = new Date(end).getTime()
  return t <= limit && t >= limit - 60_000 // también el «Todo el día» del formulario, que termina a las 11:59 pm en punto
}
