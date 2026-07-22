import type { FirebaseSiteDto } from "../../dto/sites/FirebaseSiteDto"

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
  /** Paginación por cursor de un tipo de sitio (category). Tiebreaker documentId. */
  findSiteIdsByCategory(category: string, limit: number, cursor: string | null): Promise<PaginatedSiteIds>
}
