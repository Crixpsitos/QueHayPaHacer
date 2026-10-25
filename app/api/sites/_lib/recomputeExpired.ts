/**
 * Barrido de conteos de eventos vencidos (`analytics.eventCountValidUntil <= ahora`). Lógica pura con dependencias
 * inyectadas para poder probarla sin Firestore; la ruta `/api/sites/recompute-expired` la cablea con los servicios.
 *
 * Es idempotente: tras recalcular, el sitio queda con un vencimiento futuro (o null), así que sale del conjunto de
 * vencidos y una segunda ejecución encuentra 0.
 */
export interface ExpiredRow {
  id: string
  /** `eventCountValidUntil` en ms */
  validUntil: number
}

export interface RecomputeDeps {
  /** Vencidos (`validUntil <= now`), el más atrasado primero. `limit` es el máximo a traer. */
  listExpired(now: Date, limit: number): Promise<ExpiredRow[]>
  countExpired(now: Date): Promise<number>
  /** Recuenta un sitio. `null` = ya estaba al día o no existe; `visible` = cambió el conteo o el puntaje. */
  recompute(id: string): Promise<{ authorId: string | null; visible: boolean } | null>
  now(): number
}

export interface RecomputeResult {
  processed: number
  changed: number
  failed: number
  remaining: number
  /** Cuánto lleva vencido el más atrasado que sigue pendiente (0 si no queda ninguno). */
  oldestOverdueMs: number
  /** Sitios cuyo conteo o puntaje cambió (los que hay que invalidar en caché). */
  invalidate: { siteId: string; authorId: string | null }[]
}

export const RECOMPUTE_BUDGET_MS = 45_000
export const RECOMPUTE_BATCH = 100
const MAX_FETCH = 500

/**
 * De las filas traídas, las que de verdad hay que procesar: vencidas ahora y no intentadas en esta ejecución, el más
 * atrasado primero. La consulta ya filtra y ordena; esto es la red de seguridad (y lo que evita reintentar en bucle
 * un sitio que falló).
 */
export function selectExpired(rows: ExpiredRow[], nowMs: number, attempted: ReadonlySet<string>): ExpiredRow[] {
  return rows
    .filter((r) => Number.isFinite(r.validUntil) && r.validUntil <= nowMs && !attempted.has(r.id))
    .sort((a, b) => a.validUntil - b.validUntil)
}

export async function recomputeExpiredSites(
  deps: RecomputeDeps,
  opts: { budgetMs?: number; batch?: number; onError?: (siteId: string, error: unknown) => void } = {},
): Promise<RecomputeResult> {
  const budgetMs = opts.budgetMs ?? RECOMPUTE_BUDGET_MS
  const batch = opts.batch ?? RECOMPUTE_BATCH
  const onError = opts.onError ?? (() => {})
  const start = deps.now()
  const attempted = new Set<string>()
  const invalidate: RecomputeResult["invalidate"] = []
  let changed = 0
  let failed = 0

  const overBudget = () => deps.now() - start >= budgetMs

  while (!overBudget()) {
    // Los que fallaron siguen vencidos y ocupan los primeros lugares: se pide de más para pasar de largo.
    const fetchLimit = Math.min(batch + attempted.size, MAX_FETCH)
    const todo = selectExpired(await deps.listExpired(new Date(deps.now()), fetchLimit), deps.now(), attempted).slice(0, batch)
    if (todo.length === 0) break
    for (const { id } of todo) {
      if (overBudget()) break
      attempted.add(id)
      try {
        const result = await deps.recompute(id)
        if (result) {
          changed++
          if (result.visible) invalidate.push({ siteId: id, authorId: result.authorId })
        }
      } catch (error) {
        failed++
        onError(id, error)
      }
    }
  }

  const now = new Date(deps.now())
  const [remaining, oldest] = await Promise.all([deps.countExpired(now), deps.listExpired(now, 1)])
  const first = selectExpired(oldest, now.getTime(), new Set())[0]
  return {
    processed: attempted.size,
    changed,
    failed,
    remaining,
    oldestOverdueMs: first ? Math.max(0, now.getTime() - first.validUntil) : 0,
    invalidate,
  }
}
