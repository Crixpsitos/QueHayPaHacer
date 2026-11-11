import type { JoinDecision, JoinStatusValue } from "@/domain/entities/activities/activityJoin"

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
}

/** Inscripciones: una por persona y salida. Cada operación cuenta y escribe en UNA transacción. */
export interface IActivityJoinRepository {
  /** `decide(taken)` es la regla de cupo (dominio); se evalúa dentro de la transacción. */
  join(
    i: { activityId: string; key: string; uid: string; name: string; status: JoinStatusValue; phone: string | null; consentVersion: string | null },
    decide: (taken: number) => JoinDecision,
  ): Promise<JoinOutcome>
  /** Cancela la propia inscripción y libera el cupo (si lo ocupaba). `changed` = false si no estaba inscrita. */
  cancel(i: { activityId: string; key: string; uid: string }): Promise<{ changed: boolean }>
  /** Cambia el estado de una inscripción (organizador). `noShow` libera el cupo; volver a pending/confirmed lo vuelve a pedir. */
  setStatus(i: { activityId: string; key: string; uid: string; to: JoinStatusValue }, decide: (taken: number) => JoinDecision): Promise<SetStatusOutcome>
  /** Cierra o reabre solo `join.closed` (sin reescribir la actividad). false si la actividad no recibe inscripciones. */
  setClosed(activityId: string, closed: boolean): Promise<boolean>
  /** Inscritos que ocupan cupo por salida. */
  counts(activityId: string, keys: string[]): Promise<Record<string, number>>
  /** De estas salidas, en cuáles está inscrita la persona y con qué estado. */
  mine(activityId: string, uid: string, keys: string[]): Promise<Record<string, JoinStatusValue>>
  /** Reservas de una persona (para borrar su cuenta). */
  listByUser(uid: string, limit: number): Promise<{ activityId: string; key: string }[]>
  /** Lista del creador: inscripciones de la actividad (todas las salidas, todos los estados). */
  list(activityId: string, limit: number): Promise<JoinRow[]>
}
