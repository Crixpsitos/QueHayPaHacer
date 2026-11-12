import { activityPublishError, type Activity, type ActivityHost, type ActivityModerationStatus, type ActivityPublicationStatus } from "@/domain/entities/activities/Activity"
import { requiresManualReview } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { mediaOwnershipError, mergeMedia, type ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { slugifyActivity, uniqueSlug } from "@/domain/entities/activities/slug"
import { canCreateForSite, canManageActivity } from "@/domain/entities/activities/permissions"
import { isTrustedHost, needsReReview } from "@/domain/entities/activities/trust"
import type { HostGate } from "@/domain/entities/activities/HostIdentity"
import { normalizeText, spamGuardError } from "@/domain/entities/spamGuard/spamGuard"
import { DECLARATION_ERROR, hasDeclared } from "@/app/lib/legal/declaration"
import type { ActivityInput } from "@/application/dto/activities/ActivityDto"
import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"
import type { IActivityAccountRepository } from "@/domain/repository/activities/IActivityAccountRepository"

/** Lo que se necesita saber del sitio al vincular una actividad. */
export interface SiteLinkSnapshot {
  name: string
  slug: string
  authorId: string | null
  published: boolean
  active: boolean
  /** Publicado como dueño y aprobado (`isLinkableSite`): condición para vincularle actividades. */
  linkable: boolean
}

/** Identidad de quien actúa: SIEMPRE sale de la sesión del servidor, nunca del cliente. */
export interface PublishCtx {
  uid: string
  isAdmin: boolean
  /** ms epoch de creación de la cuenta (Firebase Auth); ausente = no se comprueba la antigüedad. */
  accountCreatedAt?: number
}

export interface SaveRequest {
  /** Ausente = actividad nueva (solo borrador: los medios viven bajo el id, que aún no existe). */
  id?: string
  input: ActivityInput
  media: ActivityMedia[]
  publish: boolean
  declaration: boolean
}

export type SaveResult =
  | { ok: true; id: string; slug: string; publicationStatus: ActivityPublicationStatus; moderationStatus: ActivityModerationStatus }
  | { ok: false; error: string }

export interface PublishDeps {
  repo: IActivityRepository
  accounts: IActivityAccountRepository
  siteSnapshot: (siteId: string) => Promise<SiteLinkSnapshot | null>
  hostGate: (uid: string) => Promise<HostGate>
  /** Evidencia de la declaración del autor (contentDeclarations). Lanza si no se pudo guardar. */
  declare: (uid: string, activityId: string) => Promise<void>
  /** Pasa a la cuenta a `creator` (como al publicar un evento o un sitio). */
  markCreator: (uid: string) => Promise<void>
  hostProfile: (uid: string) => Promise<{ displayName: string; photoURL: string }>
  clock: () => Date
  /** Log estructurado (alertas a QHPA por Cloud Logging). */
  log: (entry: object) => void
}

const GENERIC = "No se pudo guardar la actividad."
const fail = (error: string): SaveResult => ({ ok: false, error })

export class ActivityPublishService {
  constructor(private readonly d: PublishDeps) {}

  async save(ctx: PublishCtx, req: SaveRequest): Promise<SaveResult> {
    const now = this.d.clock()
    if (req.publish && !hasDeclared(req.declaration)) return fail(DECLARATION_ERROR)

    const existing = req.id ? await this.d.repo.findById(req.id) : null
    if (req.id && (!existing || !canManageActivity(existing, ctx))) return fail(GENERIC)
    if (!existing && req.media.length) return fail("Guarda el borrador primero y luego sube las fotos.")

    // D12: solo el autor del sitio (o QHPA) vincula actividades a ese sitio. Error genérico: no revelar si el sitio existe.
    if (req.input.siteId) {
      const site = await this.d.siteSnapshot(req.input.siteId)
      if (!site || !canCreateForSite({ uid: ctx.uid, siteAuthorUid: site.authorId, siteExists: true, siteLinkable: site.linkable, isAdmin: ctx.isAdmin })) return fail(GENERIC)
    }
    if (existing) {
      const mediaErr = mediaOwnershipError(existing.id, req.media)
      if (mediaErr) return fail(mediaErr)
    }

    const history = ctx.isAdmin ? null : await this.d.accounts.get(ctx.uid)
    const trusted = ctx.isAdmin || (history !== null && isTrustedHost(history, now.getTime()))

    if (!existing && !ctx.isAdmin) {
      const mine = await this.d.repo.findByOwner(ctx.uid)
      const blocked = spamGuardError({
        kind: "activity",
        recent: mine.map((a) => ({ at: a.createdAt.getTime(), text: normalizeText(`${a.title} ${a.description}`) })),
        now: now.getTime(),
        text: `${req.input.title} ${req.input.description}`,
        accountCreatedAt: ctx.accountCreatedAt,
        pendingCount: mine.filter((a) => a.publicationStatus === "published" && a.moderationStatus === "pending").length,
      })
      if (blocked) return fail(blocked)
    }

    const firstPublish = req.publish && existing?.publicationStatus !== "published"
    if (req.publish && !ctx.isAdmin) {
      const gate = await this.d.hostGate(ctx.uid)
      if (!gate.ok) return fail(gate.message)
    }

    const publication: ActivityPublicationStatus = req.publish || existing?.publicationStatus === "published" ? "published" : "draft"
    const base: Omit<Activity, "id"> = existing
      ? { ...existing }
      : await this.blank(ctx, req.input, now)
    const next: Omit<Activity, "id"> = {
      ...base,
      title: req.input.title,
      tagline: req.input.tagline,
      description: req.input.description,
      kind: req.input.siteId ? "site" : "global",
      siteId: req.input.siteId,
      category: req.input.category,
      companions: req.input.companions,
      difficulty: req.input.difficulty,
      durationMinutes: req.input.durationMinutes,
      ageNote: req.input.ageNote,
      meetingPoint: req.input.meetingPoint,
      schedule: req.input.schedule,
      priceOptions: req.input.priceOptions,
      extras: req.input.extras,
      sections: req.input.sections,
      offerings: req.input.offerings,
      spaces: req.input.spaces,
      cta: req.input.cta,
      join: req.input.join ? { capacity: req.input.join.capacity, closed: existing?.join?.closed ?? false, payInstructions: req.input.join.payInstructions } : null,
      // El optimizador de ../functions también escribe `media[]`: se combina con lo guardado en vez de pisarlo.
      media: existing ? mergeMedia(existing.media, req.media) : [],
      publicationStatus: publication,
      updatedAt: now,
    }

    // Moderación (spec 6.1): admin y cuentas de confianza se autoaprueban, salvo la categoría "otros".
    let moderation: ActivityModerationStatus = existing?.moderationStatus ?? "pending"
    const autoApprove = (ctx.isAdmin || trusted) && !(requiresManualReview(next.category) && !ctx.isAdmin)
    if (publication === "published") {
      if (firstPublish || existing?.moderationStatus === "rejected") moderation = autoApprove ? "approved" : "pending"
      else if (existing?.moderationStatus === "approved" && !ctx.isAdmin && (needsReReview(existing, next, trusted) || (requiresManualReview(next.category) && !requiresManualReview(existing.category)))) moderation = "pending"
    }
    const approvedNow = moderation === "approved" && existing?.moderationStatus !== "approved"
    const pendingNow = publication === "published" && moderation === "pending" && (firstPublish || existing?.moderationStatus !== "pending")
    const finalActivity: Omit<Activity, "id"> = {
      ...next,
      moderationStatus: moderation,
      publishedAt: publication === "published" ? (existing?.publishedAt ?? now) : null,
      ...(approvedNow ? { reviewedAt: now, reviewedBy: ctx.isAdmin ? ctx.uid : "auto", rejectedAt: null, rejectionReason: null } : {}),
      ...(moderation === "pending" && existing?.moderationStatus === "rejected" ? { rejectedAt: null, rejectionReason: null } : {}),
    }

    if (publication === "published") {
      const err = activityPublishError({ ...finalActivity, id: existing?.id ?? "" })
      if (err) return fail(err)
    }

    let saved: Activity
    if (existing) {
      // Evidencia ANTES de publicar: si falla, no queda publicada.
      if (firstPublish) await this.d.declare(ctx.uid, existing.id)
      saved = { ...finalActivity, id: existing.id }
      await this.d.repo.save(saved)
    } else {
      saved = await this.d.repo.create(finalActivity)
    }

    if (firstPublish) {
      try {
        await this.d.markCreator(ctx.uid)
      } catch (e) {
        console.error("[activities] no se pudo marcar al autor como creador:", e instanceof Error ? e.message : "error")
      }
    }
    if (approvedNow && !ctx.isAdmin) await this.d.accounts.recordApproved(ctx.uid)
    if (pendingNow) this.d.log({ alert: "qhpa_new_activity", activityId: saved.id, ownerUid: ctx.uid, title: saved.title.slice(0, 80) })

    return { ok: true, id: saved.id, slug: saved.slug, publicationStatus: saved.publicationStatus, moderationStatus: saved.moderationStatus }
  }

  async setActive(ctx: PublishCtx, id: string, active: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
    const a = await this.d.repo.findById(id)
    if (!a || !canManageActivity(a, ctx)) return fail(GENERIC)
    await this.d.repo.save({ ...a, isActive: active, updatedAt: this.d.clock() })
    return { ok: true }
  }

  private async blank(ctx: PublishCtx, input: ActivityInput, now: Date): Promise<Omit<Activity, "id">> {
    const profile = await this.d.hostProfile(ctx.uid)
    const host: ActivityHost = { kind: "user", id: ctx.uid, displayName: profile.displayName, photoURL: profile.photoURL }
    return {
      slug: await uniqueSlug(slugifyActivity(input.title), (s) => this.d.repo.slugExists(s)),
      title: "", tagline: "", description: "", kind: "global", siteId: null, host, ownerUid: ctx.uid, category: input.category,
      companions: [], difficulty: null, durationMinutes: null, ageNote: "", meetingPoint: input.meetingPoint, schedule: input.schedule,
      priceOptions: [], extras: [], sections: [], offerings: [], spaces: [], cta: null, join: null, media: [],
      rating: { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] },
      analytics: { views: 0, clicks: 0, visits: 0, reviews: 0, saves: 0 },
      publicationStatus: "draft", moderationStatus: "pending", isActive: true,
      reviewedAt: null, reviewedBy: null, rejectedAt: null, rejectionReason: null,
      createdAt: now, updatedAt: now, publishedAt: null,
    }
  }
}
