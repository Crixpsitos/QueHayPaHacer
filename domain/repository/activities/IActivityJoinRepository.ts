import type { JoinDecision, JoinStatusValue } from "@/domain/entities/activities/activityJoin"
import type { ExtraPick } from "@/domain/entities/activities/reservationExtras"

export type JoinOutcome = "joined" | "already" | "full" | "closed"
export type SetStatusOutcome = "ok" | "missing" | "full"

export interface JoinRow {
  uid: string
  name: string
  key: string
  createdAt: Date
  status: JoinStatusValue
  /** Solo si la persona lo autorizó al reservar una actividad de pago. */
  phone: string | null
  /** Servicios aparte que eligió (almuerzo, agua…). */
  extras: ExtraPick[]
  /** Anotada a mano por quien organiza (persona sin cuenta). */
  manual: boolean
}

/** Inscripciones: una por persona y salida. Cada operación cuenta y escribe en UNA transacción. */
export interface IActivityJoinRepository {
  /** `decide(taken)` es la regla de cupo (dominio); se evalúa dentro de la transacción. */
  join(
    i: { activityId: string; key: string; uid: string; name: string; status: JoinStatusValue; phone: string | null; consentVersion: string | null; extras?: ExtraPick[]; manual?: boolean },
    decide: (taken: number) => JoinDecision,
  ): Promise<JoinOutcome>
  /** Cancela la propia inscripción y libera el cupo (si lo ocupaba). `changed` = false si no estaba inscrita. */
  cancel(i: { activityId: string; key: string; uid: string }): Promise<{ changed: boolean }>
  /** Cambia el estado de una inscripción (organizador). `noShow` libera el cupo; volver a pending/confirmed lo vuelve a pedir. */
  setStatus(i: { activityId: string; key: string; uid: string; to: JoinStatusValue }, decide: (taken: number) => JoinDecision): Promise<SetStatusOutcome>
  /** Cambia los servicios aparte de una reserva (organizador). false si la reserva no existe. */
  setExtras(i: { activityId: string; key: string; uid: string; extras: ExtraPick[] }): Promise<boolean>
  /** Cierra o reabre solo `join.closed` (sin reescribir la actividad). false si la actividad no recibe inscripciones. */
  setClosed(activityId: string, closed: boolean): Promise<boolean>
  /** Inscritos que ocupan cupo por salida. */
  counts(activityId: string, keys: string[]): Promise<Record<string, number>>
  /** De estas salidas, en cuáles está inscrita la persona y con qué estado. */
  mine(activityId: string, uid: string, keys: string[]): Promise<Record<string, JoinStatusValue>>
  /** `counts` + `mine` en un solo viaje (la ficha pública los pide juntos). Sin `uid`, `mine` queda vacío. */
  availability(activityId: string, uid: string | null, keys: string[]): Promise<{ counts: Record<string, number>; mine: Record<string, JoinStatusValue> }>
  /** Reservas de una persona (para borrar su cuenta). */
  listByUser(uid: string, limit: number): Promise<{ activityId: string; key: string; status: JoinStatusValue }[]>
  /** Lista del creador: inscripciones de la actividad (todas las salidas, todos los estados). */
  list(activityId: string, limit: number): Promise<JoinRow[]>
}
