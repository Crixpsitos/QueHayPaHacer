import type { AccountHistory } from "@/domain/entities/activities/trust"

/** Historial de una cuenta para decidir confianza (`activityAccounts/{uid}`, solo Admin SDK). */
export interface IActivityAccountRepository {
  /** Sin documento = cuenta nueva (0, 0, null). */
  get(uid: string): Promise<AccountHistory>
  /** +1 en `approvedCount` (aprobada por QHPA o autoaprobada). */
  recordApproved(uid: string): Promise<void>
}
