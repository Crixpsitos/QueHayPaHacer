import type { ReviewView } from "./reviewView"

export type ReviewFilter = "all" | "photos" | "5" | "recent"

/** Seguro para el navegador (sin node:crypto). */
export function filterReviews(list: ReviewView[], f: ReviewFilter): ReviewView[] {
  const byDate = (a: ReviewView, b: ReviewView) => b.createdAt - a.createdAt
  if (f === "photos") return list.filter((r) => r.photos.length > 0 || r.video).sort(byDate)
  if (f === "5") return list.filter((r) => r.rating === 5).sort(byDate)
  return [...list].sort(byDate)
}
