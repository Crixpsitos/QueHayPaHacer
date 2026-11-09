/** Por debajo de estas vistas en el período, el panel avisa "pocos datos" en vez de sacar conclusiones (spec analytics-v2). */
export const FEW_DATA_BELOW = 30

export interface DailyStatsDoc { views?: number; clicks?: number; bySource?: Record<string, number> }
export interface StatsTotals { views: number; clicks: number; bySource: Record<string, number> }

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0)

/** Suma los docs diarios `events|sites/{id}/stats/{día}`. Campos que no son números positivos cuentan 0. */
export function sumStats(docs: DailyStatsDoc[]): StatsTotals {
  const out: StatsTotals = { views: 0, clicks: 0, bySource: {} }
  for (const d of docs) {
    out.views += n(d.views)
    out.clicks += n(d.clicks)
    for (const [k, v] of Object.entries(d.bySource ?? {})) {
      const c = n(v)
      if (c) out.bySource[k] = (out.bySource[k] ?? 0) + c
    }
  }
  return out
}

const LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", tiktok: "TikTok", x: "X",
  google: "Google", direct: "Directo", link: "Tus enlaces", other: "Otros",
}
export interface SourceShare { key: string; label: string; count: number; pct: number }

/**
 * Orígenes ordenados con su % del total (suma de visitas y clics: `bySource` no los separa). Muestra los `top` mayores y
 * agrupa el resto en "Otros". Los % son enteros y nunca suman más de 100.
 */
export function sourceShares(bySource: Record<string, number>, top = 4): SourceShare[] {
  const entries = Object.entries(bySource).filter(([, c]) => n(c) > 0).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, c]) => s + c, 0)
  if (!total) return []
  const head = entries.slice(0, top)
  const rest = entries.slice(top).reduce((s, [, c]) => s + c, 0)
  const rows = rest ? [...head, ["other", rest] as [string, number]] : head
  // "other" ya existente en `head` se fusiona con la cola
  const merged = new Map<string, number>()
  for (const [k, c] of rows) merged.set(k, (merged.get(k) ?? 0) + c)
  return [...merged].map(([key, count]) => ({ key, label: LABELS[key] ?? "Otros", count, pct: Math.floor((count / total) * 100) }))
}
