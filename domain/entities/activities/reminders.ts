import type { NewNotification } from "@/domain/entities/notification/Notification"

/** Una salida de mañana con quién reservó y quién guardó. */
export interface ReminderActivity {
  id: string
  slug: string
  title: string
  /** Día de la salida (YYYY-MM-DD). */
  dateKey: string
  timeLabel: string | null
  /** Cupos libres de esa salida; null = sin tope. */
  spotsLeft: number | null
  reserved: string[]
  savers: string[]
}

export interface PlannedNotice { uid: string; id: string; notification: NewNotification }

/** Id fijo por persona y día: un segundo barrido el mismo día no repite el aviso (y es el tope de 1 aviso diario). */
export const reminderId = (day: string, uid: string) => `act-daily-${day}-${uid}`

const at = (a: ReminderActivity) => (a.timeLabel ? ` · ${a.timeLabel}` : "")

/**
 * Avisos de la campanita para las salidas de MAÑANA. Máximo uno por persona al día:
 * 1) quien reservó (recordatorio de su reserva), 2) quien guardó (recordatorio), 3) último cupo a quien guardó y no reservó.
 * Si le tocan varias, se junta en un solo aviso con el primero y «y N más».
 */
export function planReminders(activities: readonly ReminderActivity[], day: string): PlannedNotice[] {
  type Item = { a: ReminderActivity; kind: "reserved" | "saved" | "lastSpot" }
  const rank = { reserved: 0, saved: 1, lastSpot: 2 } as const
  const perUser = new Map<string, Item[]>()
  for (const a of activities) {
    const reserved = new Set(a.reserved)
    for (const uid of a.reserved) (perUser.get(uid) ?? perUser.set(uid, []).get(uid)!).push({ a, kind: "reserved" })
    for (const uid of new Set(a.savers)) {
      if (reserved.has(uid)) continue
      ;(perUser.get(uid) ?? perUser.set(uid, []).get(uid)!).push({ a, kind: a.spotsLeft === 1 ? "lastSpot" : "saved" })
    }
  }
  return [...perUser.entries()].map(([uid, items]) => {
    items.sort((x, y) => rank[x.kind] - rank[y.kind] || x.a.title.localeCompare(y.a.title, "es"))
    const first = items[0]
    const more = items.length - 1
    const tail = more > 0 ? ` y ${more} más` : ""
    const href = `/actividades/${first.a.slug}`
    if (first.kind === "lastSpot") return { uid, id: reminderId(day, uid), notification: { type: "activity_last_spot" as const, title: `Queda el último cupo: "${first.a.title}"${tail}`, body: `Sale mañana${at(first.a)}. Resérvalo antes de que se llene.`, href } }
    if (first.kind === "reserved") return { uid, id: reminderId(day, uid), notification: { type: "activity_reminder" as const, title: `Mañana sale "${first.a.title}"${tail}`, body: `Tu reserva es para mañana${at(first.a)}.`, href } }
    return { uid, id: reminderId(day, uid), notification: { type: "activity_reminder" as const, title: `Mañana sale "${first.a.title}"${tail}`, body: `La guardaste. Sale mañana${at(first.a)}.`, href } }
  })
}
