import { fetchSiteReviews } from "@/presentation/activities/data/siteReviews"
import { ReviewsClient } from "./ReviewsClient"

/** Reseñas de la ficha de un sitio (servidor): las del sitio y las de sus actividades, con pestañas. */
export async function SiteReviewsSection({ siteId }: { siteId: string }) {
  const data = await fetchSiteReviews(siteId)
  return <ReviewsClient activityId={data.subjectId} categorySlug="other" data={data} visitedLabel={null} siteMode />
}
