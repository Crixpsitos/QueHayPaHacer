import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { occurrencesBetween, type Occurrence } from "./value-objects/occurrences"
import type { DayRange } from "./when"

export interface AgendaEntry { id: string; /** "HH:MM" de Bogotá o null (sin hora fija). */ hhmm: string | null }
export interface AgendaDay { date: string; entries: AgendaEntry[] }

const hhmmOf = (o: Occurrence): string | null => (o.startsAt ? new Date(o.startsAt.getTime() - 5 * 3_600_000).toISOString().slice(11, 16) : null)
const stillOpen = (o: Occurrence, now: Date) => {
  const endOfDay = Date.parse(`${o.date}T00:00:00Z`) + 29 * 3_600_000 - 1
  return (o.endsAt ?? o.startsAt ?? new Date(endOfDay)).getTime() >= now.getTime()
}

/**
 * Agenda por día para un rango: qué sale cada día y a qué hora. Lo que ya terminó no cuenta. «Todo el día» (sin hora fija)
 * solo se muestra cuando el rango es un solo día; en varios días repetiría lo mismo cada jornada.
 */
export function buildAgenda(items: readonly { id: string; schedule: ActivitySchedule }[], range: DayRange, now: Date): AgendaDay[] {
  const single = range.from === range.to
  const byDate = new Map<string, AgendaEntry[]>()
  for (const it of items) {
    for (const o of occurrencesBetween(it.schedule, range.from, range.to)) {
      if (!stillOpen(o, now)) continue
      const hhmm = hhmmOf(o)
      if (hhmm === null && !single) continue
      const list = byDate.get(o.date) ?? byDate.set(o.date, []).get(o.date)!
      if (!list.some((e) => e.id === it.id && e.hhmm === hhmm)) list.push({ id: it.id, hhmm })
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({ date, entries: entries.sort((x, y) => (x.hhmm ?? "99:99").localeCompare(y.hhmm ?? "99:99") || x.id.localeCompare(y.id)) }))
}

/**
 * Lo que está disponible en el rango pero SIN hora fija (cines, «siempre abierto»…): en un rango de varios días no entra
 * en cada jornada (repetiría lo mismo), así que va aparte, una sola vez. En un solo día ya sale como «Todo el día».
 */
export function anytimeIds(items: readonly { id: string; schedule: ActivitySchedule }[], range: DayRange, now: Date): string[] {
  if (range.from === range.to) return []
  return items.filter((it) => occurrencesBetween(it.schedule, range.from, range.to).some((o) => stillOpen(o, now) && hhmmOf(o) === null)).map((it) => it.id)
}
