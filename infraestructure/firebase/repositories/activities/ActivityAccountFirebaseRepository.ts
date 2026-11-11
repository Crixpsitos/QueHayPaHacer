import { FieldValue, type Firestore } from "firebase-admin/firestore"
import type { AccountHistory } from "@/domain/entities/activities/trust"
import type { IActivityAccountRepository } from "@/domain/repository/activities/IActivityAccountRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

/** `activityAccounts/{uid}`: historial para la confianza. Solo Admin SDK. Sin documento = cuenta nueva. */
export class ActivityAccountFirebaseRepository extends FirebaseBaseRepository implements IActivityAccountRepository {
  protected readonly collectionName = "activityAccounts"

  constructor(db: Firestore) {
    super(db)
  }

  async get(uid: string): Promise<AccountHistory> {
    const d = await this.collection.doc(uid).get()
    const x = d.data() ?? {}
    const until = x.suspendedUntil as { toMillis?: () => number } | number | null | undefined
    return {
      approvedCount: typeof x.approvedCount === "number" ? x.approvedCount : 0,
      activeSanctions: typeof x.activeSanctions === "number" ? x.activeSanctions : 0,
      suspendedUntil: typeof until === "number" ? until : (until?.toMillis?.() ?? null),
    }
  }

  async recordApproved(uid: string): Promise<void> {
    await this.collection.doc(uid).set({ approvedCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  }
}
