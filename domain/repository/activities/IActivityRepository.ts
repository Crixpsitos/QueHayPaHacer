import type { Activity } from "@/domain/entities/activities/Activity"

/** Lo que las capas superiores necesitan de la persistencia de actividades. Opera con entidades de dominio. */
export interface IActivityRepository {
  findById(id: string): Promise<Activity | null>
  findBySlug(slug: string): Promise<Activity | null>
  slugExists(slug: string): Promise<boolean>
  /** Todas las actividades de una cuenta (el volumen por cuenta es pequeño; se ordena en memoria). */
  findByOwner(uid: string): Promise<Activity[]>
  /** Actividades de un sitio (sin filtrar visibilidad: el servicio la decide con el estado del sitio). */
  findBySite(siteId: string): Promise<Activity[]>
  /**
   * Candidatas a listado público: publicadas, aprobadas y activas (campo derivado `listable`, índice simple).
   * ponytail: sin orden ni cursor en la consulta (se ordena en memoria, tope `limit`); al pasar de ~500 actividades
   * públicas agregar índice compuesto (listable + nextOccurrenceAt) y paginar por cursor.
   */
  findListable(limit: number): Promise<Activity[]>
  /** Crea con id nuevo y devuelve la actividad guardada. */
  create(activity: Omit<Activity, "id">): Promise<Activity>
  /** Reemplaza el documento (set con merge desactivado: la actividad completa es la fuente). */
  save(activity: Activity): Promise<void>
}
