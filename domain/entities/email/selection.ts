export const FOR_YOU_MAX = 5
export interface PoolItem { id: string; title: string; path: string; category: string; /** «Hoy · 5:30 p. m.» */ when: string }

/**
 * «Para ti»: de lo que hay vigente, primero lo de las categorías que la persona más guarda o marca «Yo fui» (y sus gustos),
 * sin repetir lo que ya guardó o hizo. Sin señal alguna: lo de hoy, en el orden en que llega.
 */
export function selectForYou(pool: PoolItem[], s: { categories: string[]; excludeIds: string[] }): PoolItem[] {
  const skip = new Set(s.excludeIds)
  const open = pool.filter((i) => !skip.has(i.id))
  if (!s.categories.length) return open.slice(0, FOR_YOU_MAX)
  const weight = new Map<string, number>()
  for (const c of s.categories) weight.set(c, (weight.get(c) ?? 0) + 1)
  return [...open.entries()].sort(([ai, a], [bi, b]) => (weight.get(b.category) ?? 0) - (weight.get(a.category) ?? 0) || ai - bi).map(([, i]) => i).slice(0, FOR_YOU_MAX)
}

import { occurrencesBetween } from "@/domain/entities/activities/value-objects/occurrences"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"

const OFFSET = 5 * 3_600_000
const day = (n: Date) => new Date(n.getTime() - OFFSET).toISOString().slice(0, 10)
const hour = (m: number) => { const h = Math.floor(m / 60); return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }
const WD = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

/** Lo vigente de hoy y los 2 días siguientes que aún no terminó: la primera salida de cada actividad, con su día y hora. */
export function buildPool(acts: { id: string; title: string; slug: string; category: string; schedule: ActivitySchedule }[], now: Date): PoolItem[] {
  const from = day(now), to = day(new Date(now.getTime() + 2 * 86_400_000))
  const out: PoolItem[] = []
  for (const a of acts) {
    const o = occurrencesBetween(a.schedule, from, to).find((x) => (x.endsAt ?? (x.startsAt ? new Date(x.startsAt.getTime() + 3_600_000) : new Date(Date.parse(`${x.date}T00:00:00Z`) + OFFSET + 86_399_000))).getTime() >= now.getTime())
    if (!o) continue
    const when = o.date === from ? "Hoy" : o.date === day(new Date(now.getTime() + 86_400_000)) ? "Mañana" : WD[new Date(`${o.date}T12:00:00Z`).getUTCDay()]
    const t = o.startsAt ? new Date(o.startsAt.getTime() - OFFSET) : null
    out.push({ id: a.id, title: a.title, path: `/actividades/${a.slug}`, category: a.category, when: t ? `${when} · ${hour(t.getUTCHours() * 60 + t.getUTCMinutes())}` : when })
  }
  return out
}
