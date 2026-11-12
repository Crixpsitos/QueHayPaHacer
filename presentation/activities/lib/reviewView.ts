import { createHash } from "node:crypto"
import type { ActivityReview } from "@/domain/entities/activities/review/ActivityReview"

export type { ReviewFilter } from "./reviewFilters"

export interface ReviewView {
  /** Clave opaca para pedir acciones sobre esta reseña (nunca el uid ni el id del documento). */
  key: string
  name: string
  photoURL: string
  rating: number
  title: string
  body: string
  visitedLabel: string
  createdLabel: string
  createdAt: number
  photos: { url: string; alt: string }[]
  video: { url: string; thumbnailUrl: string | null } | null
  processingMedia: boolean
  inVerification: boolean
  verifiedByQhpa: boolean
  reply: { text: string } | null
}

/** Clave pública estable por reseña: no se puede invertir hasta el uid. */
export const reviewKey = (activityId: string, uid: string) => createHash("sha256").update(`${activityId}:${uid}`).digest("hex").slice(0, 20)

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
export const visitedLabel = (visitedAt: string) => { const [y, m] = visitedAt.split("-"); return `${MONTHS[Number(m) - 1] ?? ""} de ${y}` }
const dateLabel = (d: Date) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }).format(d)

/** Lo que ve cualquier visitante: sin uid, sin correo y solo los medios ya procesados. */
export function toReviewView(r: ActivityReview): ReviewView {
  const ready = r.media.filter((m) => m.status !== "processing" && m.status !== "error")
  const video = ready.find((m) => m.type === "video")
  return {
    key: reviewKey(r.activityId, r.uid),
    name: r.author.displayName,
    photoURL: r.author.photoURL,
    rating: r.rating,
    title: r.title,
    body: r.body,
    visitedLabel: visitedLabel(r.visitedAt),
    createdLabel: dateLabel(r.createdAt),
    createdAt: r.createdAt.getTime(),
    photos: ready.filter((m) => m.type === "image").map((m) => ({ url: m.thumbnailUrl ?? m.url, alt: m.alt })),
    video: video ? { url: video.url, thumbnailUrl: video.thumbnailUrl ?? null } : null,
    processingMedia: r.media.some((m) => m.status === "processing"),
    inVerification: r.status === "flagged",
    verifiedByQhpa: r.flag?.resolution === "upheld",
    reply: r.ownerReply ? { text: r.ownerReply.text } : null,
  }
}

export { filterReviews } from "./reviewFilters"
