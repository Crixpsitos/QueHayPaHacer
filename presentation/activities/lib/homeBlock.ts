import { dailyActivityPicks } from "@/domain/entities/activities/dailyPicks"

/** Menos que esto hoy y el bloque pasa a "Esta semana". */
export const HOME_MIN_TODAY = 3

type Item = { id: string; host: string }

/**
 * Qué muestra el bloque de la portada: lo de hoy si hay suficiente; si no, lo de la semana; si no hay nada, vacío.
 * Los ids salen en el mismo orden de entrada (la lista ya viene por hora de inicio).
 */
export function chooseHomeBlock(today: readonly Item[], week: readonly Item[], day: string): { mode: "today" | "week"; ids: string[] } {
  const mode = today.length >= HOME_MIN_TODAY ? "today" : "week"
  const pool = mode === "today" ? today : week
  const keep = new Set(dailyActivityPicks(pool, day))
  return { mode, ids: pool.filter((p) => keep.has(p.id)).map((p) => p.id) }
}
