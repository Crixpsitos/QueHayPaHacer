import type { FirebaseSiteDto } from "../../dto/sites/FirebaseSiteDto"
import type { SiteTrackType } from "@/domain/entities/sites/siteStats"

/** Página de IDs de sitios + cursor opaco (null = no hay más). */
export interface PaginatedSiteIds {
  ids: string[]
  nextCursor: string | null
}

export interface ISitesFirebaseRepository {
  findById(siteId: string): Promise<FirebaseSiteDto | null>
  findByAuthorId(authorId: string): Promise<FirebaseSiteDto[]>
  create(site: Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt">): Promise<FirebaseSiteDto>
  update(site: FirebaseSiteDto): Promise<void>
  delete(siteId: string): Promise<void>

  // Discovery público: solo sitios published + approved + activos, orden por score.
  findFeaturedSiteIds(): Promise<string[]>
  findAllSiteIds(): Promise<string[]>
  /** Sitios públicos para el sitemap (slug + última edición). */
  findSitemapEntries(limit: number): Promise<{ id: string; slug: string; updatedAt: Date | null }[]>
  /** Paginación por cursor de TODOS los sitios públicos (score desc, tiebreaker documentId). */
  findAllSiteIdsPage(limit: number, cursor: string | null): Promise<PaginatedSiteIds>
  /** Paginación por cursor de un tipo de sitio (category). Tiebreaker documentId. */
  findSiteIdsByCategory(category: string, limit: number, cursor: string | null): Promise<PaginatedSiteIds>
  /** Busca un sitio por su slug único. */
  findBySlug(slug: string): Promise<FirebaseSiteDto | null>
  /** Suma una vista o un clic al total del sitio y al doc diario `day` (YYYY-MM-DD). Sitio inexistente: no hace nada. */
  recordTrack(id: string, type: SiteTrackType, day: string): Promise<void>
}
