import type { Product } from "./Product"

/** Productos que muestra una actividad: solo los que eligió. Sin elegir ninguno (o si ya no existen) no se muestra ningún producto. */
export function pickProducts(all: Product[], ids: string[] | undefined): Product[] {
  if (!ids?.length) return []
  const chosen = new Set(ids)
  return all.filter((p) => chosen.has(p.id))
}
