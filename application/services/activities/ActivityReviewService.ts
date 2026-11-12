import type { ActivityRating } from "@/domain/entities/activities/Activity"
import { canReview, containsContactInfo, publicAuthorName, validateReviewInput, type ActivityReview, type ReviewInput } from "@/domain/entities/activities/review/ActivityReview"
import { reviewId } from "@/domain/entities/activities/review/reviewIdentity"
import { reviewReceivedNotification } from "@/domain/entities/notification/messages"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { mediaOwnershipError, mergeMedia, parseMediaInput, type ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"
import type { IRateLimitRepository } from "@/domain/repository/rateLimit/IRateLimitRepository"
import { InMemoryRateLimit } from "@/application/services/rateLimit/InMemoryRateLimit"

const COOLDOWN_MS = 30_000
const MIN_ACCOUNT_AGE_MS = 10 * 60_000
const MAX_PER_DAY = 10
const DUPLICATE_WINDOW_MS = 7 * 86_400_000
const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")

export interface ReviewDeps {
  repo: IActivityReviewRepository
  /** Solo actividades PÚBLICAS; null si no existe o no es visible. `siteOwnerUid` = dueño del sitio vinculado. */
  getActivity: (id: string) => Promise<{ id: string; slug: string; title: string; ownerUid: string; siteOwnerUid: string | null; /** Sitio al que cuenta la reseña. */ siteId?: string | null; /** Ruta base de la ficha (por defecto /actividades). */ base?: string } | null>
  getAccount: (uid: string) => Promise<{ displayName: string; photoURL: string; createdAt: Date } | null>
  notify: (uid: string, n: NewNotification, id?: string) => Promise<void>
  clock: () => Date
  legalVersion: string
  /** Borra un archivo de Storage por ruta (reseñas borradas: no deben quedar fotos huérfanas). Opcional. */
  deleteFile?: (path: string) => Promise<void>
  /** ¿La cuenta tiene una restricción o suspensión de reseñas vigente? (sanciones de QHPA) */
  isRestricted?: (uid: string) => Promise<boolean>
  /** Tras publicar una reseña NUEVA (insignia «Primera historia»). Un fallo aquí nunca rompe la reseña. */
  afterCreate?: (uid: string) => Promise<void>
  /** Cooldown entre envíos. En producción vive en la base (vale entre instancias); sin esto, en memoria. */
  rateLimit?: IRateLimitRepository
}

/** Crear, editar y borrar la propia reseña. La identidad llega del token: nunca del cliente. */
export class ActivityReviewService {
  private readonly limit: IRateLimitRepository
  constructor(private readonly d: ReviewDeps) { this.limit = d.rateLimit ?? new InMemoryRateLimit() }

  async submit(uid: string, activityId: string, input: ReviewInput, extra: { media: ActivityMedia[]; coverIndex: number }): Promise<{ review: ActivityReview; created: boolean; rating: ActivityRating }> {
    if (!uid?.trim() || !activityId?.trim()) throw new Error("Falta la sesión o la actividad.")
    const now = this.d.clock()
    // Cooldown ANTES de cualquier espera: dos envíos casi simultáneos no pasan los dos.
    const cooldownKey = `review_submit_${uid}`
    if (!(await this.limit.tryHit(cooldownKey, COOLDOWN_MS, now))) throw new Error("Espera unos segundos antes de enviar otra reseña.")
    try {
      const a = await this.d.getActivity(activityId)
      if (!a) throw new Error("Eso ya no existe.")
      const blocked = canReview(a, uid)
      if (blocked) throw new Error(blocked)
      if (this.d.isRestricted && (await this.d.isRestricted(uid))) throw new Error("Por ahora no puedes reseñar: tu cuenta tiene una restricción.")
      const account = await this.d.getAccount(uid)
      if (!account) throw new Error("No encontramos tu cuenta.")
      if (now.getTime() - account.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) throw new Error("Tu cuenta es nueva: espera unos minutos para reseñar.")
      const id = reviewId(activityId, uid)
      const existing = await this.d.repo.get(activityId, uid)
      if (existing?.status === "flagged") throw new Error("Tu reseña está en verificación: no se puede editar ahora.")
      if (existing?.status === "removed") throw new Error("Tu reseña fue retirada. Si crees que fue un error, puedes apelar una vez.")
      // Los medios llegan del cliente: se limpian, solo valen los de la carpeta de ESTA reseña y el estado lo fija el servidor.
      const media = mergeMedia(existing?.media ?? [], parseMediaInput(extra.media))
      const ownership = mediaOwnershipError(id, media.filter((m) => !(existing?.media ?? []).some((e) => e.id === m.id)), "activityReviews")
      if (ownership) throw new Error(ownership)
      const error = validateReviewInput({ ...input, photos: media.filter((m) => m.type === "image").length, video: media.filter((m) => m.type === "video").length }, now)
      if (error) throw new Error(error)
      if (!existing) {
        const recent = await this.d.repo.listByAuthorSince(uid, new Date(now.getTime() - DUPLICATE_WINDOW_MS))
        if (recent.filter((r) => r.createdAt.getTime() >= now.getTime() - 86_400_000).length >= MAX_PER_DAY) throw new Error("Llegaste al tope de reseñas por hoy. Vuelve mañana.")
        const body = norm(input.body)
        if (body && recent.some((r) => norm(r.body) === body)) throw new Error("Ese texto ya lo publicaste en otra actividad: escribe uno propio, no repetido.")
      }

      const review: ActivityReview = {
        id, activityId, uid, siteId: a.siteId ?? null, subjectTitle: a.title, subjectSlug: a.slug,
        rating: input.rating, title: input.title.trim(), body: input.body.trim(), visitedAt: input.visitedAt,
        media, coverIndex: Math.max(0, Math.min(extra.coverIndex, Math.max(0, media.filter((m) => m.type === "image").length - 1))),
        author: { uid, displayName: publicAuthorName(account.displayName), photoURL: account.photoURL },
        status: media.some((m) => m.status === "processing") ? "pendingMedia" : "published",
        flag: null, ownerReply: existing?.ownerReply ?? null,
        createdAt: existing?.createdAt ?? now, updatedAt: now, editedAt: existing ? now : null,
        declarationVersion: this.d.legalVersion,
      }
      const saved = await this.d.repo.save(review)
      // Medios que la persona quitó al editar: se borran del almacenamiento (no quedan fotos públicas huérfanas).
      for (const old of existing?.media ?? []) if (!media.some((m) => m.id === old.id)) await this.removeFiles([old])
      if (saved.created) {
        await this.d.afterCreate?.(uid).catch(() => undefined)
        await this.d.notify(a.ownerUid, reviewReceivedNotification({ title: a.title, slug: a.slug, rating: input.rating, who: review.author.displayName, base: a.base }), `review_${review.id}`).catch(() => undefined)
      }
      return { review, created: saved.created, rating: saved.rating }
    } catch (e) {
      // Si no se guardó nada, el cooldown no debe castigar a quien solo corrige un error.
      await this.limit.release(cooldownKey).catch(() => undefined)
      throw e
    }
  }

  private async removeFiles(media: { path: string; thumbnailPath?: string }[]): Promise<void> {
    if (!this.d.deleteFile) return
    for (const m of media) for (const path of [m.path, m.thumbnailPath]) if (path) await this.d.deleteFile(path).catch(() => undefined)
  }

  async remove(uid: string, activityId: string): Promise<{ removed: boolean }> {
    if (!uid?.trim() || !activityId?.trim()) throw new Error("Falta la sesión o la actividad.")
    try {
      const r = await this.d.repo.remove(activityId, uid)
      await this.removeFiles(r.media.map((m) => ({ path: m.path, thumbnailPath: m.thumbnailPath })))
      return { removed: r.removed }
    } catch (e) {
      if (e instanceof Error && e.message === "FLAGGED") throw new Error("Tu reseña está en verificación: no se puede borrar mientras tanto.")
      throw e
    }
  }

  /** Al eliminar la cuenta: se borran las reseñas (también las cuestionadas), el promedio se ajusta y se borran sus fotos y videos. */
  async eraseUser(uid: string): Promise<number> {
    if (!uid?.trim()) return 0
    let n = 0
    const anonymized = new Set<string>()
    // De a lotes hasta que no quede ninguna (el repositorio devuelve máximo 200 por consulta).
    for (let round = 0; round < 50; round++) {
      const mine = (await this.d.repo.listByAuthorSince(uid, new Date(0))).filter((r) => !anonymized.has(r.id))
      if (!mine.length) break
      for (const r of mine) {
        // En verificación: no se borra (evitaría la sanción); se anonimiza y se quitan fotos/video, y QHPA la resuelve igual.
        if (r.status === "flagged") {
          const media = await this.d.repo.anonymize(r.activityId, uid)
          await this.removeFiles(media)
          anonymized.add(r.id)
          n++
          continue
        }
        const res = await this.d.repo.remove(r.activityId, uid, { force: true })
        if (!res.removed) continue
        n++
        await this.removeFiles(res.media)
      }
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
