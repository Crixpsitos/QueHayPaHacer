import type { Digest } from "@/domain/entities/activities/weeklyDigest"
import type { ValueItem } from "./templates"

export const WEEKLY_TOTAL = 12
export const WEEKLY_PER_DAY = 4
const MIN_PER_KIND = 2
const STAR_POOL = 5

/** Hash estable de texto → número (el mismo texto siempre da lo mismo; textos distintos, órdenes distintos). */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/**
 * Los planes del correo semanal. Variado en cada envío (y entre personas): el orden de preferencia sale de `seed`
 * (persona + fecha), no de la hora ni del azar de cada carga. Reglas: destacado = uno de los {@link STAR_POOL} mejor puntuados
 * CON foto (elegido por `seed`); al menos {@link MIN_PER_KIND} actividades y {@link MIN_PER_KIND} eventos si existen;
 * máx. {@link WEEKLY_PER_DAY} por día y {@link WEEKLY_TOTAL} en total; dentro del correo, por día y hora.
 */
export function selectWeeklyItems(digest: Digest, seed: string): ValueItem[] {
  const flat = digest.days.flatMap((d) => d.items.map((i) => ({ i, day: d.label, date: d.date })))
  if (!flat.length) return []
  const rank = (x: (typeof flat)[number]) => hash(`${seed}|${x.i.url}|${x.date}`)
  const pool = flat.filter((x) => x.i.imageUrl).sort((a, b) => (b.i.score ?? 0) - (a.i.score ?? 0) || rank(a) - rank(b)).slice(0, STAR_POOL)
  const star = pool.length ? pool[hash(seed) % pool.length] : null
  const picked = new Set<(typeof flat)[number]>(star ? [star] : [])
  const perDay = new Map<string, number>(star ? [[star.date, 1]] : [])
  const take = (x: (typeof flat)[number]) => {
    if (picked.has(x) || picked.size >= WEEKLY_TOTAL || (perDay.get(x.date) ?? 0) >= WEEKLY_PER_DAY) return
    picked.add(x); perDay.set(x.date, (perDay.get(x.date) ?? 0) + 1)
  }
  const shuffled = [...flat].sort((a, b) => rank(a) - rank(b))
  for (const kind of ["activity", "event"] as const) {
    let have = [...picked].filter((x) => x.i.kind === kind).length
    for (const x of shuffled) { if (have >= MIN_PER_KIND) break; if (x.i.kind === kind && !picked.has(x)) { const before = picked.size; take(x); if (picked.size > before) have++ } }
  }
  for (const x of shuffled) take(x)
  return [...picked]
    .sort((a, b) => a.date.localeCompare(b.date) || a.i.sortMin - b.i.sortMin)
    .map((x): ValueItem => ({ title: x.i.title, when: `${x.day} · ${x.i.timeLabel}`, path: x.i.url, day: x.day, time: x.i.timeLabel, place: x.i.place, price: x.i.detail, imageUrl: x.i.imageUrl, star: x === star }))
}
