import type { ActivityTrackType } from "@/domain/entities/analytics/trackTypes"
import type { TrafficSource } from "@/domain/entities/analytics/trafficSource"

/** Guardados privados y "Yo fui" de actividades. Cada operación es idempotente y devuelve si cambió algo. */
export interface IActivityEngagementRepository {
  /** `users/{uid}/saved/activity_{id}` + contador agregado. `changed` = false si ya estaba en ese estado (doble toque = 1). */
  setSaved(uid: string, activityId: string, saved: boolean): Promise<{ changed: boolean }>
  /** Cuáles de estos ids tiene guardados la persona. */
  savedAmong(uid: string, activityIds: string[]): Promise<string[]>
  /** `activities/{id}/visits/{uid}` + `analytics.visits`. Una por persona. */
  markVisited(uid: string, activityId: string): Promise<{ changed: boolean }>
  hasVisited(uid: string, activityId: string): Promise<boolean>
  /** Ids de actividades guardadas por la persona, las más recientes primero. */
  listSavedIds(uid: string, limit: number): Promise<string[]>
  /** Ids de actividades donde marcó «Yo fui», las más recientes primero. */
  listVisitedIds(uid: string, limit: number): Promise<string[]>
  /** Vista o acción medida desde el navegador (sin datos personales), con el canal de origen. */
  recordTrack(activityId: string, type: ActivityTrackType, day: string, source: TrafficSource): Promise<void>
}
