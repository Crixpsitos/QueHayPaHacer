import type { Site } from "@/domain/entities/sites/Site"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"

/** Página de IDs de sitios + cursor opaco para la siguiente (null = no hay más). */
export interface PaginatedSiteIds {
  ids: string[];
  nextCursor: string | null;
}

export interface ISiteRepository {
  // ── CRUD ────────────────────────────────────────────────────────────────────
  findById(id: string): Promise<Site | null>
  findByAuthorId(authorId: string): Promise<Site[]>
  create(site: Partial<Site>): Promise<Site>
  update(site: Partial<Site> & { id: string }): Promise<void>

  // ── Discovery público ────────────────────────────────────────────────────────
  /** IDs de sitios destacados (score alto). */
  findFeaturedSiteIds(): Promise<string[]>
  /** IDs de todos los sitios publicados + aprobados. */
  findAllSiteIds(): Promise<string[]>
  /** IDs paginados por tipo de sitio, con cursor estable. */
  findSiteIdsByCategory(
    category: string,
    limit: number,
    cursor: string | null,
  ): Promise<PaginatedSiteIds>
  /** Read-model SiteDetail para un sitio (evita mapeo a entidad de dominio). */
  getSiteDetailById(id: string): Promise<SiteDetail | null>
  /** Busca un sitio por slug y devuelve su read-model. */
  getSiteDetailBySlug(slug: string): Promise<SiteDetail | null>
}
