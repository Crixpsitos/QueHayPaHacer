import type { SitesAdapter } from "@/infraestructure/adapters/sites/SitesAdapter"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"
import type { FirebaseSiteDto } from "@/infraestructure/firebase/dto/sites/FirebaseSiteDto"

export type SiteInput = Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt">

/** Mutable content of a site — excludes slug/author/status/analytics/timestamps. */
function contentFields(data: SiteInput) {
  return {
    name: data.name,
    category: data.category,
    description: data.description,
    location: data.location,
    media: data.media,
    schedule: data.schedule,
  }
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
  async updateDraft(id: string, data: SiteInput): Promise<void> {
    return this.adapter.updateRaw({ id, ...contentFields(data) } as FirebaseSiteDto)
  }

  async publish(data: SiteInput): Promise<string> {
    return this.adapter.createRaw({ ...data, publicationStatus: "published", moderationStatus: "pending" })
  }

  /** Convert an existing (draft) doc into a published one — reuses its id, no new doc. */
  async publishExisting(id: string, data: SiteInput): Promise<void> {
    return this.adapter.updateRaw({
      id,
      ...contentFields(data),
      publicationStatus: "published",
      moderationStatus: "pending",
      rejectionReason: null,
      rejectedAt: null,
    } as FirebaseSiteDto)
  }

  async updateSite(id: string, data: Partial<SiteInput>): Promise<void> {
    return this.adapter.updateRaw({ id, ...data } as FirebaseSiteDto)
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

  private async assertOwner(uid: string, id: string): Promise<void> {
    // raw DTO — no domain mapping, so legacy media shapes never break ownership checks
    const dto = await this.adapter.findRawById(id)
    if (!dto) throw new Error("Sitio no encontrado")
    if (dto.author?.id !== uid) throw new Error("No autorizado")
  }

  // --- Discovery público (para /donde-ir y landings por tipo) ---

  getFeaturedSites(): Promise<string[]> {
    return this.adapter.findFeaturedSiteIds()
  }

  getAllSites(): Promise<string[]> {
    return this.adapter.findAllSiteIds()
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
