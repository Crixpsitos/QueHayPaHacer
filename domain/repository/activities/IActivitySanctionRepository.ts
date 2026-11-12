import type { Sanction, SanctionRole } from "@/domain/entities/activities/moderation/reviewModeration"

/** `activitySanctions`: solo el servidor (admin) escribe. */
export interface IActivitySanctionRepository {
  add(s: Sanction): Promise<void>
  listByUid(uid: string): Promise<Sanction[]>
  /** Cuántas sanciones de ese rol recibió la cuenta desde `since` (reincidencia a 12 meses). */
  countSince(uid: string, role: SanctionRole, since: Date): Promise<number>
}
