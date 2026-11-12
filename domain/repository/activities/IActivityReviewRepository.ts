import type { ActivityRating } from "@/domain/entities/activities/Activity"
import type { ActivityReview } from "@/domain/entities/activities/review/ActivityReview"

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
}
