/**
 * Cupos de un evento con inscripción por enlace externo. Quien pulsa «Me interesa» reserva un hueco por 24 horas; si no lo
 * confirma quien organiza (ni entra ni paga) deja de contar SIN borrarse: el vencimiento se calcula al leer y al escribir, así no
 * hace falta ningún programador de tareas y nunca se escribe durante un render. Si el cupo está lleno, la persona entra a una
 * lista de espera ordenada que se promueve sola a medida que se liberan huecos.
 */
export const INTEREST_TTL_MS = 24 * 3_600_000

export interface SeatRow {
  status: "pending" | "accepted" | "canceled"
  registeredAt: Date | number | string
  checkedInAt?: unknown
  paidAmount?: number | null
  /** Invitado sin cuenta agregado a mano por quien organiza: ya está confirmado. */
  guest?: boolean
  /** En la fila de espera: no ocupa cupo hasta que se promueve. */
  waitlist?: boolean
}
export type SeatKind = "confirmed" | "interested" | "expired" | "waitlist" | "canceled"

const ms = (d: SeatRow["registeredAt"]) => (d instanceof Date ? d.getTime() : typeof d === "number" ? d : Date.parse(d))

export function seatKind(r: SeatRow, now: number): SeatKind {
  if (r.status === "canceled") return "canceled"
  if (r.status === "accepted" || r.checkedInAt || r.guest || (typeof r.paidAmount === "number" && r.paidAmount > 0)) return "confirmed"
  if (r.waitlist) return "waitlist"
  return now - ms(r.registeredAt) > INTEREST_TTL_MS ? "expired" : "interested"
}

export interface Occupancy { confirmed: number; interested: number; expired: number; waitlist: number; /** Lo que ocupa cupo: confirmados + interesados vigentes. */ taken: number }

export function occupancy(rows: SeatRow[], now: number): Occupancy {
  const o = { confirmed: 0, interested: 0, expired: 0, waitlist: 0, taken: 0 }
  for (const r of rows) {
    const k = seatKind(r, now)
    if (k === "confirmed" || k === "interested" || k === "expired" || k === "waitlist") o[k]++
  }
  o.taken = o.confirmed + o.interested
  return o
}

/** Huecos libres. null = sin límite (el evento no define capacidad). */
export function seatsLeft(capacity: number | undefined, rows: SeatRow[], now: number): number | null {
  if (!capacity || capacity <= 0) return null
  return Math.max(0, capacity - occupancy(rows, now).taken)
}

/** Qué le pasa a quien pulsa «Me interesa» ahora: ocupa un hueco o se forma en la lista de espera (también si ya hay fila, para no colarse). */
export function interestOutcome(capacity: number | undefined, rows: SeatRow[], now: number): "interested" | "waitlist" {
  const left = seatsLeft(capacity, rows, now)
  if (left === null) return "interested"
  return left > 0 && occupancy(rows, now).waitlist === 0 ? "interested" : "waitlist"
}

/** Ids de la lista de espera que deben ocupar los huecos libres, de la persona que llegó primero a la última. */
export function toPromote<T extends SeatRow & { id: string }>(capacity: number | undefined, rows: T[], now: number): string[] {
  const left = seatsLeft(capacity, rows, now)
  const queue = rows.filter((r) => seatKind(r, now) === "waitlist").sort((a, b) => ms(a.registeredAt) - ms(b.registeredAt))
  return (left === null ? queue : queue.slice(0, left)).map((r) => r.id)
}

/** Lugar en la lista de espera (1 = el primero). null si no está en ella. */
export function waitlistPosition<T extends SeatRow & { id: string }>(rows: T[], id: string, now: number = Date.now()): number | null {
  const queue = rows.filter((r) => seatKind(r, now) === "waitlist").sort((a, b) => ms(a.registeredAt) - ms(b.registeredAt))
  const i = queue.findIndex((r) => r.id === id)
  return i < 0 ? null : i + 1
}
