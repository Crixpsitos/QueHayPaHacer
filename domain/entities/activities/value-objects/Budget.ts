/** Bandas de presupuesto para el filtro público (spec 5.5), sobre el precio "desde" en COP. */
export const BUDGET_BANDS = ["gratis", "hasta-20000", "hasta-50000", "hasta-100000", "mas-de-100000"] as const
export type BudgetBand = (typeof BUDGET_BANDS)[number]

export function budgetBand(priceFromCop: number): BudgetBand {
  if (priceFromCop <= 0) return "gratis"
  if (priceFromCop <= 20000) return "hasta-20000"
  if (priceFromCop <= 50000) return "hasta-50000"
  if (priceFromCop <= 100000) return "hasta-100000"
  return "mas-de-100000"
}
