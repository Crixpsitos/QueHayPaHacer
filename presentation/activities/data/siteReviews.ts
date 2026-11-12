import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { ratingSummary } from "@/domain/entities/activities/review/ActivityReview"
import { siteSubject } from "@/domain/entities/activities/review/subject"
import { toReviewView } from "@/presentation/activities/lib/reviewView"
import type { ReviewsData } from "./reviews"

/** Reseñas que cuentan para un sitio: las del sitio y las de sus actividades. Se invalida con `site-reviews-<id>`. */
export const fetchSiteReviews = async (siteId: string): Promise<ReviewsData & { subjectId: string }> => {
  "use cache"
  cacheLife("minutes")
  cacheTag(`site-reviews-${siteId}`)
  const c = createServerContainer()
  const [rating, list] = await Promise.all([c.sitesService.getReviewRating(siteId), c.activityReviewRepo.listBySite(siteId, 100)])
  return { subjectId: siteSubject(siteId), summary: ratingSummary(rating ?? { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] }), reviews: list.map(toReviewView) }
}
