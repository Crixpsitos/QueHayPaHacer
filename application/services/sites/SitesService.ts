import type { SitesAdapter } from "@/infraestructure/adapters/sites/SitesAdapter"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"
import type { FirebaseSiteDto } from "@/infraestructure/firebase/dto/sites/FirebaseSiteDto"
import type { SiteTransit } from "@/domain/entities/sites/value-objects/SiteTransit"
import type { SiteTrackType } from "@/domain/entities/sites/siteStats"
import { siteScore } from "@/domain/entities/sites/siteRanking"
import type { ClaimSiteSnapshot } from "@/domain/entities/siteClaim/SiteClaim"
import type { SiteEventState } from "@/domain/entities/sites/siteEventCount"
import type { SiteLinkSnapshot } from "@/domain/entities/sites/siteLink"
import { pickDiscoverIds } from "@/domain/entities/sites/siteDiscovery"

export type SiteInput = Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt">

/** Mutable content of a site — excludes slug/author/status/analytics/timestamps. */
function contentFields(data: SiteInput) {
  // update = set(merge) → omitir city/department/country vacíos conserva los guardados
  // (un form que no los trae no debe borrar la ubicación).
  const { city, department, country, ...location } = data.location
  return {
    name: data.name,
    category: data.category,
    description: data.description,
    location: {
      ...location,
      ...(city?.name ? { city } : {}),
      ...(department?.name ? { department } : {}),
      ...(country?.name ? { country } : {}),
    },
    media: data.media,
    schedule: data.schedule,
    socialMedia: data.socialMedia,
    temporarilyClosed: data.temporarilyClosed,
    openingPolicy: data.openingPolicy,
    listingComplete: data.listingComplete,
    recommendations: data.recommendations,
    bookingUrl: data.bookingUrl,
    // undefined = no tocar (merge); null = quitar el bloque
    ...(data.transit !== undefined ? { transit: data.transit } : {}),
    // publishedAs/verification NO se editan: respaldan la declaración ya registrada.
    kind: data.kind,
  }
}

/** Autor del doc — `author.uid` es la forma legacy. */
function authorIdOf(dto: FirebaseSiteDto): string | undefined {
  return dto.author?.id ?? (dto.author as { uid?: string } | undefined)?.uid
}

export class SitesService {
  constructor(private readonly adapter: SitesAdapter) {}

  /** Vista o clic de la ficha pública (ver app/api/sites/[id]/track). */
  recordTrack(id: string, type: SiteTrackType, day: string): Promise<void> {
    return this.adapter.recordTrack(id, type, day)
  }

  async getMySites(uid: string): Promise<SiteDetail[]> {
    return this.adapter.findDetailsByAuthorId(uid)
  }

  async saveDraft(data: SiteInput): Promise<string> {
    return this.adapter.createRaw({ ...data, publicationStatus: "draft" })
  }

  /** Merge only content fields into an existing doc — never touches status/analytics/slug/author. */
  async updateDraft(uid: string, id: string, data: SiteInput): Promise<void> {
    await this.assertOwner(uid, id)
    await this.adapter.updateRaw({ id, ...contentFields(data) } as FirebaseSiteDto)
    await this.recomputeScore(id)
  }

  /**
   * Recalcula `analytics.score` desde los contadores y `listingComplete` (ver siteRanking). Escribe solo si cambió.
   * Se llama al guardar un sitio y al registrar un "me gusta" o un compartido.
   */
  async recomputeScore(id: string): Promise<void> {
    const dto = await this.adapter.findRawById(id)
    if (!dto) return
    const score = siteScore(dto.analytics, dto.listingComplete)
    if (dto.analytics?.score === score) return
    await this.adapter.updateRaw({ id, analytics: { score } } as unknown as FirebaseSiteDto)
  }

  /**
   * Fija `analytics.eventCount` y su vencimiento (`eventCountValidUntil`, ver siteEventCount) y recalcula el score en la
   * misma escritura. Devuelve el autor del sitio si algo cambió (para invalidar sus cachés) y `null` si ya estaba al día
   * o no existe. `visible` = cambió el conteo o el puntaje (lo que se ve en listados); si solo se movió el vencimiento
   * no hace falta invalidar cachés. Un sitio sin el campo lo recibe (null) en el primer recuento, aunque no cambie nada más.
   */
  async setEventCount(id: string, state: SiteEventState): Promise<{ authorId: string | null; visible: boolean } | null> {
    const dto = await this.adapter.findRawById(id)
    if (!dto) return null
    const score = siteScore({ ...dto.analytics, eventCount: state.count }, dto.listingComplete)
    const storedUntil = dto.analytics?.eventCountValidUntil?.toDate?.()?.getTime() ?? null
    const nextUntil = state.validUntil?.getTime() ?? null
    const visible = dto.analytics?.eventCount !== state.count || dto.analytics?.score !== score
    const fieldMissing = dto.analytics?.eventCountValidUntil === undefined
    if (!visible && storedUntil === nextUntil && !fieldMissing) return null
    await this.adapter.updateRaw({
      id,
      analytics: { eventCount: state.count, score, eventCountValidUntil: state.validUntil },
    } as unknown as FirebaseSiteDto)
    return { authorId: authorIdOf(dto) ?? null, visible }
  }

  /** Para el barrido: sitios con el conteo vencido (más atrasado primero) y cuántos quedan. */
  findExpiredEventCounts(now: Date, limit: number) {
    return this.adapter.findExpiredEventCounts(now, limit)
  }

