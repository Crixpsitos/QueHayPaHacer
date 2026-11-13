export interface ActivityRequestRow { key: string; uid: string; name: string; createdAt: number }

/** `activities/{id}/requests/{salida}_{uid}` (solo Admin SDK). */
export interface IActivityRequestRepository {
  /** Guarda la solicitud. Devuelve false si esa persona ya tenía una VIGENTE para esa salida (no se repite ni se vuelve a avisar). */
  put(activityId: string, row: ActivityRequestRow, ttlMs: number, now: number): Promise<boolean>
  list(activityId: string, limit: number): Promise<ActivityRequestRow[]>
}
