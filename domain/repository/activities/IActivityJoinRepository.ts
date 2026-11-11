import type { JoinDecision } from "@/domain/entities/activities/activityJoin"

export type JoinOutcome = "joined" | "already" | "full" | "closed"

export interface JoinRow {
  uid: string
  name: string
  key: string
  createdAt: Date
}

/** Inscripciones: una por persona y salida. Cada operación cuenta y escribe en UNA transacción. */
export interface IActivityJoinRepository {
  /** `decide(taken)` es la regla de cupo (dominio); se evalúa dentro de la transacción. */
  join(i: { activityId: string; key: string; uid: string; name: string }, decide: (taken: number) => JoinDecision): Promise<JoinOutcome>
  /** Cancela la propia inscripción y libera el cupo. `changed` = false si no estaba inscrita. */
  cancel(i: { activityId: string; key: string; uid: string }): Promise<{ changed: boolean }>
  /** Inscritos vigentes por salida. */
  counts(activityId: string, keys: string[]): Promise<Record<string, number>>
  /** De estas salidas, en cuáles está inscrita la persona. */
  mine(activityId: string, uid: string, keys: string[]): Promise<string[]>
  /** Lista del creador: inscritos vigentes de la actividad (todas las salidas). */
  list(activityId: string, limit: number): Promise<JoinRow[]>
}
