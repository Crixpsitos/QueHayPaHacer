import { cacheLife } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { StatsTotals } from "@/domain/entities/analytics/fichaStats"

/**
 * Visitas de 30 días de cada ficha (solo para las miniaturas del selector). Guardadas ~1 min por instancia: cada toque en el
 * panel (cambiar ficha, período o tipo) vuelve a pintar la página y NO debe repetir una lectura por ficha cada vez.
 */
export async function getCachedStats30(uid: string, refs: { type: "event" | "site" | "activity"; id: string }[], sinceDay: string): Promise<Record<string, StatsTotals>> {
  "use cache"
  cacheLife("minutes")
  void uid // forma parte de la clave de caché: cada dueño tiene la suya
  const { dailyStatsRepository } = createServerContainer()
  const out: Record<string, StatsTotals> = {}
  await Promise.all(refs.map(async (r) => { out[`${r.type}:${r.id}`] = await dailyStatsRepository.sumSince(r.type === "event" ? "events" : r.type === "activity" ? "activities" : "sites", r.id, sinceDay) }))
  return out
}
