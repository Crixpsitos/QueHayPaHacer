import type { ActivityRating } from "@/domain/entities/activities/Activity"
import { canReview, publicAuthorName, reviewId, validateReviewInput, type ActivityReview, type ReviewInput } from "@/domain/entities/activities/review/ActivityReview"
import { reviewReceivedNotification } from "@/domain/entities/notification/messages"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"

const COOLDOWN_MS = 30_000
const MIN_ACCOUNT_AGE_MS = 10 * 60_000
const MAX_PER_DAY = 10
const DUPLICATE_WINDOW_MS = 7 * 86_400_000
const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")

export interface ReviewDeps {
  repo: IActivityReviewRepository
  /** Solo actividades PÚBLICAS; null si no existe o no es visible. `siteOwnerUid` = dueño del sitio vinculado. */
  getActivity: (id: string) => Promise<{ id: string; slug: string; title: string; ownerUid: string; siteOwnerUid: string | null } | null>
  getAccount: (uid: string) => Promise<{ displayName: string; photoURL: string; createdAt: Date } | null>
  notify: (uid: string, n: NewNotification, id?: string) => Promise<void>
  clock: () => Date
  legalVersion: string
  /** Borra un archivo de Storage por ruta (reseñas borradas: no deben quedar fotos huérfanas). Opcional. */
  deleteFile?: (path: string) => Promise<void>
  /** Último envío por persona (cooldown). Debe vivir a nivel de módulo en producción: el contenedor no se memoiza. */
  lastSubmit?: Map<string, number>
}

/** Crear, editar y borrar la propia reseña. La identidad llega del token: nunca del cliente. */
export class ActivityReviewService {
  private readonly last: Map<string, number>
  constructor(private readonly d: ReviewDeps) { this.last = d.lastSubmit ?? new Map() }

  async submit(uid: string, activityId: string, input: ReviewInput, extra: { media: ActivityMedia[]; coverIndex: number }): Promise<{ review: ActivityReview; created: boolean; rating: ActivityRating }> {
    if (!uid?.trim() || !activityId?.trim()) throw new Error("Falta la sesión o la actividad.")
    const now = this.d.clock()
    // Cooldown ANTES de cualquier espera: dos envíos casi simultáneos no pasan los dos.
    const prev = this.last.get(uid)
    if (prev !== undefined && now.getTime() - prev < COOLDOWN_MS) throw new Error("Espera unos segundos antes de enviar otra reseña.")
    this.last.set(uid, now.getTime())
    try {
      const a = await this.d.getActivity(activityId)
      if (!a) throw new Error("Esa actividad no existe.")
      const blocked = canReview(a, uid)
      if (blocked) throw new Error(blocked)
      const account = await this.d.getAccount(uid)
      if (!account) throw new Error("No encontramos tu cuenta.")
      if (now.getTime() - account.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) throw new Error("Tu cuenta es nueva: espera unos minutos para reseñar.")
      const error = validateReviewInput({ ...input, photos: extra.media.filter((m) => m.type === "image").length, video: extra.media.filter((m) => m.type === "video").length }, now)
      if (error) throw new Error(error)

      const existing = await this.d.repo.get(activityId, uid)
      if (existing?.status === "flagged") throw new Error("Tu reseña está en verificación: no se puede editar ahora.")
      if (!existing) {
        const recent = await this.d.repo.listByAuthorSince(uid, new Date(now.getTime() - DUPLICATE_WINDOW_MS))
        if (recent.filter((r) => r.createdAt.getTime() >= now.getTime() - 86_400_000).length >= MAX_PER_DAY) throw new Error("Llegaste al tope de reseñas por hoy. Vuelve mañana.")
        const body = norm(input.body)
        if (body && recent.some((r) => norm(r.body) === body)) throw new Error("Ese texto ya lo publicaste en otra actividad: escribe uno propio, no repetido.")
      }

      const review: ActivityReview = {
        id: reviewId(activityId, uid), activityId, uid,
        rating: input.rating, title: input.title.trim(), body: input.body.trim(), visitedAt: input.visitedAt,
        media: extra.media, coverIndex: Math.max(0, Math.min(extra.coverIndex, Math.max(0, extra.media.filter((m) => m.type === "image").length - 1))),
        author: { uid, displayName: publicAuthorName(account.displayName), photoURL: account.photoURL },
        status: extra.media.some((m) => m.status === "processing") ? "pendingMedia" : "published",
        flag: null, ownerReply: existing?.ownerReply ?? null,
        createdAt: existing?.createdAt ?? now, updatedAt: now, editedAt: existing ? now : null,
        declarationVersion: this.d.legalVersion,
      }
      const saved = await this.d.repo.save(review)
      if (saved.created) {
        await this.d.notify(a.ownerUid, reviewReceivedNotification({ title: a.title, slug: a.slug, rating: input.rating, who: review.author.displayName }), `review_${review.id}`).catch(() => undefined)
      }
      return { review, created: saved.created, rating: saved.rating }
    } catch (e) {
      // Si no se guardó nada, el cooldown no debe castigar a quien solo corrige un error.
      if (this.last.get(uid) === now.getTime()) this.last.delete(uid)
      throw e
    }
  }

  async remove(uid: string, activityId: string): Promise<{ removed: boolean }> {
    if (!uid?.trim() || !activityId?.trim()) throw new Error("Falta la sesión o la actividad.")
    try {
      const r = await this.d.repo.remove(activityId, uid)
      return { removed: r.removed }
    } catch (e) {
      if (e instanceof Error && e.message === "FLAGGED") throw new Error("Tu reseña está en verificación: no se puede borrar mientras tanto.")
      throw e
    }
  }

  /** Al eliminar la cuenta: se borran las reseñas (también las cuestionadas), el promedio se ajusta y se borran sus fotos y videos. */
  async eraseUser(uid: string): Promise<number> {
    if (!uid?.trim()) return 0
    const mine = await this.d.repo.listByAuthorSince(uid, new Date(0))
    let n = 0
    for (const r of mine) {
      const res = await this.d.repo.remove(r.activityId, uid, { force: true })
      if (!res.removed) continue
      n++
      for (const m of res.media) for (const path of [m.path, m.thumbnailPath]) if (path && this.d.deleteFile) await this.d.deleteFile(path).catch(() => undefined)
    }
    return n
  }

  getMine(uid: string, activityId: string): Promise<ActivityReview | null> {
    return this.d.repo.get(activityId, uid)
  }

  list(activityId: string, limit = 50): Promise<ActivityReview[]> {
    return this.d.repo.listByActivity(activityId, limit)
  }
}
