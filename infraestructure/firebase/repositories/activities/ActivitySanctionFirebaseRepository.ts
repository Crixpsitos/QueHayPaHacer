import type { Firestore } from "firebase-admin/firestore"
import type { Sanction, SanctionRole } from "@/domain/entities/activities/moderation/reviewModeration"
import type { IActivitySanctionRepository } from "@/domain/repository/activities/IActivitySanctionRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))

/** `activitySanctions`: advertencias, restricciones y suspensiones. Solo el servidor escribe (las reglas niegan todo al cliente). */
export class ActivitySanctionFirebaseRepository extends FirebaseBaseRepository implements IActivitySanctionRepository {
  protected readonly collectionName = "activitySanctions"
  constructor(db: Firestore) { super(db) }

  async add(s: Sanction): Promise<void> { await this.collection.add({ ...s }) }

  async listByUid(uid: string): Promise<Sanction[]> {
    const q = await this.collection.where("uid", "==", uid).limit(200).get()
    return q.docs.map((d) => { const x = d.data(); return { ...x, createdAt: toDate(x.createdAt), expiresAt: toDate(x.expiresAt) } as Sanction })
  }

  async countSince(uid: string, role: SanctionRole, since: Date): Promise<number> {
    return (await this.listByUid(uid)).filter((s) => s.role === role && s.createdAt >= since).length
  }
}
