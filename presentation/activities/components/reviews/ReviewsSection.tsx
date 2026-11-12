import { fetchReviews } from "@/presentation/activities/data/reviews"
import { ReviewsClient } from "./ReviewsClient"

/** Reseñas de la ficha (servidor): datos públicos ya listos; la interacción vive en `ReviewsClient`. */
export async function ReviewsSection({ activityId, categorySlug, visitedLabel }: { activityId: string; categorySlug: string; visitedLabel: string | null }) {
  const data = await fetchReviews(activityId)
  return <ReviewsClient activityId={activityId} categorySlug={categorySlug} data={data} visitedLabel={visitedLabel} />
}
