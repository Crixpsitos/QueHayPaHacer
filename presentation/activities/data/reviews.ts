import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { ratingSummary } from "@/domain/entities/activities/review/ActivityReview"
import { toReviewView, type ReviewView } from "@/presentation/activities/lib/reviewView"

export interface ReviewsData {
  summary: { average: string | null; count: number; percent: [number, number, number, number, number] }
  reviews: ReviewView[]
}

/** Reseñas públicas de una actividad (sin uid ni correo). Se invalida con `activity-reviews-<id>` al reseñar o borrar. */
export const fetchReviews = async (activityId: string): Promise<ReviewsData> => {
  "use cache"
  cacheLife("minutes")
  cacheTag(`activity-reviews-${activityId}`)
  const c = createServerContainer()
  const [a, list] = await Promise.all([c.activityService.getPublicById(activityId), c.activityReviewService.list(activityId, 100)])
  return { summary: ratingSummary(a?.rating ?? { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] }), reviews: list.map(toReviewView) }
}
