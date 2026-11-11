import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"
import type { IActivityAccountRepository } from "@/domain/repository/activities/IActivityAccountRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { activityModerationNotification } from "@/domain/entities/notification/messages"

type Result = { ok: true } | { ok: false; error: string }

export interface PendingRow {
  id: string
  slug: string
  title: string
  ownerUid: string
  category: string
  ageHours: number
}

export interface ModerationDeps {
  repo: IActivityRepository
  accounts: IActivityAccountRepository
  /** Avisa por la campanita; nunca debe lanzar (NotificationService.notify ya lo garantiza). */
  notify: (uid: string, n: NewNotification) => Promise<void>
  clock: () => Date
}

/**
 * Revisión de QHPA de actividades que esperan (spec 8.2). `adminUid` lo pone quien invoca (el script o una acción
 * de admin ya autenticada). ponytail: el cambio de estado y el contador de aprobadas no van en una sola transacción;
 * la guarda de estado evita aprobar dos veces la misma actividad.
 */
export class ActivityModerationService {
  constructor(private readonly d: ModerationDeps) {}

  async listPending(limit: number): Promise<PendingRow[]> {
    const now = this.d.clock().getTime()
    const rows = await this.d.repo.findPendingReview(limit)
    return rows
      .map((a) => ({ id: a.id, slug: a.slug, title: a.title, ownerUid: a.ownerUid, category: a.category, ageHours: Math.max(0, Math.round((now - (a.publishedAt ?? a.createdAt).getTime()) / 3_600_000)) }))
      .sort((x, y) => y.ageHours - x.ageHours)
  }

  async approve(id: string, adminUid: string): Promise<Result> {
    const a = await this.d.repo.findById(id)
    if (!a) return { ok: false, error: "No existe la actividad." }
    if (a.publicationStatus !== "published" || a.moderationStatus !== "pending") return { ok: false, error: "Esta actividad no está en revisión." }
    const now = this.d.clock()
    await this.d.repo.save({ ...a, moderationStatus: "approved", reviewedAt: now, reviewedBy: adminUid, rejectedAt: null, rejectionReason: null, updatedAt: now })
    await this.d.accounts.recordApproved(a.ownerUid)
    await this.d.notify(a.ownerUid, activityModerationNotification({ title: a.title, slug: a.slug, approved: true }))
    return { ok: true }
  }

  async reject(id: string, adminUid: string, reason: string): Promise<Result> {
    const why = (reason ?? "").trim()
    if (why.length < 5) return { ok: false, error: "Escribe el motivo del rechazo (mínimo 5 caracteres)." }
    const a = await this.d.repo.findById(id)
    if (!a) return { ok: false, error: "No existe la actividad." }
    if (a.publicationStatus !== "published" || a.moderationStatus !== "pending") return { ok: false, error: "Esta actividad no está en revisión." }
    const now = this.d.clock()
    await this.d.repo.save({ ...a, moderationStatus: "rejected", reviewedAt: now, reviewedBy: adminUid, rejectedAt: now, rejectionReason: why.slice(0, 300), updatedAt: now })
    await this.d.notify(a.ownerUid, activityModerationNotification({ title: a.title, slug: a.slug, approved: false, reason: why.slice(0, 300) }))
    return { ok: true }
  }
}
