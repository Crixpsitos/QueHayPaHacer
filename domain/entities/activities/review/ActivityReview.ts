import type { ActivityRating } from "../Activity"
import type { ActivityMedia } from "../value-objects/ActivityMedia"

export const REVIEW_TITLE_MAX = 80
export const REVIEW_BODY_MIN = 10
export const REVIEW_BODY_MAX = 1500
export const REVIEW_PHOTOS_MAX = 3
export const REVIEW_VIDEO_MAX = 1
export const REVIEW_WINDOW_MONTHS = 24

export type ReviewStatus = "published" | "flagged" | "removed" | "pendingMedia"

export interface ReviewInput {
  rating: number
  title: string
  body: string
  /** "YYYY-MM" (o "YYYY-MM-DD"): cuándo fue. */
  visitedAt: string
  photos: number
  video: number
}

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|app|io|me|ly|info|biz)\b)/i
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
/** Una racha de dígitos con separadores (espacios, puntos, guiones, paréntesis) de 10 dígitos o más es un teléfono. */
const DIGIT_RUN_RE = /\+?\d[\d\s.\-()]{8,}\d/g

/** Enlaces, correos o teléfonos: no se aceptan en reseñas (spam y datos personales de terceros). */
export function containsContactInfo(text: string): boolean {
  if (URL_RE.test(text) || EMAIL_RE.test(text)) return true
  return (text.match(DIGIT_RUN_RE) ?? []).some((run) => run.replace(/\D/g, "").length >= 10)
}

const monthIndex = (iso: string): number | null => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(iso)
  if (!m) return null
  const mo = Number(m[2])
  return mo >= 1 && mo <= 12 ? Number(m[1]) * 12 + (mo - 1) : null
}

/** Mensaje de error (español) o null si la reseña se puede guardar. */
export function validateReviewInput(r: ReviewInput, now: Date): string | null {
  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) return "Elige de 1 a 5 estrellas."
  if (r.title.length > REVIEW_TITLE_MAX) return `El título admite máximo ${REVIEW_TITLE_MAX} caracteres.`
  const body = r.body.trim()
  if (body.length > 0 && body.length < REVIEW_BODY_MIN) return `Si escribes algo, que tenga al menos ${REVIEW_BODY_MIN} caracteres.`
  if (body.length > REVIEW_BODY_MAX) return `El texto admite máximo ${REVIEW_BODY_MAX} caracteres.`
  if (containsContactInfo(`${r.title} ${body}`)) return "No se pueden incluir enlaces, correos ni teléfonos."
  const idx = monthIndex(r.visitedAt)
  if (idx === null) return "Indica el mes en que fuiste."
  const t = new Date(now.getTime() - 5 * 3_600_000)
  const cur = t.getUTCFullYear() * 12 + t.getUTCMonth()
  if (idx > cur) return "La fecha de la visita no puede ser futura."
  if (cur - idx > REVIEW_WINDOW_MONTHS) return "Solo se reseñan visitas de los últimos 24 meses."
  if (/^\d{4}-\d{2}-\d{2}$/.test(r.visitedAt) && r.visitedAt > t.toISOString().slice(0, 10)) return "La fecha de la visita no puede ser futura."
  if (!Number.isInteger(r.photos) || r.photos < 0 || r.photos > REVIEW_PHOTOS_MAX) return `Máximo ${REVIEW_PHOTOS_MAX} fotos.`
  if (!Number.isInteger(r.video) || r.video < 0 || r.video > REVIEW_VIDEO_MAX) return "Máximo 1 video."
  return null
}

export type RatingOp = { type: "add"; rating: number } | { type: "remove"; rating: number } | { type: "edit"; from: number; to: number }

const bump = (dist: ActivityRating["dist"], star: number, by: number): ActivityRating["dist"] => {
  const d = [...dist] as ActivityRating["dist"]
  d[star - 1] = Math.max(0, d[star - 1] + by)
  return d
}

/** Aplica crear / editar / borrar-remover a los agregados de la actividad. No muta; nunca deja negativos. */
export function applyReviewToRating(r: ActivityRating, op: RatingOp): ActivityRating {
  let { count, sum } = r
  let dist = r.dist
  if (op.type === "add") { count += 1; sum += op.rating; dist = bump(dist, op.rating, 1) }
  else if (op.type === "remove") {
    if (r.dist[op.rating - 1] === 0) return { ...r, dist: [...r.dist] as ActivityRating["dist"] }
    count = Math.max(0, count - 1); sum = Math.max(0, sum - op.rating); dist = bump(dist, op.rating, -1)
  } else { sum = sum - op.from + op.to; dist = bump(bump(dist, op.from, -1), op.to, 1) }
  return { count, sum, avg: count ? Math.round((sum / count) * 100) / 100 : 0, dist }
}

/** Para el encabezado de reseñas: promedio con coma y a 1 decimal (null sin reseñas) y porcentaje por estrella. */
export function ratingSummary(r: ActivityRating): { average: string | null; count: number; percent: [number, number, number, number, number] } {
  const percent = r.dist.map((d) => (r.count ? Math.round((d / r.count) * 100) : 0)) as [number, number, number, number, number]
  return { average: r.count ? (r.sum / r.count).toFixed(1).replace(".", ",") : null, count: r.count, percent }
}

/** «Ana P.»: primer nombre + inicial del primer apellido. Nunca un correo ni vacío. */
export function publicAuthorName(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean)
  if (!words.length || displayName.includes("@")) return "Anónimo"
  const surname = words.length >= 4 ? words[2] : words[1]
  return surname ? `${words[0]} ${surname.charAt(0).toUpperCase()}.` : words[0]
}

/** Quien publicó la actividad y el dueño del sitio no la reseñan (conflicto de interés). null = puede. */
export function canReview(a: { ownerUid: string; siteOwnerUid: string | null }, uid: string): string | null {
  if (uid === a.ownerUid) return "No puedes reseñar una actividad que publicaste."
  if (a.siteOwnerUid && uid === a.siteOwnerUid) return "No puedes reseñar una actividad de tu propio sitio."
  return null
}

export interface ReviewFlag { by: string; reason: string; note: string; at: Date; resolution?: "upheld" | "removed"; resolvedAt?: Date; resolvedBy?: string }

/** Reseña guardada (`activityReviews/{activityId}_{uid}`). El correo nunca se guarda aquí. */
export interface ActivityReview {
  /** `{activityId}_{uid}` */
  id: string
  activityId: string
  uid: string
  rating: number
  title: string
  body: string
  visitedAt: string
  media: ActivityMedia[]
  coverIndex: number
  author: { uid: string; displayName: string; photoURL: string }
  status: ReviewStatus
  flag: ReviewFlag | null
  ownerReply: { text: string; at: Date } | null
  createdAt: Date
  updatedAt: Date
  editedAt: Date | null
  declarationVersion: string
}

