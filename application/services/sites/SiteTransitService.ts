import type { ISiteTransitReportRepository } from "@/domain/repository/siteTransit/ISiteTransitReportRepository"
import type { SitesService } from "./SitesService"
import type { TransitRouteService } from "../config/TransitRouteService"
import {
  TRANSIT_REPORTS_THRESHOLD, buildTransitView, normalizeTransit, sameTransit,
  type SiteTransit, type SiteTransitView, type TransitRoute,
} from "@/domain/entities/sites/value-objects/SiteTransit"

export type TransitReportResult =
  | { success: true; count: number; reachedThreshold: boolean; authorId: string | null; siteName: string; updatedAt: number }
  | { success: false; error: string }

/** Buses de un sitio: lo que se guarda (validado contra el catálogo), el estado público y los reportes. */
export class SiteTransitService {
  constructor(
    private readonly reports: ISiteTransitReportRepository,
    private readonly sites: SitesService,
    private readonly routes: TransitRouteService,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Bloque a guardar según el catálogo VIGENTE (no se confía en el cliente). Si el contenido no cambió respecto
   * al guardado, conserva su `updatedAt` (la confirmación del dueño no se renueva sola). `undefined` = no tocar
   * el campo (el catálogo no se pudo leer); `null` = quitar el bloque.
   */
  async resolveForSave(raw: unknown, siteId?: string): Promise<SiteTransit | null | undefined> {
    const prev = siteId ? (await this.sites.getTransitSnapshot(siteId))?.transit ?? null : null
    let catalog: TransitRoute[]
    try {
      catalog = await this.routes.list()
    } catch (e) {
      console.error("[transit] catálogo no disponible; se conserva el bloque guardado", e)
      return siteId ? undefined : null
    }
    const ids = catalog.map((r) => r.id)
    const clean = normalizeTransit(raw, ids)
    if (!clean) return null
    // Rutas que ya salieron del catálogo no cuentan como cambio del autor.
    if (prev && sameTransit(clean, normalizeTransit(prev, ids))) return prev
    return { ...clean, updatedAt: this.now() }
  }

  private countFresh(list: { uid: string; at: number }[], updatedAt: number): number {
    return new Set(list.filter((r) => r.at > updatedAt).map((r) => r.uid)).size
  }

  /** Lo que ve el público (o null si el sitio no tiene buses vigentes). Estado calculado al leer. */
  async getView(siteId: string): Promise<SiteTransitView | null> {
    const snap = await this.sites.getTransitSnapshot(siteId)
    if (!snap?.transit) return null
    const [catalog, list] = await Promise.all([this.routes.list(), this.reports.listBySite(siteId)])
    return buildTransitView(snap.transit, catalog, this.countFresh(list, snap.transit.updatedAt))
  }

  /** "Está desactualizado": una vez por persona y sitio (hasta que el dueño reconfirme), nunca el autor. */
  async report(uid: string, siteId: string): Promise<TransitReportResult> {
    const snap = await this.sites.getTransitSnapshot(siteId)
    if (!snap || !snap.isPublic || !snap.transit) return { success: false, error: "Este sitio no tiene información de buses." }
    if (snap.authorId === uid) return { success: false, error: "Eres quien publicó este sitio: edítalo directamente." }
    const { updatedAt } = snap.transit
    const prev = await this.reports.getAt(siteId, uid)
    if (prev !== null && prev > updatedAt) return { success: false, error: "Ya reportaste esta información." }

    // ponytail: leer-y-guardar no es atómico; un doble clic simultáneo escribe el mismo doc (mismo id), sin duplicar.
    await this.reports.save(siteId, uid, this.now())
    const count = this.countFresh(await this.reports.listBySite(siteId), updatedAt)
    return {
      success: true,
      count,
      reachedThreshold: count >= TRANSIT_REPORTS_THRESHOLD,
      authorId: snap.authorId,
      siteName: snap.name,
      updatedAt,
    }
  }
}
