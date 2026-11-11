/** Guardados privados y "Yo fui" de actividades. Cada operación es idempotente y devuelve si cambió algo. */
export interface IActivityEngagementRepository {
  /** `users/{uid}/saved/activity_{id}` + contador agregado. `changed` = false si ya estaba en ese estado (doble toque = 1). */
  setSaved(uid: string, activityId: string, saved: boolean): Promise<{ changed: boolean }>
  /** Cuáles de estos ids tiene guardados la persona. */
  savedAmong(uid: string, activityIds: string[]): Promise<string[]>
  /** `activities/{id}/visits/{uid}` + `analytics.visits`. Una por persona. */
  markVisited(uid: string, activityId: string): Promise<{ changed: boolean }>
  hasVisited(uid: string, activityId: string): Promise<boolean>
}
