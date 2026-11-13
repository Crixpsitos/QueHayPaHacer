import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { bogotaDateIso, occurrencesBetween } from "./value-objects/occurrences"
import { JOIN_HORIZON_DAYS } from "./activityJoin"
import type { CtaKind } from "./value-objects/Cta"

/**
 * «Solicitud de reserva»: quien tiene cuenta y toca el botón de reservar/preguntar de una actividad (WhatsApp, teléfono o enlace de
 * reserva) deja constancia: quién es, para qué salida y cuándo. Quien organiza la ve en su panel de reservas y se pone en contacto
 * por el medio que eligió. No toma cupo ni cobra: solo avisa. Sin cuenta, el botón funciona igual que antes.
 * Vence a las 24 h SIN borrarse: el estado se calcula al leer (igual que los interesados de los eventos externos).
 */
export const REQUEST_TTL_MS = 24 * 3_600_000
/** Botones de acción que son una reserva o una consulta; los de red social o sitio web no. */
export const REQUEST_CTA_KINDS: readonly CtaKind[] = ["whatsapp", "phone", "reserveLink", "buyLink"]
export const isRequestCta = (k: unknown): boolean => (REQUEST_CTA_KINDS as readonly unknown[]).includes(k)
export const REQUESTS_SHOWN = 50

export interface DepartureOption { key: string; date: string | null }
const SHOWN = 4

/**
 * Las próximas salidas que se ofrecen (máx. 4): `open` si la actividad no tiene fecha fija ("todos los días", "con cita"), o los
 * próximos días en que sale (la de hoy solo si no terminó). Las usan «Unirme» y las solicitudes de reserva.
 */
export function upcomingDepartures(schedule: ActivitySchedule, now: Date): DepartureOption[] {
  const today = bogotaDateIso(now)
  const dated = schedule.rules.some((r) => r.kind !== "always" && r.kind !== "byAppointment")
  if (!dated) return [{ key: "open", date: null }]
  const to = bogotaDateIso(new Date(now.getTime() + JOIN_HORIZON_DAYS * 86_400_000))
  const seen = new Set<string>()
  const rows: DepartureOption[] = []
  for (const o of occurrencesBetween(schedule, today, to)) {
    if (seen.has(o.date)) continue
    if (o.date === today && (o.endsAt ?? o.startsAt) && (o.endsAt ?? o.startsAt)!.getTime() < now.getTime()) continue
    seen.add(o.date)
    rows.push({ key: o.date, date: o.date })
    if (rows.length >= SHOWN) break
  }
  return rows
}

export type RequestState = "active" | "expired"
export const requestState = (createdAtMs: number, now: number): RequestState => (now - createdAtMs > REQUEST_TTL_MS ? "expired" : "active")

/** Una solicitud por persona y salida: `{salida}_{uid}`. */
export const requestDocId = (key: string, uid: string) => `${key}_${uid}`
