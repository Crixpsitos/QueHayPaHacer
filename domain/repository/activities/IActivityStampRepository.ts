export interface Stamp { activityId: string; at: Date; day: string }

/** Sellos del pasaporte: `users/{uid}/stamps/{activityId}` (privados) y el código del QR en `activities/{id}/private/stamp`. */
export interface IActivityStampRepository {
  /** Código vigente del QR de esa actividad, o null si no se ha generado. */
  getToken(activityId: string): Promise<string | null>
  /** Crea el código si no existe (carrera segura) y devuelve el vigente. */
  ensureToken(activityId: string, candidate: string): Promise<string>
  /** Guarda el sello; `created` = false si ya estaba (una sola vez por actividad). */
  collect(uid: string, stamp: Stamp): Promise<{ created: boolean }>
  countOnDay(uid: string, day: string): Promise<number>
  listMine(uid: string, limit: number): Promise<Stamp[]>
}
