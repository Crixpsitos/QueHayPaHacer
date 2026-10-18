import type { IConfigRepository } from "@/domain/repository/config/IConfigRepository"
import {
  TRANSIT_LABEL_MAX, TRANSIT_MAX_CATALOG, TRANSIT_ROUTE_ID_RE, type TransitRoute,
} from "@/domain/entities/sites/value-objects/SiteTransit"

const KEY = "transit-routes"
const OPERATOR_MAX = 60

/** Valida el catálogo editado a mano (administración). Devuelve la lista limpia o un mensaje de error. */
export function parseTransitRoutes(raw: unknown): { ok: true; routes: TransitRoute[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "Lista inválida." }
  if (raw.length > TRANSIT_MAX_CATALOG) return { ok: false, error: `Máximo ${TRANSIT_MAX_CATALOG} rutas.` }
  const seen = new Set<string>()
  const routes: TransitRoute[] = []
  for (const item of raw) {
    const id = typeof item?.id === "string" ? item.id.trim() : ""
    const label = typeof item?.label === "string" ? item.label.trim() : ""
    const operator = typeof item?.operator === "string" ? item.operator.trim() : ""
    if (!TRANSIT_ROUTE_ID_RE.test(id)) return { ok: false, error: `Id inválido: ${id || "(vacío)"} (letras, números y guion, hasta 10).` }
    if (seen.has(id)) return { ok: false, error: `Id repetido: ${id}.` }
    if (!label || label.length > TRANSIT_LABEL_MAX) return { ok: false, error: `Nombre inválido para ${id} (1–${TRANSIT_LABEL_MAX} caracteres).` }
    if (operator.length > OPERATOR_MAX) return { ok: false, error: `Operador demasiado largo en ${id}.` }
    if (item.changedAt !== undefined && !(Number.isFinite(item.changedAt) && item.changedAt >= 0)) return { ok: false, error: `Fecha de cambio inválida en ${id}.` }
    seen.add(id)
    routes.push({ id, label, ...(operator ? { operator } : {}), ...(item.changedAt ? { changedAt: Math.trunc(item.changedAt) } : {}) })
  }
  return { ok: true, routes }
}

/** Orden natural por nombre ("Ruta 2" antes que "Ruta 10"). */
const byLabel = (a: TransitRoute, b: TransitRoute) => a.label.localeCompare(b.label, "es", { numeric: true })

/** Catálogo de rutas de bus (`appConfig/transit-routes`). Es solo una lista de números/nombres: sin trazado. */
export class TransitRouteService {
  constructor(private readonly config: IConfigRepository) {}

  async list(): Promise<TransitRoute[]> {
    const doc = await this.config.get<{ routes?: TransitRoute[] }>(KEY)
    return [...(doc?.data.routes ?? [])].sort(byLabel)
  }

  async save(routes: TransitRoute[], uid: string): Promise<void> {
    await this.config.set(KEY, { routes }, uid)
  }

  /** Marca "esta ruta cambió" ahora: los sitios que la usan y se confirmaron antes quedan "por confirmar". */
  async markChanged(id: string, uid: string, now = Date.now()): Promise<boolean> {
    const routes = await this.list()
    if (!routes.some((r) => r.id === id)) return false
    await this.save(routes.map((r) => (r.id === id ? { ...r, changedAt: now } : r)), uid)
    return true
  }

  /** Guarda el catálogo inicial solo si aún no existe (no pisa ediciones). */
  async seed(routes: TransitRoute[], updatedBy: string): Promise<"created" | "exists"> {
    if (await this.config.get(KEY)) return "exists"
    await this.save(routes, updatedBy)
    return "created"
  }
}
