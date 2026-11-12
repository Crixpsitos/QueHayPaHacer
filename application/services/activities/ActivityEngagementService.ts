import type { ActivityTrackType } from "@/domain/entities/analytics/trackTypes"
import type { TrafficSource } from "@/domain/entities/analytics/trafficSource"
import type { IActivityEngagementRepository } from "@/domain/repository/activities/IActivityEngagementRepository"

const NOT_FOUND = "Esa actividad no existe."

/** Guardar y "Yo fui". Solo sobre actividades públicas (quitar de guardados siempre se puede). */
export class ActivityEngagementService {
  constructor(
    private readonly repo: IActivityEngagementRepository,
    private readonly isPublic: (activityId: string) => Promise<boolean>,
    /** Tras un «Yo fui» NUEVO (insignia «Explorador de Ibagué»). Un fallo aquí nunca rompe el «Yo fui». */
    private readonly afterVisit?: (uid: string) => Promise<void>,
  ) {}

  private static ids(uid: string, activityId: string) {
    if (!uid?.trim() || !activityId?.trim()) throw new Error("uid y actividad son requeridos.")
  }

  async setSaved(uid: string, activityId: string, saved: boolean): Promise<void> {
    ActivityEngagementService.ids(uid, activityId)
    if (saved && !(await this.isPublic(activityId))) throw new Error(NOT_FOUND)
    await this.repo.setSaved(uid, activityId, saved)
  }

  /** Elegir el día y la hora de ir (solo de lo guardado; el día dentro de los próximos 7). `today` = hoy en Bogotá. */
  async setPlanSlot(uid: string, activityId: string, slot: { date: string; time: string | null } | null, today: string): Promise<boolean> {
    ActivityEngagementService.ids(uid, activityId)
    if (slot) {
      const ms = Date.parse(`${slot.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !(ms >= 0 && ms <= 6 * 86_400_000)) throw new Error("Elige un día de esta semana.")
      if (slot.time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time)) throw new Error("La hora no es válida.")
    }
    return this.repo.setPlanSlot(uid, activityId, slot)
  }

  planSlots(uid: string) { return uid?.trim() ? this.repo.listPlanSlots(uid) : Promise.resolve({}) }

  async savedAmong(uid: string, activityIds: string[]): Promise<string[]> {
    if (!uid?.trim() || activityIds.length === 0) return []
    return this.repo.savedAmong(uid, activityIds)
  }

  async markVisited(uid: string, activityId: string): Promise<void> {
    ActivityEngagementService.ids(uid, activityId)
    if (!(await this.isPublic(activityId))) throw new Error(NOT_FOUND)
    const r = await this.repo.markVisited(uid, activityId)
    if (r.changed) await this.afterVisit?.(uid).catch(() => undefined)
  }

  recordTrack(activityId: string, type: ActivityTrackType, day: string, source: TrafficSource): Promise<void> {
    return this.repo.recordTrack(activityId, type, day, source)
  }

  async hasVisited(uid: string, activityId: string): Promise<boolean> {
    if (!uid?.trim() || !activityId?.trim()) return false
    return this.repo.hasVisited(uid, activityId)
  }
}
