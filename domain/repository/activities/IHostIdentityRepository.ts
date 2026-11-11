import type { HostIdentityRecord } from "@/domain/entities/activities/HostIdentity"

export type HostIdentityAccess = { by: string; at: Date; purpose: "complaint" | "authority_export"; activityId?: string }

export interface IHostIdentityRepository {
  get(uid: string): Promise<HostIdentityRecord | null>
  upsert(record: HostIdentityRecord): Promise<void>
  /** Bitácora de quién consultó o exportó los datos de un oferente (subcolección `accessLog`). */
  appendAccess(hostUid: string, entry: HostIdentityAccess): Promise<void>
}