  countExpiredEventCounts(now: Date) {
    return this.adapter.countExpiredEventCounts(now)
  }

  /** Lo mínimo para decidir si un evento puede vincularse al sitio (ver domain/entities/sites/siteLink). */
  async getLinkSnapshot(id: string): Promise<SiteLinkSnapshot | null> {
    const dto = await this.adapter.findRawById(id)
    if (!dto) return null
    return {
      authorId: authorIdOf(dto) ?? null,
      // un doc antiguo sin estos campos se lee como el mapper: propuesto por la comunidad
      publishedAs: dto.publishedAs ?? "proposer",
      verification: dto.verification ?? "community",
      publicationStatus: dto.publicationStatus,
      moderationStatus: dto.moderationStatus,
    }
  }

  async publish(data: SiteInput): Promise<string> {
    return this.adapter.createRaw({ ...data, publicationStatus: "published", moderationStatus: "pending" })
  }

  /** Convert an existing (draft) doc into a published one — reuses its id, no new doc. */
  async publishExisting(uid: string, id: string, data: SiteInput): Promise<void> {
    const current = await this.assertOwner(uid, id)
    // el borrador nace con nombre vacío → slug "-xxxx"; se regenera al publicar
    const regenerateSlug = current.publicationStatus === "draft" || !current.slug || current.slug.startsWith("-")
    await this.adapter.updateRaw({
      id,
      ...contentFields(data),
      ...(regenerateSlug ? { slug: data.slug } : {}),
      publicationStatus: "published",
      moderationStatus: "pending",
      rejectionReason: null,
      rejectedAt: null,
    } as FirebaseSiteDto)
    await this.recomputeScore(id)
  }

  async updateSite(uid: string, id: string, data: SiteInput): Promise<void> {
    await this.assertOwner(uid, id)
    await this.adapter.updateRaw({ id, ...contentFields(data) } as FirebaseSiteDto)
    await this.recomputeScore(id)
  }

  /** Toggle public visibility — owner only. */
  async setActive(uid: string, id: string, active: boolean): Promise<void> {
    await this.assertOwner(uid, id)
    return this.adapter.updateRaw({ id, isActive: active } as FirebaseSiteDto)
  }

  /** Permanently remove a site — owner only. */
  async deleteSite(uid: string, id: string): Promise<void> {
    await this.assertOwner(uid, id)
    return this.adapter.deleteRaw(id)
  }

  async isOwner(uid: string, id: string): Promise<boolean> {
    const dto = await this.adapter.findRawById(id)
    return !!dto && authorIdOf(dto) === uid
  }

  /** Snapshot mínimo para reportes. */
  async getTitleAndAuthor(id: string): Promise<{ title: string; authorId: string | null } | null> {
    const dto = await this.adapter.findRawById(id)
    return dto ? { title: dto.name, authorId: authorIdOf(dto) ?? null } : null
  }

  /** Datos mínimos para los buses (guardar y reportar): autor, si es público y el bloque actual. */
  async getTransitSnapshot(id: string): Promise<{ name: string; authorId: string | null; isPublic: boolean; transit: SiteTransit | null } | null> {
    const dto = await this.adapter.findRawById(id)
    if (!dto) return null
    return {
      name: dto.name,
      authorId: authorIdOf(dto) ?? null,
      isPublic: dto.publicationStatus === "published" && dto.moderationStatus === "approved" && dto.isActive === true,
      transit: dto.transit ?? null,
    }
  }

  async getClaimSnapshot(id: string): Promise<ClaimSiteSnapshot | null> {
    const dto = await this.adapter.findRawById(id)
    if (!dto) return null
    return { name: dto.name, published: dto.publicationStatus === "published", authorId: authorIdOf(dto) ?? null }
  }

  private async assertOwner(uid: string, id: string): Promise<FirebaseSiteDto> {
    // raw DTO — no domain mapping, so legacy media shapes never break ownership checks
    const dto = await this.adapter.findRawById(id)
    if (!dto) throw new Error("Sitio no encontrado")
    if (authorIdOf(dto) !== uid) throw new Error("No autorizado")
    return dto
  }

  // --- Discovery público (para /donde-ir y landings por tipo) ---

  getFeaturedSites(): Promise<string[]> {
    return this.adapter.findFeaturedSiteIds()
  }

  /** Para el sitemap: sitios públicos. */
  getSitemapEntries(limit = 1000) {
    return this.adapter.findSitemapEntries(limit)
  }

  getAllSites(): Promise<string[]> {
    return this.adapter.findAllSiteIds()
  }

  /** Al azar entre los mejor puntuados, sin los de `excludeIds` (los que la home ya muestra como populares). */
  async getRandomSites(limit: number, excludeIds: readonly string[] = []): Promise<string[]> {
    return pickDiscoverIds(await this.adapter.findAllSiteIds(), limit, excludeIds)
  }

  getAllSitesPage(limit: number, cursor: string | null) {
    return this.adapter.findAllSiteIdsPage(limit, cursor)
  }

  getSitesByCategory(category: string, limit: number, cursor: string | null) {
    return this.adapter.findSiteIdsByCategory(category, limit, cursor)
  }

  getSiteDetailById(id: string) {
    return this.adapter.getSiteDetailById(id)
  }

  getSiteDetailBySlug(slug: string) {
    return this.adapter.getSiteDetailBySlug(slug)
  }

}
