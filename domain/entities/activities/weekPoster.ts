import type { WeekDay } from "./weekPlan"

/**
 * Qué lleva el afiche «Mi semana» y cómo se reparte, según cuántos planes haya:
 * hasta 5 → cómodo (una fila cada uno); 6 a 8 → compacto; más de 8 → denso (6 filas y «+N planes más en el enlace»).
 * Lo que está disponible todos los días sin hora (cines, «siempre abierto»…) no entra en las filas: va en una sola línea al final.
 */
export type PosterTier = "comfortable" | "compact" | "dense"
export interface PosterRow { date: string; /** primera fila de su día: lleva la etiqueta del día */ showDay: boolean; day: string; dayNum: string; time: string; title: string; price: string }
export interface WeekPosterPlan { tier: PosterTier; rows: PosterRow[]; more: number; anytime: string[]; anytimeMore: number; rangeLabel: string }

/** Con 6 a 8 planes caben todos en filas compactas; con más, solo 6 (si no, el texto se vuelve ilegible) y «+N». */
export const POSTER_MAX_ROWS = 8
export const POSTER_DENSE_ROWS = 6
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

export function planWeekPoster(week: readonly WeekDay[], o: { today: string; price: (id: string) => string }): WeekPosterPlan {
  const any = new Set(anytimeIdsOf(week))
  const timed = week.flatMap((d) => d.blocks.filter((b) => !any.has(b.id)).map((b) => ({ d: d.date, b })))
    .sort((x, y) => x.d.localeCompare(y.d) || (x.b.startMin ?? 1e9) - (y.b.startMin ?? 1e9) || x.b.id.localeCompare(y.b.id))
  const n = timed.length
  const tier: PosterTier = n <= 5 ? "comfortable" : n <= 8 ? "compact" : "dense"
  const shown = timed.slice(0, tier === "dense" ? POSTER_DENSE_ROWS : POSTER_MAX_ROWS)
  const rows = shown.map(({ d, b }, i): PosterRow => {
    const p = part(d)
    return { date: d, showDay: i === 0 || shown[i - 1].d !== d, day: d === o.today ? "Hoy" : cap(p.wd), dayNum: `${p.wd} ${p.d}`, time: b.startMin === null ? "Todo el día" : hourText(b.startMin), title: b.title, price: o.price(b.id) }
  })
  const titles = [...new Set(week.flatMap((d) => d.blocks.filter((b) => any.has(b.id)).map((b) => b.title)))]
  const first = week.find((d) => d.date)?.date ?? o.today, last = week[week.length - 1]?.date ?? first
  const a = part(first), z = part(last)
  const rangeLabel = a.m === z.m ? `${a.d} al ${z.d} de ${MONTH[z.m]}` : `${a.d} de ${MONTH[a.m]} al ${z.d} de ${MONTH[z.m]}`
  return { tier, rows, more: Math.max(0, n - rows.length), anytime: titles.slice(0, 3), anytimeMore: Math.max(0, titles.length - 3), rangeLabel }
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
