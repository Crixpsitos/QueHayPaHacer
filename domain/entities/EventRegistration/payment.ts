export interface PayTier { name: string; amount: number }
interface PriceLike { isFree?: boolean; amount?: number; tiers?: PayTier[] }

/** Categorías cobrables de un evento: sus `tiers`, o «General» si tiene un solo precio. Gratis = []. */
export function payTiers(price?: PriceLike | null): PayTier[] {
  if (!price || price.isFree) return []
  const tiers = (price.tiers ?? []).filter((t) => t.name && Number.isInteger(t.amount) && t.amount >= 0)
  if (tiers.length) return tiers
  return Number.isInteger(price.amount) && (price.amount as number) > 0 ? [{ name: "General", amount: price.amount as number }] : []
}

/** Categoría y valor al confirmar un pago. El valor SIEMPRE sale del precio del evento (nunca del cliente). null = categoría inexistente. Sin categoría: la más barata. */
export function resolvePayment(price: PriceLike | null | undefined, tier?: string | null): { tier: string | null; amountCop: number } | null {
  const tiers = payTiers(price)
  if (!tiers.length) return { tier: null, amountCop: 0 }
  const t = tier ? tiers.find((x) => x.name === tier) : [...tiers].sort((a, b) => a.amount - b.amount)[0]
  return t ? { tier: t.name, amountCop: t.amount } : null
}

export interface IncomeRow { tier?: string | null; paidAmount?: number | null }
export interface IncomeSummary { total: number; paidCount: number; byTier: { tier: string; unit: number; count: number; amount: number }[] }

/**
 * Ingresos de las personas confirmadas con pago: total y por categoría, de la más alta (mayor valor) a la más baja.
 * Con las `tiers` del evento salen TODAS las categorías (también las que aún no venden, en 0).
 */
export function summarizeIncome(rows: IncomeRow[], tiers: PayTier[] = []): IncomeSummary {
  const map = new Map<string, { tier: string; unit: number; count: number; amount: number }>()
  for (const t of tiers) map.set(t.name, { tier: t.name, unit: t.amount, count: 0, amount: 0 })
  let total = 0
  let paidCount = 0
  for (const r of rows) {
    const a = r.paidAmount
    if (typeof a !== "number" || a <= 0) continue
    total += a
    paidCount++
    const k = r.tier || "General"
    const cur = map.get(k) ?? { tier: k, unit: a, count: 0, amount: 0 }
    cur.count++
    cur.amount += a
    cur.unit = Math.max(cur.unit, a)
    map.set(k, cur)
  }
  return { total, paidCount, byTier: [...map.values()].sort((x, y) => y.unit - x.unit || y.amount - x.amount) }
}

/** Suma un pago recién confirmado al resumen (sin releer las inscripciones). Un pago de 0 no cambia nada. No muta el original. */
export function applyPaid(s: IncomeSummary, paid: { tier: string | null; amount: number }): IncomeSummary {
  if (!(paid.amount > 0)) return s
  const key = paid.tier || "General"
  const by = s.byTier.map((t) => ({ ...t }))
  const cur = by.find((t) => t.tier === key)
  if (cur) { cur.count++; cur.amount += paid.amount; cur.unit = Math.max(cur.unit, paid.amount) }
  else by.push({ tier: key, unit: paid.amount, count: 1, amount: paid.amount })
  return { total: s.total + paid.amount, paidCount: s.paidCount + 1, byTier: by.sort((x, y) => y.unit - x.unit || y.amount - x.amount) }
}
