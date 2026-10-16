import type { SitesAdapter } from "@/infraestructure/adapters/sites/SitesAdapter"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"
import type { FirebaseSiteDto } from "@/infraestructure/firebase/dto/sites/FirebaseSiteDto"
import type { ClaimSiteSnapshot } from "@/domain/entities/siteClaim/SiteClaim"

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
    bookingUrl: data.bookingUrl,
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

  async getMySites(uid: string): Promise<SiteDetail[]> {
    return this.adapter.findDetailsByAuthorId(uid)
  }

  async saveDraft(data: SiteInput): Promise<string> {
    return this.adapter.createRaw({ ...data, publicationStatus: "draft" })
  }

  /** Merge only content fields into an existing doc — never touches status/analytics/slug/author. */
  async updateDraft(uid: string, id: string, data: SiteInput): Promise<void> {
    await this.assertOwner(uid, id)
    return this.adapter.updateRaw({ id, ...contentFields(data) } as FirebaseSiteDto)
  }

  async publish(data: SiteInput): Promise<string> {
    return this.adapter.createRaw({ ...data, publicationStatus: "published", moderationStatus: "pending" })
  }

  /** Convert an existing (draft) doc into a published one — reuses its id, no new doc. */
  async publishExisting(uid: string, id: string, data: SiteInput): Promise<void> {
    const current = await this.assertOwner(uid, id)
    // el borrador nace con nombre vacío → slug "-xxxx"; se regenera al publicar
    const regenerateSlug = current.publicationStatus === "draft" || !current.slug || current.slug.startsWith("-")
    return this.adapter.updateRaw({
      id,
      ...contentFields(data),
      ...(regenerateSlug ? { slug: data.slug } : {}),
      publicationStatus: "published",
      moderationStatus: "pending",
      rejectionReason: null,
      rejectedAt: null,
    } as FirebaseSiteDto)
  }

  async updateSite(uid: string, id: string, data: SiteInput): Promise<void> {
    await this.assertOwner(uid, id)
    return this.adapter.updateRaw({ id, ...contentFields(data) } as FirebaseSiteDto)
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

  getAllSites(): Promise<string[]> {
    return this.adapter.findAllSiteIds()
  }

  async getRandomSites(limit: number): Promise<string[]> {
    const ids = await this.adapter.findAllSiteIds()
    return [...ids].sort(() => Math.random() - 0.5).slice(0, limit)
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
