import type { WeekDay } from "./weekPlan"

/**
 * Qué lleva el afiche «Mi semana» y cómo se reparte, según cuántos planes haya:
 * hasta 4 → cómodo (una tarjeta cada uno); 5 → compacto; más de 5 → denso (5 filas y «+N planes más en el enlace»).
 * Lo que está disponible todos los días sin hora (cines, «siempre abierto»…) no entra en las filas: va en una sola línea al final.
 */
export type PosterTier = "comfortable" | "compact" | "dense"
export interface PosterRow { date: string; /** disponible todos los días, sin hora: «Cuando quieras» */ anytime: boolean; day: string; time: string; title: string; price: string; imageUrl: string | null; /** sin foto, el recuadro lleva la categoría con su color */ category: { name: string; bg: string; ink: string } | null }
export interface WeekPosterPlan { tier: PosterTier; rows: PosterRow[]; more: number; rangeLabel: string }

/** Hasta 4 planes: tarjetas grandes; 5: compactas; con más, solo 5 (si no, el texto se vuelve ilegible) y «+N». */
export const POSTER_MAX_ROWS = 5
const ANYTIME_DAYS = 4
const WD = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MONTH = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const hourText = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }
const part = (iso: string) => ({ wd: WD[new Date(`${iso}T12:00:00Z`).getUTCDay()], d: Number(iso.slice(8)), m: Number(iso.slice(5, 7)) - 1 })

/** Ids que se repiten sin hora fija casi todos los días de la semana. */
export function anytimeIdsOf(week: readonly WeekDay[]): string[] {
  const seen = new Map<string, { n: number; timed: boolean }>()
  for (const d of week) for (const b of d.blocks) { const x = seen.get(b.id) ?? { n: 0, timed: false }; x.n++; if (b.startMin !== null) x.timed = true; seen.set(b.id, x) }
  return [...seen].filter(([, x]) => !x.timed && x.n >= ANYTIME_DAYS).map(([id]) => id)
}

export function planWeekPoster(week: readonly WeekDay[], o: { today: string; price: (id: string) => string; image?: (id: string) => string | null; category?: (id: string) => { name: string; bg: string; ink: string } | null }): WeekPosterPlan {
  const any = new Set(anytimeIdsOf(week))
  const timed = week.flatMap((d) => d.blocks.filter((b) => !any.has(b.id)).map((b) => ({ d: d.date, b })))
    .sort((x, y) => x.d.localeCompare(y.d) || (x.b.startMin ?? 1e9) - (y.b.startMin ?? 1e9) || x.b.id.localeCompare(y.b.id))
  const img = (id: string) => o.image?.(id) ?? null
  const cat = (id: string) => o.category?.(id) ?? null
  const rows: PosterRow[] = timed.map(({ d, b }) => {
    const p = part(d)
    return { date: d, anytime: false, day: d === o.today ? "Hoy" : `${cap(p.wd)} ${p.d}`, time: b.startMin === null ? "Todo el día" : hourText(b.startMin), title: b.title, price: o.price(b.id), imageUrl: img(b.id), category: cat(b.id) }
  })
  // lo que se repite sin hora (cines…) también es un plan: va al final como «Cuando quieras»
  const seen = new Set<string>()
  for (const b of week.flatMap((d) => d.blocks)) if (any.has(b.id) && !seen.has(b.id)) { seen.add(b.id); rows.push({ date: "", anytime: true, day: "Cuando quieras", time: "Todos los días", title: b.title, price: o.price(b.id), imageUrl: img(b.id), category: cat(b.id) }) }
  const n = rows.length
  const tier: PosterTier = n <= 4 ? "comfortable" : n <= POSTER_MAX_ROWS ? "compact" : "dense"
  const shown = rows.slice(0, POSTER_MAX_ROWS)
  const first = week[0]?.date ?? o.today, last = week[week.length - 1]?.date ?? first
  const a = part(first), z = part(last)
  const rangeLabel = a.m === z.m ? `${a.d} al ${z.d} de ${MONTH[z.m]}` : `${a.d} de ${MONTH[a.m]} al ${z.d} de ${MONTH[z.m]}`
  return { tier, rows: shown, more: n - shown.length, rangeLabel }
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
