import type { Activity } from "@/domain/entities/activities/Activity"
import { describeSchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"

export type StatusKey = "draft" | "review" | "rejected" | "live" | "paused"

/** Estado que ve el creador en "Mis actividades". La pausa solo existe para lo ya publicado y aprobado. */
export function activityStatus(a: Pick<Activity, "publicationStatus" | "moderationStatus" | "isActive" | "rejectionReason">): { key: StatusKey; label: string; help: string } {
  if (a.publicationStatus !== "published") return { key: "draft", label: "Borrador", help: "Aún no la enviaste. Termina el asistente para publicarla." }
  if (a.moderationStatus === "rejected") return { key: "rejected", label: "Rechazada", help: a.rejectionReason ? `Motivo: ${a.rejectionReason}. Corrígela y vuelve a enviarla.` : "No la aprobamos. Corrígela y vuelve a enviarla." }
  if (a.moderationStatus === "pending") return { key: "review", label: "En revisión", help: "Solo la ves tú. Te avisamos por la campanita cuando salga publicada." }
  return a.isActive ? { key: "live", label: "Publicada", help: "La gente ya la ve en Qué Hay Pa Hacer." } : { key: "paused", label: "Pausada", help: "No aparece en listados. Puedes reactivarla cuando quieras." }
}

export interface MyActivitySummary {
  id: string
  slug: string
  title: string
  coverUrl: string | null
  schedule: string
  status: { key: StatusKey; label: string; help: string }
  canToggleActive: boolean
  isActive: boolean
  /** Recibe reservas en QHPA: se muestra el acceso a "Reservas". */
  joinEnabled: boolean
}

export function toMySummary(a: Activity): MyActivitySummary {
  const cover = a.media.find((m) => m.type === "image" && m.isCover)
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    coverUrl: cover ? (cover.thumbnailUrl ?? cover.url) : null,
    schedule: describeSchedule(a.schedule),
    status: activityStatus(a),
    canToggleActive: a.publicationStatus === "published" && a.moderationStatus === "approved",
    isActive: a.isActive,
    joinEnabled: a.join !== null,
  }
}
