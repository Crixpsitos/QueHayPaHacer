import type { Activity } from "@/domain/entities/activities/Activity"
import { nextOccurrence } from "@/domain/entities/activities/value-objects/occurrences"
import { canManageActivity, canViewActivity } from "@/domain/entities/activities/permissions"
import { isPubliclyVisible, type LinkedSite } from "@/domain/entities/activities/visibility"
import { matchesFilters, type ActivityFilters } from "@/domain/entities/activities/filters"
import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"

/** Estado del sitio vinculado, o null si no existe. Lo provee `SitesService`. */
export type SiteLookup = (siteId: string) => Promise<LinkedSite | null>

export interface Viewer {
  uid: string | null
  isAdmin: boolean
}

/** Tope de candidatas que se traen para ordenar en memoria (ver nota en IActivityRepository.findListable). */
const LISTABLE_CAP = 500

export class ActivityService {
  constructor(
    private readonly repo: IActivityRepository,
    private readonly siteLookup: SiteLookup,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Un lookup por sitio distinto aunque haya muchas actividades. */
  private siteResolver() {
    const cache = new Map<string, Promise<LinkedSite | null>>()
    return (a: Activity) => (a.kind === "site" && a.siteId ? (cache.get(a.siteId) ?? cache.set(a.siteId, this.siteLookup(a.siteId)).get(a.siteId)!) : Promise.resolve(null))
  }

  private async keepVisible(items: Activity[]): Promise<Activity[]> {
    const siteOf = this.siteResolver()
    const flags = await Promise.all(items.map(async (a) => isPubliclyVisible(a, await siteOf(a))))
    return items.filter((_, i) => flags[i])
  }

  /** Para el público: null si no existe o no es visible (la página responde 404). */
  async getPublicBySlug(slug: string): Promise<Activity | null> {
    const a = await this.repo.findBySlug(slug)
    return a && (await this.keepVisible([a])).length ? a : null
  }

  /** Pública por id (la consulta de quejas solo aplica a actividades públicas). */
  async getPublicById(id: string): Promise<Activity | null> {
    const a = await this.repo.findById(id)
    return a && (await this.keepVisible([a])).length ? a : null
  }

  /** Para quien está logueado: además de las públicas, el dueño y QHPA ven las pendientes (vista previa). */
  async getForViewer(slug: string, viewer: Viewer): Promise<Activity | null> {
    const a = await this.repo.findBySlug(slug)
    if (!a) return null
    const site = a.kind === "site" && a.siteId ? await this.siteLookup(a.siteId) : null
    return canViewActivity(a, viewer, site) ? a : null
  }

  /** Para editar: solo el dueño o QHPA, en cualquier estado (borrador, en revisión, pausada…). */
  async getForManager(id: string, viewer: Viewer): Promise<Activity | null> {
    const a = await this.repo.findById(id)
    return a && canManageActivity(a, viewer) ? a : null
  }

  /** Públicas ordenadas por próxima salida (las que no tienen, como "solo con cita", al final). */
  async listPublic(limit: number): Promise<Activity[]> {
    const now = this.clock()
    const visible = await this.keepVisible(await this.repo.findListable(LISTABLE_CAP))
    const next = new Map(visible.map((a) => [a.id, nextOccurrence(a.schedule, now)?.startsAt?.getTime() ?? Number.POSITIVE_INFINITY]))
    return visible.sort((x, y) => next.get(x.id)! - next.get(y.id)! || x.title.localeCompare(y.title, "es")).slice(0, limit)
  }

  /** Hub público: filtros + orden por próxima salida + paginación por offset (en memoria, ver nota de `findListable`). */
  async search(filters: ActivityFilters, offset: number, limit: number): Promise<{ items: Activity[]; total: number; nextOffset: number | null }> {
    const all = (await this.listPublic(LISTABLE_CAP)).filter((a) => matchesFilters(a, filters))
    const start = Math.max(0, Math.floor(offset))
    const end = start + limit
    return { items: all.slice(start, end), total: all.length, nextOffset: end < all.length ? end : null }
  }

  async listForSite(siteId: string): Promise<Activity[]> {
    return this.keepVisible(await this.repo.findBySite(siteId))
  }

  async listMine(uid: string): Promise<Activity[]> {
    return (await this.repo.findByOwner(uid)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  isSlugTaken(slug: string): Promise<boolean> {
    return this.repo.slugExists(slug)
  }
}
