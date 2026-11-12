export type Period = 7 | 30 | 90
export const PERIODS: readonly Period[] = [7, 30, 90]
/** Qué clase de ficha mide el panel. */
export type FichaType = "event" | "site" | "activity"
export type TypeFilter = "all" | FichaType
/** Qué está mirando el panel: ficha (`tipo:id`), período y filtro por tipo. Vive en la URL (`f`, `d`, `t`). */
export interface Nav { f: string | null; d: Period; t: TypeFilter }
export interface NavOption { key: string; type: FichaType; views30: number }

/**
 * Normaliza lo que llega (URL o toque) a un estado válido: período y filtro con valor por defecto, y la ficha debe existir
 * Y ser del tipo filtrado; si no, la más visitada de ese tipo. Lo usan el servidor (qué dibujar) y el cliente (qué resaltar al
 * instante), así los dos siempre coinciden.
 */
export function resolveNav(options: NavOption[], raw: { f?: string | null; d?: string | number | null; t?: string | null }): Nav {
  const d = (PERIODS.find((p) => String(p) === String(raw.d)) ?? 30) as Period
  const t: TypeFilter = raw.t === "event" || raw.t === "site" || raw.t === "activity" ? raw.t : "all"
  const pool = options.filter((o) => t === "all" || o.type === t)
  const f = pool.find((o) => o.key === raw.f)?.key ?? pool.reduce<NavOption | null>((best, o) => (!best || o.views30 > best.views30 ? o : best), null)?.key ?? null
  return { f, d, t }
}

/** Un toque compone sobre el ÚLTIMO estado (no sobre el de la última pantalla dibujada): así los clics rápidos no se pisan. */
export const nextNav = (options: NavOption[], current: Nav, patch: Partial<Nav>): Nav => resolveNav(options, { ...current, ...patch })

export function navToSearch(n: Nav): string {
  const p = new URLSearchParams()
  if (n.f) p.set("f", n.f)
  p.set("d", String(n.d))
  if (n.t !== "all") p.set("t", n.t)
  return p.toString()
}
