import type { Product } from "./Product"

/** Productos que muestra una actividad: los que eligió; si no eligió ninguno (o ya no existen), toda la carta. */
export function pickProducts(all: Product[], ids: string[] | undefined): Product[] {
  if (!ids?.length) return all
  const chosen = new Set(ids)
  const picked = all.filter((p) => chosen.has(p.id))
  return picked.length ? picked : all
}
