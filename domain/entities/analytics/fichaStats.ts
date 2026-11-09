/** Por debajo de estas vistas en el período, el panel avisa "pocos datos" en vez de sacar conclusiones (spec analytics-v2). */
export const FEW_DATA_BELOW = 30

/** Acciones medidas por tipo en el doc diario (lista cerrada; el resto de campos del doc no son acciones). */
export const ACTION_FIELDS = ["share", "directions", "transit", "website", "social", "booking", "whatsapp", "call", "register_external"] as const
type Counts = Record<string, number>
export interface DailyStatsDoc { day?: string; views?: number; clicks?: number; bySource?: Counts; viewsBy?: Counts; linkClicks?: Counts; [k: string]: unknown }
export interface StatsTotals {
  views: number
  clicks: number
  /** Visitas Y acciones por origen (mezclado). */
  bySource: Counts
  /** SOLO visitas por origen. */
  viewsBy: Counts
  /** Clics en los enlaces cortos automáticos, por canal. */
  linkClicks: Counts
  /** Acciones por tipo (`share`, `directions`, `register_external`…). */
  byType: Counts
}

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0)

const addCounts = (into: Counts, from: unknown) => {
  for (const [k, v] of Object.entries((from ?? {}) as Record<string, unknown>)) {
    const c = n(v)
    if (c) into[k] = (into[k] ?? 0) + c
  }
}

/** Suma los docs diarios `events|sites/{id}/stats/{día}`. Campos que no son números positivos cuentan 0. */
export function sumStats(docs: DailyStatsDoc[]): StatsTotals {
  const out: StatsTotals = { views: 0, clicks: 0, bySource: {}, viewsBy: {}, linkClicks: {}, byType: {} }
  for (const d of docs) {
    out.views += n(d.views)
    out.clicks += n(d.clicks)
    addCounts(out.bySource, d.bySource)
    addCounts(out.viewsBy, d.viewsBy)
    addCounts(out.linkClicks, d.linkClicks)
    for (const f of ACTION_FIELDS) {
      const c = n(d[f])
      if (c) out.byType[f] = (out.byType[f] ?? 0) + c
    }
  }
  return out
}

const LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", tiktok: "TikTok", x: "X",
  google: "Google", direct: "Directo", link: "Tus enlaces", qr: "Afiche con QR", other: "Otros",
}
export interface SourceShare { key: string; label: string; count: number; pct: number }

/**
 * Orígenes ordenados con su % del total (suma de visitas y clics: `bySource` no los separa). Muestra los `top` mayores y
 * agrupa el resto en "Otros". Los % son enteros y nunca suman más de 100.
 */
// Los canales de enlaces automáticos se agrupan por plataforma: ch_ig y ch_ig_h son "Instagram".
const PLATFORM: Record<string, string> = { ch_ig: "instagram", ch_ig_h: "instagram", ch_wa: "whatsapp", ch_fb: "facebook", ch_x: "x", ch_tt: "tiktok", ch_qr: "qr" }

export function sourceShares(bySource: Record<string, number>, top = 4): SourceShare[] {
  const grouped: Record<string, number> = {}
  for (const [k, c] of Object.entries(bySource)) grouped[PLATFORM[k] ?? k] = (grouped[PLATFORM[k] ?? k] ?? 0) + n(c)
  const entries = Object.entries(grouped).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
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
