import type { IActivityEngagementRepository } from "@/domain/repository/activities/IActivityEngagementRepository"

const NOT_FOUND = "Esa actividad no existe."

/** Guardar y "Yo fui". Solo sobre actividades públicas (quitar de guardados siempre se puede). */
export class ActivityEngagementService {
  constructor(
    private readonly repo: IActivityEngagementRepository,
    private readonly isPublic: (activityId: string) => Promise<boolean>,
  ) {}

  private static ids(uid: string, activityId: string) {
    if (!uid?.trim() || !activityId?.trim()) throw new Error("uid y actividad son requeridos.")
  }

  async setSaved(uid: string, activityId: string, saved: boolean): Promise<void> {
    ActivityEngagementService.ids(uid, activityId)
    if (saved && !(await this.isPublic(activityId))) throw new Error(NOT_FOUND)
    await this.repo.setSaved(uid, activityId, saved)
  }

  async savedAmong(uid: string, activityIds: string[]): Promise<string[]> {
    if (!uid?.trim() || activityIds.length === 0) return []
    return this.repo.savedAmong(uid, activityIds)
  }

  async markVisited(uid: string, activityId: string): Promise<void> {
    ActivityEngagementService.ids(uid, activityId)
    if (!(await this.isPublic(activityId))) throw new Error(NOT_FOUND)
    await this.repo.markVisited(uid, activityId)
  }

  async hasVisited(uid: string, activityId: string): Promise<boolean> {
    if (!uid?.trim() || !activityId?.trim()) return false
    return this.repo.hasVisited(uid, activityId)
  }
}
