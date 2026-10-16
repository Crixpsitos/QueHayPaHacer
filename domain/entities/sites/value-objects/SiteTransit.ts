/**
 * Buses que llegan al sitio, informados a mano por quien publica (nunca calculados).
 * Solo se aceptan rutas del catálogo editable (`appConfig/transit-routes`): no hay texto libre de rutas.
 * Es un dato declarado, no verificado: la UI siempre dice "Informado por el dueño · hace X".
 */
export const TRANSIT_ROUTE_ID_RE = /^[A-Za-z0-9-]{1,10}$/
export const TRANSIT_LABEL_MAX = 40
export const TRANSIT_MAX_CATALOG = 120
export const TRANSIT_NOTE_MAX = 120
export const TRANSIT_MAX_ROUTES = 8
/** Reportes "Está desactualizado" (de personas distintas, posteriores a la última confirmación) para pasar a "por confirmar". */
export const TRANSIT_REPORTS_THRESHOLD = 3

/** Entrada del catálogo. `changedAt` (ms): la ruta cambió; los sitios confirmados antes quedan "por confirmar". */
export interface TransitRoute {
  id: string
  label: string
  operator?: string
  changedAt?: number
}

export interface SiteTransitRoute {
  id: string
  note?: string
}

/** Lo que envía el formulario. */
export interface SiteTransitDraft {
  routes: SiteTransitRoute[]
}

/** Lo que se guarda: `updatedAt` (ms) lo fija el servidor al guardar. */
export interface SiteTransit extends SiteTransitDraft {
  updatedAt: number
}

/**
 * Limpia lo que llega del cliente: descarta ids que no están en el catálogo y duplicados, recorta notas,
 * máximo 8 rutas. Si no queda ninguna, no hay dato (undefined).
 */
export function normalizeTransit(raw: unknown, catalogIds: Iterable<string>): SiteTransitDraft | undefined {
  const allowed = new Set(catalogIds)
  const list = (raw as { routes?: unknown } | null | undefined)?.routes
  if (!Array.isArray(list)) return undefined
  const seen = new Set<string>()
  const routes: SiteTransitRoute[] = []
  for (const item of list) {
    const id = typeof item?.id === "string" ? item.id : ""
    if (!allowed.has(id) || seen.has(id)) continue
    seen.add(id)
    const note = typeof item.note === "string" ? item.note.trim().slice(0, TRANSIT_NOTE_MAX) : ""
    routes.push(note ? { id, note } : { id })
    if (routes.length === TRANSIT_MAX_ROUTES) break
  }
  return routes.length ? { routes } : undefined
}

/** Mismo contenido (sin importar el orden). Sirve para conservar `updatedAt` si el autor no cambió el bloque. */
export function sameTransit(a: SiteTransitDraft | undefined, b: SiteTransitDraft | undefined): boolean {
  const key = (t?: SiteTransitDraft) => JSON.stringify((t?.routes ?? []).map((r) => [r.id, r.note ?? ""]).sort())
  return key(a) === key(b)
}

/** Lo que ve el público. Las rutas ya vienen con su nombre del catálogo. */
export interface SiteTransitView {
  routes: { id: string; label: string; note?: string }[]
  updatedAt: number
  /** "Por confirmar": puede estar desactualizado; se atenúa y no se ofrece como bus en "¿Cómo llego?". */
  unconfirmed: boolean
  byReports: boolean
  /** Nombres de rutas del sitio que cambiaron después de la última confirmación del dueño. */
  changedLabels: string[]
}

/**
 * Estado calculado al leer (sin migraciones): por confirmar si hay ≥ 3 reportes posteriores a `updatedAt`
 * (el servicio ya cuenta solo personas distintas) o si alguna ruta del sitio cambió después de `updatedAt`.
 * Las rutas que ya no están en el catálogo no se muestran; sin ninguna, no hay vista.
 */
export function buildTransitView(transit: SiteTransit | null | undefined, catalog: TransitRoute[], reportCount: number): SiteTransitView | null {
  if (!transit?.routes?.length) return null
  const byId = new Map(catalog.map((r) => [r.id, r]))
  const routes = transit.routes.flatMap((r) => {
    const entry = byId.get(r.id)
    return entry ? [{ id: r.id, label: entry.label, note: r.note, changedAt: entry.changedAt }] : []
  })
  if (!routes.length) return null
  const changedLabels = routes.filter((r) => (r.changedAt ?? 0) > transit.updatedAt).map((r) => r.label)
  const byReports = reportCount >= TRANSIT_REPORTS_THRESHOLD
  return {
    routes: routes.map((r) => ({ id: r.id, label: r.label, ...(r.note ? { note: r.note } : {}) })),
    updatedAt: transit.updatedAt,
    unconfirmed: byReports || changedLabels.length > 0,
    byReports,
    changedLabels,
  }
}
