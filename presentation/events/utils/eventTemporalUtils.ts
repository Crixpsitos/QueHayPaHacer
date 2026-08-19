/**
 * Helpers de temporalidad — única fuente de verdad para determinar si un evento
 * o sesión ya finalizó. Las fechas se almacenan como UTC en Firestore y se
 * representan como ISO 8601 en los ViewModels, por lo que la comparación contra
 * `Date.now()` (UTC) es directa y no requiere conversión de zona horaria.
 *
 * Regla: `endDate < now` → vencido.
 *
 * Un evento en progreso (started pero no ended) NO se considera vencido.
 */

export function isEventPast(endDate: string | Date): boolean {
  return new Date(endDate).getTime() < Date.now();
}

export function isSessionPast(endDate: string | Date): boolean {
  return new Date(endDate).getTime() < Date.now();
}

/**
 * True si al menos una sesión todavía no ha finalizado.
 */
export function hasUpcomingSessions(sessions: { endDate: string }[]): boolean {
  return sessions.some((s) => !isSessionPast(s.endDate));
}

/**
 * True si la sesión ya comenzó pero todavía no ha finalizado.
 * Un evento en progreso sigue siendo inscribible (endDate aún no llegó).
 */
export function isSessionInProgress(startDate: string | Date, endDate: string | Date): boolean {
  const now = Date.now();
  return new Date(startDate).getTime() <= now && new Date(endDate).getTime() > now;
}

/**
 * True si TODAS las sesiones ya finalizaron (evento multi-date completamente vencido).
 * Un array vacío se considera NO vencido (no hay datos suficientes para afirmarlo).
 */
export function isMultiDateEventPast(sessions: { endDate: string }[]): boolean {
  if (sessions.length === 0) return false;
  return sessions.every((s) => isSessionPast(s.endDate));
}
