/** Reportes "Está desactualizado" de los buses de un sitio (colección `siteTransitReports`, doc `${siteId}_${uid}`). */
export interface ISiteTransitReportRepository {
  /** Fecha (ms) del reporte de esa persona en ese sitio, o null. */
  getAt(siteId: string, uid: string): Promise<number | null>
  /** Crea o reemplaza el reporte (uno por persona y sitio). */
  save(siteId: string, uid: string, at: number): Promise<void>
  listBySite(siteId: string): Promise<{ uid: string; at: number }[]>
}
