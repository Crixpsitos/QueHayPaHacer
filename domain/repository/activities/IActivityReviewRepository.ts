import type { ActivityRating } from "@/domain/entities/activities/Activity"
import type { ActivityReview, ReviewFlag } from "@/domain/entities/activities/review/ActivityReview"

/**
 * Reseñas (`activityReviews/{activityId}_{uid}`, primer nivel). Cada cambio y el agregado `rating` de la actividad van en UNA
 * transacción: doble envío o dos pestañas = un solo cambio.
 */
export interface IActivityReviewRepository {
  get(activityId: string, uid: string): Promise<ActivityReview | null>
  /** Crea o reemplaza la reseña de esa persona y ajusta `rating` de la actividad. `created` = false si era edición. */
  save(review: ActivityReview): Promise<{ created: boolean; rating: ActivityRating }>
  /** Borra la reseña y ajusta `rating`. Lanza `FLAGGED` si está cuestionada (no se puede borrar mientras se verifica). */
  remove(activityId: string, uid: string): Promise<{ removed: boolean; rating: ActivityRating }>
  listByActivity(activityId: string, limit: number): Promise<ActivityReview[]>
  /** Reseñas de una persona desde `since` (antispam: tope diario y texto repetido). */
  listByAuthorSince(uid: string, since: Date): Promise<ActivityReview[]>
  getById(reviewId: string): Promise<ActivityReview | null>
  /** `published` → `flagged` con el cuestionamiento. false si ya no estaba publicada (carrera). */
  setFlag(reviewId: string, flag: ReviewFlag): Promise<boolean>
  /** Cuestionamientos abiertos (`flagged`) enviados por una cuenta o sobre una actividad. */
  countOpenFlags(filter: { by?: string; activityId?: string }): Promise<number>
  /** `flagged` → publicada (verificada) o removida; al remover, la reseña sale del promedio en la misma transacción. */
  resolveFlag(reviewId: string, r: { status: "published" | "removed"; resolution: "upheld" | "removed"; resolvedBy: string; at: Date }): Promise<{ review: ActivityReview; rating: ActivityRating } | null>
  /** Respuesta de quien organiza (una, editable) o null para quitarla. */
  setReply(reviewId: string, reply: { text: string; at: Date } | null): Promise<void>
  /** Cuestionamientos abiertos, los más antiguos primero (para QHPA). */
  listFlagged(limit: number): Promise<ActivityReview[]>
  /** Restituye una reseña retirada (apelación aceptada): vuelve a publicada y al promedio en la misma transacción. */
  restoreRemoved(reviewId: string): Promise<{ review: ActivityReview; rating: ActivityRating } | null>
}
